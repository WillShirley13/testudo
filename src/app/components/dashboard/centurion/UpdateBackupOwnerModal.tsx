"use client";

import React, { useState, useEffect } from "react";
import { charisSIL } from "@/app/fonts";
import { PublicKey } from "@solana/web3.js";
import { PasswordPhraseInput, validatePasswordWords, preparePasswordWords } from "@/app/components/common/PasswordPhraseInput";
import { useTestudoProgram } from "@/app/components/solana/solana-provider";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { findCenturionPDA } from "@/app/utils/testudo-utils";


interface UpdateBackupOwnerModalProps {
	isOpen: boolean;
	onClose: () => void;
	userWallet: PublicKey;
	onSuccess: () => void;  // Callback when update is successful
	isUpdating: boolean;
	setIsUpdating: (value: boolean) => void;
}

export function UpdateBackupOwnerModal({
	isOpen,
	onClose,
	userWallet,
	onSuccess,
	isUpdating,
	setIsUpdating,
}: UpdateBackupOwnerModalProps) {
	const [backupPubkey, setBackupPubkey] = useState("");
	const [passwordWords, setPasswordWords] = useState<string[]>(Array(6).fill(""));
	const [error, setError] = useState("");
	
	// Get the testudo program instance
	const testudoProgram = useTestudoProgram();
	const secureKeypairGenerator = new SecureKeypairGenerator();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			// Validate input is a valid public key
			let newBackupPubkey;
			try {
				newBackupPubkey = new PublicKey(backupPubkey);
			} catch (err) {
				setError("Please enter a valid Solana public key");
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
			setIsUpdating(true);

			// Derive keypair from password phrase words array
			const { keypair: passwordKeypair } = secureKeypairGenerator.deriveKeypairFromWords(preparedWords);
			
			// Find the Centurion PDA
			const [centurionPDA] = findCenturionPDA(userWallet, testudoProgram.programId);

			// Update backup owner directly from this component
			try {
				const tx = await testudoProgram.methods
					.updateBackUpAccount(newBackupPubkey)
					.accounts({
						authority: userWallet,
						validSignerOfPassword: passwordKeypair.publicKey,
						centurion: centurionPDA,
					})
					.signers([passwordKeypair])
					.rpc();

				// Get latest blockhash once
				const { blockhash, lastValidBlockHeight } = await testudoProgram.provider.connection.getLatestBlockhash();
				
				await testudoProgram.provider.connection.confirmTransaction({
					signature: tx,
					blockhash,
					lastValidBlockHeight,
				});

				// Call success callback to refresh the UI
				onSuccess();
				onClose();
			} catch (e) {
				console.error("RPC Error:", e);
				// Check if this is an invalid password error from the on-chain program
				const errorMessage = String(e);
				if (errorMessage.includes("InvalidPasswordSignature")) {
					setError("Invalid password phrase. Please check your words and try again.");
				} else {
					setError(errorMessage);
				}
				throw e;
			}
		} catch (err) {
			console.error("Error updating backup owner:", err);
		} finally {
			setIsUpdating(false);
		}
	};

	// Reset form when closed
	useEffect(() => {
		if (!isOpen) {
			setPasswordWords(Array(6).fill(""));
			setBackupPubkey("");
			setError("");
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
				<div className="p-5 sm:p-6">
					<h3
						className={`${charisSIL.className} text-xl font-semibold text-amber-400 mb-3 sm:mb-4`}
					>
						Update Backup Owner
					</h3>

					<form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								New Backup Public Key
							</label>
							<input
								type="text"
								className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none text-sm"
								value={backupPubkey}
								onChange={(e) =>
									setBackupPubkey(e.target.value)
								}
								placeholder="Enter new backup owner public key"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Your Password Phrase
							</label>
							<PasswordPhraseInput 
								words={passwordWords}
								onChange={setPasswordWords}
								maxWords={6}
								className="mb-2"
							/>
							<p className="text-xs text-gray-500 mt-1">
								Required to authorize this change
							</p>
						</div>

						{error && (
							<div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 text-sm">
								{error}
							</div>
						)}

						<div className="flex space-x-3 sm:space-x-4 pt-3">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-3 px-3 sm:px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200 text-sm"
								disabled={isUpdating}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={
									!backupPubkey || !validatePasswordWords(passwordWords) || isUpdating
								}
								className={`flex-1 py-3 px-3 sm:px-4 rounded-md text-black font-medium transition-colors duration-200 text-sm ${
									backupPubkey && validatePasswordWords(passwordWords) && !isUpdating
										? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
										: "bg-gray-600 cursor-not-allowed"
								}`}
							>
								{isUpdating ? "Updating..." : "Update Backup"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
