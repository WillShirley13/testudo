"use client";

import React from "react";
import Link from "next/link";
import { Baskervville } from "next/font/google";
import CustomWalletButton from "../CustomWalletButton";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

export function CTASection() {
	return (
		<section className="py-20 w-full bg-[#0a101d] relative overflow-hidden">
			<div className="absolute inset-0 overflow-hidden z-0">
				<div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl"></div>
				<div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-amber-700/5 blur-3xl"></div>
			</div>
			
			<div className="content-container relative z-10">
				<div className="max-w-4xl mx-auto text-center">
					<h2
						className={`${baskervville.className} text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 mb-6`}
					>
						Ready to Secure Your Solana Assets?
					</h2>
					<p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
						Join thousands of Solana users who trust Testudo to
						protect their digital assets with military-grade
						security.
					</p>
					
					<div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
						<div className="w-full sm:w-auto">
							<CustomWalletButton />
						</div>
						<Link
							href="/faq"
							className="w-full sm:w-auto px-8 py-3 border border-amber-500/30 text-amber-400 rounded-md hover:bg-amber-500/10 transition-all duration-300 text-center"
						>
							View FAQ
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
} 