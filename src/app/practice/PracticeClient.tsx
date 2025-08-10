// app/practice/PracticeClient.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TopicRow = { topic: string };

export default function PracticeClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const selectedTopic = sp.get("topic") ?? "";
  const nFromUrl = sp.get("n");
  const nDefault = useMemo(() => {
    const n = Number(nFromUrl ?? 10);
    return Number.isFinite(n) && n > 0 ? n : 10;
  }, [nFromUrl]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .schema("api")
        .from("topics_public")
        .select("topic")
        .order("topic", { ascending: true });
      if (!mounted) return;
      if (error) setErr(error.message);
      setTopics(data ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);


  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(selectedTopic);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = String((e.currentTarget.n as HTMLInputElement).value ?? "10");
    if (!selected) return;
    router.push(`/practice/start?topic=${encodeURIComponent(selected)}&n=${encodeURIComponent(n)}`);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm mb-1">Topic</label>
        {loading ? (
          <div className="text-sm opacity-70">Loading topics…</div>
        ) : err ? (
          <div className="text-sm text-red-600">Failed to load topics: {err}</div>
        ) : (
          <div ref={dropdownRef} className="relative">
          <button
            type="button"
            className="w-full rounded border px-3 py-2 text-left bg-[var(--control-bg)] focus:outline-none"
            style={{
              fontSize: '0.92rem',
              lineHeight: '1.25rem',
              color: 'var(--control-fg)',
              borderColor: 'var(--control-border)',
              boxShadow: 'none',
            }}
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            {selected ? selected : <span className="muted">Select a topic…</span>}
            <span className="float-right">▼</span>
          </button>
            {dropdownOpen && (
              <div
                className="absolute z-10 mt-1 w-full rounded bg-[var(--control-bg)] shadow-lg max-h-48 overflow-y-auto"
                role="listbox"
                tabIndex={-1}
                style={{
                  fontSize: '0.92rem',
                  lineHeight: '1.25rem',
                  color: 'var(--control-fg)',
                  border: `1px solid var(--control-border)`
                }}
              >
                {topics.map((t) => (
                  <div
                    key={t.topic}
                    className={`px-3 py-2 cursor-pointer hover:bg-brand-500/10 ${selected === t.topic ? 'bg-brand-500/20 font-semibold' : ''}`}
                    role="option"
                    aria-selected={selected === t.topic}
                    onClick={() => {
                      setSelected(t.topic);
                      setDropdownOpen(false);
                    }}
                  >
                    {t.topic}
                  </div>
                ))}
              </div>
            )}
            <input type="hidden" name="topic" value={selected} required />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1">Number of questions</label>
        <input
          type="number"
          name="n"
          min={1}
          max={100}
          defaultValue={nDefault}
          className="w-32 rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded px-4 py-2 bg-black text-white"
        disabled={loading || !!err}
      >
        Start practice
      </button>
    </form>
  );
}
