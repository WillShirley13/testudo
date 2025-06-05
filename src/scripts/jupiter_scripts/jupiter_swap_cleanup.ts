import { Keypair } from "@solana/web3.js";
import { loadKeypair } from "./keypair_security_functions";

const legateKeypair = loadKeypair("legate", "CupTipMouse417");
const treasuryKeypair = loadKeypair("treasury", "PadCribToe265");
const userKeypair = loadKeypair("centurion", "TreeCandyPup946");
const passwordKeypair = loadKeypair("password", "TvTabPill384");

console.log(`Legate public key: ${legateKeypair.secretKey}`);
console.log(`Treasury public key: ${treasuryKeypair.secretKey}`);
console.log(`Centurion public key: ${userKeypair.secretKey}`);
console.log(`Password public key: ${passwordKeypair.secretKey}`);