import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, Send, Eye, Mail } from "lucide-react";

const Comunicados = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Comunicação Institucional"
          description="Circulares digitais, notificações e avisos segmentados"
          icon={<Bell className="h-6 w-6" />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard title="Comunicados Enviados" value={0} icon={<Send className="h-6 w-6" />} variant="primary" />
          <KPICard title="Lidos" value={0} icon={<Eye className="h-6 w-6" />} description="Taxa de leitura: —" />
          <KPICard title="Pendentes" value={0} icon={<Mail className="h-6 w-6" />} />
        </div>

        <DataCard title="Comunicados Recentes" icon={Bell}>
          <EmptyState
            icon={Bell}
            title="Nenhum comunicado enviado"
            description="As circulares e avisos institucionais aparecerão aqui quando forem criados."
          />
        </DataCard>
      </div>
    </AppLayout>
  );
};

export default Comunicados;
