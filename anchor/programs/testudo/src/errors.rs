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
    #[msg("Unsupported token mint. Legate must whitelist the token mint before Testudo creation")]
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
    #[msg("No backup account stored")]
    NoBackupAccountStored,
    #[msg("Invalid backup account passed")]
    InvalidBackupAccount,
    #[msg("Max testudos reached")]
    MaxTestudosReached,
    #[msg("Cannot update max testudos to less than current number of testudos")]
    CannotUpdateMaxTestudosToLessThanCurrentNumberOfTestudos,
    #[msg("Max whitelisted mints reached")]
    MaxWhitelistedMintsReached,
    #[msg("Cannot update max whitelisted mints to less than current number of whitelisted mints")]
    CannotUpdateMaxWhitelistedMintsToLessThanCurrentNumberOfWhitelistedMints,
    #[msg("Error while transferring all tokens out of Testudo")]
    ErrorTransferringAllTokensOutOfTestudo,
    #[msg("Invalid treasury account")]
    InvalidTreasuryAccount,
    #[msg("Centurion must be empty of spl tokens before closing (no testudos remaining)")]
    CenturionNotEmptyOfSplTokens,
    #[msg("Invalid remaining accounts given")]
    InvalidRemainingAccounts,
}
