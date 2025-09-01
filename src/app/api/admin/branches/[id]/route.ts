import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, address } = body;

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Check if branch name conflicts with other branches
    const conflictingBranch = await prisma.branch.findFirst({
      where: {
        name: name.trim(),
        NOT: { id }
      }
    });

    if (conflictingBranch) {
      return NextResponse.json(
        { error: 'Branch name already exists' },
        { status: 400 }
      );
    }

    // Update branch
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address.trim()
      }
    });

    return NextResponse.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Check if branch has active teachers or observations
    const activeTeachers = await prisma.teacher.findFirst({
      where: { branchId: id, isActive: true }
    });

    const activeObservations = await prisma.observation.findFirst({
      where: { branchId: id }
    });

    if (activeTeachers || activeObservations) {
      return NextResponse.json(
        { error: 'Cannot delete branch with active teachers or observations' },
        { status: 400 }
      );
    }

    // Soft delete branch
    await prisma.branch.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
