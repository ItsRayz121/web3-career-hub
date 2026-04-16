import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Web3 Career Hub — Jobs, CV, Resume & Opportunities",
  description:
    "Your personal career platform for Web3, blockchain, crypto and professional growth. Real-time jobs, AI-powered CV/resume/cover letter builder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0a0a0f] text-white antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              color: "#fff",
              border: "1px solid #2a2a4a",
            },
          }}
        />
      </body>
    </html>
  );
}
