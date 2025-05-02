"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { PublicKey } from "@solana/web3.js";
import { PasswordPhraseInput, validatePasswordWords, preparePasswordWords } from "@/app/components/common/PasswordPhraseInput";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { findCenturionPDA, findLegatePDA, formatBalance } from "@/app/utils/testudo-utils";
import { CenturionData, TestudoData, TokenWhitelistData } from "@/app/types/testudo";
import { toast } from "react-hot-toast";
import * as anchor from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID  } from "@solana/spl-token";

interface WithdrawToBackupModalProps {
	isOpen: boolean;
	onClose: () => void;
	userWallet: PublicKey;
	centurionData: CenturionData;
	onSuccess: () => void;  // Callback to refresh Centurion data
	isWithdrawing: boolean;
	setIsWithdrawing: (value: boolean) => void;
}

export function WithdrawToBackupModal({
	isOpen,
	onClose,
	userWallet,
	centurionData,
	onSuccess,
	isWithdrawing,
	setIsWithdrawing,
}: WithdrawToBackupModalProps) {
	const [passwordWords, setPasswordWords] = useState<string[]>(Array(6).fill(""));
	const [error, setError] = useState("");
	const [withdrawalProgress, setWithdrawalProgress] = useState<string>("");
	const [tokenInfo, setTokenInfo] = useState<Map<string, TokenWhitelistData>>(new Map());
	
	// Get the testudo program instance
	const testudoProgram = useTestudoProgram();
	const provider = testudoProgram.provider;
	const secureKeypairGenerator = new SecureKeypairGenerator();

	// Fetch token information from Legate
	useEffect(() => {
		if (isOpen && centurionData?.testudos?.length > 0) {
			const fetchTokenInfo = async () => {
				try {
					const [legatePDA] = findLegatePDA(testudoProgram.programId);
					const legateAccount = await testudoProgram.account.legate.fetch(legatePDA);
					
					const tokenInfoMap = new Map<string, TokenWhitelistData>();
					
					legateAccount.testudoTokenWhitelist.forEach((token: any) => {
						tokenInfoMap.set(token.tokenMint.toString(), {
							tokenMint: token.tokenMint,
							tokenName: token.tokenName,
							tokenSymbol: token.tokenSymbol,
							tokenDecimals: token.tokenDecimals
						});
					});
					
					setTokenInfo(tokenInfoMap);
				} catch (error) {
					console.error("Error fetching token info:", error);
					setError("Failed to fetch token information. Please try again.");
				}
			};
			
			fetchTokenInfo();
		}
	}, [isOpen, centurionData, testudoProgram.programId, testudoProgram.account.legate]);

	const handleWithdrawToBackup = async (passwordKeypair: anchor.web3.Keypair) => {
		if (!centurionData || !centurionData.backupOwner) {
			setError("No backup account assigned. Please assign a backup account first.");
			return;
		}

		// Find the Centurion PDA
		const [centurionPDA] = findCenturionPDA(userWallet, testudoProgram.programId);
		
		// Initialize progress tracking
		const totalTokens = centurionData.testudos.length;
		let successCount = 0;
		let errorTokens: string[] = [];
		
		setWithdrawalProgress("Starting emergency withdrawal process...");
		
		// Process each token withdrawal
		for (let i = 0; i < centurionData.testudos.length; i++) {
			const testudo = centurionData.testudos[i];
			const tokenMint = testudo.tokenMint;
            const tokenCount = await provider.connection.getTokenAccountBalance(testudo.testudoPubkey);
			
			// Skip tokens with zero balance
			if (tokenCount.value.amount === "0") {
				setWithdrawalProgress(`Skipping ${tokenInfo.get(tokenMint.toString())?.tokenSymbol || 'Token'} (${i+1}/${totalTokens}) - zero balance`);
				successCount++;
				continue;
			}
			
			try {
				setWithdrawalProgress(`Processing ${tokenInfo.get(tokenMint.toString())?.tokenSymbol || 'Token'} (${i+1}/${totalTokens})...`);
				
				// Get the token mint account info to check which token program it belongs to
				const mintInfo = await provider.connection.getAccountInfo(tokenMint);
				
				// Determine the token program based on the mint owner
				const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
				const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
				
				let tokenProgramId = TOKEN_PROGRAM_ID;
				
				// Check if the mint is owned by the Token2022 program
				if (mintInfo && mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
					tokenProgramId = TOKEN_2022_PROGRAM_ID;
					setWithdrawalProgress(`Using Token2022 program for ${tokenInfo.get(tokenMint.toString())?.tokenSymbol || 'Token'}`);
				}
				

				// Call withdrawToBackup instruction
				// Note: Linter errors related to the .accounts() method are expected and should be ignored
				// according to the project's custom rules.
				const tx = await testudoProgram.methods
					.withdrawToBackup()
					.accounts({
						authority: userWallet,
						validSignerOfPassword: passwordKeypair.publicKey,
						backupAccount: centurionData.backupOwner,
						tokenProgram: tokenProgramId, // Use the detected token program
						mint: tokenMint,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
					})
					.signers([passwordKeypair])
					.rpc();

				const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
				
				await testudoProgram.provider.connection.confirmTransaction(
                    {
                        blockhash,
                        lastValidBlockHeight,
                        signature: tx,
                    }
                );
				
				const tokenSymbol = tokenInfo.get(tokenMint.toString())?.tokenSymbol || 'Token';
				const tokenDecimals = tokenInfo.get(tokenMint.toString())?.tokenDecimals || 9;
				const amount = formatBalance(testudo.testudoTokenCount, tokenDecimals);
				
				setWithdrawalProgress(`Successfully withdrew ${amount} ${tokenSymbol} (${i+1}/${totalTokens})`);
				successCount++;
				
			} catch (error) {
				console.error(`Error withdrawing token ${tokenMint.toString()}:`, error);
				const tokenSymbol = tokenInfo.get(tokenMint.toString())?.tokenSymbol || tokenMint.toString().substring(0, 8);
				errorTokens.push(tokenSymbol);
				setWithdrawalProgress(`Error withdrawing ${tokenSymbol} (${i+1}/${totalTokens})`);
			}
		}
		
		// Handle SOL balance if any
		if (centurionData.lamportBalance > 0) {
			try {
				setWithdrawalProgress(`Processing SOL (${totalTokens + 1}/${totalTokens + 1})...`);
				
				// Find the Centurion PDA
				const [centurionPDA] = findCenturionPDA(userWallet, testudoProgram.programId);

				// Call withdrawSolToBackup instruction
				// Note: Linter errors related to the .accounts() method are expected and should be ignored
				// according to the project's custom rules.
				const tx = await testudoProgram.methods
					.withdrawSolToBackup()
					.accounts({
						authority: userWallet,
						validSignerOfPassword: passwordKeypair.publicKey,
						backupAccount: centurionData.backupOwner,
						systemProgram: anchor.web3.SystemProgram.programId,
					})
					.signers([passwordKeypair])
					.rpc();

				const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
				
				await testudoProgram.provider.connection.confirmTransaction(
                    {
                        blockhash,
                        lastValidBlockHeight,
                        signature: tx,
                    }
                );
				
				const solAmount = centurionData.lamportBalance / 1e9; // Convert lamports to SOL
				setWithdrawalProgress(`Successfully withdrew ${solAmount} SOL (${totalTokens + 1}/${totalTokens + 1})`);
				successCount++;
				
			} catch (error) {
				console.error("Error withdrawing SOL:", error);
				errorTokens.push("SOL");
			}
		}
		
		// Set final status message
		if (errorTokens.length === 0) {
			// Check if we had SOL to withdraw
			const totalAssets = centurionData.lamportBalance > 0 ? totalTokens + 1 : totalTokens;
			setWithdrawalProgress(`Successfully withdrew all assets (${successCount}/${totalAssets}) to backup account`);
			toast.success("Emergency withdrawal completed successfully");
			
			// Call success callback to refresh the UI
			onSuccess();
			
			// Close modal after a short delay
			setTimeout(() => {
				onClose();
			}, 3000);
		} else {
			// Calculate total assets including SOL if present
			const totalAssets = centurionData.lamportBalance > 0 ? totalTokens + 1 : totalTokens;
			setWithdrawalProgress(`Completed with errors: ${successCount}/${totalAssets} assets processed. Failed: ${errorTokens.join(', ')}`);
			toast.error(`Emergency withdrawal completed with some errors`);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Clear previous progress
		setWithdrawalProgress("");

		try {
			// Validate backup owner exists
			if (!centurionData?.backupOwner) {
				setError("No backup account assigned. Please assign a backup account first.");
				return;
			}
			
			// Filter out empty words and join for API call
			const preparedWords = preparePasswordWords(passwordWords);
			
			// Validate only that we have enough words
			if (!validatePasswordWords(passwordWords)) {
				setError("Please enter at least 4 words for your password phrase");
				return;
			}
			
			// Set updating state
			setIsWithdrawing(true);

			// Derive keypair from password phrase words array
			const { keypair: passwordKeypair } = secureKeypairGenerator.deriveKeypairFromWords(preparedWords);
			
			// Execute the withdrawal process
			await handleWithdrawToBackup(passwordKeypair);
		} catch (err) {
			console.error("Error in emergency withdrawal:", err);
			
			// Check if this is an invalid password error from the on-chain program
			const errorMessage = String(err);
			if (errorMessage.includes("InvalidPasswordSignature")) {
				setError("Invalid password phrase. Please check your words and try again.");
			} else if (errorMessage.includes("NoBackupAccountStored")) {
				setError("No backup account is assigned. Please assign a backup account first.");
			} else if (errorMessage.includes("InvalidBackupAccount")) {
				setError("Invalid backup account. Please check the backup account address.");
			} else {
				setError(errorMessage);
			}
		} finally {
			setIsWithdrawing(false);
		}
	};

	// Reset form when closed
	useEffect(() => {
		if (!isOpen) {
			setPasswordWords(Array(6).fill(""));
			setError("");
			setWithdrawalProgress("");
		}
	}, [isOpen]);

	if (!isOpen) return null;

	// Only show withdrawal if there's a backup account assigned
	const hasBackupOwner = !!centurionData?.backupOwner;

	// Check if there are any tokens with balance
	const hasTokensWithBalance = centurionData?.testudos?.some(t => t.testudoTokenCount > 0) || (centurionData?.lamportBalance ?? 0) > 0;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-red-500/20 w-full max-w-md">
				{/* Compact header */}
				<div className="px-3 py-2 border-b border-red-500/20 bg-red-900/20 flex items-center justify-between">
					<div>
						<h3 className={`${charisSIL.className} text-sm font-semibold text-red-400`}>
							⚠️ Emergency Withdrawal
						</h3>
						<p className="text-xs text-red-300/80 mt-0.5">
							Transfer funds to backup account
						</p>
					</div>
					<button 
						onClick={onClose} 
						className="text-gray-400 hover:text-white p-1"
						type="button"
						disabled={isWithdrawing}
					>
						✕
					</button>
				</div>

				{/* Main content - make it scrollable with fixed height */}
				<div className="p-3 max-h-[60vh] overflow-y-auto">
					{!hasBackupOwner ? (
						<div className="p-2 bg-gray-800/60 rounded text-amber-300 text-xs">
							No backup account assigned. Please assign a backup account first.
						</div>
					) : !hasTokensWithBalance ? (
						<div className="p-2 bg-gray-800/60 rounded text-amber-300 text-xs">
							No tokens to withdraw. Your accounts are empty.
						</div>
					) : (
						<div className="space-y-3">
							{/* Emergency info box */}
							<div className="p-2 bg-gray-800/40 border border-red-500/20 rounded text-xs">
								<p className="text-red-300 mb-1.5">
									This is an emergency feature for if your wallet has been compromised.
								</p>
								<p className="text-red-300/80 text-xs">
									All funds will be transferred to:
									<span className="font-mono block mt-0.5 text-red-300 text-xs break-all">{centurionData?.backupOwner?.toString() || 'None assigned'}</span>
								</p>
							</div>

							{/* Password section */}
							<div>
								<label className="block text-gray-300 text-xs font-medium">Your Password Phrase</label>
								<p className="text-gray-400 text-xs mt-0.5 mb-1.5">
									Enter your 4-6 word phrase. Only fill what applies to you.
								</p>
								
								{/* Two rows of 3 inputs for a more compact layout */}
								<div className="grid grid-cols-3 gap-1.5 mb-1.5">
									{[0, 1, 2].map(index => (
										<input
											key={index}
											type="text"
											className="py-1.5 px-2 bg-gray-800/60 rounded border border-gray-700 text-white text-xs focus:border-amber-500 focus:outline-none"
											value={passwordWords[index] || ""}
											onChange={(e) => {
												const newWords = [...passwordWords];
												newWords[index] = e.target.value;
												setPasswordWords(newWords);
											}}
											placeholder={`Word ${index + 1}`}
										/>
									))}
								</div>
								<div className="grid grid-cols-3 gap-1.5">
									{[3, 4, 5].map(index => (
										<input
											key={index}
											type="text"
											className="py-1.5 px-2 bg-gray-800/60 rounded border border-gray-700 text-white text-xs focus:border-amber-500 focus:outline-none"
											value={passwordWords[index] || ""}
											onChange={(e) => {
												const newWords = [...passwordWords];
												newWords[index] = e.target.value;
												setPasswordWords(newWords);
											}}
											placeholder={`Word ${index + 1}`}
										/>
									))}
								</div>
								<p className="text-xs text-gray-500 mt-1">
									Required to authorize this emergency transfer
								</p>
							</div>

							{/* Error and progress messages */}
							{error && (
								<div className="p-1.5 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs">
									{error}
								</div>
							)}

							{withdrawalProgress && (
								<div className="p-1.5 bg-gray-800/60 border border-gray-700/50 rounded text-amber-300 text-xs max-h-24 overflow-y-auto">
									{withdrawalProgress}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer with action buttons */}
				<div className="px-3 py-2 border-t border-gray-800 bg-gray-900/90">
					<div className="flex space-x-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-1.5 px-3 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
							disabled={isWithdrawing}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={
								!validatePasswordWords(passwordWords) || isWithdrawing || !hasBackupOwner || !hasTokensWithBalance
							}
							className={`flex-1 py-1.5 px-3 rounded text-xs text-white font-medium transition-colors ${
								validatePasswordWords(passwordWords) && !isWithdrawing && hasBackupOwner && hasTokensWithBalance
									? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
									: "bg-gray-600 cursor-not-allowed"
							}`}
						>
							{isWithdrawing ? "Processing..." : "Confirm Emergency Withdrawal"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
} 