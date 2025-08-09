// src/app/tests/page.tsx
import { supabase } from "@/lib/supabaseClient";

type TestRow = {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number | null;
  created_at: string;
};

export default async function TestsPage() {
  const { data, error } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-3">Mock Tests</h1>
        <div className="p-3 border rounded text-red-600 text-sm">
          DB error: {error.message}
        </div>
      </main>
    );
  }

  const tests = (data ?? []) as TestRow[];

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Mock Tests</h1>

      <a href="/practice" className="block border rounded p-4 hover:bg-gray-50">
        <div className="font-medium">🧠 Practice by Topic</div>
        <div className="text-sm opacity-70">Random questions from a topic</div>
      </a>

      {tests.length === 0 ? (
        <div className="p-3 border rounded">No tests found.</div>
      ) : (
        tests.map((t) => (
          <a
            key={t.id}
            href={`/tests/${t.slug}`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <div className="font-medium">{t.name}</div>
            <div className="text-sm opacity-70">
              {(t.duration_minutes ?? 30)} minutes
            </div>
          </a>
        ))
      )}
    </main>
  );
}
