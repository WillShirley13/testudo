use anchor_lang::prelude::*;
use instructions::*;

mod custom_accounts;
mod errors;
mod instructions;

declare_id!("BJUZAVsokNjVti3Rq9ExxkWTavkDtutqHsBdarfgpoxN");

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

    pub fn init_testudo(ctx: Context<InitTestudo>) -> Result<()> {
        instructions::process_init_testudo(ctx)
    }

    pub fn close_testudo(ctx: Context<CloseTestudo>) -> Result<()> {
        instructions::process_close_testudo(ctx)
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount_in_lamports: u64) -> Result<()> {
        instructions::process_deposit_sol(ctx, amount_in_lamports)
    }

    pub fn deposit_spl(ctx: Context<DepositSplToken>, amount_with_decimals: u64) -> Result<()> {
        instructions::process_deposit_spl_token(ctx, amount_with_decimals)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount_in_lamports: u64) -> Result<()> {
        instructions::process_withdraw_sol(ctx, amount_in_lamports)
    }

    pub fn withdraw_spl(ctx: Context<WithdrawSplToken>, amount_with_decimals: u64) -> Result<()> {
        instructions::process_withdraw_spl_token(ctx, amount_with_decimals)
    }

    pub fn withdraw_to_backup(ctx: Context<WithdrawToBackup>) -> Result<()> {
        instructions::process_withdraw_to_backup(ctx)
    }

    pub fn withdraw_sol_to_backup(ctx: Context<WithdrawSolToBackup>) -> Result<()> {
        instructions::process_withdraw_sol_to_backup(ctx)
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

    pub fn add_mint_to_testudo_token_whitelist(
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

    pub fn update_treasury(ctx: Context<UpdateTreasury>, new_treasury: Pubkey) -> Result<()> {
        instructions::process_update_treasury(ctx, new_treasury)
    }

    pub fn update_fee_percent(ctx: Context<UpdateFeePercent>, new_fee_percent: u16) -> Result<()> {
        instructions::process_update_fee_percent(ctx, new_fee_percent)
    }

    pub fn swap(
        ctx: Context<Swap>,
        jupiter_data: Vec<u8>,
        testudo_data: Vec<custom_accounts::centurion::TestudoData>,
    ) -> Result<()> {
        process_swap(ctx, jupiter_data, testudo_data)
    }
}
