// src/app/admin/upload/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Optional: simple sign out server action */
export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Tiny CSV parser (no embedded commas/quotes handling) */
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((ln) => ln.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((ln) => {
    const cols = ln.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows };
}

/** Upload CSV → insert rows (adjust table/columns to your schema) */
export async function uploadAction(formData: FormData) {
  const supabase = await createSupabaseServer();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) redirect("/admin/login");

  const file = formData.get("file") as File | null;
  if (!file) return;

  const text = await file.text();
  const { rows } = parseCsv(text);
  if (!rows.length) {
    revalidatePath("/admin/upload");
    return;
  }

  // Example: insert into your public questions table. Change to your target table.
  const { error: insErr } = await supabaseAdmin
    .from("questions_public")
    .insert(rows);

  // You might surface errors via cookies/toast in a real app.
  // For build correctness, just revalidate.
  if (!insErr) {
    revalidatePath("/admin/upload");
  }
}
