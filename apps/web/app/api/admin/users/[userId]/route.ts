// app/api/admin/users/[userId]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { z } from 'zod';

// --- NEW FUNCTION TO ADD ---
// Schema for validating the user data being updated
const updateUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["STUDENT", "HR", "ADMIN"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // 1. Authenticate and authorize the admin
  const token = cookies().get('token');
  const payload = token ? await verifyJwt(token.value) : null;
  if (payload?.role.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Validate the incoming data
  const body = await request.json();
  const validation = updateUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
  }

  const { name, email, role } = validation.data;
  const userIdToUpdate = params.userId;

  try {
    // 3. If email is being changed, check if it's already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userIdToUpdate) {
        return NextResponse.json({ error: "Email is already in use by another account." }, { status: 409 });
      }
    }
    
    // 4. Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: {
        name,
        email,
        role,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Could not update user." }, { status: 500 });
  }
}


// The DELETE function you already have stays here...
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (payload?.role.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userIdToDelete = params.userId;
  if (payload.id === userIdToDelete) {
    return NextResponse.json({ error: "Admin cannot delete their own account." }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: {
        id: userIdToDelete,
      },
    });
    return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Could not delete user. It may have already been deleted." }, { status: 500 });
  }
}