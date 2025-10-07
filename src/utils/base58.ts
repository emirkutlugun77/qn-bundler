import bs58 from 'bs58';

/**
 * Convert Base58 encoded private key to Uint8Array
 */
export function base58ToUint8Array(base58Key: string): Uint8Array {
  try {
    return bs58.decode(base58Key);
  } catch (error) {
    throw new Error(`Invalid Base58 private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert Uint8Array to Base58 encoded string
 */
export function uint8ArrayToBase58(uint8Array: Uint8Array): string {
  return bs58.encode(uint8Array);
}
