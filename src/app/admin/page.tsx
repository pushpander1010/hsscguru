import PageShell from "@/components/PageShell";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminGuard from "./AdminGuard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    // Client-side guard will redirect if already logged in (session cookie lag)
    return (
      <PageShell title="Admin" subtitle="Restricted area">
        <div className="card space-y-2">
          <AdminGuard />
        </div>
      </PageShell>
    );
  }

  // Check admin membership across common locations (by id OR email)
  const userId = user.id;
  const userEmail = user.email ?? "";
  const checks: Array<() => Promise<{ data: any[] | null; error: any }>> = [
    async () => await supabaseAdmin
      .schema("api")
      .from("admins_public")
      .select("id,email")
      .or(`id.eq.${userId},email.eq.${userEmail}`)
      .limit(1),
    async () => await supabaseAdmin
      .schema("api")
      .from("admins")
      .select("id,email")
      .or(`id.eq.${userId},email.eq.${userEmail}`)
      .limit(1),
    async () => await supabaseAdmin
      .from("admins")
      .select("id,email")
      .or(`id.eq.${userId},email.eq.${userEmail}`)
      .limit(1),
  ];

  let isAdmin = false;
  for (const run of checks) {
    const { data: rows } = await run();
    if (Array.isArray(rows) && rows.length > 0) {
      isAdmin = true;
      break;
    }
  }

  // Optional allowlist via env (comma-separated emails) and single owner email
  if (!isAdmin) {
    const owner = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "";
    const allow = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (owner) allow.push(owner.trim().toLowerCase());
    if (allow.length > 0 && userEmail && allow.includes(userEmail.toLowerCase())) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return (
      <PageShell title="Admin" subtitle="Restricted area">
        <div className="card">You are not an admin.</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Admin Dashboard" subtitle={`Welcome, ${user.email ?? ""}`}> 
      <div className="card space-y-3">
        <p>Use the tools in the sidebar or go to Upload to import content.</p>
        <div>
          <a className="btn-ghost" href="/admin/upload">Go to Upload →</a>
        </div>
      </div>
    </PageShell>
  );
}