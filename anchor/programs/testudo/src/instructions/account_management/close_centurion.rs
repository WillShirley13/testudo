use crate::custom_accounts::{centurion::Centurion, legate::Legate};
use crate::errors::ErrorCode::{
    CenturionNotEmptyOfSplTokens, CenturionNotInitialized, InvalidAuthority,
    InvalidPasswordSignature, InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;

// TODO: IMPLEMENT FEE ON WITHDRAWING SOL DURING CLOSE OF ACCOUNT

#[derive(Accounts)]
pub struct CloseCenturion<'info> {
    // SIGNERS
    #[account(mut)]
    authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,

    // CENTURION
    #[account(
        mut,
        close = authority,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
        constraint = centurion.testudos.is_empty() @CenturionNotEmptyOfSplTokens
    )]
    centurion: Account<'info, Centurion>,

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
    system_program: Program<'info, System>,
}

pub fn process_close_centurion(ctx: Context<CloseCenturion>) -> Result<()> {
    let centurion_balance = ctx.accounts.centurion.to_account_info().lamports();

    // Calculate fee
    let fee = centurion_balance
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);

    // Subtract the fee from the centurion's balance and add it to the treasury's balance
    ctx.accounts.centurion.sub_lamports(fee)?;
    ctx.accounts.treasury.add_lamports(fee)?;
    msg!("Fee of {} lamports transferred to treasury", fee);

    // Transfer fee to treasury

    msg!(
        "Centurion account with authority {} has been successfully closed",
        ctx.accounts.authority.key
    );
    Ok(())
}
