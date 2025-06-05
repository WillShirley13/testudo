import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionStatus, sendAndConfirmTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { saveKeypair, loadKeypair } from "./keypair_security_functions";
import { SecureKeypairGenerator } from "../../app/utils/keypair-functions";
import testudoIdl from "../../../anchor/target/idl/testudo.json";
import { Program, setProvider, AnchorProvider, Wallet, web3, Provider } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Testudo } from "../../../anchor/target/types/testudo";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import * as readline from 'readline';
import fetch from "cross-fetch";
import { error } from "console";

// To pause program while manuall funding of accounts can occur
async function pauseForInput(message: string): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(`${message}\nPress Enter to continue...`, () => {
            rl.close();
            resolve();
        });
    });
}

async function returnSolToMyWallet(sender: Keypair, receiver: Keypair, provider: Provider, accountMakingTransfer: String): Promise<String> {
    const accountInfo = await provider.connection.getAccountInfo(sender.publicKey);
    if (accountInfo === null) {
        return `${accountMakingTransfer}: Account not found`;
    }
    const accountSize = accountInfo.data.length;
    const requiredRent = await provider.connection.getMinimumBalanceForRentExemption(accountSize);
    const currentBalance = (await provider.connection.getAccountInfo(sender.publicKey))?.lamports ?? 0;
    const transferableBalance = currentBalance - (requiredRent * 2);
    
    console.log(`${accountMakingTransfer} - Current balance: ${currentBalance} lamports`);
    console.log(`${accountMakingTransfer} - Required rent: ${requiredRent} lamports`);
    console.log(`${accountMakingTransfer} - Transferable: ${transferableBalance} lamports`);
    
    if (transferableBalance <= 0) {
        return `${accountMakingTransfer}: No transferable balance (${transferableBalance} lamports)`;
    }

    try {
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: receiver.publicKey,
            lamports: transferableBalance
        });
        
        const transferToMyWalletTx = new Transaction().add(transferInstruction);
        const signature = await sendAndConfirmTransaction(
            provider.connection, 
            transferToMyWalletTx, 
            [sender], 
            { commitment: "finalized" }
        );
        
        const finalBalance = (await provider.connection.getAccountInfo(sender.publicKey))?.lamports ?? 0;
        console.log(`${accountMakingTransfer} - Final balance: ${finalBalance} lamports`);
        
        return `✅ ${accountMakingTransfer}: Transferred ${transferableBalance} lamports`;
    } catch (error) {
        console.error(`${accountMakingTransfer} transfer error:`, error);
        return `❌ ${accountMakingTransfer}: Error - ${error}`;
    }
}
const testPrimaryWallet = Keypair.generate();
console.log(`Test primary wallet keypair: ${testPrimaryWallet.publicKey}`);
const legateKeypair = Keypair.generate();
console.log(`Legate keypair: ${legateKeypair.publicKey}`);
const treasuryKeypair = Keypair.generate();
console.log(`Treasury keypair: ${treasuryKeypair.publicKey}`);
const userKeypair = Keypair.generate();
console.log(`Centurion keypair: ${userKeypair.publicKey}`);
const passwordPhrase = new SecureKeypairGenerator().generateRandomPhrase(5);
let passwordKeypair: Keypair;
let words: string[];

(async () => {
    await pauseForInput("PAUSING DURING MANUAL FUNDING OF ACCOUNTS");

    const result = await new SecureKeypairGenerator()
        .deriveKeypairFromWords(passwordPhrase, userKeypair.publicKey.toString());
    passwordKeypair = result.keypair;
    words = result.words;

    saveKeypair(legateKeypair, "legate", "CupTipMouse417");
    saveKeypair(treasuryKeypair, "treasury", "PadCribToe265");
    saveKeypair(userKeypair, "centurion", "TreeCandyPup946");
    saveKeypair(passwordKeypair, "password", "TvTabPill384");

        // build wallet objects
    const legateWallet = new Wallet(legateKeypair);
    const userWallet = new Wallet(userKeypair)

    // build respective provider objects for sending transactions
    const legateProvider = new AnchorProvider(new Connection("https://mainnet.helius-rpc.com/?api-key=1e5305d4-ceac-480b-bbdb-b0ddc2d1704d"), legateWallet);
    const userProvider = new AnchorProvider(new Connection("https://mainnet.helius-rpc.com/?api-key=1e5305d4-ceac-480b-bbdb-b0ddc2d1704d"), userWallet);

    const legateProgram = new Program(testudoIdl as Testudo, legateProvider);
    const userProgram = new Program(testudoIdl as Testudo, userProvider);

    // INIT LEGATE
    let initLegateTx = await legateProgram.methods.initLegate(treasuryKeypair.publicKey)
        .accounts({
            authority: legateKeypair.publicKey,
        })
        .signers([])
        .rpc();
    console.log(`Init Legate tx: ${initLegateTx}`);

    // INIT CENTURION
    let initCenturionTx = await userProgram.methods.initCenturion(passwordKeypair.publicKey, null)
        .accounts({
            authority: userKeypair.publicKey,
        })
        .signers([])
        .rpc();
    console.log(`Init Centurion tx: ${initCenturionTx}`);

    // DEPOSIT SOL TO CENTURION
    let depositSolTx = await userProgram.methods.depositSol(new BN(1 * LAMPORTS_PER_SOL))
    .accounts({
        authority: userKeypair.publicKey,
    })
    .signers([])
    .rpc();
    console.log(`\nCenturion SOL deposit tx: ${depositSolTx}`);

    // CONFIRM DEPOSIT PROPERLY
    var { blockhash, lastValidBlockHeight } = await userProvider.connection.getLatestBlockhash();
    await userProvider.connection.confirmTransaction({
        signature: depositSolTx,
        blockhash,
        lastValidBlockHeight
    }, "finalized");

    // GET CENTURION PDA
    const [centurionPubkey, _] = PublicKey.findProgramAddressSync(
        [Buffer.from("centurion"), userKeypair.publicKey.toBuffer()],
        legateProgram.programId
    );
    console.log(`Centurion PDA: ${centurionPubkey}`);
    let balance = await userProgram.account.centurion.fetch(centurionPubkey);
    console.log(`Centurion SOL balance: ${(balance.lamportBalance as any) / LAMPORTS_PER_SOL}\n`);

    // GET MINT ADDRESSES
    const usdcAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const wsolAddress = "So11111111111111111111111111111111111111112";

    // // CREATE USDC ATA
    let initUsdcAta = await userProgram.methods.createTestudo()
        .accountsPartial({
            authority: userKeypair.publicKey,
            mint: new PublicKey(usdcAddress),
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([])
        .rpc();
    console.log(`Init USDC ATA tx: ${initUsdcAta}`);

    // make API calls... 
    let quoteResponse = await (await fetch(
        `https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${
            0.1 * web3.LAMPORTS_PER_SOL
        }&slippageBps=50&restrictIntermediateTokens=true&platformFeeBps=50&feeAccount=${
            treasuryKeypair.publicKey
        }&maxAccounts=10&onlyDirectRoutes=true`  // Add these parameters
    )).json();

    // GET INSTRUCTIONS
    const instructionsResponse = await (await fetch(
        "https://quote-api.jup.ag/v6/swap-instructions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quoteResponse: quoteResponse,
                userPublicKey: centurionPubkey,
                wrapAndUnwrapSol: true,
                useSharedAccounts: true,
                useTokenLedger: false,  // This reduces accounts significantly
            }),
        }
    )).json();

    console.log(instructionsResponse);

    const jupiterData = Buffer.from(instructionsResponse.swapInstruction.data, 'base64');

    // EXECUTE SWAP
    try{
        const usdcAtaAddress = await getAssociatedTokenAddress(new PublicKey(usdcAddress), userKeypair.publicKey);
        const usdcData = {
            tokenMint: new PublicKey(usdcAddress),
            testudoPubkey: usdcAtaAddress,
        }
        const swapTx = await userProgram.methods.swap(jupiterData, [usdcData])
        .accountsPartial({
            authority: userKeypair.publicKey,
            validSignerOfPassword: passwordKeypair.publicKey,
            sourceMint: new PublicKey(wsolAddress),
            destinationMint: new PublicKey(usdcAddress),
            jupiterProgram: new PublicKey(instructionsResponse.swapInstruction.programId),
            tokenProgram: TOKEN_PROGRAM_ID,
            treasury: treasuryKeypair.publicKey,
        })
        .remainingAccounts(
            instructionsResponse.swapInstruction.accounts.map((account: any) => ({
                pubkey: new PublicKey(account.pubkey),
                isSigner: account.isSigner,
                isWritable: account.isWritable,
            }))
        )
        .transaction();

        swapTx.recentBlockhash = (await userProvider.connection.getLatestBlockhash()).blockhash;
        swapTx.feePayer = userKeypair.publicKey;
        swapTx.partialSign(userKeypair, passwordKeypair);

        const simulateSwapTx = await userProvider.connection.simulateTransaction(swapTx);
        console.log(`Simulation result: ${simulateSwapTx}`);

    } catch (error) {
        console.log(`Error: ${error}`);
    }
    
    // CLOSE CENTURION ACCOUNT
    const closeCenturionTx = await userProgram.methods.closeCenturion()
        .accounts({
            authority: userKeypair.publicKey,
            validSignerOfPassword: passwordKeypair.publicKey,
        })
        .signers([userKeypair, passwordKeypair])
        .rpc();

    console.log(`\nWithdraw SOL from Centurion to test user tx: ${closeCenturionTx}`);

    // CLOSE LEGATE ACCOUNT 
    const closeLegateTx = await userProgram.methods.closeLegate()
        .accounts({
            authority: legateKeypair.publicKey,
        })
        .signers([legateKeypair])
        .rpc();

    console.log(`Withdraw SOL from Legate to test user tx: ${closeLegateTx}`);

    //CONFIRM TRANSACTIONS
    var { blockhash, lastValidBlockHeight } = await userProvider.connection.getLatestBlockhash();
    await userProvider.connection.confirmTransaction({
        signature: closeCenturionTx,
        blockhash,
        lastValidBlockHeight,
    }, "finalized");
    await userProvider.connection.confirmTransaction({
        signature: closeLegateTx,
        blockhash,
        lastValidBlockHeight,
    }, "finalized");

    // RETURN FUNDS FROM TEST USER, LEGATE AUTHORITY AND TREASURY
    console.log();
    console.log(`${await returnSolToMyWallet(userKeypair, testPrimaryWallet, userProvider, "User")}\n`);
    console.log(`${await returnSolToMyWallet(legateKeypair, testPrimaryWallet, legateProvider, "Legate Authority")}\n`);
    console.log(`${await returnSolToMyWallet(treasuryKeypair, testPrimaryWallet, legateProvider, "Treasury")}\n`);

    // GET BALANCES
    const accountInfo = await userProvider.connection.getAccountInfo(testPrimaryWallet.publicKey);
    console.log(`Test primary wallet balance: ${(accountInfo?.lamports ?? 0) / LAMPORTS_PER_SOL}\n`);
})();

