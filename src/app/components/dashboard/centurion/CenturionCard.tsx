"use client";

import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { charisSIL } from "@/app/fonts";
import {
	formatTimestamp,
	formatBalance,
    findCenturionPDA
} from "@/app/utils/testudo-utils";
import { motion } from "framer-motion";
import { CenturionData } from "@/app/types/testudo";
import { UpdateBackupOwnerModal } from "./UpdateBackupOwnerModal";
import { WithdrawToBackupModal } from "./WithdrawToBackupModal";

interface CenturionCardProps {
	centurionData: CenturionData;
	userWallet: PublicKey;
	programId: PublicKey;
	onCenturionUpdated: () => void;  // Callback to refresh Centurion data
}

export function CenturionCard({
	centurionData,
	userWallet,
	programId,
	onCenturionUpdated,
}: CenturionCardProps) {
	const [showUpdateBackupModal, setShowUpdateBackupModal] = useState(false);
	const [isUpdatingBackup, setIsUpdatingBackup] = useState(false);
	const [showWithdrawToBackupModal, setShowWithdrawToBackupModal] = useState(false);
	const [isWithdrawingToBackup, setIsWithdrawingToBackup] = useState(false);

	// Get the Centurion PDA
	const [centurionPDA] = findCenturionPDA(userWallet, programId);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="bg-gradient-to-b from-gray-900/80 to-gray-950/90 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-amber-500/20 mb-8 max-w-3xl mx-auto"
		>
			<div className="p-8">
				<h2
					className={`${charisSIL.className} text-3xl text-amber-400 mb-6 text-center`}
				>
					Centurion
				</h2>

				<div className="flex flex-col space-y-4">
					{/* Public Key */}
					<div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
						<div className="text-sm text-amber-300 font-medium mb-1">Public Key</div>
						<div className="text-white font-mono text-sm break-all">
							{centurionPDA.toString()}
						</div>
					</div>

					{/* Timestamps Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Created */}
						<div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
							<div className="text-sm text-amber-300 font-medium mb-1">Created</div>
							<div className="text-white">
								{formatTimestamp(centurionData?.createdAt)}
							</div>
						</div>

						{/* Last Accessed */}
						<div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
							<div className="text-sm text-amber-300 font-medium mb-1">Last Accessed</div>
							<div className="text-white">
								{formatTimestamp(centurionData?.lastAccessed)}
							</div>
						</div>
					</div>

					{/* SOL Balance */}
					<div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
						<div className="text-sm text-amber-300 font-medium mb-1">SOL Balance</div>
						<div className="text-white font-medium flex items-center text-lg">
							<span>
								{formatBalance(centurionData?.lamportBalance)}{" "}
								SOL
							</span>
						</div>
					</div>

					{/* Password Public Key */}
					<div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
						<div className="text-sm text-amber-300 font-medium mb-1">Password Public Key</div>
						<div className="text-white font-mono text-sm break-all">
							{centurionData?.pubkeyToPassword?.toString()}
						</div>
					</div>

					{/* Optio (backup account) */}
					<div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
						<div className="flex justify-between items-center mb-1">
							<div className="text-sm text-amber-300 font-medium">Optio (backup account)</div>
							<div className="flex space-x-2">
								<button 
									onClick={() => setShowUpdateBackupModal(true)}
									className="text-xs px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 rounded-md text-amber-400 transition-colors"
								>
									Reassign
								</button>
								<button 
									onClick={() => centurionData?.backupOwner && setShowWithdrawToBackupModal(true)}
									className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
										centurionData?.backupOwner 
											? "bg-red-600/30 hover:bg-red-600/50 text-red-400 cursor-pointer" 
											: "bg-gray-600/30 text-gray-400 cursor-not-allowed"
									}`}
									title={centurionData?.backupOwner 
										? "Emergency withdrawal to backup account" 
										: "Assign a backup account first to enable emergency withdrawals"}
								>
									Withdraw
								</button>
							</div>
						</div>
						<div className="text-white font-mono text-sm break-all">
							{centurionData?.backupOwner?.toString() ||
								"Unassigned"}
						</div>
					</div>
				</div>
			</div>

			{/* Update Backup Owner Modal */}
			<UpdateBackupOwnerModal
				isOpen={showUpdateBackupModal}
				onClose={() => setShowUpdateBackupModal(false)}
				userWallet={userWallet}
				onSuccess={onCenturionUpdated}
				isUpdating={isUpdatingBackup}
				setIsUpdating={setIsUpdatingBackup}
			/>

			{/* Withdraw to Backup Modal */}
			<WithdrawToBackupModal
				isOpen={showWithdrawToBackupModal}
				onClose={() => setShowWithdrawToBackupModal(false)}
				userWallet={userWallet}
				centurionData={centurionData}
				onSuccess={onCenturionUpdated}
				isWithdrawing={isWithdrawingToBackup}
				setIsWithdrawing={setIsWithdrawingToBackup}
			/>
		</motion.div>
	);
}
