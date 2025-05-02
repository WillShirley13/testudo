import React from "react";

type FeatureProps = {
	title: string;
	description: string;
	icon: React.ReactNode;
};

export function Feature({ title, description, icon }: FeatureProps) {
	return (
		<div className="bg-[#111827]/60 p-8 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 group">
			<div className="w-14 h-14 mb-6 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all duration-300">
				{icon}
			</div>
			<h3 className="text-xl font-semibold text-amber-300 mb-3">
				{title}
			</h3>
			<p className="text-gray-400">{description}</p>
		</div>
	);
}
