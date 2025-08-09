// src/app/practice/start/page.tsx
import { Suspense } from "react";
import PracticeStartClient from "./PracticeStartClient";

export const dynamic = "force-dynamic"; // avoid prerender issues

function StartSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-7 w-56 mb-6 animate-pulse rounded bg-white/10" />
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 p-4 bg-[--surface]/80 h-28 animate-pulse" />
        <div className="rounded-xl border border-white/10 p-4 bg-[--surface]/80 h-28 animate-pulse" />
        <div className="rounded-xl border border-white/10 p-4 bg-[--surface]/80 h-28 animate-pulse" />
      </div>
    </main>
  );
}

export default function PracticeStartPage() {
  return (
    <Suspense fallback={<StartSkeleton />}>
      <PracticeStartClient />
    </Suspense>
  );
}
