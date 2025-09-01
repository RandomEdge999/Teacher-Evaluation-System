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
    const { name, description, orderIndex } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Update domain
    const domain = await prisma.rubricDomain.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        orderIndex: orderIndex || 0
      }
    });

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Error updating rubric domain:', error);
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

    // Soft delete domain and all its items
    await prisma.$transaction([
      prisma.rubricItem.updateMany({
        where: { domainId: id },
        data: { isActive: false }
      }),
      prisma.rubricDomain.update({
        where: { id },
        data: { isActive: false }
      })
    ]);

    return NextResponse.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error('Error deleting rubric domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
