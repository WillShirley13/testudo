import "./globals.css";
import { ClusterProvider } from "@/app/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/app/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { charisSIL } from "@/app/fonts";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
	title: "Testudo",
	description: "Bringing the power of the Testudo to the masses.",
	icons: {
		icon: "/logo-small.png",
		shortcut: "/logo-small.png",
		apple: "/logo-small.png",
	},
};

// const links: { label: string; path: string }[] = [
// 	{ label: "Account", path: "/account" },
// 	{ label: "Clusters", path: "/clusters" },
// 	{ label: "Basic Program", path: "/basic" },
// ];

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<Analytics />
			<ClusterProvider>
				<ReactQueryProvider>
					<SolanaProvider>
						<body className={`${charisSIL.className} bg-[#0c1221] text-gray-200 min-h-screen`}>
							<div className="flex flex-col min-h-screen">
								<Header />
								<main className="flex-grow">{children}</main>
								<Footer />
								<Toaster position="top-right" />
							</div>
						</body>
					</SolanaProvider>
				</ReactQueryProvider>
			</ClusterProvider>
		</html>
	);
}
