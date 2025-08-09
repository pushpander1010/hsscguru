// src/app/practice/page.tsx
import { supabase } from "@/lib/supabaseClient";

export default async function PracticePage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const sp = (searchParams ? await searchParams : {}) || {};
  const selectedTopic = sp.topic;

  // load topics from view
  const { data: topics, error } = await supabase
    .schema("api")
    .from("topics_public")
    .select("*");

  if (error) {
    return <main className="p-6">Load error: {error.message}</main>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Practice — Choose Topic</h1>

      <form action="/practice/start" method="get" className="border rounded p-4 space-y-3">
        <label className="block text-sm font-medium">Topic</label>
        <select
          name="topic"
          required
          defaultValue={selectedTopic ?? ""}
          className="w-full border rounded p-2"
        >
          <option value="" disabled>Select a topic</option>
          {(topics ?? []).map((t: any) => (
            <option key={t.topic} value={t.topic}>{t.topic}</option>
          ))}
        </select>

        <label className="block text-sm font-medium">Number of questions</label>
        <input
          type="number"
          name="n"
          defaultValue={10}
          min={1}
          max={50}
          className="w-32 border rounded p-2"
        />

        <button className="rounded bg-black text-white px-4 py-2">Start Practice</button>
      </form>
    </main>
  );
}
