use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::{
    CenturionNotInitialized, ErrorTransferringAllTokensOutOfTestudo, InvalidATA, InvalidAuthority,
    InvalidPasswordSignature, InvalidTokenMint,
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

// Delete a testudo account

#[derive(Accounts)]
pub struct DeleteTestudo<'info> {
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
}

pub fn process_delete_testudo(ctx: Context<DeleteTestudo>) -> Result<()> {
    let centurion: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    let testudo_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.testudo;
    let authority: &Signer<'_> = &ctx.accounts.authority;
    let authority_ata: &mut InterfaceAccount<'_, TokenAccount> = &mut ctx.accounts.authority_ata;
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

    // Transfer all SPL tokens to the authority
    // Set up the CPI accounts for the transfer
    let cpi_accounts = TransferChecked {
        from: testudo_ata.to_account_info(),
        to: authority_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: centurion.to_account_info(),
    };

    let authority_key_ref = ctx.accounts.authority.key.as_ref();
    let bump = &[ctx.bumps.centurion];
    let signer_seeds: &[&[&[u8]]] = &[&[b"centurion", authority_key_ref, bump]];

    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    // Perform the transfer
    transfer_checked(cpi_context, testudo_ata.amount, ctx.accounts.mint.decimals)?;

    //Ensure all tokens have been transferred
    require_eq!(
        testudo_ata.amount,
        0,
        ErrorTransferringAllTokensOutOfTestudo
    );

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
