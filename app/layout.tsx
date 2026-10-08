import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CHOGRAM — Chog Broadcast Studio",
  description:
    "Your Chog NFT is the actor. Summon it, then turn it into broadcast-ready video. Powered by Chog Genesis on Monad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
