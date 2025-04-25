"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Baskervville } from "next/font/google";
import CustomWalletButton from "../CustomWalletButton";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

export function HeroSection() {
	return (
		<section className="relative overflow-hidden pt-16 pb-24 w-full">

			<div className="content-container relative z-10">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<div className="text-center md:text-left">
						<h1
							className={`${baskervville.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500`}
							style={{
								letterSpacing: "0.05em",
								textShadow: "0 2px 4px rgba(0,0,0,0.3)",
							}}
						>
							Secure Your <br className="hidden md:block" />
							Solana Assets <br className="hidden md:block" />
							with TESTUDO
						</h1>

						<p className="text-gray-300 text-lg md:text-xl mb-8 max-w-xl mx-auto md:mx-0">
							A dual-signature wallet system with built-in
							two-factor authentication for maximum security
							on the Solana blockchain.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
							<div className="w-full sm:w-auto">
								<CustomWalletButton />
							</div>
							<Link
								href="/about"
								className="w-full sm:w-auto px-8 py-3 border border-amber-500/30 text-amber-400 rounded-md hover:bg-amber-500/10 transition-all duration-300 text-center"
							>
								Learn More
							</Link>
						</div>
					</div>

					<div className="relative hidden md:block">
						<div className="absolute inset-0 z-10 rounded-xl"></div>
						<div className="relative z-0 w-full h-[500px]">
							<Image
								src="/battle-scene1.png"
								alt="Testudo Shield"
								fill
								className="object-contain"
								priority
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
} 