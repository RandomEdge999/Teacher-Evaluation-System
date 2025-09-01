import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10')));
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

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

    // Build where clause for notifications
    const notificationWhere: any = {
      isActive: true,
      OR: [
        { targetAudience: 'ALL' },
        { targetAudience: mapUserRoleToTarget(session.user.role) }
      ]
    };

    // Add date filters for scheduled/expired notifications
    const now = new Date();
    notificationWhere.AND = [
      {
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } }
        ]
      },
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      }
    ];

    // Get total count of notifications for this user
    const totalNotifications = await prisma.notification.count({
      where: notificationWhere
    });

    // Fetch notifications with pagination
    const notifications = await prisma.notification.findMany({
      where: notificationWhere,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    // Get notification recipients for this user
    const notificationIds = notifications.map(n => n.id);
    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        notificationId: { in: notificationIds },
        userId: session.user.id
      }
    });

    // Create a map of notification ID to recipient data
    const recipientMap = new Map(
      recipients.map(r => [r.notificationId, r])
    );

    // Transform notifications to include read status
    const transformedNotifications = notifications.map(notification => {
      const recipient = recipientMap.get(notification.id);
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type.toLowerCase() as 'info' | 'warning' | 'success' | 'error',
        priority: notification.priority.toLowerCase() as 'low' | 'medium' | 'high',
        targetAudience: notification.targetAudience.toLowerCase() as 'all' | 'teachers' | 'observers' | 'reviewers' | 'admins',
        isActive: notification.isActive,
        scheduledFor: notification.scheduledFor?.toISOString(),
        expiresAt: notification.expiresAt?.toISOString(),
        createdAt: notification.createdAt.toISOString(),
        createdBy: notification.createdBy.fullName,
        isRead: recipient?.isRead || false,
        readAt: recipient?.readAt?.toISOString() || null
      };
    });

    // Filter by unread if requested
    const filteredNotifications = unreadOnly 
      ? transformedNotifications.filter(n => !n.isRead)
      : transformedNotifications;

    const totalPages = Math.ceil(totalNotifications / limit);

    return NextResponse.json({
      notifications: filteredNotifications,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
