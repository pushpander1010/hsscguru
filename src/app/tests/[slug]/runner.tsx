"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Question = {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
};

type Draft = {
  v: 1;
  idx: number;
  secsLeft: number;
  answers: Record<string, number | null>;
  marked: Record<string, boolean>;
  timeSpent: Record<string, number>;
};

const saveDraft = (testId: string, d: Draft) =>
  localStorage.setItem(`draft:${testId}`, JSON.stringify(d));

const loadDraft = (testId: string): Draft | null => {
  try {
    const raw = localStorage.getItem(`draft:${testId}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.v === 1 ? d : null;
  } catch {
    return null;
  }
};

export default function QuizRunner({
  testId,
  duration,
  questions,
}: {
  testId: string;
  duration: number; // minutes
  questions: Question[];
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [secsLeft, setSecsLeft] = useState(duration * 60);
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitted = useRef(false);
  const tickRef = useRef<number | null>(null);
  const lastTickQid = useRef<string | null>(null);

  const current = questions[idx];
  const total = questions.length;

  // Load any saved draft
  useEffect(() => {
    const d = loadDraft(testId);
    if (d) {
      setIdx(Math.min(d.idx ?? 0, Math.max(total - 1, 0)));
      setSecsLeft(d.secsLeft ?? duration * 60);
      setAnswers(d.answers ?? {});
      setMarked(d.marked ?? {});
      setTimeSpent(d.timeSpent ?? {});
    } else {
      // init timeSpent keys to 0
      const init: Record<string, number> = {};
      for (const q of questions) init[q.id] = 0;
      setTimeSpent(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Timer + per-question time tracking
  useEffect(() => {
    function onTick() {
      setSecsLeft((s) => {
        if (s <= 0) return 0;
        return s - 1;
      });
      // increment time for current question
      const qid = questions[idx]?.id;
      if (qid) {
        setTimeSpent((t) => ({ ...t, [qid]: (t[qid] ?? 0) + 1 }));
        lastTickQid.current = qid;
      }
    }
    const id = window.setInterval(onTick, 1000);
    tickRef.current = id as unknown as number;
    return () => clearInterval(id);
  }, [idx, questions]);

  // Auto-submit on timeout
  useEffect(() => {
    if (secsLeft === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft]);

  // Warn before leaving page with progress
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // show browser prompt
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Autosave draft (throttled-ish by relying on React batching)
  useEffect(() => {
    const d: Draft = { v: 1, idx, secsLeft, answers, marked, timeSpent };
    try {
      saveDraft(testId, d);
    } catch {}
  }, [testId, idx, secsLeft, answers, marked, timeSpent]);

  const mmss = useMemo(() => {
    const m = Math.floor(secsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secsLeft]);

  async function ensureAuthed() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      alert(error.message);
      return false;
    }
    if (!data.user) {
      router.push("/login");
      return false;
    }
    return true;
  }

  function setChoice(qid: string, i: number) {
    setAnswers((a) => ({ ...a, [qid]: i }));
  }

  function clearChoice(qid: string) {
    setAnswers((a) => ({ ...a, [qid]: null }));
  }

  function toggleMark(qid: string) {
    setMarked((m) => ({ ...m, [qid]: !m[qid] }));
  }

  function jumpTo(i: number) {
    if (i >= 0 && i < total) setIdx(i);
  }

  async function submit(auto = false) {
    if (submitting) return;
    if (!(await ensureAuthed())) return;

    if (!auto) {
      const sure = window.confirm("Submit your answers now?");
      if (!sure) return;
    }

    setSubmitting(true);

    // create attempt
    const { data: attempt, error: aErr } = await supabase
      .from("attempts")
      .insert({ test_id: testId })
      .select("id")
      .single();

    if (aErr || !attempt) {
      setSubmitting(false);
      alert(aErr?.message || "Failed to start attempt");
      return;
    }

    // prepare rows with time spent
    const rows = questions.map((q) => {
      const chosen = answers[q.id] ?? null;
      return {
        attempt_id: attempt.id,
        question_id: q.id,
        chosen_index: chosen,
        is_correct: chosen === q.correct_index,
        time_spent_sec: Math.max(0, Math.min(36000, timeSpent[q.id] ?? 0)), // clamp just in case
      };
    });

    // insert answers
    const { error: insErr } = await supabase.from("attempt_answers").insert(rows);
    if (insErr) {
      setSubmitting(false);
      alert(insErr.message);
      return;
    }

    // score + finish
    const score = rows.filter((r) => r.is_correct).length;
    const { error: upErr } = await supabase
      .from("attempts")
      .update({ finished_at: new Date().toISOString(), score })
      .eq("id", attempt.id);
    if (upErr) console.error(upErr);

    // clear draft
    try {
      localStorage.removeItem(`draft:${testId}`);
    } catch {}

    router.replace(`/results/${attempt.id}`);
  }

  if (!current) {
    return <div className="p-6 border rounded">No questions in this test yet.</div>;
  }

  // Palette helpers
  function tileClass(q: Question, i: number) {
    const answered = answers[q.id] !== null && answers[q.id] !== undefined;
    const isCurrent = i === idx;
    const isMarked = marked[q.id];
    const base = "min-w-9 h-9 px-2 flex items-center justify-center rounded border text-sm";
    if (isCurrent) return `${base} border-black font-semibold`;
    if (isMarked && answered) return `${base} border-purple-600 bg-purple-50`;
    if (isMarked) return `${base} border-purple-600`;
    if (answered) return `${base} border-green-600 bg-green-50`;
    return `${base} border-gray-300`;
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 justify-between p-3 border rounded">
        <div className="flex items-center gap-3">
          <div>
            Question {idx + 1} / {total}
          </div>
          <div className="text-xs opacity-70">
            Answered:{" "}
            {
              Object.values(answers).filter((v) => v !== null && v !== undefined)
                .length
            }{" "}
            / {total}
          </div>
        </div>
        <div aria-label="timer" className="text-lg">
          ⏱ {mmss}
        </div>
      </div>

      {/* Palette */}
      <div className="border rounded p-3">
        <div className="text-sm font-medium mb-2">Question Palette</div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={tileClass(q, i)}
              onClick={() => jumpTo(i)}
              title={
                (marked[q.id] ? "Marked • " : "") +
                (answers[q.id] != null ? "Answered" : "Unanswered")
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs opacity-70 flex gap-4">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 border border-green-600 bg-green-50 rounded-sm" />{" "}
            Answered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 border border-purple-600 rounded-sm" />{" "}
            Marked
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 border border-gray-300 rounded-sm" />{" "}
            Unanswered
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="border rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium">Q{idx + 1}. {current.text}</p>
          <button
            className={`text-sm border rounded px-2 py-1 ${marked[current.id] ? "bg-purple-600 text-white border-purple-600" : ""}`}
            onClick={() => toggleMark(current.id)}
          >
            {marked[current.id] ? "Unmark" : "Mark for Review"}
          </button>
        </div>

        <div className="space-y-2">
          {current.options.map((opt, i) => {
            const checked = answers[current.id] === i;
            return (
              <label
                key={i}
                className={`flex items-center gap-2 border rounded p-2 cursor-pointer ${
                  checked ? "border-black" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name={current.id}
                  checked={checked}
                  onChange={() => setChoice(current.id, i)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            className="text-sm border rounded px-2 py-1"
            onClick={() => clearChoice(current.id)}
          >
            Clear choice
          </button>
          <span className="text-xs opacity-70 ml-auto">
            Time on this question: {Math.floor((timeSpent[current.id] ?? 0) / 60)}m {((timeSpent[current.id] ?? 0) % 60)}s
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          disabled={idx === 0}
          onClick={() => setIdx((i) => i - 1)}
          className="border rounded px-4 py-2 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={idx === total - 1}
          onClick={() => setIdx((i) => i + 1)}
          className="border rounded px-4 py-2 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting}
          className="ml-auto bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
