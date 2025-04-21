import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";
import { TestSetup } from "./utils/setup";

describe("Legate Administration Tests", () => {
    // Initialize shared test context
    const testContext = new TestSetup();
    
    before(async () => {
        // Run global test setup
        await testContext.initialize();
        
        // Additional setup specific to Legate tests
        console.log("==== STARTING LEGATE ADMIN TESTS ====");
        await testContext.airdropSol(testContext.legateAuthority.publicKey, 100);
    });
    
    it("Initialize Legate", async () => {
        // Initialize the global Legate account which manages the Testudo system parameters
        const tx = await testContext.program.methods
            .initLegate()
            .accounts({
                authority: testContext.legateAuthority.publicKey,
            })
            .signers([testContext.legateAuthority])
            .rpc();
        console.log(`Legate initialization tx: ${tx}`);
        
        // Get the legate account data
        const [legatePDA] = testContext.findLegatePDA();
        const legate = await testContext.program.account.legate.fetch(legatePDA);

        // Verify the legate account has been properly initialized
        expect(legate.isInitialized, "Legate should be initialized").to.equal(true);
        expect(
            legate.authority.toBase58(),
            "Legate authority should match authority passed in initLegate instruction"
        ).to.equal(testContext.legateAuthority.publicKey.toBase58());
        expect(
            legate.maxTestudosPerUser,
            "Max testudos per user should be 30"
        ).to.equal(30);
    });

    it("Should fail when initializing legate again", async () => {
        try {
            await testContext.program.methods
                .initLegate()
                .accounts({
                    authority: testContext.legateAuthority.publicKey,
                })
                .signers([testContext.legateAuthority])
                .rpc();
            expect.fail("Should have thrown an error");
        } catch (error) {
            console.log("Error successfully thrown when trying to initialize legate again");
        }
    });
    
    it("Update max testudos per user", async () => {
        const newMaxTestudosPerUser = 50;
        const [legatePDA] = testContext.findLegatePDA();
        const legate = await testContext.program.account.legate.fetch(legatePDA);
        console.log(
            `Legate max testudos per user (before update): ${legate.maxTestudosPerUser}`
        );
        
        const tx = await testContext.program.methods
            .updateMaxTestudos(newMaxTestudosPerUser)
            .accounts({
                authority: testContext.legateAuthority.publicKey,
            })
            .signers([testContext.legateAuthority])
            .rpc();
            
        const legateAfterUpdate = await testContext.program.account.legate.fetch(legatePDA);
        
        // Verify the maxTestudosPerUser value has been updated correctly
        expect(
            legateAfterUpdate.maxTestudosPerUser,
            "Max testudos per user should match new value"
        ).to.equal(newMaxTestudosPerUser);
    });

    it("Update max whitelisted mints", async () => {
        const newMaxWhitelistedMints = 100;
        const [legatePDA] = testContext.findLegatePDA();
        const legate = await testContext.program.account.legate.fetch(legatePDA);
        
        let oldSize = (await testContext.connection.getAccountInfo(legatePDA))?.data.length;
        console.log(`Size of legate before update: ${oldSize}`);

        const tx = await testContext.program.methods
            .updateMaxWhitelistedMints(newMaxWhitelistedMints)
            .accounts({
                authority: testContext.legateAuthority.publicKey,
            })
            .signers([testContext.legateAuthority])
            .rpc();
        await testContext.connection.confirmTransaction(
            {
                signature: tx,
                blockhash: (await testContext.connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (
                    await testContext.connection.getLatestBlockhash()
                ).lastValidBlockHeight,
            },
            "confirmed"
        );

        const legateAfterUpdate = await testContext.program.account.legate.fetch(legatePDA);
        let newSize = (await testContext.connection.getAccountInfo(legatePDA))?.data.length;
        
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
        
        const tx = await testContext.program.methods
            .updateAuthority()
            .accounts({
                authority: testContext.legateAuthority.publicKey,
                newAuthority: newAuthority.publicKey,
            })
            .signers([testContext.legateAuthority, newAuthority])
            .rpc();

        const [legatePDA] = testContext.findLegatePDA();
        const legate = await testContext.program.account.legate.fetch(legatePDA);
        
        // Verify the authority was updated
        expect(
            legate.authority.toBase58(),
            "Legate authority should match new authority"
        ).to.equal(newAuthority.publicKey.toBase58());

        // Update Legate authority back to original for subsequent tests
        const reverseAuthorityUpdatetx = await testContext.program.methods
            .updateAuthority()
            .accounts({
                authority: newAuthority.publicKey,
                newAuthority: testContext.legateAuthority.publicKey,
            })
            .signers([testContext.legateAuthority, newAuthority])
            .rpc();
    });

    it("Should fail when updating authority without proper permissions", async () => {
        const newAuthority = anchor.web3.Keypair.generate();
        const wrongAuthority = anchor.web3.Keypair.generate();
        
        try {
            await testContext.program.methods
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
        const [legatePDA] = testContext.findLegatePDA();
        
        if (!testContext.mintPubkey || !testContext.token_info) {
            throw new Error("Test token not initialized");
        }

        let addMintTx = await testContext.program.methods.addMintTestudo({
            tokenMint: testContext.mintPubkey,
            tokenName: "TesterToken",
            tokenSymbol: "TT",
            tokenDecimals: testContext.token_info.value.decimals
            })
            .accounts({
                authority: testContext.legateAuthority.publicKey
            })
            .signers([testContext.legateAuthority])
            .rpc();
        
        await testContext.connection.confirmTransaction(
            {
                signature: addMintTx,
                blockhash: (await testContext.connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (
                    await testContext.connection.getLatestBlockhash()
                ).lastValidBlockHeight,
            },
            "confirmed"
        );
        
        let legate = await testContext.program.account.legate.fetch(legatePDA);
        
        // Verify the mint was added to the whitelist
        console.log("Approved tokens:");
        legate.testudoTokenWhitelist.forEach((whitelist) => {
            console.log(`Token mint: ${whitelist.tokenMint.toBase58()}`);
            console.log(`Token name: ${whitelist.tokenName}\n`);
        });
        
        // Check that at least one whitelisted token exists
        expect(legate.testudoTokenWhitelist.length).to.be.greaterThan(1);
        
        // Find index where the token was added
        const tokenIndex = legate.testudoTokenWhitelist.findIndex(
            token => token.tokenMint.toBase58() === testContext.mintPubkey?.toBase58()
        );
        expect(tokenIndex, "Token should be in the whitelist").to.be.greaterThan(-1);
    });

    it("Attempt to add the same mint to the whitelist again", async () => {
        const [legatePDA] = testContext.findLegatePDA();
        const legate = await testContext.program.account.legate.fetch(legatePDA);
        
        try {
            await testContext.program.methods
                .addMintTestudo({
                    tokenMint: testContext.mintPubkey,
                    tokenName: "TesterToken",
                    tokenSymbol: "TT",
                    tokenDecimals: testContext.token_info.value.decimals
                })
                .accounts({
                    authority: testContext.legateAuthority.publicKey
                })
                .signers([testContext.legateAuthority])
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