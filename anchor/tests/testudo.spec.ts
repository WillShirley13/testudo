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
    TOKEN_2022_PROGRAM_ID,
    getMint,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { SecureKeypairGenerator } from "./keypair_functions";

import { expect } from "chai";
import { assert, log } from "console";

// Main test suite
describe("Testudo Tests", () => {
	// Configure the client and declare variables at the describe level
	anchor.setProvider(anchor.AnchorProvider.env());
	const program = anchor.workspace.Testudo as Program<Testudo>;
	const provider = anchor.getProvider() as anchor.AnchorProvider;
	const connection = new Connection("http://localhost:8899", "confirmed");
	const legateAuthority = anchor.web3.Keypair.generate();
    const legateTreasury = anchor.web3.Keypair.generate();
	const testUser = anchor.web3.Keypair.generate();
	
	// Declare variables that will be initialized in before()
	let mintPubkey: PublicKey;
	let ata: any;
	let token_info: any;
	
	// Setup keyManager and related variables
	let keyManager = new SecureKeypairGenerator();
	let phrase = keyManager.generateRandomPhrase(4);
	let { keypair: passwordKeypair } = keyManager.deriveKeypairFromWords(phrase);
	let { keypair: backupOwnerKeypair } = keyManager.deriveKeypairFromWords(phrase);

	// Global setup - runs once before all tests
	before(async () => {
		// Log initial information
		console.log("==== TEST ENVIRONMENT SETUP ====");
		console.log(`Program ID: ${program.programId.toBase58()}`);
        console.log(`legateAuthority: ${legateAuthority.publicKey.toBase58()}`);
		console.log(`legateTreasury: ${legateTreasury.publicKey.toBase58()}`);
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
			console.log("\n==== TEST: Initialize Legate - Creating global configuration account ====");
			// Initialize the global Legate account which manages the Testudo system parameters
			const tx = await program.methods
				.initLegate(legateTreasury.publicKey)
				.accountsPartial({
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
			console.log("\n==== TEST: Legate Double Initialization - Should Fail When Already Initialized ====");
			try {
				await program.methods
					.initLegate()
					.accountsPartial({
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
			console.log("\n==== TEST: Update Max Testudos Per User - Admin Parameter Update ====");
			const newMaxTestudosPerUser = 50;
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			let legate = await program.account.legate.fetch(legatePDA);
			console.log(
				`Legate max testudos per user (before update): ${legate.maxTestudosPerUser}`
			);
			
			const tx = await program.methods
				.updateMaxTestudos(newMaxTestudosPerUser)
				.accountsPartial({
					authority: legateAuthority.publicKey,
				})
				.signers([legateAuthority])
				.rpc();
			await connection.confirmTransaction(
				{
					signature: tx,
					blockhash: (await connection.getLatestBlockhash()).blockhash,
					lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
				},
				"confirmed"
			);
			const legateAfterUpdate = await program.account.legate.fetch(legatePDA);

            legate = await program.account.legate.fetch(legatePDA);
			console.log(
				`Legate max testudos per user (after update): ${legate.maxTestudosPerUser}`
			);
			
			// Test that the maxTestudosPerUser value has been updated correctly
			expect(
				legateAfterUpdate.maxTestudosPerUser,
				"Max testudos per user should match new value"
			).to.equal(newMaxTestudosPerUser);
		});

		it("Update max whitelisted mints", async () => {
			console.log("\n==== TEST: Update Max Whitelisted Mints - Admin Parameter Update ====");
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
				.accountsPartial({
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
				8193
			);
		});

		it("Update authority with proper permissions", async () => {
			console.log("\n==== TEST: Update Authority - Transfer Admin Rights with Proper Permissions ====");
			const newAuthority = anchor.web3.Keypair.generate();
			console.log(`New authority: ${newAuthority.publicKey.toBase58()}`);
			
			const tx = await program.methods
				.updateAuthority()
				.accountsPartial({
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
				.accountsPartial({
					authority: newAuthority.publicKey,
					newAuthority: legateAuthority.publicKey,
				})
				.signers([legateAuthority, newAuthority])
				.rpc();
		});

		it("Should fail when updating authority without proper permissions", async () => {
			console.log("\n==== TEST: Unauthorized Authority Update - Should Fail with Wrong Permissions ====");
			const newAuthority = anchor.web3.Keypair.generate();
			const wrongAuthority = anchor.web3.Keypair.generate();
			
			try {
				await program.methods
					.updateAuthority()
					.accountsPartial({
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
			console.log("\n==== TEST: Add New Mint - Whitelist Token for Testudo Usage ====");
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);

            let mintTokenProgram = (await connection.getAccountInfo(mintPubkey))?.owner;

			let addMintTx = await program.methods.addMintTestudo({
				tokenMint: mintPubkey,
				tokenName: "TesterToken",
				tokenSymbol: "TT",
				tokenDecimals: token_info.value.decimals
				})
				.accountsPartial({
					authority: legateAuthority.publicKey,
					treasury: legateTreasury.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    mint: mintPubkey,
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
				legate.testudoTokenWhitelist[0].tokenMint.toBase58()
			).to.equal(mintPubkey.toBase58());
		});

        it("Attempt to add the same mint to the whitelist again", async () => {
            console.log("\n==== TEST: Duplicate Mint Addition - Should Fail When Already Whitelisted ====");
            const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
            const legate = await program.account.legate.fetch(legatePDA);
            
            try {
                await program.methods
                    .addMintTestudo({
                        tokenMint: mintPubkey,
                        tokenName: "TesterToken",
                        tokenSymbol: "TT",
                        tokenDecimals: token_info.value.decimals
                    })
                    .accountsPartial({
                        authority: legateAuthority.publicKey
                    })
                    .signers([legateAuthority])
                    .rpc();
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when adding the same mint to the whitelist again: ${error}`);
                console.log("Approved tokens:");
                legate.testudoTokenWhitelist.forEach((whitelist) => {
                    console.log(`Token mint: ${whitelist.tokenMint.toBase58()}`);
                    console.log(`Token name: ${whitelist.tokenName}\n`);
                });
            }
        });
	});

	// Group 2: Centurion Account Tests
	describe("Centurion Account Operations", () => {
		
		before(async () => {
			console.log("\n==== STARTING CENTURION ACCOUNT TESTS ====");
		});

        var [centurionPDA, _] = PublicKey.findProgramAddressSync(
            [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
            program.programId
        );
		
		it("Create Centurion account", async () => {
			console.log("\n==== TEST: Create Centurion Account - Initialize User Account with Password Protection ====");
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
			console.log("\n==== TEST: Deposit SOL - Add Native SOL to Centurion Account ====");
			let centurionLamports = await connection.getBalance(centurionPDA);
			console.log(
				`Centurion balance BEFORE deposit: ${
					centurionLamports / web3.LAMPORTS_PER_SOL
				} SOL`
			);

            let treasuryLamportsBefore = await connection.getBalance(legateTreasury.publicKey);
            console.log(`Treasury balance BEFORE deposit: ${treasuryLamportsBefore / web3.LAMPORTS_PER_SOL} SOL`);

            let centurionBeforeDeposit = await program.account.centurion.fetch(centurionPDA);
            console.log(`Last accessed BEFORE deposit: ${centurionBeforeDeposit.lastAccessed}`);

            const depositAmount = 1.5 * web3.LAMPORTS_PER_SOL;
            // Calculate the fee (0.15%)
            const feeAmount = Math.floor(depositAmount * 15 / 10000);
            const amountAfterFee = depositAmount - feeAmount;
            console.log(`Deposit amount: ${depositAmount / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Fee amount (0.15%): ${feeAmount / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Amount after fee: ${amountAfterFee / web3.LAMPORTS_PER_SOL} SOL`);

            let depositSolTx = await program.methods
                .depositSol(new anchor.BN(depositAmount))
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
            let treasuryLamportsAfter = await connection.getBalance(legateTreasury.publicKey);
            console.log(
                `Centurion balance AFTER deposit: ${
                    (await connection.getBalance(centurionPDA)) /
                    web3.LAMPORTS_PER_SOL
                } SOL`
            );
            console.log(`Treasury balance AFTER deposit: ${treasuryLamportsAfter / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Treasury fee received: ${(treasuryLamportsAfter - treasuryLamportsBefore) / web3.LAMPORTS_PER_SOL} SOL`);

            let centurionAfterDeposit = await program.account.centurion.fetch(centurionPDA);
            console.log(`Last accessed AFTER deposit: ${centurionAfterDeposit.lastAccessed}`);

            // Verify the deposit was successful
            expect(
                await connection.getBalance(centurionPDA),
                "Centurion balance should include the full deposit amount"
            ).to.be.greaterThan(depositAmount - 10000); // Allow small tolerance for transaction fees
            expect(
                centurion.lamportBalance.toNumber(),
                "Centurion account data should show the full deposit amount"
            ).to.equal(depositAmount);
            
            // Verify that the treasury did NOT receive a fee (fees are now on withdrawal only)
            expect(
                treasuryLamportsAfter - treasuryLamportsBefore,
                "Treasury should not have received a fee on deposit"
            ).to.equal(0);
        });

		it("Should fail when depositing more SOL than available", async () => {
			console.log("\n==== TEST: Excessive SOL Deposit - Should Fail When Insufficient Funds ====");
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
			console.log("\n==== TEST: Withdraw SOL - Remove Native SOL Using Password Authentication ====");
			let testUserBalanceBefore = await connection.getBalance(testUser.publicKey);
			console.log(`Test User Balance BEFORE withdraw: ${testUserBalanceBefore / web3.LAMPORTS_PER_SOL} SOL`);
			
			// Get the Legate PDA to check treasury balances
			let [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			let legate = await program.account.legate.fetch(legatePDA);
			
			// Check treasury balance before withdrawal
			const treasuryBalanceBefore = await connection.getBalance(legate.treasuryAcc);
			console.log(`Treasury balance BEFORE withdrawal: ${treasuryBalanceBefore / web3.LAMPORTS_PER_SOL} SOL`);
			
			const withdrawAmount = 0.7 * web3.LAMPORTS_PER_SOL; // 0.7 SOL
			console.log(`Withdraw amount: ${withdrawAmount / web3.LAMPORTS_PER_SOL} SOL`);
			
			// Calculate expected fee
			const feeAmount = Math.floor(withdrawAmount * 15 / 10000); // 0.15% fee
			const amountAfterFee = withdrawAmount - feeAmount;
			
			console.log(`Fee amount (0.15%): ${feeAmount / web3.LAMPORTS_PER_SOL} SOL`);
			console.log(`Amount after fee: ${amountAfterFee / web3.LAMPORTS_PER_SOL} SOL`);
			
			// Withdraw SOL requiring both account owner and password signatures
			let withdrawSolTx = await program.methods
				.withdrawSol(new anchor.BN(withdrawAmount))
				.accounts({
					authority: testUser.publicKey,
					validSignerOfPassword: passwordKeypair.publicKey,
					treasury: legateTreasury.publicKey
				})
				.signers([testUser, passwordKeypair])
				.rpc();
			
			await connection.confirmTransaction(
				{
					signature: withdrawSolTx,
					blockhash: (await connection.getLatestBlockhash()).blockhash,
					lastValidBlockHeight: (
						await connection.getLatestBlockhash()
					).lastValidBlockHeight,
				},
				"confirmed"
			);
			
			// Check treasury balance after withdrawal
			const treasuryBalanceAfter = await connection.getBalance(legate.treasuryAcc);
			console.log(`Treasury balance AFTER withdrawal: ${treasuryBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
			console.log(`Treasury fee received: ${(treasuryBalanceAfter - treasuryBalanceBefore) / web3.LAMPORTS_PER_SOL} SOL`);
			
			let testUserBalanceAfter = await connection.getBalance(testUser.publicKey);
			console.log(`Test User Balance AFTER withdraw: ${testUserBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
			
			let [centurionPDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("centurion"), testUser.publicKey.toBuffer()],
				program.programId
			);
			console.log(`Centurion balance AFTER withdraw: ${(await connection.getBalance(centurionPDA)) / web3.LAMPORTS_PER_SOL} SOL`);
			
			let testUserIncrease = testUserBalanceAfter - testUserBalanceBefore;
			
			// Verify the withdrawal was successful
			expect(
				testUserIncrease,
				"User should receive the withdrawal amount minus the fee and transaction costs"
			).to.be.greaterThan(amountAfterFee - 20000); // Allow small tolerance for transaction fees
			
			// Verify that the treasury received the fee
			expect(
				treasuryBalanceAfter - treasuryBalanceBefore,
				"Treasury should have received the fee"
			).to.equal(feeAmount);
		});

        it("Should fail when withdrawing with incorrect password signer", async () => {
            console.log("\n==== TEST: Unauthorized SOL Withdrawal - Should Fail with Incorrect Password ====");
            const incorrectPasswordSigner = anchor.web3.Keypair.generate();
            
            // Get legate PDA
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            const legate = await program.account.legate.fetch(legatePDA);
            
            try {
                await program.methods
                    .withdrawSol(new anchor.BN(0.1 * web3.LAMPORTS_PER_SOL))
                    .accounts({
                        authority: testUser.publicKey,
                        validSignerOfPassword: incorrectPasswordSigner.publicKey,
                        treasury: legateTreasury.publicKey
                    })
                    .signers([testUser, incorrectPasswordSigner])
                    .rpc();
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when withdrawing with incorrect password signer: ${error}`);
            }
        });

        it("Create a Centurion Testudo (SPL Token) account", async () => {            
            console.log("\n==== TEST: Create Testudo - Create SPL Token Account Associated with Centurion ====");
            console.log(`Mint pubkey: ${mintPubkey}`);
            let accountTokenInfo = await connection.getTokenAccountBalance(ata.address);
            console.log(`Token info: ${JSON.stringify(accountTokenInfo)}`);
    
            let centurion = await program.account.centurion.fetch(centurionPDA);
            console.log(`Centurion current testudos BEFORE creation: ${centurion.testudos}`);
            console.log(`Last accessed: ${centurion.lastAccessed}`);
    
            let tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            console.log(`Token program: ${tokenProgram}`);
            let token2022Program = new PublicKey(TOKEN_2022_PROGRAM_ID);
            console.log(`Token 2022 program: ${token2022Program}`);
            let mintOwner = (await connection.getAccountInfo(mintPubkey))?.owner;
            console.log(`Mint owner: ${mintOwner}`);
            let createTokenAccountTx;

            if (mintOwner.toBase58() === tokenProgram.toBase58()) {
                console.log("Creating Testudo with Token Program");
                createTokenAccountTx = await program.methods.createTestudo()
                        .accounts({
                            authority: testUser.publicKey,
                            mint: mintPubkey,
                            tokenProgram: tokenProgram,
                        })
                        .signers([testUser])
                        .rpc();
            } else if (mintOwner.toBase58() === token2022Program.toBase58()) {
                console.log("Creating Testudo with Token 2022 Program");
                createTokenAccountTx = await program.methods.createTestudo()
                        .accounts({
                            authority: testUser.publicKey,
                            mint: mintPubkey,
                            tokenProgram: token2022Program,
                        })
                        .signers([testUser])
                        .rpc();
            }

            console.log(`Create Testudo tx: ${createTokenAccountTx}`);
    
            await connection.confirmTransaction(
                {
                    signature: createTokenAccountTx,
                    blockhash: (await connection.getLatestBlockhash()).blockhash,
                    lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
                },
                "confirmed"
            );
    
            const centurionData = await program.account.centurion.fetch(centurionPDA, "confirmed");
            console.log(`Last accessed: ${centurionData.lastAccessed}`);
            console.log(centurionData);

            let testudoPDA = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), mintPubkey.toBuffer()],
                program.programId
            )[0];

            // Verify the testudo was created correctly and added to the centurion account
            expect(centurionData.testudos.length).to.equal(1);
            // Verify the token mint is correct
            expect(centurionData.testudos[0].tokenMint.toBase58()).to.equal(mintPubkey.toBase58());
            // Verify the testudo pubkey is correct
            expect(centurionData.testudos[0].testudoPubkey.toBase58()).to.equal(testudoPDA.toBase58());
        });

        it("Attempt to create a Testudo with a non-whitelisted token", async () => {
            console.log("\n==== TEST: Create Non-Whitelisted Testudo - Should Fail for Non-Approved Tokens ====");
            const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);

            // Initialize the variables that were declared in the outer scope
            let nonWhitelistedMintPubkey = await createMint(
                connection,
                testUser,
                testUser.publicKey,
                null,
                8
            );
            console.log(`Non-whitelisted mint: ${nonWhitelistedMintPubkey.toBase58()}`);
            
            ata = await getOrCreateAssociatedTokenAccount(
                connection,
                testUser,
                nonWhitelistedMintPubkey,
                testUser.publicKey
            );
            
            // Mint tokens
            const amount = 100 * 10 ** 8;
            const mintTx = await mintTo(
                connection, // connection
                testUser, // payer (must be the mint authority)
                nonWhitelistedMintPubkey, // mint address
                ata.address, // destination ATA
                testUser, // mint authority
                amount // amount to mint (in smallest units)
            );
            
            token_info = await connection.getTokenAccountBalance(ata.address);
            console.log(`ATA balance: ${token_info.value.uiAmount}\n`);

            let tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            console.log(`Token program: ${tokenProgram}`);
            let token2022Program = new PublicKey(TOKEN_2022_PROGRAM_ID);
            console.log(`Token 2022 program: ${token2022Program}`);

            let mintOwner = (await connection.getAccountInfo(nonWhitelistedMintPubkey))?.owner;
            console.log(`Mint owner: ${mintOwner}`);
            let createTokenAccountTx;

            try {
                if (mintOwner.toBase58() === tokenProgram.toBase58()) {
                    console.log("Creating Testudo with Token Program");
                    createTokenAccountTx = await program.methods.createTestudo()
                            .accounts({
                                authority: testUser.publicKey,
                                mint: nonWhitelistedMintPubkey,
                                tokenProgram: tokenProgram,
                            })
                            .signers([testUser])
                            .rpc();
                } else if (mintOwner.toBase58() === token2022Program.toBase58()) {
                    console.log("Creating Testudo with Token 2022 Program");
                    createTokenAccountTx = await program.methods.createTestudo()
                            .accounts({
                                authority: testUser.publicKey,
                                mint: nonWhitelistedMintPubkey,
                                tokenProgram: token2022Program,
                            })
                            .signers([testUser])
                            .rpc();
                }
            } catch (error) {
                console.log(`Error successfully thrown when creating Testudo with non-whitelisted token: ${error}`);
            }
        });

        it("Deposit to SPL Token Testudo", async () => {
            console.log("\n==== TEST: Deposit SPL Tokens - Add Tokens to Testudo Account ====");

            // Get token program
            const tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            
            // Get testudo PDA
            const [testudo] = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), mintPubkey.toBuffer()],
                program.programId
            );

            const depositAmount = 50;
            const depositAmountWithDecimals = depositAmount * (10 ** 8); // 8 decimals

            // No fees on deposit now
            console.log(`Deposit amount: ${depositAmount}`);

            let depositSPLTokenTx = await program.methods.depositSpl(new anchor.BN(depositAmountWithDecimals))
                .accountsPartial({
                    authority: testUser.publicKey,
                    mint: mintPubkey,
                    tokenProgram: tokenProgram,
                })
                .signers([testUser])
                .rpc();

            await connection.confirmTransaction(depositSPLTokenTx);

            // Verify the deposit was successful
            const testudoTokenAccount = await connection.getTokenAccountBalance(testudo);
            console.log(`Centurion token count (without decimals): ${testudoTokenAccount.value.uiAmount}`);
            console.log(`Testudo token account balance (without decimals): ${testudoTokenAccount.value.uiAmount}`);

            // Should be exactly the deposit amount since no fee is taken on deposit
            expect(testudoTokenAccount.value.uiAmount, "Token count should equal deposit amount").to.equal(depositAmount);
            
            // Update centurion data
            const centurion = await program.account.centurion.fetch(centurionPDA);
            
            // Find this testudo in centurion's testudos
            const testudoData = centurion.testudos.find(t => t.tokenMint.toBase58() === mintPubkey.toBase58());
            expect(testudoData, "Testudo should be in centurion's testudos").to.not.be.undefined;
            expect(testudoData.testudoTokenCount.toNumber(), "Testudo token count should match deposit").to.equal(depositAmountWithDecimals);
        });

        it("Withdraw from SPL Token Testudo", async () => {
            console.log("\n==== TEST: Withdraw SPL Tokens - Remove Tokens with Password Authentication ====");
            
            // Get token program
            const tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            
            // Get testudo PDA
            const [testudo] = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), mintPubkey.toBuffer()],
                program.programId
            );
            
            // Get legatePDA for treasury
            const [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            const legate = await program.account.legate.fetch(legatePDA);

            // Get current testudo balance
            const testudoBalanceBefore = await connection.getTokenAccountBalance(testudo);
            console.log(`Testudo token account balance BEFORE withdraw (without decimals): ${testudoBalanceBefore.value.uiAmount}`);
            
            // Check treasury token balance before withdrawal
            let treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
                legate.treasuryAcc,
                { mint: mintPubkey }
            );
            
            let treasuryTokenBalanceBefore = 0;
            if (treasuryTokenAccounts.value.length > 0) {
                treasuryTokenBalanceBefore = Number(treasuryTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
            }
            console.log(`Treasury token balance BEFORE withdrawal: ${treasuryTokenBalanceBefore}`);
            
            // Withdraw 40 tokens
            const withdrawAmount = 40;
            const withdrawAmountWithDecimals = withdrawAmount * (10 ** 8); // 8 decimals for this test token
            console.log(`Withdraw amount: ${withdrawAmount}`);
            
            // Calculate fee (0.15%)
            const feeAmount = Math.floor(withdrawAmountWithDecimals * 15 / 10000) / (10 ** 8);
            const amountAfterFee = withdrawAmount - feeAmount;
            console.log(`Fee amount (0.15%): ${feeAmount}`);
            console.log(`Amount after fee: ${amountAfterFee}`);
            
            // Get centurion data before withdrawal
            const centurionBefore = await program.account.centurion.fetch(centurionPDA);
            const testudoDataBefore = centurionBefore.testudos.find(t => t.tokenMint.toBase58() === mintPubkey.toBase58());
            console.log(`Centurion token count BEFORE withdraw (without decimals): ${testudoDataBefore.testudoTokenCount.toNumber() / (10 ** 8)}`);
            console.log(`Testudo token account balance BEFORE withdraw (without decimals): ${testudoBalanceBefore.value.uiAmount}`);
            console.log(`Testudo token account balance in raw units BEFORE withdraw: ${testudoBalanceBefore.value.amount}`);
            
            // Withdraw from SPL Token Testudo
            let withdrawSPLTokenTx = await program.methods.withdrawSpl(new anchor.BN(withdrawAmountWithDecimals))
                .accounts({
                    authority: testUser.publicKey,
                    validSignerOfPassword: passwordKeypair.publicKey,
                    mint: mintPubkey,
                    tokenProgram: tokenProgram,
                    treasury: legateTreasury.publicKey
                })
                .signers([testUser, passwordKeypair])
                .rpc();
                
            await connection.confirmTransaction(withdrawSPLTokenTx);
            
            // Check treasury token balance after withdrawal
            treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
                legate.treasuryAcc,
                { mint: mintPubkey }
            );
            
            let treasuryTokenBalanceAfter = 0;
            if (treasuryTokenAccounts.value.length > 0) {
                treasuryTokenBalanceAfter = Number(treasuryTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
            }
            console.log(`Treasury token balance AFTER withdrawal: ${treasuryTokenBalanceAfter}`);
            console.log(`Treasury fee received: ${treasuryTokenBalanceAfter - treasuryTokenBalanceBefore}`);
            
            // Get centurion data after withdrawal
            const centurionAfter = await program.account.centurion.fetch(centurionPDA);
            const testudoDataAfter = centurionAfter.testudos.find(t => t.tokenMint.toBase58() === mintPubkey.toBase58());
            
            // Get current testudo balance after withdrawal
            const testudoBalanceAfter = await connection.getTokenAccountBalance(testudo);
            console.log(`Centurion token count AFTER withdraw (without decimals): ${testudoDataAfter.testudoTokenCount.toNumber() / (10 ** 8)}`);
            console.log(`Testudo token account balance AFTER withdraw (without decimals): ${testudoBalanceAfter.value.uiAmount}`);
            console.log(`Testudo token account balance in raw units AFTER withdraw: ${testudoBalanceAfter.value.amount}`);
            
            // Verify the withdrawal was successful
            // Testudo balance should be reduced by the withdrawal amount
            expect(testudoBalanceAfter.value.uiAmount, "Testudo balance should be reduced by withdrawal amount")
                .to.be.closeTo(testudoBalanceBefore.value.uiAmount - withdrawAmount, 0.01);
            
            // Verify the centurion account data reflects the withdrawal
            expect(testudoDataAfter.testudoTokenCount.toNumber(), "Centurion account should reflect the withdrawal")
                .to.equal(testudoDataBefore.testudoTokenCount.toNumber() - withdrawAmountWithDecimals);
            
            // Verify that the treasury received the fee
            expect(treasuryTokenBalanceAfter - treasuryTokenBalanceBefore, "Treasury should have received the fee")
                .to.be.closeTo(feeAmount, 0.001);
        });

        it("Withdraw from SPL Token Testudo with incorrect token program", async () => {
            console.log("\n==== TEST: Withdraw with Incorrect Token Program - Should Fail with Mismatched Program ====");
            let testudoPDA = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), mintPubkey.toBuffer()],
                program.programId
            )[0];
            
            let mintInfo = await getMint(connection, mintPubkey);
            let decimals = mintInfo.decimals;
            let token2022Program = new PublicKey(TOKEN_2022_PROGRAM_ID);
            let withdrawAmount = 1 * Math.pow(10, decimals);
            
            // Get legate pda
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            const legate = await program.account.legate.fetch(legatePDA);

            try {
                let withdrawSPLTokenTx = await program.methods.withdrawSpl(new anchor.BN(withdrawAmount))
                .accounts({
                    authority: testUser.publicKey,
                    validSignerOfPassword: passwordKeypair.publicKey,
                    mint: mintPubkey,
                    tokenProgram: token2022Program, // Incorrect token program
                    treasury: legateTreasury.publicKey
                })
                    .signers([testUser, passwordKeypair])
                    .rpc();
            } catch (error) {
                console.log(`Error successfully thrown when withdrawing from SPL Token Testudo with incorrect token program: ${error}`);
            }
        });

        it("Withdraw from SPL Token Testudo with invalid password signer", async () => {
            console.log("\n==== TEST: Unauthorized Token Withdrawal - Should Fail with Invalid Password ====");
            let testudoPDA = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), mintPubkey.toBuffer()],
                program.programId
            )[0];
            
            let mintInfo = await getMint(connection, mintPubkey);
            let decimals = mintInfo.decimals;
            let tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            let withdrawAmount = 1 * Math.pow(10, decimals);

            let invalidPasswordKeypair = anchor.web3.Keypair.generate();
            
            // Get legate pda
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            const legate = await program.account.legate.fetch(legatePDA);

            try {
                let withdrawSPLTokenTx = await program.methods.withdrawSpl(new anchor.BN(withdrawAmount))
                .accounts({
                    authority: testUser.publicKey,
                    validSignerOfPassword: invalidPasswordKeypair.publicKey,
                    mint: mintPubkey,
                    tokenProgram: tokenProgram,
                    treasury: legateTreasury.publicKey
                })
                .signers([testUser, invalidPasswordKeypair])
                .rpc();
            } catch (error) {
                console.log(`Error successfully thrown when withdrawing from SPL Token Testudo with invalid password signer: ${error}`);
            }
        });

        // A) Tests for deleteTestudo instruction
        it("Successfully delete a Testudo account", async () => {
            console.log("\n==== TEST: Delete Testudo Account - Successfully Remove SPL Token Testudo ====");
            
            // First, we need to create a mint and a Testudo for testing deletion
            let deletionMintPubkey = await createMint(
                connection,
                testUser,
                testUser.publicKey,
                null,
                8
            );
            console.log(`Created test mint for deletion: ${deletionMintPubkey.toBase58()}`);
            
            // Add this mint to the whitelist
            let addMintTx = await program.methods.addMintTestudo({
                tokenMint: deletionMintPubkey,
                tokenName: "DeleteTest",
                tokenSymbol: "DLT",
                tokenDecimals: 8
            })
            .accounts({
                authority: legateAuthority.publicKey,
                treasury: legateTreasury.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                mint: deletionMintPubkey,
            })
            .signers([legateAuthority])
            .rpc();
            
            await connection.confirmTransaction(addMintTx);
            console.log(`Added test mint to whitelist: ${addMintTx}`);
            
            // Create user's ATA for this mint
            let userAta = await getOrCreateAssociatedTokenAccount(
                connection,
                testUser,
                deletionMintPubkey,
                testUser.publicKey
            );
            console.log(`Created user's ATA: ${userAta.address.toBase58()}`);
            
            // Mint some tokens to the user
            const mintAmount = 100 * 10 ** 8;
            await mintTo(
                connection,
                testUser,
                deletionMintPubkey,
                userAta.address,
                testUser,
                mintAmount
            );
            console.log(`Minted ${mintAmount / 10 ** 8} tokens to user ATA`);
            
            // Create Testudo for this mint
            let tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            
            // Calculate PDAs first
            let [centurionPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                program.programId
            );
            
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            
            let [testudoPDA] = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), deletionMintPubkey.toBuffer()],
                program.programId
            );
            
            let createTestudoTx = await program.methods.createTestudo()
                .accounts({
                    authority: testUser.publicKey,
                    mint: deletionMintPubkey,
                    tokenProgram: tokenProgram,
                })
                .signers([testUser])
                .rpc();
                
            await connection.confirmTransaction(createTestudoTx);
            console.log(`Created Testudo account: ${createTestudoTx}`);
            
            // Deposit some tokens to the Testudo
            const depositAmount = 50 * 10 ** 8;
            
            console.log(`Deposit amount: ${depositAmount / 10 ** 8} tokens`);
            
            // Get authority's ATA for this mint
            let authorityAtaAddress = await anchor.utils.token.associatedAddress({
                mint: deletionMintPubkey,
                owner: testUser.publicKey
            });
            
            let depositTx = await program.methods.depositSpl(new anchor.BN(depositAmount))
                .accounts({
                    authority: testUser.publicKey,
                    mint: deletionMintPubkey,
                    tokenProgram: tokenProgram,
                })
                .signers([testUser])
                .rpc();
                
            await connection.confirmTransaction(depositTx);
            console.log(`Deposited ${depositAmount / 10 ** 8} tokens to Testudo`);
            
            // Verify deposits before deletion
            let centurionBefore = await program.account.centurion.fetch(centurionPDA);
            let testudoBalanceBefore = await connection.getTokenAccountBalance(testudoPDA);
            
            console.log("Centurion testudos BEFORE deletion:");
            centurionBefore.testudos.forEach((t, i) => {
                console.log(`  #${i}: Mint=${t.tokenMint.toBase58()}, Balance=${t.testudoTokenCount.toString()}`);
            });
            console.log(`Testudo token balance BEFORE deletion: ${testudoBalanceBefore.value.uiAmount}`);
            console.log(`Testudo token balance in raw units: ${testudoBalanceBefore.value.amount}`);
            
            // Get user's token balance before deletion
            let userAtaBalanceBefore = await connection.getTokenAccountBalance(userAta.address);
            console.log(`User ATA balance BEFORE deletion: ${userAtaBalanceBefore.value.uiAmount}`);
            
            // Get legate information for treasury
            const legate = await program.account.legate.fetch(legatePDA);
            
            // Check treasury token balance before deletion
            let treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
                legate.treasuryAcc,
                { mint: deletionMintPubkey }
            );
            
            let treasuryTokenBalanceBefore = 0;
            if (treasuryTokenAccounts.value.length > 0) {
                treasuryTokenBalanceBefore = Number(treasuryTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
            }
            console.log(`Treasury token balance BEFORE deletion: ${treasuryTokenBalanceBefore}`);
            
            // Calculate expected fee (0.15% of testudo balance)
            const testudoBalanceInTokens = testudoBalanceBefore.value.uiAmount;
            const feeAmount = testudoBalanceInTokens * 0.0015; // 0.15% fee
            const expectedUserBalanceAfter = userAtaBalanceBefore.value.uiAmount + (testudoBalanceInTokens - feeAmount);
            
            console.log(`Expected fee amount (0.15%): ${feeAmount}`);
            console.log(`Expected user balance after deletion: ${expectedUserBalanceAfter}`);
            
            // Now delete the Testudo
            const deleteTestudoTx = await program.methods.deleteTestudo()
                .accounts({
                    authority: testUser.publicKey,
                    validSignerOfPassword: passwordKeypair.publicKey,
                    mint: deletionMintPubkey,
                    tokenProgram: tokenProgram,
                    treasury: legateTreasury.publicKey
                })
                .signers([testUser, passwordKeypair])
                .rpc();
                
            await connection.confirmTransaction(deleteTestudoTx);
            console.log(`Deleted Testudo: ${deleteTestudoTx}`);
            
            // Check treasury token balance after deletion
            treasuryTokenAccounts = await connection.getParsedTokenAccountsByOwner(
                legate.treasuryAcc,
                { mint: deletionMintPubkey }
            );
            
            let treasuryTokenBalanceAfter = 0;
            if (treasuryTokenAccounts.value.length > 0) {
                treasuryTokenBalanceAfter = Number(treasuryTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
            }
            console.log(`Treasury token balance AFTER deletion: ${treasuryTokenBalanceAfter}`);
            console.log(`Treasury fee received: ${treasuryTokenBalanceAfter - treasuryTokenBalanceBefore}`);
            
            // Verify account is closed
            const testudoAccountInfo = await connection.getAccountInfo(testudoPDA);
            console.log(`Testudo account exists: ${testudoAccountInfo !== null}`);
            
            // Verify tokens were returned to user
            let userAtaBalanceAfter = await connection.getTokenAccountBalance(userAta.address);
            console.log(`User ATA balance AFTER deletion: ${userAtaBalanceAfter.value.uiAmount}`);
            
            // Verify testudo was removed from Centurion
            let centurionAfter = await program.account.centurion.fetch(centurionPDA);
            console.log("Centurion testudos AFTER deletion:");
            centurionAfter.testudos.forEach((t, i) => {
                console.log(`  #${i}: Mint=${t.tokenMint.toBase58()}, Balance=${t.testudoTokenCount.toString()}`);
            });
            
            console.log(`Last accessed timestamp BEFORE: ${centurionBefore.lastAccessed}`);
            console.log(`Last accessed timestamp AFTER: ${centurionAfter.lastAccessed}`);
            
            // Assertions
            expect(testudoAccountInfo, "Testudo account should be closed").to.be.null;
            
            // When deleting Testudo, all tokens (minus fee) are returned to the user 
            expect(
                userAtaBalanceAfter.value.uiAmount, 
                `User ATA balance after deletion should be close to ${expectedUserBalanceAfter}`
            ).to.be.closeTo(expectedUserBalanceAfter, 0.01); // Allow a small tolerance for rounding
            
            // Verify the treasury received the fee
            expect(
                treasuryTokenBalanceAfter - treasuryTokenBalanceBefore,
                "Treasury should have received the fee"
            ).to.be.closeTo(feeAmount, 0.01);
            
            // The testudo should be removed from the Centurion's testudos array
            const hasMintInTestudos = centurionAfter.testudos.some(t => 
                t.tokenMint.toBase58() === deletionMintPubkey.toBase58()
            );
            expect(hasMintInTestudos, "Testudo should be removed from Centurion").to.be.false;
            
            // Last accessed should be updated
            expect(centurionAfter.lastAccessed.toNumber(), "Last accessed should be updated").to.be.greaterThanOrEqual(centurionBefore.lastAccessed.toNumber());
        });

        it("Should fail when attempting to delete a non-whitelisted Testudo", async () => {
            console.log("\n==== TEST: Delete Non-Whitelisted Testudo - Should Fail for Non-Existent Testudo ====");
            
            // Create a non-whitelisted mint and try to delete it (should fail)
            let nonWhitelistedMint = await createMint(
                connection,
                testUser,
                testUser.publicKey,
                null,
                8
            );
            console.log(`Created non-whitelisted mint: ${nonWhitelistedMint.toBase58()}`);
            
            // Create user's ATA for this mint
            let userAta = await getOrCreateAssociatedTokenAccount(
                connection,
                testUser,
                nonWhitelistedMint,
                testUser.publicKey
            );
            console.log(`Created user's ATA: ${userAta.address.toBase58()}`);
            
            // Try to delete a non-existent Testudo
            try {
                const tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
                
                let [centurionPDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                    program.programId
                );
                
                let [testudoPDA] = PublicKey.findProgramAddressSync(
                    [centurionPDA.toBuffer(), nonWhitelistedMint.toBuffer()],
                    program.programId
                );
                
                let authorityAtaAddress = await anchor.utils.token.associatedAddress({
                    mint: nonWhitelistedMint,
                    owner: testUser.publicKey
                });
                
                await program.methods.deleteTestudo()
                    .accounts({
                        authority: testUser.publicKey,
                        validSignerOfPassword: passwordKeypair.publicKey,
                        mint: nonWhitelistedMint,
                        tokenProgram: tokenProgram
                    })
                    .signers([testUser, passwordKeypair])
                    .rpc();
                    
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when deleting non-existent Testudo: ${error}`);
            }
        });

        it("Should fail when deleting Testudo with wrong authority", async () => {
            console.log("\n==== TEST: Delete with Wrong Authority - Should Fail with Unauthorized User ====");
            
            // Create a mint and whitelist it
            let testMint = await createMint(
                connection,
                testUser,
                testUser.publicKey,
                null,
                8
            );
            console.log(`Created test mint: ${testMint.toBase58()}`);
            
            // Add this mint to the whitelist
            let addMintTx = await program.methods.addMintTestudo({
                tokenMint: testMint,
                tokenName: "AuthTest",
                tokenSymbol: "AT",
                tokenDecimals: 8
            })
            .accountsPartial({
                authority: legateAuthority.publicKey,
                treasury: legateTreasury.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                mint: testMint,
            })
            .signers([legateAuthority])
            .rpc();
            
            await connection.confirmTransaction(addMintTx);
            console.log(`Added test mint to whitelist: ${addMintTx}`);
            
            // Create a Testudo
            let tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
            
            // Calculate PDAs first
            let [centurionPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                program.programId
            );
            
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            
            let [testudoPDA] = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), testMint.toBuffer()],
                program.programId
            );
            
            let createTestudoTx = await program.methods.createTestudo()
                .accountsPartial({
                    authority: testUser.publicKey,
                    mint: testMint,
                    tokenProgram: tokenProgram,
                })
                .signers([testUser])
                .rpc();
                
            await connection.confirmTransaction(createTestudoTx);
            console.log(`Created Testudo account: ${createTestudoTx}`);
            
            // Create a wrong authority
            const wrongAuthority = anchor.web3.Keypair.generate();
            console.log(`Created wrong authority: ${wrongAuthority.publicKey.toBase58()}`);
            
            // Airdrop to wrong authority so they can pay for transaction
            let airdropTx = await connection.requestAirdrop(
                wrongAuthority.publicKey,
                web3.LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(airdropTx);
            
            // Create wrong authority's ATA
            const wrongAuthorityAta = await getOrCreateAssociatedTokenAccount(
                connection,
                wrongAuthority,
                testMint,
                wrongAuthority.publicKey
            );
            
            // Try to delete with wrong authority
            try {
                // Wrong authority's centurion PDA doesn't exist, but we need to compute it for the test
                let [wrongAuthCenturionPDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from("centurion"), wrongAuthority.publicKey.toBuffer()],
                    program.programId
                );
                
                await program.methods.deleteTestudo()
                    .accounts({
                        authority: wrongAuthority.publicKey,
                        validSignerOfPassword: passwordKeypair.publicKey,
                        mint: testMint,
                        tokenProgram: tokenProgram
                    })
                    .signers([wrongAuthority, passwordKeypair])
                    .rpc();
                    
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when deleting with wrong authority: ${error}`);
            }
        });

        it("Should fail when deleting Testudo with wrong password signer", async () => {
            console.log("\n==== TEST: Delete with Wrong Password - Should Fail with Invalid Password ====");
            
            // Create wrong password keypair
            const wrongPasswordKeypair = anchor.web3.Keypair.generate();
            console.log(`Created wrong password keypair: ${wrongPasswordKeypair.publicKey.toBase58()}`);
            
            // Get the Testudo PDA for an existing token (from previous test)
            let [centurionPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                program.programId
            );
            
            let [testudoPDA] = PublicKey.findProgramAddressSync(
                [centurionPDA.toBuffer(), mintPubkey.toBuffer()],
                program.programId
            );
            
            // Get authority's ATA
            let authorityAtaAddress = await anchor.utils.token.associatedAddress({
                mint: mintPubkey,
                owner: testUser.publicKey
            });
            
            // Try to delete with wrong password
            try {
                const tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
                await program.methods.deleteTestudo()
                    .accounts({
                        authority: testUser.publicKey,
                        validSignerOfPassword: wrongPasswordKeypair.publicKey,
                        mint: mintPubkey,
                        tokenProgram: tokenProgram
                    })
                    .signers([testUser, wrongPasswordKeypair])
                    .rpc();
                    
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when deleting with wrong password: ${error}`);
            }
        });

        it("Successfully withdraw SOL to backup account", async () => {
            console.log("\n==== TEST: Withdraw SOL to Backup - Transfer Remaining SOL to Backup Owner Address ====");
            
            let [centurionPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                program.programId
            );
            
            // Get the Legate PDA to check treasury balances
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            let legate = await program.account.legate.fetch(legatePDA);
            
            // First, deposit some SOL to ensure we have funds
            const depositAmount = 1 * web3.LAMPORTS_PER_SOL; // 1 SOL
            
            console.log(`Deposit amount: ${depositAmount / web3.LAMPORTS_PER_SOL} SOL`);
            
            // Check treasury balance before deposit
            const treasuryBalanceBefore = await connection.getBalance(legate.treasuryAcc);
            console.log(`Treasury balance BEFORE deposit: ${treasuryBalanceBefore / web3.LAMPORTS_PER_SOL} SOL`);
            
            let depositSolTx = await program.methods
                .depositSol(new anchor.BN(depositAmount))
                .accounts({
                    authority: testUser.publicKey,
                })
                .signers([testUser])
                .rpc();
                
            await connection.confirmTransaction(depositSolTx);
            
            // Get centurion data and balances before withdrawal
            const centurionBefore = await program.account.centurion.fetch(centurionPDA);
            const centurionBalanceBefore = await connection.getBalance(centurionPDA);
            const backupOwnerBalanceBefore = await connection.getBalance(backupOwnerKeypair.publicKey);

            console.log(`Centurion rent required: ${await connection.getMinimumBalanceForRentExemption((await connection.getAccountInfo(centurionPDA)).data.length) / web3.LAMPORTS_PER_SOL} SOL`);
            
            console.log(`Centurion SOL balance BEFORE withdrawal: ${centurionBalanceBefore / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Backup owner SOL balance BEFORE withdrawal: ${backupOwnerBalanceBefore / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Centurion lamport_balance BEFORE withdrawal: ${centurionBefore.lamportBalance.toNumber() / web3.LAMPORTS_PER_SOL} SOL`);
            
            // Calculate expected fee for the withdrawal
            const withdrawAmount = centurionBefore.lamportBalance.toNumber();
            const feeAmount = Math.floor(withdrawAmount * 15 / 10000);
            const amountAfterFee = withdrawAmount - feeAmount;
            
            console.log(`Expected withdraw amount: ${withdrawAmount / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Expected fee amount (0.15%): ${feeAmount / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Expected amount after fee: ${amountAfterFee / web3.LAMPORTS_PER_SOL} SOL`);
            
            // Check treasury balance before withdrawal
            const treasuryBalanceBeforeWithdraw = await connection.getBalance(legate.treasuryAcc);
            console.log(`Treasury balance BEFORE withdrawal: ${treasuryBalanceBeforeWithdraw / web3.LAMPORTS_PER_SOL} SOL`);
            
            // Now withdraw all SOL to backup account
            const withdrawToBackupTx = await program.methods
                .withdrawSolToBackup()
                .accounts({
                    authority: testUser.publicKey,
                    validSignerOfPassword: passwordKeypair.publicKey,
                    centurion: centurionPDA,
                    backupAccount: backupOwnerKeypair.publicKey,
                    legate: legatePDA,
                    treasury: legate.treasuryAcc,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([testUser, passwordKeypair])
                .rpc();
                
            await connection.confirmTransaction(withdrawToBackupTx);
            console.log(`Withdrew SOL to backup account: ${withdrawToBackupTx}`);
            
            // Get centurion data and balances after withdrawal
            const centurionAfter = await program.account.centurion.fetch(centurionPDA);
            const centurionBalanceAfter = await connection.getBalance(centurionPDA);
            const backupOwnerBalanceAfter = await connection.getBalance(backupOwnerKeypair.publicKey);
            const treasuryBalanceAfterWithdraw = await connection.getBalance(legate.treasuryAcc);
            
            console.log(`Centurion SOL balance AFTER withdrawal: ${centurionBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Backup owner SOL balance AFTER withdrawal: ${backupOwnerBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Centurion lamport_balance AFTER withdrawal: ${centurionAfter.lamportBalance.toNumber() / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Treasury balance AFTER withdrawal: ${treasuryBalanceAfterWithdraw / web3.LAMPORTS_PER_SOL} SOL`);
            console.log(`Treasury fee received: ${(treasuryBalanceAfterWithdraw - treasuryBalanceBeforeWithdraw) / web3.LAMPORTS_PER_SOL} SOL`);
            
            // Verify the SOL was transferred to backup account
            expect(centurionAfter.lamportBalance.toNumber(), "Centurion lamport_balance should be 0").to.equal(0);
            expect(backupOwnerBalanceAfter - backupOwnerBalanceBefore, "Backup owner should receive approximately the amount after fee")
                .to.be.closeTo(amountAfterFee, 15000); // Allow small tolerance for tx fees
            expect(centurionBalanceAfter, "Centurion balance should maintain enough for rent exemption").to.be.greaterThan(0);
            
            // Verify the last accessed timestamp was updated
            expect(centurionAfter.lastAccessed.toNumber(), "Last accessed should be updated").to.be.greaterThanOrEqual(centurionBefore.lastAccessed.toNumber());
            
            // Verify that the treasury received the fee
            expect(
                treasuryBalanceAfterWithdraw - treasuryBalanceBeforeWithdraw,
                "Treasury should have received the fee"
            ).to.equal(feeAmount);
        });

        it("Should fail when withdrawing SOL to backup with wrong password signer", async () => {
            console.log("\n==== TEST: Withdraw SOL to Backup with Wrong Password - Should Fail with Invalid Password ====");
            
            // Create wrong password keypair
            const wrongPasswordKeypair = anchor.web3.Keypair.generate();
            console.log(`Created wrong password keypair: ${wrongPasswordKeypair.publicKey.toBase58()}`);
            
            // Get centurion PDA
            let [centurionPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                program.programId
            );
            
            // Deposit some SOL first to ensure the test is valid
            const depositAmount = 0.5 * web3.LAMPORTS_PER_SOL; // 0.5 SOL
            
            console.log(`Deposit amount: ${depositAmount / web3.LAMPORTS_PER_SOL} SOL`);

            // Get legate to find treasury
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            const legate = await program.account.legate.fetch(legatePDA);
            
            let depositSolTx = await program.methods
                .depositSol(new anchor.BN(depositAmount))
                .accounts({
                    authority: testUser.publicKey,
                })
                .signers([testUser])
                .rpc();
                
            await connection.confirmTransaction(depositSolTx);
            
            // Try to withdraw with wrong password
            try {
                await program.methods
                    .withdrawSolToBackup()
                    .accounts({
                        authority: testUser.publicKey,
                        validSignerOfPassword: wrongPasswordKeypair.publicKey,
                        centurion: centurionPDA,
                        backupAccount: backupOwnerKeypair.publicKey,
                        legate: legatePDA,
                        treasury: legate.treasuryAcc,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    })
                    .signers([testUser, wrongPasswordKeypair])
                    .rpc();
                    
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when withdrawing SOL to backup with wrong password: ${error}`);
            }
        });

        it("Should fail when withdrawing SOL to invalid backup owner", async () => {
            console.log("\n==== TEST: Withdraw SOL to Invalid Backup - Should Fail with Wrong Backup Address ====");
            
            // Create fake backup owner
            const fakeBackupOwner = anchor.web3.Keypair.generate();
            console.log(`Created fake backup owner: ${fakeBackupOwner.publicKey.toBase58()}`);
            
            // Get centurion PDA
            let [centurionPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
                program.programId
            );
            
            // Deposit some SOL first to ensure the test is valid
            const depositAmount = 0.5 * web3.LAMPORTS_PER_SOL; // 0.5 SOL
            
            console.log(`Deposit amount: ${depositAmount / web3.LAMPORTS_PER_SOL} SOL`);

            // Get legate to find treasury
            let [legatePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("legate")],
                program.programId
            );
            const legate = await program.account.legate.fetch(legatePDA);
            
            let depositSolTx = await program.methods
                .depositSol(new anchor.BN(depositAmount))
                .accounts({
                    authority: testUser.publicKey,
                })
                .signers([testUser])
                .rpc();
                
            await connection.confirmTransaction(depositSolTx);
            
            // Try to withdraw with wrong backup owner
            try {
                await program.methods
                    .withdrawSolToBackup()
                    .accounts({
                        authority: testUser.publicKey,
                        validSignerOfPassword: passwordKeypair.publicKey,
                        centurion: centurionPDA,
                        backupAccount: fakeBackupOwner.publicKey, // Wrong backup owner
                        legate: legatePDA,
                        treasury: legate.treasuryAcc,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    })
                    .signers([testUser, passwordKeypair])
                    .rpc();
                    
                expect.fail("Should have thrown an error");
            } catch (error) {
                console.log(`Error successfully thrown when withdrawing SOL to invalid backup owner: ${error}`);
            }
        });
    });
});