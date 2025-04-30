"use client";

import React, { useState } from "react";
import { Baskervville } from "next/font/google";
import { TestudoData } from "@/app/types/testudo";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { formatBalance } from "@/app/utils/testudo-utils";

const baskervville = Baskervville({
  weight: ["400"],
  subsets: ["latin"],
});

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (testudo: TestudoData, amount: number, passwordKeypair: any) => Promise<void>;
  isWithdrawing: boolean;
  testudo: TestudoData;
  tokenDecimals: number;
  tokenSymbol: string;
}

export function WithdrawModal({
  isOpen,
  onClose,
  onWithdraw,
  isWithdrawing,
  testudo,
  tokenDecimals,
  tokenSymbol,
}: WithdrawModalProps) {
  const [mnemonicPhrase, setMnemonicPhrase] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate amount
      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const maxAmount = Number(testudo.testudoTokenCount) / Math.pow(10, tokenDecimals);
      if (withdrawAmount > maxAmount) {
        setError(`Amount exceeds balance of ${maxAmount} ${tokenSymbol}`);
        return;
      }

      // Validate and derive keypair from mnemonic
      const secureKeypairGenerator = new SecureKeypairGenerator();
      const words = mnemonicPhrase.trim().toLowerCase().split(/\s+/);
      
      try {
        const { keypair } = secureKeypairGenerator.deriveKeypairFromWords(words);
        await onWithdraw(testudo, withdrawAmount, keypair);
        
        // Clear form on success
        setMnemonicPhrase("");
        setAmount("");
        onClose();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to process withdrawal. Please try again.");
        }
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      setError("Failed to process withdrawal. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-amber-500/30 w-full max-w-md">
        <div className="p-6">
          <h3 className={`${baskervville.className} text-xl font-semibold text-amber-400 mb-4`}>
            Withdraw {tokenSymbol}
          </h3>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder={`Enter amount in ${tokenSymbol}`}
                  className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {tokenSymbol}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available balance: {formatBalance(testudo.testudoTokenCount, tokenDecimals)} {tokenSymbol}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Enter Your 6-Word Phrase
              </label>
              <input
                type="text"
                placeholder="Enter your mnemonic phrase"
                className="w-full p-3 bg-gray-800/60 rounded border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring focus:ring-amber-500/20 focus:outline-none"
                value={mnemonicPhrase}
                onChange={(e) => setMnemonicPhrase(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-word phrase you created with your Centurion account
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex space-x-4 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
                disabled={isWithdrawing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || !mnemonicPhrase || isWithdrawing}
                className={`flex-1 py-3 px-4 rounded-md text-black font-medium transition-colors duration-200 ${
                  amount && mnemonicPhrase && !isWithdrawing
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 