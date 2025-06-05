use crate::custom_accounts::centurion::*;
use crate::custom_accounts::legate::Legate;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InvalidATA, InvalidAuthority,
    InvalidBackupAccount, InvalidPasswordSignature, InvalidTokenMint, InvalidTreasuryAccount,
    LegateNotInitialized, NoBackupAccountStored,
};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

// Withdraw tokens to the backup account

#[derive(Accounts)]
pub struct WithdrawToBackup<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        // Ensure the pubkey of the signer is the same as the pubkey of the password (stored in the centurion account)
        constraint = centurion.pubkey_to_password == valid_signer_of_password.key() @InvalidPasswordSignature
    )]
    pub valid_signer_of_password: Signer<'info>,
    #[account(
        mut,
        seeds = [b"centurion", authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,
    #[account(
        mut,
        // Ensure the ATA is for the correct token mint
        token::mint = mint,
        token::authority = centurion,
        token::token_program = token_program,
        seeds = [centurion.key().as_ref(), mint.key().as_ref()],
        bump,
        constraint = testudo.owner == centurion.key() @InvalidATA
    )]
    // Centurion ATA
    pub testudo: InterfaceAccount<'info, TokenAccount>,
    // The backup account to which all tokens will be withdrawn to
    #[account(
        //  ensure backup account provided matches account saved in Centurion
        mut,
        constraint = backup_account.key() == centurion.backup_owner.ok_or(NoBackupAccountStored)? @InvalidBackupAccount
    )]
    /// CHECK: Explicit wrapper for AccountInfo type to emphasize that no checks are performed
    pub backup_account: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = backup_account,
        associated_token::token_program = token_program,
        constraint = backup_ata.owner == backup_account.key() @InvalidATA
    )]
    pub backup_ata: InterfaceAccount<'info, TokenAccount>,
    // Ensure valid token program is passed
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID
    )]
    pub token_program: Interface<'info, TokenInterface>,
    #[account(
        mut,
        //ensure centurion has an ATA for mint passed
        constraint = centurion.testudos.iter().any(|t| t.token_mint == mint.key())
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    // Ensure valid associated token program is passed
    #[account(
        constraint = associated_token_program.key() == anchor_spl::associated_token::ID,
    )]
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,
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
}

pub fn process_withdraw_to_backup(ctx: Context<WithdrawToBackup>) -> Result<()> {
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    let centurion_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.testudo;
    let backup_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.backup_ata;
    let password_pubkey = centurion_data.pubkey_to_password;

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

    // Ensure backup account passed matches account held in Centurion
    require_eq!(
        ctx.accounts.backup_account.key(),
        centurion_data.backup_owner.ok_or(NoBackupAccountStored)?,
        InvalidBackupAccount
    );

    let withdraw_fee = centurion_ata
        .amount
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = centurion_ata
        .amount
        .checked_sub(withdraw_fee)
        .ok_or(ArithmeticOverflow)?;

    let token_program: &mut Interface<'_, TokenInterface> = &mut ctx.accounts.token_program;

    let signer_seeds: &[&[&[u8]]] = &[&[
        b"centurion",
        ctx.accounts.authority.key.as_ref(),
        &[ctx.bumps.centurion],
    ]];

    // Set up the CPI accounts for the transfer of fee
    let cpi_accounts_for_fee = TransferChecked {
        from: centurion_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.treasury_ata.to_account_info(),
        authority: centurion_data.to_account_info(),
    };

    let cpi_context_for_fee = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts_for_fee,
        signer_seeds,
    );

    transfer_checked(
        cpi_context_for_fee,
        withdraw_fee,
        ctx.accounts.mint.decimals,
    )?;

    // Set up the CPI accounts for the transfer of amount after fee
    let cpi_accounts_for_withdraw = TransferChecked {
        from: centurion_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: backup_ata.to_account_info(),
        authority: centurion_data.to_account_info(),
    };

    let cpi_context_for_withdraw = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts_for_withdraw,
        signer_seeds,
    );

    transfer_checked(
        cpi_context_for_withdraw,
        amount_after_fee,
        ctx.accounts.mint.decimals,
    )?;

    // Update the last accessed timestamp
    let current_datetime: i64 = Clock::get()?.unix_timestamp;
    centurion_data.last_accessed = current_datetime as u64;

    msg!(
        "Mint ({}) tokens in centurion ({}) have been transferred to backup account ({})",
        ctx.accounts.mint.key(),
        centurion_data.key(),
        ctx.accounts.backup_account.key()
    );

    Ok(())
}
