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

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if notification exists and is active
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (!notification.isActive) {
      return NextResponse.json({ error: 'Cannot send inactive notification' }, { status: 400 });
    }

    // Check if notification has already been sent
    const existingRecipients = await prisma.notificationRecipient.count({
      where: { notificationId: id }
    });

    if (existingRecipients > 0) {
      return NextResponse.json({ error: 'Notification has already been sent' }, { status: 400 });
    }

    // Determine target users based on targetAudience
    let targetUsers: any[] = [];

    switch (notification.targetAudience) {
      case 'ALL':
        targetUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        });
        break;
      
      case 'TEACHERS':
        targetUsers = await prisma.user.findMany({
          where: { 
            isActive: true,
            role: 'TEACHER'
          },
          select: { id: true }
        });
        break;
      
      case 'OBSERVERS':
        targetUsers = await prisma.user.findMany({
          where: { 
            isActive: true,
            role: 'OBSERVER'
          },
          select: { id: true }
        });
        break;
      
      case 'REVIEWERS':
        targetUsers = await prisma.user.findMany({
          where: { 
            isActive: true,
            role: 'REVIEWER'
          },
          select: { id: true }
        });
        break;
      
      case 'ADMINS':
        targetUsers = await prisma.user.findMany({
          where: { 
            isActive: true,
            role: 'ADMIN'
          },
          select: { id: true }
        });
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid target audience' },
          { status: 400 }
        );
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'No users found for the specified target audience' },
        { status: 400 }
      );
    }

    // Create notification recipients
    const recipientData = targetUsers.map(user => ({
      notificationId: id,
      userId: user.id,
      isRead: false
    }));

    await prisma.notificationRecipient.createMany({
      data: recipientData
    });

    // Update notification with recipient count
    await prisma.notification.update({
      where: { id },
      data: {
        totalRecipients: targetUsers.length
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Notification',
        objectId: id,
        action: 'SEND',
        userId: session.user.id,
        diff: { 
          action: 'Sent notification to users',
          targetAudience: notification.targetAudience,
          recipientCount: targetUsers.length
        }
      }
    });

    return NextResponse.json({
      message: 'Notification sent successfully',
      recipientCount: targetUsers.length
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
