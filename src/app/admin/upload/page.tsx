// app/admin/upload/page.tsx
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { signOut } from "@/app/admin/actions";

/** Utility types */
type CsvRow = string[];
interface ParseCsvResult {
  headers: string[];
  rows: CsvRow[];
}

/** Sign out button (named, not default) */
function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm underline">Sign out</button>
    </form>
  );
}

/** CSV parser (handles quotes + escaped quotes) */
function parseCsv(text: string): ParseCsvResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());

  const rows: CsvRow[] = lines.slice(1).map((ln) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < ln.length; i++) {
      const c = ln[i];
      if (c === `"` && ln[i + 1] === `"`) {
        cur += `"`; i++; continue; // escaped quote
      }
      if (c === `"`) { inQ = !inQ; continue; }
      if (c === "," && !inQ) { out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    out.push(cur.trim());
    return out;
  });

  return { headers, rows };
}

/** Server action - returns void (redirects for messages) */
export async function uploadAction(formData: FormData): Promise<void> {
  "use server";

  const supabase = await createSupabaseServer();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) redirect(`/admin/login`);

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || "";
  if (ownerEmail && userRes.user!.email !== ownerEmail) redirect(`/admin/login`);

  const file = formData.get("file") as File | null;
  if (!file) redirect(`/admin/upload?ok=0&msg=${encodeURIComponent("No file provided")}`);

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  const required = [
    "subject","topic","lang","text",
    "option_a","option_b","option_c","option_d",
    "correct_index","explanation","difficulty","source","year","published",
  ];
  for (const r of required) {
    if (!headers.includes(r)) {
      redirect(`/admin/upload?ok=0&msg=${encodeURIComponent(`Missing header: ${r}`)}`);
    }
  }

  const idx = (name: string) => headers.indexOf(name);

  const payload = rows
    .filter((r: CsvRow) => r.some((c) => c && c.length)) // skip empty lines
    .map((r: CsvRow) => {
      const options = [
        r[idx("option_a")],
        r[idx("option_b")],
        r[idx("option_c")],
        r[idx("option_d")],
      ];
      return {
        subject: r[idx("subject")] || null,
        topic: r[idx("topic")] || null,
        lang: r[idx("lang")] || "en",
        text: r[idx("text")] || "",
        options,
        correct_index: Number(r[idx("correct_index")] ?? 0),
        explanation: r[idx("explanation")] || null,
        difficulty: r[idx("difficulty")] || null,
        source: r[idx("source")] || null,
        year: r[idx("year")] ? Number(r[idx("year")]) : null,
        published: String(r[idx("published")]).toLowerCase() !== "false",
      };
    })
    .filter((q) => q.text && q.options.every(Boolean));

  if (payload.length === 0) {
    redirect(`/admin/upload?ok=0&msg=${encodeURIComponent("No valid rows")}`);
  }

  const { error } = await supabaseAdmin.from("questions").insert(payload);
  if (error) {
    redirect(`/admin/upload?ok=0&msg=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/tests");
  redirect(`/admin/upload?ok=1&msg=${encodeURIComponent(`Uploaded ${payload.length} questions`)}`);
}

/** Page (owner gate kept) */
export default async function AdminUploadPage({
  searchParams,
}: {
  searchParams?: { ok?: string; msg?: string };
}) {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user || null;

  if (!user) redirect("/admin/login");

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || "";
  if (ownerEmail && user.email !== ownerEmail) redirect("/admin/login");

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin - CSV Upload</h1>
        <SignOutButton />
      </div>

      {searchParams?.msg && (
        <div
          className={`border rounded p-3 ${
            searchParams.ok === "1" ? "border-green-500" : "border-red-500"
          }`}
        >
          {decodeURIComponent(searchParams.msg)}
        </div>
      )}

      {/* Your existing form/template goes here */}
    </main>
  );
}
