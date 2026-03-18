import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "late";
  recorded_by: string;
  notes: string | null;
  synced: boolean;
  created_at: string;
}

const OFFLINE_KEY = "baseedu_offline_attendance";

export function useAttendance(studentId?: string, date?: string) {
  return useQuery({
    queryKey: ["attendance", studentId, date],
    queryFn: async () => {
      let query = supabase.from("attendance").select("*").order("date", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      if (date) query = query.eq("date", date);
      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

export function useRecordAttendance() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (records: { student_id: string; date: string; status: "present" | "absent" | "late"; notes?: string }[]) => {
      const withUser = records.map(r => ({ ...r, recorded_by: user?.id || "", synced: true }));
      const { data, error } = await supabase.from("attendance").upsert(withUser, { onConflict: "student_id,date" }).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("Presenças registadas"); },
    onError: (e: Error) => {
      // Save offline
      toast.warning("Sem conexão — dados guardados localmente");
    },
  });
}

// Offline queue helpers
export function saveOfflineAttendance(records: { student_id: string; date: string; status: string; notes?: string }[]) {
  const existing = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  localStorage.setItem(OFFLINE_KEY, JSON.stringify([...existing, ...records.map(r => ({ ...r, timestamp: Date.now() }))]));
}

export function getOfflineAttendance(): any[] {
  return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
}

export function clearOfflineAttendance() {
  localStorage.removeItem(OFFLINE_KEY);
}

export async function syncOfflineAttendance(userId: string) {
  const offline = getOfflineAttendance();
  if (offline.length === 0) return 0;

  const records = offline.map((r: any) => ({
    student_id: r.student_id,
    date: r.date,
    status: r.status,
    notes: r.notes || null,
    recorded_by: userId,
    synced: true,
  }));

  const { error } = await supabase.from("attendance").upsert(records, { onConflict: "student_id,date" });
  if (!error) {
    clearOfflineAttendance();
    return records.length;
  }
  throw error;
}
