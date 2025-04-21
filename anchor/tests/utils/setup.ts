import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../../target/types/testudo";
import * as web3 from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from "@solana/spl-token";
import { SecureKeypairGenerator } from "../keypair_functions";

import { expect } from "chai";

// Global test setup that will be shared across all test files
export class TestSetup {
    // Core program variables
    program: Program<Testudo>;
    provider: anchor.AnchorProvider;
    connection: Connection;
    
    // Test accounts
    legateAuthority: web3.Keypair;
    testUser: web3.Keypair;
    
    // Token variables
    mintPubkey: PublicKey | null = null;
    ata: any;
    token_info: any;
    
    // Password-related variables
    keyManager: SecureKeypairGenerator;
    phrase: string[];
    passwordKeypair: web3.Keypair;
    backupOwnerKeypair: web3.Keypair;

    constructor() {
        // Set up Anchor provider and program
        anchor.setProvider(anchor.AnchorProvider.env());
        this.program = anchor.workspace.Testudo as Program<Testudo>;
        this.provider = anchor.getProvider() as anchor.AnchorProvider;
        this.connection = new Connection("http://localhost:8899", "confirmed");
        
        // Generate test keypairs
        this.legateAuthority = anchor.web3.Keypair.generate();
        this.testUser = anchor.web3.Keypair.generate();
        
        // Setup password keypairs
        this.keyManager = new SecureKeypairGenerator();
        this.phrase = this.keyManager.generateRandomPhrase();
        this.passwordKeypair = this.keyManager.deriveKeypairFromWords(this.phrase).keypair;
        this.backupOwnerKeypair = this.keyManager.deriveKeypairFromWords(this.phrase).keypair;
    }

    // Initialize the test environment with SOL airdrops and token setup
    async initialize() {
        console.log("==== TEST ENVIRONMENT SETUP ====");
        console.log(`Program ID: ${this.program.programId.toBase58()}`);
        console.log(`legateAuthority: ${this.legateAuthority.publicKey.toBase58()}`);
        console.log(`Password phrase: ${this.phrase}`);
        console.log(`Password public Key: ${this.passwordKeypair.publicKey.toBase58()}`);
        console.log(`Backup Owner Public Key: ${this.backupOwnerKeypair.publicKey.toBase58()}`);
        
        // Airdrop SOL to test user
        await this.airdropSol(this.testUser.publicKey, 3);
        
        // Create test token and mint some to the test user
        await this.setupTestToken();
        
        console.log("==== SETUP COMPLETE ====\n");
    }
    
    // Helper method to airdrop SOL
    async airdropSol(publicKey: PublicKey, amount: number) {
        const airdropTx = await this.connection.requestAirdrop(
            publicKey,
            web3.LAMPORTS_PER_SOL * amount
        );
        await this.connection.confirmTransaction(
            {
                signature: airdropTx,
                blockhash: (await this.connection.getLatestBlockhash()).blockhash,
                lastValidBlockHeight: (
                    await this.connection.getLatestBlockhash()
                ).lastValidBlockHeight,
            },
            "confirmed"
        );
        console.log(`Airdropped ${amount} SOL to ${publicKey.toBase58()}`);
    }
    
    // Helper method to create a test token and mint some to the test user
    async setupTestToken() {
        this.mintPubkey = await createMint(
            this.connection,
            this.testUser,
            this.testUser.publicKey,
            null,
            8
        );
        console.log(`Mint: ${this.mintPubkey.toBase58()}`);
        
        this.ata = await getOrCreateAssociatedTokenAccount(
            this.connection,
            this.testUser,
            this.mintPubkey,
            this.testUser.publicKey
        );
        console.log(`User's ATA address: ${this.ata.address.toBase58()}`);
        
        // Mint 100 tokens
        const amount = 100 * 10 ** 8;
        await mintTo(
            this.connection,
            this.testUser,
            this.mintPubkey,
            this.ata.address,
            this.testUser,
            amount
        );
        
        this.token_info = await this.connection.getTokenAccountBalance(this.ata.address);
        console.log(`User's ATA balance: ${this.token_info.value.uiAmount}\n`);
    }
    
    // Helper to find the Legate PDA
    findLegatePDA(): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("legate")],
            this.program.programId
        );
    }
    
    // Helper to find a Centurion PDA for a specific user
    findCenturionPDA(userPublicKey: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("centurion"), userPublicKey.toBuffer()],
            this.program.programId
        );
    }
} 