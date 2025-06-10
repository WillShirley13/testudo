"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { formatBalance, shortenAddress, findCenturionPDA, findLegatePDA } from "@/app/utils/testudo-utils";
import { motion } from "framer-motion";
import { TestudoData, TokenData, CenturionData, LegateData, TokenWhitelistData } from "@/app/types/testudo";
import { PublicKey } from "@solana/web3.js";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import { CreateTestudoModal } from "./CreateTestudoModal";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";
import { DeleteTestudoModal } from "./DeleteTestudoModal";

// Define a default SOL token to ensure it's always available
const DEFAULT_SOL_TOKEN: TokenData = {
	name: "Solana",
	symbol: "SOL",
	mint: "So11111111111111111111111111111111111111112",
	decimals: 9,
};

// Define explorer URL base - different for mainnet, devnet, etc.
const EXPLORER_URL_BASE = "https://explorer.solana.com";
const NETWORK = "devnet"; // Change to 'mainnet' for production

interface TestudoAccountsTableProps {
	testudos: TestudoData[] | undefined;
	centurionData: CenturionData | null;
	programId: PublicKey;
	onCenturionUpdated: (updatedCenturionData: CenturionData) => void;
}

export function TestudoAccountsTable({
	testudos,
	centurionData,
	programId,
	onCenturionUpdated,
}: TestudoAccountsTableProps) {
	const testudoProgram = useTestudoProgram();
	const [legateData, setLegateData] = useState<LegateData | null>(null);
    const [testudoTokenBalances, setTestudoTokenBalances] = useState<{ [key: string]: number }>({});
	const [whitelistedTokens, setWhitelistedTokens] = useState<TokenData[]>([DEFAULT_SOL_TOKEN]);
	const [isLoading, setIsLoading] = useState(true);
	
	// States for modals
	const [showCreateTestudo, setShowCreateTestudo] = useState(false);
	const [creatingTestudo, setCreatingTestudo] = useState(false);
	
	// Deposit modal states
	const [depositingTestudo, setDepositingTestudo] = useState<TestudoData | "SOL" | null>(null);
	const [showDepositModal, setShowDepositModal] = useState(false);
	const [isDepositing, setIsDepositing] = useState(false);
	const [depositTokenSymbol, setDepositTokenSymbol] = useState("");
	const [depositTokenDecimals, setDepositTokenDecimals] = useState(9);
	
	// Withdraw modal states
	const [withdrawingTestudo, setWithdrawingTestudo] = useState<TestudoData | "SOL" | null>(null);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [withdrawTokenSymbol, setWithdrawTokenSymbol] = useState("");
	const [withdrawTokenDecimals, setWithdrawTokenDecimals] = useState(9);
	
	// Delete modal states
	const [deletingTestudo, setDeletingTestudo] = useState<TestudoData | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteTokenSymbol, setDeleteTokenSymbol] = useState("");
	
	// Calculate the Centurion PDA if centurionData exists
	const centurionPDA = React.useMemo(() => {
		if (centurionData?.authority) {
			const [pda] = findCenturionPDA(centurionData.authority, programId);
			return pda;
		}
		return null;
	}, [centurionData?.authority, programId]);

	// Helper function to get the Explorer URL for an address
	const getExplorerUrl = (address: string, type: 'address' | 'token' | 'tx' = 'address') => {
		return `${EXPLORER_URL_BASE}/${type}/${address}?cluster=${NETWORK}`;
	};

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
	
	// Fetch token balances for all testudo accounts
	useEffect(() => {
		const fetchTokenBalances = async () => {
			if (!testudos || testudos.length === 0) return;
			
			try {
				const balances: { [key: string]: number } = {};
				
				for (const testudo of testudos) {
					try {
						const response = await testudoProgram.provider.connection.getTokenAccountBalance(testudo.testudoPubkey);
						balances[testudo.testudoPubkey.toString()] = Number(response.value.amount);
					} catch (error) {
						console.error(`Error fetching balance for testudo ${testudo.testudoPubkey.toString()}:`, error);
						balances[testudo.testudoPubkey.toString()] = 0;
					}
				}
				
				setTestudoTokenBalances(balances);
			} catch (error) {
				console.error("Error fetching token balances:", error);
			}
		};
		
		fetchTokenBalances();
	}, [testudos, testudoProgram]);
	
	// Handler for opening the create testudo modal
	const handleCreateTestudo = () => {
		setShowCreateTestudo(true);
	};
	
	// Show the deposit modal when a user chooses to deposit
	const handleShowDepositModal = async (testudo: TestudoData | "SOL") => {
		if (testudo) {
			// Only show modal if testudo is provided
			setDepositingTestudo(testudo);
			
			// Fetch token symbol from Legate for non-SOL tokens
			if (testudo !== "SOL") {
				try {
					const [legatePDA] = findLegatePDA(testudoProgram.programId);
					const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);
					
					// Find the token in the whitelist
					const tokenInfo = legateAccount.testudoTokenWhitelist.find(
						(token: any) => token.tokenMint.toString() === testudo.tokenMint.toString()
					);
					
					if (tokenInfo) {
						// Pass the correct token symbol to the DepositModal
						setDepositTokenSymbol(tokenInfo.tokenSymbol);
						setDepositTokenDecimals(tokenInfo.tokenDecimals);
					}
				} catch (error) {
					console.error("Error fetching token info from Legate:", error);
				}
			} else {
				// For SOL, set default values
				setDepositTokenSymbol("SOL");
				setDepositTokenDecimals(9);
			}
			
			setShowDepositModal(true);
		}
	};
	
	// Show the withdraw modal when a user chooses to withdraw
	const handleShowWithdrawModal = async (testudo: TestudoData | "SOL") => {
		if (testudo) {
			// Only show modal if testudo is provided
			setWithdrawingTestudo(testudo);
			
			// Fetch token symbol from Legate for non-SOL tokens
			if (testudo !== "SOL") {
				try {
					const [legatePDA] = findLegatePDA(testudoProgram.programId);
					const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);
					
					// Find the token in the whitelist
					const tokenInfo = legateAccount.testudoTokenWhitelist.find(
						(token: any) => token.tokenMint.toString() === testudo.tokenMint.toString()
					);
					
					if (tokenInfo) {
						// Pass the correct token symbol to the WithdrawModal
						setWithdrawTokenSymbol(tokenInfo.tokenSymbol);
						setWithdrawTokenDecimals(tokenInfo.tokenDecimals);
					}
				} catch (error) {
					console.error("Error fetching token info from Legate:", error);
				}
			} else {
				// For SOL, set default values
				setWithdrawTokenSymbol("SOL");
				setWithdrawTokenDecimals(9);
			}
			
			setShowWithdrawModal(true);
		}
	};
	
	// Handle showing the delete modal
	const handleShowDeleteModal = (testudo: TestudoData) => {
		if (testudo) {
			// Find token info for the display name
			const tokenInfo = whitelistedTokens.find(
				(token) => token.mint === testudo.tokenMint.toString()
			);
			
			setDeletingTestudo(testudo);
			setDeleteTokenSymbol(tokenInfo?.symbol || "Token");
			setShowDeleteModal(true);
		}
	};
	
	const handleDelete = async (testudo: TestudoData) => {
		handleShowDeleteModal(testudo);
	};
	
	const solToken = DEFAULT_SOL_TOKEN;

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="bg-gradient-to-b from-gray-900/80 to-gray-950/90 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-amber-500/20 mb-8 max-w-3xl mx-auto"
			>
				<div className="flex justify-between items-center p-8 border-b border-gray-800/50">
					<h2
						className={`${charisSIL.className} text-3xl text-amber-400`}
					>
						Testudos
					</h2>

					<button
						onClick={handleCreateTestudo}
						className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 text-sm flex items-center shadow-lg"
					>
						<span className="mr-1 text-lg">+</span> New Testudo
					</button>
				</div>

				<div className="overflow-x-auto p-4">
					{isLoading ? (
						<div className="p-8 text-center">
							<p className="text-gray-400">Loading token data...</p>
						</div>
					) : (
						<div className="space-y-4">
							{/* Native SOL Account (always show if centurion exists) */}
							{centurionData && solToken && centurionPDA && (
								<div className="rounded-lg overflow-hidden border border-gray-700/50 hover:border-amber-500/30 transition-colors">
									<div className="bg-gray-800/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
										<div className="flex items-center">
											<div className="flex flex-col">
												<div className="flex items-center">
													<div className="text-lg font-medium text-white mr-2">
														{solToken.name}
													</div>
													<span className="px-2 py-0.5 text-xs rounded-full bg-amber-900/30 text-amber-400">
														{solToken.symbol}
													</span>
												</div>
												<div className="text-sm text-gray-300 font-mono mt-1 flex items-center">
													{shortenAddress(centurionPDA.toString(), 6)}
													<a 
														href={getExplorerUrl(centurionPDA.toString())} 
														target="_blank"
														rel="noopener noreferrer"
														className="ml-2 text-amber-400 hover:text-amber-300 transition-colors"
														onClick={(e) => e.stopPropagation()}
													>
														<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
														</svg>
													</a>
												</div>
											</div>
										</div>
										
										<div className="flex flex-col items-end">
											<div className="text-lg font-medium text-white text-right">
												{formatBalance(centurionData.lamportBalance, 9)} SOL
											</div>
											<div className="flex justify-end space-x-2 mt-2">
												<button
													onClick={() => handleShowDepositModal("SOL")}
													className="px-4 py-1.5 text-xs rounded-md bg-green-600/30 text-green-400 hover:bg-green-600/40 transition-colors duration-200"
												>
													Deposit
												</button>
												<button
													onClick={() => handleShowWithdrawModal("SOL")}
													className="px-4 py-1.5 text-xs rounded-md bg-blue-600/30 text-blue-400 hover:bg-blue-600/40 transition-colors duration-200"
												>
													Withdraw
												</button>
											</div>
										</div>
									</div>
								</div>
							)}
							
							{/* Regular SPL Token Testudos */}
							{testudos?.map((testudo, index) => {
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
									<div 
										key={index}
										className="rounded-lg overflow-hidden border border-gray-700/50 hover:border-amber-500/30 transition-colors"
									>
										<div 
											className="bg-gray-800/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0"
										>
											<div className="flex items-center">
												<div className="flex flex-col">
													<div className="flex items-center">
														<div className="text-lg font-medium text-white mr-2">
															{tokenDetails.name}
														</div>
														<span className="px-2 py-0.5 text-xs rounded-full bg-amber-900/30 text-amber-400">
															{tokenDetails.symbol}
														</span>
													</div>
													<div className="text-sm text-gray-300 font-mono mt-1 flex items-center">
														{shortenAddress(testudo.testudoPubkey.toString(), 6)}
														<a 
															href={getExplorerUrl(testudo.testudoPubkey.toString())} 
															target="_blank"
															rel="noopener noreferrer"
															className="ml-2 text-amber-400 hover:text-amber-300 transition-colors"
														>
															<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
															</svg>
														</a>
													</div>
												</div>
											</div>
											
											<div className="flex flex-col items-end">
												<div className="text-lg font-medium text-white text-right">
													{formatBalance(testudoTokenBalances[testudo.testudoPubkey.toString()], tokenDetails.decimals)} {tokenDetails.symbol}
												</div>
												<div className="flex justify-end space-x-2 mt-2">
													<button
														onClick={() => handleShowDepositModal(testudo)}
														className="px-4 py-1.5 text-xs rounded-md bg-green-600/30 text-green-400 hover:bg-green-600/40 transition-colors duration-200"
													>
														Deposit
													</button>
													<button
														onClick={() => handleShowWithdrawModal(testudo)}
														className="px-4 py-1.5 text-xs rounded-md bg-blue-600/30 text-blue-400 hover:bg-blue-600/40 transition-colors duration-200"
													>
														Withdraw
													</button>
													<button
														onClick={() => handleDelete(testudo)}
														className="px-4 py-1.5 text-xs rounded-md bg-red-600/30 text-red-400 hover:bg-red-600/40 transition-colors duration-200"
													>
														Delete
													</button>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</motion.div>
		
			{/* Create Testudo Modal */}
			<CreateTestudoModal
				isOpen={showCreateTestudo}
				onClose={() => setShowCreateTestudo(false)}
				onSuccess={(updatedCenturionData) => {
					onCenturionUpdated(updatedCenturionData as unknown as CenturionData);
					setShowCreateTestudo(false);
				}}
				isCreating={creatingTestudo}
				setIsCreating={setCreatingTestudo}
			/>
			
			{/* Deposit Modal */}
			{depositingTestudo && (
				<DepositModal
					isOpen={showDepositModal}
					onClose={() => {
						setShowDepositModal(false);
						setDepositingTestudo(null);
					}}
					onSuccess={(updatedCenturionData) => {
						onCenturionUpdated(updatedCenturionData as unknown as CenturionData);
					}}
					isDepositing={isDepositing}
					setIsDepositing={setIsDepositing}
					testudo={depositingTestudo}
					tokenDecimals={depositTokenDecimals}
					tokenSymbol={depositTokenSymbol}
				/>
			)}
			
			{/* Withdraw Modal */}
			{withdrawingTestudo && (
				<WithdrawModal
					isOpen={showWithdrawModal}
					onClose={() => {
						setShowWithdrawModal(false);
						setWithdrawingTestudo(null);
					}}
					onSuccess={(updatedCenturionData) => {
						onCenturionUpdated(updatedCenturionData as unknown as CenturionData);
					}}
					isWithdrawing={isWithdrawing}
					setIsWithdrawing={setIsWithdrawing}
					testudo={withdrawingTestudo}
					tokenDecimals={withdrawTokenDecimals}
					tokenSymbol={withdrawTokenSymbol}
				/>
			)}
			
			{/* Delete Modal */}
			{deletingTestudo && (
				<DeleteTestudoModal
					isOpen={showDeleteModal}
					onClose={() => {
						setShowDeleteModal(false);
						setDeletingTestudo(null);
					}}
					onSuccess={(updatedCenturionData) => {
						onCenturionUpdated(updatedCenturionData as unknown as CenturionData);
					}}
					isDeleting={isDeleting}
					setIsDeleting={setIsDeleting}
					testudo={deletingTestudo}
					tokenSymbol={deleteTokenSymbol}
				/>
			)}
		</>
	);
}
