import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CHOGRAM — Chog Broadcast Studio",
  description:
    "Your Chog NFT is the actor. Summon it, then turn it into broadcast-ready video. Powered by Chog Genesis on Monad.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo/logo.png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Chakra+Petch:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
