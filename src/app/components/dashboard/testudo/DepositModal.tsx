"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { TestudoData, TokenData, CenturionData } from "@/app/types/testudo";
import { formatBalance, findCenturionPDA, findLegatePDA } from "@/app/utils/testudo-utils";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import * as anchor from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

// Define a default SOL token to ensure it's always available
const DEFAULT_SOL_TOKEN: TokenData = {
	name: "Solana",
	symbol: "SOL",
	mint: "So11111111111111111111111111111111111111112",
	decimals: 9,
};

// Hook for using the deposit modal
export function useDepositModal() {
	const [depositingTestudo, setDepositingTestudo] = useState<TestudoData | "SOL" | null>(null);
	const [showDepositModal, setShowDepositModal] = useState(false);
	const [isDepositing, setIsDepositing] = useState(false);
	const [tokenSymbol, setTokenSymbol] = useState("");
	const [tokenDecimals, setTokenDecimals] = useState(9);
	const testudoProgram = useTestudoProgram();

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
						setTokenSymbol(tokenInfo.tokenSymbol);
						setTokenDecimals(tokenInfo.tokenDecimals);
					}
				} catch (error) {
					console.error("Error fetching token info from Legate:", error);
				}
			} else {
				// For SOL, set default values
				setTokenSymbol("SOL");
				setTokenDecimals(9);
			}
			
			setShowDepositModal(true);
		}
	};

	const closeDepositModal = () => {
		setShowDepositModal(false);
		setDepositingTestudo(null);
	};

	return {
		depositingTestudo,
		showDepositModal,
		isDepositing,
		setIsDepositing,
		tokenSymbol,
		tokenDecimals,
		handleShowDepositModal,
		closeDepositModal
	};
}

interface DepositModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (updatedCenturionData: any) => void;
	isDepositing: boolean;
	setIsDepositing: (isDepositing: boolean) => void;
	testudo: TestudoData | "SOL";
	tokenDecimals: number;
	tokenSymbol: string;
	tokenBalance?: number; // User's wallet balance for the token
}

export function DepositModal({
	isOpen,
	onClose,
	onSuccess,
	isDepositing,
	setIsDepositing,
	testudo,
	tokenDecimals,
	tokenSymbol,
	tokenBalance = 0,
}: DepositModalProps) {
	const { connection } = useConnection();
	const wallet = useWallet();
	const { publicKey } = wallet;
	const provider = useAnchorProvider();
	const testudoProgram = useTestudoProgram();
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [walletBalance, setWalletBalance] = useState<number>(tokenBalance);
	const [tokenInfo, setTokenInfo] = useState<TokenData>({
		name: "Solana",
		symbol: testudo === "SOL" ? "SOL" : tokenSymbol,
		mint: "So11111111111111111111111111111111111111112",
		decimals: 9,
	});

	// Update tokenInfo when props change
	useEffect(() => {
		if (testudo !== "SOL") {
			setTokenInfo((prev: TokenData) => ({
				...prev,
				symbol: tokenSymbol,
				decimals: tokenDecimals
			}));
		}
	}, [testudo, tokenSymbol, tokenDecimals]);

	// Fetch the user's SOL or SPL token balance and token info
	useEffect(() => {
		if (!isOpen || !wallet.publicKey) return;

		const fetchBalanceAndInfo = async () => {
			try {
				if (testudo === "SOL") {
					// Fetch SOL balance
					const balance = await connection.getBalance(wallet.publicKey!);
					setWalletBalance(balance);
				} else {
					// For SPL tokens, we need to:
					// 1. Get the token's details (decimals) if needed
					if (testudo.tokenMint) {
						try {
							// Always get mint info for decimals to ensure accuracy
							const mintInfo = await connection.getParsedAccountInfo(testudo.tokenMint);
							if (mintInfo.value && 'parsed' in mintInfo.value.data) {
								const parsedData = mintInfo.value.data.parsed;
								if (parsedData.info && parsedData.info.decimals) {
									// Update decimals based on mint info
									const actualDecimals = parsedData.info.decimals;
									setTokenInfo((prev: TokenData) => ({
										...prev,
										decimals: actualDecimals
									}));
								}
							}
						} catch (error) {
							console.error("Error fetching token decimals:", error);
						}
					}
					
					// 2. Get user's token balance from their ATA
					try {
						const ata = await connection.getTokenAccountsByOwner(wallet.publicKey!, {
							mint: testudo.tokenMint
						});
						
						if (ata.value.length > 0) {
							const tokenBalance = await connection.getTokenAccountBalance(
								ata.value[0].pubkey
							);
							setWalletBalance(Number(tokenBalance.value.amount));
						} else {
							setWalletBalance(0);
						}
					} catch (error) {
						console.error("Error fetching token balance:", error);
						setWalletBalance(tokenBalance);
					}
				}
			} catch (error) {
				console.error("Error in fetchBalanceAndInfo:", error);
				setError("Failed to fetch wallet balance");
			}
		};

		fetchBalanceAndInfo();
	}, [isOpen, connection, wallet.publicKey, testudo, tokenBalance]);

	// Get token info from the Legate account
	const getTokenInfo = async (tokenMint: PublicKey) => {
		try {
			// First try to get from Legate account (whitelist)
			const [legatePDA] = findLegatePDA(testudoProgram.programId);
			const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);
			
			// Find the token in the whitelist
			const tokenInfo = legateAccount.testudoTokenWhitelist.find(
				(token: any) => token.tokenMint.toString() === tokenMint.toString()
			);
			
			if (tokenInfo) {
				return {
					symbol: tokenInfo.tokenSymbol,
					decimals: tokenInfo.tokenDecimals
				};
			}
			
			// If not found, return defaults
			return {
				symbol: "Token",
				decimals: 9
			};
		} catch (error) {
			console.error("Error getting token info:", error);
			return {
				symbol: "Token",
				decimals: 9
			};
		}
	};

	const handleDeposit = async (depositAmount: number) => {
		if (!depositAmount || !publicKey) {
			setError("Please enter a valid amount");
			return;
		}

		try {
			setIsDepositing(true);
			
			if (testudo === "SOL") {
				// Handle SOL deposit - convert amount to lamports
				const amountInLamports = Math.floor(depositAmount * Math.pow(10, 9));
				const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
				
				// Call depositSol instruction with required accounts
				// Note: Linter errors related to the .accounts() method are expected and should be ignored
				// according to the project's custom rules.
				const tx = await testudoProgram.methods
					.depositSol(new anchor.BN(amountInLamports.toString()))
					.accounts({
						authority: publicKey,
					})
					.rpc();
				
                const { blockhash, lastValidBlockHeight } = await testudoProgram.provider.connection.getLatestBlockhash();
				await testudoProgram.provider.connection.confirmTransaction({
					blockhash,
					lastValidBlockHeight,
					signature: tx,
				});
				
				// Refresh centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				
				// Call onSuccess with the updated data
				onSuccess(updatedCenturionAccount);
				
				toast.success(`Successfully deposited ${depositAmount} SOL`);
			} else {
				// Handle SPL token deposit - get token info first
				const tokenMint = new PublicKey(testudo.tokenMint);
				const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
				
				// Get token info for decimals and symbol
				const tokenInfo = await getTokenInfo(tokenMint);
				
				// Double-check against on-chain decimals to ensure accuracy
                const mintInfo = await connection.getParsedAccountInfo(tokenMint);
				try {
					if (mintInfo.value && 'parsed' in mintInfo.value.data) {
						const parsedData = mintInfo.value.data.parsed;
						if (parsedData.info && parsedData.info.decimals) {
							tokenInfo.decimals = parsedData.info.decimals;
						}
					}
				} catch (error) {
					console.error("Error verifying token decimals:", error);
				}
				
				// Convert amount to token units with decimals
				const amountWithDecimals = depositAmount * Math.pow(10, tokenInfo.decimals);
				const amountWithDecimalsStr = Math.floor(amountWithDecimals).toString();

                const tokenProgram = (await connection.getAccountInfo(tokenMint))?.owner;
				
				// Call depositSpl instruction with string representation
				const tx = await testudoProgram.methods
					.depositSpl(new anchor.BN(amountWithDecimalsStr))
					.accountsPartial({
						authority: publicKey,
						mint: tokenMint,
						tokenProgram: tokenProgram as PublicKey,

					})
					.rpc();
				
				await testudoProgram.provider.connection.confirmTransaction(tx);
				
				// Refresh Centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				
				// Call onSuccess with the updated data
				onSuccess(updatedCenturionAccount);
				
				toast.success(`Successfully deposited ${depositAmount} ${tokenInfo.symbol}`);
			}
			
			// Clear form and close modal
			setAmount("");
			onClose();
		} catch (error) {
			console.error("Deposit error:", error);
			toast.error(`Deposit failed: ${error instanceof Error ? error.message : String(error)}`);
			setError(`Failed to process deposit: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsDepositing(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		try {
			// Validate amount
			const depositAmount = parseFloat(amount);
			if (isNaN(depositAmount) || depositAmount <= 0) {
				setError("Please enter a valid amount");
				return;
			}

			// Get the actual token decimals to use
			const actualDecimals = testudo === "SOL" ? 9 : tokenInfo.decimals;

			// Convert the amount to lamports/raw token amount for comparison
			const rawAmount = depositAmount * Math.pow(10, actualDecimals);
			
			// Check if user has enough balance
			if (rawAmount > walletBalance) {
				setError(`Insufficient balance. You have ${formatBalance(walletBalance, actualDecimals)} ${tokenSymbol}`);
				return;
			}

			// Call the deposit function
			await handleDeposit(depositAmount);
		} catch (error) {
			console.error("Deposit error:", error);
			setError(`Failed to process deposit: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	// Reset form when closed
	useEffect(() => {
		if (!isOpen) {
			setAmount("");
			setError(null);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-md max-h-[95vh] overflow-y-auto">
				<div className="p-3 sm:p-4">
					<h3
						className={`${charisSIL.className} text-lg font-semibold text-amber-400 mb-2 sm:mb-3`}
					>
						Deposit {testudo === "SOL" ? "SOL" : tokenInfo.symbol}
					</h3>

					<form
						className="space-y-2 sm:space-y-3"
						onSubmit={handleSubmit}
					>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Amount
							</label>
							<div className="relative">
								<input
									type="number"
									step="any"
									placeholder={`Enter amount in ${tokenSymbol}`}
									className="w-full p-2 bg-gray-800/60 rounded border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none text-sm"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									required
								/>
								<div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
									{tokenSymbol}
								</div>
							</div>
							<p className="text-xs text-gray-500 mt-0.5">
								Available in wallet:{" "}
								{formatBalance(
									walletBalance,
									testudo === "SOL" ? 9 : tokenInfo.decimals
								)}{" "}
								{testudo === "SOL" ? "SOL" : tokenInfo.symbol}
							</p>
						</div>

						{error && (
							<div className="p-2 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 text-xs">
								{error}
							</div>
						)}

						<div className="flex space-x-2 sm:space-x-3 pt-2">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-2 px-2 sm:px-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200 text-sm"
								disabled={isDepositing}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!amount || isDepositing}
								className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-black font-medium transition-colors duration-200 text-sm ${
									amount && !isDepositing
										? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
										: "bg-gray-600 cursor-not-allowed"
								}`}
							>
								{isDepositing ? "Depositing..." : "Deposit"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
} 