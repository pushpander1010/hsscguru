// src/app/results/[attemptId]/ResultsList.tsx
"use client";

type QAItem = {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  chosenIndex: number | null;
  explanation?: string | null;
};

type ResultsListProps = {
  items: QAItem[];
};

export default function ResultsList({ items }: ResultsListProps) {
  return (
    <ul className="space-y-4">
      {items.map((it, idx) => {
        const isCorrect =
          it.chosenIndex !== null && it.chosenIndex === it.correctIndex;

        return (
          <li
            key={it.id}
            className="rounded-xl border border-white/10 p-4 bg-[--surface]/80"
          >
            <div className="mb-2 font-medium">
              Q{idx + 1}. {it.question}
            </div>

            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {it.options.map((opt, i) => {
                const isAnswer = i === it.correctIndex;
                const isChosen = i === it.chosenIndex;
                return (
                  <li
                    key={i}
                    className={[
                      "rounded-lg border p-2",
                      isAnswer
                        ? "border-green-500/40 bg-green-500/10"
                        : "border-white/10",
                      isChosen && !isAnswer
                        ? "outline outline-1 outline-red-500/60"
                        : "",
                    ].join(" ")}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 text-sm">
              Result:&nbsp;
              {it.chosenIndex === null ? (
                <span className="text-white/70">Not answered</span>
              ) : isCorrect ? (
                <span className="text-green-400">Correct</span>
              ) : (
                <span className="text-red-400">Incorrect</span>
              )}
            </div>

            {it.explanation ? (
              <div className="mt-2 text-xs text-white/70">
                Explanation: {it.explanation}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
