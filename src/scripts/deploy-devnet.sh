#!/bin/bash

# Testudo Devnet Deployment Script
# This script automates the process of deploying the Testudo program to Solana devnet

echo "==== 🛡️ Testudo Devnet Deployment Script ===="
echo ""

# Step 1: Verify Solana CLI is configured for devnet
echo "Step 1: Verifying Solana CLI configuration..."
CURRENT_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')

if [[ $CURRENT_URL != *"devnet"* ]]; then
  echo "  ⚠️ Your Solana CLI is not configured for devnet."
  echo "  Would you like to set it to devnet now? (y/n)"
  read -r SET_DEVNET
  
  if [[ $SET_DEVNET == "y" || $SET_DEVNET == "Y" ]]; then
    solana config set --url https://api.devnet.solana.com
    echo "  ✅ Solana CLI configured for devnet."
  else
    echo "  ❌ Please set your Solana CLI to devnet manually with:"
    echo "     solana config set --url https://api.devnet.solana.com"
    exit 1
  fi
else
  echo "  ✅ Solana CLI already configured for devnet."
fi

# Step 2: Check for SOL balance
echo ""
echo "Step 2: Checking wallet balance..."
WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance | awk '{print $1}')

echo "  Wallet: $WALLET_ADDRESS"
echo "  Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
  echo "  ⚠️ Your wallet has less than 0.5 SOL. Deployment might fail."
  echo "  Would you like to request an airdrop of 1 SOL? (y/n)"
  read -r AIRDROP
  
  if [[ $AIRDROP == "y" || $AIRDROP == "Y" ]]; then
    echo "  Requesting airdrop..."
    solana airdrop 1
    NEW_BALANCE=$(solana balance | awk '{print $1}')
    echo "  ✅ New balance: $NEW_BALANCE SOL"
  else
    echo "  Continuing with current balance. If deployment fails, try:"
    echo "    solana airdrop 1"
  fi
fi

# Step 3: Check if admin keypair exists
echo ""
echo "Step 3: Verifying admin keypair..."
if [ -f "keys/admin" ]; then
  echo "  ✅ Admin keypair found at keys/admin"
else
  echo "  ❌ Admin keypair not found at keys/admin"
  echo "  Please ensure the admin keypair file exists before continuing."
  exit 1
fi

# Step 4: Build the program
echo ""
echo "Step 4: Building Anchor program..."
cd anchor || { echo "❌ Cannot find anchor directory"; exit 1; }
anchor build
if [ $? -ne 0 ]; then
  echo "  ❌ Build failed. Please check for errors."
  exit 1
else
  echo "  ✅ Build successful."
fi

# Step 5: Deploy the program to devnet
echo ""
echo "Step 5: Deploying program to devnet..."
anchor deploy --provider.cluster devnet
if [ $? -ne 0 ]; then
  echo "  ❌ Deployment failed. Please check for errors."
  exit 1
else
  echo "  ✅ Program deployed successfully."
fi

# Step 6: Initialize admin account using existing keypair
echo ""
echo "Step 6: Initializing admin account using existing keypair..."
cd ..

# Create a temporary JavaScript file that calls the TypeScript file
cat > temp-init-admin.js << 'EOL'
// This is a temporary file to execute the TypeScript init-admin script
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    esModuleInterop: true
  }
});
require('./scripts/init-admin.ts');
EOL

# Execute the temporary file
node temp-init-admin.js --devnet
INIT_RESULT=$?

# Clean up the temporary file
rm temp-init-admin.js

if [ $INIT_RESULT -ne 0 ]; then
  echo "  ❌ Admin initialization failed. Please check for errors."
  exit 1
else
  echo "  ✅ Admin initialized successfully."
fi

echo ""
echo "==== 🎉 Deployment Complete! ===="
echo ""
echo "You can now start the frontend with: npm run dev"
echo "The application will connect to devnet by default." 