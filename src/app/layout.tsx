import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DistroFarmasi - Sistem Distribusi Farmasi",
  description: "Sistem Distribusi Farmasi untuk Manajemen Apotek",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-950 text-gray-100">
        {children}
      </body>
    </html>
  );
}
