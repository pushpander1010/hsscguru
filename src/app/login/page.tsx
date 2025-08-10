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
      // ...existing code...
    >
      <div className="card w-full max-w-sm mx-auto mt-10 rounded-2xl shadow-2xl backdrop-blur-lg p-4 bg-black border border-blue-900 ring-1 ring-blue-900/20" style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.45), 0 1.5px 6px 0 rgba(37,99,235,0.12)' }}>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold mb-2 text-blue-400 drop-shadow">Sign In</h1>
          <p className="text-base text-blue-200 mb-4">Log in to access your dashboard, take tests, and track your progress.</p>
        </div>
        <div className="space-y-4">
          <AuthForm />
        </div>
      </div>
    </PageShell>
  );
}
