import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

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
