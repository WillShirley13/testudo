use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::{
    CenturionNotInitialized, InsufficientFunds, InvalidAuthority, InvalidBackupAccount,
    InvalidPasswordSignature, NoBackupAccountStored,
};
use anchor_lang::prelude::*;

// Withdraw native SOL from a Centurion account to the backup account
#[derive(Accounts)]
pub struct WithdrawSolToBackup<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,
    #[account(
        mut,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,
    // The backup account to which all SOL will be withdrawn to
    #[account(
        mut,
        // Ensure backup account provided matches account saved in Centurion
        constraint = backup_account.key() == centurion.backup_owner.ok_or(NoBackupAccountStored)? @InvalidBackupAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub backup_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_withdraw_sol_to_backup(ctx: Context<WithdrawSolToBackup>) -> Result<()> {
    // Get references to accounts
    let centurion_info = ctx.accounts.centurion.to_account_info();

    // Validate the pubkey matches the password's pubkey
    require_eq!(
        ctx.accounts.centurion.pubkey_to_password,
        ctx.accounts.valid_signer_of_password.key(),
        InvalidPasswordSignature
    );
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
    let min_rent = rent.minimum_balance(8 + Centurion::INIT_SPACE);

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

    // Debit from centurion account
    ctx.accounts.centurion.sub_lamports(withdraw_amount)?;

    // Credit to authority account
    ctx.accounts.backup_account.add_lamports(withdraw_amount)?;

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
