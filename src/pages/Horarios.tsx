import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { useProfessores } from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";
import { Calendar, Users, Building2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Horarios = () => {
  const { data: professores } = useProfessores();
  const { data: escolas } = useEscolas();

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Colocação e Horários"
          description="Distribuição de agentes por escola, classe e disciplina"
          icon={<Calendar className="h-6 w-6" />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard title="Agentes Colocados" value={professores?.filter((p) => p.escola_id).length || 0} icon={<Users className="h-6 w-6" />} variant="primary" />
          <KPICard title="Sem Colocação" value={professores?.filter((p) => !p.escola_id).length || 0} icon={<AlertTriangle className="h-6 w-6" />} description="Agentes sem escola atribuída" />
          <KPICard title="Unidades Orgânicas" value={escolas?.length || 0} icon={<Building2 className="h-6 w-6" />} />
        </div>

        <DataCard title="Distribuição por Unidade Orgânica" icon={Building2} isEmpty={!escolas || escolas.length === 0} emptyMessage="Nenhuma unidade orgânica registada">
          <div className="space-y-3">
            {escolas?.map((escola) => {
              const agentes = professores?.filter((p) => p.escola_id === escola.id) || [];
              return (
                <div key={escola.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{escola.nome}</p>
                    <p className="text-xs text-muted-foreground">{escola.diretor || "Sem director"}</p>
                  </div>
                  <Badge variant="secondary">{agentes.length} agentes</Badge>
                </div>
              );
            })}
          </div>
        </DataCard>
      </div>
    </AppLayout>
  );
};

export default Horarios;
