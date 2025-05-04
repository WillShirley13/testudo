"use client";

import React, { useState, useRef, useEffect } from "react";
import { shouldEnableEnhancedSecurity, sanitizeInput } from "@/app/utils/security-utils";

interface PasswordPhraseInputProps {
	words: string[];
	onChange: (words: string[]) => void;
	maxWords?: 4 | 5 | 6; // Default is 6
	className?: string;
}

/**
 * A reusable component that renders 4-6 word input boxes for password phrases
 */
export function PasswordPhraseInput({
	words,
	onChange,
	maxWords = 6,
	className = "",
}: PasswordPhraseInputProps) {
	// Create refs for word input fields
	const wordInputRefs = useRef<(HTMLInputElement | null)[]>(
		Array(maxWords).fill(null)
	);
	// State to toggle password visibility
	const [showPassword, setShowPassword] = useState(false);
	// State to track enhanced security mode
	const [securityMode, setSecurityMode] = useState(false);

	// Setup security check on component mount and at intervals
	useEffect(() => {
		// Check security on mount
		const checkSecurity = () => {
			const enhancedSecurity = shouldEnableEnhancedSecurity();
			setSecurityMode(enhancedSecurity);
		};

		// Initial check
		checkSecurity();

		// Set interval for periodic checks
		const securityInterval = setInterval(checkSecurity, 2000);
		
		// Clear interval on unmount
		return () => clearInterval(securityInterval);
	}, []);

	// Handle input change for a specific word box
	const handleWordChange = (index: number, value: string) => {
		// Sanitize input to protect against potential XSS
		const sanitizedValue = sanitizeInput(value).toLowerCase();
		
		const newWords = [...words];
		newWords[index] = sanitizedValue; // Don't trim during typing
		onChange(newWords);

		// Auto-focus next input field if the current one is completed (contains a space)
		if (sanitizedValue.includes(" ") && index < maxWords - 1) {
			// If user enters a space, assume they're done with this word
			newWords[index] = sanitizedValue.trim().toLowerCase();
			onChange(newWords);
			wordInputRefs.current[index + 1]?.focus();
		}
	};

	// Handle keyboard navigation between inputs
	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Backspace" && !words[index] && index > 0) {
			// Move to previous input when backspace is pressed in an empty field
			wordInputRefs.current[index - 1]?.focus();
		} else if (e.key === "ArrowLeft" && index > 0) {
			// Move to previous input with left arrow
			wordInputRefs.current[index - 1]?.focus();
		} else if (e.key === "ArrowRight" && index < maxWords - 1) {
			// Move to next input with right arrow
			wordInputRefs.current[index + 1]?.focus();
		} else if (e.key === "Tab" && !e.shiftKey) {
			// When tabbing forward, ensure we're setting proper focus
			e.preventDefault();
			wordInputRefs.current[Math.min(index + 1, maxWords - 1)]?.focus();
		} else if (e.key === "Tab" && e.shiftKey) {
			// When tabbing backward, ensure we're setting proper focus
			e.preventDefault();
			wordInputRefs.current[Math.max(index - 1, 0)]?.focus();
		}
	};

	// Handle blur event to clean up words when user leaves an input
	const handleBlur = (index: number, value: string) => {
		const sanitizedValue = sanitizeInput(value);
		const newWords = [...words];
		newWords[index] = sanitizedValue.trim().toLowerCase();
		onChange(newWords);
	};

	// Toggle password visibility
	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div className={className}>
			<div className="flex justify-between items-center mb-1">
				<p className="text-xs text-gray-400">
					Enter your 4-{maxWords} word phrase. Only fill what applies to
					you.
				</p>
				<button
					type="button"
					onClick={togglePasswordVisibility}
					className="text-xs text-amber-400 hover:text-amber-300 focus:outline-none"
				>
					{showPassword ? "Hide Password" : "Show Password"}
				</button>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
				{Array.from({ length: maxWords }).map((_, index) => (
					<input
						key={index}
						ref={(el) => {
							wordInputRefs.current[index] = el;
						}}
						type={showPassword ? "text" : "password"}
						className={`p-1.5 bg-gray-800/60 rounded border border-gray-700 text-white focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none text-sm ${
							securityMode ? "border-amber-500" : ""
						}`}
						value={words[index] || ""}
						onChange={(e) =>
							handleWordChange(index, e.target.value)
						}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onBlur={(e) => handleBlur(index, e.target.value)}
						placeholder={`Word ${index + 1}`}
						autoComplete="off"
						data-lpignore="true" // Prevent LastPass from detecting as password field
						data-form-type="other" // Help prevent password managers from auto-filling
					/>
				))}
			</div>
			{securityMode && (
				<p className="text-xs text-amber-500 mt-1">
					Enhanced security mode active
				</p>
			)}
		</div>
	);
}

// Helper function to validate a word array (returns true if valid)
export function validatePasswordWords(words: string[]): boolean {
	const filteredWords = words.filter((word) => word.trim() !== "");
	return filteredWords.length >= 4 && filteredWords.length <= 6;
}

// Helper function to prepare words for the deriveKeypairFromWords function
export function preparePasswordWords(words: string[]): string[] {
	return words
		.map((word) => sanitizeInput(word).trim().toLowerCase())
		.filter((word) => word !== "");
}
