'use client';

import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface SolCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCollection: () => void;
  folderName: string;
}

export const SolCollectionModal: React.FC<SolCollectionModalProps> = ({
  isOpen,
  onClose,
  onConfirmCollection,
  folderName
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCollection();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Collect SOL</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
              Source Folder
            </label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              disabled
            />
          </div>

          {/* Info Text */}
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs text-blue-700">
              All available SOL will be collected from wallets in this folder and sent to your main wallet using Jito Bundle. 
              Each wallet will keep a small amount for rent exemption.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-xs text-yellow-700">
              ⚠️ This will collect ALL available SOL from each wallet in the folder.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Collect SOL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
