"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { charisSIL } from "@/app/fonts";


export function HeroSection() {
	return (
		<section className="relative overflow-hidden pt-24 md:pt-16 mt-16 md:mt-6 pb-24 w-full">
			<div className="content-container relative z-10">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<div className="text-center md:text-left">
						<h1
							className={`${charisSIL.className} text-4xl md:text-5xl lg:text-6xl tracking-wider mb-6 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500`}
							style={{
								letterSpacing: "0.05em",
								textShadow: "0 2px 4px rgba(0,0,0,0.3)",
							}}
						>
							Impenetrable, <br className="hidden md:block" />
							By Design. <br className="hidden md:block" />
						</h1>

						<p className="text-gray-300 text-md md:text-lg mb-8 max-w-xl mx-auto md:mx-0">
							Be at the vanguard of crypto, protected by Testudo&apos;s dual-signature vault system. Find ultimate security with effortless convenience.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
							<Link
								href="/dashboard"
								className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-md hover:from-amber-600 hover:to-amber-700 transition-all duration-300 text-center inline-block"
							>
								Dashboard
							</Link>
							<Link
								href="/about"
								className="w-full sm:w-auto px-8 py-3 border border-amber-500/30 text-amber-400 rounded-md hover:bg-amber-500/10 transition-all duration-300 text-center inline-block"
							>
								Learn More
							</Link>
						</div>
					</div>

					<div className="relative hidden md:block">
					
						<div className="relative z-0 w-full h-[500px]">
							<Image
								src="/battle-scene.png"
								alt="Testudo Shield"
								fill
								className="object-contain transition-transform duration-900 hover:animate-pulse hover:scale-110"
								priority
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
