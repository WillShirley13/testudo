"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { findLegatePDA, findCenturionPDA, findTestudoPDA } from "@/app/utils/testudo-utils";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import { TokenWhitelistData, TokenData } from "@/app/types/testudo";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";


// Define a default SOL token to ensure it's always available
const DEFAULT_SOL_TOKEN: TokenData = {
	name: "Solana",
	symbol: "SOL",
	mint: "So11111111111111111111111111111111111111112",
	decimals: 9,
};

interface CreateTestudoModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (updatedCenturionData: any) => void;
	isCreating: boolean;
	setIsCreating: (isCreating: boolean) => void;
}

export function CreateTestudoModal({
	isOpen,
	onClose,
	onSuccess,
	isCreating,
	setIsCreating,
}: CreateTestudoModalProps) {
	const wallet = useWallet();
	const { publicKey } = wallet;
	const provider = useAnchorProvider();
	const testudoProgram = useTestudoProgram();
	const [selectedMint, setSelectedMint] = useState("");
	const [whitelistedTokens, setWhitelistedTokens] = useState<TokenData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch the whitelist tokens from the Legate account
	useEffect(() => {
		if (!isOpen) return;

		const fetchWhitelistedTokens = async () => {
			try {
				setIsLoading(true);
				const [legatePDA] = findLegatePDA(testudoProgram.programId);
				const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);

				for (const token of legateAccount.testudoTokenWhitelist) {
					console.log("Token:", token.tokenMint.toString());
				}

				// Convert to our frontend data type
				const tokens: TokenData[] = legateAccount.testudoTokenWhitelist.map((token: TokenWhitelistData) => ({
					name: token.tokenName,
					symbol: token.tokenSymbol,
					mint: token.tokenMint.toString(),
					decimals: token.tokenDecimals,
				}));

				// Filter out SOL as it's handled specially
				const filteredTokens = tokens.filter(token => 
					token.mint !== "So11111111111111111111111111111111111111112"
				);

				setWhitelistedTokens(filteredTokens);
			} catch (error) {
				console.error("Error fetching whitelisted tokens:", error);
				setWhitelistedTokens([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchWhitelistedTokens();
	}, [isOpen, testudoProgram]);

	const handleCreateTestudo = async (mintAddress: string) => {
		if (!publicKey) return;

		try {
			setIsCreating(true);

            console.log("Creating Testudo for mint address:", mintAddress);

			const mintPubkey = new PublicKey(mintAddress);
			const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
			const [testudoPDA] = findTestudoPDA(centurionPDA, mintPubkey, testudoProgram.programId);
			const [legatePDA] = findLegatePDA(testudoProgram.programId);

			// Check which token program the mint belongs to
			const mintInfo = await testudoProgram.provider.connection.getAccountInfo(mintPubkey);
			if (!mintInfo) {
				throw new Error("Mint account not found");
			}

			const tokenProgramId = mintInfo.owner;
			const isToken2022 = tokenProgramId.equals(new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));
			const isRegularToken = tokenProgramId.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"));

			if (!isToken2022 && !isRegularToken) {
				throw new Error("Mint is not owned by a recognized token program");
			}

			console.log(`Initializing Testudo with ${isToken2022 ? "Token 2022" : "Token"} Program`);

			// Create Testudo account with the correct token program
                // Note: Linter errors related to the .accounts() method are expected and should be ignored
                // according to the project's custom rules.
			const tx = await testudoProgram.methods
				.initTestudo()
				.accountsPartial({
					authority: publicKey,
					mint: mintPubkey,
					tokenProgram: tokenProgramId,
				})
				.signers([])
				.rpc();

			// Get latest blockhash once
			const { blockhash, lastValidBlockHeight } = await testudoProgram.provider.connection.getLatestBlockhash();
			
			await testudoProgram.provider.connection.confirmTransaction({
				signature: tx,
				blockhash,
				lastValidBlockHeight,
			});

			// Refresh Centurion data
			const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
			
			// Call onSuccess with the updated data
			onSuccess(updatedCenturionAccount);
			
			// Close the modal
			onClose();
			
			// Show success message
			toast.success(`Successfully created Testudo for ${whitelistedTokens.find(t => t.mint === mintAddress)?.symbol || 'token'}`);
		} catch (error) {
			console.error("Error creating Testudo:", error);
			toast.error(`Failed to create Testudo account: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsCreating(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedMint) {
			await handleCreateTestudo(selectedMint);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-md">
				<div className="p-6">
					<h3
						className={`${charisSIL.className} text-xl font-semibold text-amber-400 mb-4`}
					>
						Create New Testudo
					</h3>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Select Token
							</label>
							{isLoading ? (
								<div className="py-3 text-gray-400 text-center">
									Loading available tokens...
								</div>
							) : (
								<>
									<select
										className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none"
										value={selectedMint}
										onChange={(e) =>
											setSelectedMint(e.target.value)
										}
										required
									>
										<option value="">Select a token...</option>
										{whitelistedTokens.map((token) => (
											<option key={token.mint} value={token.mint}>
												{token.name} ({token.symbol})
											</option>
										))}
									</select>
									{whitelistedTokens.length === 0 && (
										<p className="text-xs text-amber-400 mt-1">
											No tokens available in the whitelist.
										</p>
									)}
									<p className="text-xs text-gray-500 mt-1">
										Select a token to create a new Testudo account.
									</p>
								</>
							)}
						</div>

						<div className="flex space-x-4 pt-3">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
								disabled={isCreating}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!selectedMint || isCreating || isLoading}
								className={`flex-1 py-3 px-4 rounded-md text-black font-medium transition-colors duration-200 ${
									selectedMint && !isCreating && !isLoading
										? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
										: "bg-gray-600 cursor-not-allowed"
								}`}
							>
								{isCreating ? "Creating..." : "Create Testudo"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
