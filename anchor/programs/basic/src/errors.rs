use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Legate account already initialized")]
    LegateAlreadyInitialized,
}
