use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::AccountAlreadyInitialized;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitCenturion<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        space =  8 + Centurion::INIT_SPACE,
        seeds = [b"centurion", authority.key],
        bump,
        constraint = !centurion.is_initialized @AccountAlreadyInitialized
    )]
    pub centurion: Account<'info, Centurion>,
}
