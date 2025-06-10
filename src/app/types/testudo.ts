/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/testudo.json`.
 */

import { PublicKey } from "@solana/web3.js";
import idl from "../../../anchor/target/idl/testudo.json";
import { Testudo as TestudoType } from "../../../anchor/target/types/testudo";

export interface TestudoData {
	tokenMint: PublicKey;
	testudoPubkey: PublicKey;
}

export interface TokenWhitelistData {
	tokenMint: PublicKey;
	tokenName: string;
	tokenSymbol: string;
	tokenDecimals: number;
}

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

export interface LegateData {
	authority: PublicKey;
	bump: number;
	isInitialized: boolean;
	lastUpdated: number;
	maxCenturionsPerUser: number;
	maxTestudosPerUser: number;
	maxWhitelistedMints: number;
	testudoTokenWhitelist: TokenWhitelistData[];
	treasuryAcc: PublicKey;
	percentForFees: number;
}

export interface TokenData {
	name: string;
	symbol: string;
	mint: string;
	decimals: number;
}

export type Testudo = TestudoType;