export interface AuditLog {
  id?: number;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt?: string;
}
