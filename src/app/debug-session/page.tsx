"use client";
import { useEffect, useState } from "react";

export default function DebugSessionPage() {
  const [cookies, setCookies] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Show cookies
    setCookies(document.cookie);
    // Try to get session from Supabase
    (async () => {
      try {
        const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs");
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    })();
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      <div className="mb-4">
        <strong>Cookies:</strong>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{cookies || "No cookies found."}</pre>
      </div>
      <div className="mb-4">
        <strong>Supabase Session:</strong>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{session ? JSON.stringify(session, null, 2) : "No session found."}</pre>
      </div>
      {error && <div className="text-red-500">Error: {error}</div>}
    </main>
  );
}
