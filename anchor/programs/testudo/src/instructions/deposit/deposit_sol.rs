use crate::custom_accounts::centurion::Centurion;
use crate::errors::ErrorCode::{
    ArithmeticOverflow, CenturionNotInitialized, InsufficientFunds, InvalidAuthority,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_lang::system_program;

// Deposit native SOL into a testudo account (Note: this is simply the Centurion PDA).

#[derive(Accounts)]
pub struct DepositSol<'info> {
    // SIGNERS
    #[account(mut)]
    pub authority: Signer<'info>,

    // CENTURION
    #[account(
        mut,
        seeds = [b"centurion".as_ref(), authority.key.as_ref()],
        bump,
        constraint = centurion.is_initialized @CenturionNotInitialized,
        has_one = authority @InvalidAuthority,
    )]
    pub centurion: Account<'info, Centurion>,

    // PROGRAMS
    pub system_program: Program<'info, System>,
}

// param 'amount' is in SOL
pub fn process_deposit_sol(ctx: Context<DepositSol>, amount_in_lamports: u64) -> Result<()> {
    let authority_sol_balance: u64 = ctx.accounts.authority.get_lamports();

    // Ensure the authority has enough funds to deposit
    require_gte!(authority_sol_balance, amount_in_lamports, InsufficientFunds);
    msg!("Authority has enough funds to deposit");

    // Transfer the funds from the authority to the centurion
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to: ctx.accounts.centurion.to_account_info(),
    };
    system_program::transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts),
        amount_in_lamports,
    )?;

    ctx.accounts.centurion.lamport_balance = ctx
        .accounts
        .centurion
        .lamport_balance
        .checked_add(amount_in_lamports)
        .ok_or(ArithmeticOverflow)?;

    let current_datetime = Clock::get()?.unix_timestamp;
    let centurion_data: &mut Account<'_, Centurion> = &mut ctx.accounts.centurion;
    centurion_data.last_accessed = current_datetime as u64;

    msg!(
        "Deposit of {} SOL successful",
        amount_in_lamports / LAMPORTS_PER_SOL
    );
    Ok(())
}
