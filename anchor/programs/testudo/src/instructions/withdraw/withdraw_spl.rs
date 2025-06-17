use crate::custom_accounts::centurion::Centurion;
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidATA, InvalidAuthority,
    InvalidPasswordSignature, InvalidTokenMint, InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked};

// Deposit SPL tokens into a testudo account. authority is the sender and Centurion is the receiver.

#[derive(Accounts)]
pub struct WithdrawSplToken<'info> {
    // SIGNERS
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,

    // AUTHORITY ATA
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub authority_ata: InterfaceAccount<'info, TokenAccount>,

    // CENTURION
    #[account(
        mut,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,

    // TESTUDO TOKEN ACCOUNT
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
    pub testudo: InterfaceAccount<'info, TokenAccount>,

    // MINT
    pub mint: InterfaceAccount<'info, Mint>,

    // LEGATE
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
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
        mut,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_ata: InterfaceAccount<'info, TokenAccount>,

    // PROGRAMS
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
        constraint = system_program.key() == anchor_lang::system_program::ID,
    )]
    pub system_program: Program<'info, System>,
    #[account(
        constraint = associated_token_program.key() == anchor_spl::associated_token::ID,
    )]
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn process_withdraw_spl_token(
    ctx: Context<WithdrawSplToken>,
    amount_in_decimals: u64,
) -> Result<()> {
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

    // Ensure the depositor has enough tokens in their ATA to cover the deposit
    require_gte!(
        testudo_token_holdings,
        amount_in_decimals,
        InsufficientFunds
    );
    msg!("Depositor has enough tokens to cover the deposit");

    let withdraw_fee = amount_in_decimals
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = amount_in_decimals
        .checked_sub(withdraw_fee)
        .ok_or(ArithmeticOverflow)?;

    // Get the testudo account for the token
    let testudo_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.testudo;
    // Get the depositor's ATA for the token
    let authority_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.authority_ata;
    // Get the treasury ATA for the token
    let treasury_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.treasury_ata;

    // Get the number of decimals for the token
    let decimals: u8 = ctx.accounts.mint.decimals;

    let signer_seeds: &[&[&[u8]]] = &[&[
        b"centurion",
        ctx.accounts.authority.key.as_ref(),
        &[ctx.bumps.centurion],
    ]];

    // Set up the CPI accounts for the transfer of fee
    let cpi_accounts_for_fee = TransferChecked {
        from: testudo_ata.to_account_info(),
        to: treasury_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: centurion_data.to_account_info(),
    };

    // Set up the CPI context for the transfer of fee
    let cpi_context_for_fee = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_for_fee,
        signer_seeds,
    );

    // Perform the transfer
    token_interface::transfer_checked(cpi_context_for_fee, withdraw_fee, decimals)?;

    // Set up the CPI accounts for the transfer of amount after fee
    let cpi_accounts_for_withdraw = TransferChecked {
        from: testudo_ata.to_account_info(),
        to: authority_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: centurion_data.to_account_info(),
    };

    // Set up the CPI context for the transfer of amount after fee
    let cpi_context_for_withdraw = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_for_withdraw,
        signer_seeds,
    );

    // Perform the transfer
    token_interface::transfer_checked(cpi_context_for_withdraw, amount_after_fee, decimals)?;

    // Update the last accessed timestamp
    let current_datetime: i64 = Clock::get()?.unix_timestamp;
    centurion_data.last_accessed = current_datetime as u64;

    msg!("Withdrawal of {} tokens successful", amount_in_decimals);
    Ok(())
}
