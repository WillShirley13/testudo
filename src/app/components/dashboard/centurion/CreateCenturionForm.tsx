"use client";

import React, { useState } from "react";
import Image from "next/image";
import { charisSIL } from "@/app/fonts";
import { motion } from "framer-motion";
import { MnemonicPhraseGenerator } from "../common/MnemonicPhraseGenerator";
import { PublicKey } from "@solana/web3.js";
import { useTestudoProgram } from "@/app/components/solana/solana-provider";
import { findCenturionPDA } from "@/app/utils/testudo-utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { CenturionData } from "@/app/types/testudo";


interface CreateCenturionFormProps {
	onSuccess: (centurionData: CenturionData) => void;
	isCreating: boolean;
	setIsCreating: (isCreating: boolean) => void;
}

export function CreateCenturionForm({
	onSuccess,
	isCreating,
	setIsCreating,
}: CreateCenturionFormProps) {
	const [showForm, setShowForm] = useState(false);
	const [derivedPublicKey, setDerivedPublicKey] = useState("");
	const [backupOwner, setBackupOwner] = useState("");
	const [error, setError] = useState("");

	// Get necessary Solana components
	const { publicKey } = useWallet();
	const testudoProgram = useTestudoProgram();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!publicKey) return;

		try {
			setError("");
			setIsCreating(true);

			// Validate input public keys
			let parsedPasswordPubkey;
			let parsedBackupOwner = null;

			try {
				parsedPasswordPubkey = new PublicKey(derivedPublicKey);
				if (backupOwner) {
					parsedBackupOwner = new PublicKey(backupOwner);
				}
			} catch (error) {
				console.error("Invalid public key format");
				setError("Please enter valid public key(s)");
				setIsCreating(false);
				return;
			}

			// Find the Centurion PDA
			const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);

			// Initialize Centurion account
			try {
				const tx = await testudoProgram.methods
					.initCenturion(parsedPasswordPubkey, parsedBackupOwner)
					.accounts({
						authority: publicKey,
					})
                    .signers([])
					.rpc();

				// Get latest blockhash
				const { blockhash, lastValidBlockHeight } = await testudoProgram.provider.connection.getLatestBlockhash();
				
				await testudoProgram.provider.connection.confirmTransaction({
					signature: tx,
					blockhash,
					lastValidBlockHeight,
				});

				// Refresh account data
				const centurionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				// Call the success callback with the new centurion data
				onSuccess(centurionAccount as unknown as CenturionData);
			} catch (e) {
				console.error("RPC Error:", e);
				setError(`Failed to create Centurion: ${e instanceof Error ? e.message : String(e)}`);
				throw e;
			}
		} catch (error) {
			console.error("Error creating Centurion:", error);
			setError("Failed to create Centurion account. Please try again.");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="min-h-[calc(100vh-6rem)] pt-36 flex items-center justify-center p-6"
		>
			<div className="max-w-xl mx-auto bg-gray-900/60 backdrop-blur-md rounded-lg overflow-hidden shadow-xl border border-amber-500/20">
				<div className="p-8">
					<div className="flex items-center justify-center mb-6">
						<Image
							src="/on-the-attack.png"
							alt="Roman Soldiers"
							width={150}
							height={150}
						/>
					</div>

					<h1
						className={`${charisSIL.className} text-3xl text-center font-bold mb-6 text-amber-400`}
					>
						Create Your Centurion
					</h1>

					<p className="text-gray-300 mb-6 text-center">
						You need to create a Centurion account to use
						Testudo&apos;s secure wallet system.
					</p>

					{showForm ? (
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div>
								<MnemonicPhraseGenerator
									onPhraseConfirmed={(publicKey) =>
										setDerivedPublicKey(publicKey)
									}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Backup Owner (Optional)
								</label>
								<input
									type="text"
									placeholder="Enter backup owner public key"
									className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none"
									value={backupOwner}
									onChange={(e) =>
										setBackupOwner(e.target.value)
									}
								/>
								<p className="text-xs text-gray-500 mt-1">
									Optional backup account for recovery
									purposes.
								</p>
							</div>

							{error && (
								<div className="p-2 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 text-sm">
									{error}
								</div>
							)}

							<div className="flex space-x-4 pt-3">
								<button
									type="button"
									onClick={() => setShowForm(false)}
									className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
									disabled={isCreating}
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={!derivedPublicKey || isCreating}
									className={`flex-1 py-3 px-4 rounded-md text-black font-medium transition-colors duration-200 ${
										derivedPublicKey && !isCreating
											? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
											: "bg-gray-600 cursor-not-allowed"
									}`}
								>
									{isCreating
										? "Creating..."
										: "Create Centurion"}
								</button>
							</div>
						</form>
					) : (
						<div className="text-center">
							<button
								onClick={() => setShowForm(true)}
								className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-md hover:from-amber-600 hover:to-amber-700 transition-all duration-300"
							>
								Create Centurion Account
							</button>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
