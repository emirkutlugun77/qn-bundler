'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { FolderInfo } from '../services/wallet-service';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTransfer: (selectedFolders: string[], amount: number, tokenAddress: string) => void;
  folders: FolderInfo[];
  transferType: 'toMain' | 'betweenFolders';
  fromFolderId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onConfirmTransfer,
  folders,
  transferType,
  fromFolderId
}) => {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [amount, setAmount] = useState('0.001');
  const [tokenAddress, setTokenAddress] = useState('');

  const availableFolders = transferType === 'betweenFolders' 
    ? folders.filter(f => f.id !== fromFolderId)
    : folders;

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (selectedFolders.length > 0 && numAmount > 0 && tokenAddress.trim()) {
      onConfirmTransfer(selectedFolders, numAmount, tokenAddress.trim());
      setSelectedFolders([]);
      setAmount('0.001');
      setTokenAddress('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFolders([]);
    setAmount('0.001');
    setTokenAddress('');
    onClose();
  };

  if (!isOpen) return null;

  const title = transferType === 'toMain' 
    ? 'Transfer to Main Wallet' 
    : 'Transfer Between Folders';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
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
          {/* Token Address Input */}
          <div>
            <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Token Contract Address
            </label>
            <input
              type="text"
              id="tokenAddress"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter token mint address (e.g., So11111111111111111111111111111111111111112)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the token mint address you want to transfer
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Token Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              step="0.000001"
              min="0.000001"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount in token units (consider decimals)
            </p>
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {transferType === 'toMain' ? 'Select Folders' : 'Select Destination Folders'}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableFolders.map((folder) => (
                <label
                  key={folder.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFolders.includes(folder.id)}
                    onChange={() => handleFolderToggle(folder.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{folder.name}</p>
                    <p className="text-xs text-gray-500">
                      {folder.wallets.length} wallet{folder.wallets.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {availableFolders.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No folders available
              </p>
            )}
          </div>

          {/* Info Text */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600">
              {transferType === 'toMain' 
                ? 'Tokens will be transferred from selected folders to your main wallet using Jito Bundle.'
                : 'Tokens will be transferred between the selected folders using Jito Bundle.'
              }
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
              disabled={selectedFolders.length === 0 || !tokenAddress.trim()}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {transferType === 'toMain' ? 'Transfer to Main' : 'Transfer Between'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
