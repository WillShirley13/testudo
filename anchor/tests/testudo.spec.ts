import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../target/types/testudo";
import * as web3 from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { SecureKeypairGenerator } from './keypair_functions';

import { expect } from 'chai';
import { assert } from "console";


describe("Legate account related tests", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace.Testudo as Program<Testudo>;

    console.log(`Program ID: ${program.programId.toBase58()}`);
	const provider = anchor.getProvider() as anchor.AnchorProvider;
	const connection = new Connection("http://localhost:8899", "confirmed");
    
    // Generate a keypair for the legate authority
	const legateAuthority = anchor.web3.Keypair.generate();
	console.log(`legateAuthority: ${legateAuthority.publicKey.toBase58()}`);

	it("Initialize Legate", async () => {
		// Request airdrop first and wait for it to complete
		const airdropTx = await connection.requestAirdrop(
			legateAuthority.publicKey,
			web3.LAMPORTS_PER_SOL * 100
		);
		await connection.confirmTransaction({
			signature: airdropTx,
			blockhash: (await connection.getLatestBlockhash()).blockhash,
			lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
		}, "confirmed");
		// Now proceed with the test after funding is complete
    
        const tx = await program.methods
            .initLegate()
            .accounts({
                authority: legateAuthority.publicKey,
            })
            .signers([legateAuthority])
            .rpc();
        console.log(tx);
        const [legatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("legate")],
            program.programId
        );
        const legate = await program.account.legate.fetch(legatePDA);

        expect(legate.isInitialized, "Legate should be initialized").to.equal(true);
        console.log("Test: Legate initialized - passed");
        expect(legate.authority.toBase58(), "Legate authority should match authority passed in initLegate instruction").to.equal(legateAuthority.publicKey.toBase58());
        console.log("Test: Legate authority - passed");
		expect(legate.maxTestudosPerUser, "Max testudos per user should be 30").to.equal(30);
        console.log("Test: Max testudos per user - passed");
	});

    it("Try to initialize legate again", async () => {
        expect(program.methods
            .initLegate()
            .accounts({
                authority: legateAuthority.publicKey,
            })
        ).to.throw;
        console.log("Test: Legate already initialized - passed");
    })
    it("Update legate max testudos per user", async () => {
        const newMaxTestudosPerUser = 50;
        const [legatePDA, _] = PublicKey.findProgramAddressSync(
            [Buffer.from("legate")],
            program.programId
        );
        const legate = await program.account.legate.fetch(legatePDA);
        console.log(`Legate max testudos per user (before update): ${legate.maxTestudosPerUser}`);
        const tx = await program.methods.updateMaxTestudos(newMaxTestudosPerUser).accounts({
            authority: legateAuthority.publicKey,
        })
        .signers([legateAuthority])
        .rpc();
        console.log(`Update max testudos per user tx: ${tx}`);
        const legateAfterUpdate = await program.account.legate.fetch(legatePDA);
        console.log(`Legate max testudos per user (after update): ${legateAfterUpdate.maxTestudosPerUser}`);
        expect(legateAfterUpdate.maxTestudosPerUser, "Max testudos per user should match new value").to.equal(newMaxTestudosPerUser);
        console.log("Test: Max testudos per user updated - passed");
    })

    it("Update legate max whitelisted mints", async () => {
        const newMaxWhitelistedMints = 100;
        const [legatePDA, _] = PublicKey.findProgramAddressSync(
            [Buffer.from("legate")],
            program.programId
        );
        const legate = await program.account.legate.fetch(legatePDA);
        console.log(`Legate max whitelisted mints (before update): ${legate.maxWhitelistedMints}`);

        let oldSize = (await connection.getAccountInfo(legatePDA))?.data.length;
        console.log(`Size of legate before update: ${oldSize}`);

        const tx = await program.methods.updateMaxWhitelistedMints(newMaxWhitelistedMints).accounts({
            authority: legateAuthority.publicKey,
        })
        .signers([legateAuthority])
        .rpc();
        await connection.confirmTransaction({
            signature: tx,
            blockhash: (await connection.getLatestBlockhash()).blockhash,
            lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
        }, "confirmed");

        console.log(`Update max whitelisted mints tx: ${tx}`);

        const legateAfterUpdate = await program.account.legate.fetch(legatePDA);
        console.log(`Legate max whitelisted mints (after update): ${legateAfterUpdate.maxWhitelistedMints}`);
        let newSize = (await connection.getAccountInfo(legatePDA))?.data.length;
        console.log(`Size of legate after update: ${newSize}`);

        expect(legateAfterUpdate.maxWhitelistedMints, "Max whitelisted mints should match new value").to.equal(newMaxWhitelistedMints);
        expect(newSize, "New size of legate should be 8159 bytes").to.equal(8159);
        console.log("Test: Max whitelisted mints updated - passed");
    })

    
    it("Update Legate authority", async () => {
        const newAuthority = anchor.web3.Keypair.generate();
        console.log(`New authority: ${newAuthority.publicKey.toBase58()}`);
        const tx = await program.methods.updateAuthority().accounts({
            authority: legateAuthority.publicKey,
            newAuthority: newAuthority.publicKey,
        })
        .signers([legateAuthority, newAuthority])
        .rpc();

        console.log(`Update authority tx: ${tx}`);
        const [legatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("legate")],
            program.programId
        );
        const legate = await program.account.legate.fetch(legatePDA);
        console.log(`Legate authority (after update): ${legate.authority.toBase58()}`);
        expect(legate.authority.toBase58(), "Legate authority should match new authority").to.equal(newAuthority.publicKey.toBase58());
        console.log("Test: Legate authority updated - passed");
    })

    it("Try to update legate authority with wrong authority", async () => {
        const newAuthority = anchor.web3.Keypair.generate();
        const wrongAuthority = anchor.web3.Keypair.generate();  
        console.log(`New authority: ${newAuthority.publicKey.toBase58()}`);
        console.log(`Wrong authority: ${wrongAuthority.publicKey.toBase58()}`);
        // 
        try {
            await program.methods
                .updateAuthority()
                .accounts({
                    authority: wrongAuthority.publicKey,
                    newAuthority: newAuthority.publicKey,
                })
                .signers([wrongAuthority, newAuthority])
                .rpc()
            expect.fail("Should have thrown an error");
        } catch (error) {
            console.log(`Error: ${error}`);
            console.log("Test: Wrong current authority when updating legate authority - passed");
        }
    })

})

    // it("Create 5 word keypair", async () => {
    //     let keyManager = new SecureKeypairGenerator();
    //     let phrase = keyManager.generateRandomPhrase();
    //     console.log(`Password phrase: ${phrase}`);
    //     let { keypair: passwordKeypair } = keyManager.deriveKeypairFromWords(phrase);
    //     console.log(`Password public Key: ${passwordKeypair.publicKey.toBase58()}`);
        
    //     let { keypair: backupOwnerKeypair } = keyManager.deriveKeypairFromWords(phrase);
    //     console.log(`Backup Owner Public Key: ${backupOwnerKeypair.publicKey.toBase58()}`);

    //     let testUser = anchor.web3.Keypair.generate();
    //     let airdropTx = await connection.requestAirdrop(testUser.publicKey, web3.LAMPORTS_PER_SOL * 3);
    //     await connection.confirmTransaction(airdropTx);
    //     console.log(`Test User Public Key: ${testUser.publicKey.toBase58()}`);
    //     console.log(`Test User Balance: ${await connection.getBalance(testUser.publicKey)}`);

    //     let initCenturionTx = await program.methods
    //         .initCenturion(passwordKeypair.publicKey, backupOwnerKeypair.publicKey)
    //         .accounts({
    //             authority: testUser.publicKey,
    //         })
    //         .signers([testUser])
    //         .rpc();
    //     console.log(`Init Centurion tx: ${initCenturionTx}`);

    //     let depositSolTx = await program.methods
    //         .depositSol(new anchor.BN(1.5 * web3.LAMPORTS_PER_SOL))
    //         .accounts({
    //             authority: testUser.publicKey,
    //         })
    //         .signers([testUser])
    //         .rpc();
    //     console.log(`Deposit Sol tx: ${depositSolTx}`);

    //     let [centurionPDA, bump] = PublicKey.findProgramAddressSync(
    //         [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
    //         program.programId
    //     );
    //     let centurion = await program.account.centurion.fetch(centurionPDA);
    //     console.log(`Centurion: ${centurion.authority.toBase58()}`);
    //     console.log(`Centurion balance: ${await connection.getBalance(centurionPDA)}`);

    //     console.log(`Test User Balance BEFORE withdraw: ${await connection.getBalance(testUser.publicKey)}`);
    //     console.log(`Centurion balance BEFORE withdraw: ${await connection.getBalance(centurionPDA)}`);

    //     let intruderUser = anchor.web3.Keypair.generate();

    //     let withdrawSolTx = await program.methods
    //         .withdrawSol(new anchor.BN(0.7 * web3.LAMPORTS_PER_SOL))
    //         .accountsPartial({
    //             authority: testUser.publicKey,
    //             validSignerOfPassword: passwordKeypair.publicKey,
    //         })
    //         .signers([testUser, passwordKeypair])
    //         .rpc();
    //     await connection.confirmTransaction(withdrawSolTx);
    //     console.log(`Withdraw Sol tx: ${withdrawSolTx}`);

    //     console.log(`Test User Balance AFTER withdraw: ${await connection.getBalance(testUser.publicKey)}`);
    //     console.log(`Centurion balance AFTER withdraw: ${await connection.getBalance(centurionPDA)}`);


    // });

