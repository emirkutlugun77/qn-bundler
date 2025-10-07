'use client';

import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';

interface TokenBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBuy: (tokenAddress: string, amountPerWallet: number, solAmount: number) => void;
  folderName: string;
}

export const TokenBuyModal: React.FC<TokenBuyModalProps> = ({
  isOpen,
  onClose,
  onConfirmBuy,
  folderName
}) => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [amountPerWallet, setAmountPerWallet] = useState('1000');
  const [solAmount, setSolAmount] = useState('0.001');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenAddress.trim()) {
      onConfirmBuy(
        tokenAddress.trim(),
        parseFloat(amountPerWallet),
        parseFloat(solAmount)
      );
      setTokenAddress('');
      setAmountPerWallet('1000');
      setSolAmount('0.001');
      onClose();
    }
  };

  const handleClose = () => {
    setTokenAddress('');
    setAmountPerWallet('1000');
    setSolAmount('0.001');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Buy Tokens (5x Bundle)</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
              Target Folder
            </label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              disabled
            />
          </div>

          <div>
            <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Token Contract Address
            </label>
            <input
              type="text"
              id="tokenAddress"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter token mint address"
              required
            />
          </div>

          <div>
            <label htmlFor="amountPerWallet" className="block text-sm font-medium text-gray-700 mb-1">
              Token Amount per Wallet
            </label>
            <input
              type="number"
              id="amountPerWallet"
              value={amountPerWallet}
              onChange={(e) => setAmountPerWallet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="1"
              min="1"
              required
            />
          </div>

          <div>
            <label htmlFor="solAmount" className="block text-sm font-medium text-gray-700 mb-1">
              SOL Amount per Transaction
            </label>
            <input
              type="number"
              id="solAmount"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="0.000001"
              min="0.000001"
              required
            />
          </div>

          {/* Info Text */}
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-xs text-green-700">
              Each wallet will execute 5 buy transactions in a Jito Bundle for MEV protection.
              Total transactions: {folderName} wallets × 5 = {(folderName.split(' ').length > 0 ? 'X' : '5')} transactions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Buy Tokens (5x)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
