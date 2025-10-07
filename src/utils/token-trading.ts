import { 
  Connection, 
  PublicKey, 
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { JitoBundleSystem } from './jito-bundle-system';

export interface TokenTradingConfig {
  connection: Connection;
  mainWallet: PublicKey;
  jitoBundleSystem: JitoBundleSystem;
}

export interface TradingPair {
  tokenMint: PublicKey;
  amount: number;
  action: 'buy' | 'sell';
}

export interface TradingBundle {
  wallets: Keypair[];
  tradingPairs: TradingPair[];
}

export class TokenTradingService {
  private connection: Connection;
  private mainWallet: PublicKey;
  private jitoBundleSystem: JitoBundleSystem;

  constructor(config: TokenTradingConfig) {
    this.connection = config.connection;
    this.mainWallet = config.mainWallet;
    this.jitoBundleSystem = config.jitoBundleSystem;
  }

  /**
   * Create trading bundle with 5 transactions per wallet
   */
  async createTradingBundle(
    wallets: Keypair[],
    tradingPairs: TradingPair[]
  ): Promise<string> {
    const transactions: string[] = [];

    // Create 5 transactions per wallet
    for (const wallet of wallets) {
      for (let i = 0; i < 5; i++) {
        const pair = tradingPairs[i % tradingPairs.length];
        
        if (pair.action === 'buy') {
          transactions.push(
            `Buy ${pair.amount} ${pair.tokenMint.toString()} with ${wallet.publicKey.toString()}`
          );
        } else {
          transactions.push(
            `Sell ${pair.amount} ${pair.tokenMint.toString()} with ${wallet.publicKey.toString()}`
          );
        }
      }
    }

    console.log(`Creating trading bundle with ${transactions.length} transactions (5 per wallet)`);

    return await this.jitoBundleSystem.sendBundle(transactions, {
      simulateFirst: true,
      tipAmount: 1000
    });
  }

  /**
   * Buy tokens with multiple wallets in 5-tx bundles
   */
  async buyTokensWithBundles(
    wallets: Keypair[],
    tokenMint: PublicKey,
    amountPerWallet: number,
    solAmount: number
  ): Promise<string> {
    console.log('🔍 Starting token buy with bundles...');
    console.log('🔍 Wallets:', wallets.length);
    console.log('🔍 Token mint:', tokenMint.toString());
    console.log('🔍 Amount per wallet:', amountPerWallet);
    console.log('🔍 SOL amount:', solAmount);

    if (!wallets || wallets.length === 0) {
      throw new Error('No wallets provided');
    }

    if (!tokenMint) {
      throw new Error('Token mint not provided');
    }

    const transactions: string[] = [];

    // Create 5 buy transactions per wallet
    for (const wallet of wallets) {
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
      
      for (let i = 0; i < 5; i++) {
        transactions.push(
          `Buy ${amountPerWallet} tokens for ${solAmount} SOL with wallet ${publicKey.toString()}`
        );
      }
    }

    console.log(`✅ Buying tokens with ${wallets.length} wallets, 5 transactions each`);
    console.log('🔍 Transactions prepared:', transactions.length);

    return await this.jitoBundleSystem.sendBundle(transactions, {
      simulateFirst: true,
      tipAmount: 1000
    });
  }

  /**
   * Sell tokens with multiple wallets in 5-tx bundles
   */
  async sellTokensWithBundles(
    wallets: Keypair[],
    tokenMint: PublicKey,
    amountPerWallet: number
  ): Promise<string> {
    console.log('🔍 Starting token sell with bundles...');
    console.log('🔍 Wallets:', wallets.length);
    console.log('🔍 Token mint:', tokenMint.toString());
    console.log('🔍 Amount per wallet:', amountPerWallet);

    if (!wallets || wallets.length === 0) {
      throw new Error('No wallets provided');
    }

    if (!tokenMint) {
      throw new Error('Token mint not provided');
    }

    const transactions: string[] = [];

    // Create 5 sell transactions per wallet
    for (const wallet of wallets) {
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
      
      for (let i = 0; i < 5; i++) {
        transactions.push(
          `Sell ${amountPerWallet} tokens with wallet ${publicKey.toString()}`
        );
      }
    }

    console.log(`✅ Selling tokens with ${wallets.length} wallets, 5 transactions each`);
    console.log('🔍 Transactions prepared:', transactions.length);

    return await this.jitoBundleSystem.sendBundle(transactions, {
      simulateFirst: true,
      tipAmount: 1000
    });
  }

  /**
   * Mixed trading operations (buy/sell combinations)
   */
  async mixedTradingBundles(
    wallets: Keypair[],
    operations: Array<{
      tokenMint: PublicKey;
      amount: number;
      action: 'buy' | 'sell';
    }>
  ): Promise<string> {
    const transactions: string[] = [];

    // Create 5 transactions per wallet with mixed operations
    for (const wallet of wallets) {
      for (let i = 0; i < 5; i++) {
        const operation = operations[i % operations.length];
        
        transactions.push(
          `${operation.action.toUpperCase()} ${operation.amount} ${operation.tokenMint.toString()} with ${wallet.publicKey.toString()}`
        );
      }
    }

    console.log(`Mixed trading bundle with ${transactions.length} transactions`);

    return await this.jitoBundleSystem.sendBundle(transactions, {
      simulateFirst: true,
      tipAmount: 1000
    });
  }

  /**
   * Get token balance for a wallet
   */
  async getTokenBalance(
    wallet: PublicKey,
    tokenMint: PublicKey
  ): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(tokenMint, wallet);
      const accountInfo = await getAccount(this.connection, tokenAccount);
      return Number(accountInfo.amount);
    } catch {
      return 0;
    }
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(wallet: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(wallet);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Calculate trading fees
   */
  calculateTradingFees(
    transactionCount: number,
    baseFee: number = 0.000005 // 5000 lamports per transaction
  ): number {
    return transactionCount * baseFee;
  }

  /**
   * Validate trading parameters
   */
  validateTradingParams(
    wallets: Keypair[],
    tokenMint: PublicKey,
    amount: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (wallets.length === 0) {
      errors.push('No wallets provided');
    }

    if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!tokenMint) {
      errors.push('Token mint address is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
