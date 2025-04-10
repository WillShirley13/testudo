use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::LegateAlreadyInitialized;
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct InitLegate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"legate".as_ref()],
        bump,
        space = 8 + Legate::INIT_SPACE,
        constraint = !legate.is_initialized @ LegateAlreadyInitialized,
    )]
    pub legate: Account<'info, Legate>,
    pub system_program: Program<'info, System>,
}

pub fn process_init_legate(ctx: Context<InitLegate>) -> Result<()> {
    let legate_data = &mut ctx.accounts.legate;
    let bump = ctx.bumps.legate;
}
