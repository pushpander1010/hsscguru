// src/app/login/page.tsx
import AuthForm from "@/components/AuthForm";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { ROUTES } from "@/lib/routes";

export default function LoginPage() {
  return (
    <PageShell
      title="Login"
      subtitle="Access your account to take tests and track your progress."
      actions={
        <Link className="btn-ghost" href={ROUTES.dashboard}>
          ← Back to Dashboard
        </Link>
      }
    >
      <div className="card max-w-md w-full mx-auto">
        <AuthForm />
      </div>
    </PageShell>
  );
}
