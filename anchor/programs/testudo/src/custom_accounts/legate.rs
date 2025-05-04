use anchor_lang::prelude::*;

// Legate account is the admin account for the entire program.

#[account]
#[derive(InitSpace)]
pub struct Legate {
    pub authority: Pubkey,           // Admin authority of the program
    pub bump: u8,                    // Bump seed used in PDA derivation
    pub is_initialized: bool,        // Whether this account has been initialized
    pub last_updated: u64,           // Timestamp of last account update
    pub max_centurions_per_user: u8, // Maximum number of centurion accounts per user
    pub max_testudos_per_user: u16,  // Maximum number of testudo accounts per user
    pub max_whitelisted_mints: u16,  // Maximum number of whitelisted mints
    #[max_len(50)]
    pub testudo_token_whitelist: Vec<TestudoTokenWhitelist>, // List of token mints that can be used with testudos
    pub treasury_acc: Pubkey,  // treasury acc for later use
    pub percent_for_fees: u16, // where 10000 = 100%
}

// Data structure for the testudo token whitelist info
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct TestudoTokenWhitelist {
    pub token_mint: Pubkey,
    #[max_len(30)]
    pub token_name: String,
    #[max_len(10)]
    pub token_symbol: String,
    pub token_decimals: u8,
}
