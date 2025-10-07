import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { JitoBundleSystem } from '../utils';
import { TokenTransferService } from '../utils/token-transfer';
import { SolDistributionService } from '../utils/sol-distribution';
import { TokenTradingService } from '../utils/token-trading';

export interface WalletInfo {
  id: string;
  name: string;
  keypair: Keypair;
  address: string;
  balance?: number;
}

export interface FolderInfo {
  id: string;
  name: string;
  wallets: WalletInfo[];
  createdAt: Date;
}

export class WalletService {
  private folders: Map<string, FolderInfo> = new Map();
  private jitoBundleSystem: JitoBundleSystem | null = null;
  private tokenTransferService: TokenTransferService | null = null;
  private solDistributionService: SolDistributionService | null = null;
  private tokenTradingService: TokenTradingService | null = null;
  private connection: Connection | null = null;
  private mainWalletPublicKey: PublicKey | null = null;
  private mainWalletKeypair: Keypair | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Initialize Jito Bundle System with main wallet
   */
  async initializeJitoBundleSystem(
    endpoint: string, 
    mainWalletSecretKey: Uint8Array
  ): Promise<void> {
    this.connection = new Connection(endpoint, 'confirmed');
    this.jitoBundleSystem = new JitoBundleSystem(endpoint, mainWalletSecretKey);
    
    // Wait for signer to be initialized
    await this.jitoBundleSystem.waitForInitialization();
    
    this.mainWalletPublicKey = new PublicKey(this.jitoBundleSystem.getWalletAddress());
    this.mainWalletKeypair = Keypair.fromSecretKey(mainWalletSecretKey);
    
    // Initialize services
    if (this.connection && this.mainWalletPublicKey && this.jitoBundleSystem && this.mainWalletKeypair) {
      // Token transfer service
      this.tokenTransferService = new TokenTransferService({
        connection: this.connection,
        mainWallet: this.mainWalletPublicKey,
        tokenMint: new PublicKey('11111111111111111111111111111111'), // Placeholder
        amount: 0,
        jitoBundleSystem: this.jitoBundleSystem
      });

      // SOL distribution service
      this.solDistributionService = new SolDistributionService({
        connection: this.connection,
        mainWallet: this.mainWalletPublicKey,
        mainWalletKeypair: this.mainWalletKeypair,
        jitoBundleSystem: this.jitoBundleSystem
      });

      // Token trading service
      this.tokenTradingService = new TokenTradingService({
        connection: this.connection,
        mainWallet: this.mainWalletPublicKey,
        jitoBundleSystem: this.jitoBundleSystem
      });
    }
  }

  /**
   * Create a new folder
   */
  createFolder(name: string): FolderInfo {
    const folder: FolderInfo = {
      id: this.generateId(),
      name,
      wallets: [],
      createdAt: new Date()
    };

    this.folders.set(folder.id, folder);
    this.saveToStorage();
    return folder;
  }

  /**
   * Create wallets in a folder
   */
  createWalletsInFolder(folderId: string, count: number): WalletInfo[] {
    const folder = this.folders.get(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    const wallets: WalletInfo[] = [];
    for (let i = 0; i < count; i++) {
      const keypair = Keypair.generate();
      const wallet: WalletInfo = {
        id: this.generateId(),
        name: `Wallet ${folder.wallets.length + i + 1}`,
        keypair,
        address: keypair.publicKey.toString()
      };
      wallets.push(wallet);
      folder.wallets.push(wallet);
    }

    this.saveToStorage();
    return wallets;
  }

  /**
   * Get all folders
   */
  getFolders(): FolderInfo[] {
    return Array.from(this.folders.values());
  }

  /**
   * Get folder by ID
   */
  getFolder(folderId: string): FolderInfo | undefined {
    return this.folders.get(folderId);
  }

  /**
   * Delete folder
   */
  deleteFolder(folderId: string): void {
    this.folders.delete(folderId);
    this.saveToStorage();
  }

  /**
   * Get all wallets from all folders
   */
  getAllWallets(): WalletInfo[] {
    const allWallets: WalletInfo[] = [];
    this.folders.forEach(folder => {
      allWallets.push(...folder.wallets);
    });
    return allWallets;
  }

  /**
   * Get wallets from multiple folders
   */
  getWalletsFromFolders(folderIds: string[]): WalletInfo[] {
    const wallets: WalletInfo[] = [];
    folderIds.forEach(folderId => {
      const folder = this.folders.get(folderId);
      if (folder) {
        wallets.push(...folder.wallets);
      }
    });
    return wallets;
  }

  /**
   * Send tokens from multiple folders to main wallet (bundle operation)
   */
  async sendTokensFromFolders(
    folderIds: string[],
    tokenAmount: number,
    tokenMintAddress: string
  ): Promise<string> {
    if (!this.jitoBundleSystem || !this.tokenTransferService || !this.connection) {
      throw new Error('Services not initialized');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    const keypairs = wallets.map(wallet => wallet.keypair);
    const tokenMint = new PublicKey(tokenMintAddress);

    // Update token transfer service with current token mint
    this.tokenTransferService = new TokenTransferService({
      connection: this.connection,
      mainWallet: this.mainWalletPublicKey!,
      tokenMint: tokenMint,
      amount: tokenAmount,
      jitoBundleSystem: this.jitoBundleSystem
    });

    return await this.tokenTransferService.createBundleFromFolders(
      keypairs,
      tokenMint,
      tokenAmount
    );
  }

  /**
   * Send tokens between folders (bundle operation)
   */
  async sendTokensBetweenFolders(
    fromFolderId: string,
    toFolderId: string,
    tokenAmount: number,
    tokenMintAddress: string
  ): Promise<string> {
    if (!this.jitoBundleSystem || !this.tokenTransferService || !this.connection) {
      throw new Error('Services not initialized');
    }

    const fromFolder = this.folders.get(fromFolderId);
    const toFolder = this.folders.get(toFolderId);

    if (!fromFolder || !toFolder) {
      throw new Error('Source or destination folder not found');
    }

    const fromWallets = fromFolder.wallets.map(wallet => wallet.keypair);
    const toWallets = toFolder.wallets.map(wallet => wallet.keypair.publicKey);
    const tokenMint = new PublicKey(tokenMintAddress);

    // Update token transfer service with current token mint
    this.tokenTransferService = new TokenTransferService({
      connection: this.connection,
      mainWallet: this.mainWalletPublicKey!,
      tokenMint: tokenMint,
      amount: tokenAmount,
      jitoBundleSystem: this.jitoBundleSystem
    });

    return await this.tokenTransferService.createBundleBetweenFolders(
      fromWallets,
      toWallets,
      tokenMint,
      tokenAmount
    );
  }

  /**
   * Get main wallet address
   */
  getMainWalletAddress(): string | null {
    return this.jitoBundleSystem?.getWalletAddress() || null;
  }

  /**
   * Distribute SOL to wallets in folders
   */
  async distributeSolToFolders(
    folderIds: string[],
    amountPerWallet: number
  ): Promise<string> {
    console.log('🔍 WalletService: Starting SOL distribution...');
    console.log('🔍 Folder IDs:', folderIds);
    console.log('🔍 Amount per wallet:', amountPerWallet);

    if (!this.solDistributionService) {
      throw new Error('SOL Distribution Service not initialized');
    }

    if (!folderIds || folderIds.length === 0) {
      throw new Error('No folder IDs provided');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    console.log('🔍 Found wallets:', wallets.length);
    
    if (wallets.length === 0) {
      throw new Error('No wallets found in specified folders');
    }

    const keypairs = wallets.map(wallet => {
      console.log('🔍 Processing wallet:', wallet);
      console.log('🔍 Wallet keypair:', wallet.keypair);
      console.log('🔍 Wallet _keypair:', (wallet as any)._keypair);
      
      // Check both possible keypair locations
      const keypair = wallet.keypair || (wallet as any)._keypair;
      
      if (!wallet || !keypair) {
        console.error('❌ Invalid wallet in folder:', wallet);
        throw new Error('Invalid wallet found in folder');
      }
      return keypair;
    });

    console.log('🔍 Valid keypairs:', keypairs.length);
    console.log('🔍 First keypair:', keypairs[0]);

    return await this.solDistributionService.distributeSolToWallets(
      keypairs,
      amountPerWallet
    );
  }

  /**
   * Collect SOL from wallets in folders
   */
  async collectSolFromFolders(folderIds: string[]): Promise<string> {
    console.log('🔍 WalletService: Starting SOL collection...');
    console.log('🔍 Folder IDs:', folderIds);

    if (!this.solDistributionService) {
      throw new Error('SOL Distribution Service not initialized');
    }

    if (!folderIds || folderIds.length === 0) {
      throw new Error('No folder IDs provided');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    console.log('🔍 Found wallets:', wallets.length);
    
    if (wallets.length === 0) {
      throw new Error('No wallets found in specified folders');
    }

    const keypairs = wallets.map(wallet => {
      // Check both possible keypair locations
      const keypair = wallet.keypair || (wallet as any)._keypair;
      
      if (!wallet || !keypair) {
        console.error('❌ Invalid wallet in folder:', wallet);
        throw new Error('Invalid wallet found in folder');
      }
      return keypair;
    });

    console.log('🔍 Valid keypairs:', keypairs.length);

    return await this.solDistributionService.collectSolFromWallets(keypairs);
  }

  /**
   * Buy tokens with 5-tx bundles
   */
  async buyTokensWithBundles(
    folderIds: string[],
    tokenMintAddress: string,
    amountPerWallet: number,
    solAmount: number
  ): Promise<string> {
    console.log('🔍 WalletService: Starting token buy with bundles...');
    console.log('🔍 Folder IDs:', folderIds);
    console.log('🔍 Token mint address:', tokenMintAddress);
    console.log('🔍 Amount per wallet:', amountPerWallet);
    console.log('🔍 SOL amount:', solAmount);

    if (!this.tokenTradingService) {
      throw new Error('Token Trading Service not initialized');
    }

    if (!folderIds || folderIds.length === 0) {
      throw new Error('No folder IDs provided');
    }

    if (!tokenMintAddress || tokenMintAddress.trim() === '') {
      throw new Error('Token mint address not provided');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    console.log('🔍 Found wallets:', wallets.length);
    
    if (wallets.length === 0) {
      throw new Error('No wallets found in specified folders');
    }

    const keypairs = wallets.map(wallet => {
      // Check both possible keypair locations
      const keypair = wallet.keypair || (wallet as any)._keypair;
      
      if (!wallet || !keypair) {
        console.error('❌ Invalid wallet in folder:', wallet);
        throw new Error('Invalid wallet found in folder');
      }
      return keypair;
    });

    console.log('🔍 Valid keypairs:', keypairs.length);

    const tokenMint = new PublicKey(tokenMintAddress);

    return await this.tokenTradingService.buyTokensWithBundles(
      keypairs,
      tokenMint,
      amountPerWallet,
      solAmount
    );
  }

  /**
   * Sell tokens with 5-tx bundles
   */
  async sellTokensWithBundles(
    folderIds: string[],
    tokenMintAddress: string,
    amountPerWallet: number
  ): Promise<string> {
    console.log('🔍 WalletService: Starting token sell with bundles...');
    console.log('🔍 Folder IDs:', folderIds);
    console.log('🔍 Token mint address:', tokenMintAddress);
    console.log('🔍 Amount per wallet:', amountPerWallet);

    if (!this.tokenTradingService) {
      throw new Error('Token Trading Service not initialized');
    }

    if (!folderIds || folderIds.length === 0) {
      throw new Error('No folder IDs provided');
    }

    if (!tokenMintAddress || tokenMintAddress.trim() === '') {
      throw new Error('Token mint address not provided');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    console.log('🔍 Found wallets:', wallets.length);
    
    if (wallets.length === 0) {
      throw new Error('No wallets found in specified folders');
    }

    const keypairs = wallets.map(wallet => {
      // Check both possible keypair locations
      const keypair = wallet.keypair || (wallet as any)._keypair;
      
      if (!wallet || !keypair) {
        console.error('❌ Invalid wallet in folder:', wallet);
        throw new Error('Invalid wallet found in folder');
      }
      return keypair;
    });

    console.log('🔍 Valid keypairs:', keypairs.length);

    const tokenMint = new PublicKey(tokenMintAddress);

    return await this.tokenTradingService.sellTokensWithBundles(
      keypairs,
      tokenMint,
      amountPerWallet
    );
  }

  /**
   * Mixed trading operations with 5-tx bundles
   */
  async mixedTradingBundles(
    folderIds: string[],
    operations: Array<{
      tokenMintAddress: string;
      amount: number;
      action: 'buy' | 'sell';
    }>
  ): Promise<string> {
    if (!this.tokenTradingService) {
      throw new Error('Token Trading Service not initialized');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    const keypairs = wallets.map(wallet => wallet.keypair);
    
    const formattedOperations = operations.map(op => ({
      tokenMint: new PublicKey(op.tokenMintAddress),
      amount: op.amount,
      action: op.action
    }));

    return await this.tokenTradingService.mixedTradingBundles(
      keypairs,
      formattedOperations
    );
  }

  /**
   * Get SOL balance for a wallet
   */
  async getWalletSolBalance(walletAddress: string): Promise<number> {
    if (!this.solDistributionService) {
      throw new Error('SOL Distribution Service not initialized');
    }

    const publicKey = new PublicKey(walletAddress);
    return await this.solDistributionService.getSolBalance(publicKey);
  }

  /**
   * Get total SOL balance for folders
   */
  async getFoldersTotalSolBalance(folderIds: string[]): Promise<number> {
    if (!this.solDistributionService) {
      throw new Error('SOL Distribution Service not initialized');
    }

    const wallets = this.getWalletsFromFolders(folderIds);
    const publicKeys = wallets.map(wallet => {
      const keypair = wallet.keypair || (wallet as any)._keypair;
      return keypair.publicKey;
    });
    
    return await this.solDistributionService.getTotalSolBalance(publicKeys);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const data = {
      folders: Array.from(this.folders.entries())
    };
    localStorage.setItem('wallet-service-data', JSON.stringify(data));
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = localStorage.getItem('wallet-service-data');
      if (data) {
        const parsed = JSON.parse(data);
        // Convert createdAt strings back to Date objects and reconstruct Keypairs
        const folders = parsed.folders.map(([id, folder]: [string, any]) => [
          id,
          {
            ...folder,
            createdAt: new Date(folder.createdAt),
            wallets: folder.wallets.map((wallet: any) => {
              // Reconstruct Keypair from secretKey
              let keypair;
              if (wallet.keypair?._keypair?.secretKey) {
                keypair = Keypair.fromSecretKey(new Uint8Array(Object.values(wallet.keypair._keypair.secretKey)));
              } else if (wallet.keypair?.secretKey) {
                keypair = Keypair.fromSecretKey(new Uint8Array(Object.values(wallet.keypair.secretKey)));
              } else {
                keypair = wallet.keypair;
              }
              
              return {
                ...wallet,
                keypair
              };
            })
          }
        ]);
        this.folders = new Map(folders);
      }
    } catch (error) {
      console.error('Failed to load wallet service data:', error);
    }
  }
}

// Singleton instance
export const walletService = new WalletService();
