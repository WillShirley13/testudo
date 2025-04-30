"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";

const CustomWalletButton = () => {
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const {
		wallets,
		select,
		connect,
		disconnect,
		connecting,
		disconnecting,
		connected,
		wallet,
	} = useWallet();

	useEffect(() => {
		setMounted(true);
	}, []);

	// Return null during SSR and initial render
	if (!mounted) {
		return null;
	}

	let buttonText;
	let buttonClass = "wallet-custom-button";

	if (connected) {
		buttonText = "Disconnect";
		buttonClass += " connected";
	} else if (connecting) {
		buttonText = "Connecting...";
		buttonClass += " connecting";
	} else if (disconnecting) {
		buttonText = "Disconnecting...";
		buttonClass += " disconnecting";
	} else if (wallet) {
		buttonText = "Connect";
		buttonClass += " has-wallet";
	} else {
		buttonText = "Select Wallet";
		buttonClass += " no-wallet";
	}

	const handleButtonClick = (e: React.MouseEvent) => {
		// Stop event propagation to prevent closing the mobile menu when clicking the wallet button
		e.stopPropagation();
		
		if (connected) {
			disconnect();
		} else if (connecting || disconnecting) {
			// Do nothing while processing
		} else if (wallet) {
			connect().catch(() => {});
		} else {
			setWalletModalOpen(true);
		}
	};

	const handleCloseModal = () => {
		setWalletModalOpen(false);
	};

	const handleSelectWallet = (walletName: WalletName, e: React.MouseEvent) => {
		e.stopPropagation();
		select(walletName);
		setWalletModalOpen(false);
		connect().catch(() => {});
	};

	return (
		<div className="custom-wallet-container">
			<button
				className={buttonClass}
				disabled={connecting || disconnecting}
				onClick={handleButtonClick}
			>
				{buttonText}
			</button>
			
			{walletModalOpen && (
				<div className="wallet-modal-overlay" onClick={handleCloseModal}>
					<div
						className="wallet-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="wallet-modal-header">
							<h3>Select Wallet</h3>
							<button
								className="wallet-modal-close"
								onClick={handleCloseModal}
							>
								×
							</button>
						</div>
						<div className="wallet-modal-content">
							{wallets.map((wallet) => (
								<button
									key={wallet.adapter.name}
									className="wallet-option"
									onClick={(e) => handleSelectWallet(wallet.adapter.name, e)}
								>
									{wallet.adapter.icon && (
										<Image
											src={wallet.adapter.icon}
											alt={`${wallet.adapter.name} icon`}
											className="wallet-icon"
											width={24}
											height={24}
										/>
									)}
									<span>{wallet.adapter.name}</span>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CustomWalletButton;
