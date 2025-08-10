// src/app/tests/[slug]/start/QuizRunner.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { QRow } from "./page";
import { supabase } from "@/lib/supabaseClient";
import { saveAttemptAction } from "./save-attempt";
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

    // who is the user (if logged in)?
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id ?? null;

    // save attempt via server action (service role)
    try {
      const attempt = await saveAttemptAction({
        test_id: testId,
        score,
        user_id: userId,
      });
      router.push(`/results/${attempt.id}`);
    } catch (e: any) {
      alert(`Failed to save attempt: ${e?.message ?? "unknown error"}`);
    }
  };

  const onChoose = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const mm = Math.floor(secsLeft / 60);
  const ss = String(secsLeft % 60).padStart(2, "0");

  // Calculate progress percentage
  const progressPercent = (answered / total) * 100;
  const timePercent = (secsLeft / (duration * 60)) * 100;

  return (
    <div className="space-y-8">
      {/* Header with Progress and Timer */}
      <div className="bg-gradient-to-r from-brand-500/10 to-purple-600/10 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{answered}</div>
              <div className="text-sm muted">Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-sm muted">Total</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white font-mono">
              {mm}:{ss}
            </div>
            <div className="text-sm muted">Time Left</div>
          </div>
        </div>
        
        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="muted">Progress</span>
              <span className="text-white">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="muted">Time</span>
              <span className="text-white">{Math.round(timePercent)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  timePercent > 30 ? 'bg-green-500' : timePercent > 10 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${timePercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="card p-6 border border-white/10 hover:border-white/20 transition-all duration-200">
              {/* Question Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {qi + 1}
                </div>
                <div className="flex-1">
                  <h3 className="title text-lg leading-relaxed">{q.text}</h3>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const active = chosen === i;
                  const isCorrect = i === q.answer_index;
                  
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onChoose(q.id, i)}
                      disabled={chosen !== null}
                      className={`
                        w-full text-left rounded-xl border-2 p-4 transition-all duration-200
                        ${active 
                          ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/20' 
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }
                        ${chosen !== null && isCorrect ? 'border-green-500 bg-green-500/10' : ''}
                        ${chosen !== null && active && !isCorrect ? 'border-red-500 bg-red-500/10' : ''}
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm
                          ${active 
                            ? 'border-brand-500 bg-brand-500 text-white' 
                            : 'border-white/20 text-white/60'
                          }
                          ${chosen !== null && isCorrect ? 'border-green-500 bg-green-500 text-white' : ''}
                          ${chosen !== null && active && !isCorrect ? 'border-red-500 bg-red-500 text-white' : ''}
                        `}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-white">{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Section */}
      <div className="bg-gradient-to-r from-brand-500/10 to-purple-600/10 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-sm muted mb-1">Your Score</div>
            <div className="text-2xl font-bold text-white">
              {answered > 0 ? Math.round((answered / total) * 100) : 0}%
            </div>
          </div>
          
          <button 
            onClick={submit} 
            disabled={secsLeft === 0 || answered === 0}
            className="btn bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg font-semibold"
          >
            {secsLeft === 0 ? 'Time Up!' : 'Submit Test'}
          </button>
        </div>
        
        {secsLeft === 0 && (
          <div className="mt-4 text-center">
            <div className="text-red-400 text-sm">Time's up! Your test will be submitted automatically.</div>
          </div>
        )}
      </div>
    </div>
  );
}
