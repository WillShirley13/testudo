use crate::custom_accounts::{centurion::Centurion, legate::Legate};
use crate::errors::ErrorCode::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
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
        seeds = [b"legate"],
        bump = legate.bump,
        constraint = legate.is_initialized @LegateNotInitialized,
    )]
    pub legate: Account<'info, Legate>,

    #[account(
        mut,
        constraint = legate.treasury_acc == treasury.key() @InvalidTreasuryAccount
    )]
    /// CHECK: Treasury account
    pub treasury: UncheckedAccount<'info>,

    // OPTIONAL ACCOUNTS - presence determines behavior
    /// CHECK: Backup account (if present = backup withdrawal)
    pub backup_account: Option<UncheckedAccount<'info>>,

    // SPL-related accounts (if present = SPL withdrawal)
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
        mut,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub backup_ata: Option<InterfaceAccount<'info, TokenAccount>>,
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

pub fn process_withdraw(
    ctx: Context<Withdraw>,
    amount: Option<u64>, // None = withdraw all (backup mode)
) -> Result<()> {
    // DETERMINE WITHDRAWAL TYPE FROM ACCOUNT PRESENCE
    let is_backup = ctx.accounts.backup_account.is_some();
    let is_spl = ctx.accounts.mint.is_some();

    // SINGLE AMOUNT CALCULATION
    let withdrawal_amount = if is_backup {
        // Backup withdrawals = withdraw everything
        if is_spl {
            ctx.accounts.testudo_ata.as_ref().unwrap().amount
        } else {
            // For SOL backup, calculate max withdrawable
            let rent = Rent::get()?;
            let min_rent =
                rent.minimum_balance(ctx.accounts.centurion.to_account_info().data_len());
            let account_lamports = ctx.accounts.centurion.to_account_info().lamports();
            account_lamports.saturating_sub(min_rent)
        }
    } else {
        // Regular withdrawals use specified amount
        amount.ok_or_else(|| error!(InsufficientFunds))?
    };

    require_gt!(withdrawal_amount, 0, InsufficientFunds);

    // SINGLE FEE CALCULATION
    let fee = withdrawal_amount
        .checked_mul(ctx.accounts.legate.percent_for_fees as u64)
        .unwrap_or(0)
        .checked_div(10000)
        .unwrap_or(0);
    let amount_after_fee = withdrawal_amount
        .checked_sub(fee)
        .ok_or(ArithmeticOverflow)?;

    // SINGLE TRANSFER LOGIC BLOCK
    if is_spl {
        // SPL TOKEN TRANSFERS
        let mint = ctx.accounts.mint.as_ref().unwrap();
        let testudo_ata = ctx.accounts.testudo_ata.as_ref().unwrap();
        let treasury_ata = ctx.accounts.treasury_ata.as_ref().unwrap();
        let token_program = ctx.accounts.token_program.as_ref().unwrap();

        // Determine destination ATA
        let destination_ata = if is_backup {
            ctx.accounts.backup_ata.as_ref().unwrap()
        } else {
            ctx.accounts.authority_ata.as_ref().unwrap()
        };

        require_gte!(testudo_ata.amount, withdrawal_amount, InsufficientFunds);

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"centurion",
            ctx.accounts.authority.key.as_ref(),
            &[ctx.bumps.centurion],
        ]];

        // Transfer fee to treasury
        if fee > 0 {
            transfer_checked(
                CpiContext::new_with_signer(
                    token_program.to_account_info(),
                    TransferChecked {
                        from: testudo_ata.to_account_info(),
                        to: treasury_ata.to_account_info(),
                        mint: mint.to_account_info(),
                        authority: ctx.accounts.centurion.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
                mint.decimals,
            )?;
        }

        // Transfer amount to destination
        transfer_checked(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                TransferChecked {
                    from: testudo_ata.to_account_info(),
                    to: destination_ata.to_account_info(),
                    mint: mint.to_account_info(),
                    authority: ctx.accounts.centurion.to_account_info(),
                },
                signer_seeds,
            ),
            amount_after_fee,
            mint.decimals,
        )?;
    } else {
        // SOL TRANSFERS
        // Determine destination account
        let destination = if is_backup {
            let backup = ctx.accounts.backup_account.as_ref().unwrap();
            require_eq!(
                backup.key(),
                ctx.accounts
                    .centurion
                    .backup_owner
                    .ok_or(NoBackupAccountStored)?,
                InvalidBackupAccount
            );
            backup
        } else {
            &ctx.accounts.authority.to_account_info()
        };

        // Validate sufficient balance for regular withdrawals
        if !is_backup {
            let rent = Rent::get()?;
            let min_rent =
                rent.minimum_balance(ctx.accounts.centurion.to_account_info().data_len());
            let account_lamports = ctx.accounts.centurion.to_account_info().lamports();
            let max_withdrawable = account_lamports.saturating_sub(min_rent);
            require_gte!(max_withdrawable, withdrawal_amount, InsufficientFunds);
            require_gte!(
                ctx.accounts.centurion.lamport_balance,
                withdrawal_amount,
                InsufficientFunds
            );
        }

        // Transfer fee to treasury
        if fee > 0 {
            ctx.accounts.centurion.sub_lamports(fee)?;
            ctx.accounts.treasury.add_lamports(fee)?;
        }

        // Transfer amount to destination
        ctx.accounts.centurion.sub_lamports(amount_after_fee)?;
        destination.add_lamports(amount_after_fee)?;

        // Update centurion SOL balance tracking
        if is_backup {
            ctx.accounts.centurion.lamport_balance = 0;
        } else {
            ctx.accounts.centurion.lamport_balance = ctx
                .accounts
                .centurion
                .lamport_balance
                .checked_sub(withdrawal_amount)
                .ok_or(ArithmeticOverflow)?;
        }
    }

    // SINGLE STATE UPDATE
    ctx.accounts.centurion.last_accessed = Clock::get()?.unix_timestamp as u64;

    msg!(
        "Withdrawal successful: {} {}",
        withdrawal_amount,
        if is_spl { "tokens" } else { "lamports" }
    );

    Ok(())
}
