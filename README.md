# Testudo

A Solana program implementing a dual-signature secure wallet system. Users deposit SOL and SPL tokens into Program Derived Addresses (PDAs) protected by both their wallet key and a mnemonic-derived keypair — creating an on-chain 2FA experience.

**Program ID (Mainnet):** `nikxjF5jnkFtoGTdQdQoqBWvoP4nFGbJhMHtVKZMnbL`

**Program ID (Devnet):** `9ZEKRAziZLYpBZ7mLvyPy1HEYxtsu5ZaxYDYyxraXxyy`

Built with [Anchor](https://www.anchor-lang.com/) (v0.31.1) on Solana.

---

## Table of Contents

- [Motivation](#motivation)
- [Security Model](#security-model)
- [On-Chain Architecture](#on-chain-architecture)
  - [Account Structure](#account-structure)
  - [PDA Derivation](#pda-derivation)
  - [Instruction Set](#instruction-set)
  - [Fee Model](#fee-model)
  - [Jupiter Swap Integration](#jupiter-swap-integration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Build & Test](#build--test)
  - [Deployment](#deployment)
- [Frontend](#frontend)
- [License](#license)

---

## Motivation

Standard Solana wallets rely on a single private key. If compromised, all funds are lost. Testudo adds a second authentication factor — a keypair derived from a memorable 5–12 word mnemonic phrase (optionally appended with a numeric PIN). This phrase is easy to memorize, removing the need to store a second secret key, while still enforcing dual-signature verification for every sensitive operation on-chain.

---

## Security Model

Every withdrawal, token transfer, swap, account closure, and configuration change requires **two signatures**:

1. **Wallet signature** — the user's standard Solana wallet key (`authority`).
2. **Password signature** — a keypair derived client-side from the user's mnemonic phrase. The corresponding public key (`pubkey_to_password`) is stored in the user's Centurion account and verified by the program on each protected instruction.

Deposits require only the wallet signature — funds flow in freely, but cannot leave without both factors.

For account recovery, users can optionally set a **backup owner** (called "Optio") that can receive emergency withdrawals of all funds, still requiring both signatures to execute.

---

## On-Chain Architecture

### Account Structure

The program defines three core accounts:

#### Legate (Global Admin — singleton)

The program-wide configuration account, owned by the admin authority.

| Field | Type | Description |
|---|---|---|
| `authority` | `Pubkey` | Admin wallet that controls the Legate |
| `treasury_acc` | `Pubkey` | Fee recipient address |
| `percent_for_fees` | `u16` | Fee in basis points (e.g. 15 = 0.15%) |
| `max_testudos_per_user` | `u16` | Max token accounts per Centurion (default: 30) |
| `max_whitelisted_mints` | `u16` | Max mints in the whitelist (default: 50) |
| `testudo_token_whitelist` | `Vec<TestudoTokenWhitelist>` | Approved SPL token mints |

#### Centurion (Per-User Wallet)

Each user's primary account — holds SOL directly and tracks associated token accounts.

| Field | Type | Description |
|---|---|---|
| `authority` | `Pubkey` | Owner's wallet address |
| `pubkey_to_password` | `Pubkey` | Public key of the mnemonic-derived keypair |
| `backup_owner` | `Option<Pubkey>` | Optional recovery address (Optio) |
| `lamport_balance` | `u64` | Tracked SOL balance |
| `testudos` | `Vec<TestudoData>` | Registry of token mint + ATA pubkey pairs |
| `created_at` | `u64` | Unix timestamp |
| `last_accessed` | `u64` | Updated on every deposit/withdrawal |

#### Testudo (Per-Token Account)

Not a custom account — Testudos are standard **Associated Token Accounts (ATAs)** owned by the Centurion PDA. The Centurion's `testudos` vector tracks which mints have been initialized.

### PDA Derivation

| Account | Seeds | Program |
|---|---|---|
| Legate | `["legate"]` | Testudo |
| Centurion | `["centurion", authority]` | Testudo |
| Testudo (ATA) | `[centurion_key, token_program_id, mint_key]` | Associated Token Program |

### Instruction Set

#### Account Management

| Instruction | Signers | Description |
|---|---|---|
| `init_legate` | authority | Creates the global Legate config (admin only) |
| `init_centurion` | authority | Creates a user's Centurion PDA with password pubkey and optional backup |
| `init_testudo` | authority | Creates an ATA for a whitelisted mint under the user's Centurion |
| `close_testudo` | authority + password | Transfers remaining tokens (minus fee) to user, closes ATA |
| `close_centurion` | authority + password | Withdraws SOL (minus fee), closes PDA. Requires all Testudos closed first |
| `close_legate` | authority | Closes the Legate account (admin only) |

#### Deposits (wallet signature only)

| Instruction | Description |
|---|---|
| `deposit_sol` | Transfers SOL from user wallet to Centurion PDA |
| `deposit_spl` | Transfers SPL tokens from user's ATA to Centurion's Testudo ATA |

#### Withdrawals (dual signature required)

| Instruction | Description |
|---|---|
| `withdraw_sol` | Withdraws specified SOL amount (minus fee) to user wallet |
| `withdraw_spl` | Withdraws specified token amount (minus fee) to user's ATA |
| `withdraw_sol_to_backup` | Emergency: sends all SOL (minus fee) to the backup address |
| `withdraw_spl_to_backup` | Emergency: sends all tokens (minus fee) to the backup address |

#### Legate Admin (admin authority only)

| Instruction | Description |
|---|---|
| `update_authority` | Transfers Legate ownership (requires both old and new authority signatures) |
| `update_fee_percent` | Updates the fee basis points |
| `update_max_testudos` | Increases max token accounts per user |
| `update_max_whitelisted_mints` | Increases max whitelist size (triggers account realloc) |
| `update_treasury` | Changes the fee recipient address |
| `add_mint_to_testudo_token_whitelist` | Adds a new SPL token to the whitelist |

#### Centurion Config (dual signature required)

| Instruction | Description |
|---|---|
| `update_back_up_account` | Sets or updates the backup owner (Optio) address |

#### Swaps (dual signature required)

| Instruction | Description |
|---|---|
| `swap` | Executes a token swap via Jupiter CPI directly from the Centurion PDA |

### Fee Model

- **Deposits**: Free — no fees on inbound transfers.
- **Withdrawals & Closes**: A configurable fee (default 0.15%) is deducted and sent to the treasury before the remainder reaches the user.
- Fees are calculated and transferred atomically within each instruction.

### Jupiter Swap Integration

The `swap` instruction performs a Cross-Program Invocation (CPI) to Jupiter (program `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`). It accepts serialized Jupiter setup, swap, and cleanup instructions along with account index mappings, allowing the Centurion PDA to execute swaps as the token owner. The destination mint must be in the Legate whitelist, and a new Testudo ATA is created on-the-fly if the user doesn't already hold that token.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Anchor Framework (v0.31.1) |
| Blockchain | Solana |
| Client SDK | @coral-xyz/anchor (0.30.1), @solana/web3.js, @solana/spl-token |
| Key Derivation | BIP39 mnemonic, ed25519-hd-key, tweetnacl |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, DaisyUI |
| State Management | Jotai, TanStack React Query |
| Wallet Integration | Solana Wallet Adapter |
| Testing | ts-mocha (on-chain), Jest (client) |

---

## Project Structure

```
testudo/
├── anchor/
│   ├── programs/testudo/src/
│   │   ├── lib.rs                          # Program entrypoint & instruction dispatch
│   │   ├── instructions/
│   │   │   ├── account_management/         # init/close for Legate, Centurion, Testudo
│   │   │   ├── deposit/                    # deposit_sol, deposit_spl
│   │   │   ├── withdraw/                   # withdraw_sol/spl, withdraw_to_backup
│   │   │   ├── legate_admin/               # Admin config instructions
│   │   │   ├── centurion_config/           # update_back_up_account
│   │   │   └── swaps/                      # Jupiter swap CPI
│   │   └── state/                          # Account structs & error definitions
│   ├── tests/
│   │   └── testudo.spec.ts                 # Integration tests
│   └── Anchor.toml
├── src/
│   ├── app/                                # Next.js frontend
│   └── scripts/                            # Deployment & utility scripts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Rust** v1.77.2+
- **Solana CLI** v1.18.17+
- **Anchor CLI** v0.30.1+
- **Node.js** v18.18.0+
- **pnpm** (or npm)

### Installation

```bash
git clone https://github.com/WillShirley13/testudo.git
cd testudo
pnpm install
```

### Build & Test

```bash
# Build the Anchor program
pnpm anchor-build

# Run integration tests (starts a local validator automatically)
pnpm anchor-test

# Start a local validator with the program deployed
pnpm anchor-localnet
```

### Deployment

#### Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2  # if needed
pnpm anchor deploy --provider.cluster devnet
```

#### Mainnet

```bash
solana config set --url <your-rpc-url>
pnpm anchor deploy --provider.cluster mainnet
```

After deployment, sync the program ID if it has changed:

```bash
pnpm anchor keys sync
```

---

## Frontend

A Next.js application providing wallet connection, account management, deposits, withdrawals, and swap functionality. Start it with:

```bash
pnpm dev
```

---
<<<<<<< HEAD
=======

## License

MIT — see [LICENSE](./LICENSE) for details.


Build the web app
>>>>>>> 33e191ce7573f456c61b779042b32bb779030ccd

## License

MIT — see [LICENSE](./LICENSE) for details.
