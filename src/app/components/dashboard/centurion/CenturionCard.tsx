"use client";

import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { charisSIL } from "@/app/fonts";
import {
	formatTimestamp,
	formatBalance,
	shortenAddress,
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
			className="bg-gray-900/60 backdrop-blur-md rounded-lg overflow-hidden shadow-lg border border-amber-500/20 mb-8"
		>
			<div className="p-6">
				<h2
					className={`${charisSIL.className} text-2xl font-semibold text-amber-400 mb-4`}
				>
					Centurion Information
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-3 bg-gray-800/40 rounded-md border border-gray-700/50">
						<div className="text-sm text-gray-400">Public Key</div>
						<div className="text-white font-mono text-sm break-all">
							{centurionPDA.toString()}
						</div>
					</div>

					<div className="p-3 bg-gray-800/40 rounded-md border border-gray-700/50">
						<div className="text-sm text-gray-400">Created</div>
						<div className="text-white">
							{formatTimestamp(centurionData?.createdAt)}
						</div>
					</div>

					<div className="p-3 bg-gray-800/40 rounded-md border border-gray-700/50">
						<div className="text-sm text-gray-400">
							Last Accessed
						</div>
						<div className="text-white">
							{formatTimestamp(centurionData?.lastAccessed)}
						</div>
					</div>

					<div className="p-3 bg-gray-800/40 rounded-md border border-gray-700/50">
						<div className="text-sm text-gray-400">SOL Balance</div>
						<div className="text-white font-medium flex items-center">
							<span>
								{formatBalance(centurionData?.lamportBalance)}{" "}
								SOL
							</span>
						</div>
					</div>

					<div className="p-3 bg-gray-800/40 rounded-md border border-gray-700/50">
						<div className="text-sm text-gray-400">
							Password Public Key
						</div>
						<div className="text-white font-mono text-sm break-all">
							{centurionData?.pubkeyToPassword?.toString()}
						</div>
					</div>

					<div className="p-3 bg-gray-800/40 rounded-md border border-gray-700/50">
						<div className="text-sm text-gray-400 flex justify-between items-center">
							<span>Optio (backup account)</span>
							<div className="flex space-x-2">
								<button 
									onClick={() => setShowUpdateBackupModal(true)}
									className="text-xs px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 rounded text-amber-400 transition-colors"
								>
									Reassign
								</button>
								<button 
									onClick={() => centurionData?.backupOwner && setShowWithdrawToBackupModal(true)}
									className={`text-xs px-2 py-1 rounded transition-colors ${
										centurionData?.backupOwner 
											? "bg-red-600/30 hover:bg-red-600/50 text-red-400 cursor-pointer" 
											: "bg-gray-600/30 text-gray-400 cursor-not-allowed"
									}`}
									title={centurionData?.backupOwner 
										? "Emergency withdrawal to backup account" 
										: "Assign a backup account first to enable emergency withdrawals"}
								>
									Emergency
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
