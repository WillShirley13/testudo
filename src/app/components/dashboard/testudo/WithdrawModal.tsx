"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { TestudoData } from "@/app/types/testudo";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { formatBalance, findCenturionPDA, findLegatePDA } from "@/app/utils/testudo-utils";
import {
	PasswordPhraseInput,
	validatePasswordWords,
	preparePasswordWords,
} from "@/app/components/common/PasswordPhraseInput";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

// Hook for using the withdraw modal
export function useWithdrawModal() {
	const [withdrawingTestudo, setWithdrawingTestudo] = useState<TestudoData | "SOL" | null>(null);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [tokenSymbol, setTokenSymbol] = useState("");
	const [tokenDecimals, setTokenDecimals] = useState(9);
	const testudoProgram = useTestudoProgram();

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
			
			setShowWithdrawModal(true);
		}
	};

	const closeWithdrawModal = () => {
		setShowWithdrawModal(false);
		setWithdrawingTestudo(null);
	};

	return {
		withdrawingTestudo,
		showWithdrawModal,
		isWithdrawing,
		setIsWithdrawing,
		tokenSymbol,
		tokenDecimals,
		handleShowWithdrawModal,
		closeWithdrawModal
	};
}

interface WithdrawModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (updatedCenturionData: any) => void;
	isWithdrawing: boolean;
	setIsWithdrawing: (isWithdrawing: boolean) => void;
	testudo: TestudoData | "SOL";
	tokenDecimals: number;
	tokenSymbol: string;
}

export function WithdrawModal({
	isOpen,
	onClose,
	onSuccess,
	isWithdrawing,
	setIsWithdrawing,
	testudo,
	tokenDecimals,
	tokenSymbol,
}: WithdrawModalProps) {
	const wallet = useWallet();
	const { publicKey } = wallet;
	const provider = useAnchorProvider();
	const testudoProgram = useTestudoProgram();
	const [passwordWords, setPasswordWords] = useState<string[]>(
		Array(12).fill("")
	);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [solBalance, setSolBalance] = useState<number>(0);
	const [feePercentage, setFeePercentage] = useState<number>(0);
	const [feeAmount, setFeeAmount] = useState<string>("0");

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

	// Function to fetch the fee percentage from Legate account
	const fetchFeePercentage = async () => {
		try {
			const [legatePDA] = findLegatePDA(testudoProgram.programId);
			const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);
			
			// percentForFees is stored as a u16, so divide by 100 to get percentage
			// e.g., 250 => 2.5%
			const percentage = (legateAccount.percentForFees / 100);
			setFeePercentage(percentage);
		} catch (error) {
			console.error("Error fetching fee percentage:", error);
			setFeePercentage(0);
		}
	};
	
	// Calculate fee amount when amount or fee percentage changes
	useEffect(() => {
		const calculateFee = () => {
			if (!amount || isNaN(parseFloat(amount)) || feePercentage <= 0) {
				setFeeAmount("0");
				return;
			}
			
			const withdrawAmount = parseFloat(amount);
			const calculatedFeeAmount = (withdrawAmount * feePercentage / 100).toFixed(tokenDecimals > 6 ? 6 : tokenDecimals);
			setFeeAmount(calculatedFeeAmount);
		};
		
		calculateFee();
	}, [amount, feePercentage, tokenDecimals]);

	// Fetch fee percentage when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchFeePercentage();
		}
	}, [isOpen, testudoProgram]);

	// Function to handle actual withdrawal
	const handleWithdraw = async (withdrawAmount: number, passwordKeypair: Keypair) => {
		if (!publicKey) return;

        const [legatePDA] = findLegatePDA(testudoProgram.programId);
        const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);

		try {
			setIsWithdrawing(true);
            
			if (testudo === "SOL") {
				// Handle SOL withdrawal
				const amountInLamports = Math.floor(withdrawAmount * Math.pow(10, 9));
				const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
                
				
				// Call withdrawSol instruction with required accounts
				// Note: Linter errors related to the .accounts() method are expected and should be ignored
				// according to the project's custom rules.
				const tx = await testudoProgram.methods
					.withdrawSol(new anchor.BN(amountInLamports.toString()))
					.accounts({
						// authority: publicKey,
						validSignerOfPassword: passwordKeypair.publicKey,
						treasury: legateAccount.treasuryAcc,
					})
					.signers([passwordKeypair])
					.rpc();

                const { blockhash, lastValidBlockHeight } = await testudoProgram.provider.connection.getLatestBlockhash();
				await testudoProgram.provider.connection.confirmTransaction({
					blockhash,
					lastValidBlockHeight,
					signature: tx,
				});
				
				// Refresh Centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				
				// Update the SOL balance state
				setSolBalance(Number(updatedCenturionAccount.lamportBalance));
				
				// Call onSuccess with the updated data
				onSuccess(updatedCenturionAccount);
				
				// Display success message with fee information
				const feeAmountSOL = (withdrawAmount * feePercentage / 100);
				const receivedAmount = withdrawAmount - feeAmountSOL;
				toast.success(
					`Successfully withdrew ${withdrawAmount} SOL (Fee: ${feeAmountSOL.toFixed(6)} SOL, Received: ${receivedAmount.toFixed(6)} SOL)`
				);
			} else {
				// Handle SPL token withdrawal
				const tokenMint = new PublicKey(testudo.tokenMint);
				const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
				
				// Get token info for decimals and symbol
				const tokenInfo = await getTokenInfo(tokenMint);

                const mintInfo = (await testudoProgram.provider.connection.getAccountInfo(tokenMint))?.owner;
				
				// Convert amount to token units with decimals
				const amountWithDecimals = Math.floor(withdrawAmount * Math.pow(10, tokenInfo.decimals));
				
				// Call withdrawSpl instruction with required accounts
				const tx = await testudoProgram.methods
					.withdrawSpl(new anchor.BN(amountWithDecimals.toString()))
					.accounts({
						// authority: publicKey,
						validSignerOfPassword: passwordKeypair.publicKey,
						mint: tokenMint,
						treasury: legateAccount.treasuryAcc,
						tokenProgram: mintInfo as PublicKey,
					})
					.signers([passwordKeypair])
					.rpc();
				
                const latestBlockhashInfo = await testudoProgram.provider.connection.getLatestBlockhash();
				await testudoProgram.provider.connection.confirmTransaction(
                    {
                        blockhash: latestBlockhashInfo.blockhash,
                        lastValidBlockHeight: latestBlockhashInfo.lastValidBlockHeight,
                        signature: tx,
                    }
                );
				
				// Refresh Centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				
				// Call onSuccess with the updated data
				onSuccess(updatedCenturionAccount);
				
				// Display success message with fee information
				const feeAmountToken = (withdrawAmount * feePercentage / 100);
				const receivedAmount = withdrawAmount - feeAmountToken;
				toast.success(
					`Successfully withdrew ${withdrawAmount} ${tokenInfo.symbol} (Fee: ${feeAmountToken.toFixed(tokenInfo.decimals > 6 ? 6 : tokenInfo.decimals)} ${tokenInfo.symbol}, Received: ${receivedAmount.toFixed(tokenInfo.decimals > 6 ? 6 : tokenInfo.decimals)} ${tokenInfo.symbol})`
				);
			}
			
			// Clear form and close modal
			setPasswordWords(Array(12).fill(""));
			setAmount("");
			onClose();
		} catch (error) {
			console.error("Withdrawal error:", error);
			
			// Check for InvalidPasswordSignature error from the on-chain program
			const errorMessage = String(error);
			if (errorMessage.includes("InvalidPasswordSignature")) {
				setError("Invalid password phrase. Please check your words and try again.");
				toast.error("Invalid password phrase. Please check your words and try again.");
			} else {
				toast.error(`Withdrawal failed: ${error instanceof Error ? error.message : String(error)}`);
				setError(`Failed to process withdrawal: ${error instanceof Error ? error.message : String(error)}`);
			}
		} finally {
			setIsWithdrawing(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		try {
			// Validate amount
			const withdrawAmount = parseFloat(amount);
			if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
				setError("Please enter a valid amount");
				return;
			}

			// Check against available balance
			let maxAmount = 0;
			if (testudo === "SOL") {
				// For SOL testudo is actually the Centurion account
				const [centurionPDA] = findCenturionPDA(publicKey!, testudoProgram.programId);
				const centurionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				maxAmount = Number(centurionAccount.lamportBalance) / Math.pow(10, tokenDecimals);
			} else {
				// For SPL token testudo is the Testudo account
				maxAmount = Number(testudo.testudoTokenCount) / Math.pow(10, tokenDecimals);
			}
			
			if (withdrawAmount > maxAmount) {
				setError(`Amount exceeds balance of ${maxAmount.toFixed(tokenDecimals)} ${tokenSymbol}`);
				return;
			}


			// Get prepared words (filtered non-empty)
			const words = preparePasswordWords(passwordWords);

			// Validate only that we have enough words
			if (!validatePasswordWords(passwordWords)) {
				setError("Please enter at least 5 words for your password phrase");
				return;
			}

			// Validate and derive keypair from mnemonic
			const secureKeypairGenerator = new SecureKeypairGenerator();

			try {
				const { keypair } = await secureKeypairGenerator.deriveKeypairFromWords(words);
				await handleWithdraw(withdrawAmount, keypair);
			} catch (error) {
				// Check for InvalidPasswordSignature error from the on-chain program
				const errorMessage = String(error);
				if (errorMessage.includes("InvalidPasswordSignature")) {
					setError("Invalid password phrase. Please check your words and try again.");
				} else if (error instanceof Error) {
					setError(error.message);
				} else {
					setError("Failed to process withdrawal. Please try again.");
				}
			}
		} catch (error) {
			console.error("Withdrawal error:", error);
			setError("Failed to process withdrawal. Please try again.");
		}
	};

	// Reset form when closed
	useEffect(() => {
		if (!isOpen) {
			setPasswordWords(Array(12).fill(""));
			setAmount("");
			setError(null);
			setSolBalance(0);
		}
	}, [isOpen]);

	// Fetch SOL balance when modal opens and token is SOL
	useEffect(() => {
		const fetchSolBalance = async () => {
			if (testudo === "SOL" && publicKey && isOpen) {
				try {
					const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
					const centurionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
					setSolBalance(Number(centurionAccount.lamportBalance));
				} catch (error) {
					console.error("Error fetching SOL balance:", error);
					setSolBalance(0);
				}
			}
		};

		fetchSolBalance();
	}, [testudo, publicKey, isOpen, testudoProgram]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-md max-h-[95vh] overflow-y-auto">
				<div className="p-3 sm:p-4">
					<h3
						className={`${charisSIL.className} text-lg font-semibold text-amber-400 mb-2 sm:mb-3`}
					>
						Withdraw {tokenSymbol}
					</h3>

					<form
						className="space-y-2 sm:space-y-3"
						onSubmit={handleSubmit}
						autoComplete="off"
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
								Available:{" "}
								{formatBalance(
									testudo === "SOL" ? solBalance : Number(testudo.testudoTokenCount),
									tokenDecimals
								)}{" "}
								{tokenSymbol}
							</p>
							
							{/* Fee information */}
							{feePercentage > 0 && amount && !isNaN(parseFloat(amount)) && (
								<div className="mt-2 p-2 bg-gray-800/80 rounded-md border border-gray-700">
									<p className="text-xs text-amber-300">
										Withdrawal Fee: {feeAmount} {tokenSymbol} ({feePercentage}%)
									</p>
									<p className="text-xs text-gray-400 mt-0.5">
										You will receive: {(parseFloat(amount) - parseFloat(feeAmount)).toFixed(tokenDecimals > 6 ? 6 : tokenDecimals)} {tokenSymbol}
									</p>
								</div>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Your Password Phrase
							</label>
							<PasswordPhraseInput
								words={passwordWords}
								onChange={setPasswordWords}
								maxWords={12}
								className="mb-1"
							/>
							<p className="text-xs text-gray-500 mt-0.5">
								Enter the password phrase for your Centurion
								account
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
								disabled={isWithdrawing}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={
									!amount ||
									!validatePasswordWords(passwordWords) ||
									isWithdrawing
								}
								className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-black font-medium transition-colors duration-200 text-sm ${
									amount &&
									validatePasswordWords(passwordWords) &&
									!isWithdrawing
										? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
										: "bg-gray-600 cursor-not-allowed"
								}`}
							>
								{isWithdrawing ? "Withdrawing..." : "Withdraw"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
