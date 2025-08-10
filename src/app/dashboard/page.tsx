// src/app/dashboard/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TestMini = { slug: string; name: string } | null;

type AttemptRow = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests: TestMini; // normalized to single object or null
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const typeFilter = typeof sp.type === "string" ? sp.type : undefined; // 'mock' | 'practice'
  const from = typeof sp.from === "string" ? sp.from : undefined; // YYYY-MM-DD
  const to = typeof sp.to === "string" ? sp.to : undefined; // YYYY-MM-DD
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const userEmail = userRes.user?.email ?? null;
  const meta = (userRes.user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (meta.name as string | undefined) ||
    (meta.full_name as string | undefined) ||
    ([meta.first_name, meta.last_name].filter(Boolean).join(" ") || undefined) ||
    (userEmail ? userEmail.split("@")[0] : undefined) ||
    undefined;

  type QueryRunner = () => Promise<{ data: any[] | null; error: any }>;
  const attemptsQueries: QueryRunner[] = [
    async () =>
      await supabaseAdmin
        .schema("api")
        .from("attempts_public")
        .select("id,test_id,started_at,finished_at,score,tests:tests_public(slug,name)")
        .order("started_at", { ascending: false }),
    async () =>
      await supabaseAdmin
        .schema("api")
        .from("attempts")
        .select("id,test_id,started_at,finished_at,score")
        .order("started_at", { ascending: false }),
    async () =>
      await supabaseAdmin
        .from("attempts")
        .select("id,test_id,started_at,finished_at,score")
        .order("started_at", { ascending: false }),
  ];

  let dataFound: any[] | null = null;
  let lastErr: any = null;
  for (const run of attemptsQueries) {
    const { data, error } = await run();
    if (!error && Array.isArray(data)) {
      dataFound = data;
      lastErr = null;
      break;
    }
    lastErr = error;
  }

  if (!dataFound) {
    return (
      <PageShell title="Dashboard" subtitle={displayName ? `Welcome, ${displayName}` : "You're browsing as guest"}>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="title text-2xl mb-4">Failed to Load Dashboard</h2>
          <p className="muted mb-6">There was an error loading your dashboard data.</p>
          <div className="alert-error text-sm">
            <strong>Error:</strong> {lastErr?.message || 'Unknown error occurred'}
          </div>
        </div>
      </PageShell>
    );
  }

  let rows: AttemptRow[] = [];
  if (dataFound.length > 0 && (dataFound as any[])[0].tests == null) {
    const testIds = Array.from(new Set((dataFound as any[]).map((r: any) => String(r.test_id))));
    const testsById = new Map<string, { slug: string; name: string }>();
    const testsBySlug = new Map<string, { slug: string; name: string }>();

    if (testIds.length > 0) {
      // First try: match attempts.test_id to tests_public.id
      const { data: byIdRows } = await supabaseAdmin
        .schema("api")
        .from("tests_public")
        .select("id,slug,name")
        .in("id", testIds);
      for (const t of byIdRows ?? []) {
        testsById.set(String((t as any).id), { slug: (t as any).slug, name: (t as any).name });
      }

      // Fallback: match attempts.test_id to tests_public.slug (for older rows storing slug)
      const unresolved = testIds.filter((tid) => !testsById.has(tid));
      if (unresolved.length > 0) {
        const { data: bySlugRows } = await supabaseAdmin
          .schema("api")
          .from("tests_public")
          .select("slug,name")
          .in("slug", unresolved);
        for (const t of bySlugRows ?? []) {
          testsBySlug.set(String((t as any).slug), { slug: (t as any).slug, name: (t as any).name });
        }
      }
    }

    rows = (dataFound as any[]).map((r: any) => {
      const key = String(r.test_id);
      const meta = testsById.get(key) ?? testsBySlug.get(key) ?? null;
      return {
        id: r.id,
        test_id: r.test_id,
        started_at: r.started_at ?? null,
        finished_at: r.finished_at ?? null,
        score: r.score ?? null,
        tests: meta,
      } as AttemptRow;
    });
  } else {
    rows = (dataFound as any[]).map((r: any) => ({
      id: r.id,
      test_id: r.test_id,
      started_at: r.started_at ?? null,
      finished_at: r.finished_at ?? null,
      score: r.score ?? null,
      tests: Array.isArray((r as any).tests) ? ((r as any).tests[0] ?? null) : ((r as any).tests ?? null),
    }));
  }

  // Apply optional filters (category and date range)
  let filtered = rows.slice();
  if (typeFilter === "mock" || typeFilter === "practice") {
    filtered = filtered.filter((r) => {
      const slug = ((r.tests as any)?.slug as string | undefined) ?? String(r.test_id);
      return typeFilter === "mock" ? /mock/i.test(slug) : /practice/i.test(slug);
    });
  }
  if (from) {
    const fromTs = Date.parse(from);
    if (!Number.isNaN(fromTs)) {
      filtered = filtered.filter((r) => {
        const t = r.started_at || r.finished_at;
        return t ? Date.parse(t) >= fromTs : false;
      });
    }
  }
  if (to) {
    const toTs = Date.parse(to);
    if (!Number.isNaN(toTs)) {
      filtered = filtered.filter((r) => {
        const t = r.started_at || r.finished_at;
        return t ? Date.parse(t) <= toTs : false;
      });
    }
  }

  return (
    <PageShell title="Dashboard" subtitle={displayName ? `Welcome, ${displayName}` : "You're browsing as guest"}>
      {/* Overview stats */}
      {(() => {
        const total = filtered.length;
        const scores = filtered.map((r) => r.score).filter((x): x is number => typeof x === "number");
        const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
        const best = scores.length ? Math.max(...scores) : 0;
        const last = filtered[0]?.finished_at || filtered[0]?.started_at || null;

        // activity last 7 days
        const now = new Date();
        const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const buckets = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (6 - i));
          return { key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: 0 };
        });
        const counts = new Map(buckets.map((b) => [b.key, b]));
        for (const r of filtered) {
          const t = r.finished_at || r.started_at;
          if (!t) continue;
          const d = new Date(t);
          const key = dayKey(d);
          const bucket = counts.get(key);
          if (bucket) bucket.count += 1;
        }
        const maxCount = Math.max(1, ...buckets.map((b) => b.count));

        // category breakdown (mock vs practice)
        const pickSlug = (r: AttemptRow) => ((r.tests as any)?.slug as string | undefined) ?? String(r.test_id);
        const mocks = filtered.filter((r) => /mock/i.test(pickSlug(r)));
        const practices = filtered.filter((r) => /practice/i.test(pickSlug(r)));
        const avgOf = (arr: AttemptRow[]) => {
          const xs = arr.map((r) => r.score).filter((x): x is number => typeof x === "number");
          return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;
        };

        return (
          <div className="space-y-6 mb-8">
            {/* Main Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <div className="text-sm muted">Total Attempts</div>
                    <div className="text-3xl font-bold text-white">{total}</div>
                  </div>
                </div>
              </div>
              
              <div className="card p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <div className="text-sm muted">Average Score</div>
                    <div className="text-3xl font-bold text-white">{avg}</div>
                  </div>
                </div>
              </div>
              
              <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <div className="text-sm muted">Best Score</div>
                    <div className="text-3xl font-bold text-white">{best}</div>
                  </div>
                </div>
              </div>
              
              <div className="card p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <div className="text-sm muted">Last Attempt</div>
                    <div className="text-lg font-semibold text-white">
                      {last ? new Date(last).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-6 bg-gradient-to-br from-brand-500/10 to-brand-600/10 border-brand-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <div>
                    <div className="text-sm muted">Mock Tests</div>
                    <div className="text-2xl font-bold text-white">{mocks.length}</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-brand-400">{avgOf(mocks)}%</div>
                <div className="text-sm muted">Average Score</div>
              </div>
              
              <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🧠</span>
                  </div>
                  <div>
                    <div className="text-sm muted">Practice Tests</div>
                    <div className="text-2xl font-bold text-white">{practices.length}</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-400">{avgOf(practices)}%</div>
                <div className="text-sm muted">Average Score</div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="card p-6 bg-gradient-to-br from-slate-500/10 to-slate-600/10 border-slate-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <div className="title text-lg">Activity Last 7 Days</div>
                  <div className="text-sm muted">Your study consistency</div>
                </div>
              </div>
              <div className="flex items-end gap-3 h-20">
                {buckets.map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="relative w-full">
                      <div
                        className="w-full rounded-t-lg transition-all duration-300 bg-gradient-to-t from-brand-500 to-brand-600"
                        style={{ height: `${(b.count / maxCount) * 100}%` }}
                        title={`${b.label}: ${b.count} attempts`}
                      />
                      {b.count > 0 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white bg-brand-500 px-2 py-1 rounded">
                          {b.count}
                        </div>
                      )}
                    </div>
                    <div className="text-xs muted font-medium">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Actions */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <div className="title text-lg">Quick Actions</div>
            <div className="text-sm muted">Jump into your next study session</div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/tests" className="group">
            <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-3">📝</div>
                <div className="title text-lg mb-2">Mock Test</div>
                <div className="text-sm muted">Timed challenge mode</div>
              </div>
            </div>
          </Link>
          
          <Link href="/practice" className="group">
            <div className="card p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 hover:border-green-500/40 transition-all duration-200 hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-3">🧠</div>
                <div className="title text-lg mb-2">Practice</div>
                <div className="text-sm muted">Learn at your pace</div>
              </div>
            </div>
          </Link>
          
          <Link href="/haryana-updates" className="group">
            <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-3">📰</div>
                <div className="title text-lg mb-2">News</div>
                <div className="text-sm muted">Latest updates</div>
              </div>
            </div>
          </Link>
          
          <Link href="/notes" className="group">
            <div className="card p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:border-orange-500/40 transition-all duration-200 hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-3">📚</div>
                <div className="title text-lg mb-2">Notes</div>
                <div className="text-sm muted">Study material</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Continue where you left off */}
      {(() => {
        const latest = filtered[0] ?? rows[0];
        const slug = ((latest?.tests as any)?.slug as string | undefined) ?? undefined;
        if (!latest) return null;
        return (
          <div className="card p-6 bg-gradient-to-r from-brand-500/10 to-purple-600/10 border-brand-500/20 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <div className="text-sm muted mb-1">Continue where you left off</div>
                  <div className="title text-lg">
                    {(() => {
                      const name = (latest?.tests as any)?.name as string | undefined;
                      const id = String(latest?.test_id ?? "");
                      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
                      return name || slug || (isUuid ? "Mock Test" : id);
                    })()}
                  </div>
                </div>
              </div>
              <Link href={slug ? `/tests/${slug}/start` : "/tests"} className="btn bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700">
                Resume Test
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Recent Attempts */}
      {rows.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="title text-2xl mb-4">No Attempts Yet</h2>
          <p className="muted mb-6">Start your learning journey by taking your first test!</p>
          <Link href="/tests" className="btn bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700">
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <div className="title text-lg">Recent Attempts</div>
              <div className="text-sm muted">Your test history and performance</div>
            </div>
          </div>
          
          <div className="space-y-4">
            {filtered.map((r, idx) => (
              <div
                key={r.id}
                className="card p-4 border border-white/10 hover:border-white/20 transition-all duration-200 hover:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="title">
                        {(() => {
                          const slug = (r.tests as any)?.slug as string | undefined;
                          const name = (r.tests as any)?.name as string | undefined;
                          const id = String(r.test_id || "");
                          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
                          return name || slug || (isUuid ? "Mock Test" : id);
                        })()}
                      </div>
                      <div className="text-sm muted">
                        Started: {r.started_at ? new Date(r.started_at).toLocaleDateString() : "-"} | 
                        Finished: {r.finished_at ? new Date(r.finished_at).toLocaleDateString() : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm muted">Score</div>
                    <div className="text-2xl font-bold text-white">{r.score ?? "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
