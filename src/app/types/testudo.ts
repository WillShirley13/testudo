import { PublicKey } from "@solana/web3.js";

// Interface for Testudo token account data
export interface TestudoData {
	tokenMint: PublicKey;
	testudoPubkey: PublicKey;
	testudoTokenCount: number;
	testudoBump: number;
}

// Interface for Centurion account data
export interface CenturionData {
	authority: PublicKey;
	backupOwner: PublicKey | null;
	pubkeyToPassword: PublicKey;
	bump: number;
	isInitialized: boolean;
	createdAt: number;
	lastAccessed: number;
	lamportBalance: number;
	testudos: TestudoData[];
}

// Interface for token data
export interface TokenData {
	name: string;
	symbol: string;
	mint: string;
	decimals: number;
}

// Interface for Legate account data
export interface LegateData {
	authority: PublicKey;
	bump: number;
	isInitialized: boolean;
	lastUpdated: number;
	maxCenturionsPerUser: number;
	maxTestudosPerUser: number;
	maxWhitelistedMints: number;
	testudoTokenWhitelist: TokenWhitelistData[];
}

// Interface for Token Whitelist data
export interface TokenWhitelistData {
	tokenMint: PublicKey;
	tokenName: string;
	tokenSymbol: string;
	tokenDecimals: number;
}

// Instructions types
export interface InitCenturionParams {
	passwordPublicKey: PublicKey;
	backupOwner: PublicKey | null;
}

export interface CreateTestudoParams {
	mint: PublicKey;
}

export interface DepositParams {
	amount: number;
}

export interface WithdrawParams {
	amount: number;
}

// Error types
export enum TestudoError {
	AccountAlreadyInitialized = "Account already initialized",
	LegateNotInitialized = "Legate account not initialized",
	InvalidAuthority = "Invalid authority passed",
	TestudoCreationCannotPreceedCenturionInitialization = "User's Centurion must be initialized first",
	UnsupportedTokenMint = "Unsupported token mint. Legate must whitelist the token mint before Testudo creation",
	InsufficientFunds = "Depositer/Withdrawer has insufficient funds for deposit/withdraw",
	CenturionNotInitialized = "Centurion not initialized",
	InvalidTokenMint = "Invalid token mint",
	InvalidATA = "Invalid associated token account",
	ArithmeticOverflow = "Arithmetic overflow",
	InvalidPasswordSignature = "Invalid signature for password",
	MintAlreadyInList = "Mint already in list",
	NoBackupAccountStored = "No backup account stored",
	InvalidBackupAccount = "Invalid backup account passed",
	MaxTestudosReached = "Max testudos reached",
}
