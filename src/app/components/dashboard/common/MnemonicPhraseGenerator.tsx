"use client";

import React, { useState } from "react";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { motion } from "framer-motion";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAnchorProvider } from "@/app/components/solana/solana-provider";

export interface MnemonicPhraseGeneratorProps {
	onPhraseConfirmed: (publicKey: string) => void;
    userNumberPin: string;
}

export function MnemonicPhraseGenerator({
	onPhraseConfirmed,
    userNumberPin
}: MnemonicPhraseGeneratorProps) {
	const [phraseLength, setPhraseLength] = useState<number>(6);
	const [generatedPhrase, setGeneratedPhrase] = useState<string[]>([]);
	const [showSecurityInfo, setShowSecurityInfo] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string>("");
	const provider = useAnchorProvider();
    const publicKey = provider.publicKey;
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
		setTimeout(async () => {
			try {
				const { keypair } = await keyManager.deriveKeypairFromWords(generatedPhrase, publicKey?.toString() || "", userNumberPin);
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
							{userNumberPin ? (
								(() => {
									const enhancedInfo = keyManager.getEnhancedSecurityInfo(phraseLength, userNumberPin.length);
									return enhancedInfo ? (
										<>
											<div className="text-amber-400 text-sm font-medium">
												Enhanced Security Level: {enhancedInfo.securityRank}/5
											</div>
											<div className="text-gray-400 text-xs mt-1 pr-8">
												{enhancedInfo.description.split('.')[0]}.
												<span className="block mt-1 text-amber-300/80">
													Time to crack: {enhancedInfo.timeToCrack}
												</span>
												<span className="block mt-1 text-green-400/80">
													{enhancedInfo.enhancement.improvementFactor.toLocaleString()}x stronger with {userNumberPin.length} digits
												</span>
											</div>
										</>
									) : null;
								})()
							) : (
								<>
									<div className="text-amber-400 text-sm font-medium">
										Security Level: {keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.securityRank}/5
									</div>
									<div className="text-gray-400 text-xs mt-1 pr-8">
										{keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.description.split('.')[0]}.
										<span className="block mt-1 text-amber-300/80">
											Time to crack: {keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.timeToCrack}
										</span>
									</div>
								</>
							)}
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
						{userNumberPin ? (
							// Show enhanced security info when numbers are added
							<div className="space-y-3">
								<div className="p-3 rounded bg-green-900/30 border border-green-500/30">
									<div className="text-green-400 font-medium mb-2">
										Current Configuration: {phraseLength} words + {userNumberPin.length} digits
									</div>
									{(() => {
										const enhancedInfo = keyManager.getEnhancedSecurityInfo(phraseLength, userNumberPin.length);
										return enhancedInfo ? (
											<div>
												<div className="text-sm">
													<span className="text-amber-400 font-medium">Enhanced Security: </span>
													{enhancedInfo.description}
												</div>
												<div className="text-xs text-gray-400 mt-2">
													Possible combinations: {enhancedInfo.combinations.toExponential(2)}
													<br />
													Time to crack: {enhancedInfo.timeToCrack}
													<br />
													<span className="text-green-400">
														Security improvement: {enhancedInfo.enhancement.improvementFactor.toLocaleString()}x stronger
													</span>
												</div>
											</div>
										) : null;
									})()}
								</div>
								
								<div className="text-xs text-gray-500 italic">
									Comparison without numbers:
								</div>
								
								<div className="p-2 rounded bg-gray-700/30 border-l-2 border-amber-500">
									<span className="font-medium text-amber-400">
										{phraseLength} Words Only: 
									</span>
									<span>{keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.description}</span>
									<div className="text-xs text-gray-400 mt-1">
										Time to crack: {keyManager.securityInfo[phraseLength as keyof typeof keyManager.securityInfo]?.timeToCrack}
									</div>
								</div>
							</div>
						) : (
							// Show standard security info when no numbers
							Object.entries(keyManager.securityInfo)
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
								))
						)}
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
								{userNumberPin && (
									<div className="bg-green-700/50 px-3 py-1.5 rounded text-green-300 border border-green-500/30">
										{userNumberPin}
									</div>
								)}
							</div>
							{userNumberPin && (
								<p className="text-xs text-green-400 mt-2">
									Numbers added for enhanced security (makes your phrase {Math.pow(10, userNumberPin.length).toLocaleString()}x harder to guess)
								</p>
							)}
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
