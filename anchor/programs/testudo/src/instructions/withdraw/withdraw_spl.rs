use crate::custom_accounts::centurion::{Centurion, TestudoData};
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidATA, InvalidAuthority,
    InvalidPasswordSignature, InvalidTokenMint,
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked};

// Deposit SPL tokens into a testudo account. authority is the sender and Centurion is the receiver.

#[derive(Accounts)]
pub struct WithdrawSplToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub authority_ata: InterfaceAccount<'info, TokenAccount>,
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
        mut,
        token::mint = mint,
        token::authority = centurion,
        token::token_program = token_program,
        seeds = [centurion.key().as_ref(), mint.key().as_ref()],
        bump,
        // Ensure the ATA is for the correct token mint
        constraint = testudo.mint == mint.key() @InvalidTokenMint,
        // Ensure the ATA is for the correct Centurion (User)
        constraint = testudo.owner == centurion.key() @InvalidATA,
    )]
    // Centurion ATA
    pub testudo: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    // Ensure valid token program is passed
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    // Ensure valid system program is passed
    #[account(
        constraint = system_program.key() == anchor_lang::system_program::ID,
    )]
    pub system_program: Program<'info, System>,
}

pub fn process_withdraw_spl_token(ctx: Context<WithdrawSplToken>, amount: u64) -> Result<()> {
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    let password_pubkey: Pubkey = centurion_data.pubkey_to_password;

    // Ensure the token mint is supported by the Centurion
    require_eq!(
        centurion_data
            .testudos
            .iter()
            .any(|testudo| testudo.token_mint == ctx.accounts.mint.key()),
        true,
        InvalidTokenMint
    );

    // (double check) Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
    require_eq!(
        password_pubkey,
        ctx.accounts.valid_signer_of_password.key(),
        InvalidPasswordSignature
    );
    msg!("Password signature is valid");

    // Get the amount of tokens the depositor has in their ATA
    let testudo_token_holdings: u64 = ctx.accounts.testudo.amount;
    // Get the number of decimals for the token
    let decimals: u8 = ctx.accounts.mint.decimals;
    // Convert the desired deposit amount to a u64 with the correct number of decimals
    let amount_to_deposit_with_decimals: u64 = amount
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(ArithmeticOverflow)?;

    // Ensure the depositor has enough tokens in their ATA to cover the deposit
    require_gte!(
        testudo_token_holdings,
        amount_to_deposit_with_decimals,
        InsufficientFunds
    );
    msg!("Depositor has enough tokens to cover the deposit");

    // Get the testudo account for the token
    let testudo_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.testudo;
    // Get the depositor's ATA for the token
    let authority_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.authority_ata;

    // Set up the CPI accounts for the transfer
    let cpi_accounts = TransferChecked {
        from: testudo_ata.to_account_info(),
        to: authority_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    // Define seeds first
    let authority_key_ref = ctx.accounts.authority.key.as_ref();
    let bump = &[ctx.bumps.centurion];
    let signer_seeds: &[&[&[u8]]] = &[&[b"centurion", authority_key_ref, bump]];
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    // Perform the transfer
    token_interface::transfer_checked(cpi_context, amount_to_deposit_with_decimals, decimals)?;

    // Update the last accessed timestamp
    let current_datetime: i64 = Clock::get()?.unix_timestamp;
    centurion_data.last_accessed = current_datetime as u64;

    // Update the testudo token count
    let testudo_data: &mut TestudoData = centurion_data
        .testudos
        .iter_mut()
        .find(|testudo| testudo.token_mint == ctx.accounts.mint.key())
        .ok_or(InvalidTokenMint)?;
    testudo_data.testudo_token_count -= amount;

    msg!("Withdrawal successful");
    Ok(())
}
