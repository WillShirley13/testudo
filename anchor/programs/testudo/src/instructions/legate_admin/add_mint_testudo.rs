use crate::custom_accounts::legate::{Legate, TestudoTokenWhitelist};
use crate::errors::ErrorCode::{
    InvalidAuthority, LegateNotInitialized, MaxWhitelistedMintsReached, MintAlreadyInList,
};
use anchor_lang::prelude::*;

// Add a mint to the testudo token whitelist

#[derive(Accounts)]
pub struct AddMintToTestudoTokenWhitelist<'info> {
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

pub fn process_add_mint_to_testudo_token_whitelist(
    ctx: Context<AddMintToTestudoTokenWhitelist>,
    mint: TestudoTokenWhitelist,
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

    // check if mint is already in the list
    if legate
        .testudo_token_whitelist
        .iter()
        .any(|t| t.token_mint == mint.token_mint)
    {
        return Err(MintAlreadyInList.into());
    }
    // Ensure max whitelisted mints is not reached
    require_gt!(
        legate.max_whitelisted_mints,
        legate.testudo_token_whitelist.len() as u16,
        MaxWhitelistedMintsReached
    );

    let mint_key = mint.token_mint;
    legate.testudo_token_whitelist.push(mint);
    msg!("Mint ({}) added to testudo token whitelist", mint_key);
    Ok(())
}
