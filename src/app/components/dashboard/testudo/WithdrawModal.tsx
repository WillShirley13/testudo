"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { TestudoData, CenturionData } from "@/app/types/testudo";
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
		Array(6).fill("")
	);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [solBalance, setSolBalance] = useState<number>(0);

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

	// Function to handle actual withdrawal
	const handleWithdraw = async (withdrawAmount: number, passwordKeypair: Keypair) => {
		if (!publicKey) return;

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
					.withdrawSol(new anchor.BN(amountInLamports))
					.accounts({
						authority: publicKey,
						validSignerOfPassword: passwordKeypair.publicKey,
						centurion: centurionPDA,
						systemProgram: anchor.web3.SystemProgram.programId,
					})
					.signers([passwordKeypair])
					.rpc();
				
				await testudoProgram.provider.connection.confirmTransaction(tx);
				
				// Refresh Centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				
				// Update the SOL balance state
				setSolBalance(Number(updatedCenturionAccount.lamportBalance));
				
				// Call onSuccess with the updated data
				onSuccess(updatedCenturionAccount);
				
				toast.success(`Successfully withdrew ${withdrawAmount} SOL`);
			} else {
				// Handle SPL token withdrawal
				const tokenMint = new PublicKey(testudo.tokenMint);
				const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
				
				// Get token info for decimals and symbol
				const tokenInfo = await getTokenInfo(tokenMint);
				
				// Convert amount to token units with decimals
				const amountWithDecimals = Math.floor(withdrawAmount * Math.pow(10, tokenInfo.decimals));
				
				// Find authority's ATA
				const ata = await anchor.utils.token.associatedAddress({
					mint: tokenMint,
					owner: publicKey,
				});
				
				// Call withdrawSpl instruction with required accounts
				// Note: Linter errors related to the .accounts() method are expected and should be ignored
				// according to the project's custom rules.
				const tx = await testudoProgram.methods
					.withdrawSpl(new anchor.BN(amountWithDecimals))
					.accounts({
						authority: publicKey,
						authorityAta: ata,
						validSignerOfPassword: passwordKeypair.publicKey,
						centurion: centurionPDA,
						testudo: testudo.testudoPubkey,
						mint: tokenMint,
						tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
						systemProgram: anchor.web3.SystemProgram.programId,
					})
					.signers([passwordKeypair])
					.rpc();
				
				await testudoProgram.provider.connection.confirmTransaction(tx);
				
				// Refresh Centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				
				// Call onSuccess with the updated data
				onSuccess(updatedCenturionAccount);
				
				toast.success(`Successfully withdrew ${withdrawAmount} ${tokenInfo.symbol}`);
			}
			
			// Clear form and close modal
			setPasswordWords(Array(6).fill(""));
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

			// Validate words
			if (!validatePasswordWords(passwordWords)) {
				setError("Please enter at least 4 words for your password phrase");
				return;
			}

			// Validate and derive keypair from mnemonic
			const secureKeypairGenerator = new SecureKeypairGenerator();

			try {
				const { keypair } = secureKeypairGenerator.deriveKeypairFromWords(words);
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
			setPasswordWords(Array(6).fill(""));
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
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Your Password Phrase
							</label>
							<PasswordPhraseInput
								words={passwordWords}
								onChange={setPasswordWords}
								maxWords={6}
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
