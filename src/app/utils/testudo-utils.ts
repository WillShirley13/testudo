import { PublicKey, Keypair } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Testudo } from "../../../anchor/target/types/testudo";
import { CenturionData, TokenData } from "../types/testudo";

// Find the Centurion PDA for a user
export const findCenturionPDA = (
	userWallet: PublicKey,
	programId: PublicKey
): [PublicKey, number] => {
	return PublicKey.findProgramAddressSync(
		[Buffer.from("centurion"), userWallet.toBuffer()],
		programId
	);
};

// Find the Testudo PDA for a specific token mint
export const findTestudoPDA = (
	centurionPDA: PublicKey,
	tokenMint: PublicKey,
	programId: PublicKey
): [PublicKey, number] => {
	return PublicKey.findProgramAddressSync(
		[centurionPDA.toBuffer(), tokenMint.toBuffer()],
		programId
	);
};

// Find the Legate PDA
export const findLegatePDA = (programId: PublicKey): [PublicKey, number] => {
	return PublicKey.findProgramAddressSync([Buffer.from("legate")], programId);
};

// Generate a keypair from a mnemonic/seed phrase
export const generateKeypairFromSeed = (phrase: string): Keypair => {
	// For simplicity, we're just using the phrase directly to derive a keypair
	// In a production app, you would want to use proper BIP39 derivation
	const seed = Buffer.from(phrase);
	return Keypair.fromSeed(seed.slice(0, 32));
};

// Check if a Centurion account exists
export const checkCenturionExists = async (
	program: Program<Testudo>,
	userWallet: PublicKey
): Promise<boolean> => {
	try {
		const [centurionPDA] = findCenturionPDA(userWallet, program.programId);
		await program.account.centurion.fetch(centurionPDA);
		return true;
	} catch (error) {
		return false;
	}
};

// Format a Solana balance with proper decimals
export const formatBalance = (
	balance: number | string | null | undefined,
	decimals: number = 9
): string => {
	if (!balance) return "0";
	return (Number(balance) / Math.pow(10, decimals)).toFixed(decimals);
};

// Format a timestamp into a readable date
export const formatTimestamp = (
	timestamp: number | string | null | undefined
): string => {
	if (!timestamp) return "N/A";
	return new Date(Number(timestamp) * 1000).toLocaleString();
};

// Shorten a public key for display
export const shortenAddress = (address: string, chars: number = 4): string => {
	return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Some example whitelisted tokens for testing
export const WHITELISTED_TOKENS: TokenData[] = [
	{
		name: "USDC",
		symbol: "USDC",
		mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
		decimals: 6,
	},
	{
		name: "Solana",
		symbol: "SOL",
		mint: "So11111111111111111111111111111111111111112",
		decimals: 9,
	},
	{
		name: "Bonk",
		symbol: "BONK",
		mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
		decimals: 5,
	},
];
