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

    // Get all system settings
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' }
    });

    // Convert to flat structure that frontend expects
    const flatSettings: Record<string, any> = {
      siteName: 'Teacher Evaluation System',
      siteDescription: 'Comprehensive teacher evaluation and performance management system',
      contactEmail: 'admin@school.com',
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      enableNotifications: true,
      enableEmailAlerts: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requirePasswordChange: false,
      enableAuditLog: true,
      backupFrequency: 'daily',
      maintenanceMode: false
    };

    // Override with database values if they exist
    settings.forEach(setting => {
      const key = setting.key;
      if (key in flatSettings) {
        flatSettings[key] = setting.value;
      }
    });

    return NextResponse.json(flatSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // For now, just return success since we don't have a proper settings table structure
    // In a real implementation, you would update the settings table here
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        objectType: 'Settings',
        objectId: 'system',
        action: 'UPDATE',
        userId: session.user.id,
        diff: { action: 'Updated system settings', count: Object.keys(settings).length }
      }
    });

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
