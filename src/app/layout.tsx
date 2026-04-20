import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LoginHero3D from "@/components/login/LoginHero3D";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Pesantren - Sistem Manajemen Pesantren Modern",
  description: "Sistem manajemen pesantren digital untuk pengelolaan santri, akademik, tahfidz, dan keuangan.",
  keywords: ["pesantren", "islamic school", "management", "tahfidz", "santri"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import MobileNavigationHandler from "@/components/MobileNavigationHandler";
import NotificationManager from "@/components/NotificationManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark bg-[#050505]">
      <body className={`${inter.variable} font-sans antialiased text-white selection:bg-orange-500/30 min-h-screen relative overflow-x-hidden`}>
        {/* Helper for Mobile Navigation & Push Notifications */}
        <MobileNavigationHandler />
        {/* <NotificationManager /> - Moved to NotificationBell for better reliability */}

        {/* Global 3D Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <LoginHero3D />
        </div>

        {/* Global Overlay for Depth and Readability */}
        <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-[1]" />

        {/* Main Content Wrapper */}
        <div className="relative z-10 w-full min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
