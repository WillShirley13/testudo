use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    CannotUpdateMaxTestudosToLessThanCurrentNumberOfTestudos, InvalidAuthority,
    LegateNotInitialized,
};
use anchor_lang::prelude::*;

/// NEED TO REALLOCATE THE CENTURION ACCOUNTS TO THE NEW MAX TESTUDOS

#[derive(Accounts)]
pub struct UpdateMaxTestudos<'info> {
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

pub fn process_update_max_testudos(
    ctx: Context<UpdateMaxTestudos>,
    new_max_testudos: u16,
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

    // check that the new max testudos is greater than the current number of testudos
    require_gt!(
        new_max_testudos,
        legate.max_testudos_per_user,
        CannotUpdateMaxTestudosToLessThanCurrentNumberOfTestudos
    );

    // update the max testudos
    legate.max_testudos_per_user = new_max_testudos;
    msg!("Max testudos updated to {}", new_max_testudos);

    // update the last updated timestamp
    legate.last_updated = Clock::get()?.unix_timestamp as u64;

    Ok(())
}
