"use client";

import { useAuth } from "@/lib/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.login);
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
