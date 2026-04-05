import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "蚁域 - 蚂蚁知识与观察平台",
    template: "%s | 蚁域",
  },
  description:
    "集蚂蚁资料库、生活史科普与个人蚁群记录于一体的 AI 原生平台。查资料、学阶段、记成长。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
