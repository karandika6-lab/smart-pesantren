import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Pesantren - Sistem Manajemen Pesantren Modern",
  description: "Sistem manajemen pesantren digital untuk pengelolaan santri, akademik, tahfidz, dan keuangan.",
  keywords: ["pesantren", "islamic school", "management", "tahfidz", "santri"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
