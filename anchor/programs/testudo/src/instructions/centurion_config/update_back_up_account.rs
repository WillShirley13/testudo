use anchor_lang::prelude::*;

// Update the backup account for a Centurion account

#[derive(Accounts)]
pub struct UpdateBackUpAccount<'info> {
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
}

pub fn process_update_back_up_account(
    ctx: Context<UpdateBackUpAccount>,
    backup_account: Pubkey,
) -> Result<()> {
    // (double check) Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
    require_eq!(
        password_pubkey,
        ctx.accounts.valid_signer_of_password.key(),
        InvalidPasswordSignature
    );
    msg!("Password signature is valid");

    let centurion = &mut ctx.accounts.centurion;
    centurion.backup_owner = Some(backup_account);
    Ok(())
}
