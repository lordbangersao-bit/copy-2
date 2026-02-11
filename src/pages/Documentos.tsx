import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderOpen, FileText, Upload, Search } from "lucide-react";

const Documentos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestão Documental"
          description="Arquivo digital central com pesquisa avançada e controle de versões"
          icon={<FolderOpen className="h-6 w-6" />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard title="Documentos Arquivados" value={0} icon={<FileText className="h-6 w-6" />} variant="primary" />
          <KPICard title="Uploads Recentes" value={0} icon={<Upload className="h-6 w-6" />} />
          <KPICard title="Pesquisas Realizadas" value={0} icon={<Search className="h-6 w-6" />} />
        </div>

        <DataCard title="Documentos" icon={FolderOpen}>
          <EmptyState
            icon={FolderOpen}
            title="Nenhum documento arquivado"
            description="O arquivo digital central aparecerá aqui quando documentos forem carregados."
          />
        </DataCard>
      </div>
    </AppLayout>
  );
};

export default Documentos;
