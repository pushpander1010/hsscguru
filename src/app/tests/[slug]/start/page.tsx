// src/app/tests/[slug]/start/page.tsx
import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabaseClient";
import QuizRunner from "@/app/tests/[slug]/runner";

type TestRow = {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number | null;
};

type TQRow = {
  question_id: string;
  order_index: number;
  marks: number | null;
};

type QRow = {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
};

export const dynamic = "force-dynamic";

export default async function StartTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1) Load the test
  const { data: testRow, error: testErr } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .eq("slug", slug)
    .single();

  if (testErr || !testRow) {
    return (
      <PageShell title="Start Test" subtitle="We couldn't load this test right now.">
        <div className="card">
          <p className="muted">Please go back and try again.</p>
        </div>
      </PageShell>
    );
  }

  const test = testRow as TestRow;
  const duration = Math.max(5, Math.min(180, test.duration_minutes ?? 30));

  // 2) Get the ordered question IDs for this test (from the join view)
  const { data: tqRows, error: tqErr } = await supabase
    .schema("api")
    .from("test_questions_public")
    .select("question_id,order_index,marks")
    .eq("test_id", test.id)
    .order("order_index", { ascending: true });

  if (tqErr || !tqRows || tqRows.length === 0) {
    return (
      <PageShell title={test.name} subtitle="No questions found for this test.">
        <div className="card">
          <p className="muted">Contact admin or try another test.</p>
        </div>
      </PageShell>
    );
  }

  const ordered = (tqRows as TQRow[]).sort((a, b) => a.order_index - b.order_index);
  const qids = ordered.map((r) => r.question_id);

  // 3) Fetch question details from questions_public
  const { data: qRows, error: qErr } = await supabase
    .schema("api")
    .from("questions_public")
    .select("*")
    .in("id", qids);

  if (qErr || !qRows || qRows.length === 0) {
    return (
      <PageShell title={test.name} subtitle="No questions found for this test.">
        <div className="card">
          <p className="muted">Contact admin or try another test.</p>
        </div>
      </PageShell>
    );
  }

  // 4) Reorder to match order_index and ensure required fields exist
  const byId = new Map((qRows as QRow[]).map((q) => [q.id, q]));
  const questions = ordered
    .map((row) => byId.get(row.question_id))
    .filter((q): q is QRow => !!q && Array.isArray(q.options));

  if (questions.length === 0) {
    return (
      <PageShell title={test.name} subtitle="No questions found for this test.">
        <div className="card">
          <p className="muted">Contact admin or try another test.</p>
        </div>
      </PageShell>
    );
  }

  // 5) Hand off to the client runner
  return (
    <PageShell title={test.name} subtitle="Good luck! Stay calm and manage your time.">
      <div className="card">
        <QuizRunner testId={test.id} duration={duration} questions={questions} />
      </div>
    </PageShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Start • ${slug}` };
}
