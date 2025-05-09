"use client";

import React, { useState } from "react";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { motion } from "framer-motion";
import { IconInfoCircle } from "@tabler/icons-react";

export interface MnemonicPhraseGeneratorProps {
	onPhraseConfirmed: (publicKey: string) => void;
}

export function MnemonicPhraseGenerator({
	onPhraseConfirmed,
}: MnemonicPhraseGeneratorProps) {
	const [phraseLength, setPhraseLength] = useState<number>(6);
	const [generatedPhrase, setGeneratedPhrase] = useState<string[]>([]);
	const [showSecurityInfo, setShowSecurityInfo] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string>("");

	const keyManager = new SecureKeypairGenerator();

	const generateNewPhrase = (e: React.MouseEvent) => {
		e.preventDefault(); // Prevent form submission
		const newPhrase = keyManager.generateRandomPhrase(phraseLength);
		setGeneratedPhrase(newPhrase);
		setIsConfirmed(false);
	};

	const confirmPhrase = (e: React.MouseEvent) => {
		e.preventDefault(); // Prevent form submission
		setIsConfirming(true);
		
		// Move computation off main thread
		setTimeout(() => {
			try {
				const { keypair } = keyManager.deriveKeypairFromWords(generatedPhrase);
				onPhraseConfirmed(keypair.publicKey.toString());
				setIsConfirmed(true);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to confirm phrase');
			} finally {
				setIsConfirming(false);
			}
		}, 0);
	};

	// Word length options to show in the UI
	const wordLengthOptions = [5, 6, 8, 10, 12];

	return (
		<div className="space-y-6">
			<div>
				<label className="text-sm font-medium text-gray-300 mb-2 block">
					Choose Phrase Length:
				</label>
				<div className="flex flex-wrap gap-2 mb-2">
					{wordLengthOptions.map((length) => (
						<button
							key={length}
							type="button"
							onClick={(e) => {
								e.preventDefault();
								setPhraseLength(length);
								setGeneratedPhrase([]);
								setIsConfirmed(false);
							}}
							className={`px-4 py-2 rounded ${
								phraseLength === length
									? "bg-amber-500 text-black"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							}`}
						>
							{length} Words
						</button>
					))}
				</div>
				
				{/* Security info preview */}
				<div className="mt-3 bg-gray-800/30 p-3 rounded-lg border border-amber-500/10 relative">
					<div className="flex justify-between items-start">
						<div>
							<div className="text-amber-400 text-sm font-medium">
								Security Level: {keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.securityRank}/5
							</div>
							<div className="text-gray-400 text-xs mt-1 pr-8">
								{keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.description.split('.')[0]}.
								<span className="block mt-1 text-amber-300/80">
									Time to crack: {keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.timeToCrack}
								</span>
							</div>
						</div>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								setShowSecurityInfo(!showSecurityInfo);
							}}
							className="text-gray-400 hover:text-amber-500 transition-colors"
							title="Security Information"
						>
							<IconInfoCircle size={20} />
						</button>
					</div>
				</div>
			</div>

			{showSecurityInfo && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-gray-800/50 p-4 rounded-lg border border-amber-500/20"
				>
					<h4 className="text-amber-400 font-medium mb-2">
						Security Information
					</h4>
					<div className="space-y-2 text-sm text-gray-300 max-h-[40vh] overflow-y-auto pr-2">
						{Object.entries(keyManager.securityInfo)
							.filter(([length, _]) => parseInt(length) >= 4 && parseInt(length) <= 12)
							.sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
							.map(([length, info]) => (
								<div
									key={length}
									className={`p-2 rounded ${
										phraseLength === Number(length)
											? "bg-gray-700/50 border-l-2 border-amber-500"
											: ""
									}`}
								>
									<span className="font-medium text-amber-400">
										{length} Words:{" "}
									</span>
									<span>{info.description}</span>
									<div className="text-xs text-gray-400 mt-1">
										Possible combinations:{" "}
										{info.combinations.toLocaleString()}
										<br />
										Time to crack: {info.timeToCrack}
									</div>
								</div>
							))}
					</div>
				</motion.div>
			)}

			<div className="space-y-4">
				<button
					type="button"
					onClick={generateNewPhrase}
					className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-md hover:from-amber-600 hover:to-amber-700 transition-all duration-300"
				>
					Generate New {phraseLength}-Word Phrase
				</button>

				{generatedPhrase.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="space-y-4"
					>
						<div className="bg-gray-800/50 p-4 rounded-lg border border-amber-500/20">
							<div className="flex flex-wrap gap-2">
								{generatedPhrase.map((word, index) => (
									<div
										key={index}
										className="bg-gray-700/50 px-3 py-1.5 rounded text-amber-300"
									>
										{word}
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-between items-center">
							<button
								type="button"
								onClick={generateNewPhrase}
								className="text-sm text-gray-400 hover:text-amber-500 transition-colors"
							>
								Generate Another
							</button>
							<button
								type="button"
								onClick={confirmPhrase}
								disabled={isConfirmed || isConfirming}
								className={`px-6 py-2 rounded ${
									isConfirmed
										? "bg-green-600 text-white cursor-not-allowed"
										: isConfirming
										? "bg-amber-400 text-black cursor-wait"
										: "bg-amber-500 text-black hover:bg-amber-600"
								}`}
							>
								{isConfirmed 
									? "Confirmed ✓" 
									: isConfirming 
									? "Confirming..." 
									: "Confirm Phrase"}
							</button>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}
