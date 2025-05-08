"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useTestudoProgram, useAnchorProvider } from "@/app/components/solana/solana-provider";
import Image from "next/image";
import { motion } from "framer-motion";
import { charisSIL } from "@/app/fonts";
import { findCenturionPDA } from "@/app/utils/testudo-utils";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { CenturionCard, CreateCenturionForm } from "@/app/components/dashboard/centurion";
import { TestudoAccountsTable } from "@/app/components/dashboard/testudo";
import { CenturionData } from "@/app/types/testudo";
import { toast } from "react-hot-toast";
import * as anchor from "@coral-xyz/anchor";


export default function DashboardPage() {
	const wallet = useWallet();
    const provider = useAnchorProvider();
    
	const { connected, publicKey } = wallet;
	const testudoProgramRaw = useTestudoProgram();
	// Memoize the program to avoid unnecessary re-renders
	const testudoProgram = useMemo(() => testudoProgramRaw, [testudoProgramRaw]);
    const secureKeypairGenerator = new SecureKeypairGenerator();

	// Note: Linter errors related to the .accounts() methods are expected and should be ignored
	// according to the project's custom rules.

	const [loading, setLoading] = useState(true);
	const [hasCenturion, setHasCenturion] = useState(false);
	const [centurionData, setCenturionData] = useState<CenturionData | null>(null);
	const [creatingCenturion, setCreatingCenturion] = useState(false);

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

	// Add a function to fetch testudos
	const fetchTestudos = async () => {
		if (!publicKey) return;
		
		try {
			const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
			const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
			setCenturionData(updatedCenturionAccount as unknown as CenturionData);
		} catch (error) {
			console.error("Error fetching testudos:", error);
		}
	};

	// Render different states based on wallet connection and Centurion existence
	if (!connected) {
		return (
			<div className="relative min-h-screen flex flex-col items-center justify-center p-6">
				<div className="absolute inset-0 backdrop-blur-md bg-[#0c1221]/80 z-10"></div>

				<div className="relative z-20 text-center max-w-xl mx-auto">
					<div className="mb-8">
						<Image
							src="/on-the-attack.png"
							alt="Roman Soldiers"
							width={200}
							height={200}
							className="mx-auto"
						/>
					</div>

					<h1
						className={`${charisSIL.className} text-3xl md:text-4xl font-bold mb-4 text-amber-400`}
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
				onSuccess={(centurionData) => {
					setHasCenturion(true);
					setCenturionData(centurionData);
				}}
				isCreating={creatingCenturion}
				setIsCreating={setCreatingCenturion}
			/>
		);
	}

	// Main Dashboard View (when user has a Centurion)
	return (
		<div className="min-h-screen pb-20">
			<div className="content-container pt-36">
				{/* Dashboard Header with animation */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-10"
				>
					<div className="flex flex-col md:flex-row justify-end items-center mb-6">
						<div className="flex items-center">
							<div className="relative mr-3">
								<Image
									src="/on-the-attack.png"
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
						onCenturionUpdated={fetchTestudos}
					/>
				)}

				{/* Testudo Token Accounts */}
				<TestudoAccountsTable 
					testudos={centurionData?.testudos}
					centurionData={centurionData}
					programId={testudoProgram.programId}
					onCenturionUpdated={(updatedCenturionData) => {
						setCenturionData(updatedCenturionData);
					}}
				/>
			</div>
		</div>
	);
}
