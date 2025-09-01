import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const options = formData.get('options') as string;

    if (!file || !entityType) {
      return NextResponse.json(
        { error: 'File and entity type are required' },
        { status: 400 }
      );
    }

    if (!file.name) {
      return NextResponse.json(
        { error: 'Invalid file' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    let data: any[] = [];
    let importOptions: any = {};

    try {
      importOptions = options ? JSON.parse(options) : {};
    } catch (e) {
      // Ignore invalid options
    }

    // Parse file content based on file extension
    if (file.name.endsWith('.csv')) {
      data = parseCSV(fileContent);
    } else if (file.name.endsWith('.json')) {
      data = JSON.parse(fileContent);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please use CSV or JSON.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format or empty file' },
        { status: 400 }
      );
    }

    let result: any;

    switch (entityType) {
      case 'users':
        result = await importUsers(data, importOptions);
        break;
      case 'teachers':
        result = await importTeachers(data, importOptions);
        break;
      case 'branches':
        result = await importBranches(data, importOptions);
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
        action: 'BULK_IMPORT',
        objectType: entityType.charAt(0).toUpperCase() + entityType.slice(1, -1),
        objectId: 'bulk_import',
        diff: {
          count: data.length,
          entityType,
          options: importOptions,
          result
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bulk import completed successfully`,
      result
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return data;
}

async function importUsers(data: any[], options: any) {
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    details: [] as any[]
  };

  for (const row of data) {
    try {
      if (!row.email || !row.name) {
        results.errors++;
        results.details.push({ row, error: 'Missing email or name' });
        continue;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: row.email }
      });

      if (existingUser) {
        if (options.updateExisting) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              fullName: row.name,
              role: row.role || existingUser.role,
              isActive: row.isActive !== undefined ? row.isActive === 'true' : existingUser.isActive
            }
          });
          results.updated++;
        } else {
          results.errors++;
          results.details.push({ row, error: 'User already exists' });
        }
      } else {
        // Skip user creation for now - requires password setup
        results.errors++;
        results.details.push({ row, error: 'User creation not supported in bulk import. Please create users individually.' });
      }
    } catch (error) {
      results.errors++;
      results.details.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return results;
}

async function importTeachers(data: any[], options: any) {
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    details: [] as any[]
  };

  for (const row of data) {
    try {
      if (!row.employeeId || !row.name) {
        results.errors++;
        results.details.push({ row, error: 'Missing employee ID or name' });
        continue;
      }

      // Check if teacher exists
      const existingTeacher = await prisma.teacher.findUnique({
        where: { employeeId: row.employeeId }
      });

              if (existingTeacher) {
          if (options.updateExisting) {
            await prisma.teacher.update({
              where: { id: existingTeacher.id },
              data: {
                fullName: row.name,
                subjectPrimary: row.subject || existingTeacher.subjectPrimary,
                isActive: row.isActive !== undefined ? row.isActive === 'true' : existingTeacher.isActive
              }
            });
            results.updated++;
          } else {
            results.errors++;
            results.details.push({ row, error: 'Teacher already exists' });
          }
        } else {
          await prisma.teacher.create({
            data: {
              fullName: row.name,
              employeeId: row.employeeId || `EMP${Date.now()}`,
              subjectPrimary: row.subject || 'General',
              branchId: row.branchId || 'default-branch-id', // This should be provided or defaulted
              isActive: row.isActive !== undefined ? row.isActive === 'true' : true
            }
          });
          results.created++;
        }
    } catch (error) {
      results.errors++;
      results.details.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return results;
}

async function importBranches(data: any[], options: any) {
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    details: [] as any[]
  };

  for (const row of data) {
    try {
      if (!row.name) {
        results.errors++;
        results.details.push({ row, error: 'Missing name' });
        continue;
      }

      // Check if branch exists
      const existingBranch = await prisma.branch.findFirst({
        where: { name: row.name }
      });

      if (existingBranch) {
        if (options.updateExisting) {
          await prisma.branch.update({
            where: { id: existingBranch.id },
            data: {
              address: row.address || existingBranch.address,
              isActive: row.isActive !== undefined ? row.isActive === 'true' : existingBranch.isActive
            }
          });
          results.updated++;
        } else {
          results.errors++;
          results.details.push({ row, error: 'Branch already exists' });
        }
      } else {
        await prisma.branch.create({
          data: {
            name: row.name,
            address: row.address || '',
            isActive: row.isActive !== undefined ? row.isActive === 'true' : true
          }
        });
        results.created++;
      }
    } catch (error) {
      results.errors++;
      results.details.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return results;
}
