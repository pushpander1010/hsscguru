'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

export default function AuthForm() {
  return (
    <div className="max-w-md mx-auto p-4">
      <Auth
        supabaseClient={supabase}
        view="magic_link"                       // <- forces Magic Link/OTP
        appearance={{ theme: ThemeSupa }}
        providers={['google']}                  // remove if not enabling Google yet
        redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
      />
    </div>
  );
}
