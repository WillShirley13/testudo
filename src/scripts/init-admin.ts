#!/usr/bin/env ts-node
/**
 * Initialize Admin Account (Legate) for Testudo Program
 *
 * This script initializes the Legate account which acts as the admin
 * configuration for the Testudo program. It uses the default Solana CLI
 * keypair as a payer and uses an existing admin keypair from the keys directory.
 *
 * Usage:
 * 1. For local deployment:
 *    - Start local validator: `solana-test-validator`
 *    - Deploy program: `cd anchor && anchor deploy`
 *    - Run this script: `ts-node scripts/init-admin.ts`
 * 
 * 2. For devnet deployment:
 *    - Deploy program to devnet: `cd anchor && anchor deploy --provider.cluster devnet`
 *    - Run this script with devnet flag: `ts-node scripts/init-admin.ts --devnet`
 */

const anchor = require("@coral-xyz/anchor");
const { Program, AnchorProvider } = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

// Program ID from Anchor.toml
const PROGRAM_ID = "8ZkK4KPmwwskr2YTjejuHL2sHYyvSmkZauUJY7gyrZ5U";

// Define types for the program accounts
interface TestudoAccounts {
	legate: {
		fetch(address: typeof PublicKey): Promise<{
			isInitialized: boolean;
			authority: typeof PublicKey;
			maxTestudosPerUser: number;
			maxWhitelistedMints: number;
			testudoTokenWhitelist: any[];
		}>;
	};
}

async function main() {
	console.log("==== Testudo Admin Initialization Script ====");

	// Check for devnet flag in command line arguments
	const useDevnet = process.argv.includes("--devnet");
	const network = useDevnet ? "devnet" : "localnet";
	console.log(`Using ${network} network`);

	// Set up connection based on selected network
	const connection = useDevnet 
		? new Connection(clusterApiUrl("devnet"), "confirmed")
		: new Connection("http://localhost:8899", "confirmed");

	// Load default keypair as payer
	const homeDir = process.env.HOME || process.env.USERPROFILE || "";
	const payerKeyPath = path.resolve(homeDir, ".config/solana/id.json");

	let payerKeypair;
	try {
		const payerKeyData = JSON.parse(fs.readFileSync(payerKeyPath, "utf-8"));
		payerKeypair = Keypair.fromSecretKey(Uint8Array.from(payerKeyData));
		console.log(
			`Loaded payer keypair: ${payerKeypair.publicKey.toBase58()}`
		);
	} catch (err) {
		console.error("Failed to load payer keypair:", err);
		console.error(
			"Make sure you have a default keypair at ~/.config/solana/id.json"
		);
		process.exit(1);
	}

	// Check payer's SOL balance
	const balance = await connection.getBalance(payerKeypair.publicKey);
	const solBalance = balance / 1_000_000_000; // Convert lamports to SOL
	console.log(`Payer balance: ${solBalance} SOL`);

	// Only airdrop on localnet; devnet requires manual funding
	if (solBalance < 1 && !useDevnet) {
		console.log("Airdropping 2 SOL to payer...");
		const airdropTx = await connection.requestAirdrop(
			payerKeypair.publicKey,
			2_000_000_000
		);
		await connection.confirmTransaction(airdropTx);
		console.log("Airdrop completed!");
	} else if (solBalance < 1 && useDevnet) {
		console.error("Insufficient SOL balance for devnet operations");
		console.error("Please fund your wallet using the Solana CLI:");
		console.error(`solana airdrop 1 ${payerKeypair.publicKey.toBase58()} --url devnet`);
		console.error("Or fund it from a faucet: https://faucet.solana.com/");
		process.exit(1);
	}

	// Load the existing admin keypair from the keys directory
	let adminKeypair;
	try {
		// Get the current working directory and construct the path to the admin keypair
		const currentDir = process.cwd();
		const adminKeyPath = path.join(currentDir, "src", "scripts", "keys", "admin");
		console.log(`Looking for admin keypair at: ${adminKeyPath}`);
		
		const adminKeyData = JSON.parse(fs.readFileSync(adminKeyPath, "utf-8"));
		adminKeypair = Keypair.fromSecretKey(Uint8Array.from(adminKeyData));
		console.log(`Loaded admin keypair: ${adminKeypair.publicKey.toBase58()}`);
	} catch (err) {
		console.error("Failed to load admin keypair:", err);
		console.error("Make sure the admin keypair exists at src/scripts/keys/admin");
		process.exit(1);
	}

	// Check admin's SOL balance
	const adminBalance = await connection.getBalance(adminKeypair.publicKey);
	const adminSolBalance = adminBalance / 1_000_000_000; // Convert lamports to SOL
	console.log(`Admin balance: ${adminSolBalance} SOL`);

	// Only airdrop on localnet; devnet requires manual funding
	if (adminSolBalance < 1 && !useDevnet) {
		console.log("Airdropping 2 SOL to admin...");
		const airdropTx = await connection.requestAirdrop(
			adminKeypair.publicKey,
			2_000_000_000
		);
		await connection.confirmTransaction(airdropTx);
		console.log("Airdrop completed!");
	} else if (adminSolBalance < 1 && useDevnet) {
		console.log("Airdropping 1 SOL to admin on devnet...");
		const airdropTx = await connection.requestAirdrop(
			adminKeypair.publicKey,
			1_000_000_000
		);
		try {
			await connection.confirmTransaction(airdropTx);
			console.log("Airdrop completed!");
		} catch (err) {
			console.error("Devnet airdrop failed, manually funding admin from payer...");
			// Transfer 0.1 SOL from payer to admin
			const transaction = new anchor.web3.Transaction().add(
				anchor.web3.SystemProgram.transfer({
					fromPubkey: payerKeypair.publicKey,
					toPubkey: adminKeypair.publicKey,
					lamports: 100_000_000, // 0.1 SOL
				})
			);
			const txSignature = await anchor.web3.sendAndConfirmTransaction(
				connection,
				transaction,
				[payerKeypair]
			);
			console.log(`Transfer complete: ${txSignature}`);
		}
	}

	// Calculate PDA for Legate account
	const [legatePDA] = PublicKey.findProgramAddressSync(
		[Buffer.from("legate")],
		new PublicKey(PROGRAM_ID)
	);
	console.log(`Legate PDA: ${legatePDA.toBase58()}`);

	// Set up Anchor provider and program
	const provider = new AnchorProvider(
		connection,
		new anchor.Wallet(adminKeypair),
		{ commitment: "confirmed" }
	);
	anchor.setProvider(provider);

	// Load the IDL from the deployed program
	let idl;
	try {
		// Try to fetch the IDL from the deployed program
		try {
			idl = await Program.fetchIdl(PROGRAM_ID, provider);
			if (!idl) {
				throw new Error("IDL not found");
			}
			console.log("Successfully fetched IDL from the network");
		} catch (fetchErr) {
			// If fetching fails, try to load from local file
			console.log("Failed to fetch IDL from network, trying local file...");
			const idlPath = path.join(process.cwd(), "anchor", "target", "idl", "testudo.json");
			console.log(`Looking for IDL at: ${idlPath}`);
			
			try {
				const idlContent = fs.readFileSync(idlPath, "utf-8");
				idl = JSON.parse(idlContent);
				console.log("Successfully loaded IDL from local file");
			} catch (localErr) {
				throw new Error(`Failed to load local IDL: ${localErr instanceof Error ? localErr.message : String(localErr)}`);
			}
		}
	} catch (err) {
		console.error("Failed to load IDL:", err);
		console.error(
			"Make sure you've deployed the program or have a local IDL file at anchor/target/idl/testudo.json"
		);
		process.exit(1);
	}

	const programId = new PublicKey(PROGRAM_ID);
	const program = new Program(idl, provider);

	try {
		// Check if Legate account already exists
		try {
			const legate = await program.account.legate.fetch(legatePDA);
			console.log("Legate account already exists!");
			console.log(`Current authority: ${legate.authority.toBase58()}`);
			console.log(`Max testudos per user: ${legate.maxTestudosPerUser}`);
			console.log(`Max whitelisted mints: ${legate.maxWhitelistedMints}`);
			console.log("No initialization needed.");
			return;
		} catch (e) {
			// Account doesn't exist, continue with initialization
			console.log("Legate account does not exist. Initializing...");
		}

		// Initialize the Legate account with the admin keypair as the authority
		console.log("Initializing Legate account...");
		const tx = await program.methods
			.initLegate()
			.accounts({
				authority: adminKeypair.publicKey,
				legate: legatePDA,
				systemProgram: anchor.web3.SystemProgram.programId,
			})
			.signers([adminKeypair])
			.rpc();

		console.log(`Legate initialization transaction: ${tx}`);

		// Verify the Legate account was created
		const legate = await program.account.legate.fetch(legatePDA);
		console.log("\nLegate account initialized successfully!");
		console.log(`Authority: ${legate.authority.toBase58()}`);
		console.log(`Max testudos per user: ${legate.maxTestudosPerUser}`);

		console.log("\n==== INITIALIZATION COMPLETE ====");
		console.log("You can now use the pre-existing admin keypair for admin operations");
	} catch (error) {
		console.error("Error initializing Legate account:", error);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
