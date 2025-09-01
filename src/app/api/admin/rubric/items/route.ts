import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { number, prompt, orderIndex, maxScore, scaleMin, scaleMax, domainId } = body;

    // Validate required fields
    if (!prompt || !domainId) {
      return NextResponse.json(
        { error: 'Prompt and domain ID are required' },
        { status: 400 }
      );
    }

    // Create new item
    const item = await prisma.rubricItem.create({
      data: {
        number: number || 1,
        prompt: prompt.trim(),
        orderIndex: orderIndex || 1,
        maxScore: maxScore || 5,
        scaleMin: scaleMin || 0,
        scaleMax: scaleMax || 5,
        domainId,
        isActive: true
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating rubric item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
