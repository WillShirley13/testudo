"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadKeypair = exports.saveKeypair = void 0;
// src/scripts/keypair-utils.ts
const crypto = require("crypto");
const fs = require("fs");
const web3_js_1 = require("@solana/web3.js");
/**
 * Encrypts and saves a Solana keypair to disk
 *
 * @param keypair - The Solana keypair to encrypt and save
 * @param name - The filename (without extension) to save as
 * @param password - Password used for AES-256-CBC encryption
 *
 * Creates an encrypted file at: src/scripts/keys/{name}.enc
 * The file contains the encrypted secret key bytes as a hex string
 */
function saveKeypair(keypair, name, password) {
    // Generate a random 16-byte IV for AES-256-CBC
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(Array.from(keypair.secretKey)), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend IV to encrypted data
    const encryptedWithIv = iv.toString('hex') + ':' + encrypted;
    fs.writeFileSync(`src/scripts/keys/${name}.enc`, encryptedWithIv);
    console.log(`${name}: ${keypair.publicKey.toBase58()}`);
}
exports.saveKeypair = saveKeypair;
/**
 * Loads and decrypts a Solana keypair from disk
 *
 * @param name - The filename (without extension) to load from
 * @param password - Password used to decrypt the file
 * @returns The decrypted Solana Keypair object
 *
 * Reads the encrypted file from: src/scripts/keys/{name}.enc
 * Decrypts the hex string back to the original secret key bytes
 */
function loadKeypair(name, password) {
    const encryptedWithIv = fs.readFileSync(`src/scripts/keys/${name}.enc`, 'utf8');
    // Split IV and encrypted data
    const [ivHex, encrypted] = encryptedWithIv.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(password, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return web3_js_1.Keypair.fromSecretKey(new Uint8Array(JSON.parse(decrypted)));
}
exports.loadKeypair = loadKeypair;
