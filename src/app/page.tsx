"use client";

import React from "react";
import {
	HeroSection,
	FeaturesSection,
	HowItWorksSection,
	CTASection,
	SectionDivider,
} from "@/app/components/landing-page";

export default function HomePage() {
	return (
		<div className="landing-page-wrapper min-h-screen w-full">
			<HeroSection />

			<SectionDivider />

			<FeaturesSection />

			<SectionDivider />

			<HowItWorksSection />

			<SectionDivider />

			<CTASection />
		</div>
	);
}
