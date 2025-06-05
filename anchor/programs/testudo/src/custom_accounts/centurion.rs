use anchor_lang::prelude::*;

// Centurion account acts as umbrella account for all testudo accounts. It stores the pubkey to the user's 'password' private key.

#[account]
#[derive(InitSpace)]
pub struct Centurion {
    pub authority: Pubkey,            // Owner of this centurion account
    pub backup_owner: Option<Pubkey>, // If owner is compromised, backup owner can take over. Backup acc is not required. Known as the 'Optio'
    pub pubkey_to_password: Pubkey,   // Pubkey to the user's password private key
    pub bump: u8,                     // Bump seed used in PDA derivation
    pub is_initialized: bool,         // Whether this account has been initialized
    pub created_at: u64,              // Timestamp of account creation
    pub last_accessed: u64,           // Timestamp of last account access
    pub lamport_balance: u64,         // Balance of SOL in the centurion account
    #[max_len(30)]
    pub testudos: Vec<TestudoData>, // List of testudo account data
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct TestudoData {
    pub token_mint: Pubkey,
    pub testudo_pubkey: Pubkey,
}
