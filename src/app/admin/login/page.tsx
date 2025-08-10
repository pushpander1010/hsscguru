// app/admin/login/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { LoginClient } from "./LoginClient";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect("/admin/upload");
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="card bg-gradient-to-br from-brand-500/10 to-purple-600/10 border-brand-500/20 w-full max-w-md rounded-xl backdrop-blur p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2 text-brand-400">Admin Login</h1>
        <p className="muted mb-6">Sign in to access the admin panel</p>
        <LoginClient />
      </div>
    </main>
  );
}
