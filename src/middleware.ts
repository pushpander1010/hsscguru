import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Create a response to modify
  const res = NextResponse.next();
  
  try {
    // Initialize the Supabase client with both request and response
    const supabase = createMiddlewareClient({ req, res });

    // Try to get the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If we have a session, refresh it
    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      // Refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
    }

    // Check if we're on an authentication-required route
    const isAuthRoute = req.nextUrl.pathname.match(/^\/(?:practice|tests|profile|results|dashboard)/);
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Handle admin routes
    if (isAdminRoute) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
      if (session.user.email !== ownerEmail) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return res;
    }

    // Handle protected routes
    if (isAuthRoute) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
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
