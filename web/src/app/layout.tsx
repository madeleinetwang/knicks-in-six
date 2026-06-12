import type { Metadata } from "next";
import { Anton, Archivo, Bricolage_Grotesque, Caveat } from "next/font/google";
import "./globals.css";

// Oversized poster display type
const anton = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

// Clean readable body
const archivo = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
});

// Secondary heavy grotesque for sub-heads / stickers
const bricolage = Bricolage_Grotesque({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

// Handwritten accent for annotations
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knicks Model Report — What The Model Thinks",
  description:
    "A predictive model analyzing New York Knicks performance: win probability, player impact, and future outcomes. A basketball analytics report turned into a zine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${bricolage.variable} ${caveat.variable} antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
