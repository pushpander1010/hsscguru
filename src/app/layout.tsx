// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const siteName = "HSSC Guru";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://hsscguru.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteName} - HSSC CET Practice & Mocks`,
  description:
    "Practice topic-wise questions, take full HSSC CET mock tests, and read Haryana updates.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${siteName} - HSSC CET Practice & Mocks`,
    description:
      "Practice topic-wise questions, take full HSSC CET mock tests, and read Haryana updates.",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - HSSC CET Practice & Mocks`,
    description:
      "Practice topic-wise questions, take full HSSC CET mock tests, and read Haryana updates.",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// ✅ move viewport out of metadata
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
