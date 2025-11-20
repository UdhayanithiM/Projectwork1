import { jwtVerify, SignJWT } from 'jose';

// This is the secret key for signing the JWT. It MUST be in your .env file
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface UserJwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  jti: string; // jti is a standard claim for JWT ID
  iat: number; // iat is a standard claim for issued at time
}

/**
 * Creates and signs a new JWT for a user.
 * Typically used in the login API route.
 */
export async function signJwt(payload: { id: string, email: string, role: string, name: string }) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24 * 7; // 7 days expiration

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(exp)
        .setIssuedAt(iat)
        .setNotBefore(iat)
        .sign(secretKey);
}

/**
 * Verifies a JWT and returns its payload if valid.
 * This is safe to use in any server-side context (API Routes, custom server, etc.).
 */
export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
    try {
        const { payload } = await jwtVerify<UserJwtPayload>(token, secretKey);
        return payload;
    } catch (error) {
        // Log the error for debugging, but don't expose details to the client
        console.error('JWT Verification Error:', error);
        return null;
    }
}