import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/ui/components/ErrorBoundary";
import { checkServerOnlyKeysAtRuntime } from "@/security/server-only-validation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hakusan Dashboard",
  description: "池元勝議員向け政治家ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate server-only keys during server-side rendering
  checkServerOnlyKeysAtRuntime();

  return (
    <html lang="ja">
      <body className={inter.className}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
