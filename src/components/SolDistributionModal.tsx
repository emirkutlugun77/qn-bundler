'use client';

import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';

interface SolDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDistribution: (amount: number) => void;
  folderName: string;
}

export const SolDistributionModal: React.FC<SolDistributionModalProps> = ({
  isOpen,
  onClose,
  onConfirmDistribution,
  folderName
}) => {
  const [amount, setAmount] = useState('0.001');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onConfirmDistribution(numAmount);
      setAmount('0.1');
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('0.001');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Distribute SOL</h2>
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
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              SOL Amount per Wallet
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="0.000001"
              min="0.000001"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount of SOL to distribute to each wallet in the folder
            </p>
          </div>

          {/* Info Text */}
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-xs text-green-700">
              SOL will be distributed from your main wallet to all wallets in this folder using Jito Bundle for MEV protection.
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Distribute SOL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
