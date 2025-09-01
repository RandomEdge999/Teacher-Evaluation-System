import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } }
      },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
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
    const rateLimitResult = rateLimit(clientId, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, employeeId, branchId, subjectPrimary, subjectSecondary } = body;

    // Input validation and sanitization
    if (!fullName || !employeeId || !branchId || !subjectPrimary) {
      return NextResponse.json(
        { error: 'Full name, employee ID, branch ID, and primary subject are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedFullName = String(fullName).trim();
    const sanitizedEmployeeId = String(employeeId).trim();
    const sanitizedSubjectPrimary = String(subjectPrimary).trim();
    const sanitizedSubjectSecondary = subjectSecondary ? String(subjectSecondary).trim() : null;

    // Validate input lengths
    if (sanitizedFullName.length < 2 || sanitizedFullName.length > 100) {
      return NextResponse.json(
        { error: 'Full name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    if (sanitizedEmployeeId.length < 3 || sanitizedEmployeeId.length > 20) {
      return NextResponse.json(
        { error: 'Employee ID must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    if (sanitizedSubjectPrimary.length < 2 || sanitizedSubjectPrimary.length > 50) {
      return NextResponse.json(
        { error: 'Primary subject must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    if (sanitizedSubjectSecondary && (sanitizedSubjectSecondary.length < 2 || sanitizedSubjectSecondary.length > 50)) {
      return NextResponse.json(
        { error: 'Secondary subject must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId }
    });

    if (existingTeacher) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        fullName: sanitizedFullName,
        employeeId: sanitizedEmployeeId,
        branchId,
        subjectPrimary: sanitizedSubjectPrimary,
        subjectSecondary: sanitizedSubjectSecondary
      },
      include: {
        branch: { select: { id: true, name: true } }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Teacher',
        objectId: teacher.id,
        action: 'CREATE',
        userId: session.user.id,
        diff: { action: 'Created new teacher', fullName: sanitizedFullName, employeeId: sanitizedEmployeeId, branchId }
      }
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
