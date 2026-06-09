import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { CookieBanner } from "@/components/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diet Sprint AI",
  description: "Piani alimentari realistici, semplici e adattati alla vita quotidiana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Salta al contenuto
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <AnalyticsTracker />
        <CookieBanner />
      </body>
    </html>
  );
}
