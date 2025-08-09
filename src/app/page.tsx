// src/app/page.tsx
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function Home() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(75,133,255,0.25),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Crack HSSC with <span className="text-brand-400">confidence</span>
        </h1>
        <p className="mt-4 text-[--ink-300] max-w-2xl">
          Smart practice, real exam-like mocks, and focused revision notes.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={ROUTES.practice} className="btn">Take a Practice Test</Link>
          <Link href={ROUTES.Tests} className="btn-ghost">Full Mock Tests</Link>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href={ROUTES.notes} className="card">
            <h3 className="text-lg font-semibold">Notes</h3>
            <p className="mt-2 text-[--ink-300]">Concise topic notes for quick revision.</p>
          </Link>
          <Link href={ROUTES.haryanaGK} className="card">
            <h3 className="text-lg font-semibold">Haryana GK</h3>
            <p className="mt-2 text-[--ink-300]">State-specific facts & questions.</p>
          </Link>
          <Link href={ROUTES.jobUpdates} className="card">
            <h3 className="text-lg font-semibold">Job Updates</h3>
            <p className="mt-2 text-[--ink-300]">Latest HSSC recruitment news.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
