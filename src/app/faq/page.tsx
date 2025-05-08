"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronDown } from "@tabler/icons-react";

interface FaqItem {
	question: string;
	answer: string;
}

export default function FaqPage() {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	const faqItems: FaqItem[] = [
		{
			question: "What is Testudo?",
			answer: "Testudo is a secure wallet system on Solana where users can deposit and withdraw funds from accounts derived by the testudo onchain program but controlled by the user. It implements a dual-signature security system providing enhanced protection for your digital assets.",
		},
		{
			question: "How does the dual-signature security work?",
			answer: "Testudo uses dual-signature security: your wallet signature plus one from a keypair derived from your memorable phrase. Unlike multi-sig wallets, this on-chain 2FA protects your funds even if your main wallet is compromised. The second signature comes from a short, memorable 4-6 word phrase instead of the typical 12-24 words, making it easy to remember while maintaining security and keeping funds instantly accessible.",
		},
		{
			question: "What is a Centurion account?",
			answer: "A Centurion is your main wallet container in the Testudo system. Each Centurion can hold multiple token accounts (called 'Testudos') for different SPL tokens. This structure allows you to manage various assets through a single secure interface.",
		},
		{
			question: "How do I recover my assets if my primary wallet is compromised?",
			answer: "Testudo allows you to configure a backup owner address (called an 'Optio') for recovery purposes. This provides a secure way to regain access to your funds if you lose access to your primary wallet.",
		},
		{
			question: "Is my wordphrase stored on-chain?",
			answer: "No, your wordphrase is never stored on-chain and we do not have access to it. Only the public key derived from your wordphrase is stored in your Centurion account for verification during transactions. Your wordphrase should be kept secure but is designed to be memorable, unlike the traditional 12 or 24 word mnemonic phrases.",
		},
		{
			question: "What tokens can I store in my Testudo wallet?",
			answer: "The onchain program is controlled by the admin ('Legate') account. This account whitelists tokens that can be stored in Testudo wallets. All whitlisted tokens (as well as native SOL) can be stored in Testudo wallets. We regualarly review and add tokens to the whitelist.",
		},
        {
            question: "Is Testudo free to use?",
            answer: "No, Testudo is not free to use. But, our fee is minimal at only 0.15% of the total withdrawal amount. For example, if you withdraw 100 SOL, the fee will be only 0.15 SOL.",
        },
        {
            question: "Do we have access to your funds?",
            answer: "No, we must certainly do not! We believe in self-custody and the power of decentralization. We are not a custodial service and we do not have access to your funds. Your Centurion account (through which you deposit and withdraw) is only accessible by your wallet and your passphrase.",
        },
        {
            question: "What happens if I lose my passphrase?",
            answer: "If you lose your passphrase, you will lose access to the funds in your Centurion account, as it is the key to securing your assets. This design ensures high security by requiring it for all access. While Testudo aims to make the passphrase memorable for ease of use, we strongly recommend storing it securely, just as you would with your wallet's seed phrase, to prevent potential loss."
        },
        {
            question: "Is your code open source?",
            answer: "Yes, our code is open source and available on GitHub. https://github.com/WillShirley13/testudo"
        },
	];

	const toggleExpand = (index: number) => {
		setExpandedIndex(expandedIndex === index ? null : index);
	};

	return (
		<div className="min-h-screen pt-28 pb-16 mt-8">
			{/* Hero section */}
			<div className="w-full relative mb-12">
				<div className="content-container px-6 md:px-8">
					<div className="max-w-3xl mx-auto text-center">
						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
							Frequently Asked Questions
						</h1>
						<p className="text-lg text-gray-300 max-w-2xl mx-auto">
							Find answers to common questions about
							Testudo&apos;s secure wallet system and
							dual-signature protection.
						</p>
					</div>
				</div>
			</div>

			{/* FAQ content */}
			<div className="content-container px-4 md:px-6">
				<div className="max-w-3xl mx-auto">
					<div className="space-y-4">
						{faqItems.map((item, index) => (
							<div
								key={index}
								className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/80 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:border-amber-700/30"
							>
								<button
									onClick={() => toggleExpand(index)}
									className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
									aria-expanded={expandedIndex === index}
								>
									<span className="text-lg font-medium text-gray-100">
										{item.question}
									</span>
									<IconChevronDown
										className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${
											expandedIndex === index
												? "transform rotate-180"
												: ""
										}`}
									/>
								</button>
								<AnimatePresence>
									{expandedIndex === index && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{
												height: "auto",
												opacity: 1,
											}}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.3 }}
											className="overflow-hidden"
										>
											<div className="px-6 pb-5 text-gray-300 border-t border-gray-800/50 pt-3">
												{item.answer}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className="content-container px-4 md:px-6 mt-16">
				<div className="max-w-3xl mx-auto text-center">
					<div className="bg-gradient-to-r from-gray-900/80 via-gray-800/50 to-gray-900/80 border border-amber-800/20 rounded-xl p-8 shadow-lg">
						<h2 className="text-2xl font-bold text-amber-400 mb-4">
							Still have questions?
						</h2>
						<p className="text-gray-300 mb-6">
							We&apos;re here to help. Reach out to our support
							team for assistance with any other questions about
							Testudo.
						</p>
						<button className="px-8 py-3 rounded-md bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-amber-700/20">
							Contact Support
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
