import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../target/types/testudo";
import { PublicKey, Connection } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from "@solana/spl-token";
import { SecureKeypairGenerator } from "./keypair_functions";

// Program variables
let program: Program<Testudo>;
let provider: anchor.AnchorProvider;
let connection: Connection;

// Test accounts
let legateAuthority: web3.Keypair;
let testUser: web3.Keypair;

// Token variables
let mintPubkey: PublicKey | null = null;
let ata: any;
let token_info: any;

// Password-related variables
let keyManager: SecureKeypairGenerator;
let phrase: string[];
let passwordKeypair: web3.Keypair;
let backupOwnerKeypair: web3.Keypair;

// Helper method to airdrop SOL
async function airdropSol(publicKey: PublicKey, amount: number) {
    const airdropTx = await connection.requestAirdrop(
        publicKey,
        web3.LAMPORTS_PER_SOL * amount
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
    console.log(`Airdropped ${amount} SOL to ${publicKey.toBase58()}`);
}

// Helper method to create a test token and mint some to the test user
async function setupTestToken() {
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
    console.log(`User's ATA address: ${ata.address.toBase58()}`);
    
    // Mint 100 tokens
    const amount = 100 * 10 ** 8;
    await mintTo(
        connection,
        testUser,
        mintPubkey,
        ata.address,
        testUser,
        amount
    );
    
    token_info = await connection.getTokenAccountBalance(ata.address);
    console.log(`User's ATA balance: ${token_info.value.uiAmount}\n`);
    return mintPubkey;
}

// Helper to find the Legate PDA
function findLegatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("legate")],
        program.programId
    );
}

// Helper to find a Centurion PDA for a specific user
function findCenturionPDA(userPublicKey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("centurion"), userPublicKey.toBuffer()],
        program.programId
    );
}

// Setup before all tests
before(async () => {
    // Set up Anchor provider and program
    anchor.setProvider(anchor.AnchorProvider.env());
    program = anchor.workspace.Testudo as Program<Testudo>;
    provider = anchor.getProvider() as anchor.AnchorProvider;
    connection = new Connection("http://localhost:8899", "confirmed");
    
    // Generate test keypairs
    legateAuthority = anchor.web3.Keypair.generate();
    testUser = anchor.web3.Keypair.generate();
    
    // Setup password keypairs
    keyManager = new SecureKeypairGenerator();
    phrase = keyManager.generateRandomPhrase();
    passwordKeypair = keyManager.deriveKeypairFromWords(phrase).keypair;
    backupOwnerKeypair = keyManager.deriveKeypairFromWords(phrase).keypair;

    console.log("==== TEST ENVIRONMENT SETUP ====");
    console.log(`Program ID: ${program.programId.toBase58()}`);
    console.log(`legateAuthority: ${legateAuthority.publicKey.toBase58()}`);
    console.log(`Password phrase: ${phrase}`);
    console.log(`Password public Key: ${passwordKeypair.publicKey.toBase58()}`);
    console.log(`Backup Owner Public Key: ${backupOwnerKeypair.publicKey.toBase58()}`);
    
    // Airdrop SOL to test user
    await airdropSol(testUser.publicKey, 3);
    
    // Create test token and mint some to the test user
    await setupTestToken();
    
    console.log("==== SETUP COMPLETE ====\n");
});

// First run Legate tests
describe("Legate Administration Tests", () => {
    before(async () => {
        // Additional setup specific to Legate tests
        console.log("==== STARTING LEGATE ADMIN TESTS ====");
        await airdropSol(legateAuthority.publicKey, 100);
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
        
        // Get the legate account data
        const [legatePDA] = findLegatePDA();
        const legate = await program.account.legate.fetch(legatePDA);

        // Verify the legate account has been properly initialized
        expect(legate.isInitialized, "Legate should be initialized").to.equal(true);
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
        const [legatePDA] = findLegatePDA();
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
        
        // Verify the maxTestudosPerUser value has been updated correctly
        expect(
            legateAfterUpdate.maxTestudosPerUser,
            "Max testudos per user should match new value"
        ).to.equal(newMaxTestudosPerUser);
    });

    it("Update max whitelisted mints", async () => {
        const newMaxWhitelistedMints = 100;
        const [legatePDA] = findLegatePDA();
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

        const [legatePDA] = findLegatePDA();
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
        const [legatePDA] = findLegatePDA();
        
        if (!mintPubkey || !token_info) {
            throw new Error("Test token not initialized");
        }

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
        expect(legate.testudoTokenWhitelist.length).to.be.greaterThan(1);
        
        // Find index where the token was added
        const tokenIndex = legate.testudoTokenWhitelist.findIndex(
            token => token.tokenMint.toBase58() === mintPubkey?.toBase58()
        );
        expect(tokenIndex, "Token should be in the whitelist").to.be.greaterThan(-1);
    });

    it("Attempt to add the same mint to the whitelist again", async () => {
        const [legatePDA] = findLegatePDA();
        const legate = await program.account.legate.fetch(legatePDA);
        
        try {
            await program.methods
                .addMintTestudo({
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

// Then run Centurion tests
describe("Centurion Account Operations", () => {
    before(async () => {
        // Run global test setup
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

        // Get the Centurion PDA for this user
        let [centurionPDA] = findCenturionPDA(testUser.publicKey);
        let centurion = await program.account.centurion.fetch(centurionPDA);
        
        // Verify the account was created correctly
        expect(
            centurion.pubkeyToPassword.toBase58(),
            "Pubkey to password should match password keypair public key"
        ).to.equal(passwordKeypair.publicKey.toBase58());
    });

    it("Deposit SOL to Centurion account", async () => {
        let [centurionPDA] = findCenturionPDA(testUser.publicKey);
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
            console.log(`Error successfully thrown when depositing more SOL than available: ${error}`);
        }
    });

    it("Withdraw SOL from Centurion account with password authentication", async () => {
        let [centurionPDA] = findCenturionPDA(testUser.publicKey);

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
    
    // Additional tests can be added here as needed
    it("Should fail when withdrawing with incorrect password signer", async () => {
        let [centurionPDA] = findCenturionPDA(testUser.publicKey);
        const incorrectPasswordSigner = anchor.web3.Keypair.generate();
        
        try {
            await program.methods
                .withdrawSol(new anchor.BN(0.1 * web3.LAMPORTS_PER_SOL))
                .accountsPartial({
                    authority: testUser.publicKey,
                    validSignerOfPassword: incorrectPasswordSigner.publicKey,
                })
                .signers([testUser, incorrectPasswordSigner])
                .rpc();
            expect.fail("Should have thrown an error");
        } catch (error) {
            console.log(`Error successfully thrown when withdrawing with incorrect password signer: ${error}`);
        }
    });

    it("Create a Centurion Testudo (SPL Token) account", async () => {
        let [centurionPDA] = findCenturionPDA(testUser.publicKey);
        
        await setupTestToken();
        console.log(`Mint pubkey: ${mintPubkey}`);
        let accountTokenInfo = await connection.getTokenAccountBalance(ata.address);
        console.log(`Token info: ${JSON.stringify(accountTokenInfo)}`);

        let centurion = await program.account.centurion.fetch(centurionPDA);
        console.log(`Centurion current testudos BEFORE creation: ${centurion.testudos}`);

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

        await connection.confirmTransaction(
            {
                signature: createTokenAccountTx,
                blockhash: (await connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            },
            "confirmed"
        );

        centurion = await program.account.centurion.fetch(centurionPDA);
        console.log(`Centurion current testudos AFTER creation: ${centurion.testudos}`);
    });
}); 