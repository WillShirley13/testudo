"use client";

import React, { useState, useEffect } from "react";
import { Baskervville } from "next/font/google";
import { useInView } from "react-intersection-observer";
import { Step } from "./Step";

const baskervville = Baskervville({
	weight: ["400"],
	subsets: ["latin"],
});

export function HowItWorksSection() {
	// State to track active step in How It Works section
	const [activeStep, setActiveStep] = useState(0);
	
	// Setup intersection observers for each step with viewport-centered detection
	const { ref: step1Ref, inView: step1InView } = useInView({
		threshold: 0.5,
		rootMargin: "-30% 0px -30% 0px",
		triggerOnce: false,
	});
	
	const { ref: step2Ref, inView: step2InView } = useInView({
		threshold: 0.5,
		rootMargin: "-30% 0px -30% 0px",
		triggerOnce: false,
	});
	
	const { ref: step3Ref, inView: step3InView } = useInView({
		threshold: 0.5,
		rootMargin: "-30% 0px -30% 0px",
		triggerOnce: false,
	});
	
	const { ref: step4Ref, inView: step4InView } = useInView({
		threshold: 0.5,
		rootMargin: "-30% 0px -30% 0px",
		triggerOnce: false,
	});
	
	// Update active step based on which one is in view
	useEffect(() => {
		if (step1InView) setActiveStep(0);
		else if (step2InView) setActiveStep(1);
		else if (step3InView) setActiveStep(2);
		else if (step4InView) setActiveStep(3);
	}, [step1InView, step2InView, step3InView, step4InView]);
	
	// Animation variants
	const stepVariants = {
		inactive: { 
			opacity: 0.5,
			scale: 0.95,
			y: 10,
			transition: { duration: 0.3 }
		},
		active: { 
			opacity: 1,
			scale: 1,
			y: 0,
			transition: { duration: 0.5 }
		},
	};
	
	// Step data
	const steps = [
		{
			number: 1,
			title: "Create Your Centurion",
			description: "Connect your wallet and set up your main Centurion account with a memorable 6-word phrase.",
			ref: step1Ref,
			tipText: "Memorize your 6-word phrase, it's your key to security."
		},
		{
			number: 2,
			title: "Deposit Funds",
			description: "Transfer SPL tokens to your Testudo wallets and they'll be securely stored in Program Derived Addresses.",
			ref: step2Ref,
			tipText: "Your tokens remain safely stored in your own PDAs."
		},
		{
			number: 3,
			title: "Dual-Sign Withdrawals",
			description: "When withdrawing, sign with both your wallet and enter your 6-word phrase to authorize the transaction.",
			ref: step3Ref,
			tipText: "Two-factor authentication built directly into the blockchain."
		},
		{
			number: 4,
			title: "Optional Recovery",
			description: "Set up an Optio backup address for emergency recovery if you ever lose access to your primary wallet.",
			ref: step4Ref,
			tipText: "Never lose access to your funds with our recovery system."
		},
	];

	return (
		<section className="py-20 w-full bg-gradient-to-b from-[#0c1221] to-[#111827]">
			<div className="content-container">
				<div className="text-center mb-16">
					<h2
						className={`${baskervville.className} text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 mb-4`}
					>
						How Testudo Works
					</h2>
					<p className="text-gray-400 max-w-3xl mx-auto">
						Our secure wallet system combines simplicity with
						military-grade security. Scroll through each step to learn more.
					</p>
				</div>
				
				{/* Navigation dots */}
				<div className="flex justify-center space-x-4 mb-6 relative">
					{steps.map((step, index) => (
						<button
							key={index}
							onClick={() => {
								const element = document.getElementById(`step-${index + 1}`);
								if (element) {
									element.scrollIntoView({ behavior: 'smooth', block: 'center' });
								}
							}}
							className={`w-3 h-3 rounded-full transition-all duration-300 ${
								activeStep === index 
									? 'bg-amber-400 transform scale-125' 
									: 'bg-amber-500/30 hover:bg-amber-500/50'
							}`}
							aria-label={`Go to step ${index + 1}`}
						/>
					))}
				</div>
				
				{/* Steps container */}
				<div className="mb-16 mt-8">
					<div className="h-[400px] md:h-[450px] mx-auto max-w-4xl">
						<div className="snap-y snap-mandatory overflow-y-auto h-full scrollbar-hide rounded-xl border border-amber-500/10 bg-[#111827]/60 backdrop-blur-sm">
							{steps.map((step, index) => (
								<Step 
									key={index}
									number={step.number}
									title={step.title}
									description={step.description}
									isActive={activeStep === index}
									tipText={step.tipText}
									stepRef={step.ref}
									variants={stepVariants}
								/>
							))}
						</div>
					</div>
				</div>
				
				{/* Mobile scroll indicator */}
				<div className="mt-8 text-center text-amber-500/70 md:hidden">
					<p>Scroll for more steps</p>
					<svg 
						xmlns="http://www.w3.org/2000/svg" 
						className="h-6 w-6 mx-auto animate-bounce mt-2" 
						fill="none" 
						viewBox="0 0 24 24" 
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
					</svg>
				</div>
			</div>
		</section>
	);
} 