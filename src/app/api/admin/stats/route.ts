import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalTeachers,
      totalObservations,
      totalBranches,
      recentObservations,
      pendingReviews
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.observation.count(),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.observation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.observation.count({
        where: {
          status: 'SUBMITTED'
        }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalTeachers,
      totalObservations,
      totalBranches,
      recentObservations,
      pendingReviews
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
