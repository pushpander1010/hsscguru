// src/app/job-updates/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { ROUTES } from "@/lib/routes";

export default function JobsPage() {
  return (
    <PageShell
      title="HSSC Job Updates"
      subtitle="Current notifications, important dates, and application links."
      actions={
        <Link className="btn-ghost" href={ROUTES.dashboard}>
          ← Back to Dashboard
        </Link>
      }
    >
      <div className="card">
        <p className="muted">
          We’ll list job notifications here soon. Stay tuned for the latest HSSC recruitment alerts.
        </p>
      </div>
    </PageShell>
  );
}
