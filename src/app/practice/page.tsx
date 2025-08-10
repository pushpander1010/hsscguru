// app/practice/page.tsx

import { Suspense } from "react";
import PracticeClient from "./PracticeClient";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";


export default async function PracticePage() {
  // Server-side auth check (App Router compatible)
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(ROUTES.login);
  }
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="card bg-gradient-to-br from-brand-500/10 to-purple-600/10 border-brand-500/20 mb-8">
        <h1 className="text-2xl font-semibold mb-2 text-brand-400">Practice (by topic)</h1>
        <p className="muted mb-4">Sharpen your skills by practicing questions by topic. Select a topic and start learning!</p>
      </div>
      <Suspense fallback={<div className="card p-6 text-center">Loading…</div>}>
        <div className="card">
          <PracticeClient />
        </div>
      </Suspense>
    </main>
  );
}

