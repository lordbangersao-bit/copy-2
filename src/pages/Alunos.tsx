import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, Student } from "@/hooks/useStudents";
import { useEscolas } from "@/hooks/useEscolas";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, GraduationCap } from "lucide-react";

export default function Alunos() {
  const { canEdit, roleInfo } = useAuth();
  const { data: students, isLoading } = useStudents(roleInfo.school_id || undefined);
  const { data: escolas } = useEscolas();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [classField, setClassField] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  const resetForm = () => {
    setName(""); setSchoolId(""); setClassField(""); setBirthdate("");
    setGender(""); setGuardianName(""); setGuardianPhone("");
  };

  const openCreate = () => { resetForm(); setEditing(null); setFormOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s); setName(s.name); setSchoolId(s.school_id); setClassField(s.class);
    setBirthdate(s.birthdate || ""); setGender(s.gender || "");
    setGuardianName(s.guardian_name || ""); setGuardianPhone(s.guardian_phone || "");
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const input = {
      name, school_id: schoolId, class: classField, birthdate: birthdate || null,
      gender: gender || null, guardian_name: guardianName || null,
      guardian_phone: guardianPhone || null, enrollment_number: null, active: true,
    };
    if (editing) {
      updateStudent.mutate({ id: editing.id, ...input }, { onSuccess: () => setFormOpen(false) });
    } else {
      createStudent.mutate(input, { onSuccess: () => setFormOpen(false) });
    }
  };

  const filtered = students?.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const getSchoolName = (id: string) => escolas?.find(e => e.id === id)?.nome || "-";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Alunos" description="Gestão de alunos matriculados" icon={<GraduationCap className="h-6 w-6" />} />
          {canEdit && (
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Novo Aluno</Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar alunos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead className="hidden md:table-cell">Escola</TableHead>
                <TableHead className="hidden sm:table-cell">Género</TableHead>
                <TableHead className="hidden lg:table-cell">Encarregado</TableHead>
                <TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ))
              ) : filtered && filtered.length > 0 ? (
                filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell className="hidden md:table-cell">{getSchoolName(s.school_id)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{s.gender || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{s.guardian_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum aluno encontrado</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={o => { if (!o) { setFormOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Aluno" : "Novo Aluno"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Classe *</Label>
                <Select value={classField} onValueChange={setClassField}>
                  <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
                  <SelectContent>
                    {["Iniciação", "1ª", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª", "8ª", "9ª", "10ª", "11ª", "12ª", "13ª"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Género</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Género" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Escola *</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger><SelectValue placeholder="Seleccione escola" /></SelectTrigger>
                <SelectContent>
                  {escolas?.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Encarregado</Label>
                <Input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Nome" />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="9XX XXX XXX" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!name || !schoolId || !classField || createStudent.isPending || updateStudent.isPending}>
              {editing ? "Guardar" : "Registar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}
        title="Remover Aluno" description="Tem certeza? Esta acção é irreversível."
        onConfirm={() => { if (deleteId) deleteStudent.mutate(deleteId); setDeleteId(null); }}
        confirmText="Remover" variant="destructive" />
    </AppLayout>
  );
}
