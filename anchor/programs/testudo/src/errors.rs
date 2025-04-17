use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    #[msg("Legate account not initialized")]
    LegateNotInitialized,
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
    #[msg("Mint already in list")]
    MintAlreadyInList,
}
