"use client";

import React, { useState, useEffect } from "react";
import { Baskervville } from "next/font/google";
import { findLegatePDA } from "@/app/utils/testudo-utils";
import { useTestudoProgram } from "@/app/components/solana/solana-provider";
import { TokenWhitelistData, TokenData } from "@/app/types/testudo";
import { PublicKey } from "@solana/web3.js";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

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
	onCreateTestudo: (mintAddress: string) => Promise<void>;
	isCreating: boolean;
}

export function CreateTestudoModal({
	isOpen,
	onClose,
	onCreateTestudo,
	isCreating,
}: CreateTestudoModalProps) {
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedMint) {
			await onCreateTestudo(selectedMint);
			// Modal will be automatically closed when creation is successful
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-md">
				<div className="p-6">
					<h3
						className={`${baskervville.className} text-xl font-semibold text-amber-400 mb-4`}
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
