import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes (root is now login siswa page)
  if (pathname === '/' || pathname.startsWith('/admin-guru') || pathname.startsWith('/api/auth') || pathname.startsWith('/superadmin')) {
    return NextResponse.next();
  }

  // Skip middleware for static files and other API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Check if session cookie exists (Lucia Auth uses 'auth_session')
  const sessionCookie = request.cookies.get('auth_session');
  
  if (!sessionCookie) {
    // No session cookie, redirect to admin-guru login
    const loginUrl = new URL('/admin-guru', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing root, let the client handle redirect based on role
  // The useAuth hook will handle this
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
