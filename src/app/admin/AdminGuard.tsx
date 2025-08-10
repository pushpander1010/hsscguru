"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function AdminGuard() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin/upload");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return <div className="text-sm text-white/60">Checking session…</div>;
  }

  return (
    <div className="text-sm text-white/80">
      Please <a className="underline" href="/admin/login">log in</a> to continue.
    </div>
  );
}


