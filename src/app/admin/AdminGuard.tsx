"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminGuard() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user) {
        setEmail(data.user.email ?? null);
        router.replace("/admin/upload");
      } else {
        setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router, supabase]);

  if (checking) {
    return <div className="text-sm text-white/60">Checking session…</div>;
  }
  return (
    <div className="text-sm text-white/80">
      Please <a className="underline" href="/admin/login">log in</a> to continue.
    </div>
  );
}


