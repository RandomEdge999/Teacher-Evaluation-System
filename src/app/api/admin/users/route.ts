import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with branch information
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data for the frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      employeeId: user.employeeId || '',
      role: user.role,
      branchName: user.branch?.name || 'No Branch',
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString()
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, fullName, employeeId, role, branchId, password } = body;

    // Validate required fields
    if (!email || !fullName || !employeeId || !role || !branchId || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { employeeId }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or employee ID already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        employeeId,
        role,
        branchId,
        passwordHash,
        isActive: true
      },
      include: {
        branch: true
      }
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
