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

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    // Get observations count and average scores
    const observations = await prisma.observation.findMany({
      where: {
        ...(branchId && { branchId }),
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        itemScores: {
          include: {
            rubricItem: {
              include: {
                domain: true
              }
            }
          }
        },
        teacher: {
          select: { fullName: true, employeeId: true }
        },
        branch: {
          select: { name: true }
        }
      }
    });

    // Calculate statistics
    const totalObservations = observations.length;
    const totalTeachers = new Set(observations.map(o => o.teacherId)).size;
    const totalBranches = new Set(observations.map(o => o.branchId)).size;

    // Calculate average scores by domain
    const domainScores: Record<string, { total: number; count: number; average: number }> = {};
    
    observations.forEach(observation => {
      observation.itemScores.forEach(score => {
        // Get domain for this item
        const domainName = score.rubricItem?.domain?.name || 'Unknown';
        if (!domainScores[domainName]) {
          domainScores[domainName] = { total: 0, count: 0, average: 0 };
        }
        if (score.rating !== null) {
          domainScores[domainName].total += score.rating;
          domainScores[domainName].count += 1;
        }
      });
    });

    // Calculate averages
    Object.keys(domainScores).forEach(domain => {
      domainScores[domain].average = domainScores[domain].total / domainScores[domain].count;
    });

    // Get top performing teachers
    const teacherPerformance = await prisma.teacher.findMany({
      where: {
        isActive: true,
        ...(branchId && { branchId })
      },
      include: {
        branch: {
          select: { name: true }
        },
        observations: {
          where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
          include: {
            itemScores: true
          }
        }
      }
    });

    // Calculate teacher performance metrics
    const teacherPerformanceData = teacherPerformance
      .map(teacher => {
        const totalScore = teacher.observations.reduce((sum, obs) => 
          sum + obs.itemScores.reduce((s, score) => s + (score.rating || 0), 0), 0
        );
        const totalRatings = teacher.observations.reduce((sum, obs) => 
          sum + obs.itemScores.length, 0
        );
        const averageScore = totalRatings > 0 ? totalScore / totalRatings : 0;
        
        return {
          id: teacher.id,
          fullName: teacher.fullName,
          employeeId: teacher.employeeId,
          branchName: teacher.branch.name,
          observationCount: teacher.observations.length,
          averageScore: Math.round(averageScore * 100) / 100
        };
      })
      .filter(teacher => teacher.observationCount > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    // Get monthly trends
    const monthlyTrendsData = await prisma.observation.groupBy({
      by: ['date'],
      where: {
        ...(branchId && { branchId }),
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      _count: {
        id: true
      }
    });

    // Group by month and calculate averages
    const monthlyTrends = monthlyTrendsData.reduce((acc, obs) => {
      const month = new Date(obs.date).toISOString().slice(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { month, observationCount: 0, totalScore: 0, ratingCount: 0 };
      }
      acc[month].observationCount += obs._count.id;
      return acc;
    }, {} as Record<string, any>);

    // Calculate average scores for each month
    for (const month in monthlyTrends) {
      const monthObservations = await prisma.observation.findMany({
        where: {
          date: {
            gte: new Date(month + '-01'),
            lt: new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 1)
          },
          ...(branchId && { branchId })
        },
        include: {
          itemScores: true
        }
      });

      const totalScore = monthObservations.reduce((sum, obs) => 
        sum + obs.itemScores.reduce((s, score) => s + (score.rating || 0), 0), 0
      );
      const totalRatings = monthObservations.reduce((sum, obs) => sum + obs.itemScores.length, 0);
      
      monthlyTrends[month].averageScore = totalRatings > 0 ? totalScore / totalRatings : 0;
    }

    const monthlyTrendsArray = Object.values(monthlyTrends)
      .sort((a: any, b: any) => b.month.localeCompare(a.month))
      .slice(0, 12);

    // Get branch performance
    const branchPerformanceData = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        observations: {
          where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
          include: {
            itemScores: true
          }
        },
        teachers: {
          where: { isActive: true }
        }
      }
    });

    const branchPerformance = branchPerformanceData.map(branch => {
      const totalScore = branch.observations.reduce((sum, obs) => 
        sum + obs.itemScores.reduce((s, score) => s + (score.rating || 0), 0), 0
      );
      const totalRatings = branch.observations.reduce((sum, obs) => sum + obs.itemScores.length, 0);
      const averageScore = totalRatings > 0 ? totalScore / totalRatings : 0;
      
      return {
        id: branch.id,
        name: branch.name,
        observationCount: branch.observations.length,
        averageScore: Math.round(averageScore * 100) / 100,
        teacherCount: branch.teachers.length
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    return NextResponse.json({
      summary: {
        totalObservations,
        totalTeachers,
        totalBranches,
        averageScore: observations.length > 0 
          ? observations.reduce((sum, o) => sum + o.itemScores.reduce((s, score) => s + (score.rating || 0), 0), 0) / 
            observations.reduce((sum, o) => sum + o.itemScores.length, 0)
          : 0
      },
      domainScores,
      topTeachers: teacherPerformanceData,
      monthlyTrends: monthlyTrendsArray,
      branchPerformance
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
