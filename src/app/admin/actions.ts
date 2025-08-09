// app/admin/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
