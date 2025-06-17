use crate::custom_accounts::centurion::Centurion;
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidAuthority,
    InvalidPasswordSignature, InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;

// Withdraw native SOL from a Centurion account
#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    // SIGNERS
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,

    // CENTURION
    #[account(
        mut,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,

    // LEGATE
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,

    // TREASURY
    #[account(
        mut,
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,

    // PROGRAMS
    pub system_program: Program<'info, System>,
}

pub fn process_withdraw_sol(ctx: Context<WithdrawSol>, amount_in_lamports: u64) -> Result<()> {
    // Get references to accounts
    let centurion_info = ctx.accounts.centurion.to_account_info();

    // Validate the pubkey matches the password's pubkey
    require_eq!(
        ctx.accounts.centurion.pubkey_to_password,
        ctx.accounts.valid_signer_of_password.key(),
        InvalidPasswordSignature
    );
    msg!("Password signature is valid");

    // Calculate rent exemption
    let rent = Rent::get()?;
    let pda_size = ctx.accounts.centurion.to_account_info().data_len();
    let min_rent = rent.minimum_balance(pda_size);
    // Get current account lamports
    let account_lamports = centurion_info.lamports();

    // Ensure the withdrawal won't go below rent exemption
    let max_withdrawable = account_lamports.saturating_sub(min_rent);
    require_gte!(max_withdrawable, amount_in_lamports, InsufficientFunds);

    // Ensure the centurion has enough funds tracked in its state
    require_gte!(
        ctx.accounts.centurion.lamport_balance,
        amount_in_lamports,
        InsufficientFunds
    );
    msg!("Centurion has enough funds to withdraw");

    let withdraw_fee = amount_in_lamports
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = amount_in_lamports
        .checked_sub(withdraw_fee)
        .ok_or(ArithmeticOverflow)?;

    // Subtract the fee from the centurion's balance and add it to the treasury's balance
    ctx.accounts.centurion.sub_lamports(withdraw_fee)?;
    ctx.accounts.treasury.add_lamports(withdraw_fee)?;

    // Subtract the amount after fee from the centurion's balance and add it to the authority's balance
    ctx.accounts.centurion.sub_lamports(amount_after_fee)?;
    ctx.accounts.authority.add_lamports(amount_after_fee)?;

    // Update the centurion's state in a separate mutable borrow
    let current_datetime = Clock::get()?.unix_timestamp;
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;

    // Update lamport balance
    centurion_data.lamport_balance = centurion_data
        .lamport_balance
        .checked_sub(amount_in_lamports)
        .ok_or(ArithmeticOverflow)?;

    // Update last accessed timestamp
    centurion_data.last_accessed = current_datetime as u64;

    msg!("Withdrawal of {} SOL successful", amount_in_lamports);
    Ok(())
}
