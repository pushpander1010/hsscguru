"use client";

import { useAuth } from "@/lib/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function AuthPageShell({
  children,
  loading: pageLoading,
}: {
  children: React.ReactNode;
  loading?: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.login);
    }
  }, [loading, user, router]);

  if (loading) {
    return pageLoading || <div className="p-4 text-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
