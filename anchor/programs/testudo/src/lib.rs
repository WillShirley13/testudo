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
        instructions::process_init_legate(ctx)
    }

    pub fn init_centurion(
        ctx: Context<InitCenturion>,
        password_pubkey: Pubkey,
        backup_owner: Option<Pubkey>,
    ) -> Result<()> {
        instructions::process_init_centurion(ctx, password_pubkey, backup_owner)
    }

    pub fn create_testudo(ctx: Context<CreateTestudo>) -> Result<()> {
        instructions::process_create_testudo(ctx)
    }

    pub fn delete_testudo(ctx: Context<DeleteTestudo>) -> Result<()> {
        instructions::process_delete_testudo(ctx)
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

    pub fn withdraw_spl(ctx: Context<WithdrawSplToken>, amount: u64) -> Result<()> {
        instructions::process_withdraw_spl_token(ctx, amount)
    }

    pub fn withdraw_to_backup(ctx: Context<WithdrawToBackup>) -> Result<()> {
        instructions::process_withdraw_to_backup(ctx)
    }

    pub fn update_authority(ctx: Context<UpdateAuthority>) -> Result<()> {
        instructions::process_update_authority(ctx)
    }

    pub fn update_max_testudos(
        ctx: Context<UpdateMaxTestudos>,
        new_max_testudos: u16,
    ) -> Result<()> {
        instructions::process_update_max_testudos(ctx, new_max_testudos)
    }

    pub fn update_max_whitelisted_mints(
        ctx: Context<UpdateMaxWhitelistedMints>,
        new_max_whitelisted_mints: u16,
    ) -> Result<()> {
        instructions::process_update_max_whitelisted_mints(ctx, new_max_whitelisted_mints)
    }

    pub fn add_mint_testudo(
        ctx: Context<AddMintToTestudoTokenWhitelist>,
        mint: custom_accounts::legate::TestudoTokenWhitelist,
    ) -> Result<()> {
        instructions::process_add_mint_to_testudo_token_whitelist(ctx, mint)
    }

    pub fn update_back_up_account(
        ctx: Context<UpdateBackUpAccount>,
        backup_account: Pubkey,
    ) -> Result<()> {
        instructions::process_update_back_up_account(ctx, backup_account)
    }
}
