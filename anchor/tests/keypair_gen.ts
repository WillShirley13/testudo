// import * as crypto from 'crypto';
// import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// import * as bip39 from 'bip39';
// import * as nacl from 'tweetnacl';

// /**
//  * Create a cryptographically secure keypair from a 6-word phrase
//  * with enhanced protection against brute-force attacks
//  */
// class SecureSixWordKeypair {
//     // Use the standard BIP39 wordlist (2048 words)
//     private readonly wordlist: string[] = bip39.wordlists.english;
    
//     // These parameters increase security while remaining deterministic
//     private readonly PBKDF2_ITERATIONS = 250000; // Much higher than BIP39's 2048
//     private readonly SALT_PREFIX = 'secure-six-word-solana-keypair-v1';
    
//     /**
//      * Generate a random 6-word phrase with maximum entropy
//      */
//     generateRandomPhrase(): string[] {
//         // Ensure we have a wordlist
//         if (!this.wordlist || this.wordlist.length === 0) {
//             throw new Error("Wordlist not available");
//         }
        
//         // Generate 6 truly random words using cryptographically secure randomness
//         const words: string[] = [];
//         const usedIndices = new Set<number>();
        
//         // Use crypto.randomBytes for better randomness than Math.random()
//         while (words.length < 6) {
//             // Generate 2 bytes (16 bits) of randomness for each word index (enough for 0-2047)
//             const randomBuffer = crypto.randomBytes(2);
//             // Convert to number between 0-2047
//             const randomIndex = (randomBuffer[0] << 8 | randomBuffer[1]) % this.wordlist.length;
            
//             // Ensure we don't pick the same word twice
//             if (!usedIndices.has(randomIndex)) {
//                 words.push(this.wordlist[randomIndex]);
//                 usedIndices.add(randomIndex);
//             }
//         }
        
//         return words;
//     }
    
//     /**
//      * Derive a keypair from a 6-word phrase using enhanced security
//      * techniques to resist brute-force attacks
//      */
//     deriveKeypairFromWords(words: string[]): { keypair: Keypair, words: string[] } {
//         // Validate input
//         if (!Array.isArray(words) || words.length !== 6) {
//             throw new Error("Exactly 6 words are required");
//         }
        
//         // Check that all words are in the wordlist
//         const normalizedWords = words.map(w => w.toLowerCase().trim());
//         for (const word of normalizedWords) {
//             if (!this.wordlist.includes(word)) {
//                 throw new Error(`Word "${word}" is not in the BIP39 wordlist`);
//             }
//         }
        
//         // Create canonical representation (lowercase, space-separated)
//         const phrase = normalizedWords.join(' ');
        
//         // Use a domain-specific salt based on the application and phrase length
//         // This prevents rainbow table attacks and makes the derivation specific to this application
//         const salt = `${this.SALT_PREFIX}-${phrase.length}`;
        
//         // Use PBKDF2 for key stretching - makes brute-force attacks much slower
//         // This is similar to BIP39 but with many more iterations for better security
//         const derivedKey = crypto.pbkdf2Sync(
//             phrase,                 // Password (the 6-word phrase)
//             salt,                   // Salt (unique to this application)
//             this.PBKDF2_ITERATIONS, // Iterations (high number for better security)
//             64,                     // Output key length (64 bytes)
//             'sha512'                // Hash algorithm
//         );
        
//         // Use the first 32 bytes for the Ed25519 keypair
//         // Ed25519 requires exactly 32 bytes of seed
//         const seed = derivedKey.slice(0, 32);
        
//         // Create the Solana keypair
//         const keypair = Keypair.fromSeed(seed);
        
//         return { keypair, words: normalizedWords };
//     }
    
//     /**
//      * Signs a message using the keypair derived from a 6-word phrase
//      * For use with on-chain verification
//      */
//     signMessage(message: Buffer, words: string[]): Uint8Array {
//         const { keypair } = this.deriveKeypairFromWords(words);
//         return nacl.sign.detached(message, keypair.secretKey);
//     }
    
//     /**
//      * Verifies a message signature using the public key
//      * This can be done on-chain in a Solana program
//      */
//     verifySignature(message: Buffer, signature: Uint8Array, publicKey: Uint8Array): boolean {
//         return nacl.sign.detached.verify(message, signature, publicKey);
//     }
// }

// // --- Example Usage ---

// // Initialize the secure keypair generator
// const keyManager = new SecureSixWordKeypair();

// // Option 1: Generate a new random 6-word phrase and keypair
// const randomWords = keyManager.generateRandomPhrase();
// const { keypair: newKeypair } = keyManager.deriveKeypairFromWords(randomWords);

// let connection = new Connection("https://api.devnet.solana.com");

// console.log("=== New Secure 6-Word Keypair ===");
// console.log("Phrase:", randomWords.join(' '));
// console.log("Public Key:", newKeypair.publicKey.toBase58());

// // Example: Sign and verify a message
// const message = Buffer.from("Test message for Solana program verification");
// const signature = keyManager.signMessage(message, randomWords);

// console.log("\n=== Signature Example ===");
// console.log("Message:", message.toString());
// console.log("Signature (base64):", Buffer.from(signature).toString('base64'));
// console.log("Verification:", keyManager.verifySignature(
//     message, 
//     signature, 
//     newKeypair.publicKey.toBytes()
// ));

// // Option 2: Recover keypair from existing 6 words
// const existingWords = ["abandon", "ability", "able", "about", "above", "absent"];
// try {
//     const { keypair: recoveredKeypair } = keyManager.deriveKeypairFromWords(existingWords);
    
//     console.log("\n=== Recovered Keypair ===");
//     console.log("From Phrase:", existingWords.join(' '));
//     console.log("Public Key:", recoveredKeypair.publicKey.toBase58());
//     let make_airdrop = async () => {
//         console.log(`Balance: ${await connection.getBalance(recoveredKeypair.publicKey)}`);
//     };
//     make_airdrop();
// } catch (error) {
//     console.error("Recovery error:", error);
// }


// // Example instructions for using in a Solana program:
// console.log("\n=== How to Use with Solana Programs ===");
// console.log("1. Store the public key on-chain");
// console.log("2. Sign messages client-side using your 6 words");
// console.log("3. Pass the signature to your Solana program");
// console.log("4. Verify the signature on-chain using solana_program::ed25519_program::verify()");