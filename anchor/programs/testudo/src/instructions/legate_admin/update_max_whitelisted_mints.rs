use crate::custom_accounts::legate::Legate;
use crate::custom_accounts::legate::TestudoTokenWhitelist;
use crate::errors::ErrorCode::{
    CannotUpdateMaxWhitelistedMintsToLessThanCurrentNumberOfWhitelistedMints, InvalidAuthority,
    LegateNotInitialized,
};
use anchor_lang::prelude::*;

// Update the max whitelisted mints for a legate account

#[derive(Accounts)]
#[instruction(new_max_whitelisted_mints: u16)]
pub struct UpdateMaxWhitelistedMints<'info> {
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
        realloc = 8 + Legate::INIT_SPACE + ((new_max_whitelisted_mints as usize - legate.max_whitelisted_mints as usize) * TestudoTokenWhitelist::INIT_SPACE),
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub legate: Account<'info, Legate>,

    // PROGRAMS
    pub system_program: Program<'info, System>,
}

pub fn process_update_max_whitelisted_mints(
    ctx: Context<UpdateMaxWhitelistedMints>,
    new_max_whitelisted_mints: u16,
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
        new_max_whitelisted_mints,
        legate.max_whitelisted_mints,
        CannotUpdateMaxWhitelistedMintsToLessThanCurrentNumberOfWhitelistedMints
    );

    // update the max testudos
    legate.max_whitelisted_mints = new_max_whitelisted_mints;
    msg!(
        "Max whitelisted mints updated to {}",
        new_max_whitelisted_mints
    );

    // update the last updated timestamp
    legate.last_updated = Clock::get()?.unix_timestamp as u64;

    Ok(())
}
