import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../target/types/testudo";
import * as web3 from "@solana/web3.js";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";

import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { randomBytes } from 'crypto';
import { SecureKeypairGenerator } from './keypair_functions';


describe("testudo", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace.Testudo as Program<Testudo>;
    console.log(program.programId.toBase58());
	const provider = anchor.getProvider() as anchor.AnchorProvider;
	const connection = new Connection("http://localhost:8899", "confirmed");
    

	const user = anchor.web3.Keypair.generate();
	(async () => {
		const tx = await connection.requestAirdrop(
			user.publicKey,
			web3.LAMPORTS_PER_SOL * 100
		);
		await connection.confirmTransaction(tx);
		console.log(`user: ${user.publicKey.toBase58()}`);
		console.log(await connection.getBalance(user.publicKey));
	})();

	it("should run the program", async () => {
		// Request airdrop first and wait for it to complete
		const airdropTx = await connection.requestAirdrop(
			user.publicKey,
			web3.LAMPORTS_PER_SOL * 100
		);
		await connection.confirmTransaction({
			signature: airdropTx,
			blockhash: (await connection.getLatestBlockhash()).blockhash,
			lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
		}, "confirmed");
		
		// Now proceed with the test after funding is complete
		try {
			const tx = await program.methods
				.initLegate()
				.accounts({
					authority: user.publicKey,
				})
				.signers([user])
				.rpc();
			console.log(tx);
			const [legatePDA] = PublicKey.findProgramAddressSync(
				[Buffer.from("legate")],
				program.programId
			);
			const legate = await program.account.legate.fetch(legatePDA);
			console.log(legate.authority.toBase58());
			console.log(user.publicKey.toBase58());
            const tx2 = await program.methods
				.initLegate()
				.accounts({
					authority: user.publicKey,
				})
				.signers([user])
				.rpc();
		} catch (error) {
			console.log(error);
		}
	});

    it("Create 5 word keypair", async () => {
        let keyManager = new SecureKeypairGenerator();
        let phrase = keyManager.generateRandomPhrase();
        console.log(`Password phrase: ${phrase}`);
        let { keypair: passwordKeypair } = keyManager.deriveKeypairFromWords(phrase);
        console.log(`Password public Key: ${passwordKeypair.publicKey.toBase58()}`);
        
        let { keypair: backupOwnerKeypair } = keyManager.deriveKeypairFromWords(phrase);
        console.log(`Backup Owner Public Key: ${backupOwnerKeypair.publicKey.toBase58()}`);

        let testUser = anchor.web3.Keypair.generate();
        let airdropTx = await connection.requestAirdrop(testUser.publicKey, web3.LAMPORTS_PER_SOL * 3);
        await connection.confirmTransaction(airdropTx);
        console.log(`Test User Public Key: ${testUser.publicKey.toBase58()}`);
        console.log(`Test User Balance: ${await connection.getBalance(testUser.publicKey)}`);

        let initCenturionTx = await program.methods
            .initCenturion(passwordKeypair.publicKey, backupOwnerKeypair.publicKey)
            .accounts({
                authority: testUser.publicKey,
            })
            .signers([testUser])
            .rpc();
        console.log(`Init Centurion tx: ${initCenturionTx}`);

        let depositSolTx = await program.methods
            .depositSol(new anchor.BN(1.5 * web3.LAMPORTS_PER_SOL))
            .accounts({
                authority: testUser.publicKey,
            })
            .signers([testUser])
            .rpc();
        console.log(`Deposit Sol tx: ${depositSolTx}`);

        let [centurionPDA, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from("centurion"), testUser.publicKey.toBuffer()],
            program.programId
        );
        let centurion = await program.account.centurion.fetch(centurionPDA);
        console.log(`Centurion: ${centurion.authority.toBase58()}`);
        console.log(`Centurion balance: ${await connection.getBalance(centurionPDA)}`);

        console.log(`Test User Balance BEFORE withdraw: ${await connection.getBalance(testUser.publicKey)}`);
        console.log(`Centurion balance BEFORE withdraw: ${await connection.getBalance(centurionPDA)}`);

        let intruderUser = anchor.web3.Keypair.generate();

        let withdrawSolTx = await program.methods
            .withdrawSol(new anchor.BN(0.7 * web3.LAMPORTS_PER_SOL))
            .accounts({
                authority: testUser.publicKey,
                validSignerOfPassword: passwordKeypair.publicKey,
            })
            .signers([testUser, passwordKeypair])
            .rpc();
        await connection.confirmTransaction(withdrawSolTx);
        console.log(`Withdraw Sol tx: ${withdrawSolTx}`);

        console.log(`Test User Balance AFTER withdraw: ${await connection.getBalance(testUser.publicKey)}`);
        console.log(`Centurion balance AFTER withdraw: ${await connection.getBalance(centurionPDA)}`);


    });
});
