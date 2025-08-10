import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/practice';

    const supabase = createRouteHandlerClient({ cookies });

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else {
      // Handle hash fragment for magic link authentication
      const hashParams = new URLSearchParams(requestUrl.hash?.substring(1) || '');
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      
      if (access_token && refresh_token) {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        
        if (error) throw error;
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    // Redirect to login page with error
    return NextResponse.redirect(new URL('/login?error=callback_error', request.url));
  }
}
