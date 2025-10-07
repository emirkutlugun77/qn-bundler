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
  getAccount
} from '@solana/spl-token';
import { JitoBundleSystem } from './jito-bundle-system';

export interface TokenTransferConfig {
  connection: Connection;
  mainWallet: PublicKey;
  tokenMint: PublicKey;
  amount: number; // in token units (not lamports)
  jitoBundleSystem: JitoBundleSystem;
}

export interface TransferTransaction {
  fromWallet: Keypair;
  toWallet: PublicKey;
  amount: number;
  tokenMint: PublicKey;
}

export class TokenTransferService {
  private connection: Connection;
  private mainWallet: PublicKey;
  private jitoBundleSystem: JitoBundleSystem;

  constructor(config: TokenTransferConfig) {
    this.connection = config.connection;
    this.mainWallet = config.mainWallet;
    this.jitoBundleSystem = config.jitoBundleSystem;
  }

  /**
   * Create token transfer transactions for bundle
   */
  async createTokenTransferTransactions(
    transfers: TransferTransaction[]
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (const transfer of transfers) {
      const transaction = new Transaction();
      
      // Get source token account
      const sourceTokenAccount = await getAssociatedTokenAddress(
        transfer.tokenMint,
        transfer.fromWallet.publicKey
      );

      // Get destination token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        transfer.tokenMint,
        transfer.toWallet
      );

      // Check if destination token account exists
      try {
        await getAccount(this.connection, destinationTokenAccount);
      } catch {
        // Create associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            transfer.fromWallet.publicKey, // payer
            destinationTokenAccount, // associated token account
            transfer.toWallet, // owner
            transfer.tokenMint // mint
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceTokenAccount, // source
          destinationTokenAccount, // destination
          transfer.fromWallet.publicKey, // owner
          transfer.amount // amount
        )
      );

      // Set fee payer
      transaction.feePayer = transfer.fromWallet.publicKey;

      transactions.push(transaction);
    }

    return transactions;
  }

  /**
   * Create bundle for transferring tokens from multiple wallets to main wallet
   */
  async createBundleFromFolders(
    folderWallets: Keypair[],
    tokenMint: PublicKey,
    amount: number
  ): Promise<string> {
    const transfers: TransferTransaction[] = folderWallets.map(wallet => ({
      fromWallet: wallet,
      toWallet: this.mainWallet,
      amount: amount,
      tokenMint: tokenMint
    }));

    const transactions = await this.createTokenTransferTransactions(transfers);
    
    // Convert transactions to base64 for Jito bundle
    const serializedTransactions = transactions.map(tx => {
      tx.recentBlockhash = '11111111111111111111111111111111'; // Placeholder
      tx.sign(...transfers.map(t => t.fromWallet));
      return tx.serialize({ requireAllSignatures: false }).toString('base64');
    });

    // Send bundle through Jito
    return await this.jitoBundleSystem.sendBundle(
      serializedTransactions,
      {
        simulateFirst: true,
        tipAmount: 1000
      }
    );
  }

  /**
   * Create bundle for transferring tokens between folders
   */
  async createBundleBetweenFolders(
    fromWallets: Keypair[],
    toWallets: PublicKey[],
    tokenMint: PublicKey,
    amount: number
  ): Promise<string> {
    const transfers: TransferTransaction[] = [];
    
    // Create transfers from each fromWallet to each toWallet
    fromWallets.forEach(fromWallet => {
      toWallets.forEach(toWallet => {
        transfers.push({
          fromWallet,
          toWallet,
          amount,
          tokenMint
        });
      });
    });

    const transactions = await this.createTokenTransferTransactions(transfers);
    
    // Convert transactions to base64 for Jito bundle
    const serializedTransactions = transactions.map((tx, index) => {
      tx.recentBlockhash = '11111111111111111111111111111111'; // Placeholder
      tx.sign(transfers[index].fromWallet);
      return tx.serialize({ requireAllSignatures: false }).toString('base64');
    });

    // Send bundle through Jito
    return await this.jitoBundleSystem.sendBundle(
      serializedTransactions,
      {
        simulateFirst: true,
        tipAmount: 1000
      }
    );
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
}
