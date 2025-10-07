'use client';

import dynamic from 'next/dynamic';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Dynamic import to prevent hydration issues
const DynamicWalletMultiButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return { default: WalletMultiButton };
  },
  {
    ssr: false,
    loading: () => (
      <button className="wallet-adapter-button wallet-adapter-button-trigger !bg-white !text-black hover:!bg-gray-200 !border-0 px-4 py-2 rounded-md">
        Loading...
      </button>
    ),
  }
);

export { DynamicWalletMultiButton as WalletButton };
