import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudents } from "@/hooks/useStudents";
import { useEscolas } from "@/hooks/useEscolas";
import { useRecordAttendance, saveOfflineAttendance, getOfflineAttendance, syncOfflineAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckSquare, WifiOff, Wifi, Upload, Calendar } from "lucide-react";

type StatusMap = Record<string, "present" | "absent" | "late">;

export default function PresencaOffline() {
  const { user, roleInfo } = useAuth();
  const { data: escolas } = useEscolas();
  const [selectedSchool, setSelectedSchool] = useState(roleInfo.school_id || "");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: students } = useStudents(selectedSchool || undefined);
  const recordAttendance = useRecordAttendance();

  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    setOfflineCount(getOfflineAttendance().length);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  // Initialize all as present
  useEffect(() => {
    if (students) {
      const map: StatusMap = {};
      students.filter(s => s.active).forEach(s => { map[s.id] = "present"; });
      setStatusMap(map);
    }
  }, [students]);

  const toggleStatus = (id: string) => {
    setStatusMap(prev => {
      const next = prev[id] === "present" ? "absent" : prev[id] === "absent" ? "late" : "present";
      return { ...prev, [id]: next };
    });
  };

  const handleSave = useCallback(() => {
    const records = Object.entries(statusMap).map(([student_id, status]) => ({
      student_id, date: selectedDate, status,
    }));

    if (isOnline) {
      recordAttendance.mutate(records);
    } else {
      saveOfflineAttendance(records);
      setOfflineCount(getOfflineAttendance().length);
      toast.info(`${records.length} registos guardados offline`);
    }
  }, [statusMap, selectedDate, isOnline, recordAttendance]);

  const handleSync = async () => {
    if (!user) return;
    try {
      const count = await syncOfflineAttendance(user.id);
      setOfflineCount(0);
      toast.success(`${count} registos sincronizados com sucesso`);
    } catch {
      toast.error("Erro ao sincronizar");
    }
  };

  const activeStudents = students?.filter(s => s.active) || [];
  const presentCount = Object.values(statusMap).filter(s => s === "present").length;
  const absentCount = Object.values(statusMap).filter(s => s === "absent").length;
  const lateCount = Object.values(statusMap).filter(s => s === "late").length;

  const statusColors: Record<string, string> = {
    present: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    absent: "bg-destructive/10 text-destructive border-destructive/20",
    late: "bg-amber-500/10 text-amber-700 border-amber-200",
  };

  const statusLabels: Record<string, string> = {
    present: "Presente", absent: "Ausente", late: "Atrasado",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader title="Presenças" description="Registo de assiduidade (suporta modo offline)" icon={<CheckSquare className="h-6 w-6" />} />
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="gap-1 text-emerald-600"><Wifi className="h-3 w-3" />Online</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-amber-600"><WifiOff className="h-3 w-3" />Offline</Badge>
            )}
            {offlineCount > 0 && isOnline && (
              <Button size="sm" variant="outline" className="gap-1" onClick={handleSync}>
                <Upload className="h-3 w-3" />{offlineCount} pendentes
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger><SelectValue placeholder="Seleccione escola" /></SelectTrigger>
              <SelectContent>
                {escolas?.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <Card className="flex-1 p-3 text-center"><p className="text-xs text-muted-foreground">Presentes</p><p className="text-lg font-bold text-emerald-600">{presentCount}</p></Card>
            <Card className="flex-1 p-3 text-center"><p className="text-xs text-muted-foreground">Ausentes</p><p className="text-lg font-bold text-destructive">{absentCount}</p></Card>
            <Card className="flex-1 p-3 text-center"><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-lg font-bold text-amber-600">{lateCount}</p></Card>
          </div>
        </div>

        {selectedSchool && (
          <>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-32 text-center text-muted-foreground">Nenhum aluno nesta escola</TableCell></TableRow>
                  ) : (
                    activeStudents.map(s => (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleStatus(s.id)}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.class}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={statusColors[statusMap[s.id] || "present"]}>
                            {statusLabels[statusMap[s.id] || "present"]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {activeStudents.length > 0 && (
              <div className="flex justify-end">
                <Button size="lg" onClick={handleSave} disabled={recordAttendance.isPending} className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {isOnline ? "Guardar Presenças" : "Guardar Offline"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
