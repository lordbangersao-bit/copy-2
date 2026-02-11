import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const Processos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Processos Disciplinares e Administrativos"
          description="Abertura, gestão e acompanhamento de processos com workflow de estados"
          icon={<FileText className="h-6 w-6" />}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <KPICard title="Total Processos" value={0} icon={<FileText className="h-6 w-6" />} variant="primary" />
          <KPICard title="Abertos" value={0} icon={<AlertTriangle className="h-6 w-6" />} description="Processos activos" />
          <KPICard title="Em Análise" value={0} icon={<Clock className="h-6 w-6" />} />
          <KPICard title="Arquivados" value={0} icon={<CheckCircle className="h-6 w-6" />} />
        </div>

        <DataCard title="Processos" icon={FileText}>
          <EmptyState
            icon={FileText}
            title="Nenhum processo registado"
            description="Os processos disciplinares e administrativos aparecerão aqui quando forem criados."
          />
        </DataCard>
      </div>
    </AppLayout>
  );
};

export default Processos;
