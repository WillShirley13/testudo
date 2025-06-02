use crate::custom_accounts::legate::{Legate, TestudoTokenWhitelist};
use crate::errors::ErrorCode::AccountAlreadyInitialized;

// Initialize the admin Legate account.

use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct InitLegate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"legate"],
        bump,
        space = 8 + Legate::INIT_SPACE,
        constraint = !legate.is_initialized @AccountAlreadyInitialized,
    )]
    pub legate: Account<'info, Legate>,
    pub system_program: Program<'info, System>,
}

pub fn process_init_legate(ctx: Context<InitLegate>, treasury_acc: Pubkey) -> Result<()> {
    let legate_data: &mut Account<'_, Legate> = &mut ctx.accounts.legate;

    // double check that the legate account is not already initialized
    require_eq!(legate_data.is_initialized, false, AccountAlreadyInitialized);

    legate_data.authority = ctx.accounts.authority.key();
    legate_data.bump = ctx.bumps.legate;
    legate_data.is_initialized = true;

    // Initially, 'last_updated' set to creation time
    let last_updated: i64 = Clock::get()?.unix_timestamp;
    legate_data.last_updated = last_updated as u64;

    // Initially, users only allowed a single centurion. Maybe in future
    // allowed more. Currenlty can't see need for > 1
    legate_data.max_centurions_per_user = 1;
    // Initially, space allocated for max of the 30 testudos per user/wallet
    legate_data.max_testudos_per_user = 30;
    legate_data.max_whitelisted_mints = 50;
    legate_data.testudo_token_whitelist = vec![
        // USDC - USD Coin (keeping as requested)
        TestudoTokenWhitelist {
            token_mint: pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            token_decimals: 6,
        },
        // USDT - Tether USD (keeping as requested)
        TestudoTokenWhitelist {
            token_mint: pubkey!("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
            token_name: "Tether USD".to_string(),
            token_symbol: "USDT".to_string(),
            token_decimals: 6,
        },
        // LINK - Chainlink
        TestudoTokenWhitelist {
            token_mint: pubkey!("CWE8jPTUYhdCTZYWPTe1o5DFqfdjzWKc9WKz6rSjQUdG"),
            token_name: "Chainlink".to_string(),
            token_symbol: "LINK".to_string(),
            token_decimals: 6,
        },
        // UNI - Uniswap
        TestudoTokenWhitelist {
            token_mint: pubkey!("DEhAasscXF4kEGxFgJ3bq4PpVGp5wyUxMRvn6TzGVHaw"),
            token_name: "Uniswap".to_string(),
            token_symbol: "UNI".to_string(),
            token_decimals: 6,
        },
        // AAVE - Aave
        TestudoTokenWhitelist {
            token_mint: pubkey!("3vHdRMX9YmAoCdMVCEwVtgCbaLw3cAaU6ksM48EdYqFa"),
            token_name: "Aave".to_string(),
            token_symbol: "AAVE".to_string(),
            token_decimals: 6,
        },
        // TRUMP - Official Trump
        TestudoTokenWhitelist {
            token_mint: pubkey!("HaP8r3ksG76PhQLTqR8FYBeNiQpejcFbQmiHbg787Ut1"),
            token_name: "Official Trump".to_string(),
            token_symbol: "TRUMP".to_string(),
            token_decimals: 6,
        },
        // RENDER - Render
        TestudoTokenWhitelist {
            token_mint: pubkey!("rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof"),
            token_name: "Render".to_string(),
            token_symbol: "RENDER".to_string(),
            token_decimals: 8,
        },
        // JUP - Jupiter
        TestudoTokenWhitelist {
            token_mint: pubkey!("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"),
            token_name: "Jupiter".to_string(),
            token_symbol: "JUP".to_string(),
            token_decimals: 6,
        },
        // BONK - Bonk
        TestudoTokenWhitelist {
            token_mint: pubkey!("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
            token_name: "Bonk".to_string(),
            token_symbol: "BONK".to_string(),
            token_decimals: 5,
        },
        // VIRTUAL - Virtuals Protocol
        TestudoTokenWhitelist {
            token_mint: pubkey!("BLze6PfqC69d1FqiozXnzNzWkMLddsJ2LXhg1McPiFFn"),
            token_name: "Virtuals Protocol".to_string(),
            token_symbol: "VIRTUAL".to_string(),
            token_decimals: 9,
        },
        // FARTCOIN - Fartcoin
        TestudoTokenWhitelist {
            token_mint: pubkey!("9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump"),
            token_name: "Fartcoin".to_string(),
            token_symbol: "FARTCOIN".to_string(),
            token_decimals: 6,
        },
        // WIF - dogwifhat
        TestudoTokenWhitelist {
            token_mint: pubkey!("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"),
            token_name: "dogwifhat".to_string(),
            token_symbol: "WIF".to_string(),
            token_decimals: 6,
        },
        // GRT - The Graph
        TestudoTokenWhitelist {
            token_mint: pubkey!("5tN42n9vMi6ubp67Uy4NnmM5DMZYN8aS8GeB3bEDHr6E"),
            token_name: "The Graph".to_string(),
            token_symbol: "GRT".to_string(),
            token_decimals: 6,
        },
        // LDO - Lido DAO
        TestudoTokenWhitelist {
            token_mint: pubkey!("HZRCwxP2Vq9PCpPXooayhJ2bxTpo5xfpQrwB1svh332p"),
            token_name: "Lido DAO".to_string(),
            token_symbol: "LDO".to_string(),
            token_decimals: 8,
        },
        // RAY - Raydium
        TestudoTokenWhitelist {
            token_mint: pubkey!("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
            token_name: "Raydium".to_string(),
            token_symbol: "RAY".to_string(),
            token_decimals: 6,
        },
        // PYTH - Pyth Network
        TestudoTokenWhitelist {
            token_mint: pubkey!("HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3"),
            token_name: "Pyth Network".to_string(),
            token_symbol: "PYTH".to_string(),
            token_decimals: 6,
        },
        // PENGU - Pudgy Penguins
        TestudoTokenWhitelist {
            token_mint: pubkey!("2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv"),
            token_name: "Pudgy Penguins".to_string(),
            token_symbol: "PENGU".to_string(),
            token_decimals: 6,
        },
        // HNT - Helium
        TestudoTokenWhitelist {
            token_mint: pubkey!("hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux"),
            token_name: "Helium".to_string(),
            token_symbol: "HNT".to_string(),
            token_decimals: 8,
        },
        // JTO - Jito
        TestudoTokenWhitelist {
            token_mint: pubkey!("jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL"),
            token_name: "Jito".to_string(),
            token_symbol: "JTO".to_string(),
            token_decimals: 9,
        },
    ];
    legate_data.treasury_acc = treasury_acc;
    legate_data.percent_for_fees = 15; // where 15 = 0.15%

    msg!("Legate account initialized");
    Ok(())
}
