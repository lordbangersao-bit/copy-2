import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, Star, TrendingUp, Users } from "lucide-react";

const Avaliacoes = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Avaliação de Desempenho"
          description="Avaliações periódicas com critérios configuráveis e histórico comparativo"
          icon={<ClipboardList className="h-6 w-6" />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard title="Avaliações Realizadas" value={0} icon={<ClipboardList className="h-6 w-6" />} description="Nenhuma avaliação registada" />
          <KPICard title="Média Geral" value="—" icon={<Star className="h-6 w-6" />} description="Sem dados" />
          <KPICard title="Pendentes" value={0} icon={<TrendingUp className="h-6 w-6" />} description="Nenhuma pendente" />
        </div>

        <DataCard title="Avaliações Recentes" icon={ClipboardList}>
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma avaliação registada"
            description="As avaliações de desempenho dos agentes aparecerão aqui quando forem criadas."
          />
        </DataCard>
      </div>
    </AppLayout>
  );
};

export default Avaliacoes;
