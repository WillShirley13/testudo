import * as crypto from 'crypto';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as nacl from 'tweetnacl';

/**
 * Core functions for secure mnemonic phrase keypair generation
 */
export class SecureKeypairGenerator {
    // Use the standard BIP39 wordlist (2048 words)
    private readonly wordlist: string[] = bip39.wordlists.english;
    
    // Security parameters
    private readonly PBKDF2_ITERATIONS = 250000;
    private readonly SALT_PREFIX = 'secure-mnemonic-solana-keypair-v1';
    
    // Security information for different word lengths
    public readonly securityInfo = {
        4: {
            combinations: Math.pow(2048, 4),
            bitsOfEntropy: Math.log2(Math.pow(2048, 4)),
            description: "Basic security - suitable for small amounts. With 2048 possible words, a 4-word phrase provides approximately 44 bits of entropy."
        },
        5: {
            combinations: Math.pow(2048, 5),
            bitsOfEntropy: Math.log2(Math.pow(2048, 5)),
            description: "Medium security - good for moderate amounts. A 5-word phrase provides approximately 55 bits of entropy."
        },
        6: {
            combinations: Math.pow(2048, 6),
            bitsOfEntropy: Math.log2(Math.pow(2048, 6)),
            description: "High security - recommended for large amounts. A 6-word phrase provides approximately 66 bits of entropy."
        }
    };
    
    /**
     * Generate a random phrase with specified length and maximum entropy
     */
    generateRandomPhrase(length: 4 | 5 | 6): string[] {
        // Ensure we have a wordlist
        if (!this.wordlist || this.wordlist.length === 0) {
            throw new Error("Wordlist not available");
        }
        
        if (![4, 5, 6].includes(length)) {
            throw new Error("Phrase length must be 4, 5, or 6 words");
        }
        
        // Generate N truly random words using cryptographically secure randomness
        const words: string[] = [];
        const usedIndices = new Set<number>();
        
        // Use crypto.randomBytes for better randomness than Math.random()
        while (words.length < length) {
            // Generate 2 bytes (16 bits) of randomness for each word index
            const randomBuffer = crypto.randomBytes(2);
            // Convert to number between 0-2047
            const randomIndex = (randomBuffer[0] << 8 | randomBuffer[1]) % this.wordlist.length;
            
            // Ensure we don't pick the same word twice
            if (!usedIndices.has(randomIndex)) {
                words.push(this.wordlist[randomIndex]);
                usedIndices.add(randomIndex);
            }
        }
        
        return words;
    }
    
    /**
     * Derive a keypair from a mnemonic phrase using enhanced security techniques
     */
    deriveKeypairFromWords(words: string[]): { keypair: Keypair, words: string[] } {
        // Validate input
        if (!Array.isArray(words) || ![4, 5, 6].includes(words.length)) {
            throw new Error("Phrase must be 4, 5, or 6 words");
        }
        
        // Check that all words are in the wordlist
        const normalizedWords = words.map(w => w.toLowerCase().trim());
        for (const word of normalizedWords) {
            if (!this.wordlist.includes(word)) {
                throw new Error(`Word "${word}" is not in the BIP39 wordlist`);
            }
        }
        
        // Create canonical representation (lowercase, space-separated)
        const phrase = normalizedWords.join(' ');
        
        // Use a domain-specific salt
        const salt = `${this.SALT_PREFIX}-${phrase.length}`;
        
        // Use PBKDF2 for key stretching - makes brute-force attacks much slower
        const derivedKey = crypto.pbkdf2Sync(
            phrase,                 // Password (the mnemonic phrase)
            salt,                   // Salt (unique to this application)
            this.PBKDF2_ITERATIONS, // Iterations (high number for better security)
            64,                     // Output key length (64 bytes)
            'sha512'                // Hash algorithm
        );
        
        // Use the first 32 bytes for the Ed25519 keypair
        const seed = derivedKey.slice(0, 32);
        
        // Create the Solana keypair
        const keypair = Keypair.fromSeed(seed);
        
        return { keypair, words: normalizedWords };
    }
    
    /**
     * Signs a message using the keypair derived from a mnemonic phrase
     */
    signMessage(message: Buffer, words: string[]): Uint8Array {
        const { keypair } = this.deriveKeypairFromWords(words);
        return nacl.sign.detached(message, keypair.secretKey);
    }
    
    /**
     * Verifies a message signature using the public key
     */
    verifySignature(message: Buffer, signature: Uint8Array, publicKey: Uint8Array): boolean {
        return nacl.sign.detached.verify(message, signature, publicKey);
    }
}
