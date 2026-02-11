import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/dashboard/DataCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { useProfessores } from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";
import { BarChart3, Users, Building2, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted))", "hsl(var(--accent))"];

const Relatorios = () => {
  const { data: professores, isLoading: pLoading } = useProfessores();
  const { data: escolas, isLoading: eLoading } = useEscolas();

  const isLoading = pLoading || eLoading;

  const genderData = [
    { name: "Masculino", value: professores?.filter((p) => p.genero?.toLowerCase() === "masculino").length || 0 },
    { name: "Feminino", value: professores?.filter((p) => p.genero?.toLowerCase() === "feminino").length || 0 },
  ].filter((d) => d.value > 0);

  const schoolData = escolas?.map((e) => ({
    name: e.nome.length > 15 ? e.nome.substring(0, 15) + "..." : e.nome,
    agentes: professores?.filter((p) => p.escola_id === e.id).length || 0,
    alunos: e.total_alunos || 0,
  })).sort((a, b) => b.agentes - a.agentes).slice(0, 8);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Relatórios & BI"
          description="Dashboards analíticos e relatórios exportáveis para tomada de decisão"
          icon={<BarChart3 className="h-6 w-6" />}
          isLoading={isLoading}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard title="Total Agentes" value={professores?.length || 0} icon={<Users className="h-6 w-6" />} variant="primary" />
          <KPICard title="Unidades Orgânicas" value={escolas?.length || 0} icon={<Building2 className="h-6 w-6" />} />
          <KPICard title="Relatórios Gerados" value={0} icon={<FileText className="h-6 w-6" />} description="Nenhum exportado" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DataCard title="Agentes por Unidade Orgânica" icon={Building2} isLoading={isLoading} isEmpty={!schoolData || schoolData.length === 0}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="agentes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Agentes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataCard>

          <DataCard title="Distribuição por Género" isLoading={isLoading} isEmpty={genderData.length === 0}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {genderData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DataCard>
        </div>
      </div>
    </AppLayout>
  );
};

export default Relatorios;
