"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baskervville } from "next/font/google";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";
import "../styles/wallet.css";

const CustomWalletButton = dynamic(
	() => import("./CustomWalletButton"),
	{ ssr: false }
);

const NetworkIndicatorDynamic = dynamic(
	() => import("./solana/NetworkIndicator").then(mod => mod.NetworkIndicator),
	{ ssr: false }
);

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

export function Header() {
	const pathname = usePathname();
	const [scrolled, setScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

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
			className={`fixed w-full z-30 transition-all duration-300 shadow-lg ${
				scrolled
					? "py-2 bg-gray-900/95 backdrop-blur-md"
					: "py-4 bg-gradient-to-b from-gray-900 via-[#1a2133] to-[#171e2e]"
			}`}
		>
			{/* Top gold accent line - full width */}
			<div className="absolute top-0 left-0 right-0 w-full h-0.5 bg-gradient-to-r from-amber-700/80 via-amber-500 to-amber-700/80" />
			
			{/* Bottom gold accent line - full width */}
			<div className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-gradient-to-r from-amber-700/5 via-amber-500/20 to-amber-700/5" />

			<div className="max-w-[90%] mx-auto px-4 flex items-center justify-between min-h-[74px] relative">
				{/* Logo and brand */}
				<Link href="/" className="flex items-center group select-none">
					<div className="relative h-10 w-10 md:h-16 md:w-16 flex-shrink-0 overflow-hidden">
						<Image
							src="/logo2.png"
							alt="Testudo Logo"
							fill
							className="object-contain transition-transform duration-300 group-hover:scale-110"
							sizes="(max-width: 868px) 40px, 48px"
							priority
						/>
					</div>
					<div className="h-10 md:h-16 ml-3 flex flex-col justify-center">
						<span
							className={`${baskervville.className} text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 group-hover:from-amber-300 group-hover:via-yellow-200 group-hover:to-amber-400 transition-all duration-300 relative`}
							style={{ 
								letterSpacing: '0.125em',
								textShadow: '0 2px 4px rgba(0,0,0,0.3)'
							}}
						>
							TESTUDO
						</span>
						<span className="text-[11px] text-amber-500/60 tracking-widest uppercase mt-0.5 hidden sm:block self-center">
							- Secure Wallet System -
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

					{/* Network Indicator */}
					<div className="mr-4">
						<NetworkIndicatorDynamic />
					</div>

					{/* Custom Connect Wallet Button - Desktop */}
					<CustomWalletButton />
				</nav>

				{/* Mobile menu button */}
				<button
					onClick={toggleMobileMenu}
					className="lg:hidden text-amber-400 p-2 relative z-40 focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded-md"
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
					className={`fixed inset-0 bg-gray-900/98 backdrop-blur-md z-20 lg:hidden transform transition-transform duration-300 ${
						mobileMenuOpen ? "translate-x-0" : "translate-x-full"
					}`}
				>
					<div className="h-full flex flex-col pt-24 px-6">
						<ul className="flex flex-col space-y-5 border-l border-amber-700/30 pl-6">
							{navLinks.map((link) => (
								<li key={link.path} className="overflow-hidden">
									<Link
										href={link.path}
										className={`block text-lg font-medium tracking-wide transition-all duration-200 relative ${
											isActive(link.path)
												? "text-amber-300 pl-2"
												: "text-gray-300 hover:text-amber-300 hover:pl-2"
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
							{/* Network Indicator - Mobile */}
							<div className="mb-4">
								<NetworkIndicatorDynamic />
							</div>
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
