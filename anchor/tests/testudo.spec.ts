import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../target/types/testudo";
import * as web3 from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import {
	createInitializeMintInstruction,
	TOKEN_PROGRAM_ID,
	MINT_SIZE,
	getMinimumBalanceForRentExemptMint,
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo,
} from "@solana/spl-token";
import { SecureKeypairGenerator } from "./keypair_functions";

import { expect } from "chai";
import { assert } from "console";

// Main test suite
describe("Testudo Tests", () => {
	// Configure the client and declare variables at the describe level
	anchor.setProvider(anchor.AnchorProvider.env());
	const program = anchor.workspace.Testudo as Program<Testudo>;
	const provider = anchor.getProvider() as anchor.AnchorProvider;
	const connection = new Connection("http://localhost:8899", "confirmed");
	const legateAuthority = anchor.web3.Keypair.generate();
	const testUser = anchor.web3.Keypair.generate();
	
	// Declare variables that will be initialized in before()
	let mintPubkey: PublicKey;
	let ata: any;
	let token_info: any;
	
	// Setup keyManager and related variables
	let keyManager = new SecureKeypairGenerator();
	let phrase = keyManager.generateRandomPhrase();
	let { keypair: passwordKeypair } = keyManager.deriveKeypairFromWords(phrase);
	let { keypair: backupOwnerKeypair } = keyManager.deriveKeypairFromWords(phrase);

	// Global setup - runs once before all tests
	before(async () => {
		// Log initial information
		console.log("==== TEST ENVIRONMENT SETUP ====");
		console.log(`Program ID: ${program.programId.toBase58()}`);
		console.log(`legateAuthority: ${legateAuthority.publicKey.toBase58()}`);
		console.log(`Password phrase: ${phrase}`);
		console.log(`Password public Key: ${passwordKeypair.publicKey.toBase58()}`);
		console.log(`Backup Owner Public Key: ${backupOwnerKeypair.publicKey.toBase58()}`);
		
		// Airdrop and initialize variables
		let airdropTx = await connection.requestAirdrop(
			testUser.publicKey,
			web3.LAMPORTS_PER_SOL * 3
		);
		await connection.confirmTransaction(
			{
				signature: airdropTx,
				blockhash: (await connection.getLatestBlockhash()).blockhash,
				lastValidBlockHeight: (
					await connection.getLatestBlockhash()
				).lastValidBlockHeight,
			},
			"confirmed"
		);
		
		// Initialize the variables that were declared in the outer scope
		mintPubkey = await createMint(
			connection,
			testUser,
			testUser.publicKey,
			null,
			8
		);
		console.log(`Mint: ${mintPubkey.toBase58()}`);
		
		ata = await getOrCreateAssociatedTokenAccount(
			connection,
			testUser,
			mintPubkey,
			testUser.publicKey
		);
		
		// Mint tokens
		const amount = 100 * 10 ** 8;
		const mintTx = await mintTo(
			connection, // connection
			testUser, // payer (must be the mint authority)
			mintPubkey, // mint address
			ata.address, // destination ATA
			testUser, // mint authority
			amount // amount to mint (in smallest units)
		);
		
		token_info = await connection.getTokenAccountBalance(ata.address);
		console.log(`ATA balance: ${token_info.value.uiAmount}\n`);
		console.log("==== SETUP COMPLETE ====\n");
	});

	// Group 1: Legate Administration Tests
	describe("Legate Administration", () => {
		
		before(async () => {
			console.log("==== STARTING LEGATE ADMIN TESTS ====");
			// Airdrop SOL to the legate authority so they can perform transactions
			const airdropTx = await connection.requestAirdrop(
				legateAuthority.publicKey,
				web3.LAMPORTS_PER_SOL * 100
			);
			await connection.confirmTransaction(
				{
					signature: airdropTx,
					blockhash: (await connection.getLatestBlockhash()).blockhash,
					lastValidBlockHeight: (
						await connection.getLatestBlockhash()
					).lastValidBlockHeight,
				},
				"confirmed"
			);
		});
		
		it("Initialize Legate", async () => {
			// Initialize the global Legate account which manages the Testudo system parameters
			const tx = await program.methods
				.initLegate()
				.accounts({
					authority: legateAuthority.publicKey,
				})
				.signers([legateAuthority])
				.rpc();
			console.log(`Legate initialization tx: ${tx}`);
			
			// legatePDA: The Program Derived Address of the Legate account
			// This is the global configuration account for the Testudo system
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			const legate = await program.account.legate.fetch(legatePDA);

			// Test that the legate account has been properly initialized
			expect(legate.isInitialized, "Legate should be initialized").to.equal(
				true
			);
			expect(
				legate.authority.toBase58(),
				"Legate authority should match authority passed in initLegate instruction"
			).to.equal(legateAuthority.publicKey.toBase58());
			expect(
				legate.maxTestudosPerUser,
				"Max testudos per user should be 30"
			).to.equal(30);
		});

		it("Should fail when initializing legate again", async () => {
			try {
				await program.methods
					.initLegate()
					.accounts({
						authority: legateAuthority.publicKey,
					})
					.signers([legateAuthority])
					.rpc();
				expect.fail("Should have thrown an error");
			} catch (error) {
				console.log("Error successfully thrown when trying to initialize legate again");
			}
		});
		
		it("Update max testudos per user", async () => {
			const newMaxTestudosPerUser = 50;
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			const legate = await program.account.legate.fetch(legatePDA);
			console.log(
				`Legate max testudos per user (before update): ${legate.maxTestudosPerUser}`
			);
			
			const tx = await program.methods
				.updateMaxTestudos(newMaxTestudosPerUser)
				.accounts({
					authority: legateAuthority.publicKey,
				})
				.signers([legateAuthority])
				.rpc();
				
			const legateAfterUpdate = await program.account.legate.fetch(legatePDA);
			
			// Test that the maxTestudosPerUser value has been updated correctly
			expect(
				legateAfterUpdate.maxTestudosPerUser,
				"Max testudos per user should match new value"
			).to.equal(newMaxTestudosPerUser);
		});

		it("Update max whitelisted mints", async () => {
			const newMaxWhitelistedMints = 100;
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			const legate = await program.account.legate.fetch(legatePDA);
			
			let oldSize = (await connection.getAccountInfo(legatePDA))?.data.length;
			console.log(`Size of legate before update: ${oldSize}`);

			const tx = await program.methods
				.updateMaxWhitelistedMints(newMaxWhitelistedMints)
				.accounts({
					authority: legateAuthority.publicKey,
				})
				.signers([legateAuthority])
				.rpc();
			await connection.confirmTransaction(
				{
					signature: tx,
					blockhash: (await connection.getLatestBlockhash()).blockhash,
					lastValidBlockHeight: (
						await connection.getLatestBlockhash()
					).lastValidBlockHeight,
				},
				"confirmed"
			);

			const legateAfterUpdate = await program.account.legate.fetch(legatePDA);
			let newSize = (await connection.getAccountInfo(legatePDA))?.data.length;
			
			// Verify updates
			expect(
				legateAfterUpdate.maxWhitelistedMints,
				"Max whitelisted mints should match new value"
			).to.equal(newMaxWhitelistedMints);
			expect(newSize, "New size of legate should be 8159 bytes").to.equal(
				8159
			);
		});

		it("Update authority with proper permissions", async () => {
			const newAuthority = anchor.web3.Keypair.generate();
			console.log(`New authority: ${newAuthority.publicKey.toBase58()}`);
			
			const tx = await program.methods
				.updateAuthority()
				.accounts({
					authority: legateAuthority.publicKey,
					newAuthority: newAuthority.publicKey,
				})
				.signers([legateAuthority, newAuthority])
				.rpc();

			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			const legate = await program.account.legate.fetch(legatePDA);
			
			// Verify the authority was updated
			expect(
				legate.authority.toBase58(),
				"Legate authority should match new authority"
			).to.equal(newAuthority.publicKey.toBase58());

			// Update Legate authority back to original for subsequent tests
			const reverseAuthorityUpdatetx = await program.methods
				.updateAuthority()
				.accounts({
					authority: newAuthority.publicKey,
					newAuthority: legateAuthority.publicKey,
				})
				.signers([legateAuthority, newAuthority])
				.rpc();
		});

		it("Should fail when updating authority without proper permissions", async () => {
			const newAuthority = anchor.web3.Keypair.generate();
			const wrongAuthority = anchor.web3.Keypair.generate();
			
			try {
				await program.methods
					.updateAuthority()
					.accounts({
						authority: wrongAuthority.publicKey,
						newAuthority: newAuthority.publicKey,
					})
					.signers([wrongAuthority, newAuthority])
					.rpc();
				expect.fail("Should have thrown an error");
			} catch (error) {
				console.log("Error successfully thrown when updating with wrong authority");
			}
		});
		
		it("Add new mint to the approved whitelist", async () => {
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);

			let addMintTx = await program.methods.addMintTestudo({
				tokenMint: mintPubkey,
				tokenName: "TesterToken",
				tokenSymbol: "TT",
				tokenDecimals: token_info.value.decimals
				})
				.accounts({
					authority: legateAuthority.publicKey
				})
				.signers([legateAuthority])
				.rpc();
			
			await connection.confirmTransaction(
				{
					signature: addMintTx,
					blockhash: (await connection.getLatestBlockhash()).blockhash,
					lastValidBlockHeight: (
						await connection.getLatestBlockhash()
					).lastValidBlockHeight,
				},
				"confirmed"
			);
			
			let legate = await program.account.legate.fetch(legatePDA);
			
			// Verify the mint was added to the whitelist
			console.log("Approved tokens:");
			legate.testudoTokenWhitelist.forEach((whitelist) => {
				console.log(`Token mint: ${whitelist.tokenMint.toBase58()}`);
				console.log(`Token name: ${whitelist.tokenName}\n`);
			});
			
			// Check that at least one whitelisted token exists
			expect(legate.testudoTokenWhitelist.length).to.be.greaterThan(0);
			// Verify the added mint is in the whitelist
			expect(
				legate.testudoTokenWhitelist[1].tokenMint.toBase58()
			).to.equal(mintPubkey.toBase58());
		});
	});

	// Group 2: Centurion Account Tests
	describe("Centurion Account Operations", () => {
		
		before(async () => {
			console.log("\n==== STARTING CENTURION ACCOUNT TESTS ====");
		});
		
		it("Create Centurion account", async () => {
			// Initializes a user account (Centurion) for the test user with password protection
			let initCenturionTx = await program.methods
				.initCenturion(
					passwordKeypair.publicKey,
					backupOwnerKeypair.publicKey
				)
				.accounts({
					authority: testUser.publicKey,
				})
				.signers([testUser])
				.rpc();
			console.log(`Init Centurion tx: ${initCenturionTx}`);

			// centurionPDA: The Program Derived Address for this user's Centurion account
			let [centurionPDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("centurion"), testUser.publicKey.toBuffer()],
				program.programId
			);
			let centurion = await program.account.centurion.fetch(centurionPDA);
			
			// Verify the account was created correctly
			expect(
				centurion.pubkeyToPassword.toBase58(),
				"Pubkey to password should match password keypair public key"
			).to.equal(passwordKeypair.publicKey.toBase58());
		});

		it("Deposit SOL to Centurion account", async () => {
			let [centurionPDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("centurion"), testUser.publicKey.toBuffer()],
				program.programId
			);
			let centurionLamports = await connection.getBalance(centurionPDA);
			console.log(
				`Centurion balance BEFORE deposit: ${
					centurionLamports / web3.LAMPORTS_PER_SOL
				} SOL`
			);

			let depositSolTx = await program.methods
				.depositSol(new anchor.BN(1.5 * web3.LAMPORTS_PER_SOL))
				.accounts({
					authority: testUser.publicKey,
				})
				.signers([testUser])
				.rpc();
			await connection.confirmTransaction(
				{
					signature: depositSolTx,
					blockhash: (await connection.getLatestBlockhash()).blockhash,
					lastValidBlockHeight: (
						await connection.getLatestBlockhash()
					).lastValidBlockHeight,
				},
				"confirmed"
			);

			let centurion = await program.account.centurion.fetch(centurionPDA);
			console.log(
				`Centurion balance AFTER deposit: ${
					(await connection.getBalance(centurionPDA)) /
					web3.LAMPORTS_PER_SOL
				} SOL`
			);

			// Verify the deposit was successful
			expect(
				await connection.getBalance(centurionPDA),
				"Centurion balance should be at least 1.5 SOL"
			).to.greaterThan(1.5 * web3.LAMPORTS_PER_SOL);
			expect(
				centurion.lamportBalance.toNumber(),
				"Centurion account data should show 1.5 SOL"
			).to.equal(1.5 * web3.LAMPORTS_PER_SOL);
		});

		it("Should fail when depositing more SOL than available", async () => {
			console.log(
				`Test User Balance BEFORE deposit: ${
					(await connection.getBalance(testUser.publicKey)) /
					web3.LAMPORTS_PER_SOL
				} SOL`
			);
			
			try {
				await program.methods
					.depositSol(new anchor.BN(100_000_000 * web3.LAMPORTS_PER_SOL))
					.accounts({
						authority: testUser.publicKey,
					})
					.signers([testUser])
					.rpc();
				expect.fail("Should have thrown an error");
			} catch (error) {
				console.log("Error successfully thrown when depositing more SOL than available");
			}
		});

		it("Withdraw SOL from Centurion account with password authentication", async () => {
			let [centurionPDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("centurion"), testUser.publicKey.toBuffer()],
				program.programId
			);

			console.log(
				`Test User Balance BEFORE withdraw: ${
					(await connection.getBalance(testUser.publicKey)) /
					web3.LAMPORTS_PER_SOL
				} SOL`
			);
			console.log(
				`Centurion balance BEFORE withdraw: ${
					(await connection.getBalance(centurionPDA)) /
					web3.LAMPORTS_PER_SOL
				} SOL`
			);

			// Withdraw SOL requiring both account owner and password signatures
			let withdrawSolTx = await program.methods
				.withdrawSol(new anchor.BN(0.7 * web3.LAMPORTS_PER_SOL))
				.accountsPartial({
					authority: testUser.publicKey,
					validSignerOfPassword: passwordKeypair.publicKey,
				})
				.signers([testUser, passwordKeypair])
				.rpc();
			await connection.confirmTransaction(withdrawSolTx);

			console.log(
				`Test User Balance AFTER withdraw: ${
					(await connection.getBalance(testUser.publicKey)) /
					web3.LAMPORTS_PER_SOL
				} SOL`
			);
			console.log(
				`Centurion balance AFTER withdraw: ${
					(await connection.getBalance(centurionPDA)) /
					web3.LAMPORTS_PER_SOL
				} SOL`
			);

			let centurion = await program.account.centurion.fetch(centurionPDA);

			// Verify the withdrawal was successful
			expect(
				await connection.getBalance(centurionPDA),
				"Centurion balance should be above 0.79 SOL"
			).to.greaterThan(0.79 * web3.LAMPORTS_PER_SOL);
			expect(
				await connection.getBalance(centurionPDA),
				"Centurion balance should be below 0.82 SOL"
			).to.lessThan(0.82 * web3.LAMPORTS_PER_SOL);
			expect(
				centurion.lamportBalance.toNumber(),
				"Centurion account data should show 0.8 SOL"
			).to.equal(0.8 * web3.LAMPORTS_PER_SOL);
		});
	});
});
