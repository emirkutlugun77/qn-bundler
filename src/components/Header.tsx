'use client';

import React from 'react';
import { WalletButton } from './WalletButton';
import { FolderPlus, Settings } from 'lucide-react';

interface HeaderProps {
  onCreateFolder: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateFolder, onOpenSettings }) => {
  return (
    <header className="bg-black text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Jito Bundler</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={onCreateFolder}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <FolderPlus size={16} />
              <span>Create Folder</span>
            </button>
            
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={onCreateFolder}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <FolderPlus size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
