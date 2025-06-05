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
import { admin } from "./devnet_keys/admin-keypair.json";
import { treasury } from "./devnet_keys/treasury-keypair.json";
import { admin2 } from "./devnet_keys/admin-keypair2.json";


async function main() {
	// 2. Load keypairs
	const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(admin));
	const treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(treasury));
	const adminKeypair2 = Keypair.fromSecretKey(Uint8Array.from(admin2));

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

	// 6. Call updateTreasury
	console.log("Updating fee percent to:", 15);
	const tx = await program.methods
		.updateAuthority()
		.accountsPartial({
			authority: adminKeypair.publicKey,
			newAuthority: adminKeypair2.publicKey,
		})
		.signers([adminKeypair, adminKeypair2])
		.rpc();

	console.log("Transaction signature:", tx);

	// 7. Confirm and print new treasury
	const updatedLegate = await program.account.legate.fetch(legatePDA);
	console.log("New authority:", updatedLegate.authority);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});