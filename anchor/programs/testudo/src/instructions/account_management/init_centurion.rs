use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::AccountAlreadyInitialized;
use anchor_lang::prelude::*;

// Initialize a centurion account for a user.

#[derive(Accounts)]
pub struct InitCenturion<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space =  8 + Centurion::INIT_SPACE,
        seeds = [b"centurion", authority.key.as_ref()],
        bump,
        constraint = !centurion.is_initialized @AccountAlreadyInitialized
    )]
    pub centurion: Account<'info, Centurion>,
    pub system_program: Program<'info, System>,
}

pub fn process_init_centurion(
    ctx: Context<InitCenturion>,
    password_pubkey: Pubkey,
    backup_owner: Option<Pubkey>,
) -> Result<()> {
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;

    // double check that the centurion account is not already initialized
    require_eq!(
        centurion_data.is_initialized,
        false,
        AccountAlreadyInitialized
    );

    centurion_data.authority = ctx.accounts.authority.key();
    // Backup owner passed as Option<Pubkey>
    centurion_data.backup_owner = backup_owner;
    centurion_data.pubkey_to_password = password_pubkey;
    centurion_data.bump = ctx.bumps.centurion;
    centurion_data.is_initialized = true;
    let current_time: i64 = Clock::get()?.unix_timestamp;
    centurion_data.created_at = current_time as u64;
    centurion_data.last_accessed = current_time as u64;
    centurion_data.testudos = Vec::new();

    msg!("Centurion account initialized");

    Ok(())
}
