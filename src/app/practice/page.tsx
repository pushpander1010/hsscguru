// src/app/practice/page.tsx
import { Suspense } from "react";
import PracticeClient from "./PracticeClient";

export const dynamic = "force-dynamic"; // avoids prerender surprises for this CSR page

function PracticeSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-7 w-48 mb-6 animate-pulse rounded bg-white/10" />
      <div className="rounded-xl border border-white/10 p-6 bg-[--surface]/80 space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-white/10" />
        <div className="h-10 w-full animate-pulse rounded bg-white/10" />
        <div className="h-10 w-32 animate-pulse rounded bg-white/10" />
      </div>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeSkeleton />}>
      <PracticeClient />
    </Suspense>
  );
}
