// src/app/tests/[slug]/runner.tsx
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

  const mountedRef = useRef(true);
  const autoSubmitted = useRef(false);
  const intervalIdRef = useRef<number | null>(null);

  const current = questions[idx];
  const total = questions.length;

  // Guard: if no questions, show empty state
  if (!questions || questions.length === 0) {
    return <div className="card">No questions in this test yet.</div>;
  }

  // Load any saved draft or init timeSpent
  useEffect(() => {
    mountedRef.current = true;

    const d = loadDraft(testId);
    if (d) {
      setIdx(Math.min(d.idx ?? 0, Math.max(total - 1, 0)));
      setSecsLeft(d.secsLeft ?? duration * 60);
      setAnswers(d.answers ?? {});
      setMarked(d.marked ?? {});
      setTimeSpent(d.timeSpent ?? {});
    } else {
      const init: Record<string, number> = {};
      for (const q of questions) init[q.id] = 0;
      setTimeSpent(init);
    }

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, total]);

  // If the question set changes length (rare), keep idx in range
  useEffect(() => {
    if (idx > total - 1) setIdx(Math.max(total - 1, 0));
  }, [idx, total]);

  // Timer + per-question time tracking
  useEffect(() => {
    function onTick() {
      setSecsLeft((s) => (s <= 0 ? 0 : s - 1));
      const qid = questions[idx]?.id;
      if (qid) {
        setTimeSpent((t) => ({ ...t, [qid]: (t[qid] ?? 0) + 1 }));
      }
    }
    const id = window.setInterval(onTick, 1000);
    intervalIdRef.current = id as unknown as number;
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [idx, questions]);

  // Auto-submit on timeout
  useEffect(() => {
    if (secsLeft === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      // stop ticking immediately
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft]);

  // Warn before leaving page with progress (until we submit)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (submitting) return; // don't block if we're submitting/navigating
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submitting]);

  // Autosave draft
  useEffect(() => {
    const d: Draft = { v: 1, idx, secsLeft, answers, marked, timeSpent };
    try {
      saveDraft(testId, d);
    } catch {}
  }, [testId, idx, secsLeft, answers, marked, timeSpent]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null && v !== undefined).length,
    [answers]
  );

  const mmss = useMemo(() => {
    const m = Math.floor(secsLeft / 60).toString().padStart(2, "0");
    const s = (secsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secsLeft]);

  async function ensureAuthed() {
    // quick path: session
    const sessionRes = await supabase.auth.getSession().catch(() => null);
    const userFast = sessionRes?.data?.session?.user;
    if (userFast) return true;

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

  // Keyboard shortcuts: arrows for prev/next, 1-9 to select, M to mark
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (submitting) return;
      if (e.key === "ArrowLeft") {
        if (idx > 0) setIdx((i) => i - 1);
      } else if (e.key === "ArrowRight") {
        if (idx < total - 1) setIdx((i) => i + 1);
      } else if (e.key.toLowerCase() === "m") {
        const qid = questions[idx]?.id;
        if (qid) toggleMark(qid);
      } else if (/^[1-9]$/.test(e.key)) {
        const choice = parseInt(e.key, 10) - 1;
        const q = questions[idx];
        if (q && q.options[choice] != null) setChoice(q.id, choice);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, total, questions, submitting]);

  async function submit(auto = false) {
    if (submitting) return;
    setSubmitting(true);

    // stop ticking immediately (avoid post-submit increments)
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (!(await ensureAuthed())) {
      setSubmitting(false);
      return;
    }

    if (!auto) {
      const sure = window.confirm("Submit your answers now?");
      if (!sure) {
        setSubmitting(false);
        return;
      }
    }

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

    // insert answers
    const rows = questions.map((q) => {
      const chosen = answers[q.id] ?? null;
      return {
        attempt_id: attempt.id,
        question_id: q.id,
        chosen_index: chosen,
        is_correct: chosen === q.correct_index,
        time_spent_sec: Math.max(0, Math.min(36000, timeSpent[q.id] ?? 0)),
      };
    });

    const { error: insErr } = await supabase.from("attempt_answers").insert(rows);
    if (insErr) {
      setSubmitting(false);
      alert(insErr.message);
      return;
    }

    // finish attempt
    const score = rows.filter((r) => r.is_correct).length;
    const { error: upErr } = await supabase
      .from("attempts")
      .update({ finished_at: new Date().toISOString(), score })
      .eq("id", attempt.id);
    if (upErr) console.error(upErr);

    try {
      localStorage.removeItem(`draft:${testId}`);
    } catch {}

    if (mountedRef.current) {
      router.replace(`/results/${attempt.id}`);
    }
  }

  // Palette tile class builder
  function tileClass(q: Question, i: number) {
    const answered = answers[q.id] !== null && answers[q.id] !== undefined;
    const isCurrent = i === idx;
    const isMarked = !!marked[q.id];
    return [
      "palette-tile",
      isCurrent && "is-current",
      isMarked && "is-marked",
      answered && "is-answered",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="runner-bar">
        <div className="runner-meta">
          <div>Question {idx + 1} / {total}</div>
          <div className="runner-counter">
            Answered: {answeredCount} / {total}
          </div>
        </div>
        <div aria-label="timer" className="runner-timer">⏱ {mmss}</div>
      </div>

      {/* Palette */}
      <div className="palette">
        <div className="palette-title">Question Palette</div>
        <div className="palette-grid">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={tileClass(q, i)}
              onClick={() => jumpTo(i)}
              title={`${marked[q.id] ? "Marked • " : ""}${answers[q.id] != null ? "Answered" : "Unanswered"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="palette-legend">
          <span className="inline-flex items-center gap-1">
            <span className="legend-dot legend-answered" /> Answered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="legend-dot legend-marked" /> Marked
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="legend-dot legend-unanswered" /> Unanswered
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="q-card">
        <div className="q-head">
          <p className="q-title">
            Q{idx + 1}. {current.text}
          </p>
          <button
            className={["q-mark-btn", marked[current.id] && "is-active"].filter(Boolean).join(" ")}
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
                className={["option", checked && "is-checked"].filter(Boolean).join(" ")}
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

        <div className="q-foot">
          <button className="q-clear" onClick={() => clearChoice(current.id)}>
            Clear choice
          </button>
          <span className="q-time">
            Time on this question: {Math.floor((timeSpent[current.id] ?? 0) / 60)}m {((timeSpent[current.id] ?? 0) % 60)}s
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="runner-controls">
        <button
          disabled={idx === 0}
          onClick={() => setIdx((i) => i - 1)}
          className="btn-prev disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={idx === total - 1}
          onClick={() => setIdx((i) => i + 1)}
          className="btn-next disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting}
          className="btn-submit ml-auto disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
