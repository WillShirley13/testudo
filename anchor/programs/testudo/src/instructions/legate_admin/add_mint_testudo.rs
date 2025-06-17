use crate::custom_accounts::legate::{Legate, TestudoTokenWhitelist};
use crate::errors::ErrorCode::{
    InvalidAuthority, InvalidTreasuryAccount, LegateNotInitialized, MaxWhitelistedMintsReached,
    MintAlreadyInList,
};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
// Add a mint to the testudo token whitelist

#[derive(Accounts)]
#[instruction(mint_to_add: TestudoTokenWhitelist)]
pub struct AddMintToTestudoTokenWhitelist<'info> {
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

    // TREASURY
    #[account(
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,

    // TREASURY ATA
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_ata: InterfaceAccount<'info, TokenAccount>,

    // MINT
    #[account(
        constraint = mint.key() == mint_to_add.token_mint
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    // PROGRAMS
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
        constraint = associated_token_program.key() == anchor_spl::associated_token::ID,
    )]
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        constraint = system_program.key() == anchor_lang::system_program::ID,
    )]
    pub system_program: Program<'info, System>,
}

pub fn process_add_mint_to_testudo_token_whitelist(
    ctx: Context<AddMintToTestudoTokenWhitelist>,
    mint_to_add: TestudoTokenWhitelist,
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
        .any(|t| t.token_mint == mint_to_add.token_mint)
    {
        return Err(MintAlreadyInList.into());
    }
    // Ensure max whitelisted mints is not reached
    require_gt!(
        legate.max_whitelisted_mints,
        legate.testudo_token_whitelist.len() as u16,
        MaxWhitelistedMintsReached
    );

    let mint_key = mint_to_add.token_mint;
    legate.testudo_token_whitelist.push(mint_to_add);
    msg!("Mint ({}) added to testudo token whitelist", mint_key);
    Ok(())
}
