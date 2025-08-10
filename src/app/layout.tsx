// src/app/layout.tsx
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/AuthProvider";

export const metadata = {
  title: "HSSC Guru",
  description: "Prep smarter for HSSC exams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[--bg] text-[--ink-100]">
        <AuthProvider>
          <Navbar />
          <main className="pt-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
