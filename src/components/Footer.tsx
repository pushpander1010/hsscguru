// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <p className="text-sm text-white/60">© {new Date().getFullYear()} HSSC Guru</p>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/tests/" className="hover:underline">Tests</Link>
          <Link href="/practice" className="hover:underline">Practice</Link>
          <Link href="/notes" className="hover:underline">Notes</Link>
        </nav>
      </div>
    </footer>
  );
}
