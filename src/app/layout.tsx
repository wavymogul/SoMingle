import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { MobileTabBar } from "@/components/mobile/MobileTabBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://somingle.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SoMingle — The Future of Social Experiences",
    template: "%s · SoMingle",
  },
  description:
    "People don't need more events. They need better experiences. SoMingle is building a new category of curated experiences that bring networking, entertainment, friendship, and community together. Help shape it.",
  keywords: [
    "SoMingle",
    "social experiences",
    "networking events",
    "curated experiences",
    "community",
    "meet people",
    "event platform",
    "social club",
  ],
  authors: [{ name: "SoMingle" }],
  creator: "SoMingle",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "SoMingle — The Future of Social Experiences",
    description:
      "People don't need more events. They need better experiences. Help shape the future of social connection.",
    siteName: "SoMingle",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoMingle — The Future of Social Experiences",
    description:
      "People don't need more events. They need better experiences. Help shape the future of social connection.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  themeColor: "#06060c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} dark`}>
      <body className="font-sans">
        {children}
        <MobileTabBar />
      </body>
    </html>
  );
}
