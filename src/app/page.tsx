// app/page.tsx
import { supabase } from "@/lib/supabaseClient";

type Question = {
  id: string;
  subject: string;
  topic: string;
  lang: "hi" | "en" | "bi";
  text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  source: string | null;
  year: number | null;
  created_at: string;
};

export default async function Home() {
  // Query the dedicated API schema
  const { data, error } = await supabase
    .schema("api")
    .from("questions_public")
    .select("*")
    .limit(10);

  if (error) {
    console.error(error);
  }

  const questions = (data ?? []) as Question[];

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">HSSC CET – Practice</h1>
      {questions.length === 0 ? (
        <p>No questions yet. Seed some in Supabase.</p>
      ) : (
        questions.map((q) => (
          <section key={q.id} className="rounded-2xl border p-4 space-y-3">
            <div className="text-sm opacity-70">
              <span>{q.subject}</span> • <span>{q.topic}</span> •{" "}
              <span>{q.lang.toUpperCase()}</span>
            </div>
            <p className="font-medium">{q.text}</p>
            <ol className="grid gap-2 list-decimal ml-5">
              {q.options.map((opt, i) => (
                <li key={i} className="p-2 rounded border">
                  {opt}
                </li>
              ))}
            </ol>
            {q.explanation ? (
              <details className="mt-2">
                <summary className="cursor-pointer">Show explanation</summary>
                <p className="mt-1 text-sm">{q.explanation}</p>
              </details>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
}
