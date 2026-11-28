import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA Station",
  description: "生徒とSAのための質問・回答プラットフォーム",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
              読み込み中...
            </div>
          }
        >
          <AuthGuard>
            <Header />
            <main className="flex-1">{children}</main>
          </AuthGuard>
        </Suspense>
      </body>
    </html>
  );
}
