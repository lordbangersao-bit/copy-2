import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action_type: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  reason: string | null;
  created_at: string;
}

export function useAuditLogs(filters?: { table_name?: string; record_id?: string; limit?: number }) {
  return useQuery({
    queryKey: ["audit_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.table_name) query = query.eq("table_name", filters.table_name);
      if (filters?.record_id) query = query.eq("record_id", filters.record_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

export function useRecordAuditLogs(recordId: string, tableName: string) {
  return useAuditLogs({ record_id: recordId, table_name: tableName });
}
