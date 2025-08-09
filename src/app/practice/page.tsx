// src/app/practice/start/page.tsx
import { createSupabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";

type Question = {
  id: string;
  text: string;
  options: [string, string, string, string];
  answer_index: number; // 0..3
  explanation: string | null;
  source: string | null;
};

export const dynamic = "force-dynamic"; // avoid prerender oddities for CSR-like flows

export default async function PracticeStartPage({
  searchParams,
}: {
  // Next 15 dynamic APIs: await this
  searchParams: Promise<{ topic?: string; n?: string }>;
}) {
  const sp = await searchParams;
  const topic = sp.topic ?? "";
  const n = Number.isFinite(Number(sp.n)) ? Number(sp.n) : 10;

  if (!topic) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-red-400">No topic selected. Go back and choose a topic.</p>
        <div className="mt-4">
          <Link href="/practice" className="btn-ghost">Back</Link>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .schema("api")
    .from("questions_public")
    .select("id,text,options,answer_index,explanation,source")
    .eq("topic", topic)
    .limit(n);

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-red-400">Failed to load questions.</p>
        <div className="mt-4">
          <Link href="/practice" className="btn-ghost">Back</Link>
        </div>
      </main>
    );
  }

  const qs = (data ?? []) as Question[];

  if (qs.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-white/70">
          No questions found for this topic. Please go back and pick something else.
        </p>
        <div className="mt-4">
          <Link href="/practice" className="btn-ghost">Change Topic</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Practice: {topic}</h1>
        <p className="text-sm text-white/60">
          You&apos;ve selected <span className="font-medium">{n}</span> questions.
        </p>
      </header>

      <ol className="space-y-4">
        {qs.map((q, idx) => (
          <li key={q.id} className="rounded-xl border border-white/10 p-4 bg-[--surface]/80">
            <div className="font-medium mb-3">
              Q{idx + 1}. {q.text}
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {q.options.map((opt, i) => (
                <li key={i} className="rounded-lg border border-white/10 p-2">
                  {String.fromCharCode(65 + i)}. {opt}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="pt-2">
        <Link href="/practice" className="btn-ghost">Change Topic</Link>
      </div>
    </main>
  );
}
