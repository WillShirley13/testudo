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
                                     // treasury acc for later use?
                                     // basis points for fees?
}
