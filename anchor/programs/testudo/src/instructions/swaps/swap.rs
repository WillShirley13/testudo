use crate::custom_accounts::{
    centurion::{Centurion, TestudoData},
    legate::Legate,
};
use crate::errors::ErrorCode::{
    CenturionNotInitialized, InvalidAuthority, InvalidPasswordSignature, InvalidTreasuryAccount,
    LegateNotInitialized,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, TokenAccount},
    token_interface::TokenInterface,
};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,
    #[account(
        mut,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,
    #[account(
        init_if_needed,
        payer = authority,
        token::mint = source_mint,
        token::authority = centurion,
        token::token_program = token_program,
        seeds = [centurion.key().as_ref(), source_mint.key().as_ref()],
        bump
    )]
    pub source_testudo: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        token::mint = destination_mint,
        token::authority = centurion,
        token::token_program = token_program,
        seeds = [centurion.key().as_ref(), destination_mint.key().as_ref()],
        bump
    )]
    pub destination_testudo: Account<'info, TokenAccount>,
    pub source_mint: Account<'info, Mint>,
    pub destination_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
    /// CHECK: Jupiter program
    #[account(address = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"))]
    pub jupiter_program: UncheckedAccount<'info>,
}

pub fn process_swap(
    ctx: Context<Swap>,
    jupiter_data: Vec<u8>,
    testudo_data: [TestudoData; 2],
) -> Result<()> {
    msg!(
        "Starting swap process for authority: {}",
        ctx.accounts.authority.key()
    );

    require_eq!(
        ctx.accounts.centurion.pubkey_to_password,
        ctx.accounts.valid_signer_of_password.key(),
        InvalidPasswordSignature,
    );
    msg!("Password signature validation successful");

    let centurion = &mut ctx.accounts.centurion;
    for data in testudo_data {
        if !centurion
            .testudos
            .iter()
            .any(|t| t.token_mint == data.token_mint)
            && data.testudo_pubkey != pubkey!("So11111111111111111111111111111111111111112")
        {
            centurion.testudos.push(data.clone());
        }
    }

    // Capture balances before swap
    let source_balance_before = ctx.accounts.source_testudo.amount;
    let dest_balance_before = ctx.accounts.destination_testudo.amount;

    msg!(
        "Pre-swap balances - Source: {} ({}), Destination: {} ({})",
        source_balance_before,
        ctx.accounts.source_mint.key(),
        dest_balance_before,
        ctx.accounts.destination_mint.key()
    );

    let remaining_accounts = ctx.remaining_accounts.to_vec();

    let signer_seeds: &[&[&[u8]]] = &[&[
        b"centurion",
        ctx.accounts.authority.key.as_ref(),
        &[ctx.bumps.centurion],
    ]];

    // Build the Jupiter instruction - jupiter_data param contains all data required for that swap
    // remaining_accounts contains all the accounts required for the swap
    let jupiter_instruction = Instruction::new_with_bytes(
        ctx.accounts.jupiter_program.key(),
        &jupiter_data,
        remaining_accounts
            .clone()
            .iter_mut()
            .map(|acc| acc.to_account_metas(None))
            .flatten()
            .collect(),
    );

    msg!(
        "Executing Jupiter swap with {} remaining accounts",
        remaining_accounts.len()
    );

    anchor_lang::solana_program::program::invoke_signed(
        &jupiter_instruction,
        &remaining_accounts,
        signer_seeds,
    )?;

    msg!("Jupiter swap execution completed");

    ctx.accounts.centurion.last_accessed = Clock::get()?.unix_timestamp as u64;

    // Reload accounts to get updated balances
    ctx.accounts.source_testudo.reload()?;
    ctx.accounts.destination_testudo.reload()?;

    // Calculate actual amounts swapped
    let source_amount_swapped = source_balance_before - ctx.accounts.source_testudo.amount;
    let dest_amount_received = ctx.accounts.destination_testudo.amount - dest_balance_before;

    msg!(
        "Swap successful. Sold {} source_mint ({}) for {} destination_mint ({})",
        source_amount_swapped,
        ctx.accounts.source_mint.key(),
        dest_amount_received,
        ctx.accounts.destination_mint.key()
    );

    msg!(
        "Post-swap balances - Source: {} ({}), Destination: {} ({})",
        ctx.accounts.source_testudo.amount,
        ctx.accounts.source_mint.key(),
        ctx.accounts.destination_testudo.amount,
        ctx.accounts.destination_mint.key()
    );

    // Update centurion tracking
    msg!("Updating centurion testudo tracking");
    ctx.accounts
        .centurion
        .testudos
        .iter_mut()
        .for_each(|testudo| {
            if testudo.token_mint == ctx.accounts.source_mint.key() {
                testudo.testudo_token_count = testudo
                    .testudo_token_count
                    .saturating_sub(source_amount_swapped);
            } else if testudo.token_mint == ctx.accounts.destination_mint.key() {
                testudo.testudo_token_count = testudo
                    .testudo_token_count
                    .saturating_add(dest_amount_received);
            }
        });

    msg!("Swap process completed successfully");

    Ok(())
}
