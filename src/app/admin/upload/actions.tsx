// src/app/admin/upload/actions.tsx
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type QuestionRow = {
  question: string;
  options: string[];
  answer: string;
  topic: string;
};

function parseCsv(text: string): QuestionRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const hdr = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => hdr.indexOf(name);

  const iQuestion = idx("question");
  const iOptions = idx("options");
  const iAnswer = idx("answer");
  const iTopic = idx("topic");

  if (iQuestion < 0 || iOptions < 0 || iAnswer < 0 || iTopic < 0) return [];

  // Helper function to parse CSV line with proper quote handling
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  return lines.slice(1).map((ln) => {
    const cols = parseCsvLine(ln);
    const rawOpts = cols[iOptions] ?? "";

    console.log('Raw CSV line:', ln);
    console.log('Parsed columns:', cols);
    console.log('Options column index:', iOptions);
    console.log('Raw options:', rawOpts);

    // Parse options - split by comma and clean up
    const options = rawOpts
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, '')) // Remove quotes
      .filter(Boolean);

    console.log('Parsed options:', options);

    // Ensure we have at least 2 options
    if (options.length < 2) {
      throw new Error(`Question must have at least 2 options, found ${options.length} in: ${rawOpts}`);
    }

    return {
      question: (cols[iQuestion] ?? "").trim().replace(/^["']|["']$/g, ''), // Remove quotes
      options,
      answer: (cols[iAnswer] ?? "").trim().replace(/^["']|["']$/g, ''), // Remove quotes
      topic: (cols[iTopic] ?? "").trim().replace(/^["']|["']$/g, ''), // Remove quotes
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

  // Transform rows to match database schema
  const dbRows = rows.map(row => {
    // Find the index of the correct answer in options array
    const correctIndex = row.options.findIndex(option => option === row.answer);
    
    // Ensure options is a proper array and clean up any empty strings
    const cleanOptions = row.options.filter(option => option && option.trim() !== '');
    
    // Validate options array meets database constraints
    if (cleanOptions.length < 2) {
      throw new Error(`Question "${row.question}" must have at least 2 options, found ${cleanOptions.length}`);
    }
    
    if (cleanOptions.length > 10) {
      throw new Error(`Question "${row.question}" has too many options: ${cleanOptions.length}. Maximum allowed is 10.`);
    }
    
    // Ensure all options are non-empty strings
    const validOptions = cleanOptions.map(opt => {
      const trimmed = opt.trim();
      if (!trimmed) {
        throw new Error(`Question "${row.question}" has empty option`);
      }
      return trimmed;
    });
    
    console.log('Processing row:', {
      question: row.question,
      options: row.options,
      cleanOptions: validOptions,
      answer: row.answer,
      correctIndex: correctIndex
    });
    
    return {
      text: row.question, // CSV has 'question' but DB expects 'text'
      options: validOptions, // Clean array without empty strings
      correct_index: correctIndex >= 0 ? correctIndex : 0, // DB expects 'correct_index' (integer)
      topic: row.topic,
      explanation: null, // Add explanation column with null value
      subject: 'Haryana GK', // Default subject
      lang: 'en', // Default language
      difficulty: 'medium', // Default difficulty
      source: 'CSV Upload', // Default source
      year: new Date().getFullYear() // Current year
    };
  });

  console.log('Final dbRows to insert:', JSON.stringify(dbRows[0], null, 2));

  // Try multiple insertion strategies with fallbacks
  const tries: Array<() => Promise<{ data: any | null; error: any }>> = [
    // 1) insert into api.questions_public (preferred view)
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("questions_public")
        .insert(dbRows)
        .select("id");
      return { data, error };
    },
    // 2) insert into api.questions (base table in api schema)
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("questions")
        .insert(dbRows)
        .select("id");
      return { data, error };
    },
    // 3) insert into public.questions (base table in default schema)
    async () => {
      const { data, error } = await supabaseAdmin
        .from("questions")
        .insert(dbRows)
        .select("id");
      return { data, error };
    },
  ];

  let lastErr: any = null;
  for (const run of tries) {
    const { data, error } = await run();
    if (!error && data) {
      revalidatePath("/dashboard");
      revalidatePath("/tests");
      redirect("/admin/upload?success=1&count=" + rows.length);
    }
    lastErr = error;
  }
  
  throw new Error(`Failed to insert questions: ${lastErr?.message ?? "Unknown error"}`);
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
