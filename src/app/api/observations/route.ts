import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 50, 15 * 60 * 1000); // 50 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const teacherId = searchParams.get('teacherId');
    const observerId = searchParams.get('observerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Validate status if provided
    if (status && !['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'FINALIZED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Valid statuses: DRAFT, SUBMITTED, UNDER_REVIEW, REVIEWED, FINALIZED' },
        { status: 400 }
      );
    }

    // Validate date formats if provided
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return NextResponse.json(
        { error: 'Invalid dateFrom format. Use ISO date format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (dateTo && isNaN(Date.parse(dateTo))) {
      return NextResponse.json(
        { error: 'Invalid dateTo format. Use ISO date format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};
    
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (teacherId) where.teacherId = teacherId;
    if (observerId) where.observerId = observerId;
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Get observations with related data
    const observations = await prisma.observation.findMany({
      where,
      include: {
        observer: { select: { id: true, fullName: true, email: true } },
        teacher: { select: { id: true, fullName: true, employeeId: true } },
        branch: { select: { id: true, name: true } },
        itemScores: {
          include: {
            rubricItem: { select: { id: true, prompt: true, maxScore: true } }
          }
        },
        attachments: { select: { id: true, fileName: true, fileType: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await prisma.observation.count({ where });

    return NextResponse.json({
      observations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching observations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 10, 15 * 60 * 1000); // 10 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
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

    const body = await request.json();
    
    // Input validation and sanitization
    const {
      teacherId,
      branchId,
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

    // Sanitize string inputs
    const sanitizedClassSection = String(classSection || '').trim();
    const sanitizedSubject = String(subject || '').trim();
    const sanitizedTopic = String(topic || '').trim();
    const sanitizedTime = String(time || '').trim();
    const sanitizedStrengths = String(strengths || '').trim();
    const sanitizedAreasToImprove = String(areasToImprove || '').trim();
    const sanitizedSuggestions = String(suggestions || '').trim();

    // Validate required fields
    if (!teacherId || !branchId || !sanitizedClassSection || !sanitizedSubject || !sanitizedTopic || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate and sanitize numeric inputs
    const validatedTotalStudents = Math.max(1, Math.min(100, parseInt(totalStudents) || 1));
    const validatedPresentStudents = Math.max(0, Math.min(validatedTotalStudents, parseInt(presentStudents) || 0));

    // Validate student counts
    if (validatedPresentStudents > validatedTotalStudents) {
      return NextResponse.json(
        { error: 'Present students cannot exceed total students' },
        { status: 400 }
      );
    }

    // Validate date
    const observationDate = new Date(date);
    if (isNaN(observationDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(sanitizedTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM format' },
        { status: 400 }
      );
    }

    // Create observation
    const observation = await prisma.observation.create({
      data: {
        observerId: session.user.id,
        teacherId,
        branchId,
        classSection: sanitizedClassSection,
        totalStudents: validatedTotalStudents,
        presentStudents: validatedPresentStudents,
        subject: sanitizedSubject,
        topic: sanitizedTopic,
        date: observationDate,
        time: sanitizedTime,
        lessonPlanAttached: Boolean(lessonPlanAttached),
        strengths: sanitizedStrengths || null,
        areasToImprove: sanitizedAreasToImprove || null,
        suggestions: sanitizedSuggestions || null,
        status: 'DRAFT'
      }
    });

    // Create item scores
    if (itemScores && Object.keys(itemScores).length > 0) {
      const itemScoreData = Object.entries(itemScores).map(([rubricItemId, itemData]: [string, any]) => ({
        observationId: observation.id,
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
        objectId: observation.id,
        action: 'CREATE',
        userId: session.user.id,
        diff: { action: 'Created new observation' }
      }
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
