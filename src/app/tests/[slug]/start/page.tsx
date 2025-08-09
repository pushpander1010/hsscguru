// src/app/tests/[slug]/start/page.tsx
import { createSupabaseServer } from "@/lib/supabaseServer";
import PageShell from "@/components/PageShell";
import QuizRunner from "./QuizRunner";

type TestRow = {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number | null;
};

export type QRow = {
  id: string;
  text: string;
  options: [string, string, string, string];
  answer_index: number; // 0..3
  explanation: string | null;
};

export default async function StartTestPage({
  params,
}: {
  // ⬇️ Next.js dynamic API: params is async — await it
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ required in Next 15+

  const supabase = await createSupabaseServer();

  // 1) Load test by slug
  const { data: testData, error: tErr } = await supabase
    .schema("api")
    .from("tests_public")
    .select("id,slug,name,duration_minutes")
    .eq("slug", slug)
    .single();

  const test = (testData ?? null) as TestRow | null;

  if (tErr || !test) {
    return (
      <PageShell title="Test not found" subtitle="Please go back and choose another test.">
        <div className="card">We couldn&apos;t find this test.</div>
      </PageShell>
    );
  }

  // 2) Load questions for this test
  const { data: qData, error: qErr } = await supabase
    .schema("api")
    .from("questions_public")
    .select("id,text,options,answer_index,explanation")
    .eq("test_slug", slug);

  if (qErr) {
    return (
      <PageShell title={test.name} subtitle="Good luck! Stay calm and manage your time.">
        <div className="card text-red-400">Failed to load questions.</div>
      </PageShell>
    );
  }

  const questions = (qData ?? []) as QRow[];
  const duration = test.duration_minutes ?? 30; // default 30 mins if null

  // 3) Hand off to the client runner
  return (
    <PageShell title={test.name} subtitle="Good luck! Stay calm and manage your time.">
      <div className="card">
        <QuizRunner testId={test.id} duration={duration} questions={questions} />
      </div>
    </PageShell>
  );
}
