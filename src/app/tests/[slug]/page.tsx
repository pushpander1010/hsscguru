// src/app/tests/[slug]/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

type TestRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  duration_minutes: number | null;
};

export const dynamic = "force-dynamic";

export default async function TestDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // Server-side auth check
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  const { data, error } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <PageShell title="Test" subtitle="We couldn't find that test">
        <div className="card">
          <p className="muted">Please go back and pick another test.</p>
          <Link href="/tests" className="btn mt-4">← Back to tests</Link>
        </div>
      </PageShell>
    );
  }

  const test = data as TestRow;
  const duration = Math.max(5, Math.min(180, test.duration_minutes ?? 30));

  return (
    <PageShell title={test.name} subtitle={`Duration: ${duration} minutes`}>
      <div className="card space-y-4">
        {test.description ? <p>{test.description}</p> : null}
        <div className="flex items-center gap-3">
          <Link href="/tests" className="btn btn-secondary">← Back</Link>
          <Link href={`/tests/${test.slug}/start`} className="btn">
            Start Test
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug} • Test`,
  };
}
