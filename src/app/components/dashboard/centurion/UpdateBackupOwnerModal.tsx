"use client";

import React, { useState } from "react";
import { Baskervville } from "next/font/google";
import { PublicKey } from "@solana/web3.js";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

interface UpdateBackupOwnerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onUpdateBackup: (
		backupPubkey: string,
		passwordKeypair: string
	) => Promise<void>;
	isUpdating: boolean;
}

export function UpdateBackupOwnerModal({
	isOpen,
	onClose,
	onUpdateBackup,
	isUpdating,
}: UpdateBackupOwnerModalProps) {
	const [backupPubkey, setBackupPubkey] = useState("");
	const [passwordWord, setPasswordWord] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			// Validate input is a valid public key
			try {
				new PublicKey(backupPubkey);
			} catch (err) {
				setError("Please enter a valid Solana public key");
				return;
			}

			if (!passwordWord) {
				setError("Please enter your password phrase");
				return;
			}

			await onUpdateBackup(backupPubkey, passwordWord);
		} catch (err) {
			setError(String(err));
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-md">
				<div className="p-6">
					<h3
						className={`${baskervville.className} text-xl font-semibold text-amber-400 mb-4`}
					>
						Update Backup Owner
					</h3>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								New Backup Public Key
							</label>
							<input
								type="text"
								className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none"
								value={backupPubkey}
								onChange={(e) =>
									setBackupPubkey(e.target.value)
								}
								placeholder="Enter new backup owner public key"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Your Password Phrase
							</label>
							<input
								type="password"
								className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none"
								value={passwordWord}
								onChange={(e) =>
									setPasswordWord(e.target.value)
								}
								placeholder="Enter your 6-word password phrase"
								required
							/>
							<p className="text-xs text-gray-500 mt-1">
								Your password phrase is required to authorize
								this change
							</p>
						</div>

						{error && (
							<div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 text-sm">
								{error}
							</div>
						)}

						<div className="flex space-x-4 pt-3">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
								disabled={isUpdating}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={
									!backupPubkey || !passwordWord || isUpdating
								}
								className={`flex-1 py-3 px-4 rounded-md text-black font-medium transition-colors duration-200 ${
									backupPubkey && passwordWord && !isUpdating
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
