import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const observation = await prisma.observation.findUnique({
      where: { id },
      include: {
        observer: { select: { id: true, fullName: true, email: true } },
        teacher: { select: { id: true, fullName: true, employeeId: true } },
        branch: { select: { id: true, name: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
        itemScores: {
          include: {
            rubricItem: {
              include: {
                domain: { select: { id: true, name: true, description: true } }
              }
            }
          },
          orderBy: [
            { rubricItem: { domain: { orderIndex: 'asc' } } },
            { rubricItem: { orderIndex: 'asc' } }
          ]
        },
        attachments: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    return NextResponse.json(observation);
  } catch (error) {
    console.error('Error fetching observation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if observation exists
    const existingObservation = await prisma.observation.findUnique({
      where: { id },
      include: { itemScores: true }
    });

    if (!existingObservation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    // Check permissions (only observer or admin can edit)
    if (existingObservation.observerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if observation can be edited (not finalized)
    if (existingObservation.status === 'FINALIZED') {
      return NextResponse.json(
        { error: 'Cannot edit finalized observation' },
        { status: 400 }
      );
    }

    const {
      classSection,
      totalStudents,
      presentStudents,
      subject,
      topic,
      date,
      time,
      lessonPlanAttached,
      strengths,
      areasToImprove,
      suggestions,
      itemScores
    } = body;

    // Validate student counts
    if (presentStudents > totalStudents) {
      return NextResponse.json(
        { error: 'Present students cannot exceed total students' },
        { status: 400 }
      );
    }

    // Update observation
    const updatedObservation = await prisma.observation.update({
      where: { id },
      data: {
        classSection,
        totalStudents,
        presentStudents,
        subject,
        topic,
        date: date ? new Date(date) : undefined,
        time,
        lessonPlanAttached,
        strengths,
        areasToImprove,
        suggestions
      }
    });

    // Update item scores if provided
    if (itemScores && Object.keys(itemScores).length > 0) {
      // Delete existing scores
      await prisma.observationItemScore.deleteMany({
        where: { observationId: id }
      });

      // Create new scores
      const itemScoreData = Object.entries(itemScores).map(([rubricItemId, itemData]: [string, any]) => ({
        observationId: id,
        rubricItemId,
        rating: itemData.rating,
        comment: itemData.comment || null
      }));

      await prisma.observationItemScore.createMany({
        data: itemScoreData
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Observation',
        objectId: id,
        action: 'UPDATE',
        userId: session.user.id,
        diff: { action: 'Updated observation' }
      }
    });

    return NextResponse.json(updatedObservation);
  } catch (error) {
    console.error('Error updating observation:', error);
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if observation exists
    const existingObservation = await prisma.observation.findUnique({
      where: { id }
    });

    if (!existingObservation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    // Check permissions (only observer or admin can delete)
    if (existingObservation.observerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if observation can be deleted (not finalized)
    if (existingObservation.status === 'FINALIZED') {
      return NextResponse.json(
        { error: 'Cannot delete finalized observation' },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.observationItemScore.deleteMany({
      where: { observationId: id }
    });

    await prisma.attachment.deleteMany({
      where: { observationId: id }
    });

    // Delete observation
    await prisma.observation.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Observation',
        objectId: id,
        action: 'DELETE',
        userId: session.user.id,
        diff: { action: 'Deleted observation' }
      }
    });

    return NextResponse.json({ message: 'Observation deleted successfully' });
  } catch (error) {
    console.error('Error deleting observation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
