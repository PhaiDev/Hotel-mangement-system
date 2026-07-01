import { createAuditLog, getAuditLogs } from '@/lib/repositories/logRepo';
import { AuditLog } from '@/lib/types/log';

export async function logAction(data: {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await createAuditLog({
      userId: data.userId || null,
      userEmail: 'test',
      action: data.action,
      targetId: data.targetId || null,
      details: data.details || null,
      ipAddress: data.ipAddress || null,
    });
  } catch (error) {
    console.error('AuditLog Service Error:', error);
  }
}

export async function fetchLogs(limit = 100): Promise<AuditLog[]> {
  try {
    return await getAuditLogs(limit);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}
