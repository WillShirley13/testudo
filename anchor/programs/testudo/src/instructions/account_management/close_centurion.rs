use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::{
    CenturionNotEmptyOfSplTokens, CenturionNotInitialized, InvalidAuthority,
    InvalidPasswordSignature,
};
use anchor_lang::prelude::*;

// TODO: IMPLEMENT FEE ON WITHDRAWING SOL DURING CLOSE OF ACCOUNT

#[derive(Accounts)]
pub struct CloseCenturion<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,
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
    system_program: Program<'info, System>,
}

pub fn process_close_centurion(ctx: Context<CloseCenturion>) -> Result<()> {
    msg!(
        "Centurion account with authority {} has been successfully closed",
        ctx.accounts.authority.key
    );
    Ok(())
}
