'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../components/Header';
import { FolderCard } from '../components/FolderCard';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { TransferModal } from '../components/TransferModal';
import { SolDistributionModal } from '../components/SolDistributionModal';
import { SolCollectionModal } from '../components/SolCollectionModal';
import { TokenBuyModal } from '../components/TokenBuyModal';
import { TokenSellModal } from '../components/TokenSellModal';
import { walletService, FolderInfo } from '../services/wallet-service';
import { WalletService } from '../services/wallet-service';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSolDistributionModalOpen, setIsSolDistributionModalOpen] = useState(false);
  const [isSolCollectionModalOpen, setIsSolCollectionModalOpen] = useState(false);
  const [isTokenBuyModalOpen, setIsTokenBuyModalOpen] = useState(false);
  const [isTokenSellModalOpen, setIsTokenSellModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'toMain' | 'betweenFolders'>('toMain');
  const [fromFolderId, setFromFolderId] = useState<string | undefined>();
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Initialize Jito Bundle System when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      initializeJitoBundleSystem();
    }
  }, [connected, publicKey]);

  const loadFolders = () => {
    const folderList = walletService.getFolders();
    setFolders(folderList);
  };

  const initializeJitoBundleSystem = async () => {
    if (!publicKey) return;

    try {
      // Load private key from environment variables
      const privateKeyBase58 = process.env.NEXT_PUBLIC_MAIN_WALLET_PRIVATE_KEY;
      
      if (!privateKeyBase58) {
        throw new Error('MAIN_WALLET_PRIVATE_KEY not found in environment variables');
      }

      // Convert Base58 private key to Uint8Array
      const { base58ToUint8Array } = await import('../utils/base58');
      const privateKeyBytes = base58ToUint8Array(privateKeyBase58);

      await walletService.initializeJitoBundleSystem(
        process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT || "https://skilled-aged-lambo.solana-mainnet.quiknode.pro/e9123242ac843b701a00c0975743cf7f13953692/",
        privateKeyBytes
      );
    } catch (error) {
      console.error('Failed to initialize Jito Bundle System:', error);
      setError(`Failed to initialize Jito Bundle System: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateFolder = async (name: string, walletCount: number) => {
    try {
      setLoading(true);
      const folder = walletService.createFolder(name);
      walletService.createWalletsInFolder(folder.id, walletCount);
      loadFolders();
    } catch (error) {
      setError('Failed to create folder');
      console.error('Create folder error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallets = async (folderId: string) => {
    try {
      setLoading(true);
      walletService.createWalletsInFolder(folderId, 5);
      loadFolders();
    } catch (error) {
      setError('Failed to add wallets');
      console.error('Add wallets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      setLoading(true);
      walletService.deleteFolder(folderId);
      loadFolders();
    } catch (error) {
      setError('Failed to delete folder');
      console.error('Delete folder error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToMain = (folderId: string) => {
    setTransferType('toMain');
    setFromFolderId(folderId);
    setIsTransferModalOpen(true);
  };

  const handleTransferBetweenFolders = (fromFolderId: string) => {
    setTransferType('betweenFolders');
    setFromFolderId(fromFolderId);
    setIsTransferModalOpen(true);
  };

  const handleDistributeSol = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentFolderId(folderId);
      setCurrentFolderName(folder.name);
      setIsSolDistributionModalOpen(true);
    }
  };

  const handleCollectSol = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentFolderId(folderId);
      setCurrentFolderName(folder.name);
      setIsSolCollectionModalOpen(true);
    }
  };

  const handleBuyTokens = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentFolderId(folderId);
      setCurrentFolderName(folder.name);
      setIsTokenBuyModalOpen(true);
    }
  };

  const handleSellTokens = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentFolderId(folderId);
      setCurrentFolderName(folder.name);
      setIsTokenSellModalOpen(true);
    }
  };

  const handleConfirmSolDistribution = async (amount: number) => {
    if (!currentFolderId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`🚀 Distributing ${amount} SOL to folder: ${currentFolderName}`);
      
      const bundleId = await walletService.distributeSolToFolders([currentFolderId], amount);
      
      console.log(`✅ SOL Distribution Bundle sent successfully: ${bundleId}`);
      alert(`SOL Distribution successful!\nBundle ID: ${bundleId}\nJito Explorer: https://explorer.jito.wtf/bundle/${bundleId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SOL distribution failed';
      setError(errorMessage);
      console.error('❌ SOL Distribution error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSolCollection = async () => {
    if (!currentFolderId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`💰 Collecting SOL from folder: ${currentFolderName}`);
      
      const bundleId = await walletService.collectSolFromFolders([currentFolderId]);
      
      console.log(`✅ SOL Collection Bundle sent successfully: ${bundleId}`);
      alert(`SOL Collection successful!\nBundle ID: ${bundleId}\nJito Explorer: https://explorer.jito.wtf/bundle/${bundleId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SOL collection failed';
      setError(errorMessage);
      console.error('❌ SOL Collection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTokenBuy = async (tokenAddress: string, amountPerWallet: number, solAmount: number) => {
    if (!currentFolderId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`📈 Buying tokens with 5x bundles - Token: ${tokenAddress}, Amount: ${amountPerWallet}, SOL: ${solAmount}`);
      
      const bundleId = await walletService.buyTokensWithBundles([currentFolderId], tokenAddress, amountPerWallet, solAmount);
      
      console.log(`✅ Token Buy Bundle sent successfully: ${bundleId}`);
      alert(`Token Buy successful!\nBundle ID: ${bundleId}\nJito Explorer: https://explorer.jito.wtf/bundle/${bundleId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token buy failed';
      setError(errorMessage);
      console.error('❌ Token Buy error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTokenSell = async (tokenAddress: string, amountPerWallet: number) => {
    if (!currentFolderId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`📉 Selling tokens with 5x bundles - Token: ${tokenAddress}, Amount: ${amountPerWallet}`);
      
      const bundleId = await walletService.sellTokensWithBundles([currentFolderId], tokenAddress, amountPerWallet);
      
      console.log(`✅ Token Sell Bundle sent successfully: ${bundleId}`);
      alert(`Token Sell successful!\nBundle ID: ${bundleId}\nJito Explorer: https://explorer.jito.wtf/bundle/${bundleId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token sell failed';
      setError(errorMessage);
      console.error('❌ Token Sell error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (selectedFolders: string[], amount: number, tokenAddress: string) => {
    try {
      setLoading(true);
      setError(null);

      let bundleId: string = '';

      if (transferType === 'toMain') {
        bundleId = await walletService.sendTokensFromFolders(selectedFolders, amount, tokenAddress);
      } else {
        // For between folders, we'll transfer from the source folder to all selected destination folders
        for (const destFolderId of selectedFolders) {
          bundleId = await walletService.sendTokensBetweenFolders(fromFolderId!, destFolderId, amount, tokenAddress);
        }
      }

      console.log('Bundle sent successfully:', bundleId);
      alert(`Bundle sent successfully! Bundle ID: ${bundleId}\nJito Explorer: https://explorer.jito.wtf/bundle/${bundleId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setError(errorMessage);
      console.error('Transfer error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = () => {
    // TODO: Implement settings modal
    alert('Settings feature coming soon!');
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onCreateFolder={() => {}} 
          onOpenSettings={handleOpenSettings}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Phantom Wallet
            </h2>
            <p className="text-gray-600 mb-8">
              Please connect your Phantom wallet to start using the Jito Bundler
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onCreateFolder={() => setIsCreateModalOpen(true)} 
        onOpenSettings={handleOpenSettings}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800">Processing transaction...</p>
          </div>
        )}

        {/* Main Wallet Info */}
        <div className="mb-8 bg-white border border-gray-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Main Wallet</h2>
          <p className="text-sm text-gray-600 font-mono">
            {publicKey?.toString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Main wallet address for receiving transfers
          </p>
        </div>

        {/* Folders Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Wallet Folders</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Create Folder
            </button>
          </div>

          {folders.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">No folders created yet</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Create Your First Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onAddWallets={handleAddWallets}
                  onDeleteFolder={handleDeleteFolder}
                  onTransferToMain={handleTransferToMain}
                  onTransferBetweenFolders={handleTransferBetweenFolders}
                  onDistributeSol={handleDistributeSol}
                  onCollectSol={handleCollectSol}
                  onBuyTokens={handleBuyTokens}
                  onSellTokens={handleSellTokens}
                  otherFolders={folders.filter(f => f.id !== folder.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirmTransfer={handleConfirmTransfer}
        folders={folders}
        transferType={transferType}
        fromFolderId={fromFolderId}
      />

      <SolDistributionModal
        isOpen={isSolDistributionModalOpen}
        onClose={() => setIsSolDistributionModalOpen(false)}
        onConfirmDistribution={handleConfirmSolDistribution}
        folderName={currentFolderName}
      />

      <SolCollectionModal
        isOpen={isSolCollectionModalOpen}
        onClose={() => setIsSolCollectionModalOpen(false)}
        onConfirmCollection={handleConfirmSolCollection}
        folderName={currentFolderName}
      />

      <TokenBuyModal
        isOpen={isTokenBuyModalOpen}
        onClose={() => setIsTokenBuyModalOpen(false)}
        onConfirmBuy={handleConfirmTokenBuy}
        folderName={currentFolderName}
      />

      <TokenSellModal
        isOpen={isTokenSellModalOpen}
        onClose={() => setIsTokenSellModalOpen(false)}
        onConfirmSell={handleConfirmTokenSell}
        folderName={currentFolderName}
      />
    </div>
  );
}