import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Create a new response
    const res = NextResponse.next();
    
    // Create supabase client
    const supabase = createMiddlewareClient({ req, res });

    // Check if we're on an auth-required route
    const isAuthRoute = req.nextUrl.pathname.match(/^\/(?:practice|tests|profile|results|dashboard)/);
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Get current session (this will also refresh the session if needed)
    const { data: { session } } = await supabase.auth.getSession();

    // Handle routes that require authentication
    if (isAuthRoute || isAdminRoute) {
      if (!session) {
        // Store the attempted URL to redirect back after login
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Additional check for admin routes
      if (isAdminRoute) {
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
        if (session.user.email !== ownerEmail) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    }

    return res;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // On error, clear the session and redirect to login
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('error', 'session_error');
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    '/practice/:path*',
    '/tests/:path*',
    '/profile/:path*',
    '/results/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
