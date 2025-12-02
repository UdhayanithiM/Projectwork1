import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Use a secure fallback for dev, but enforce ENV in production
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Define Route Groups
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminRoute = pathname.startsWith('/admin');
  const isHrRoute = pathname.startsWith('/hr-dashboard');
  
  // All routes that require login
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/assessment') || 
    pathname.startsWith('/technical-assessment') ||
    pathname.startsWith('/take-interview') ||
    isAdminRoute || 
    isHrRoute;

  // 2. Redirect Logged-In Users AWAY from Login/Signup
  if (isAuthPage && token) {
    try {
      await jwtVerify(token, secretKey);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // If token is invalid, just let them stay on login page
    }
  }

  // 3. Protect Private Routes
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secretKey);
      const role = (payload.role as string)?.toUpperCase();

      // Role-Based Access Control (RBAC)
      if (isAdminRoute && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      if (isHrRoute && role !== 'HR' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      // Token expired or invalid -> Redirect to login & clear cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

// Optimized matcher to run middleware only on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/hr-dashboard/:path*',
    '/assessment/:path*',
    '/technical-assessment/:path*',
    '/take-interview/:path*',
    '/login',
    '/signup'
  ],
};
