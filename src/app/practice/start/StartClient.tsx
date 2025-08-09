// app/practice/start/StartClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  options: string[] | null;
  answer: string | null;        // store key or text (match your table)
  explanation: string | null;
  topic?: string | null;
};

export default function StartClient({
  topic,
  limit,
}: {
  topic: string;
  limit: number;
}) {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      // Adjust table/columns to your schema
      const { data, error } = await supabase
        .schema("api")
        .from("questions_public")
        .select("id,text,options,answer,explanation,topic")
        .ilike("topic", topic) // exact match? switch to .eq("topic", topic)
        .limit(limit);

      if (!mounted) return;
      if (error) {
        setErr(error.message);
        setQuestions([]);
      } else {
        setQuestions((data ?? []).map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : (q.options ? (q.options as any) : []),
        })));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [topic, limit]);

  const score = useMemo(() => {
    if (!submitted) return null as number | null;
    let s = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (!a) continue;
      if (q.answer != null && a === q.answer) s += 1;
    }
    return s;
  }, [submitted, answers, questions]);

  function selectAnswer(qid: string, val: string) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          className="rounded border px-3 py-1"
          onClick={() => router.push(`/practice?topic=${encodeURIComponent(topic)}&n=${limit}`)}
        >
          ← Change selection
        </button>
        {submitted && typeof score === "number" ? (
          <div className="ml-auto text-sm">
            Score: <span className="font-semibold">{score}</span> / {questions.length}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div>Loading questions…</div>
      ) : err ? (
        <div className="text-red-600">Failed to load: {err}</div>
      ) : questions.length === 0 ? (
        <div className="rounded border p-4">
          No questions found for <b>{topic}</b>.{" "}
          <a className="text-blue-600 underline" href="/practice">
            Pick another topic
          </a>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded border p-4">
              <div className="mb-3 font-medium">
                Q{idx + 1}. {q.text}
              </div>
              <div className="space-y-2">
                {(q.options ?? []).map((opt, i) => {
                  const id = `${q.id}_${i}`;
                  return (
                    <label key={id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={(answers[q.id] ?? "") === opt}
                        onChange={(e) => selectAnswer(q.id, e.target.value)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {submitted ? (
                <div className="mt-3 text-sm">
                  <div>
                    Correct answer:{" "}
                    <span className="font-semibold">{q.answer ?? "—"}</span>
                  </div>
                  {q.explanation ? (
                    <div className="mt-1 opacity-80">{q.explanation}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}

          {!submitted ? (
            <button type="submit" className="rounded px-4 py-2 bg-black text-white">
              Submit
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}
