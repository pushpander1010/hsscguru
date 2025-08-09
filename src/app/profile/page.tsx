'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2">{email ? `Logged in as ${email}` : 'Not logged in'}</p>
    </main>
  );
}
