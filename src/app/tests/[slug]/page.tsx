// src/app/tests/[slug]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import QuizRunner from "./runner";

type SP = { mode?: string; src?: string };

export default async function TestPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SP>;
}) {
  const { slug } = await props.params;
  const sp: SP = (props.searchParams ? await props.searchParams : {}) || {};
  const mode = sp.mode;
  const srcAttemptId = sp.src;

  const { data: test, error: tErr } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .eq("slug", slug)
    .single();

  if (tErr || !test) return <main className="p-6">Test not found.</main>;

  const { data: tq, error: qErr } = await supabase
    .schema("api")
    .from("test_questions_public")
    .select("question_id, order_index")
    .eq("test_id", test.id)
    .order("order_index");

  if (qErr) return <main className="p-6">Load error: {qErr.message}</main>;

  let ids = (tq ?? []).map((x: any) => x.question_id);

  if (mode === "incorrect" && srcAttemptId) {
    const { data: incorrect } = await supabase
      .from("attempt_answers")
      .select("question_id")
      .eq("attempt_id", srcAttemptId)
      .eq("is_correct", false);
    const bad = new Set((incorrect ?? []).map((r: any) => r.question_id));
    ids = ids.filter((id) => bad.has(id));
    if (ids.length === 0) {
      return (
        <main className="p-6">
          <h1 className="text-xl font-semibold mb-3">{test.name}</h1>
          <p>No weak topics found 🎉</p>
          <a href={`/tests/${test.slug}`} className="inline-block mt-4 border rounded px-3 py-1">
            Take full test
          </a>
        </main>
      );
    }
  }

  const { data: qs, error: sErr } = await supabase
    .schema("api")
    .from("questions_public")
    .select("id, text, options, correct_index")
    .in("id", ids);

  if (sErr) return <main className="p-6">Load error: {sErr.message}</main>;

  const ordered = ids.map((id) => (qs ?? []).find((q: any) => q.id === id)).filter(Boolean);

  const duration =
    mode === "incorrect"
      ? Math.max(5, Math.ceil((ids.length / 100) * (test.duration_minutes || 30)))
      : test.duration_minutes || 30;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">
        {test.name}{mode === "incorrect" ? " — Weak Topics Drill" : ""}
      </h1>
      <QuizRunner testId={test.id} duration={duration} questions={ordered as any[]} />
    </main>
  );
}
