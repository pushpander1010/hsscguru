// src/app/notes/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { ROUTES } from "@/lib/routes";

export default function NotesPage() {
  return (
    <PageShell
      title="Notes"
      subtitle="Subject-wise concise notes with examples and shortcuts."
      actions={
        <Link className="btn-ghost" href={ROUTES.dashboard}>
          ← Back to Dashboard
        </Link>
      }
    >
      <div className="card">
        <p className="muted">
          Coming soon: subject-wise concise notes with examples and shortcuts.
        </p>
      </div>
    </PageShell>
  );
}
