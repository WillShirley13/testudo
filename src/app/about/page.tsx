"use client";

import React from "react";
import Image from "next/image";
import { charisSIL } from "@/app/fonts";
import { SectionDivider } from "@/app/components/landing-page";

export default function AboutPage() {
	return (
		<div className="min-h-screen w-full py-16">
			<div className="content-container pt-20">
				<section className="mb-16">
					<h1
						className={`${charisSIL.className} text-3xl md:text-4xl font-bold text-amber-400 mb-14`}
					>
						Our Mission
					</h1>

					<div className="flex flex-col md:flex-row gap-8 mb-12">
						<div className="md:w-1/2">
							<h3 className="text-xl font-bold text-amber-300 mb-3">
								The Challenge
							</h3>
							<p className="text-gray-300 mb-4">
								The cryptocurrency landscape has long been
								plagued by a fundamental dilemma: balancing
								security with convenience. Hardware ledgers
								offer strong security but are cumbersome to use,
								while multisig solutions add complexity that
								creates barriers for everyday users.
							</p>
							<p className="text-gray-300">
								Most wallet solutions force users to choose
								between robust security (with poor user
								experience) or convenience (with compromised
								security). This trade-off has hindered
								mainstream adoption and limited the practical
								utility of digital assets.
							</p>
						</div>
						<div className="md:w-1/2 flex justify-center items-center">
							<Image
								src="/battle-scene.png"
								alt="Roman battle formation"
								width={500}
								height={350}
								className="rounded-lg shadow-lg shadow-amber-900/40"
							/>
						</div>
					</div>

					<div className="flex flex-col md:flex-row-reverse gap-8">
						<div className="md:w-1/2">
							<h3 className="text-xl font-bold text-amber-300 mb-3">
								The Testudo Solution
							</h3>
							<p className="text-gray-300 mb-4">
								Testudo was created to solve this dilemma with
								our innovative dual-signature system. By
								combining your wallet signature with a key
								derived from a memorable 4-6 word phrase,
								we&apos;ve created an on-chain 2FA experience
								that feels natural and intuitive.
							</p>
							<p className="text-gray-300">
								Our approach eliminates the need for physical
								hardware while maintaining security standards
								that rival traditional hardware solutions. Users
								can memorize their passphrase or store it
								securely, with optional recovery mechanisms
								providing additional peace of mind.
							</p>
						</div>
						<div className="md:w-1/2 flex justify-center items-center">
							<Image
								src="/logo3.png"
								alt="Roman military formation advancing"
								width={400}
								height={250}
								className="rounded-lg shadow-lg shadow-amber-900/40"
							/>
						</div>
					</div>
				</section>

				<SectionDivider />

				<section className="mt-16">
					<h2
						className={`${charisSIL.className} text-2xl md:text-3xl font-bold text-amber-400 mb-6`}
					>
						Interested in the ancient Roman references?
					</h2>
					<p className="text-gray-300 mb-8">
						Our platform draws inspiration from the legendary Roman
						military, known for its discipline, strategy, and
						protective formations. Each element of our wallet system
						is named after key components of Roman military
						structure:
					</p>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="bg-[#0a101d] p-6 rounded-lg border border-amber-900/20">
							<h3
								className={`${charisSIL.className} text-xl font-bold text-amber-300 mb-3`}
							>
								Testudo
							</h3>
							<p className="text-gray-300">
								The &ldquo;testudo&rdquo; (Latin for
								&ldquo;tortoise&rdquo;) was a protective
								formation where Roman legionaries created an
								impenetrable shield wall, protecting soldiers
								from all sides and above. Like this formation,
								our Testudo wallet provides comprehensive
								protection for your digital assets, shielding
								them from all angles of attack.
							</p>
						</div>

						<div className="bg-[#0a101d] p-6 rounded-lg border border-amber-900/20">
							<h3
								className={`${charisSIL.className} text-xl font-bold text-amber-300 mb-3`}
							>
								Centurion
							</h3>
							<p className="text-gray-300">
								Centurions were professional officers who
								commanded a century of 80-100 men in the Roman
								army. They were known for their leadership and
								reliability. Similarly, your Centurion account
								serves as the commanding structure for your
								wallet system, orchestrating and managing
								multiple token accounts under a unified command.
							</p>
						</div>

						<div className="bg-[#0a101d] p-6 rounded-lg border border-amber-900/20">
							<h3
								className={`${charisSIL.className} text-xl font-bold text-amber-300 mb-3`}
							>
								Optio
							</h3>
							<p className="text-gray-300">
								The Optio was the second-in-command to the
								Centurion, ready to step in if the Centurion
								fell in battle. In our system, the Optio
								represents your backup recovery option, ready to
								restore access to your assets if your primary
								access is compromised or lost.
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
