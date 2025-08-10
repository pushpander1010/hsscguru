// app/practice/start/StartClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type DbQuestion = {
  id: string;
  text: string;
  options: unknown;            // raw from DB (could be array/JSON/string/null)
  correct_index: number;       // DB has correct_index, not answer
  explanation: string | null;
  topic?: string | null;
};

type Question = {
  id: string;
  text: string;
  options: string[];           // normalized for UI
  answer: string | null;       // derived from options[correct_index]
  explanation: string | null;
  topic?: string | null;
};

function toOptions(val: unknown): string[] {
  if (Array.isArray(val)) {
    // array of strings (or mixed) → strings
    return (val as unknown[]).map((x) => String(x));
  }
  if (val == null) return [];
  if (typeof val === "string") {
    // Try JSON first
    try {
      const parsed = JSON.parse(val) as unknown;
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      /* not JSON, fall through */
    }
    // Fallback: split CSV/pipe
    const parts = val.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
    return parts;
  }
  // Unknown type → empty
  return [];
}

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

      const { data, error } = await supabase
        .schema("api")
        .from("questions_public")
        .select("id,text,options,correct_index,explanation,topic")
        .ilike("topic", topic) // change to .eq if you need exact match
        .limit(limit);

      if (!mounted) return;

      if (error) {
        setErr(error.message);
        setQuestions([]);
      } else {
        const rows = (data ?? []) as DbQuestion[];
        const normalized: Question[] = rows.map((q) => {
          const normalizedOptions = toOptions(q.options);
          return {
            id: q.id,
            text: q.text,
            options: normalizedOptions,
            answer: q.correct_index >= 0 && q.correct_index < normalizedOptions.length 
              ? normalizedOptions[q.correct_index] 
              : null,
            explanation: q.explanation,
            topic: q.topic ?? undefined,
          };
        });
        setQuestions(normalized);
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
    <div className="space-y-6">
      {/* Header with navigation and score */}
      <div className="card bg-gradient-to-r from-brand-600 to-purple-600 text-white border-0">
        <div className="flex items-center justify-between">
          <button
            className="btn-ghost bg-white/20 hover:bg-white/30 text-white border-white/20"
            onClick={() =>
              router.push(`/practice?topic=${encodeURIComponent(topic)}&n=${limit}`)
            }
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Change Topic
          </button>
          
          {submitted && typeof score === "number" ? (
            <div className="text-center">
              <div className="text-sm opacity-90">Final Score</div>
              <div className="text-2xl font-bold">
                {score} / {questions.length}
              </div>
              <div className="text-sm opacity-90">
                {Math.round((score / questions.length) * 100)}%
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm opacity-90">Practice Mode</div>
              <div className="text-lg font-semibold">{topic}</div>
              <div className="text-sm opacity-90">{limit} questions</div>
            </div>
          )}
        </div>
      </div>

      {/* Loading and Error States */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <div className="title muted">Loading questions...</div>
          </div>
        </div>
      ) : err ? (
        <div className="alert-error">
          <div className="text-lg font-medium mb-2">Failed to load questions</div>
          <div className="text-red-400">{err}</div>
        </div>
      ) : questions.length === 0 ? (
        <div className="card bg-yellow-500/10 border-yellow-500/20">
          <div className="text-center">
            <div className="title text-yellow-400 mb-3">
              No questions found for <span className="font-bold">{topic}</span>
            </div>
            <a 
              className="btn"
              href="/practice"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Pick Another Topic
            </a>
          </div>
        </div>
      ) : (
        /* Questions Form */
        <form className="space-y-6" onSubmit={onSubmit}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card card-hover">
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center font-semibold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="title leading-relaxed">
                    {q.text}
                  </div>
                  {q.topic && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        {q.topic}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {q.options.map((opt, i) => {
                  const id = `${q.id}_${i}`;
                  const isSelected = (answers[q.id] ?? "") === opt;
                  const isCorrect = submitted && q.answer === opt;
                  const isWrong = submitted && isSelected && q.answer !== opt;
                  
                  return (
                    <label 
                      key={id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-brand-500 bg-brand-500/10' 
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      } ${
                        submitted && isCorrect 
                          ? 'border-green-500 bg-green-500/10' 
                          : submitted && isWrong 
                          ? 'border-red-500 bg-red-500/10' 
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={isSelected}
                        onChange={(e) => selectAnswer(q.id, e.target.value)}
                        disabled={submitted}
                        className="w-4 h-4 text-brand-500 border-white/20 focus:ring-brand-500 bg-surface"
                      />
                      <span className={`flex-1 ${
                        submitted && isCorrect 
                          ? 'text-green-400 font-medium' 
                          : submitted && isWrong 
                          ? 'text-red-400 font-medium' 
                          : ''
                      }`}>
                        {opt}
                      </span>
                      {submitted && (
                        <div className="flex-shrink-0">
                          {isCorrect && (
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isWrong && (
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Answer and Explanation (shown after submission) */}
              {submitted && (
                <div className="bg-white/5 rounded-xl p-4 border-l-4 border-brand-500">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Answer & Explanation</span>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm muted">Correct answer: </span>
                    <span className="font-semibold text-green-400">{q.answer ?? "—"}</span>
                  </div>
                  
                  {q.explanation && (
                    <div>
                      <span className="text-sm muted">Explanation: </span>
                      <span className="text-ink-200">{q.explanation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          {!submitted && (
            <div className="text-center pt-4">
              <button 
                type="submit" 
                className="btn px-8 py-4 text-lg transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Answers
              </button>
            </div>
          )}

          {/* Results Summary */}
          {submitted && (
            <div className="card bg-gradient-to-r from-green-500/10 to-brand-500/10 border-green-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  Practice Complete! 🎉
                </div>
                <div className="text-green-300 mb-4">
                  You scored {score} out of {questions.length} questions correctly.
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="btn bg-green-600 hover:bg-green-700"
                  >
                    Try Again
                  </button>
                  <a
                    href="/practice"
                    className="btn"
                  >
                    New Topic
                  </a>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
