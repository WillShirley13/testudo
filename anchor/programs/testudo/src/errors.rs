use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Legate account already initialized")]
    AccountAlreadyInitialized,
    #[msg("Invalid authority passed")]
    InvalidAuthority,
    #[msg("User's Centurion must be initialized first")]
    TestudoCreationCannotPreceedCenturionInitialization,
    #[msg("Unsupported token mint")]
    UnsupportedTokenMint,
    #[msg("Depositer/Withdrawer has insufficient funds for deposit/withdraw")]
    InsufficientFunds,
    #[msg("Centurion not initialized")]
    CenturionNotInitialized,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Invalid associated token account")]
    InvalidATA,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Invalid signature for password")]
    InvalidPasswordSignature,
}
