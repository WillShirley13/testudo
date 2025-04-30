"use client";

import dynamic from "next/dynamic";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletError } from "@solana/wallet-adapter-base";
import {
	AnchorWallet,
	useConnection,
	useWallet,
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ReactNode, useCallback, useMemo } from "react";
import { useCluster } from "../cluster/cluster-data-access";
import { getTestudoProgram } from "../../../../anchor/src/testudo-exports";
require("@solana/wallet-adapter-react-ui/styles.css");

export const WalletButton = dynamic(
	async () =>
		(await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
	{
		ssr: false,
	}
);

export function SolanaProvider({ children }: { children: ReactNode }) {
	const { cluster } = useCluster();
	const endpoint = useMemo(() => cluster.endpoint, [cluster]);
	const onError = useCallback((error: WalletError) => {
		console.error(error);
	}, []);

	// Using empty wallets array with wallet-adapter since we're relying on the Wallet Standard
	// which auto-detects available wallet adapters from the browser
	const wallets = useMemo(() => [], []);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}

export function useAnchorProvider() {
	const { connection } = useConnection();
	const wallet = useWallet();

	// Use useMemo to create a stable provider that doesn't change unnecessarily
	return useMemo(
		() => new AnchorProvider(connection, wallet as AnchorWallet, {
			commitment: "confirmed",
		}),
		[connection, wallet]
	);
}

export function useTestudoProgram() {
	const provider = useAnchorProvider();
	// Memoize the program instance to prevent unnecessary re-renders
	return useMemo(() => getTestudoProgram(provider), [provider]);
}
