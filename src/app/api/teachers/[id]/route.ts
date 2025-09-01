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

    const { id } = params;
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

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id }
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if employee ID conflicts with other teachers
    const conflictingTeacher = await prisma.teacher.findFirst({
      where: {
        employeeId: sanitizedEmployeeId,
        NOT: { id }
      }
    });

    if (conflictingTeacher) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
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
        objectId: id,
        action: 'UPDATE',
        userId: session.user.id,
        diff: { 
          action: 'Updated teacher', 
          fullName: sanitizedFullName, 
          employeeId: sanitizedEmployeeId, 
          branchId 
        }
      }
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
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
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 3, 15 * 60 * 1000); // 3 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
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

    const { id } = params;

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id }
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if teacher has active observations
    const activeObservations = await prisma.observation.findFirst({
      where: { teacherId: id }
    });

    if (activeObservations) {
      return NextResponse.json(
        { error: 'Cannot delete teacher with existing observations' },
        { status: 400 }
      );
    }

    // Soft delete teacher
    await prisma.teacher.update({
      where: { id },
      data: { isActive: false }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Teacher',
        objectId: id,
        action: 'DELETE',
        userId: session.user.id,
        diff: { action: 'Deleted teacher', fullName: existingTeacher.fullName }
      }
    });

    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
