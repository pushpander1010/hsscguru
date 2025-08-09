// src/app/practice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabaseClient";

type Topic = { topic: string };

export default function PracticePage() {
  const sp = useSearchParams();
  const selectedTopic = sp.get("topic") ?? "";
  const [topics, setTopics] = useState<Topic[]>([]);

 useEffect(() => {
  async function loadTopics() {
    try {
      const { data } = await supabase
        .schema("api")
        .from("topics_public")
        .select("topic")
        .order("topic", { ascending: true });

      setTopics(data ?? []);
    } catch {
      setTopics([]);
    }
  }

  loadTopics();
}, []);


  return (
    <PageShell
      title="Practice - Choose Topic"
      subtitle="Pick a topic and the number of questions to begin."
      actions={
        <Link className="btn-ghost" href={ROUTES.dashboard}>
          ← Back to Dashboard
        </Link>
      }
    >
      {/* Center the card and keep padding modest */}
      <form action="/practice/start" method="get" className="card w-full max-w-lg mx-auto space-y-4">
        <div>
          <label className="label">Topic</label>
          <div className="select-wrap">
            <select
              name="topic"
              required
              defaultValue={selectedTopic}
              className="select"
            >
              <option value="" disabled>Select a topic</option>
              {topics.map((t) => (
                <option key={t.topic} value={t.topic}>
                  {t.topic}
                </option>
              ))}
            </select>
            <span className="select-caret">▼</span>
          </div>
          <p className="muted text-xs mt-1">Topics are curated from your public catalog.</p>
        </div>

        <div>
          <label className="label">Number of questions</label>
          <input
            type="number"
            name="n"
            defaultValue={10}
            min={1}
            max={50}
            className="input w-32"
          />
          <p className="muted text-xs mt-1">Between 1 and 50.</p>
        </div>

        <div className="pt-1">
          <button className="btn" type="submit">Start Practice</button>
        </div>
      </form>
    </PageShell>
  );
}
