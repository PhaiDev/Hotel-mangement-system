import { supabaseAdmin } from '@/lib/supabase/admin';
import { AuditLog } from '@/lib/types/log';

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  const { data, error } = await supabaseAdmin
    .from('AuditLogs')
    .insert([log])
    .select()
    .single();

  if (error) {
    console.error('Failed to create audit log in DB:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabaseAdmin
    .from('AuditLogs')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch audit logs from DB:', error);
    throw new Error(error.message);
  }
  return data || [];
}
