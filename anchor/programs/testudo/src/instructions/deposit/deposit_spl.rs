use crate::custom_accounts::centurion::{Centurion, TestudoData};
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidATA, InvalidAuthority,
    InvalidTokenMint, InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked};

// Deposit SPL tokens into a testudo account. authority is the sender and Centurion is the receiver.

#[derive(Accounts)]
pub struct DepositSplToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_ata: InterfaceAccount<'info, TokenAccount>,
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
    pub testudo: InterfaceAccount<'info, TokenAccount>,
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
    #[account(
        mut,
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = treasury,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = associated_token_program,
    )]
    pub treasury_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
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
    #[account(
        constraint = associated_token_program.key() == anchor_spl::associated_token::ID,
    )]
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn process_deposit_spl_token(
    ctx: Context<DepositSplToken>,
    amount_with_decimals: u64,
) -> Result<()> {
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    // Ensure the token mint is supported by the Centurion
    require_eq!(
        centurion_data
            .testudos
            .iter()
            .any(|testudo| testudo.token_mint == ctx.accounts.mint.key()),
        true,
        InvalidTokenMint
    );

    // Get the amount of tokens the depositor has in their ATA
    let depositer_token_holdings: u64 = ctx.accounts.authority_ata.amount;

    // Ensure the depositor has enough tokens in their ATA to cover the deposit
    require_gte!(
        depositer_token_holdings,
        amount_with_decimals,
        InsufficientFunds
    );
    msg!("Depositor has enough tokens to cover the deposit");

    let deposit_fee = amount_with_decimals
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = amount_with_decimals
        .checked_sub(deposit_fee)
        .ok_or(ArithmeticOverflow)?;

    // Get the testudo account for the token
    let testudo_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.testudo;
    // Get the depositor's ATA for the token
    let authority_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.authority_ata;
    //Get treasury ATA for the token
    let treasury_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.treasury_ata;

    let decimals: u8 = ctx.accounts.mint.decimals;

    // Set up the CPI accounts for the transfer of fee
    let cpi_accounts_for_fee = TransferChecked {
        from: authority_ata.to_account_info(),
        to: treasury_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    // Set up the CPI context for the transfer of fee
    let cpi_context_for_fee: CpiContext<'_, '_, '_, '_, TransferChecked<'_>> = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_for_fee,
    );
    // Perform the transfer
    token_interface::transfer_checked(cpi_context_for_fee, deposit_fee, decimals)?;
    msg!("Transfer of deposit fee successful");

    // Set up the CPI accounts for the transfer of deposit
    let cpi_accounts_for_deposit = TransferChecked {
        from: authority_ata.to_account_info(),
        to: testudo_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    // Set up the CPI context for the transfer of deposit
    let cpi_context_for_deposit: CpiContext<'_, '_, '_, '_, TransferChecked<'_>> = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_for_deposit,
    );
    // Perform the transfer
    token_interface::transfer_checked(cpi_context_for_deposit, amount_after_fee, decimals)?;
    msg!("Transfer of deposit successful");

    // Update the last accessed timestamp
    let current_datetime: i64 = Clock::get()?.unix_timestamp;
    centurion_data.last_accessed = current_datetime as u64;

    // Update the testudo token count
    let testudo_data: &mut TestudoData = centurion_data
        .testudos
        .iter_mut()
        .find(|testudo| testudo.token_mint == ctx.accounts.mint.key())
        .ok_or(InvalidTokenMint)?;
    testudo_data.testudo_token_count += amount_with_decimals;

    msg!("Deposit successful");
    Ok(())
}
