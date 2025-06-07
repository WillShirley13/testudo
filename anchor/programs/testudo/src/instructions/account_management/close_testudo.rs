use crate::custom_accounts::centurion::Centurion;
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InvalidATA, InvalidAuthority,
    InvalidPasswordSignature, InvalidTokenMint, InvalidTreasuryAccount, LegateNotInitialized,
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

// Delete a testudo account

#[derive(Accounts)]
pub struct CloseTestudo<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
        constraint = authority_ata.owner == authority.key() @InvalidATA,
        constraint = authority_ata.mint == mint.key() @InvalidTokenMint,
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
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
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
    #[account(
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub treasury: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_ata: InterfaceAccount<'info, TokenAccount>,
    // Ensure valid token program is passed
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_close_testudo(ctx: Context<CloseTestudo>) -> Result<()> {
    let centurion: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    let testudo_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.testudo;
    let authority: &Signer<'_> = &ctx.accounts.authority;
    let token_program: &Interface<'_, TokenInterface> = &ctx.accounts.token_program;
    let password_pubkey: Pubkey = centurion.pubkey_to_password;

    // Ensure the token mint is supported by the Centurion
    require_eq!(
        centurion
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

    let amount_in_decimals = testudo_ata.amount;

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
        authority: centurion.to_account_info(),
    };

    // Set up the CPI context for the transfer of fee
    let cpi_context_for_fee = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_for_fee,
        signer_seeds,
    );

    // Perform the transfer
    transfer_checked(cpi_context_for_fee, withdraw_fee, decimals)?;

    // Set up the CPI accounts for the transfer of amount after fee
    let cpi_accounts_for_withdraw = TransferChecked {
        from: testudo_ata.to_account_info(),
        to: authority_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: centurion.to_account_info(),
    };

    // Set up the CPI context for the transfer of amount after fee
    let cpi_context_for_withdraw = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_for_withdraw,
        signer_seeds,
    );

    // Perform the transfer
    transfer_checked(cpi_context_for_withdraw, amount_after_fee, decimals)?;

    // Close the ATA
    let cpi_accounts: CloseAccount<'_> = CloseAccount {
        account: testudo_ata.to_account_info(),
        destination: authority.to_account_info(),
        authority: centurion.to_account_info(),
    };
    let authority_key_ref: &[u8] = authority.key.as_ref();
    let bump: &[u8; 1] = &[ctx.bumps.centurion];
    let signer_seeds: &[&[&[u8]]] = &[&[b"centurion", authority_key_ref, bump]];
    let cpi_context: CpiContext<'_, '_, '_, '_, CloseAccount<'_>> =
        CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, signer_seeds);

    close_account(cpi_context)?;

    // Remove the testudo from the centurion
    centurion.testudos = centurion
        .testudos
        .iter()
        .filter(|testudo| testudo.token_mint != ctx.accounts.mint.key())
        .cloned()
        .collect();

    centurion.last_accessed = Clock::get()?.unix_timestamp as u64;

    msg!("Testudo deleted successfully and all tokens transferred to authority");

    Ok(())
}
