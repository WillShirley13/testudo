use crate::custom_accounts::centurion::Centurion;
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidAuthority,
    InvalidBackupAccount, InvalidPasswordSignature, InvalidTreasuryAccount, LegateNotInitialized,
    NoBackupAccountStored,
};
use anchor_lang::prelude::*;

// Withdraw native SOL from a Centurion account to the backup account
#[derive(Accounts)]
pub struct WithdrawSolToBackup<'info> {
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

    // BACKUP ACCOUNT
    #[account(
        mut,
        // Ensure backup account provided matches account saved in Centurion
        constraint = backup_account.key() == centurion.backup_owner.ok_or(NoBackupAccountStored)? @InvalidBackupAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub backup_account: UncheckedAccount<'info>,

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

pub fn process_withdraw_sol_to_backup(ctx: Context<WithdrawSolToBackup>) -> Result<()> {
    // Get references to accounts
    let centurion_info = ctx.accounts.centurion.to_account_info();

    msg!("Password signature is valid");

    // Ensure backup account passed matches account held in Centurion
    require_eq!(
        ctx.accounts.backup_account.key(),
        ctx.accounts
            .centurion
            .backup_owner
            .ok_or(NoBackupAccountStored)?,
        InvalidBackupAccount
    );

    // Get the current lamport balance and ensure it's greater than zero
    let current_lamports = ctx.accounts.centurion.lamport_balance;
    require_gt!(current_lamports, 0, InsufficientFunds);

    // Calculate the amount to transfer (all available lamports)
    // We need to keep some lamports for rent-exemption, so let's calculate that
    let rent = Rent::get()?;
    let pda_size = ctx.accounts.centurion.to_account_info().data_len();
    let min_rent = rent.minimum_balance(pda_size);

    // Calculate the amount that can be withdrawn, ensuring the account stays rent-exempt
    let account_lamports = centurion_info.lamports();

    // Ensure we leave enough SOL for rent exemption plus a small buffer
    let max_withdrawable = account_lamports.saturating_sub(min_rent);

    // Make sure we don't withdraw more than what account can safely provide
    let withdraw_amount = if account_lamports > max_withdrawable {
        max_withdrawable
    } else {
        0
    };

    // Only proceed if there's something to withdraw
    require_gt!(withdraw_amount, 0, InsufficientFunds);

    let withdraw_fee = withdraw_amount
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = withdraw_amount
        .checked_sub(withdraw_fee)
        .ok_or(ArithmeticOverflow)?;

    // Subtract the fee from the centurion's balance and add it to the treasury's balance
    ctx.accounts.centurion.sub_lamports(withdraw_fee)?;
    ctx.accounts.treasury.add_lamports(withdraw_fee)?;

    // Subtract the amount after fee from the centurion's balance and add it to the backup account's balance
    ctx.accounts.centurion.sub_lamports(amount_after_fee)?;
    ctx.accounts.backup_account.add_lamports(amount_after_fee)?;

    // Update the centurion's lamport balance in a separate mutable borrow
    let current_datetime: i64 = Clock::get()?.unix_timestamp;

    // Now we can mutably borrow the centurion account
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    centurion_data.lamport_balance = 0;
    centurion_data.last_accessed = current_datetime as u64;

    msg!(
        "All SOL in centurion ({}) have been transferred to backup account ({})",
        centurion_data.key(),
        ctx.accounts.backup_account.key()
    );

    Ok(())
}
