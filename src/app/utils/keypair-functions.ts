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
        5: {
            combinations: Math.pow(2048, 5),
            bitsOfEntropy: Math.log2(Math.pow(2048, 5)),
            timeToCrack: "~1,100 years (at 1M attempts/second)",
            securityRank: 1,
            description: "Medium security, but memorable - suitable for moderate value assets and where convenience is a priority."
        },
        6: {
            combinations: Math.pow(2048, 6),
            bitsOfEntropy: Math.log2(Math.pow(2048, 6)),
            timeToCrack: "~2.3 million years (at 1M attempts/second)",
            securityRank: 2,
            description: "High security and still memorable - recommended for significant value assets and where convenience is important."
        },
        8: {
            combinations: Math.pow(2048, 8),
            bitsOfEntropy: Math.log2(Math.pow(2048, 8)),
            timeToCrack: "Trillions of years (at 1M attempts/second)",
            securityRank: 3,
            description: "Very high security - comparable to many cryptocurrency wallet seed phrases."
        },
        10: {
            combinations: Math.pow(2048, 10),
            bitsOfEntropy: Math.log2(Math.pow(2048, 10)),
            timeToCrack: "Practically uncrackable even with quantum computers",
            securityRank: 4,
            description: "Ultra high security - comparable to full BIP39 seed phrases."
        },
        12: {
            combinations: Math.pow(2048, 12),
            bitsOfEntropy: Math.log2(Math.pow(2048, 12)),
            timeToCrack: "Impossible to crack with any foreseeable technology",
            securityRank: 5,
            description: "Maximum security - industry standard for cryptocurrency seed phrases."
        }
    };
    
    /**
     * Generate a random phrase with specified length and maximum entropy
     */
    generateRandomPhrase(length: number): string[] {
        // Ensure we have a wordlist
        if (!this.wordlist || this.wordlist.length === 0) {
            throw new Error("Wordlist not available");
        }
        
        // Only allow specific phrase lengths
        const validLengths = [5, 6, 8, 10, 12];
        if (!validLengths.includes(length)) {
            throw new Error("Phrase length must be 5, 6, 8, 10, or 12 words");
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
        const validLengths = [5, 6, 8, 10, 12];
        if (!Array.isArray(words) || !validLengths.includes(words.length)) {
            throw new Error("Phrase must be 5, 6, 8, 10, or 12 words");
        }
        
        // Normalize words (lowercase and trim)
        const normalizedWords = words.map(w => w.toLowerCase().trim());
        
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