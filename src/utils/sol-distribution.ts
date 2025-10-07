import { 
  Connection, 
  PublicKey, 
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  createTransactionMessage,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { JitoBundleSystem } from './jito-bundle-system';

export interface SolDistributionConfig {
  connection: Connection;
  mainWallet: PublicKey;
  mainWalletKeypair: Keypair;
  jitoBundleSystem: JitoBundleSystem;
}

export class SolDistributionService {
  private connection: Connection;
  private mainWallet: PublicKey;
  private mainWalletKeypair: Keypair;
  private jitoBundleSystem: JitoBundleSystem;

  constructor(config: SolDistributionConfig) {
    this.connection = config.connection;
    this.mainWallet = config.mainWallet;
    this.mainWalletKeypair = config.mainWalletKeypair;
    this.jitoBundleSystem = config.jitoBundleSystem;
  }

  /**
   * Distribute SOL from main wallet to multiple wallets using Jito Bundle
   */
  async distributeSolToWallets(
    targetWallets: Keypair[],
    amountPerWallet: number // in SOL
  ): Promise<string> {
    console.log('🔍 Starting SOL distribution...');
    console.log('🔍 Target wallets:', targetWallets.length);
    console.log('🔍 Amount per wallet:', amountPerWallet);

    if (!targetWallets || targetWallets.length === 0) {
      throw new Error('No target wallets provided');
    }

    const amountLamports = amountPerWallet * LAMPORTS_PER_SOL;
    const transactions: string[] = [];

    // Create SOL transfer transactions for each wallet
    for (const wallet of targetWallets) {
      console.log('🔍 Raw wallet object:', wallet);
      
      let targetPublicKey;
      
      // Check if it's a Keypair object
      if (wallet && wallet.publicKey) {
        targetPublicKey = wallet.publicKey;
        console.log(`🔍 Processing Keypair wallet: ${targetPublicKey.toString()}`);
      } 
      // Check if it's a wallet object with _keypair
      else if (wallet && (wallet as any)._keypair && (wallet as any)._keypair.publicKey) {
        targetPublicKey = (wallet as any)._keypair.publicKey;
        console.log(`🔍 Processing _keypair wallet: ${targetPublicKey.toString()}`);
      } 
      else {
        console.error('❌ Invalid wallet structure:', wallet);
        throw new Error('Invalid wallet provided');
      }

      // Create SOL transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: this.mainWallet,
        toPubkey: targetPublicKey,
        lamports: amountLamports
      });

      // Create transaction
      const transaction = new Transaction().add(transferInstruction);

      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.mainWallet;

      // Sign transaction
      transaction.sign(this.mainWalletKeypair);

      // Convert to base64
      const base64Transaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
      transactions.push(base64Transaction);
    }

    console.log(`✅ Distributing ${amountPerWallet} SOL to ${targetWallets.length} wallets via Jito Bundle`);
    console.log('🔍 Transactions prepared:', transactions.length);

    // Add tip transaction to the bundle (required for Jito)
    const tipAmount = 1000; // 1000 lamports tip
    const jitoTipAddress = await this.jitoBundleSystem.getTipAccount();
    const tipInstruction = SystemProgram.transfer({
      fromPubkey: this.mainWallet,
      toPubkey: new PublicKey(jitoTipAddress),
      lamports: tipAmount
    });

    const tipTransaction = new Transaction().add(tipInstruction);
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tipTransaction.recentBlockhash = blockhash;
    tipTransaction.feePayer = this.mainWallet;
    tipTransaction.sign(this.mainWalletKeypair);

    const base64TipTransaction = tipTransaction.serialize({ requireAllSignatures: false }).toString('base64');
    transactions.push(base64TipTransaction);

    console.log('🔍 Added tip transaction to bundle');

    // Send bundle directly to Jito
    return await this.sendBundleDirectly(transactions);
  }

  /**
   * Send bundle directly to Jito
   */
  private async sendBundleDirectly(transactions: string[]): Promise<string> {
    try {
      // Send bundle using JitoBundleSystem
      console.log('🔍 Sending bundle to Jito...');
      const bundleId = await this.jitoBundleSystem.sendBundle(transactions, {
        simulateFirst: true,
        tipAmount: 1000
      });
      console.log('✅ Bundle sent successfully:', bundleId);

      return bundleId;
    } catch (error) {
      console.error('❌ Error sending bundle:', error);
      throw error;
    }
  }

  /**
   * Collect SOL from multiple wallets to main wallet using Jito Bundle
   */
  async collectSolFromWallets(
    sourceWallets: Keypair[]
  ): Promise<string> {
    console.log('🔍 Starting SOL collection...');
    console.log('🔍 Source wallets:', sourceWallets.length);

    if (!sourceWallets || sourceWallets.length === 0) {
      throw new Error('No source wallets provided');
    }

    const transactions: string[] = [];

    for (const wallet of sourceWallets) {
      console.log('🔍 Raw wallet object:', wallet);
      
      let publicKey;
      
      // Check if it's a Keypair object
      if (wallet && wallet.publicKey) {
        publicKey = wallet.publicKey;
        console.log(`🔍 Processing Keypair wallet: ${publicKey.toString()}`);
      } 
      // Check if it's a wallet object with _keypair
      else if (wallet && (wallet as any)._keypair && (wallet as any)._keypair.publicKey) {
        publicKey = (wallet as any)._keypair.publicKey;
        console.log(`🔍 Processing _keypair wallet: ${publicKey.toString()}`);
      } 
      else {
        console.error('❌ Invalid wallet structure:', wallet);
        throw new Error('Invalid wallet provided');
      }
      
      // Get wallet balance first
      const balance = await this.connection.getBalance(publicKey);
      const transferAmount = balance - 5000; // Leave some for rent exemption

      if (transferAmount > 0) {
        // Create SOL transfer instruction from wallet to main wallet
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: this.mainWallet,
          lamports: transferAmount
        });

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);

        // Get latest blockhash
        const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Sign transaction with wallet keypair
        let walletKeypair;
        if (wallet && wallet.publicKey) {
          walletKeypair = wallet;
        } else if (wallet && (wallet as any)._keypair) {
          walletKeypair = (wallet as any)._keypair;
        } else {
          throw new Error('Invalid wallet keypair');
        }

        transaction.sign(walletKeypair);

        // Convert to base64
        const base64Transaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
        transactions.push(base64Transaction);
      }
    }

    if (transactions.length === 0) {
      throw new Error('No wallets have sufficient SOL to collect');
    }

    console.log(`✅ Collecting SOL from ${transactions.length} wallets via Jito Bundle`);
    console.log('🔍 Transactions prepared:', transactions.length);

    // Add tip transaction to the bundle (required for Jito)
    const tipAmount = 1000; // 1000 lamports tip
    const jitoTipAddress = await this.jitoBundleSystem.getTipAccount();
    const tipInstruction = SystemProgram.transfer({
      fromPubkey: this.mainWallet,
      toPubkey: new PublicKey(jitoTipAddress),
      lamports: tipAmount
    });

    const tipTransaction = new Transaction().add(tipInstruction);
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tipTransaction.recentBlockhash = blockhash;
    tipTransaction.feePayer = this.mainWallet;
    tipTransaction.sign(this.mainWalletKeypair);

    const base64TipTransaction = tipTransaction.serialize({ requireAllSignatures: false }).toString('base64');
    transactions.push(base64TipTransaction);

    console.log('🔍 Added tip transaction to bundle');

    // Send bundle directly to Jito
    return await this.sendBundleDirectly(transactions);
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(wallet: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(wallet);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Get total SOL balance across multiple wallets
   */
  async getTotalSolBalance(wallets: PublicKey[]): Promise<number> {
    let totalBalance = 0;
    for (const wallet of wallets) {
      totalBalance += await this.getSolBalance(wallet);
    }
    return totalBalance;
  }

  /**
   * Calculate optimal distribution amounts
   */
  calculateDistributionAmounts(
    totalSol: number,
    walletCount: number,
    reserveAmount: number = 0.1 // Reserve 0.1 SOL for fees
  ): number {
    const availableSol = totalSol - reserveAmount;
    const amountPerWallet = availableSol / walletCount;
    return Math.max(0, amountPerWallet);
  }
}
