// app/admin/login/LoginClient.tsx
"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabaseBrowser";

export function LoginClient() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo =
    typeof window !== "undefined" ? `${location.origin}/admin/upload` : undefined;

  async function signInWithGoogle() {
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setStatus(error.message);
      setLoading(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setStatus(error ? error.message : "Magic link sent! Check your email.");
    setLoading(false);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Login</h1>

      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full rounded px-4 py-2 text-white"
        style={{ background: "rgb(var(--brand))" }}
      >
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>

      <div className="relative my-4">
        <div className="border-t" />
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--background)] px-2 text-xs opacity-60">
          OR
        </span>
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
        />
        <button type="submit" disabled={loading} className="w-full rounded px-4 py-2 border">
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {status && <p className="text-sm opacity-80">{status}</p>}
    </main>
  );
}
