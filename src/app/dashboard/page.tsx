"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Keypair } from "@solana/web3.js";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import Image from "next/image";
import { motion } from "framer-motion";
import { Baskervville } from "next/font/google";
import { findCenturionPDA, findTestudoPDA, findLegatePDA, generateKeypairFromSeed } from "@/app/utils/testudo-utils";
import { CenturionCard, CreateCenturionForm } from "@/app/components/dashboard/centurion";
import { CreateTestudoModal, TestudoAccountsTable } from "@/app/components/dashboard/testudo";
import { CenturionData, TestudoData } from "@/app/types/testudo";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

export default function DashboardPage() {
	const wallet = useWallet();
    const provider = useAnchorProvider();
    
	const { connected, publicKey } = wallet;
	const testudoProgramRaw = useTestudoProgram();
	// Memoize the program to avoid unnecessary re-renders
	const testudoProgram = useMemo(() => testudoProgramRaw, [testudoProgramRaw.programId.toString()]);

	const [loading, setLoading] = useState(true);
	const [hasCenturion, setHasCenturion] = useState(false);
	const [centurionData, setCenturionData] = useState<CenturionData | null>(null);
	const [showCreateTestudo, setShowCreateTestudo] = useState(false);
	const [creatingCenturion, setCreatingCenturion] = useState(false);
	const [creatingTestudo, setCreatingTestudo] = useState(false);
	const [updatingBackupOwner, setUpdatingBackupOwner] = useState(false);

	useEffect(() => {
		// Reset states when wallet disconnects
		if (!connected) {
			setHasCenturion(false);
			setCenturionData(null);
			setLoading(false);
			return;
		}

		// Check if user has a Centurion account
		const checkCenturionAccount = async () => {
			if (!publicKey) return;

			try {
				setLoading(true);

				// Find the Centurion PDA
				const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);

				// Try to fetch the Centurion account
				try {
					const centurionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
					if (centurionAccount) {
						setHasCenturion(true);
						setCenturionData(centurionAccount as unknown as CenturionData);
					}
				} catch (error) {
					// If error, assume Centurion doesn't exist
					setHasCenturion(false);
					setCenturionData(null);
				}
			} catch (error) {
				console.error("Error checking Centurion account:", error);
			} finally {
				setLoading(false);
			}
		};

		checkCenturionAccount();
	}, [connected, publicKey, testudoProgram]);

	const handleCreateCenturion = async (passwordPublicKey: string, backupOwner: string) => {
		if (!publicKey) return;

		try {
			setCreatingCenturion(true);

			// Validate input public keys
			let parsedPasswordPubkey;
			let parsedBackupOwner = null;

			try {
				parsedPasswordPubkey = new PublicKey(passwordPublicKey);
				if (backupOwner) {
					parsedBackupOwner = new PublicKey(backupOwner);
				}
			} catch (error) {
				console.error("Invalid public key format");
				alert("Please enter valid public key(s)");
				setCreatingCenturion(false);
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

				// Get latest blockhash once
				const { blockhash, lastValidBlockHeight } = await testudoProgram.provider.connection.getLatestBlockhash();
				
				await testudoProgram.provider.connection.confirmTransaction({
					signature: tx,
					blockhash,
					lastValidBlockHeight,
				});

				// Refresh account data
				const centurionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				setHasCenturion(true);
				setCenturionData(centurionAccount as unknown as CenturionData);
			} catch (e) {
				console.error("RPC Error:", e);
				throw e;
			}
		} catch (error) {
			console.error("Error creating Centurion:", error);
			alert("Failed to create Centurion account. Please try again.");
		} finally {
			setCreatingCenturion(false);
		}
	};

	const handleCreateTestudo = async (mintAddress: string) => {
		if (!publicKey) return;

		try {
			setCreatingTestudo(true);

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

			console.log(`Creating Testudo with ${isToken2022 ? "Token 2022" : "Token"} Program`);

			// Create Testudo account with the correct token program
			const tx = await testudoProgram.methods
				.createTestudo()
				.accounts({
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
			setCenturionData(updatedCenturionAccount as unknown as CenturionData);
			setShowCreateTestudo(false);
		} catch (error) {
			console.error("Error creating Testudo:", error);
			alert("Failed to create Testudo account. Please try again.");
		} finally {
			setCreatingTestudo(false);
		}
	};

	const handleUpdateBackupOwner = async (backupPubkey: string, passwordPhrase: string) => {
		if (!publicKey || !centurionData) return;

		try {
			setUpdatingBackupOwner(true);

			// Derive keypair from password phrase
			const passwordKeypair = generateKeypairFromSeed(passwordPhrase);
			
			// Check if derived public key matches the one stored in centurion account
			if (passwordKeypair.publicKey.toString() !== centurionData.pubkeyToPassword.toString()) {
				throw new Error("Invalid password phrase");
			}

			const newBackupPubkey = new PublicKey(backupPubkey);
			const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);

			// Update backup owner
			try {
				const tx = await testudoProgram.methods
					.updateBackUpAccount(newBackupPubkey)
					.accounts({
						authority: publicKey,
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

				// Refresh Centurion data
				const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
				setCenturionData(updatedCenturionAccount as unknown as CenturionData);
				alert("Backup owner updated successfully!");
			} catch (e) {
				console.error("RPC Error:", e);
				throw e;
			}
		} catch (error) {
			console.error("Error updating backup owner:", error);
			alert(`Failed to update backup owner: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setUpdatingBackupOwner(false);
		}
	};

	const handleDeposit = async (testudo: TestudoData | "SOL") => {
		if (testudo === "SOL") {
			alert("Deposit SOL functionality to be implemented");
			// Implementation for native SOL deposit functionality would go here
		} else {
			alert("Deposit SPL token functionality to be implemented");
			// Implementation for SPL token deposit functionality would go here
		}
	};

	const handleWithdraw = async (testudo: TestudoData | "SOL") => {
		if (testudo === "SOL") {
			alert("Withdraw SOL functionality to be implemented");
			// Implementation for native SOL withdraw functionality would go here
		} else {
			alert("Withdraw SPL token functionality to be implemented");
			// Implementation for SPL token withdraw functionality would go here
		}
	};

	const handleDelete = async (testudo: TestudoData) => {
		alert("Delete functionality to be implemented");
		// Implementation for delete functionality would go here
	};

	// Render different states based on wallet connection and Centurion existence
	if (!connected) {
		return (
			<div className="relative min-h-screen flex flex-col items-center justify-center p-6">
				<div className="absolute inset-0 backdrop-blur-md bg-[#0c1221]/80 z-10"></div>

				<div className="relative z-20 text-center max-w-xl mx-auto">
					<div className="mb-8">
						<Image
							src="/on-the-attack2-Photoroom.png"
							alt="Roman Soldiers"
							width={200}
							height={200}
							className="mx-auto"
						/>
					</div>

					<h1
						className={`${baskervville.className} text-3xl md:text-4xl font-bold mb-4 text-amber-400`}
					>
						Connect Your Wallet
					</h1>

					<p className="text-gray-300 mb-6">
						Please connect your wallet to access the Testudo
						Dashboard and manage your secure assets.
					</p>

					<div className="border-t border-amber-500/20 pt-4 mt-6">
						<p className="text-amber-400/70 text-sm">
							Testudo provides a secure dual-signature wallet
							system for your assets on the Solana blockchain.
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="flex flex-col items-center">
					<div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
					<p className="text-amber-400">Loading your Testudo...</p>
				</div>
			</div>
		);
	}

	if (!hasCenturion) {
		return (
			<CreateCenturionForm 
				onCreateCenturion={handleCreateCenturion}
				isCreating={creatingCenturion}
			/>
		);
	}

	// Main Dashboard View (when user has a Centurion)
	return (
		<div className="min-h-screen pb-20">
			<div className="content-container pt-8">
				{/* Dashboard Header with animation */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-10"
				>
					<div className="flex flex-col md:flex-row justify-end items-center mb-6">
						<div className="mt-4 md:mt-0 flex items-center">
							<div className="relative mr-3">
								<Image
									src="/on-the-attack2-Photoroom.png"
									alt="Roman Soldier"
									width={48}
									height={48}
								/>
							</div>
							<div className="bg-gray-800/50 p-2 rounded-md border border-amber-500/20">
								<div className="text-sm text-gray-400">
									Wallet
								</div>
								<div className="text-amber-300 font-mono text-sm truncate max-w-[140px] md:max-w-[200px]">
									{publicKey?.toString().slice(0, 8)}...
									{publicKey?.toString().slice(-8)}
								</div>
							</div>
						</div>
					</div>

					<div className="h-0.5 bg-gradient-to-r from-amber-700/5 via-amber-500/30 to-amber-700/5"></div>
				</motion.div>

				{/* Centurion Info Card */}
				{publicKey && centurionData && (
					<CenturionCard 
						centurionData={centurionData}
						userWallet={publicKey}
						programId={testudoProgram.programId}
						onUpdateBackupOwner={handleUpdateBackupOwner}
					/>
				)}

				{/* Testudo Token Accounts */}
				<TestudoAccountsTable 
					testudos={centurionData?.testudos}
					centurionData={centurionData}
					programId={testudoProgram.programId}
					onCreateTestudo={() => setShowCreateTestudo(true)}
					onDeposit={handleDeposit}
					onWithdraw={handleWithdraw}
					onDelete={handleDelete}
				/>
			</div>

			{/* Create Testudo Modal */}
			<CreateTestudoModal 
				isOpen={showCreateTestudo}
				onClose={() => setShowCreateTestudo(false)}
				onCreateTestudo={handleCreateTestudo}
				isCreating={creatingTestudo}
			/>
		</div>
	);
}
