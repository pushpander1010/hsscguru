// src/app/practice/start/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Question = {
  id: string;
  text: string;
  options: [string, string, string, string];
  answer_index: number; // 0..3
  explanation: string | null;
  source: string | null;
};

export default function PracticeStartPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const topic = sp.get("topic") ?? "";
  const nParam = sp.get("n");
  const n: number = Number.isFinite(Number(nParam)) ? Number(nParam) : 10;

  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [qs, setQs] = useState<Question[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      if (!topic) {
        setErr("No topic selected. Go back and choose a topic.");
        setLoading(false);
        return;
      }

      // Example: adjust to your actual RPC/table
      const { data, error } = await supabase
        .schema("api")
        .from("questions_public")
        .select("id,text,options,answer_index,explanation,source")
        .eq("topic", topic)
        .limit(n);

      if (!active) return;

      if (error) {
        setErr("Failed to load questions");
        setQs([]);
      } else {
        setQs((data as Question[]) ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [topic, n]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-40 animate-pulse rounded bg-white/10" />
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-red-400">{err}</p>
      </main>
    );
  }

  if (qs.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-white/70">
          No questions found for this topic. Please go back and pick something else.
        </p>
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
        <button
          className="btn-ghost"
          onClick={() => router.push(`/practice`)}
        >
          Change Topic
        </button>
      </div>
    </main>
  );
}
