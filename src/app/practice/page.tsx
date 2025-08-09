// app/practice/page.tsx
import { Suspense } from "react";
import PracticeClient from "./PracticeClient";

export const dynamic = "force-dynamic";

export default function PracticePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Practice (by topic)</h1>
      <Suspense fallback={<div>Loading…</div>}>
        <PracticeClient />
      </Suspense>
    </main>
  );
}
