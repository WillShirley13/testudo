"use client";

import React, { useState } from "react";
import { charisSIL } from "@/app/fonts";
import { TestudoData } from "@/app/types/testudo";
import { SecureKeypairGenerator } from "@/app/utils/keypair-functions";
import { findCenturionPDA } from "@/app/utils/testudo-utils";
import {
    PasswordPhraseInput,
    validatePasswordWords,
    preparePasswordWords,
    validateNumberPin,
} from "@/app/components/common/PasswordPhraseInput";
import { useTestudoProgram } from "@/app/components/solana/solana-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

// Hook for using the delete modal
export function useDeleteModal() {
    const [deletingTestudo, setDeletingTestudo] = useState<TestudoData | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [tokenSymbol, setTokenSymbol] = useState("");
    
    // Show the delete modal when a user chooses to delete
    const handleShowDeleteModal = (testudo: TestudoData, symbol: string) => {
        if (testudo) {
            setDeletingTestudo(testudo);
            setTokenSymbol(symbol);
            setShowDeleteModal(true);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingTestudo(null);
    };

    return {
        deletingTestudo,
        showDeleteModal,
        isDeleting,
        setIsDeleting,
        tokenSymbol,
        handleShowDeleteModal,
        closeDeleteModal
    };
}

interface DeleteTestudoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedCenturionData: any) => void;
    isDeleting: boolean;
    setIsDeleting: (isDeleting: boolean) => void;
    testudo: TestudoData;
    tokenSymbol: string;
}

export function DeleteTestudoModal({
    isOpen,
    onClose,
    onSuccess,
    isDeleting,
    setIsDeleting,
    testudo,
    tokenSymbol,
}: DeleteTestudoModalProps) {
    const wallet = useWallet();
    const { publicKey } = wallet;
    const testudoProgram = useTestudoProgram();
    const [passwordWords, setPasswordWords] = useState<string[]>(Array(6).fill(""));
    const [numberPin, setNumberPin] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Function to handle Testudo deletion
    const handleDelete = async (passwordKeypair: Keypair) => {
        if (!publicKey) return;

        try {
            setIsDeleting(true);
            
            const tokenMint = new PublicKey(testudo.tokenMint);
            const tokenMintInfo = await testudoProgram.provider.connection.getAccountInfo(tokenMint);
            const tokenProgram = tokenMintInfo?.owner as PublicKey;
            const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);

            
            
            // Call deleteTestudo instruction with required accounts
            const tx = await testudoProgram.methods
                .deleteTestudo()
                .accountsPartial({
                    authority: publicKey,
                    validSignerOfPassword: passwordKeypair.publicKey,
                    mint: tokenMint,
                    tokenProgram: tokenProgram,
                })
                .signers([passwordKeypair])
                .rpc();
            
            await testudoProgram.provider.connection.confirmTransaction(tx);
            
            // Refresh Centurion data
            const updatedCenturionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
            
            // Call onSuccess with the updated data
            onSuccess(updatedCenturionAccount);
            
            toast.success(`Successfully deleted ${tokenSymbol} Testudo account`);
            
            // Clear form and close modal
            setPasswordWords(Array(6).fill(""));
            setNumberPin("");
            onClose();
        } catch (error) {
            console.error("Delete error:", error);
            
            // Check for InvalidPasswordSignature error from the on-chain program
            const errorMessage = String(error);
            if (errorMessage.includes("InvalidPasswordSignature")) {
                setError("Invalid password phrase. Please check your words and try again.");
                toast.error("Invalid password phrase. Please check your words and try again.");
            } else {
                toast.error(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
                setError(`Failed to delete Testudo: ${error instanceof Error ? error.message : String(error)}`);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Validate password words
        if (!validatePasswordWords(passwordWords)) {
            setError("Please enter at least 5 words for your password phrase");
            return;
        }
        
        try {
            // Prepare password words (trim, lowercase)
            const preparedWords = preparePasswordWords(passwordWords);
            
            // Validate and derive keypair from mnemonic
            const secureKeypairGenerator = new SecureKeypairGenerator();
            
            try {
                const { keypair } = await secureKeypairGenerator.deriveKeypairFromWords(preparedWords, publicKey?.toString() || "", numberPin);
                
                // Fetch centurion to verify password against stored pubkey
                if (publicKey) {
                    const [centurionPDA] = findCenturionPDA(publicKey, testudoProgram.programId);
                    const centurionAccount = await testudoProgram.account.centurion.fetch(centurionPDA);
                    
                    // Check if the generated pubkey matches the one in centurion
                    if (keypair.publicKey.toString() !== centurionAccount.pubkeyToPassword.toString()) {
                        setError("Invalid password phrase. Please check your words and try again.");
                        return;
                    }
                    
                    // Password is valid, proceed with deletion
                    await handleDelete(keypair);
                }
            } catch (error) {
                // Check for InvalidPasswordSignature error from the on-chain program
                const errorMessage = String(error);
                if (errorMessage.includes("InvalidPasswordSignature")) {
                    setError("Invalid password phrase. Please check your words and try again.");
                } else if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Failed to process deletion. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error processing password:", error);
            setError("Error processing password. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-red-500/30 w-full max-w-md">
                <div className="p-6">
                    <h3
                        className={`${charisSIL.className} text-xl font-semibold text-red-400 mb-4`}
                    >
                        Delete {tokenSymbol} Testudo
                    </h3>

                    <p className="text-gray-300 mb-4">
                        This will delete your {tokenSymbol} Testudo account and return any remaining funds to your wallet. 
                        This action cannot be undone.
                    </p>

                    <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Enter your password phrase
                            </label>
                            <PasswordPhraseInput
                                words={passwordWords}
                                onChange={setPasswordWords}
                                numberPin={numberPin}
                                onNumberPinChange={setNumberPin}
                                maxWords={6}
                            />
                            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
                        </div>

                        <div className="flex space-x-4 pt-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isDeleting || !validatePasswordWords(passwordWords)}
                                className={`flex-1 py-3 px-4 rounded-md text-black font-medium transition-colors duration-200 ${
                                    !isDeleting && validatePasswordWords(passwordWords)
                                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                        : "bg-gray-600 cursor-not-allowed"
                                }`}
                            >
                                {isDeleting ? "Deleting..." : "Delete Testudo"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
