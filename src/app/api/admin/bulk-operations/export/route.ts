import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const format = searchParams.get('format') || 'csv';
    const filters = searchParams.get('filters');

    if (!entityType) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let filename = '';

    switch (entityType) {
      case 'users':
        data = await exportUsers(filters);
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'teachers':
        data = await exportTeachers(filters);
        filename = `teachers_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'branches':
        data = await exportBranches(filters);
        filename = `branches_export_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    if (format === 'json') {
      return NextResponse.json(data);
    }

    // CSV format
    const csvContent = convertToCSV(data);
    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}.csv"`);
    
    return response;
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function exportUsers(filters: string | null) {
  const where: any = {};
  
  if (filters) {
    try {
      const filterObj = JSON.parse(filters);
      if (filterObj.role) where.role = filterObj.role;
      if (filterObj.isActive !== undefined) where.isActive = filterObj.isActive;
      if (filterObj.branchId) where.branchId = filterObj.branchId;
    } catch (e) {
      // Ignore invalid filters
    }
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      branch: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users.map(user => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    branch: user.branch?.name || 'N/A',
    isActive: user.isActive ? 'Yes' : 'No',
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLoginAt?.toISOString() || 'Never'
  }));
}

async function exportTeachers(filters: string | null) {
  const where: any = {};
  
  if (filters) {
    try {
      const filterObj = JSON.parse(filters);
      if (filterObj.branchId) where.branchId = filterObj.branchId;
      if (filterObj.isActive !== undefined) where.isActive = filterObj.isActive;
      if (filterObj.subject) where.subject = filterObj.subject;
    } catch (e) {
      // Ignore invalid filters
    }
  }

  const teachers = await prisma.teacher.findMany({
    where,
    include: {
      branch: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return teachers.map(teacher => ({
    id: teacher.id,
    name: teacher.fullName,
    employeeId: teacher.employeeId,
    subject: teacher.subjectPrimary,
    branch: teacher.branch?.name || 'N/A',
    isActive: teacher.isActive ? 'Yes' : 'No',
    createdAt: teacher.createdAt.toISOString()
  }));
}

async function exportBranches(filters: string | null) {
  const where: any = {};
  
  if (filters) {
    try {
      const filterObj = JSON.parse(filters);
      if (filterObj.isActive !== undefined) where.isActive = filterObj.isActive;
    } catch (e) {
      // Ignore invalid filters
    }
  }

  const branches = await prisma.branch.findMany({
    where,
    include: {
      _count: {
        select: {
          teachers: true,
          users: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return branches.map(branch => ({
    id: branch.id,
    name: branch.name,
    address: branch.address,
    isActive: branch.isActive ? 'Yes' : 'No',
    teacherCount: branch._count.teachers,
    userCount: branch._count.users,
    createdAt: branch.createdAt.toISOString()
  }));
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}
