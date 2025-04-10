use anchor_lang::prelude::*;
use custom_accounts::*;
use instructions::*;

mod custom_accounts;
mod errors;
mod instructions;

declare_id!("6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF");

#[program]
pub mod testudo {
    use super::*;

    pub fn init_legate(ctx: Context<InitLegate>) -> Result<()> {
        instructions::init_legate::process_init_legate(ctx)
    }
}
