import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { WalletProvider } from "@/lib/wallet-context";

export const metadata: Metadata = {
  title: "Midnight Ledger",
  description: "Midnight Ledger for compliant fundraising, cap tables, and privacy-preserving proofs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <TRPCProvider>
          <WalletProvider>{children}</WalletProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
