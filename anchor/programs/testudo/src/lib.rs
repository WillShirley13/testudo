use anchor_lang::prelude::*;
use instructions::*;

mod custom_accounts;
mod errors;
mod instructions;

declare_id!("8ZkK4KPmwwskr2YTjejuHL2sHYyvSmkZauUJY7gyrZ5U");

#[program]
pub mod testudo {
    use super::*;

    pub fn init_legate(ctx: Context<InitLegate>) -> Result<()> {
        instructions::init_legate::process_init_legate(ctx)
    }

    pub fn init_centurion(
        ctx: Context<InitCenturion>,
        password_pubkey: Pubkey,
        backup_owner: Option<Pubkey>,
    ) -> Result<()> {
        instructions::init_centurion::process_init_centurion(ctx, password_pubkey, backup_owner)
    }

    pub fn create_testudo(ctx: Context<CreateTestudo>) -> Result<()> {
        instructions::create_testudo::process_create_testudo(ctx)
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        instructions::process_deposit_sol(ctx, amount)
    }

    pub fn deposit_spl(ctx: Context<DepositSplToken>, amount: u64) -> Result<()> {
        instructions::process_deposit_spl_token(ctx, amount)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        instructions::process_withdraw_sol(ctx, amount)
    }
}
