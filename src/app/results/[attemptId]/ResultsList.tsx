// src/app/results/[attemptId]/ResultsList.tsx
"use client";
import { useMemo, useState } from "react";

export default function ResultsList({ items }: { items: any[] }) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const slice = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page]
  );

  return (
    <section className="space-y-4">
      {slice.map((q: any, idx: number) => {
        const chosen = q.ans?.chosen_index ?? -1;
        const correct = q.correct_index;

        return (
          <div key={q.id} className="border rounded p-4">
            <div className="text-sm opacity-70 mb-1">
              Q{(page - 1) * perPage + idx + 1}. {q.subject} • {q.topic} •{" "}
              {q.lang?.toUpperCase()}
            </div>
            <p className="font-medium mb-3">{q.text}</p>
            <ol className="grid gap-2 list-decimal ml-5">
              {q.options.map((opt: string, i: number) => {
                const isChosen = i === chosen;
                const isRight = i === correct;
                const style = isRight
                  ? "border-green-500"
                  : isChosen
                  ? "border-red-500"
                  : "border-gray-200";
                return (
                  <li key={i} className={`p-2 rounded border ${style}`}>
                    {opt}
                    {isRight ? " ✅" : isChosen ? " ❌" : ""}
                  </li>
                );
              })}
            </ol>
            {q.explanation ? (
              <details className="mt-2">
                <summary className="cursor-pointer">Explanation</summary>
                <p className="mt-1 text-sm">{q.explanation}</p>
              </details>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="border rounded px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} / {totalPages}
        </div>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="border rounded px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
}
