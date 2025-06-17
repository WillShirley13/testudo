use crate::custom_accounts::centurion::{Centurion, TestudoData};
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    CenturionNotInitialized, InvalidAuthority, LegateNotInitialized, MaxTestudosReached,
    UnsupportedTokenMint,
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

// Initialize a testudo account (An ATA from the Centurion PDA) for a user.

#[derive(Accounts)]
pub struct InitTestudo<'info> {
    // SIGNER
    #[account(mut)]
    pub authority: Signer<'info>,

    // LEGATE
    #[account(
        seeds = [b"legate"],
        bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,

    // CENTURION
    #[account(
        mut,
        seeds = [b"centurion", authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,

    // TOKEN ACCOUNT
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = centurion,
        token::token_program = token_program,
        seeds = [centurion.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub testudo: InterfaceAccount<'info, TokenAccount>,

    // PROGRAMS
    #[account(
        constraint = system_program.key() == anchor_lang::system_program::ID,
    )]
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

    // MINT
    #[account(constraint = legate.testudo_token_whitelist.iter().any(|t| t.token_mint == mint.key()) @UnsupportedTokenMint)]
    pub mint: InterfaceAccount<'info, Mint>,
}

pub fn process_init_testudo(ctx: Context<InitTestudo>) -> Result<()> {
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    let testudo_data: TestudoData = TestudoData {
        token_mint: ctx.accounts.mint.key(),
        testudo_pubkey: ctx.accounts.testudo.key(),
    };

    // Check if the user has reached the max number of testudos
    require_gt!(
        ctx.accounts.legate.max_testudos_per_user,
        centurion_data.testudos.len() as u16,
        MaxTestudosReached
    );

    centurion_data.testudos.push(testudo_data);

    let current_time: i64 = Clock::get()?.unix_timestamp;
    centurion_data.last_accessed = current_time as u64;

    msg!("Centurion data: {:?}", centurion_data.testudos);
    msg!("Testudo created successfully");
    Ok(())
}
