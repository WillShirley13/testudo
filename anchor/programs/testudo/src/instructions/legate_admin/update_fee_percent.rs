use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{InvalidAuthority, LegateNotInitialized};
use anchor_lang::prelude::*;

/// NEED TO REALLOCATE THE CENTURION ACCOUNTS TO THE NEW MAX TESTUDOS

// Update the max testudos for a Centurion account

#[derive(Accounts)]
pub struct UpdateFeePercent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"legate".as_ref()],
        bump,
        has_one = authority @InvalidAuthority,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
}

pub fn process_update_fee_percent(
    ctx: Context<UpdateFeePercent>,
    new_fee_percent: u16,
) -> Result<()> {
    let legate = &mut ctx.accounts.legate;

    // double check that the legate account is initialized
    require_eq!(legate.is_initialized, true, LegateNotInitialized);
    // double check that the authority is the same as the legate authority
    require_eq!(
        legate.authority,
        ctx.accounts.authority.key(),
        InvalidAuthority
    );

    // update the max testudos
    legate.percent_for_fees = new_fee_percent;
    msg!("Fee percent updated to {}", new_fee_percent);

    // update the last updated timestamp
    legate.last_updated = Clock::get()?.unix_timestamp as u64;

    Ok(())
}
