"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Baskervville } from "next/font/google";
import { formatBalance, shortenAddress, findCenturionPDA, findLegatePDA } from "@/app/utils/testudo-utils";
import { motion } from "framer-motion";
import { TestudoData, TokenData, CenturionData, LegateData, TokenWhitelistData } from "@/app/types/testudo";
import { PublicKey } from "@solana/web3.js";
import { useTestudoProgram } from "@/app/components/solana/solana-provider";

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

interface TestudoAccountsTableProps {
	testudos: TestudoData[] | undefined;
	centurionData: CenturionData | null;
	programId: PublicKey;
	onCreateTestudo: () => void;
	onDeposit: (testudo: TestudoData | "SOL") => void;
	onWithdraw: (testudo: TestudoData | "SOL") => void;
	onDelete: (testudo: TestudoData) => void;
}

export function TestudoAccountsTable({
	testudos,
	centurionData,
	programId,
	onCreateTestudo,
	onDeposit,
	onWithdraw,
	onDelete,
}: TestudoAccountsTableProps) {
	const testudoProgram = useTestudoProgram();
	const [legateData, setLegateData] = useState<LegateData | null>(null);
	const [whitelistedTokens, setWhitelistedTokens] = useState<TokenData[]>([DEFAULT_SOL_TOKEN]);
	const [isLoading, setIsLoading] = useState(true);
	
	const isEmpty = !testudos || testudos.length === 0;
	
	// Calculate the Centurion PDA if centurionData exists
	const centurionPDA = React.useMemo(() => {
		if (centurionData?.authority) {
			const [pda] = findCenturionPDA(centurionData.authority, programId);
			return pda;
		}
		return null;
	}, [centurionData?.authority, programId]);

	// Fetch Legate account data when component mounts
	useEffect(() => {
		const fetchLegateData = async () => {
			try {
				setIsLoading(true);
				const [legatePDA] = findLegatePDA(programId);
				const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);
				
				// Convert to our frontend data type
				const legateData = legateAccount as unknown as LegateData;
				setLegateData(legateData);
				
				// Convert tokenWhitelistData to TokenData format
				const tokens: TokenData[] = legateData.testudoTokenWhitelist.map((token: TokenWhitelistData) => ({
					name: token.tokenName,
					symbol: token.tokenSymbol,
					mint: token.tokenMint.toString(),
					decimals: token.tokenDecimals,
				}));
				
				// Always include the SOL token (not stored in whitelist)
				setWhitelistedTokens([DEFAULT_SOL_TOKEN, ...tokens]);
			} catch (error) {
				console.error("Error fetching Legate account data:", error);
				// Ensure we at least have the SOL token available
				setWhitelistedTokens([DEFAULT_SOL_TOKEN]);
			} finally {
				setIsLoading(false);
			}
		};
		
		fetchLegateData();
	}, [programId, testudoProgram]);
	
	const solToken = DEFAULT_SOL_TOKEN;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="bg-gray-900/60 backdrop-blur-md rounded-lg overflow-hidden shadow-lg border border-amber-500/20"
		>
			<div className="flex justify-between items-center p-6 border-b border-gray-800">
				<h2
					className={`${baskervville.className} text-2xl font-semibold text-amber-400`}
				>
					Testudos
				</h2>

				<button
					onClick={onCreateTestudo}
					className="py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-md hover:from-amber-600 hover:to-amber-700 transition-all duration-300 text-sm flex items-center"
				>
					<span className="mr-1">+</span> New Testudo
				</button>
			</div>

			{isEmpty && !centurionData ? (
				<div className="p-8 text-center">
					<div className="mb-4 opacity-70">
						<Image
							src="/logo2.png"
							alt="Testudo Logo"
							width={80}
							height={80}
							className="mx-auto"
						/>
					</div>
					<h3 className="text-xl font-medium text-amber-400 mb-2">
						No Testudo Accounts Yet
					</h3>
					<p className="text-gray-400 mb-6">
						Create your first Testudo token account to start
						managing assets securely.
					</p>
					<button
						onClick={onCreateTestudo}
						className="py-2 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-md hover:from-amber-600 hover:to-amber-700 transition-all duration-300"
					>
						Create First Testudo
					</button>
				</div>
			) : (
				<div className="overflow-x-auto">
					{isLoading ? (
						<div className="p-8 text-center">
							<p className="text-gray-400">Loading token data...</p>
						</div>
					) : (
						<table className="min-w-full divide-y divide-gray-800">
							<thead className="bg-gray-800/50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
										Token
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
										Testudo Address
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
										Balance
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-gray-900/20 divide-y divide-gray-800">
								{/* Native SOL Account (always show if centurion exists) */}
								{/* Native SOL is special - it doesn't use a separate testudo account
									but is stored directly in the centurion account's lamportBalance.
									The testudo address for SOL is the Centurion PDA itself. */}
								{centurionData && solToken && centurionPDA && (
									<tr className="hover:bg-gray-800/30 transition-colors duration-150">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="text-sm font-medium text-white">
													{solToken.name}
												</div>
												<span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-900/30 text-amber-400">
													{solToken.symbol}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-300 font-mono">
												{/* Display the centurion PDA address */}
												{shortenAddress(
													centurionPDA.toString(),
													6
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-white">
												{formatBalance(
													centurionData.lamportBalance,
													solToken.decimals
												)}{" "}
												{solToken.symbol}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right">
											<div className="flex justify-end space-x-2">
												<button
													onClick={() => onDeposit("SOL")}
													className="px-3 py-1.5 text-xs rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors duration-200"
												>
													Deposit
												</button>
												<button
													onClick={() => onWithdraw("SOL")}
													className="px-3 py-1.5 text-xs rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors duration-200"
												>
													Withdraw
												</button>
											</div>
										</td>
									</tr>
								)}
								
								{/* Regular SPL Token Testudos */}
								{testudos?.map((testudo, index) => {
									// Find token details from our whitelist
									const tokenDetails = whitelistedTokens.find(
										(token) =>
											token.mint ===
											testudo.tokenMint.toString()
									) || {
										name: "Unknown",
										symbol: "???",
										decimals: 9,
									};

									return (
										<tr
											key={index}
											className="hover:bg-gray-800/30 transition-colors duration-150"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="text-sm font-medium text-white">
														{tokenDetails.name}
													</div>
													<span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-900/30 text-amber-400">
														{tokenDetails.symbol}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-300 font-mono">
													{shortenAddress(
														testudo.testudoPubkey.toString(),
														6
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-white">
													{formatBalance(
														testudo.testudoTokenCount,
														tokenDetails.decimals
													)}{" "}
													{tokenDetails.symbol}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right">
												<div className="flex justify-end space-x-2">
													<button
														onClick={() =>
															onDeposit(testudo)
														}
														className="px-3 py-1.5 text-xs rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors duration-200"
													>
														Deposit
													</button>
													<button
														onClick={() =>
															onWithdraw(testudo)
														}
														className="px-3 py-1.5 text-xs rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors duration-200"
													>
														Withdraw
													</button>
													<button
														onClick={() =>
															onDelete(testudo)
														}
														className="px-3 py-1.5 text-xs rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors duration-200"
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			)}
		</motion.div>
	);
}
