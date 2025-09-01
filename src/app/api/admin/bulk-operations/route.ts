import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Fetch bulk operation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (status) where.status = status;

    const [operations, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...where,
          objectType: { in: ['User', 'Teacher', 'Branch'] },
          action: { in: ['BULK_ACTIVATE', 'BULK_DEACTIVATE', 'BULK_DELETE', 'BULK_IMPORT', 'BULK_EXPORT'] }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({
        where: {
          ...where,
          objectType: { in: ['User', 'Teacher', 'Branch'] },
          action: { in: ['BULK_ACTIVATE', 'BULK_DEACTIVATE', 'BULK_DELETE', 'BULK_IMPORT', 'BULK_EXPORT'] }
        }
      })
    ]);

    return NextResponse.json({
      operations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bulk operations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk operations' },
      { status: 500 }
    );
  }
}

// POST: Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, action, entityIds, options = {} } = body;

    if (!entityType || !action || !entityIds || !Array.isArray(entityIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (entityIds.length === 0) {
      return NextResponse.json(
        { error: 'No entities selected' },
        { status: 400 }
      );
    }

    let result: any;
    let auditDetails: any;

    switch (entityType) {
      case 'users':
        result = await handleBulkUserOperations(action, entityIds, options);
        break;
      case 'teachers':
        result = await handleBulkTeacherOperations(action, entityIds, options);
        break;
      case 'branches':
        result = await handleBulkBranchOperations(action, entityIds, options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `BULK_${action.toUpperCase()}`,
        objectType: entityType.charAt(0).toUpperCase() + entityType.slice(1, -1),
        objectId: entityIds.join(','),
        diff: {
          count: entityIds.length,
          action,
          options,
          result
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      result
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

async function handleBulkUserOperations(action: string, userIds: string[], options: any) {
  switch (action) {
    case 'activate':
      return await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: true }
      });
    
    case 'deactivate':
      return await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false }
      });
    
    case 'delete':
      return await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { 
          isActive: false
        }
      });
    
    default:
      throw new Error(`Invalid action: ${action}`);
  }
}

async function handleBulkTeacherOperations(action: string, teacherIds: string[], options: any) {
  switch (action) {
    case 'activate':
      return await prisma.teacher.updateMany({
        where: { id: { in: teacherIds } },
        data: { isActive: true }
      });
    
    case 'deactivate':
      return await prisma.teacher.updateMany({
        where: { id: { in: teacherIds } },
        data: { isActive: false }
      });
    
    case 'delete':
      return await prisma.teacher.updateMany({
        where: { id: { in: teacherIds } },
        data: { 
          isActive: false
        }
      });
    
    default:
      throw new Error(`Invalid action: ${action}`);
  }
}

async function handleBulkBranchOperations(action: string, branchIds: string[], options: any) {
  switch (action) {
    case 'activate':
      return await prisma.branch.updateMany({
        where: { id: { in: branchIds } },
        data: { isActive: true }
      });
    
    case 'deactivate':
      return await prisma.branch.updateMany({
        where: { id: { in: branchIds } },
        data: { isActive: false }
      });
    
    case 'delete':
      return await prisma.branch.updateMany({
        where: { id: { in: branchIds } },
        data: { 
          isActive: false
        }
      });
    
    default:
      throw new Error(`Invalid action: ${action}`);
  }
}
