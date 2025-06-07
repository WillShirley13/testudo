use crate::custom_accounts::legate::{Legate, TestudoTokenWhitelist};
use crate::errors::ErrorCode::{
    CannotDecreaseMaxTestudos,
    CannotUpdateMaxWhitelistedMintsToLessThanCurrentNumberOfWhitelistedMints, InvalidAuthority,
    LegateNotInitialized, MaxWhitelistedMintsReached, MintAlreadyInList,
};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace)]
pub enum LegateAdminAction {
    UpdateAuthority { new_authority: Pubkey },
    UpdateMaxTestudos { new_max: u16 },
    UpdateMaxWhitelistedMints { new_max: u16 },
    UpdateTreasury { new_treasury: Pubkey },
    UpdateFeePercent { new_percent: u16 },
    AddMintToWhitelist { mint_data: TestudoTokenWhitelist },
}

#[derive(Accounts)]
pub struct LegateAdmin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"legate"],
        bump,
        has_one = authority @InvalidAuthority,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,

    // OPTIONAL ACCOUNTS - presence/usage determined by action type
    // For UpdateAuthority action
    pub new_authority: Option<Signer<'info>>,
    // For UpdateTreasury action
    pub new_treasury: Option<AccountInfo<'info>>,

    pub system_program: Program<'info, System>,
}

pub fn process_legate_admin(ctx: Context<LegateAdmin>, action: LegateAdminAction) -> Result<()> {
    let legate = &mut ctx.accounts.legate;

    // COMMON VALIDATION
    require_eq!(legate.is_initialized, true, LegateNotInitialized);
    require_eq!(
        legate.authority,
        ctx.accounts.authority.key(),
        InvalidAuthority
    );

    // EXECUTE SPECIFIC ACTION
    match action {
        LegateAdminAction::UpdateAuthority { new_authority } => {
            let new_auth_signer = ctx
                .accounts
                .new_authority
                .as_ref()
                .ok_or_else(|| error!(InvalidAuthority))?;

            require_eq!(new_auth_signer.key(), new_authority, InvalidAuthority);

            legate.authority = new_authority;
            msg!("Authority updated to {}", new_authority);
        }

        LegateAdminAction::UpdateMaxTestudos { new_max } => {
            require_gt!(
                new_max,
                legate.max_testudos_per_user,
                CannotDecreaseMaxTestudos
            );

            legate.max_testudos_per_user = new_max;
            msg!("Max testudos updated to {}", new_max);
        }

        LegateAdminAction::UpdateMaxWhitelistedMints { new_max } => {
            require_gt!(
                new_max,
                legate.max_whitelisted_mints,
                CannotUpdateMaxWhitelistedMintsToLessThanCurrentNumberOfWhitelistedMints
            );

            // Calculate space needed for reallocation
            let current_space = 8
                + Legate::INIT_SPACE
                + (legate.max_whitelisted_mints as usize * TestudoTokenWhitelist::INIT_SPACE);
            let new_space =
                8 + Legate::INIT_SPACE + (new_max as usize * TestudoTokenWhitelist::INIT_SPACE);

            if new_space > current_space {
                // Reallocate account
                legate.to_account_info().realloc(new_space, false)?;

                // Transfer lamports for rent
                let rent = Rent::get()?;
                let rent_required = rent.minimum_balance(new_space);
                let current_lamports = legate.to_account_info().lamports();

                if rent_required > current_lamports {
                    let additional_rent = rent_required - current_lamports;

                    // Use system program transfer instead of manual lamport manipulation
                    let transfer_instruction = anchor_lang::system_program::Transfer {
                        from: ctx.accounts.authority.to_account_info(),
                        to: legate.to_account_info(),
                    };

                    anchor_lang::system_program::transfer(
                        CpiContext::new(
                            ctx.accounts.system_program.to_account_info(),
                            transfer_instruction,
                        ),
                        additional_rent,
                    )?;
                }
            }

            legate.max_whitelisted_mints = new_max;
            msg!("Max whitelisted mints updated to {}", new_max);
        }

        LegateAdminAction::UpdateTreasury { new_treasury } => {
            legate.treasury_acc = new_treasury;
            msg!("Treasury updated to {}", new_treasury);
        }

        LegateAdminAction::UpdateFeePercent { new_percent } => {
            legate.percent_for_fees = new_percent;
            msg!("Fee percent updated to {}", new_percent);
        }

        LegateAdminAction::AddMintToWhitelist { mint_data } => {
            require_gte!(
                legate.max_whitelisted_mints as usize,
                legate.testudo_token_whitelist.len(),
                MaxWhitelistedMintsReached
            );
            require_eq!(
                !legate
                    .testudo_token_whitelist
                    .iter()
                    .any(|m| m.token_mint == mint_data.token_mint),
                true,
                MintAlreadyInList
            );

            msg!("Mint added to whitelist: {}", mint_data.token_mint);
            legate.testudo_token_whitelist.push(mint_data);
        }
    }

    // SINGLE TIMESTAMP UPDATE
    legate.last_updated = Clock::get()?.unix_timestamp as u64;

    Ok(())
}
