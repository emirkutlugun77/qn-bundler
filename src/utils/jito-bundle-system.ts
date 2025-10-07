import {
  Rpc,
  createDefaultRpcTransport,
  createRpc,
  createJsonRpcApi,
  Address,
  mainnet,
  createSolanaRpc,
  createKeyPairSignerFromBytes,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  pipe,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  TransactionPartialSigner,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  Base64EncodedWireTransaction,
  TransactionMessageWithBlockhashLifetime
} from "@solana/kit";
import { getAddMemoInstruction } from "@solana-program/memo";
import { getTransferSolInstruction } from "@solana-program/system";
import {
  LilJitAddon,
  JitoBundleSimulationResponse,
  BundleConfig,
  TransactionOptions
} from "./types";

/**
 * Jito Bundle System Configuration Constants
 */
export const JITO_CONFIG = {
  MINIMUM_TIP: 1_000, // lamports
  POLL_INTERVAL_MS: 3_000,
  POLL_TIMEOUT_MS: 30_000,
  DEFAULT_WAIT_BEFORE_POLL_MS: 5_000,
} as const;

/**
 * Jito Bundle System Utility Class
 * 
 * Provides functionality to create, simulate, and send transaction bundles
 * through the Jito Network for MEV protection and atomic execution.
 */
export class JitoBundleSystem {
  private solanaRpc: ReturnType<typeof createSolanaRpc>;
  private lilJitRpc: Rpc<LilJitAddon>;
  private signer: TransactionPartialSigner;
  private endpoint: string;
  private isInitialized: boolean = false;

  constructor(endpoint: string, secretKey: Uint8Array | number[]) {
    this.endpoint = endpoint;
    this.solanaRpc = createSolanaRpc(endpoint);
    
    // For QuickNode, we need to use the same endpoint for Jito bundles
    // QuickNode automatically routes Jito bundle requests to the appropriate validators
    this.lilJitRpc = this.createJitoBundlesRpc(endpoint);
    
    // Convert number array to Uint8Array if needed
    const keyBytes = secretKey instanceof Uint8Array 
      ? secretKey 
      : new Uint8Array(secretKey);
    
    this.signer = null as any; // Will be initialized asynchronously
    this.initializeSigner(keyBytes);
  }

  /**
   * Wait for initialization to complete
   */
  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Initialize the signer asynchronously
   */
  private async initializeSigner(secretKey: Uint8Array): Promise<void> {
    try {
      // Validate secret key length (should be 64 bytes for Solana)
      if (secretKey.length !== 64) {
        throw new Error(`Invalid secret key length: expected 64 bytes, got ${secretKey.length}`);
      }
      
      this.signer = await createKeyPairSignerFromBytes(secretKey);
      this.isInitialized = true;
    } catch (error) {
      console.error('Signer initialization error:', error);
      throw new Error(`Failed to initialize signer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure the system is properly initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!this.isInitialized) {
        throw new Error("JitoBundleSystem not properly initialized");
      }
    }
  }

  /**
   * Create Jito Bundles RPC client
   */
  private createJitoBundlesRpc(endpoint: string): Rpc<LilJitAddon> {
    const api = createJsonRpcApi<LilJitAddon>({
      responseTransformer: (response: any) => response.result,
    });
    const transport = createDefaultRpcTransport({
      url: mainnet(endpoint),
    });
    return createRpc({ api, transport });
  }

  /**
   * Check if simulation summary indicates failure
   */
  private isFailedSummary(summary: JitoBundleSimulationResponse['value']['summary']): 
    summary is { failed: any } {
    return typeof summary === 'object' && summary !== null && 'failed' in summary;
  }

  /**
   * Validate simulation results
   */
  private validateSimulation(simulation: JitoBundleSimulationResponse): void {
    if (simulation.value.summary !== 'succeeded' && this.isFailedSummary(simulation.value.summary)) {
      throw new Error(
        `Bundle simulation failed: ${simulation.value.summary.failed.error.TransactionFailure[1]}`
      );
    }
  }

  /**
   * Get a random Jito tip account
   */
  async getTipAccount(): Promise<Address> {
    try {
      const tipAccounts = await this.lilJitRpc.getTipAccounts().send() as Address[];
      const randomTipIndex = Math.floor(Math.random() * tipAccounts.length);
      const jitoTipAddress = tipAccounts[randomTipIndex];
      
      if (!jitoTipAddress) {
        throw new Error("No Jito tip account found");
      }
      
      return jitoTipAddress;
    } catch (error) {
      throw new Error(`Failed to get tip account: ${error}`);
    }
  }

  /**
   * Create a transaction with optional tip
   */
  async createTransaction(
    latestBlockhash: Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0],
    options: TransactionOptions
  ): Promise<TransactionMessageWithBlockhashLifetime> {
    await this.ensureInitialized();

    const { memoMessage, includeTip, tipAddress } = options;

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(this.signer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstruction(
        getAddMemoInstruction({ memo: memoMessage }),
        tx
      ),
      (tx) => includeTip && tipAddress
        ? appendTransactionMessageInstruction(
            getTransferSolInstruction({
              source: this.signer,
              destination: tipAddress,
              amount: JITO_CONFIG.MINIMUM_TIP,
            }),
            tx
          )
        : tx
    );

    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    return signedTransaction as any;
  }

  /**
   * Poll bundle status until completion or timeout
   */
  async pollBundleStatus(
    bundleId: string,
    config: BundleConfig = {}
  ): Promise<boolean> {
    const {
      timeoutMs = JITO_CONFIG.POLL_TIMEOUT_MS,
      pollIntervalMs = JITO_CONFIG.POLL_INTERVAL_MS,
      waitBeforePollMs = JITO_CONFIG.DEFAULT_WAIT_BEFORE_POLL_MS
    } = config;

    await new Promise(resolve => setTimeout(resolve, waitBeforePollMs));

    const startTime = Date.now();
    let lastStatus = '';

    while (Date.now() - startTime < timeoutMs) {
      try {
        const bundleStatus = await this.lilJitRpc.getInflightBundleStatuses([bundleId]).send();
        const status = bundleStatus.value[0]?.status ?? 'Unknown';

        if (status !== lastStatus) {
          console.log(`Bundle status: ${status}`);
          lastStatus = status;
        }

        if (status === 'Landed') {
          return true;
        }

        if (status === 'Failed') {
          throw new Error(`Bundle failed with status: ${status}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      } catch (error) {
        console.error('Error checking bundle status:', error);
        throw error;
      }
    }

    throw new Error("Polling timeout exceeded, bundle not confirmed");
  }

  /**
   * Create and send a bundle of transactions
   */
  async sendBundle(
    transactions: string[] | Base64EncodedWireTransaction[],
    config: BundleConfig = {}
  ): Promise<string> {
    await this.ensureInitialized();

    const {
      tipAmount = JITO_CONFIG.MINIMUM_TIP,
      simulateFirst = true,
      ...pollConfig
    } = config;

    console.log(`Starting bundle operation...`);
    console.log(`Bundling ${transactions.length} transactions`);
    console.log(`Tip amount: ${tipAmount} lamports`);

    let base64EncodedTransactions: Base64EncodedWireTransaction[];

    // Check if transactions are already base64 encoded (from SOL distribution)
    if (transactions.length > 0 && typeof transactions[0] === 'string' && transactions[0].length > 100) {
      // Already base64 encoded transactions
      console.log(`Using pre-encoded transactions`);
      base64EncodedTransactions = transactions as Base64EncodedWireTransaction[];
    } else {
      // Create memo transactions from string messages
      console.log(`Creating memo transactions from messages`);
      
      // Get latest blockhash
      const { value: latestBlockhash } = await this.solanaRpc
        .getLatestBlockhash({ commitment: "confirmed" })
        .send();
      console.log(`Latest blockhash obtained: ${latestBlockhash.blockhash}`);

      // Get tip account
      const jitoTipAddress = await this.getTipAccount();
      console.log(`Jito tip account: ${jitoTipAddress}`);

      // Create transactions
      const signedTransactions = await Promise.all(
        (transactions as string[]).map((message, i) => {
          const isLastTransaction = i === transactions.length - 1;
          return this.createTransaction(latestBlockhash, {
            memoMessage: message,
            includeTip: isLastTransaction,
            tipAddress: isLastTransaction ? jitoTipAddress : undefined
          });
        })
      );

      // Base64 encode transactions
      base64EncodedTransactions = signedTransactions.map((transaction) =>
        getBase64EncodedWireTransaction(transaction as any)
      ) as Base64EncodedWireTransaction[];
    }

    console.log(`Transactions created and encoded`);

    // Simulate bundle if requested
    if (simulateFirst) {
      console.log(`Simulating bundle...`);
      const simulation = await this.lilJitRpc
        .simulateBundle([base64EncodedTransactions])
        .send();
      this.validateSimulation(simulation);
      console.log(`Simulation successful`);
    }

    // Send bundle
    let bundleId: string;
    try {
      bundleId = await this.lilJitRpc.sendBundle(base64EncodedTransactions).send();
      console.log(`Bundle sent: ${bundleId}`);
    } catch (error) {
      console.error("Error sending bundle:", error);
      throw error;
    }

    // Poll bundle status
    console.log(`Waiting for bundle to land...`);
    await this.pollBundleStatus(bundleId, pollConfig);
    
    console.log(`Bundle successfully landed!`);
    console.log(`Jito Explorer: https://explorer.jito.wtf/bundle/${bundleId}`);

    return bundleId;
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string {
    if (!this.signer) {
      throw new Error('Signer not initialized yet');
    }
    return this.signer.address;
  }

  /**
   * Get available regions
   */
  async getRegions(): Promise<string[]> {
    try {
      return await this.lilJitRpc.getRegions().send();
    } catch (error) {
      throw new Error(`Failed to get regions: ${error}`);
    }
  }

  /**
   * Get bundle status for specific bundle IDs
   */
  async getBundleStatuses(bundleIds: string[]) {
    try {
      return await this.lilJitRpc.getBundleStatuses(bundleIds).send();
    } catch (error) {
      throw new Error(`Failed to get bundle statuses: ${error}`);
    }
  }

}
