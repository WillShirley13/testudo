use crate::custom_accounts::centurion::Centurion;
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidAuthority,
    InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Deposit native SOL into a testudo account (Note: this is simply the Centurion PDA).

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
    #[account(
        mut,
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount,
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_deposit_sol(ctx: Context<DepositSol>, amount_in_lamports: u64) -> Result<()> {
    let legate_data: &Account<'_, Legate> = &ctx.accounts.legate;
    let authority_sol_balance: u64 = ctx.accounts.authority.get_lamports();

    // Ensure the authority has enough funds to deposit
    require_gte!(authority_sol_balance, amount_in_lamports, InsufficientFunds);
    msg!("Authority has enough funds to deposit");

    let deposit_fee = amount_in_lamports
        .checked_mul(legate_data.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = amount_in_lamports
        .checked_sub(deposit_fee)
        .ok_or(ArithmeticOverflow)?;

    // Transfer the funds from the authority to the treasury
    let cpi_accounts_for_fee = system_program::Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            cpi_accounts_for_fee,
        ),
        deposit_fee,
    )?;
    msg!("Deposit fee transferred to treasury");

    // Transfer the funds from the authority to the centurion
    let cpi_accounts_for_deposit = system_program::Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to: ctx.accounts.centurion.to_account_info(),
    };
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            cpi_accounts_for_deposit,
        ),
        amount_after_fee,
    )?;
    msg!("Amount after fee transferred to centurion");
    ctx.accounts.centurion.lamport_balance = ctx
        .accounts
        .centurion
        .lamport_balance
        .checked_add(amount_after_fee)
        .ok_or(ArithmeticOverflow)?;

    let current_datetime = Clock::get()?.unix_timestamp;
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    centurion_data.last_accessed = current_datetime as u64;

    msg!("Deposit successful");
    Ok(())
}
