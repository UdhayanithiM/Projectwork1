import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// It's critical this JWT_SECRET matches the one used to sign the token
const JWT_SECRET = process.env.JWT_SECRET!;
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // If no token, redirect to login immediately
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token, secretKey);

    // Get the role from the token's payload
    const role = (payload.role as string)?.toUpperCase();

    // Check for HR dashboard access
    if (request.nextUrl.pathname.startsWith('/hr-dashboard') && role !== 'HR') {
      // If not HR, deny access
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check for Admin dashboard access
    if (request.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN') {
      // If not Admin, deny access
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If all checks pass, allow the request to continue
    return NextResponse.next();
  } catch (e) {
    // If token is invalid or expired, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/hr-dashboard/:path*'],
};