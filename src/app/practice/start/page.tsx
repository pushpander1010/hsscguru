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
      <main className="page-container">
        <p className="error-text">
          Missing topic. Go back to{" "}
          <a className="page-link" href="/practice">
            Practice
          </a>
          .
        </p>
      </main>
    );
  }

  const { data: test } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .eq("slug", "practice")
    .single();

  if (!test) {
    return (
      <main className="page-container">
        <p className="error-text">
          Practice test container missing. Re-run the SQL seed for 'practice'.
        </p>
      </main>
    );
  }

  const { data: qs, error } = await supabase.rpc(
    "random_questions_by_topic",
    { topic_in: topic, n }
  );

  if (error) {
    return (
      <main className="page-container">
        <p className="error-text">Load error: {error.message}</p>
      </main>
    );
  }

  if (!qs || qs.length === 0) {
    return (
      <main className="page-container">
        <p className="error-text">
          No questions found for topic “{topic}”.
        </p>
      </main>
    );
  }

  const duration = Math.max(5, Math.min(60, qs.length));

  return (
    <main className="page-container">
      <h1 className="page-heading">
        Practice - {topic} ({qs.length} Qs)
      </h1>
      <QuizRunner
        testId={test.id}
        duration={duration}
        questions={qs as any[]}
      />
    </main>
  );
}
