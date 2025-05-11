"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { charisSIL } from "@/app/fonts";

// Import wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";
import "../styles/wallet.css";

const CustomWalletButton = dynamic(
	() => import("./CustomWalletButton"),
	{ ssr: false }
);

export function Header() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const isActive = (path: string) => pathname === path;

	const navLinks = [
		{ path: "/dashboard", label: "Dashboard" },
		{ path: "/about", label: "About Us" },
		{ path: "/faq", label: "FAQ" },
	];

	const toggleMobileMenu = () => {
		console.log("Mobile menu toggle clicked, current state:", mobileMenuOpen);
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<header
			className="fixed w-full z-30 transition-all duration-300 shadow-lg py-2 md:py-4 bg-gradient-to-b from-gray-900 via-[#1a2133] to-[#171e2e]"
		>
			{/* Top gold accent line - full width */}
			<div className="absolute top-0 left-0 right-0 w-full h-0.5 bg-gradient-to-r from-amber-700/80 via-amber-500 to-amber-700/80" />
			
			{/* Bottom gold accent line - full width */}
			<div className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-gradient-to-r from-amber-700/5 via-amber-500/20 to-amber-700/5" />

			<div className="max-w-[90%] mx-auto px-4 flex items-center justify-between min-h-[60px] md:min-h-[74px] relative">
				{/* Logo and brand */}
				<Link href="/" className="flex items-center group select-none">
					<div className="relative h-8 w-8 md:h-10 lg:h-16 md:w-10 lg:w-16 flex-shrink-0 overflow-hidden">
						<Image
							src="/logo-big.png"
							alt="Testudo Logo"
							fill
							className="object-contain transition-transform duration-300 group-hover:scale-110"
							sizes="(max-width: 868px) 40px, 48px"
							priority
						/>
					</div>
					<div className="h-8 md:h-10 lg:h-16 ml-2 md:ml-3 flex flex-col justify-center">
						<span
							className={`${charisSIL.className} text-xl md:text-2xl lg:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 group-hover:from-amber-300 group-hover:via-yellow-200 group-hover:to-amber-400 transition-all duration-300 relative`}
							style={{ 
								letterSpacing: '0.125em',
								textShadow: '0 2px 4px rgba(0,0,0,0.3)'
							}}
						>
							TESTUDO
						</span>
						<span className="text-[11px] text-amber-500/60 tracking-widest uppercase mt-0.5 hidden sm:block self-center">
							- Secure Vault System -
						</span>
					</div>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden lg:flex items-center justify-center ml-8">
					<div className="flex mr-4">
						{navLinks.map((link, idx) => (
							<Link
								key={link.path}
								href={link.path}
								className={`
									mx-1 px-6 py-2 text-sm font-medium 
									transition-all duration-200 relative group
									${
										isActive(link.path)
											? "text-amber-300"
											: "text-gray-300 hover:text-amber-300"
									}
								`}
							>
								<span className="relative z-10">{link.label}</span>
								
								{/* Active/hover indicator */}
								{isActive(link.path) ? (
									<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
								) : (
									<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-amber-500/40 group-hover:w-5 transition-all duration-300 ease-out"></span>
								)}
								
								<span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></span>
							</Link>
						))}
					</div>

					{/* Custom Connect Wallet Button - Desktop */}
					<CustomWalletButton />
				</nav>

				{/* Mobile menu button */}
				<button
					onClick={toggleMobileMenu}
					className="lg:hidden text-amber-400 p-2 relative z-60 focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded-md"
					aria-label="Toggle menu"
					aria-expanded={mobileMenuOpen}
					aria-controls="mobile-menu"
				>
					<div className="w-6 h-6 flex items-center justify-center relative">
						<span
							className={`absolute h-0.5 w-5 bg-current transform transition duration-300 ${
								mobileMenuOpen
									? "rotate-45"
									: "-translate-y-1.5"
							}`}
						></span>
						<span
							className={`absolute h-0.5 bg-current transition-opacity duration-300 ${
								mobileMenuOpen
									? "w-0 opacity-0"
									: "w-4 opacity-100"
							}`}
						></span>
						<span
							className={`absolute h-0.5 w-5 bg-current transform transition duration-300 ${
								mobileMenuOpen
									? "-rotate-45"
									: "translate-y-1.5"
							}`}
						></span>
					</div>
				</button>

				{/* Mobile Navigation */}
				<div
					id="mobile-menu"
					className={`fixed inset-0 bg-gray-900/98 backdrop-blur-md z-50 lg:hidden transform transition-transform duration-300 ${
						mobileMenuOpen ? "translate-x-0" : "translate-x-full"
					}`}
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						width: '100%',
						height: '100%',
						overscrollBehavior: 'contain'
					}}
				>
					<div className="h-full flex flex-col pt-24 px-6 relative">
						{/* Close button */}
						<button 
							onClick={() => setMobileMenuOpen(false)}
							className="absolute top-6 right-6 text-amber-400 hover:text-amber-300 transition-colors"
							aria-label="Close menu"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						
						<ul className="flex flex-col space-y-5 border-l border-amber-700/30 pl-6">
							{navLinks.map((link) => (
								<li key={link.path} className="overflow-hidden">
									<Link
										href={link.path}
										className={`block text-lg font-medium tracking-wide transition-all duration-200 relative ${
											isActive(link.path)
												? "text-amber-300 pl-4"
												: "text-gray-300 hover:text-amber-300 hover:pl-4"
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										{isActive(link.path) && (
											<span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-amber-500/60 rounded-r"></span>
										)}
										{link.label}
									</Link>
								</li>
							))}
						</ul>
						<div className="mt-10 pt-6 border-t border-gray-800/50">
							{/* Custom Connect Wallet Button - Mobile */}
							<div onClick={(e) => e.stopPropagation()}>
								<CustomWalletButton />
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
