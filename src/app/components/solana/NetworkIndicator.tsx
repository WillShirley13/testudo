"use client";

import { useCluster } from "../cluster/cluster-data-access";

export function NetworkIndicator() {
	const { cluster, setCluster, clusters } = useCluster();

	// Define color based on network
	let color = "bg-gray-500";
	if (cluster.name === "devnet") {
		color = "bg-purple-500";
	} else if (cluster.name === "local") {
		color = "bg-green-500";
	} else if (cluster.name === "testnet") {
		color = "bg-blue-500";
	} else if (cluster.name === "mainnet-beta") {
		color = "bg-red-500";
	}

	return (
		<div className="dropdown dropdown-end">
			<div
				tabIndex={0}
				role="button"
				className="flex items-center gap-2 px-3 py-1 rounded-md bg-opacity-20 cursor-pointer hover:bg-opacity-30 transition-all bg-base-300"
			>
				<div className={`w-2 h-2 rounded-full ${color}`}></div>
				<span className="text-xs font-medium capitalize">
					{cluster.name}
				</span>
			</div>
			<ul
				tabIndex={0}
				className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52"
			>
				{clusters
					.filter((item) => item.name !== cluster.name)
					.map((item) => (
						<li key={item.name}>
							<button
								onClick={() => setCluster(item)}
								className={
									cluster.name === item.name ? "active" : ""
								}
							>
								<div className="flex items-center gap-2">
									<div
										className={`w-2 h-2 rounded-full ${
											item.name === "devnet"
												? "bg-purple-500"
												: item.name === "local"
												? "bg-green-500"
												: item.name === "testnet"
												? "bg-blue-500"
												: item.name === "mainnet-beta"
												? "bg-red-500"
												: "bg-gray-500"
										}`}
									></div>
									<span className="capitalize">
										{item.name}
									</span>
								</div>
							</button>
						</li>
					))}
			</ul>
		</div>
	);
}
