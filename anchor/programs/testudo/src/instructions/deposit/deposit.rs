use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"centurion", authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,

    // OPTIONAL ACCOUNTS - presence determines behavior
    // SPL-related accounts (if present = SPL deposit)
    #[account(
        constraint = centurion.testudos.iter().any(|t| t.token_mint == mint.key()) @UnsupportedTokenMint
    )]
    pub mint: Option<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub authority_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = centurion,
        token::token_program = token_program,
        seeds = [centurion.key().as_ref(), mint.as_ref().unwrap().key().as_ref()],
        bump,
        // Ensure the ATA is for the correct token mint
        constraint = testudo_ata.mint == mint.as_ref().unwrap().key() @InvalidTokenMint,
        // Ensure the ATA is for the correct Centurion (User)
        constraint = testudo_ata.owner == centurion.key() @InvalidATA,
    )]
    pub testudo_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        constraint = token_program.key() == anchor_spl::token::ID || token_program.key() == anchor_spl::token_2022::ID @InvalidTokenProgram
    )]
    pub token_program: Option<Interface<'info, TokenInterface>>,
    #[account(
        constraint = associated_token_program.key() == anchor_spl::associated_token::ID,
    )]
    pub associated_token_program: Option<Program<'info, AssociatedToken>>,

    pub system_program: Program<'info, System>,
}

pub fn process_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // DETERMINE DEPOSIT TYPE FROM ACCOUNT PRESENCE
    let is_spl = ctx.accounts.mint.is_some();

    if is_spl {
        msg!("SPL TOKEN DEPOSIT");
        // SPL TOKEN DEPOSIT
        let mint = ctx.accounts.mint.as_ref().unwrap();
        let authority_ata = ctx.accounts.authority_ata.as_ref().unwrap();
        let testudo_ata = ctx.accounts.testudo_ata.as_ref().unwrap();
        let token_program = ctx.accounts.token_program.as_ref().unwrap();

        // Validate ATA constraints
        require_eq!(testudo_ata.mint, mint.key(), InvalidTokenMint);
        require_eq!(testudo_ata.owner, ctx.accounts.centurion.key(), InvalidATA);

        // Check depositor has enough tokens
        require_gte!(authority_ata.amount, amount, InsufficientFunds);

        // Perform SPL token transfer
        transfer_checked(
            CpiContext::new(
                token_program.to_account_info(),
                TransferChecked {
                    from: authority_ata.to_account_info(),
                    to: testudo_ata.to_account_info(),
                    mint: mint.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
            mint.decimals,
        )?;

        msg!("Deposit of {} tokens successful", amount);
    } else {
        msg!("SOL DEPOSIT");
        // SOL DEPOSIT
        let authority_sol_balance = ctx.accounts.authority.get_lamports();

        // Check authority has enough SOL
        require_gte!(authority_sol_balance, amount, InsufficientFunds);

        // Perform SOL transfer
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.centurion.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update centurion SOL balance tracking
        ctx.accounts.centurion.lamport_balance = ctx
            .accounts
            .centurion
            .lamport_balance
            .checked_add(amount)
            .ok_or(ArithmeticOverflow)?;

        msg!("Deposit of {} lamports successful", amount);
    }

    // SINGLE STATE UPDATE
    ctx.accounts.centurion.last_accessed = Clock::get()?.unix_timestamp as u64;

    Ok(())
}
