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

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      title,
      message,
      type,
      priority,
      targetAudience,
      isActive,
      scheduledFor,
      expiresAt
    } = body;

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Input validation
    if (!title || !message || !type || !priority || !targetAudience) {
      return NextResponse.json(
        { error: 'Title, message, type, priority, and targetAudience are required' },
        { status: 400 }
      );
    }

    // Validate enum values
    if (!['INFO', 'WARNING', 'SUCCESS', 'ERROR'].includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid type. Must be INFO, WARNING, SUCCESS, or ERROR' },
        { status: 400 }
      );
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be LOW, MEDIUM, or HIGH' },
        { status: 400 }
      );
    }

    if (!['ALL', 'TEACHERS', 'OBSERVERS', 'REVIEWERS', 'ADMINS'].includes(targetAudience.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid targetAudience. Must be ALL, TEACHERS, OBSERVERS, REVIEWERS, or ADMINS' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedTitle = String(title).trim();
    const sanitizedMessage = String(message).trim();

    if (sanitizedTitle.length < 3 || sanitizedTitle.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 3 and 200 characters' },
        { status: 400 }
      );
    }

    if (sanitizedMessage.length < 10 || sanitizedMessage.length > 2000) {
      return NextResponse.json(
        { error: 'Message must be between 10 and 2000 characters' },
        { status: 400 }
      );
    }

    // Parse dates if provided
    let scheduledForDate: Date | undefined;
    let expiresAtDate: Date | undefined;

    if (scheduledFor) {
      scheduledForDate = new Date(scheduledFor);
      if (isNaN(scheduledForDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduledFor date format' },
          { status: 400 }
        );
      }
    }

    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiresAt date format' },
          { status: 400 }
        );
      }
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        title: sanitizedTitle,
        message: sanitizedMessage,
        type: type.toUpperCase() as any,
        priority: priority.toUpperCase() as any,
        targetAudience: targetAudience.toUpperCase() as any,
        isActive: Boolean(isActive),
        scheduledFor: scheduledForDate,
        expiresAt: expiresAtDate
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Notification',
        objectId: id,
        action: 'UPDATE',
        userId: session.user.id,
        diff: { 
          action: 'Updated notification',
          title: sanitizedTitle,
          type: type.toUpperCase(),
          priority: priority.toUpperCase(),
          targetAudience: targetAudience.toUpperCase()
        }
      }
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
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

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Delete related records first
    await prisma.notificationRecipient.deleteMany({
      where: { notificationId: id }
    });

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Notification',
        objectId: id,
        action: 'DELETE',
        userId: session.user.id,
        diff: { 
          action: 'Deleted notification',
          title: existingNotification.title
        }
      }
    });

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
