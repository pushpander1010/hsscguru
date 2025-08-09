// src/app/admin/upload/page.tsx
export const dynamic = "force-dynamic"; // avoid prerender so no service key needed at build
// export const revalidate = 0; // (optional) also disables caching if you prefer

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { uploadAction, signOut } from "./actions";

export default async function AdminUploadPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[--surface]/80 backdrop-blur p-6 shadow-lg space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Admin Upload</h1>
          <p className="text-sm text-white/60">Upload a CSV to import questions or content.</p>
        </header>

        <form action={uploadAction} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">CSV File</label>
            <input
              type="file"
              name="file"
              accept=".csv"
              required
              className="w-full rounded-lg bg-transparent border border-white/10 p-2 file:me-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="submit" className="btn-ghost">Upload</button>
          </div>
        </form>

        <div className="pt-2 border-t border-white/10">
          <form action={signOut}>
            <button type="submit" className="text-sm underline">Sign out</button>
          </form>
        </div>
      </div>
    </main>
  );
}
