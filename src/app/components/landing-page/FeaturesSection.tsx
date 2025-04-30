"use client";

import React from "react";
import { Baskervville } from "next/font/google";
import { Feature } from "./Feature";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

export function FeaturesSection() {
	const features = [
		{
			title: "Dual-Signature Security",
			description: "All withdrawals require two signatures: your wallet and a special key derived from your memorable 6-word phrase.",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-8 h-8 text-amber-400"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			)
		},
		{
			title: "Memorable Security",
			description: "No need for hardware keys - just remember your 6-word phrase for a perfect balance of security and usability.",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-8 h-8 text-amber-400"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
					/>
				</svg>
			)
		},
		{
			title: "Optional Recovery",
			description: "Configure a backup owner address (Optio) for account recovery, if your primary wallet is compromised.",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-8 h-8 text-amber-400"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
					/>
				</svg>
			)
		},
	];

	return (
		<section className="py-20 w-full bg-[#0a101d]">
			<div className="content-container">
				<div className="text-center mb-16">
					<h2
						className={`${baskervville.className} text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 mb-4`}
					>
						The Shield for Your Digital Assets
					</h2>
					<p className="text-gray-400 max-w-3xl mx-auto">
						Testudo implements a revolutionary dual-signature
						system, providing you with enhanced security 
                        without sacrificing ease of access.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<Feature
							key={index}
							title={feature.title}
							description={feature.description}
							icon={feature.icon}
						/>
					))}
				</div>
			</div>
		</section>
	);
} 