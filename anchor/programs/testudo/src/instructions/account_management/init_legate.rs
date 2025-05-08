use crate::custom_accounts::legate::{Legate, TestudoTokenWhitelist};
use crate::errors::ErrorCode::AccountAlreadyInitialized;

// Initialize the admin Legate account.

use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct InitLegate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"legate"],
        bump,
        space = 8 + Legate::INIT_SPACE,
        constraint = !legate.is_initialized @AccountAlreadyInitialized,
    )]
    pub legate: Account<'info, Legate>,
    pub system_program: Program<'info, System>,
}

pub fn process_init_legate(ctx: Context<InitLegate>, treasury_acc: Pubkey) -> Result<()> {
    let legate_data: &mut Account<'_, Legate> = &mut ctx.accounts.legate;

    // double check that the legate account is not already initialized
    require_eq!(legate_data.is_initialized, false, AccountAlreadyInitialized);

    legate_data.authority = ctx.accounts.authority.key();
    legate_data.bump = ctx.bumps.legate;
    legate_data.is_initialized = true;

    // Initially, 'last_updated' set to creation time
    let last_updated: i64 = Clock::get()?.unix_timestamp;
    legate_data.last_updated = last_updated as u64;

    // Initially, users only allowed a single centurion. Maybe in future
    // allowed more. Currenlty can't see need for > 1
    legate_data.max_centurions_per_user = 1;
    // Initially, space allocated for max of the 30 testudos per user/wallet
    legate_data.max_testudos_per_user = 30;
    legate_data.max_whitelisted_mints = 50;
    legate_data.testudo_token_whitelist = vec![];
    legate_data.treasury_acc = treasury_acc;
    legate_data.percent_for_fees = 15; // where 15 = 0.15%

    msg!("Legate account initialized");
    Ok(())
}
