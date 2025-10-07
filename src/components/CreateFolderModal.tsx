'use client';

import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, walletCount: number) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder
}) => {
  const [folderName, setFolderName] = useState('');
  const [walletCount, setWalletCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim(), walletCount);
      setFolderName('');
      setWalletCount(5);
      onClose();
    }
  };

  const handleClose = () => {
    setFolderName('');
    setWalletCount(5);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Folder className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Create New Folder</h2>
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
              Folder Name
            </label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter folder name"
              required
            />
          </div>

          <div>
            <label htmlFor="walletCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Wallets
            </label>
            <input
              type="number"
              id="walletCount"
              value={walletCount}
              onChange={(e) => setWalletCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              min="1"
              max="100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Each wallet will be generated with a unique keypair
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
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
