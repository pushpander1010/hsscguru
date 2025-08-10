import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/practice';

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      // After exchanging code, get the session to ensure it's set up
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session established after code exchange');
      
    } else {
      // Handle hash fragment for magic link authentication
      const hashParams = new URLSearchParams(requestUrl.hash?.substring(1) || '');
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      
      if (access_token && refresh_token) {
        // Set the session with the tokens
        const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        
        if (setSessionError) throw setSessionError;
        if (!session) throw new Error('No session established after setting tokens');

        // Verify the session was set properly
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found after setting session');
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
