import { prisma } from '@/lib/db';

interface CreateAuditLogParams {
  userId: string;
  action: string;
  objectType?: string;
  objectId?: string;
  details?: string;
  diff?: any;
  ipAddress?: string;
}

export async function createAuditLog({
  userId,
  action,
  objectType = 'SYSTEM',
  objectId = 'N/A',
  details = '',
  diff = {},
  ipAddress = 'unknown'
}: CreateAuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        objectType,
        objectId,
        diff: {
          details,
          ipAddress,
          ...diff
        }
      }
    });

    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error as audit logging shouldn't break main functionality
    return null;
  }
}
