// src/app/tests/[slug]/start/QuizRunner.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { QRow } from "./page";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type QuizRunnerProps = {
  testId: string;
  duration: number; // minutes
  questions: QRow[];
};

export default function QuizRunner({ testId, duration, questions }: QuizRunnerProps) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const q of questions) init[q.id] = null;
    return init;
  });

  const total = questions.length;
  const answered = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );

  // Simple countdown timer (seconds)
  const [secsLeft, setSecsLeft] = useState<number>(duration * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setSecsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secsLeft === 0) {
      void submit(); // auto-submit on time up
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft]);

  const submit = async () => {
    // compute score
    let score = 0;
    for (const q of questions) {
      if (answers[q.id] === q.answer_index) score += 1;
    }

    // save attempt (adjust columns to your schema)
    const { data: attempt, error } = await supabase
      .schema("api")
      .from("attempts_public")
      .insert({
        test_id: testId,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        score,
      })
      .select("id")
      .single();

    if (error || !attempt) {
      // basic fallback
      alert("Failed to save attempt");
      return;
    }

    router.push(`/results/${attempt.id}`);
  };

  const onChoose = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const mm = Math.floor(secsLeft / 60);
  const ss = String(secsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          {answered}/{total} answered
        </div>
        <div className="text-sm font-semibold">
          Time left: {mm}:{ss}
        </div>
      </header>

      <ol className="space-y-4">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <li key={q.id} className="rounded-xl border border-white/10 p-4 bg-[--surface]/80">
              <div className="font-medium mb-3">
                Q{qi + 1}. {q.text}
              </div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, i) => {
                  const active = chosen === i;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => onChoose(q.id, i)}
                        className={[
                          "w-full text-left rounded-lg border p-2",
                          active
                            ? "border-white/30 bg-white/10"
                            : "border-white/10 hover:bg-white/5",
                        ].join(" ")}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-ghost" onClick={submit} disabled={secsLeft === 0}>
          Submit
        </button>
      </div>
    </div>
  );
}
