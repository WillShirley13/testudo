use std::str::FromStr;

use crate::custom_accounts::{
    centurion::{Centurion, TestudoData},
    legate::Legate,
};
use crate::errors::ErrorCode::{
    CenturionNotInitialized, InvalidAuthority, InvalidPasswordSignature, InvalidRemainingAccounts,
    InvalidTokenMint, InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, TokenAccount},
    token_interface::TokenInterface,
};

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct JupiterInstructionWithIdxs {
    pub program_id: Pubkey,
    pub accounts_idxs: Vec<u8>,
    pub data: Vec<u8>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    // SIGNERS
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
    // CENTURION
    pub centurion: Account<'info, Centurion>,

    // SOURCE TOKEN ACCOUNT
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

    // DESTINATION TOKEN ACCOUNT
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

    // MINTS
    pub source_mint: Account<'info, Mint>,
    #[account(
        constraint = legate.testudo_token_whitelist.iter().any(|t| t.token_mint == destination_mint.key()) @InvalidTokenMint
    )]
    pub destination_mint: Account<'info, Mint>,

    // TREASURY
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,

    // LEGATE
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,

    // PROGRAMS
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Jupiter program
    #[account(address = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"))]
    pub jupiter_program: UncheckedAccount<'info>,
}

pub fn process_swap(
    ctx: Context<Swap>,
    jupiter_swap: JupiterInstructionWithIdxs,
    jupiter_setup: Vec<JupiterInstructionWithIdxs>, // This involves SOL -> WSOL version and other accounts setup
    jupiter_cleanup: JupiterInstructionWithIdxs,    // Idxs to clean up accounts etc post swap
    testudo_data: Vec<TestudoData>,
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

    let remaining_accounts = ctx.remaining_accounts.to_vec();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"centurion",
        ctx.accounts.authority.key.as_ref(),
        &[ctx.bumps.centurion],
    ]];

    // SETUP INSTRUCTIONS
    for setup_instruction in jupiter_setup {
        let setup_instruction_accounts: Vec<AccountInfo> = setup_instruction
            .accounts_idxs
            .iter()
            .map(|idx| {
                remaining_accounts
                    .get(*idx as usize)
                    .ok_or(InvalidRemainingAccounts)
                    .unwrap()
                    .clone()
            })
            .collect();

        let jupiter_setup_instruction = Instruction::new_with_bytes(
            setup_instruction.program_id,
            &setup_instruction.data,
            setup_instruction_accounts
                .clone()
                .iter_mut()
                .flat_map(|acc| acc.to_account_metas(Some(acc.is_signer)))
                .collect(),
        );

        anchor_lang::solana_program::program::invoke_signed(
            &jupiter_setup_instruction,
            setup_instruction_accounts.as_slice(),
            signer_seeds,
        )?;
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

    // SWAP INSTRUCTIONS
    let swap_accounts: Vec<AccountInfo> = jupiter_swap
        .accounts_idxs
        .iter()
        .map(|idx| {
            remaining_accounts
                .get(*idx as usize)
                .ok_or(InvalidRemainingAccounts)
                .unwrap()
                .clone()
        })
        .collect();

    // Build the Jupiter instruction - jupiter_data param contains all data required for that swap
    // remaining_accounts contains all the accounts required for the swap
    let swap_instruction = Instruction::new_with_bytes(
        ctx.accounts.jupiter_program.key(),
        &jupiter_swap.data,
        swap_accounts
            .clone()
            .iter_mut()
            .flat_map(|acc| acc.to_account_metas(Some(acc.is_signer)))
            .collect(),
    );

    anchor_lang::solana_program::program::invoke_signed(
        &swap_instruction,
        swap_accounts.as_slice(),
        signer_seeds,
    )?;

    // CLEANUP INSTRUCTIONS
    let cleanup_accounts: Vec<AccountInfo> = jupiter_cleanup
        .accounts_idxs
        .iter()
        .map(|idx| {
            remaining_accounts
                .get(*idx as usize)
                .ok_or(InvalidRemainingAccounts)
                .unwrap()
                .clone()
        })
        .collect();

    let cleanup_instruction = Instruction::new_with_bytes(
        jupiter_cleanup.program_id,
        &jupiter_cleanup.data,
        cleanup_accounts
            .clone()
            .iter_mut()
            .flat_map(|acc| acc.to_account_metas(Some(acc.is_signer)))
            .collect(),
    );

    anchor_lang::solana_program::program::invoke_signed(
        &cleanup_instruction,
        cleanup_accounts.as_slice(),
        signer_seeds,
    )?;

    msg!("Jupiter swap execution completed");

    ctx.accounts.centurion.last_accessed = Clock::get()?.unix_timestamp as u64;

    // Reload accounts to get updated balances
    ctx.accounts.source_testudo.reload()?;
    ctx.accounts.destination_testudo.reload()?;

    msg!(
        "Post-swap balances - Source: {} ({}), Destination: {} ({})",
        ctx.accounts.source_testudo.amount,
        ctx.accounts.source_mint.key(),
        ctx.accounts.destination_testudo.amount,
        ctx.accounts.destination_mint.key()
    );

    msg!("Swap process completed successfully");
    Ok(())
}
