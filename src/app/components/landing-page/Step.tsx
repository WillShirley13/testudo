import React from "react";
import { motion } from "framer-motion";

type StepProps = {
	number: number;
	title: string;
	description: string;
	isActive: boolean;
	tipText: string;
	stepRef: any;
	variants: any;
};

export function Step({
	number,
	title,
	description,
	isActive,
	tipText,
	stepRef,
	variants,
}: StepProps) {
	return (
		<div
			id={`step-${number}`}
			ref={stepRef}
			className="snap-start w-full h-full flex items-center justify-center p-6 md:p-10"
		>
			<motion.div
				variants={variants}
				animate={isActive ? "active" : "inactive"}
				className="w-full max-w-2xl"
			>
				<div className="flex items-center mb-6">
					<h3 className="text-2xl font-semibold text-amber-300">
						{title}
					</h3>
				</div>
				<p className="text-gray-300 mb-6 text-lg pl-4 border-l-2 border-amber-500/30">
					{description}
				</p>
				
				<div className="ml-6 mt-6 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 shadow-sm shadow-amber-500/10 transition-all duration-300 hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/20">
					<div className="flex items-start">
						<div className="flex-shrink-0 m-2">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 px-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
						</div>
						<p className="text-amber-200 italic leading-relaxed self-center">{tipText}</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
