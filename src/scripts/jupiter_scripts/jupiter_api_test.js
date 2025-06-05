// jupiter_api_test.js
const fetch = require('cross-fetch');

async function testJupiterAPI() {
  try {
    console.log('🚀 Testing Jupiter API...\n');

    // Step 1: Get Quote
    console.log('📊 Step 1: Getting quote...');
    const quoteUrl = 'https://quote-api.jup.ag/v6/quote?' + new URLSearchParams({
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '100000000', // 0.1 SOL
      slippageBps: '50' // 0.5%
    });

    const quoteResponse = await fetch(quoteUrl);
    const quote = await quoteResponse.json();
    
    console.log('✅ Quote received:');
    console.log('- Input:', quote.inAmount, 'lamports');
    console.log('- Output:', quote.outAmount, 'USDC');
    console.log('- Route steps:', quote.routePlan?.length || 0);
    console.log();

    // Step 2: Get Swap Instructions
    console.log('🔧 Step 2: Getting swap instructions...');
    const instructionsResponse = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Valid demo wallet
        wrapAndUnwrapSol: true,
        useSharedAccounts: true
      })
    });

    const instructions = await instructionsResponse.json();
    
    if (instructions.error) {
      throw new Error(`API Error: ${instructions.error}`);
    }

    console.log('✅ Instructions received!\n');

    // Print the entire response as JSON
    console.log('📄 COMPLETE SWAP-INSTRUCTIONS RESPONSE:');
    console.log('=====================================');
    console.log(JSON.stringify(instructions, null, 2));
    console.log('=====================================\n');

    console.log('🎉 Test completed successfully!');
    
    // Return the full response for further inspection
    return instructions;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

testJupiterAPI()
  .then((result) => {
    console.log('\n📄 Full response analysis complete');
  })
  .catch((error) => {
    console.error('Script failed:', error);
  });