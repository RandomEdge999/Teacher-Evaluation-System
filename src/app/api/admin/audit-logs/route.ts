import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const objectType = searchParams.get('objectType');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (objectType) {
      where.objectType = objectType;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await prisma.auditLog.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Get audit logs with user information
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Apply search filter if provided
    let filteredLogs = logs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = logs.filter(log => 
        log.objectType.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.user.fullName.toLowerCase().includes(searchLower) ||
        log.user.email.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.diff).toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      logs: filteredLogs,
      total,
      totalPages,
      currentPage: page,
      limit
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
