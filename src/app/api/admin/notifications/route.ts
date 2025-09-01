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

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const targetAudience = searchParams.get('targetAudience');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (type && ['INFO', 'WARNING', 'SUCCESS', 'ERROR'].includes(type)) {
      where.type = type;
    }
    
    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      where.priority = priority;
    }
    
    if (targetAudience && ['ALL', 'TEACHERS', 'OBSERVERS', 'REVIEWERS', 'ADMINS'].includes(targetAudience)) {
      where.targetAudience = targetAudience;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await prisma.notification.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Fetch notifications with creator info
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
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

    // Transform data to match frontend interface
    const transformedNotifications = notifications.map(notification => ({
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
      readCount: notification.readCount,
      totalRecipients: notification.totalRecipients
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: sanitizedTitle,
        message: sanitizedMessage,
        type: type.toUpperCase() as any,
        priority: priority.toUpperCase() as any,
        targetAudience: targetAudience.toUpperCase() as any,
        isActive: Boolean(isActive),
        scheduledFor: scheduledForDate,
        expiresAt: expiresAtDate,
        createdById: session.user.id,
        readCount: 0,
        totalRecipients: 0
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Notification',
        objectId: notification.id,
        action: 'CREATE',
        userId: session.user.id,
        diff: { 
          action: 'Created new notification',
          title: sanitizedTitle,
          type: type.toUpperCase(),
          priority: priority.toUpperCase(),
          targetAudience: targetAudience.toUpperCase()
        }
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
