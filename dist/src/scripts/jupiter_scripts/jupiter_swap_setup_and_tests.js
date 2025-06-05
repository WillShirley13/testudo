"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const keypair_security_functions_1 = require("./keypair_security_functions");
const keypair_functions_1 = require("../../app/utils/keypair-functions");
const testudo_json_1 = require("../../../anchor/target/idl/testudo.json");
const anchor_1 = require("@coral-xyz/anchor");
const token_1 = require("@coral-xyz/anchor/dist/cjs/utils/token");
const readline = require("readline");
const cross_fetch_1 = require("cross-fetch");
const console_1 = require("console");
// To pause program while manuall funding of accounts can occur
async function pauseForInput(message) {
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
async function returnSolToMyWallet(sender, provider, accountMakingTransfer) {
    const myWallet = new web3_js_1.PublicKey("ADPYX1FrWLgKwVQ1k2TndirR9nFJGRJWMifT8eoCxU9D");
    const senderAccountSize = (await provider.connection.getAccountInfo(sender.publicKey))?.data.length;
    if (senderAccountSize === undefined) {
        throw (0, console_1.error)("Failed to get user account size");
    }
    const requiredRent = await provider.connection.getMinimumBalanceForRentExemption(senderAccountSize);
    const userBalance = (await provider.connection.getBalance(sender.publicKey)) - requiredRent;
    const transferInstruction = web3_js_1.SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: myWallet,
        lamports: userBalance
    });
    const transferToMyWalletTx = new web3_js_1.Transaction().add(transferInstruction);
    // return funds used for testing purposes back to my own wallet
    await (0, web3_js_1.sendAndConfirmTransaction)(provider.connection, transferToMyWalletTx, [sender], { commitment: "confirmed" });
    return `Funds returned from ${accountMakingTransfer}`;
}
const legateKeypair = web3_js_1.Keypair.generate();
console.log(`Legate keypair: ${legateKeypair.publicKey}`);
const treasuryKeypair = web3_js_1.Keypair.generate();
console.log(`Treasury keypair: ${treasuryKeypair.publicKey}`);
const userKeypair = web3_js_1.Keypair.generate();
console.log(`Centurion keypair: ${userKeypair.publicKey}`);
const passwordPhrase = new keypair_functions_1.SecureKeypairGenerator().generateRandomPhrase(5);
let passwordKeypair;
let words;
pauseForInput("PAUSING DURING MANUAL FUNDING OF ACCOUNTS");
(async () => {
    const result = await new keypair_functions_1.SecureKeypairGenerator()
        .deriveKeypairFromWords(passwordPhrase, userKeypair.publicKey.toString());
    passwordKeypair = result.keypair;
    words = result.words;
    (0, keypair_security_functions_1.saveKeypair)(legateKeypair, "legate", "CupTipMouse417");
    (0, keypair_security_functions_1.saveKeypair)(treasuryKeypair, "treasury", "PadCribToe265");
    (0, keypair_security_functions_1.saveKeypair)(userKeypair, "centurion", "TreeCandyPup946");
    (0, keypair_security_functions_1.saveKeypair)(passwordKeypair, "password", "TvTabPill384");
    // build wallet objects
    const legateWallet = new anchor_1.Wallet(legateKeypair);
    const userWallet = new anchor_1.Wallet(userKeypair);
    // build respective provider objects for sending transactions
    // const legateProvider = new AnchorProvider(new Connection("https://api.mainnet-beta.solana.com"), legateWallet);
    // const userProvider = new AnchorProvider(new Connection("https://api.mainnet-beta.solana.com"), userWallet);
    const legateProvider = new anchor_1.AnchorProvider(new web3_js_1.Connection("http://127.0.0.1:8899"), legateWallet);
    const userProvider = new anchor_1.AnchorProvider(new web3_js_1.Connection("http://127.0.0.1:8899"), userWallet);
    const legateProgram = new anchor_1.Program(testudo_json_1.default, legateProvider);
    const userProgram = new anchor_1.Program(testudo_json_1.default, userProvider);
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
    let depositSolTx = await userProgram.methods.depositSol(new anchor_1.BN(1 * web3_js_1.LAMPORTS_PER_SOL))
        .accounts({
        authority: userKeypair.publicKey,
    })
        .signers([])
        .rpc();
    console.log(`Centurion SOL deposit tx: ${depositSolTx}`);
    // GET CENTURION PDA
    const [centurionPubkey, _] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("centurion"), userKeypair.publicKey.toBuffer()], legateProgram.programId);
    console.log(`Centurion PDA: ${centurionPubkey}`);
    console.log(`Centurion SOL balance: ${await userProvider.connection.getBalance(centurionPubkey)}`);
    // GET MINT ADDRESSES
    const usdcAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const wsolAddress = "So11111111111111111111111111111111111111112";
    // CREATE USDC ATA
    let initUsdcAta = await userProgram.methods.createTestudo()
        .accountsPartial({
        authority: userKeypair.publicKey,
        mint: new web3_js_1.PublicKey(usdcAddress),
        tokenProgram: token_1.TOKEN_PROGRAM_ID,
    })
        .signers([])
        .rpc();
    console.log(`Init USDC ATA tx: ${initUsdcAta}`);
    // make API calls... 
    let quoteResponse = await (await (0, cross_fetch_1.default)(`https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${0.1 * anchor_1.web3.LAMPORTS_PER_SOL}&slippageBps=50&restrictIntermediateTokens=true&platformFeeBps=50&feeAccount=${treasuryKeypair.publicKey}&maxAccounts=10&onlyDirectRoutes=true` // Add these parameters
    )).json();
    // GET INSTRUCTIONS
    const instructionsResponse = await (await (0, cross_fetch_1.default)("https://quote-api.jup.ag/v6/swap-instructions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            quoteResponse: quoteResponse,
            userPublicKey: centurionPubkey,
            wrapAndUnwrapSol: true,
            useSharedAccounts: true,
            useTokenLedger: false, // This reduces accounts significantly
        }),
    })).json();
    console.log(instructionsResponse);
    const jupiterData = Buffer.from(instructionsResponse.swapInstruction.data, 'base64');
    // EXECUTE SWAP
    try {
        const swapTx = await userProgram.methods.swap(jupiterData)
            .accountsPartial({
            authority: userKeypair.publicKey,
            validSignerOfPassword: passwordKeypair.publicKey,
            sourceMint: new web3_js_1.PublicKey(wsolAddress),
            destinationMint: new web3_js_1.PublicKey(usdcAddress),
            jupiterProgram: new web3_js_1.PublicKey(instructionsResponse.swapInstruction.programId),
            tokenProgram: token_1.TOKEN_PROGRAM_ID,
            treasury: treasuryKeypair.publicKey,
        })
            .remainingAccounts(instructionsResponse.swapInstruction.accounts.map((account) => ({
            pubkey: new web3_js_1.PublicKey(account.pubkey),
            isSigner: account.isSigner,
            isWritable: account.isWritable,
        })))
            .transaction();
        swapTx.recentBlockhash = (await userProvider.connection.getLatestBlockhash()).blockhash;
        swapTx.feePayer = userKeypair.publicKey;
        swapTx.partialSign(userKeypair, passwordKeypair);
        const simulateSwapTx = await userProvider.connection.simulateTransaction(swapTx);
        console.log(`Simulation result: ${simulateSwapTx}`);
    }
    catch (error) {
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
    console.log(`Withdraw SOL from Centurion to test user tx: ${closeCenturionTx}`);
    // CLOSE LEGATE ACCOUNT 
    const closeLegateTx = await userProgram.methods.closeLegate()
        .accounts({
        authority: legateKeypair.publicKey,
    })
        .signers([legateKeypair])
        .rpc();
    console.log(`Withdraw SOL from Legate to test user tx: ${closeLegateTx}`);
    // RETURN FUNDS FROM TEST USER, LEGATE AUTHORITY AND TREASURY
    console.log(await returnSolToMyWallet(userKeypair, userProvider, "User"));
    console.log(await returnSolToMyWallet(legateKeypair, legateProvider, "Legate Authority"));
    console.log(await returnSolToMyWallet(treasuryKeypair, legateProvider, "Treasury"));
})();
