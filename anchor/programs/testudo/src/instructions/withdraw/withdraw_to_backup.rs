use crate::custom_accounts::centurion::*;
use crate::errors::ErrorCode::{
    CenturionNotInitialized, InvalidATA, InvalidAuthority, InvalidBackupAccount,
    InvalidPasswordSignature, InvalidTokenMint, NoBackupAccountStored,
};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

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

    let tokens_in_centurion_ata: u64 = centurion_ata.amount;

    let cpi_accounts = TransferChecked {
        from: centurion_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: backup_ata.to_account_info(),
        authority: centurion_data.to_account_info(),
    };

    let signer_seeds: &[&[&[u8]]] = &[&[
        b"centurion",
        ctx.accounts.authority.key.as_ref(),
        &[ctx.bumps.centurion],
    ]];

    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    transfer_checked(
        cpi_context,
        tokens_in_centurion_ata,
        ctx.accounts.mint.decimals,
    )?;

    // Update the last accessed timestamp
    let current_datetime: i64 = Clock::get()?.unix_timestamp;
    centurion_data.last_accessed = current_datetime as u64;

    // Update the testudo token count
    let testudo_data: &mut TestudoData = centurion_data
        .testudos
        .iter_mut()
        .find(|testudo| testudo.token_mint == ctx.accounts.mint.key())
        .ok_or(InvalidTokenMint)?;
    testudo_data.testudo_token_count -= tokens_in_centurion_ata;

    msg!(
        "Mint ({}) tokens in centurion ({}) have been transferred to backup account ({})",
        ctx.accounts.mint.key(),
        centurion_data.key(),
        ctx.accounts.backup_account.key()
    );

    Ok(())
}
