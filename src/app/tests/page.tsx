// src/app/tests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Test = { slug: string; name: string };

export default function TestsPage() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data: userRes } = await supabase.auth.getUser();
      if (!active) return;
      setUserEmail(userRes.user?.email ?? null);

      const { data, error } = await supabase
        .schema("api")
        .from("tests_public")
        .select("slug,name")
        .order("name", { ascending: true });

      if (!active) return;

      if (error) {
        setErr("Failed to load tests");
      } else {
        setTests(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => tests.filter(Boolean), [tests]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="title text-2xl mb-2">Loading Tests</div>
          <div className="muted">Please wait while we fetch your available tests...</div>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="title text-2xl mb-2">Error Loading Tests</div>
          <div className="alert-error">{err}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="card p-8 bg-gradient-to-r from-brand-500/10 to-purple-600/10 border-brand-500/20 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
          <div>
            <h1 className="title text-4xl mb-2">Available Tests</h1>
            <p className="text-lg muted">
              {userEmail ? `Welcome back, ${userEmail}!` : "You're browsing as guest"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{visible.length}</div>
            <div className="text-sm muted">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {visible.filter(t => t.name.toLowerCase().includes('mock')).length}
            </div>
            <div className="text-sm muted">Mock Tests</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {visible.filter(t => t.name.toLowerCase().includes('practice')).length}
            </div>
            <div className="text-sm muted">Practice Tests</div>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((t, index) => (
          <div key={t.slug} className="card p-6 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 group">
            {/* Test Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="title text-lg mb-2">{t.name}</h3>
                <div className="text-sm muted">Code: {t.slug}</div>
              </div>
            </div>
            
            {/* Test Type Badge */}
            <div className="mb-4">
              <span className={`
                inline-block px-3 py-1 rounded-full text-xs font-semibold
                ${t.name.toLowerCase().includes('mock') 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }
              `}>
                {t.name.toLowerCase().includes('mock') ? 'Mock Test' : 'Practice Test'}
              </span>
            </div>
            
            {/* Action Button */}
            <div className="mt-4">
              <Link 
                href={`/tests/${t.slug}/start`} 
                className="btn w-full bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 group-hover:scale-105 transition-all duration-200"
              >
                <span className="mr-2">🚀</span>
                Start Test
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {visible.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <div className="title text-2xl mb-4">No Tests Available</div>
          <div className="muted mb-6">It looks like there are no tests configured yet.</div>
          <Link href="/dashboard" className="btn bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700">
            Back to Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
