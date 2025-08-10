"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { ROUTES } from "@/lib/routes";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(ROUTES.login);
      } else if (requireAdmin && !isAdmin) {
        router.replace(ROUTES.home);
      }
    }
  }, [loading, user, isAdmin, requireAdmin, router]);

  if (loading) {
    return <div className="p-4 text-sm text-white/60">Loading...</div>;
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
