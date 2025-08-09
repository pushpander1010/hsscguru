// src/app/practice/start/page.tsx
import { supabase } from "@/lib/supabaseClient";
import QuizRunner from "@/app/tests/[slug]/runner";

export default async function PracticeStart({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string; n?: string }>;
}) {
  const sp = (searchParams ? await searchParams : {}) || {};
  const topic = sp.topic ?? "";
  const n = Math.max(1, Math.min(Number(sp.n ?? "10") || 10, 50));

  if (!topic) {
    return (
      <main className="p-6">
        Missing topic. Go back to <a className="underline" href="/practice">Practice</a>.
      </main>
    );
  }

  // Use the 'practice' test row as the logical container for attempts
  const { data: test } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .eq("slug", "practice")
    .single();

  if (!test) {
    return <main className="p-6">Practice test container missing. Re-run the SQL seed for 'practice'.</main>;
  }

  // RPC: random questions by topic
  const { data: qs, error } = await supabase.rpc("random_questions_by_topic", {
    topic_in: topic,
    n,
  });

  if (error) {
    return <main className="p-6">Load error: {error.message}</main>;
  }
  if (!qs || qs.length === 0) {
    return <main className="p-6">No questions found for topic “{topic}”.</main>;
  }

  // Simple duration scaling (e.g., 1 min per question, min 5)
  const duration = Math.max(5, Math.min(60, qs.length));

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Practice — {topic} ({qs.length} Qs)</h1>
      <QuizRunner testId={test.id} duration={duration} questions={qs as any[]} />
    </main>
  );
}
