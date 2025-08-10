// src/app/results/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AttemptRow = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests?: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

export const dynamic = "force-dynamic";

export default async function ResultsIndexPage() {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const userEmail = userRes.user?.email ?? null;

  // Fetch attempts (most recent first). Try view first, then base tables
  type Run = () => Promise<{ data: AttemptRow[] | null; error: any }>;
  const runs: Run[] = [
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("attempts_public")
        .select("id,test_id,started_at,finished_at,score,tests:tests_public(slug,name)")
        .order("started_at", { ascending: false })
        .limit(50);
      return { data: (data as AttemptRow[]) ?? null, error };
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("attempts")
        .select("id,test_id,started_at,finished_at,score")
        .order("started_at", { ascending: false })
        .limit(50);
      return { data: (data as AttemptRow[]) ?? null, error };
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from("attempts")
        .select("id,test_id,started_at,finished_at,score")
        .order("started_at", { ascending: false })
        .limit(50);
      return { data: (data as AttemptRow[]) ?? null, error };
    },
  ];

  let rows: AttemptRow[] = [];
  let lastErr: any = null;
  for (const run of runs) {
    const { data, error } = await run();
    if (!error && Array.isArray(data)) {
      rows = data;
      lastErr = null;
      break;
    }
    lastErr = error;
  }

  // Enrich test names if join was not available
  if (rows.length > 0 && rows[0].tests == null) {
    const ids = Array.from(new Set(rows.map((r) => String(r.test_id))));
    const { data: testsRows } = await supabaseAdmin
      .schema("api")
      .from("tests_public")
      .select("id,slug,name")
      .in("id", ids);
    const byId = new Map<string, { slug: string; name: string }>();
    for (const t of (testsRows ?? []) as any[]) {
      byId.set(String(t.id), { slug: t.slug, name: t.name });
    }
    rows = rows.map((r) => ({
      ...r,
      tests: byId.get(String(r.test_id)) ?? null,
    }));
  }

  const friendlyName = (() => {
    const meta = (userRes.user?.user_metadata ?? {}) as Record<string, unknown>;
    return (
      (meta.name as string | undefined) ||
      (meta.full_name as string | undefined) ||
      ([meta.first_name, meta.last_name].filter(Boolean).join(" ") || undefined) ||
      (userEmail ? userEmail.split("@")[0] : undefined) ||
      undefined
    );
  })();

  return (
    <PageShell title="Results" subtitle={friendlyName ? `Welcome, ${friendlyName}` : "You're browsing as guest"}>
      {lastErr ? (
        <div className="text-red-400 text-sm mb-4">{String(lastErr.message)}</div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-6 bg-[--surface]/80">
          <p className="text-white/70">No results yet.</p>
          <div className="mt-3">
            <Link href="/tests" className="btn-ghost">Start a test</Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const t = Array.isArray(r.tests) ? r.tests[0] : (r.tests as any);
            return (
              <li key={r.id} className="rounded-xl border border-white/10 p-4 bg-[--surface]/80 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t?.name ?? "Unknown Test"}</div>
                  <div className="text-xs text-white/60">
                    Started: {r.started_at ?? "-"} | Finished: {r.finished_at ?? "-"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">Score: <span className="font-semibold">{r.score ?? "-"}</span></div>
                  <Link href={`/results/${r.id}`} className="btn-ghost">View</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}


