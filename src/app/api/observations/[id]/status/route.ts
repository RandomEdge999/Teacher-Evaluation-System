import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 20, 15 * 60 * 1000); // 20 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, reviewerComments } = body;

    // Input validation and sanitization
    if (!action || !['SUBMIT', 'REVIEW', 'FINALIZE', 'RETURN_TO_DRAFT'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required: SUBMIT, REVIEW, FINALIZE, or RETURN_TO_DRAFT' },
        { status: 400 }
      );
    }

    // Sanitize reviewer comments
    const sanitizedReviewerComments = reviewerComments ? String(reviewerComments).trim() : null;

    // Get current observation
    const observation = await prisma.observation.findUnique({
      where: { id },
      include: { itemScores: true }
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    let updatedObservation;
    let auditAction = '';

    switch (action) {
      case 'SUBMIT':
        // Check if observer can submit
        if (observation.observerId !== session.user.id && session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if observation is in DRAFT status
        if (observation.status !== 'DRAFT') {
          return NextResponse.json(
            { error: 'Only draft observations can be submitted' },
            { status: 400 }
          );
        }

        // Validate that all items are rated
        const totalItems = observation.itemScores.length;
        const ratedItems = observation.itemScores.filter(score => score.rating !== null).length;
        
        if (ratedItems === 0) {
          return NextResponse.json(
            { error: 'At least one rubric item must be rated before submission' },
            { status: 400 }
          );
        }

        updatedObservation = await prisma.observation.update({
          where: { id },
          data: { status: 'SUBMITTED' }
        });
        auditAction = 'Submitted observation for review';
        break;

      case 'REVIEW':
        // Check if user can review (REVIEWER or ADMIN role)
        if (!['REVIEWER', 'ADMIN'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if observation is in SUBMITTED status
        if (observation.status !== 'SUBMITTED') {
          return NextResponse.json(
            { error: 'Only submitted observations can be reviewed' },
            { status: 400 }
          );
        }

        updatedObservation = await prisma.observation.update({
          where: { id },
          data: {
            status: 'REVIEWED',
            reviewerId: session.user.id,
            reviewedAt: new Date(),
            reviewerComments: sanitizedReviewerComments
          }
        });
        auditAction = 'Reviewed observation';
        break;

      case 'FINALIZE':
        // Check if user can finalize (REVIEWER or ADMIN role)
        if (!['REVIEWER', 'ADMIN'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if observation is in REVIEWED status
        if (observation.status !== 'REVIEWED') {
          return NextResponse.json(
            { error: 'Only reviewed observations can be finalized' },
            { status: 400 }
          );
        }

        updatedObservation = await prisma.observation.update({
          where: { id },
          data: {
            status: 'FINALIZED',
            finalizedAt: new Date()
          }
        });
        auditAction = 'Finalized observation';
        break;

      case 'RETURN_TO_DRAFT':
        // Check if user can return to draft (REVIEWER or ADMIN role)
        if (!['REVIEWER', 'ADMIN'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if observation is in SUBMITTED or REVIEWED status
        if (!['SUBMITTED', 'REVIEWED'].includes(observation.status)) {
          return NextResponse.json(
            { error: 'Only submitted or reviewed observations can be returned to draft' },
            { status: 400 }
          );
        }

        updatedObservation = await prisma.observation.update({
          where: { id },
          data: {
            status: 'DRAFT',
            reviewerId: null,
            reviewedAt: null,
            reviewerComments: null
          }
        });
        auditAction = 'Returned observation to draft';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Observation',
        objectId: id,
        action: action.toUpperCase(),
        userId: session.user.id,
        diff: { 
          action: auditAction,
          previousStatus: observation.status,
          newStatus: updatedObservation.status
        }
      }
    });

    return NextResponse.json(updatedObservation);
  } catch (error) {
    console.error('Error updating observation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
