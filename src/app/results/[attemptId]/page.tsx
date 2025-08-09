// src/app/results/[attemptId]/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ResultsList from "./ResultsList";

export default async function ResultPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const attemptId = params.attemptId;

  // attempt (RLS ensures only owner can read)
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, test_id, started_at, finished_at, score")
    .eq("id", attemptId)
    .single();

  if (!attempt) {
    return <main className="p-6">Attempt not found or not yours.</main>;
  }

  // test meta
  const { data: test } = await supabase
    .from("tests")
    .select("slug, name")
    .eq("id", attempt.test_id)
    .single();

  // answers
  const { data: answers } = await supabase
    .from("attempt_answers")
    .select("question_id, chosen_index, is_correct")
    .eq("attempt_id", attemptId);

  const ansMap = new Map(
    (answers ?? []).map((a: any) => [a.question_id, a])
  );
  const qIds = (answers ?? []).map((a: any) => a.question_id);

  if (qIds.length === 0) {
    return <main className="p-6">No answers found.</main>;
  }

  // question details
  const { data: qs } = await supabase
    .schema("api")
    .from("questions_public")
    .select("id, text, options, correct_index, explanation, subject, topic, lang")
    .in("id", qIds);

  const items = (qs ?? []).map((q: any) => ({ ...q, ans: ansMap.get(q.id) }));
  const total = items.length;
  const score = attempt.score ?? items.filter((i: any) => i.ans?.is_correct).length;
  const pct = Math.round((score / total) * 100);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="border rounded p-4 space-y-3">
        <h1 className="text-xl font-semibold">Result</h1>
        <div className="text-sm opacity-70">
          Score: <b>{score}</b> / {total} ({pct}%)
        </div>
        <div className="flex gap-2">
          {test?.slug && (
            <>
              <Link
                href={`/tests/${test.slug}`}
                className="inline-block border rounded px-3 py-1"
              >
                Retake test
              </Link>
              <Link
                href={`/tests/${test.slug}?mode=incorrect&src=${attemptId}`}
                className="inline-block border rounded px-3 py-1"
              >
                Weak topics drill
              </Link>
            </>
          )}
          <Link href="/tests" className="inline-block border rounded px-3 py-1">
            Back to Tests
          </Link>
        </div>
      </header>

      <ResultsList items={items} />
    </main>
  );
}
