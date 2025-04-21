import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";
import { TestSetup } from "./utils/setup";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

describe("Centurion Account Operations", () => {
    // Initialize shared test context
    const testContext = new TestSetup();
    
    before(async () => {
        // Run global test setup
        await testContext.initialize();
        console.log("\n==== STARTING CENTURION ACCOUNT TESTS ====");
    });
    
    it("Create Centurion account", async () => {
        // Initializes a user account (Centurion) for the test user with password protection
        let initCenturionTx = await testContext.program.methods
            .initCenturion(
                testContext.passwordKeypair.publicKey,
                testContext.backupOwnerKeypair.publicKey
            )
            .accounts({
                authority: testContext.testUser.publicKey,
            })
            .signers([testContext.testUser])
            .rpc();
        console.log(`Init Centurion tx: ${initCenturionTx}`);

        // Get the Centurion PDA for this user
        let [centurionPDA] = testContext.findCenturionPDA(testContext.testUser.publicKey);
        let centurion = await testContext.program.account.centurion.fetch(centurionPDA);
        
        // Verify the account was created correctly
        expect(
            centurion.pubkeyToPassword.toBase58(),
            "Pubkey to password should match password keypair public key"
        ).to.equal(testContext.passwordKeypair.publicKey.toBase58());
    });

    it("Deposit SOL to Centurion account", async () => {
        let [centurionPDA] = testContext.findCenturionPDA(testContext.testUser.publicKey);
        let centurionLamports = await testContext.connection.getBalance(centurionPDA);
        console.log(
            `Centurion balance BEFORE deposit: ${
                centurionLamports / web3.LAMPORTS_PER_SOL
            } SOL`
        );

        let depositSolTx = await testContext.program.methods
            .depositSol(new anchor.BN(1.5 * web3.LAMPORTS_PER_SOL))
            .accounts({
                authority: testContext.testUser.publicKey,
            })
            .signers([testContext.testUser])
            .rpc();
        await testContext.connection.confirmTransaction(
            {
                signature: depositSolTx,
                blockhash: (await testContext.connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (
                    await testContext.connection.getLatestBlockhash()
                ).lastValidBlockHeight,
            },
            "confirmed"
        );

        let centurion = await testContext.program.account.centurion.fetch(centurionPDA);
        console.log(
            `Centurion balance AFTER deposit: ${
                (await testContext.connection.getBalance(centurionPDA)) /
                web3.LAMPORTS_PER_SOL
            } SOL`
        );

        // Verify the deposit was successful
        expect(
            await testContext.connection.getBalance(centurionPDA),
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
                (await testContext.connection.getBalance(testContext.testUser.publicKey)) /
                web3.LAMPORTS_PER_SOL
            } SOL`
        );
        
        try {
            await testContext.program.methods
                .depositSol(new anchor.BN(100_000_000 * web3.LAMPORTS_PER_SOL))
                .accounts({
                    authority: testContext.testUser.publicKey,
                })
                .signers([testContext.testUser])
                .rpc();
            expect.fail("Should have thrown an error");
        } catch (error) {
            console.log(`Error successfully thrown when depositing more SOL than available: ${error}`);
        }
    });

    it("Withdraw SOL from Centurion account with password authentication", async () => {
        let [centurionPDA] = testContext.findCenturionPDA(testContext.testUser.publicKey);

        console.log(
            `Test User Balance BEFORE withdraw: ${
                (await testContext.connection.getBalance(testContext.testUser.publicKey)) /
                web3.LAMPORTS_PER_SOL
            } SOL`
        );
        console.log(
            `Centurion balance BEFORE withdraw: ${
                (await testContext.connection.getBalance(centurionPDA)) /
                web3.LAMPORTS_PER_SOL
            } SOL`
        );

        // Withdraw SOL requiring both account owner and password signatures
        let withdrawSolTx = await testContext.program.methods
            .withdrawSol(new anchor.BN(0.7 * web3.LAMPORTS_PER_SOL))
            .accountsPartial({
                authority: testContext.testUser.publicKey,
                validSignerOfPassword: testContext.passwordKeypair.publicKey,
            })
            .signers([testContext.testUser, testContext.passwordKeypair])
            .rpc();
        await testContext.connection.confirmTransaction(withdrawSolTx);

        console.log(
            `Test User Balance AFTER withdraw: ${
                (await testContext.connection.getBalance(testContext.testUser.publicKey)) /
                web3.LAMPORTS_PER_SOL
            } SOL`
        );
        console.log(
            `Centurion balance AFTER withdraw: ${
                (await testContext.connection.getBalance(centurionPDA)) /
                web3.LAMPORTS_PER_SOL
            } SOL`
        );

        let centurion = await testContext.program.account.centurion.fetch(centurionPDA);

        // Verify the withdrawal was successful
        expect(
            await testContext.connection.getBalance(centurionPDA),
            "Centurion balance should be above 0.79 SOL"
        ).to.greaterThan(0.79 * web3.LAMPORTS_PER_SOL);
        expect(
            await testContext.connection.getBalance(centurionPDA),
            "Centurion balance should be below 0.82 SOL"
        ).to.lessThan(0.82 * web3.LAMPORTS_PER_SOL);
        expect(
            centurion.lamportBalance.toNumber(),
            "Centurion account data should show 0.8 SOL"
        ).to.equal(0.8 * web3.LAMPORTS_PER_SOL);
    });
    
    // Additional tests can be added here as needed
    it("Should fail when withdrawing with incorrect password signer", async () => {
        let [centurionPDA] = testContext.findCenturionPDA(testContext.testUser.publicKey);
        const incorrectPasswordSigner = anchor.web3.Keypair.generate();
        
        try {
            await testContext.program.methods
                .withdrawSol(new anchor.BN(0.1 * web3.LAMPORTS_PER_SOL))
                .accountsPartial({
                    authority: testContext.testUser.publicKey,
                    validSignerOfPassword: incorrectPasswordSigner.publicKey,
                })
                .signers([testContext.testUser, incorrectPasswordSigner])
                .rpc();
            expect.fail("Should have thrown an error");
        } catch (error) {
            console.log(`Error successfully thrown when withdrawing with incorrect password signer: ${error}`);
        }
    });

    it("Create a Centurion Testudo (SPL Token) account", async () => {
        let [centurionPDA] = testContext.findCenturionPDA(testContext.testUser.publicKey);
        
        await testContext.setupTestToken();
        let mintPubkey = testContext.mintPubkey;
        console.log(`Mint pubkey: ${mintPubkey}`);
        let accountTokenInfo = await testContext.connection.getTokenAccountBalance(testContext.ata.address);
        console.log(`Token info: ${JSON.stringify(accountTokenInfo)}`);

        let centurion = await testContext.program.account.centurion.fetch(centurionPDA);
        console.log(`Centurion current testudos BEFORE creation: ${centurion.testudos}`);

        let tokenProgram = new PublicKey(TOKEN_PROGRAM_ID);
        console.log(`Token program: ${tokenProgram}`);
        let token2022Program = new PublicKey(TOKEN_2022_PROGRAM_ID);
        console.log(`Token 2022 program: ${token2022Program}`);
        let mintOwner = (await testContext.connection.getAccountInfo(mintPubkey))?.owner;
        console.log(`Mint owner: ${mintOwner}`);
        let createTokenAccountTx;
        if (mintOwner.toBase58() === tokenProgram.toBase58()) {
            console.log("Creating Testudo with Token Program");
            createTokenAccountTx = await testContext.program.methods.createTestudo()
                    .accounts({
                        authority: testContext.testUser.publicKey,
                        mint: mintPubkey,
                        tokenProgram: tokenProgram,
                    })
                    .signers([testContext.testUser])
                    .rpc();
        } else if (mintOwner.toBase58() === token2022Program.toBase58()) {
            console.log("Creating Testudo with Token 2022 Program");
            createTokenAccountTx = await testContext.program.methods.createTestudo()
                    .accounts({
                        authority: testContext.testUser.publicKey,
                        mint: mintPubkey,
                        tokenProgram: token2022Program,
                    })
                    .signers([testContext.testUser])
                    .rpc();
        }

        await testContext.connection.confirmTransaction(
            {
                signature: createTokenAccountTx,
                blockhash: (await testContext.connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (await testContext.connection.getLatestBlockhash()).lastValidBlockHeight,
            },
            "confirmed"
        );

        centurion = await testContext.program.account.centurion.fetch(centurionPDA);
        console.log(`Centurion current testudos AFTER creation: ${centurion.testudos}`);
    });

}); 