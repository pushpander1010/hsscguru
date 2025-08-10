'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

export default function AuthForm() {
  return (
    <div className="max-w-md mx-auto p-4">
      <Auth
        supabaseClient={supabase}
        view="magic_link"
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3080ff', // blue-500
                brandAccent: '#54a2ff', // blue-400
              },
              buttonBorderRadius: '999px', // fully rounded button
            },
          },
          labels: {
            providerGoogle: 'Sign in with Google (HSSC Guru)',
          },
        }}
        providers={['google']}
        redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined}
      />
    </div>
  );
}
