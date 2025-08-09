// src/app/practice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TopicRow = { topic: string };

export default function PracticePage() {
  const sp = useSearchParams();
  const selectedTopic = sp.get("topic") ?? "";
  const nParam = sp.get("n");
  const n = Number.isFinite(Number(nParam)) ? Number(nParam) : 10;

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .schema("api")
        .from("topics_public")
        .select("topic")
        .order("topic", { ascending: true });

      if (!active) return;

      if (error) {
        setErr("Failed to load topics");
        setTopics([]);
      } else {
        setTopics((data as TopicRow[]) ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold mb-6">Practice</h1>

      {loading ? (
        <div className="h-10 w-40 animate-pulse rounded bg-white/10" />
      ) : err ? (
        <p className="text-red-400">{err}</p>
      ) : (
        <div className="rounded-xl border border-white/10 p-6 bg-[--surface]/80 space-y-4">
          <label className="block text-sm">
            Topic
            <select
              className="mt-1 w-full rounded-lg bg-transparent border border-white/10 p-2"
              defaultValue={selectedTopic}
              onChange={(e) => {
                const next = new URL(window.location.href);
                next.searchParams.set("topic", e.target.value);
                next.searchParams.set("n", String(n));
                window.history.replaceState({}, "", next.toString());
              }}
            >
              <option value="" disabled>
                Select a topic
              </option>
              {topics.map((t) => (
                <option key={t.topic} value={t.topic}>
                  {t.topic}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Number of Questions
            <input
              type="number"
              min={1}
              max={50}
              defaultValue={n}
              className="mt-1 w-full rounded-lg bg-transparent border border-white/10 p-2"
              onChange={(e) => {
                const next = new URL(window.location.href);
                next.searchParams.set("topic", selectedTopic);
                next.searchParams.set("n", e.target.value);
                window.history.replaceState({}, "", next.toString());
              }}
            />
          </label>

          <button
            className="btn-ghost"
            onClick={() => {
              // navigate to your practice runner if needed
              const next = new URL(window.location.href);
              const topic = next.searchParams.get("topic");
              const count = next.searchParams.get("n");
              if (topic) {
                window.location.href = `/practice/run?topic=${encodeURIComponent(
                  topic
                )}&n=${encodeURIComponent(count ?? "10")}`;
              }
            }}
          >
            Start Practice
          </button>
        </div>
      )}
    </main>
  );
}
