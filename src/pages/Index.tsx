import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataCard } from "@/components/dashboard/DataCard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEscolas } from "@/hooks/useEscolas";
import { useProfessores } from "@/hooks/useProfessores";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  ClipboardCheck,
  FileWarning,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const Index = () => {
  const { data: escolas, isLoading: escolasLoading } = useEscolas();
  const { data: professores, isLoading: professoresLoading } = useProfessores();

  const isLoading = escolasLoading || professoresLoading;

  // Calculate KPIs
  const totalEscolas = escolas?.length || 0;
  const totalProfessores = professores?.length || 0;
  const professoresAtivos =
    professores?.filter((p) => p.status === "ativo" || p.actividade?.toLowerCase() === "activo").length || 0;
  const professoresAfastados =
    professores?.filter(
      (p) => p.status !== "ativo" && p.actividade?.toLowerCase() !== "activo"
    ).length || 0;

  // Calculate total students and teachers from escolas
  const totalAlunos = escolas?.reduce((acc, e) => acc + (e.total_alunos || 0), 0) || 0;
  const totalDocentes = escolas?.reduce((acc, e) => acc + (e.total_docentes || 0), 0) || 0;

  // Group professors by school
  const professorPorEscola = escolas
    ?.map((escola) => ({
      escola,
      quantidade: professores?.filter((p) => p.escola_id === escola.id).length || 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 6);

  // Chart data - Gender distribution
  const genderData = [
    {
      name: "Masculino",
      value: professores?.filter((p) => p.genero?.toLowerCase() === "masculino").length || 0,
    },
    {
      name: "Feminino",
      value: professores?.filter((p) => p.genero?.toLowerCase() === "feminino").length || 0,
    },
    {
      name: "Não informado",
      value: professores?.filter((p) => !p.genero).length || 0,
    },
  ].filter((d) => d.value > 0);

  // Chart data - Activity distribution
  const activityData = [
    {
      name: "Activos",
      value: professoresAtivos,
      fill: "hsl(var(--success))",
    },
    {
      name: "Afastados",
      value: professoresAfastados,
      fill: "hsl(var(--warning))",
    },
  ].filter((d) => d.value > 0);

  // Chart data - Schools by teachers
  const schoolChartData = professorPorEscola?.map((item) => ({
    name: item.escola.nome.length > 20 ? item.escola.nome.substring(0, 20) + "..." : item.escola.nome,
    professores: item.quantidade,
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted))"];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          description="Visão geral do sistema de gestão educacional da província"
          icon={<LayoutDashboard className="h-6 w-6" />}
          isLoading={isLoading}
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Unidades Orgânicas"
            value={totalEscolas}
            icon={<Building2 className="h-6 w-6" />}
            variant="primary"
            trend="up"
            trendValue="+2"
            description="este mês"
            onClick={() => {}}
          />
          <KPICard
            title="Total de Agentes"
            value={totalProfessores}
            icon={<Users className="h-6 w-6" />}
            variant="secondary"
            trend="up"
            trendValue="+5%"
            description="vs. mês anterior"
          />
          <KPICard
            title="Agentes Activos"
            value={professoresAtivos}
            icon={<UserCheck className="h-6 w-6" />}
            description={`${totalProfessores > 0 ? ((professoresAtivos / totalProfessores) * 100).toFixed(0) : 0}% do total`}
          />
          <KPICard
            title="Agentes Afastados"
            value={professoresAfastados}
            icon={<UserX className="h-6 w-6" />}
            description="Licença, reforma ou inactivo"
            trend={professoresAfastados > 5 ? "down" : "neutral"}
            trendValue={professoresAfastados > 5 ? "Atenção" : "Normal"}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            title="Total de Alunos"
            value={totalAlunos}
            icon={<GraduationCap className="h-6 w-6" />}
            description="Matriculados nas unidades"
          />
          <KPICard
            title="Total de Docentes"
            value={totalDocentes}
            icon={<ClipboardCheck className="h-6 w-6" />}
            description="Registados nas unidades"
          />
          <KPICard
            title="Processos Abertos"
            value={0}
            icon={<FileWarning className="h-6 w-6" />}
            description="Nenhum processo pendente"
            variant="default"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart - Teachers by School */}
          <DataCard
            title="Agentes por Unidade Orgânica"
            icon={Building2}
            isLoading={isLoading}
            isEmpty={!schoolChartData || schoolChartData.length === 0}
            emptyMessage="Nenhuma unidade orgânica com agentes"
            action={
              <Link to="/escolas">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  Ver todas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={schoolChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={120}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="professores"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    name="Agentes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataCard>

          {/* Pie Charts */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Activity Distribution */}
            <DataCard
              title="Situação dos Agentes"
              isLoading={isLoading}
              isEmpty={activityData.length === 0}
              emptyMessage="Sem dados de actividade"
            >
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataCard>

            {/* Gender Distribution */}
            <DataCard
              title="Distribuição por Género"
              isLoading={isLoading}
              isEmpty={genderData.length === 0}
              emptyMessage="Sem dados de género"
            >
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataCard>
          </div>
        </div>

        {/* Recent Data Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Schools */}
          <DataCard
            title="Unidades com Mais Agentes"
            icon={Building2}
            isLoading={isLoading}
            isEmpty={!professorPorEscola || professorPorEscola.length === 0}
            emptyMessage="Nenhuma unidade orgânica cadastrada"
            emptyAction={
              <Link to="/escolas">
                <Button variant="outline" size="sm">
                  Cadastrar unidade
                </Button>
              </Link>
            }
            action={
              <Link to="/escolas">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  Ver todas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          >
            <div className="space-y-2">
              {professorPorEscola?.map(({ escola, quantidade }, index) => (
                <div
                  key={escola.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{escola.nome}</p>
                      {escola.diretor && (
                        <p className="text-xs text-muted-foreground">
                          Dir: {escola.diretor}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {quantidade} {quantidade === 1 ? "agente" : "agentes"}
                  </Badge>
                </div>
              ))}
            </div>
          </DataCard>

          {/* Recent Professors */}
          <DataCard
            title="Agentes Recentes"
            icon={Users}
            isLoading={isLoading}
            isEmpty={!professores || professores.length === 0}
            emptyMessage="Nenhum agente cadastrado"
            emptyAction={
              <Link to="/professores">
                <Button variant="outline" size="sm">
                  Cadastrar agente
                </Button>
              </Link>
            }
            action={
              <Link to="/professores">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          >
            <div className="space-y-2">
              {professores?.slice(0, 5).map((professor) => (
                <div
                  key={professor.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
                      <Users className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{professor.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {professor.funcao || professor.disciplina || "Sem função definida"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={professor.actividade || professor.status || "activo"} />
                </div>
              ))}
            </div>
          </DataCard>
        </div>

        {/* Alerts Section */}
        {professoresAfastados > 0 && (
          <DataCard
            title="Alertas do Sistema"
            icon={AlertTriangle}
            className="border-warning/50"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-4">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    {professoresAfastados} agente(s) afastado(s)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Existem agentes em situação de afastamento que podem necessitar de
                    atenção administrativa.
                  </p>
                </div>
                <Link to="/professores" className="ml-auto">
                  <Button variant="outline" size="sm">
                    Ver detalhes
                  </Button>
                </Link>
              </div>
            </div>
          </DataCard>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;