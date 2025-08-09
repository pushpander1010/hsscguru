// src/app/practice/start/page.tsx
import PracticeStartClient from "./PracticeStartClient";

export const dynamic = "force-dynamic"; // avoid prerender surprises

export default async function PracticeStartPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; n?: string }>;
}) {
  const sp = await searchParams;
  const topic = sp.topic ?? "";
  const n = Number.isFinite(Number(sp.n)) ? Number(sp.n) : 10;

  return <PracticeStartClient topic={topic} n={n} />;
}
