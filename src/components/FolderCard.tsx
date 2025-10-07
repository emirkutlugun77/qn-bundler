'use client';

import React from 'react';
import { Folder, Wallet, ArrowRightLeft, Trash2, Plus, Coins, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { FolderInfo } from '../services/wallet-service';

interface FolderCardProps {
  folder: FolderInfo;
  onAddWallets: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onTransferToMain: (folderId: string) => void;
  onTransferBetweenFolders: (fromFolderId: string) => void;
  onDistributeSol: (folderId: string) => void;
  onCollectSol: (folderId: string) => void;
  onBuyTokens: (folderId: string) => void;
  onSellTokens: (folderId: string) => void;
  otherFolders: FolderInfo[];
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onAddWallets,
  onDeleteFolder,
  onTransferToMain,
  onTransferBetweenFolders,
  onDistributeSol,
  onCollectSol,
  onBuyTokens,
  onSellTokens,
  otherFolders
}) => {
  const [showWallets, setShowWallets] = React.useState(false);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      {/* Folder Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Folder className="text-gray-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{folder.name}</h3>
            <p className="text-sm text-gray-500">
              {folder.wallets.length} wallet{folder.wallets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAddWallets(folder.id)}
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
            title="Add wallets"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setShowWallets(!showWallets)}
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
            title="Toggle wallets"
          >
            <Wallet size={16} />
          </button>
          <button
            onClick={() => onDeleteFolder(folder.id)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            title="Delete folder"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Wallet List */}
      {showWallets && (
        <div className="mb-4">
          <div className="space-y-2">
            {folder.wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{wallet.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{wallet.address}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {wallet.balance !== undefined ? `${wallet.balance} SOL` : 'Loading...'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* SOL Operations */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onDistributeSol(folder.id)}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <Coins size={14} />
            <span>Distribute SOL</span>
          </button>
          
          <button
            onClick={() => onCollectSol(folder.id)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <DollarSign size={14} />
            <span>Collect SOL</span>
          </button>
        </div>

        {/* Token Operations */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onBuyTokens(folder.id)}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
          >
            <TrendingUp size={14} />
            <span>Buy Tokens (5x)</span>
          </button>
          
          <button
            onClick={() => onSellTokens(folder.id)}
            className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            <TrendingDown size={14} />
            <span>Sell Tokens (5x)</span>
          </button>
        </div>

        {/* Transfer Operations */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTransferToMain(folder.id)}
            className="flex items-center space-x-2 px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            <ArrowRightLeft size={14} />
            <span>Transfer to Main</span>
          </button>
          
          {otherFolders.length > 0 && (
            <button
              onClick={() => onTransferBetweenFolders(folder.id)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              <ArrowRightLeft size={14} />
              <span>Transfer to Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* Created Date */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Created: {folder.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
