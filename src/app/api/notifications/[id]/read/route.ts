import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 100, 15 * 60 * 1000); // 100 requests per 15 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Helper function to map user role to notification target
    const mapUserRoleToTarget = (role: string): 'ALL' | 'TEACHERS' | 'OBSERVERS' | 'REVIEWERS' | 'ADMINS' => {
      switch (role.toUpperCase()) {
        case 'TEACHER': return 'TEACHERS';
        case 'OBSERVER': return 'OBSERVERS';
        case 'REVIEWER': return 'REVIEWERS';
        case 'ADMIN': return 'ADMINS';
        default: return 'ALL';
      }
    };

    // Check if notification exists and is accessible to this user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: mapUserRoleToTarget(session.user.role) }
        ]
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if notification is scheduled and not expired
    const now = new Date();
    if (notification.scheduledFor && notification.scheduledFor > now) {
      return NextResponse.json({ error: 'Notification not yet available' }, { status: 400 });
    }
    if (notification.expiresAt && notification.expiresAt <= now) {
      return NextResponse.json({ error: 'Notification has expired' }, { status: 400 });
    }

    // Upsert notification recipient (create if doesn't exist, update if exists)
    const recipient = await prisma.notificationRecipient.upsert({
      where: {
        notificationId_userId: {
          notificationId: id,
          userId: session.user.id
        }
      },
      update: {
        isRead: true,
        readAt: new Date()
      },
      create: {
        notificationId: id,
        userId: session.user.id,
        isRead: true,
        readAt: new Date()
      }
    });

    // Update notification read count
    const readCount = await prisma.notificationRecipient.count({
      where: {
        notificationId: id,
        isRead: true
      }
    });

    await prisma.notification.update({
      where: { id },
      data: { readCount }
    });

    return NextResponse.json({
      message: 'Notification marked as read',
      isRead: recipient.isRead,
      readAt: recipient.readAt
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
