// src/app/tests/[slug]/runner.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Question = {
  id: string;
  text: string;
  options: [string, string, string, string];
  answer_index: number;
  explanation: string | null;
};

type TestMeta = {
  slug: string;
  name: string;
  question_count: number | null;
};

export default function TestRunner() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  // --- hooks at top level ---
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<TestMeta | null>(null);
  const [qs, setQs] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      // 1) fetch test meta
      const { data: testRow, error: testErr } = await supabase
        .schema("api")
        .from("tests_public")
        .select("slug,name,question_count")
        .eq("slug", slug)
        .single();

      if (!active) return;

      if (testErr || !testRow) {
        setErr("Test not found");
        setLoading(false);
        return;
      }
      setMeta(testRow as TestMeta);

      // 2) fetch questions for this test slug (adjust to your schema)
      const { data: qRows, error: qErr } = await supabase
        .schema("api")
        .from("questions_public")
        .select("id,text,options,answer_index,explanation")
        .eq("test_slug", slug);

      if (!active) return;

      if (qErr) {
        setErr("Failed to load questions");
        setQs([]);
        setLoading(false);
        return;
      }

      const list = (qRows as Question[]) ?? [];
      setQs(list);

      // init answers map
      const init: Record<string, number | null> = {};
      for (const q of list) init[q.id] = null;
      setAnswers(init);

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  // derived values
  const total = qs.length;
  const doneCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );
  const canSubmit = total > 0 && doneCount === total;

  const onSelect = (qid: string, index: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: index }));
  };

  const onSubmit = async () => {
    // Example submit flow (adjust to your schema)
    // 1) calculate score
    let score = 0;
    for (const q of qs) {
      if (answers[q.id] === q.answer_index) score += 1;
    }

    // 2) create attempt
    const { data: attempt, error: aErr } = await supabase
      .schema("api")
      .from("attempts_public")
      .insert({
        test_id: meta?.slug ?? slug, // adjust to real test_id if needed
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        score,
      })
      .select("id")
      .single();

    if (aErr || !attempt) {
      setErr("Failed to save attempt");
      return;
    }

    router.push(`/results/${attempt.id}`);
  };

  // --- render branches AFTER hooks ---
  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-40 animate-pulse rounded bg-white/10" />
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-red-400 mb-4">{err}</p>
        <Link href="/tests" className="btn-ghost">
          Back to Tests
        </Link>
      </main>
    );
  }

  if (!meta) {
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-white/70">Test not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{meta.name}</h1>
          <p className="text-sm text-white/60">
            {doneCount}/{total} answered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tests" className="btn-ghost">
            Exit
          </Link>
          <button
            className={`btn-ghost ${!canSubmit ? "opacity-50 pointer-events-none" : ""}`}
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </header>

      <ol className="space-y-4">
        {qs.map((q, idx) => {
          const chosen = answers[q.id];
          return (
            <li key={q.id} className="rounded-xl border border-white/10 p-4 bg-[--surface]/80">
              <div className="font-medium mb-3">
                Q{idx + 1}. {q.text}
              </div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, i) => {
                  const active = chosen === i;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => onSelect(q.id, i)}
                        className={[
                          "w-full text-left rounded-lg border p-2",
                          active
                            ? "border-white/30 bg-white/10"
                            : "border-white/10 hover:bg-white/5",
                        ].join(" ")}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
