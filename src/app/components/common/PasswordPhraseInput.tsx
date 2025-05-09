"use client";

import React, { useState, useRef, useEffect } from "react";

interface PasswordPhraseInputProps {
	words: string[];
	onChange: (words: string[]) => void;
	maxWords?: number; // Now accepts any number from 5-12
	className?: string;
}

/**
 * A reusable component that renders 5-12 word input boxes for password phrases
 */
export function PasswordPhraseInput({
	words,
	onChange,
	maxWords = 6,
	className = "",
}: PasswordPhraseInputProps) {
	// Create refs for word input fields (up to 12)
	const wordInputRefs = useRef<(HTMLInputElement | null)[]>(
		Array(maxWords).fill(null)
	);
	// State to toggle password visibility
	const [showPassword, setShowPassword] = useState(false);

	// Handle input change for a specific word box
	const handleWordChange = (index: number, value: string) => {
		const newWords = [...words];
		newWords[index] = value.toLowerCase(); // Don't trim during typing
		onChange(newWords);

		// Auto-focus next input field if the current one is completed (contains a space)
		if (value.includes(" ") && index < maxWords - 1) {
			// If user enters a space, assume they're done with this word
			newWords[index] = value.trim().toLowerCase();
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
		const newWords = [...words];
		newWords[index] = value.trim().toLowerCase();
		onChange(newWords);
	};

	// Toggle password visibility
	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	// Calculate grid columns based on maxWords
	const getGridCols = () => {
		if (maxWords <= 6) return "grid-cols-2 sm:grid-cols-3";
		if (maxWords <= 9) return "grid-cols-2 sm:grid-cols-3";
		return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
	};

	return (
		<div className={className}>
			<div className="flex justify-between items-center mb-1">
				<p className="text-xs text-gray-400">
					Enter your {maxWords <= 12 ? `5-${maxWords}` : "5-12"} word phrase. Only fill what applies to
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
			<div className={`grid ${getGridCols()} gap-1`}>
				{Array.from({ length: maxWords }).map((_, index) => (
					<input
						key={index}
						ref={(el) => {
							wordInputRefs.current[index] = el;
						}}
						type={showPassword ? "text" : "password"}
						className="p-1.5 bg-gray-800/60 rounded border border-gray-700 text-white focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none text-sm"
						value={words[index] || ""}
						onChange={(e) =>
							handleWordChange(index, e.target.value)
						}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onBlur={(e) => handleBlur(index, e.target.value)}
						placeholder={`Word ${index + 1}`}
						autoComplete="off"
					/>
				))}
			</div>
		</div>
	);
}

// Helper function to validate a word array (returns true if valid)
export function validatePasswordWords(words: string[]): boolean {
	const filteredWords = words.filter((word) => word.trim() !== "");
	return filteredWords.length >= 5 && filteredWords.length <= 12;
}

// Helper function to prepare words for the deriveKeypairFromWords function
export function preparePasswordWords(words: string[]): string[] {
	return words
		.map((word) => word.trim().toLowerCase())
		.filter((word) => word !== "");
}
