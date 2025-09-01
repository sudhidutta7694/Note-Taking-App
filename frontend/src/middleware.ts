import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the auth token from cookies
  const authToken = request.cookies.get('authToken')?.value;
  const isAuthenticated = !!authToken;
  
  console.log('🛡️ Middleware - Path:', pathname);
  console.log('🛡️ Middleware - Token exists:', !!authToken);
  console.log('🛡️ Middleware - Is authenticated:', isAuthenticated);
  
  // Define route patterns
  const isAuthRoute = pathname.startsWith('/auth');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isRootRoute = pathname === '/';
  
  // ✅ CRITICAL: Protect dashboard from unauthenticated users
  if (isDashboardRoute && !isAuthenticated) {
    console.log('🚨 Blocking unauthenticated access to dashboard');
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // ✅ Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    console.log('🔄 Redirecting authenticated user from auth page to dashboard');
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // ✅ Handle root route redirects
  if (isRootRoute) {
    if (isAuthenticated) {
      console.log('🔄 Redirecting authenticated user from root to dashboard');
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    } else {
      console.log('🔄 Redirecting unauthenticated user from root to login');
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  console.log('✅ Middleware - Allowing request to proceed');
  return NextResponse.next();
}

// ✅ CRITICAL: Make sure matcher includes dashboard routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
