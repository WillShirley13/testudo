use anchor_lang::prelude::*;
use instructions::*;

mod custom_accounts;
mod errors;
mod instructions;

declare_id!("EEDx38FPqWhtj5qDftss355r7tkdD9bWgJFgSfTTi9v6");

#[program]
pub mod testudo {
    use super::*;

    pub fn init_legate(ctx: Context<InitLegate>, treasury_acc: Pubkey) -> Result<()> {
        instructions::process_init_legate(ctx, treasury_acc)
    }

    pub fn close_legate(ctx: Context<CloseLegate>) -> Result<()> {
        process_close_legate(ctx)
    }

    pub fn init_centurion(
        ctx: Context<InitCenturion>,
        password_pubkey: Pubkey,
        backup_owner: Option<Pubkey>,
    ) -> Result<()> {
        instructions::process_init_centurion(ctx, password_pubkey, backup_owner)
    }

    pub fn close_centurion(ctx: Context<CloseCenturion>) -> Result<()> {
        instructions::process_close_centurion(ctx)
    }

    pub fn create_testudo(ctx: Context<CreateTestudo>) -> Result<()> {
        instructions::process_create_testudo(ctx)
    }

    pub fn delete_testudo(ctx: Context<DeleteTestudo>) -> Result<()> {
        instructions::process_delete_testudo(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::process_deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: Option<u64>) -> Result<()> {
        instructions::process_withdraw(ctx, amount)
    }

    pub fn legate_admin(ctx: Context<LegateAdmin>, action: LegateAdminAction) -> Result<()> {
        instructions::process_legate_admin(ctx, action)
    }

    pub fn update_back_up_account(
        ctx: Context<UpdateBackUpAccount>,
        backup_account: Pubkey,
    ) -> Result<()> {
        instructions::process_update_back_up_account(ctx, backup_account)
    }

    pub fn swap(
        ctx: Context<Swap>,
        jupiter_data: Vec<u8>,
        testudo_data: Vec<custom_accounts::centurion::TestudoData>,
    ) -> Result<()> {
        process_swap(ctx, jupiter_data, testudo_data)
    }
}
