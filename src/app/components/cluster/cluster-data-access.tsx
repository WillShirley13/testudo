"use client";

import { clusterApiUrl, Connection } from "@solana/web3.js";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { createContext, ReactNode, useContext } from "react";
import toast from "react-hot-toast";

export interface Cluster {
	name: string;
	endpoint: string;
	network?: ClusterNetwork;
	active?: boolean;
}

export enum ClusterNetwork {
	Mainnet = "mainnet-beta",
	Testnet = "testnet",
	Devnet = "devnet",
	Custom = "custom",
}

// Define a single devnet cluster that will always be used
const devnetCluster: Cluster = {
	name: "devnet",
	endpoint: clusterApiUrl("devnet"),
	network: ClusterNetwork.Devnet,
	active: true
};

// Create an atom with just the devnet cluster
const clusterAtom = atom<Cluster>(devnetCluster);

export interface ClusterProviderContext {
	cluster: Cluster;
	clusters: Cluster[];
	addCluster: (cluster: Cluster) => void;
	deleteCluster: (cluster: Cluster) => void;
	setCluster: (cluster: Cluster) => void;
	getExplorerUrl(path: string): string;
}

const Context = createContext<ClusterProviderContext>(
	{} as ClusterProviderContext
);

export function ClusterProvider({ children }: { children: ReactNode }) {
	const cluster = useAtomValue(clusterAtom);

	const value: ClusterProviderContext = {
		cluster: devnetCluster,
		clusters: [devnetCluster],
		// These functions are kept for compatibility but do nothing
		addCluster: () => {},
		deleteCluster: () => {},
		setCluster: () => {},
		getExplorerUrl: (path: string) =>
			`https://explorer.solana.com/${path}?cluster=devnet`,
	};
	return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCluster() {
	return useContext(Context);
}
