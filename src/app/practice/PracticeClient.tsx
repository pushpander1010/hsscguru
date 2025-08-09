// app/practice/PracticeClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TopicRow = { topic: string };

export default function PracticeClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const selectedTopic = sp.get("topic") ?? "";
  const nFromUrl = sp.get("n");
  const nDefault = useMemo(() => {
    const n = Number(nFromUrl ?? 10);
    return Number.isFinite(n) && n > 0 ? n : 10;
  }, [nFromUrl]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .schema("api")
        .from("topics_public")
        .select("topic")
        .order("topic", { ascending: true });
      if (!mounted) return;
      if (error) setErr(error.message);
      setTopics(data ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const topic = String(fd.get("topic") ?? "");
    const n = String(fd.get("n") ?? "10");
    if (!topic) return;
    router.push(`/practice/start?topic=${encodeURIComponent(topic)}&n=${encodeURIComponent(n)}`);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm mb-1">Topic</label>
        {loading ? (
          <div className="text-sm opacity-70">Loading topics…</div>
        ) : err ? (
          <div className="text-sm text-red-600">Failed to load topics: {err}</div>
        ) : (
          <select
            name="topic"
            defaultValue={selectedTopic}
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="" disabled>
              Select a topic…
            </option>
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1">Number of questions</label>
        <input
          type="number"
          name="n"
          min={1}
          max={100}
          defaultValue={nDefault}
          className="w-32 rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded px-4 py-2 bg-black text-white"
        disabled={loading || !!err}
      >
        Start practice
      </button>
    </form>
  );
}
