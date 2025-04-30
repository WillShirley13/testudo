import { generateKeypairFromMnemonic, generateMnemonic, validateMnemonic } from '../keypair';
import { Keypair } from '@solana/web3.js';

describe('Keypair Utils', () => {
  describe('generateMnemonic', () => {
    it('should generate a valid 12-word mnemonic by default', () => {
      const mnemonic = generateMnemonic();
      expect(mnemonic.split(' ')).toHaveLength(12);
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it('should generate a valid mnemonic with custom word count', () => {
      const mnemonic = generateMnemonic(24);
      expect(mnemonic.split(' ')).toHaveLength(24);
      expect(validateMnemonic(mnemonic)).toBe(true);
    });
  });

  describe('validateMnemonic', () => {
    it('should validate correct mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(validateMnemonic(mnemonic)).toBe(true);
    });

    it('should reject invalid mnemonic', () => {
      const invalidMnemonic = 'not a valid mnemonic phrase';
      expect(validateMnemonic(invalidMnemonic)).toBe(false);
    });
  });

  describe('generateKeypairFromMnemonic', () => {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    
    it('should generate consistent keypair from mnemonic', () => {
      const keypair1 = generateKeypairFromMnemonic(testMnemonic);
      const keypair2 = generateKeypairFromMnemonic(testMnemonic);
      
      expect(keypair1.publicKey.toBase58()).toBe(keypair2.publicKey.toBase58());
      expect(Buffer.from(keypair1.secretKey).toString('hex'))
        .toBe(Buffer.from(keypair2.secretKey).toString('hex'));
    });

    it('should generate different keypairs for different derivation paths', () => {
      const keypair1 = generateKeypairFromMnemonic(testMnemonic, "m/44'/501'/0'/0'");
      const keypair2 = generateKeypairFromMnemonic(testMnemonic, "m/44'/501'/1'/0'");
      
      expect(keypair1.publicKey.toBase58()).not.toBe(keypair2.publicKey.toBase58());
    });

    it('should throw error for invalid mnemonic', () => {
      expect(() => {
        generateKeypairFromMnemonic('invalid mnemonic');
      }).toThrow('Invalid mnemonic phrase');
    });
  });
}); 