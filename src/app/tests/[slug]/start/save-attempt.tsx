"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export type SaveAttemptInput = {
  test_id: string;
  score: number;
  user_id?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

export async function saveAttemptAction(input: SaveAttemptInput) {
  const payload = {
    test_id: input.test_id,
    score: input.score,
    started_at: input.started_at ?? new Date().toISOString(),
    finished_at: input.finished_at ?? new Date().toISOString(),
    ...(input.user_id ? { user_id: input.user_id } : {}),
  };

  const tries: Array<() => Promise<{ data: any | null; error: any }>> = [
    // 1) insert into api.attempts_public (preferred view)
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("attempts_public")
        .insert(payload)
        .select("id")
        .single();
      return { data, error };
    },
    // 2) insert into api.attempts (base table in api schema)
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("attempts")
        .insert(payload)
        .select("id")
        .single();
      return { data, error };
    },
    // 3) insert into public.attempts (base table in default schema)
    async () => {
      const { data, error } = await supabaseAdmin
        .from("attempts")
        .insert(payload)
        .select("id")
        .single();
      return { data, error };
    },
  ];

  let lastErr: any = null;
  for (const run of tries) {
    const { data, error } = await run();
    if (!error && data) {
      revalidatePath("/dashboard");
      return data;
    }
    lastErr = error;
  }
  throw new Error(lastErr?.message ?? "Failed to save attempt");
}


