# Testudo - Secure Solana Wallet System

Testudo is a secure wallet system on Solana that implements a dual-signature security model. This repository contains both the on-chain program and the frontend application.

## Security Model

Each user owns a "Centurion" account that acts as their main wallet container. A Centurion can hold multiple token accounts (called "Testudos") for different SPL tokens.

The key security innovation is a dual-signature system: all fund withdrawals require:
1. The user's wallet signature
2. A signature from a special keypair derived from a memorable 6-word mnemonic phrase

This creates an on-chain 2FA experience, where the public key of this password-derived keypair is stored in the Centurion account for verification during transactions.

## Development Environments

### Local Development
For local development, you'll need to:
1. Start a local Solana validator: `solana-test-validator`
2. Build and deploy the program: `npm run anchor-build && cd anchor && anchor deploy`
3. Initialize the admin account: `ts-node scripts/init-admin.ts`
4. Start the frontend: `npm run dev`

### Devnet Deployment (Recommended)
We've configured the project to easily deploy to Solana's devnet:

1. Configure your Solana CLI for devnet:
   ```
   solana config set --url https://api.devnet.solana.com
   ```

2. Ensure your wallet has SOL:
   ```
   solana balance
   ```
   If needed, request an airdrop:
   ```
   solana airdrop 1
   ```

3. Verify that the admin keypair exists:
   The project uses a pre-existing admin keypair from the `keys/admin` file. Make sure this file exists.

4. Deploy the program and initialize admin:
   ```
   npm run deploy-devnet
   ```
   This will:
   - Build the Anchor program
   - Deploy to devnet
   - Initialize the admin account using the existing keypair

5. Alternatively, for a more guided experience, use:
   ```
   npm run deploy-devnet-script
   ```
   This interactive script will check prerequisites and guide you through deployment.

6. Start the frontend:
   ```
   npm run dev
   ```

7. The frontend will automatically connect to devnet. You can switch between networks using the network indicator in the header.

## Frontend Features

- Modern React application built with Next.js and Tailwind CSS
- Wallet connection using Solana Wallet Adapter
- Network selector for easy switching between devnet and localnet
- Dashboard for managing your Centurion and Testudo accounts
- Secure token deposit and withdrawal

## Program Operations

The Testudo program supports:
- Creating Centurion accounts with password-derived security
- Creating Testudo accounts for different SPL tokens
- Depositing tokens
- Withdrawing tokens (requiring dual signatures)
- Setting backup owner accounts for recovery

## License

See the LICENSE file for details.

## Getting Started

### Prerequisites

- Node v18.18.0 or higher

- Rust v1.77.2 or higher
- Anchor CLI 0.30.1 or higher
- Solana CLI 1.18.17 or higher

### Installation

#### Clone the repo

```shell
git clone <repo-url>
cd <repo-name>
```

#### Install Dependencies

```shell
pnpm install
```

#### Start the web app

```
pnpm dev
```

## Apps

### anchor

This is a Solana program written in Rust using the Anchor framework.

#### Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the
command with `pnpm`, eg: `pnpm anchor`.

#### Sync the program id:

Running this command will create a new keypair in the `anchor/target/deploy` directory and save the address to the
Anchor config file and update the `declare_id!` macro in the `./src/lib.rs` file of the program.

You will manually need to update the constant in `anchor/lib/basic-exports.ts` to match the new program id.

```shell
pnpm anchor keys sync
```

#### Build the program:

```shell
pnpm anchor-build
```

#### Start the test validator with the program deployed:

```shell
pnpm anchor-localnet
```

#### Run the tests

```shell
pnpm anchor-test
```

#### Deploy to Devnet

```shell
pnpm anchor deploy --provider.cluster devnet
```

### web

This is a React app that uses the Anchor generated client to interact with the Solana program.

#### Commands

Start the web app

```shell
pnpm dev
```

Build the web app

```shell
pnpm build
```
