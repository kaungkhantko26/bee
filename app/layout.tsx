import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "BEE | Home Services Marketplace",
  description:
    "A home services marketplace for finding workers, booking jobs, managing schedules, and handling payments.",
  icons: {
    icon: "/kkko.png",
    shortcut: "/kkko.png",
    apple: "/kkko.png",
  },
  openGraph: {
    title: "BEE | Home Services Marketplace",
    description:
      "A home services marketplace for finding workers, booking jobs, managing schedules, and handling payments.",
    images: [
      {
        url: "/kkko.png",
        width: 512,
        height: 512,
        alt: "BEE logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "BEE | Home Services Marketplace",
    description:
      "A home services marketplace for finding workers, booking jobs, managing schedules, and handling payments.",
    images: ["/kkko.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
