//app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear the cookie by setting its maxAge to 0
  response.cookies.set('token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}