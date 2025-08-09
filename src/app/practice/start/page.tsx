// app/practice/start/page.tsx
import { Suspense } from "react";
import StartClient from "./StartClient";

type SP = { topic?: string; n?: string };

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>; // Next 15: it's a Promise
}) {
  const sp = await searchParams;
  const topic = (sp.topic ?? "").trim();
  const n = Math.max(1, Math.min(100, Number(sp.n ?? 10) || 10));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Practice: {topic || "—"}</h1>
      {!topic ? (
        <div className="rounded border p-4">
          <p className="mb-3">No topic provided.</p>
          <a className="text-blue-600 underline" href="/practice">
            Go back to Practice
          </a>
        </div>
      ) : (
        <Suspense fallback={<div>Loading…</div>}>
          <StartClient topic={topic} limit={n} />
        </Suspense>
      )}
    </main>
  );
}
