// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import TestudoIDL from "../target/idl/testudo.json";
import type { Testudo } from "../target/types/testudo";

// Re-export the generated IDL and type
export { Testudo, TestudoIDL };

// The programId is imported from the program IDL.
export const TESTUDO_PROGRAM_ID = new PublicKey(TestudoIDL.address);

// This is a helper function to get the Testudo Anchor program.
export function getTestudoProgram(provider: AnchorProvider) {
	return new Program(TestudoIDL as Testudo, provider);
}
