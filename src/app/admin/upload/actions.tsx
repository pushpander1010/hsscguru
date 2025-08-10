// src/app/admin/upload/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

type QuestionRow = {
  text: string;
  options: string[];
  answer: string;
  explanation?: string | null;
  topic: string;
};

function parseCsv(text: string): QuestionRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const hdr = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => hdr.indexOf(name);

  const iText = idx("text");
  const iOptions = idx("options");
  const iAnswer = idx("answer");
  const iExplanation = idx("explanation");
  const iTopic = idx("topic");

  if (iText < 0 || iOptions < 0 || iAnswer < 0 || iTopic < 0) return [];

  return lines.slice(1).map((ln) => {
    const cols = ln.split(",");
    const rawOpts = cols[iOptions] ?? "";

    let options: string[] = [];
    try {
      const parsed = JSON.parse(rawOpts);
      if (Array.isArray(parsed)) options = parsed.map((x) => String(x));
    } catch {
      options = rawOpts
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return {
      text: (cols[iText] ?? "").trim(),
      options,
      answer: (cols[iAnswer] ?? "").trim(),
      explanation:
        iExplanation >= 0
          ? (cols[iExplanation] ?? "").trim() || null
          : null,
      topic: (cols[iTopic] ?? "").trim(),
    };
  });
}

export async function uploadAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  // auth guard
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) redirect("/admin/login");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file uploaded");

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error("No valid rows found in CSV");

  const { error: insertErr } = await supabase
    .schema("api")
    .from("questions_public")
    .insert(rows);

  if (insertErr) throw insertErr;

  revalidatePath("/practice");
  redirect("/admin/upload?ok=1");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
