import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
// ✅ FIX 1: Import the specific error type directly from Prisma client
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { z } from 'zod';

const registerUserSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  role: z.enum(['STUDENT', 'HR', 'ADMIN']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
      },
    });

    // Return a clean user object without the password hash
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error: unknown) {
    console.error('Registration error:', error);

    // ✅ FIX 2: Check if the 'unknown' error is an instance of the imported error type
    if (error instanceof PrismaClientKnownRequestError) {
      // ✅ FIX 3: Now TypeScript knows 'error' has a 'code' property here
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}