import type { Metadata } from "next";
import { WalletContextProvider } from "../contexts/wallet-context";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jito Bundler - Solana Wallet Manager",
  description: "Manage multiple wallets and execute bundle transactions with Jito Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider 
          endpoint={process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT || "https://skilled-aged-lambo.solana-mainnet.quiknode.pro/e9123242ac843b701a00c0975743cf7f13953692/"}
        >
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}