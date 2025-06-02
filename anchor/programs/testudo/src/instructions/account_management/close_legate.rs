use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{InvalidAuthority, LegateNotInitialized};

use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseLegate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority,
        seeds = [b"legate"],
        bump,
        constraint = legate.is_initialized @LegateNotInitialized,
        has_one = authority @InvalidAuthority
    )]
    pub legate: Account<'info, Legate>,
    pub system_program: Program<'info, System>,
}

pub fn process_close_legate(ctx: Context<CloseLegate>) -> Result<()> {
    msg!(
        "Legate account with authority {} has been successfully closed",
        ctx.accounts.authority.key
    );
    Ok(())
}
