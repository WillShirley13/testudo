#!/usr/bin/env ts-node
/**
 * Update Treasury Account for Legate (Devnet)
 *
 * This script updates the treasury account in the Legate configuration.
 *
 * Usage: ts-node scripts/update-treasury.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, clusterApiUrl, Connection } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../../anchor/target/types/testudo";
import idl from "../../anchor/target/idl/testudo.json";
import { admin } from "./keys/admin-keypair.json";
import { treasury } from "./keys/treasury-keypair.json";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

async function main() {
	// 2. Load keypairs
	const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(admin));
	const treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(treasury));

	// 3. Set up connection and provider
	const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
	const wallet = new anchor.Wallet(adminKeypair);
	const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
	anchor.setProvider(provider);

	// 4. Create program
	const program = new Program<Testudo>(idl as Testudo, provider);
	const PROGRAM_ID = program.programId;

	// 5. Find Legate PDA
	const [legatePDA] = PublicKey.findProgramAddressSync([Buffer.from("legate")], PROGRAM_ID);

    const mintPubkey = new PublicKey("H31E6gsTMT6x1vJWphxDgGfnMoHQpkKsS4wbBrSJcXRX");
	const mintInfo = {
		tokenMint: mintPubkey,
		tokenName: "Burk",
		tokenSymbol: "BRK",
		tokenDecimals: 9 // Adjust to your token's decimal places
	};


	// 6. Call updateTreasury
	console.log("Adding mint to whitelist:", mintInfo);
	const tx = await program.methods
		.addMintToTestudoTokenWhitelist(mintInfo)
		.accountsPartial({
			authority: adminKeypair.publicKey,
            treasury: treasuryKeypair.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            mint: mintPubkey,
		})
		.signers([adminKeypair])
		.rpc();

	console.log("Transaction signature:", tx);

	// 7. Confirm and print new treasury
	const updatedLegate = await program.account.legate.fetch(legatePDA);
	console.log("New mint added to whitelist:", updatedLegate.testudoTokenWhitelist);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
