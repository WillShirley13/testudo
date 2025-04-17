use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::InsufficientFunds;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InvalidAuthority, InvalidPasswordSignature,
};
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct WithdrawSol<'info> {
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
    pub system_program: Program<'info, System>,
}

pub fn process_withdraw_sol(ctx: Context<WithdrawSol>, amount_in_lamports: u64) -> Result<()> {
    let password_pubkey = ctx.accounts.centurion.pubkey_to_password;

    // (double check)Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
    require_eq!(
        password_pubkey,
        ctx.accounts.valid_signer_of_password.key(),
        InvalidPasswordSignature
    );
    msg!("Password signature is valid");

    // Ensure the centurion has enough funds to withdraw
    require_gte!(
        ctx.accounts.centurion.get_lamports(),
        amount_in_lamports,
        InsufficientFunds
    );
    msg!("Centurion has enough funds to withdraw");

    // Replace CpiContext transfer with direct lamport manipulation
    let withdraw_amount = amount_in_lamports;

    msg!(
        "Centurion balance before withdraw: {}",
        ctx.accounts.centurion.get_lamports()
    );

    // Debit from centurion account
    ctx.accounts.centurion.sub_lamports(withdraw_amount)?;

    // Credit to authority account
    ctx.accounts.authority.add_lamports(withdraw_amount)?;

    msg!(
        "Centurion balance after withdraw: {}",
        ctx.accounts.centurion.get_lamports()
    );
    // Update last accessed timestamp (keep this part)
    let current_datetime = Clock::get()?.unix_timestamp;
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    centurion_data.last_accessed = current_datetime as u64;

    msg!("Withdrawal successful");
    Ok(())
}
