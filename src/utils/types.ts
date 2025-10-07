import { Address, Base58EncodedBytes, Base64EncodedWireTransaction } from "@solana/kit";

/**
 * Jito Bundle Simulation Response Types
 */
export type JitoBundleSimulationResponse = {
  context: {
    apiVersion: string;
    slot: number;
  };
  value: {
    summary: 'succeeded' | {
      failed: {
        error: {
          TransactionFailure: [number[], string];
        };
        tx_signature: string;
      };
    };
    transactionResults: Array<{
      err: null | unknown;
      logs: string[];
      postExecutionAccounts: null | unknown;
      preExecutionAccounts: null | unknown;
      returnData: null | unknown;
      unitsConsumed: number;
    }>;
  };
};

/**
 * Jito Bundle Status Response Types
 */
export type JitoBundleStatusResponse = {
  context: { slot: number };
  value: {
    bundleId: string;
    transactions: Base58EncodedBytes[];
    slot: number;
    confirmationStatus: string;
    err: any;
  }[];
};

/**
 * Jito Inflight Bundle Status Response Types
 */
export type JitoInflightBundleStatusResponse = {
  context: { slot: number };
  value: {
    bundle_id: string;
    status: "Invalid" | "Pending" | "Landed" | "Failed";
    landed_slot: number | null;
  }[];
};

/**
 * LilJit RPC Addon Interface
 */
export interface LilJitAddon {
  [key: string]: any;
  getRegions(): string[];
  getTipAccounts(): Address[];
  getBundleStatuses(bundleIds: string[]): JitoBundleStatusResponse;
  getInflightBundleStatuses(bundleIds: string[]): JitoInflightBundleStatusResponse;
  sendTransaction(transactions: Base64EncodedWireTransaction[]): string;
  simulateBundle(transactions: [Base64EncodedWireTransaction[]]): JitoBundleSimulationResponse;
  sendBundle(transactions: Base64EncodedWireTransaction[]): string;
}

/**
 * Bundle Configuration Options
 */
export interface BundleConfig {
  tipAmount?: number;
  simulateFirst?: boolean;
  timeoutMs?: number;
  pollIntervalMs?: number;
  waitBeforePollMs?: number;
}

/**
 * Transaction Creation Options
 */
export interface TransactionOptions {
  memoMessage: string;
  includeTip?: boolean;
  tipAddress?: Address;
}
