'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';

export default function AuthForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/practice';
  const supabase = createClientComponentClient();

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
                brand: '#3080ff',
                brandAccent: '#54a2ff',
              },
            },
          },
        }}
        providers={['google']}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback?returnTo=${returnTo}`}
        onlyThirdPartyProviders
      />
    </div>
  );
}
