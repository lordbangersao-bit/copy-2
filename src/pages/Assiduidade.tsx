import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProfessores } from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";
import { CheckSquare, UserCheck, UserX, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";

const Assiduidade = () => {
  const { data: professores, isLoading } = useProfessores();
  const { data: escolas } = useEscolas();
  const [search, setSearch] = useState("");
  const [escolaFilter, setEscolaFilter] = useState("all");

  const filtered = professores?.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchEscola = escolaFilter === "all" || p.escola_id === escolaFilter;
    return matchSearch && matchEscola;
  });

  const totalAgentes = professores?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Assiduidade e Pontualidade"
          description="Registo e controlo de presenças, ausências e atrasos dos agentes"
          icon={<CheckSquare className="h-6 w-6" />}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <KPICard title="Total Agentes" value={totalAgentes} icon={<UserCheck className="h-6 w-6" />} variant="primary" />
          <KPICard title="Presentes Hoje" value={0} icon={<UserCheck className="h-6 w-6" />} description="Sem registos hoje" />
          <KPICard title="Ausentes" value={0} icon={<UserX className="h-6 w-6" />} description="Sem registos" />
          <KPICard title="Atrasados" value={0} icon={<Clock className="h-6 w-6" />} description="Sem registos" />
        </div>

        <DataCard title="Registo de Assiduidade" icon={CheckSquare}>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Pesquisar agente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={escolaFilter} onValueChange={setEscolaFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as escolas</SelectItem>
                {escolas?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.slice(0, 20).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {escolas?.find((e) => e.id === p.escola_id)?.nome || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="Sem registo" />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">—</TableCell>
                </TableRow>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Nenhum agente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DataCard>
      </div>
    </AppLayout>
  );
};

export default Assiduidade;
