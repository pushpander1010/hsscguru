import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import PageShell from "@/components/PageShell";
import QuizRunner from "./QuizRunner";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

type QDbRow = {
  id: string;
  text: string;
  options: unknown;
  answer_index: number | null;
  answer?: string | null;
  explanation: string | null;
  test_id?: string;
  test_slug?: string;
  topic?: string | null;
};

function toFourOptions(o: unknown): [string, string, string, string] {
  let arr: string[] = [];
  if (Array.isArray(o)) {
    arr = o.map(String);
  } else if (typeof o === "string") {
    try {
      const parsed = JSON.parse(o);
      if (Array.isArray(parsed)) {
        arr = parsed.map(String);
      } else {
        arr = o.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      arr = o.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  const four = [...arr, "", "", "", ""].slice(0, 4);
  return [four[0], four[1], four[2], four[3]];
}

export default async function StartTestPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Server-side auth check
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(ROUTES.login);
  }

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
      <PageShell
        title="Test Not Found"
        subtitle="The test you're looking for doesn't exist."
      >
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="title text-2xl mb-4">Test Not Found</h2>
          <p className="muted mb-6">We couldn't find the test you're looking for.</p>
          <Link href="/tests" className="btn">
            Browse All Tests
          </Link>
        </div>
      </PageShell>
    );
  }

  // 2) Preferred: load questions via mapping table api.test_questions_public
  //    This follows your SQL that counts via tq.question_id per test_id
  type MapRow = { question_id: string };
  let qData: any[] | null = null;
  let lastErr: any = null;
  const { data: mapRows, error: mapErr } = await supabase
    .schema("api")
    .from("test_questions_public")
    .select("question_id")
    .eq("test_id", test.id);

  if (mapErr) {
    lastErr = mapErr;
  }

  if (!lastErr && Array.isArray(mapRows) && mapRows.length > 0) {
    const ids = (mapRows as MapRow[])
      .map((r) => r.question_id)
      .filter(Boolean);
    if (ids.length > 0) {
      const { data, error } = await supabase
        .schema("api")
        .from("questions_public")
        .select("*")
        .in("id", ids);
      if (error) {
        lastErr = error;
      } else {
        // Preserve the order from the mapping table if possible
        const positionById = new Map<string, number>();
        ids.forEach((id, idx) => positionById.set(String(id), idx));
        qData = (data ?? []).slice().sort((a: any, b: any) => {
          const pa = positionById.get(String(a.id)) ?? 0;
          const pb = positionById.get(String(b.id)) ?? 0;
          return pa - pb;
        });
      }
    }
  }

  // 3) Fallbacks if mapping table returned nothing
  //    We avoid selecting non-existent columns by using select("*") and filtering client-side later.
  const relaxed = slug.replace(/-/g, " ");
  type QueryRunner = () => Promise<{ data: any[] | null; error: any }>;
  const attempts: QueryRunner[] = [
    // A) by test_slug
    async () =>
      await supabase
        .schema("api")
        .from("questions_public")
        .select("*")
        .eq("test_slug", slug)
        .order("id", { ascending: true }),
    // B) by topic exact
    async () =>
      await supabase
        .schema("api")
        .from("questions_public")
        .select("*")
        .eq("topic", slug)
        .order("id", { ascending: true }),
    // C) by topic fuzzy
    async () =>
      await supabase
        .schema("api")
        .from("questions_public")
        .select("*")
        .ilike("topic", `%${relaxed}%`)
        .order("id", { ascending: true }),
  ];

  for (const run of attempts) {
    if (qData && qData.length > 0) break;
    const { data, error } = await run();
    if (error) {
      lastErr = error;
      continue;
    }
    if (Array.isArray(data) && data.length > 0) {
      qData = data;
      lastErr = null;
      break;
    }
  }

  if (lastErr) {
    return (
      <PageShell title={test.name} subtitle="Good luck! Stay calm and manage your time.">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="title text-2xl mb-4">Failed to Load Questions</h2>
          <p className="muted mb-6">There was an error loading the test questions.</p>
          <div className="alert-error text-sm">
            <strong>Error:</strong> {lastErr.message}
          </div>
        </div>
      </PageShell>
    );
  }

  const questions: QRow[] = (qData ?? []).map((r: QDbRow) => {
    const opts = toFourOptions(r.options);
    let computedAnswerIndex =
      r.answer_index != null ? Number(r.answer_index) : 0;
    // Some datasets store the correct answer as a string instead of index
    if ((r as any).answer_index == null && (r as any).answer != null) {
      const idx = opts.findIndex((o) => o === r.answer);
      computedAnswerIndex = idx >= 0 ? idx : 0;
    }
    return {
      id: r.id,
      text: r.text,
      options: opts,
      answer_index: computedAnswerIndex,
      explanation: r.explanation ?? null,
    };
  });

  const duration = test.duration_minutes ?? 30;

  if (questions.length === 0) {
    return (
      <PageShell title={test.name} subtitle="Good luck! Stay calm and manage your time.">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="title text-2xl mb-4">No Questions Found</h2>
          <p className="muted mb-6">This test doesn't have any questions yet.</p>
          <Link href="/tests" className="btn">
            Browse Other Tests
          </Link>
        </div>
      </PageShell>
    );
  }

  
  // 3) Hand off to client runner
  return (
    <PageShell title={test.name} subtitle="Good luck! Stay calm and manage your time.">
      <div className="card">
        <QuizRunner testId={test.id} duration={duration} questions={questions} />
      </div>
    </PageShell>
  );
}
