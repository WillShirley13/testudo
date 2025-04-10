use anchor_lang::prelude::*;

// Testudo accounts are created for each mint. Facilitates deposits and withdrawals for that mint.

#[account]
#[derive(InitSpace)]
pub struct Testudo {
    pub owning_centurion: Pubkey, // Pubkey of the centurion that owns this testudo
    pub owner: Pubkey, // Pubkey of the user that owns this testudo & centurion. Is the signer of transactions
    pub bump: u8,      // Bump seed used in PDA derivation
    pub is_initialized: bool, // Whether this account has been initialized
    pub created_at: u64, // Timestamp of account creation
    pub last_accessed: u64, // Timestamp of last account access
    pub mint: Pubkey,  // Mint of the token this testudo is for
    pub ata_pubkey: Pubkey, // Pubkey of the ATA for the mint
    pub ata_bump: u8,  // Bump seed used in ATA derivation
    pub last_deposit: u64, // Timestamp of last deposit
    pub last_withdrawal: u64, // Timestamp of last withdrawal
    pub deposit_tvl: u64, // Total value locked for this mint
}
