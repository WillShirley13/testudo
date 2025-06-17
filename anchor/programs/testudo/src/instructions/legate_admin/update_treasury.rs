use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{InvalidAuthority, LegateNotInitialized};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateTreasury<'info> {
    // SIGNERS
    #[account(mut)]
    pub authority: Signer<'info>,

    // LEGATE
    #[account(
        mut,
        seeds = [b"legate".as_ref()],
        bump,
        has_one = authority @InvalidAuthority,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
}

pub fn process_update_treasury(ctx: Context<UpdateTreasury>, new_treasury: Pubkey) -> Result<()> {
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
    legate.treasury_acc = new_treasury;
    msg!("Treasury updated to {}", new_treasury);

    // update the last updated timestamp
    legate.last_updated = Clock::get()?.unix_timestamp as u64;

    Ok(())
}
