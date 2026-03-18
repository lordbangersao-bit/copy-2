import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataCard } from "@/components/dashboard/DataCard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEscolas } from "@/hooks/useEscolas";
import { useProfessores } from "@/hooks/useProfessores";
import { useStudents } from "@/hooks/useStudents";
import { useProvinces } from "@/hooks/useProvinces";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { useAuth } from "@/hooks/useAuth";
import { classificarFuncionario, type ClasseFuncionario } from "@/lib/classificarFuncionario";
import { PrintableReport } from "@/components/PrintableReport";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, UserCheck, UserX, ArrowRight, GraduationCap,
  ClipboardCheck, FileWarning, AlertTriangle, Briefcase, HardHat, ShieldCheck,
  BookOpen, MapPin, Map as MapIcon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useMemo } from "react";

// --- Sub-components ---
function StaffClassificationCards({ classificacao, isLoading }: { classificacao: Record<ClasseFuncionario, number>; isLoading: boolean }) {
  const items = [
    { key: "docente" as const, icon: <BookOpen className="h-6 w-6" />, label: "Pessoal Docente" },
    { key: "direccao_chefia" as const, icon: <ShieldCheck className="h-6 w-6" />, label: "Direcção e Chefia" },
    { key: "administrativo" as const, icon: <Briefcase className="h-6 w-6" />, label: "Pessoal Administrativo" },
    { key: "operario_apoio" as const, icon: <HardHat className="h-6 w-6" />, label: "Operários e Apoio" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <KPICard key={item.key} title={item.label} value={classificacao[item.key] || 0} icon={item.icon}
          variant={item.key === "docente" ? "primary" : item.key === "direccao_chefia" ? "secondary" : item.key === "administrativo" ? "info" : "warning"}
          description={`${classificacao[item.key] || 0} agentes`} />
      ))}
    </div>
  );
}

function StaffSubclassBreakdown({ subclasses, isLoading }: { subclasses: { subclasse: string; classe: ClasseFuncionario; total: number }[]; isLoading: boolean }) {
  const classeColors: Record<ClasseFuncionario, string> = {
    docente: "hsl(var(--primary))", direccao_chefia: "hsl(var(--secondary))",
    administrativo: "hsl(var(--info, 210 100% 50%))", operario_apoio: "hsl(var(--warning))",
  };
  return (
    <DataCard title="Distribuição por Subclasse" icon={Users} isLoading={isLoading} isEmpty={subclasses.length === 0} emptyMessage="Sem dados de classificação">
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {subclasses.map(({ subclasse, classe, total }, index) => (
          <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: classeColors[classe] }} />
              <span className="text-sm font-medium">{subclasse}</span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">{total}</Badge>
          </div>
        ))}
      </div>
    </DataCard>
  );
}

// --- Role-specific dashboard header ---
function RoleBanner({ role, roleInfo }: { role: string | null; roleInfo: any }) {
  const labels: Record<string, { title: string; desc: string }> = {
    ADMIN: { title: "Painel Administrativo", desc: "Visão geral completa do sistema" },
    GESTOR_PROVINCIAL: { title: "Dashboard Provincial", desc: "Dados agregados da província" },
    GESTOR_MUNICIPAL: { title: "Dashboard Municipal", desc: "Dados do município sob sua gestão" },
    DIRECTOR_ESCOLA: { title: "Dashboard da Escola", desc: "Dados internos da unidade orgânica" },
    TECNICO: { title: "Painel do Técnico", desc: "Visualização de dados (somente leitura)" },
    VIEWER: { title: "Dashboard", desc: "Visão geral do sistema" },
  };
  const info = labels[role || ""] || labels.VIEWER;
  return <PageHeader title={info.title} description={info.desc} icon={<LayoutDashboard className="h-6 w-6" />} />;
}

// --- Main Component ---
const Index = () => {
  const navigate = useNavigate();
  const { role, roleInfo, isAdmin } = useAuth();
  const { data: escolas, isLoading: escolasLoading } = useEscolas();
  const { data: professores, isLoading: professoresLoading } = useProfessores();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: provinces } = useProvinces();
  const { data: municipalities } = useMunicipalities(roleInfo.province_id || undefined);

  const isLoading = escolasLoading || professoresLoading || studentsLoading;

  const { classificacao, subclasses, classificacaoChartData } = useMemo(() => {
    const counts: Record<ClasseFuncionario, number> = { docente: 0, direccao_chefia: 0, administrativo: 0, operario_apoio: 0 };
    const subMap = new Map<string, { classe: ClasseFuncionario; total: number }>();
    professores?.forEach((p) => {
      const info = classificarFuncionario(p.categoria, p.funcao);
      counts[info.classe]++;
      const key = `${info.classe}:${info.subclasse}`;
      const existing = subMap.get(key);
      if (existing) existing.total++; else subMap.set(key, { classe: info.classe, total: 1 });
    });
    const subclasses = Array.from(subMap.entries()).map(([key, val]) => ({ subclasse: key.split(":")[1], classe: val.classe, total: val.total })).sort((a, b) => b.total - a.total);
    const classificacaoChartData = [
      { name: "Docente", value: counts.docente, fill: "hsl(var(--primary))" },
      { name: "Direcção", value: counts.direccao_chefia, fill: "hsl(var(--secondary))" },
      { name: "Administrativo", value: counts.administrativo, fill: "hsl(210, 100%, 50%)" },
      { name: "Operário", value: counts.operario_apoio, fill: "hsl(var(--warning))" },
    ].filter((d) => d.value > 0);
    return { classificacao: counts, subclasses, classificacaoChartData };
  }, [professores]);

  const totalEscolas = escolas?.length || 0;
  const totalProfessores = professores?.length || 0;
  const totalStudents = students?.length || 0;
  const professoresAtivos = professores?.filter((p) => p.status === "ativo" || p.actividade?.toLowerCase() === "activo").length || 0;
  const professoresAfastados = professores?.filter((p) => p.status !== "ativo" && p.actividade?.toLowerCase() !== "activo").length || 0;
  const totalAlunos = escolas?.reduce((acc, e) => acc + (e.total_alunos || 0), 0) || 0;
  const totalDocentes = escolas?.reduce((acc, e) => acc + (e.total_docentes || 0), 0) || 0;
  const totalMunicipios = municipalities?.length || 0;
  const totalProvincias = provinces?.length || 0;

  const professorPorEscola = escolas?.map((escola) => ({
    escola, quantidade: professores?.filter((p) => p.escola_id === escola.id).length || 0,
  })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 6);

  const genderData = [
    { name: "Masculino", value: professores?.filter((p) => p.genero?.toLowerCase() === "masculino").length || 0 },
    { name: "Feminino", value: professores?.filter((p) => p.genero?.toLowerCase() === "feminino").length || 0 },
    { name: "Não informado", value: professores?.filter((p) => !p.genero).length || 0 },
  ].filter((d) => d.value > 0);

  const activityData = [
    { name: "Activos", value: professoresAtivos, fill: "hsl(var(--success))" },
    { name: "Afastados", value: professoresAfastados, fill: "hsl(var(--warning))" },
  ].filter((d) => d.value > 0);

  const schoolChartData = professorPorEscola?.map((item) => ({
    name: item.escola.nome.length > 20 ? item.escola.nome.substring(0, 20) + "..." : item.escola.nome,
    professores: item.quantidade,
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted))"];

  const isProvincial = role === "GESTOR_PROVINCIAL" || isAdmin;
  const isMunicipal = role === "GESTOR_MUNICIPAL";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <RoleBanner role={role} roleInfo={roleInfo} />
          <PrintableReport title="Relatório Geral — Dashboard">
            <div className="stats-grid">
              <div className="stat-box"><div className="value">{totalEscolas}</div><div className="label">Unidades Orgânicas</div></div>
              <div className="stat-box"><div className="value">{totalProfessores}</div><div className="label">Total de Agentes</div></div>
              <div className="stat-box"><div className="value">{totalStudents}</div><div className="label">Alunos Registados</div></div>
            </div>
          </PrintableReport>
        </div>

        {/* Provincial/Admin level KPIs */}
        {isProvincial && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isAdmin && (
              <KPICard title="Províncias" value={totalProvincias} icon={<MapIcon className="h-6 w-6" />}
                variant="info" description="No sistema" onClick={() => navigate("/provincias")} />
            )}
            <KPICard title="Municípios" value={totalMunicipios} icon={<MapPin className="h-6 w-6" />}
              variant="primary" description="Na província" onClick={() => navigate("/municipios")} />
            <KPICard title="Unidades Orgânicas" value={totalEscolas} icon={<Building2 className="h-6 w-6" />}
              variant="secondary" onClick={() => navigate("/escolas")} />
            <KPICard title="Total de Alunos" value={totalAlunos || totalStudents} icon={<GraduationCap className="h-6 w-6" />}
              description="Matriculados" onClick={() => navigate("/alunos")} />
          </div>
        )}

        {/* Municipal level KPIs */}
        {isMunicipal && (
          <div className="grid gap-4 md:grid-cols-3">
            <KPICard title="Escolas no Município" value={totalEscolas} icon={<Building2 className="h-6 w-6" />}
              variant="primary" onClick={() => navigate("/escolas")} />
            <KPICard title="Alunos" value={totalAlunos || totalStudents} icon={<GraduationCap className="h-6 w-6" />}
              variant="secondary" onClick={() => navigate("/alunos")} />
            <KPICard title="Agentes" value={totalProfessores} icon={<Users className="h-6 w-6" />}
              onClick={() => navigate("/professores")} />
          </div>
        )}

        {/* School director level KPIs */}
        {role === "DIRECTOR_ESCOLA" && (
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard title="Alunos" value={totalStudents} icon={<GraduationCap className="h-6 w-6" />}
              variant="primary" onClick={() => navigate("/alunos")} />
            <KPICard title="Agentes" value={totalProfessores} icon={<Users className="h-6 w-6" />}
              variant="secondary" onClick={() => navigate("/professores")} />
            <KPICard title="Agentes Activos" value={professoresAtivos} icon={<UserCheck className="h-6 w-6" />}
              description={`${totalProfessores > 0 ? ((professoresAtivos / totalProfessores) * 100).toFixed(0) : 0}%`} />
            <KPICard title="Agentes Afastados" value={professoresAfastados} icon={<UserX className="h-6 w-6" />}
              description="Licença ou reforma" />
          </div>
        )}

        {/* Technician/Viewer - simplified KPIs */}
        {(role === "TECNICO" || role === "VIEWER") && (
          <div className="grid gap-4 md:grid-cols-3">
            <KPICard title="Escolas" value={totalEscolas} icon={<Building2 className="h-6 w-6" />} variant="primary" />
            <KPICard title="Agentes" value={totalProfessores} icon={<Users className="h-6 w-6" />} variant="secondary" />
            <KPICard title="Alunos" value={totalStudents} icon={<GraduationCap className="h-6 w-6" />} />
          </div>
        )}

        {/* Staff Classification (all roles) */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Classificação do Pessoal</h2>
          <StaffClassificationCards classificacao={classificacao} isLoading={isLoading} />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <KPICard title="Alunos Registados" value={totalStudents} icon={<GraduationCap className="h-6 w-6" />}
            description="No sistema de alunos" onClick={() => navigate("/alunos")} />
          <KPICard title="Total de Docentes" value={totalDocentes} icon={<ClipboardCheck className="h-6 w-6" />}
            description="Registados nas unidades" onClick={() => navigate("/professores")} />
          <KPICard title="Processos Abertos" value={0} icon={<FileWarning className="h-6 w-6" />}
            description="Nenhum processo pendente" variant="default" onClick={() => navigate("/processos")} />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DataCard title="Distribuição por Classe de Pessoal" icon={Briefcase} isLoading={isLoading}
            isEmpty={classificacaoChartData.length === 0} emptyMessage="Sem dados de classificação">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={classificacaoChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {classificacaoChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DataCard>
          <StaffSubclassBreakdown subclasses={subclasses} isLoading={isLoading} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DataCard title="Agentes por Unidade Orgânica" icon={Building2} isLoading={isLoading}
            isEmpty={!schoolChartData || schoolChartData.length === 0} emptyMessage="Nenhuma unidade orgânica com agentes"
            action={<Link to="/escolas"><Button variant="ghost" size="sm" className="gap-1 text-primary">Ver todas<ArrowRight className="h-4 w-4" /></Button></Link>}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="professores" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Agentes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <DataCard title="Situação dos Agentes" isLoading={isLoading} isEmpty={activityData.length === 0} emptyMessage="Sem dados">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activityData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataCard>
            <DataCard title="Distribuição por Género" isLoading={isLoading} isEmpty={genderData.length === 0} emptyMessage="Sem dados">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataCard>
          </div>
        </div>

        {/* Recent Data Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DataCard title="Unidades com Mais Agentes" icon={Building2} isLoading={isLoading}
            isEmpty={!professorPorEscola || professorPorEscola.length === 0} emptyMessage="Nenhuma unidade orgânica cadastrada"
            emptyAction={<Link to="/escolas"><Button variant="outline" size="sm">Cadastrar unidade</Button></Link>}
            action={<Link to="/escolas"><Button variant="ghost" size="sm" className="gap-1 text-primary">Ver todas<ArrowRight className="h-4 w-4" /></Button></Link>}>
            <div className="space-y-2">
              {professorPorEscola?.map(({ escola, quantidade }, index) => (
                <div key={escola.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</div>
                    <div>
                      <p className="font-medium text-sm">{escola.nome}</p>
                      {escola.diretor && <p className="text-xs text-muted-foreground">Dir: {escola.diretor}</p>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">{quantidade} {quantidade === 1 ? "agente" : "agentes"}</Badge>
                </div>
              ))}
            </div>
          </DataCard>

          <DataCard title="Agentes Recentes" icon={Users} isLoading={isLoading}
            isEmpty={!professores || professores.length === 0} emptyMessage="Nenhum agente cadastrado"
            emptyAction={<Link to="/professores"><Button variant="outline" size="sm">Cadastrar agente</Button></Link>}
            action={<Link to="/professores"><Button variant="ghost" size="sm" className="gap-1 text-primary">Ver todos<ArrowRight className="h-4 w-4" /></Button></Link>}>
            <div className="space-y-2">
              {professores?.slice(0, 5).map((professor) => (
                <div key={professor.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
                      <Users className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{professor.nome}</p>
                      <p className="text-xs text-muted-foreground">{professor.funcao || professor.disciplina || "Sem função definida"}</p>
                    </div>
                  </div>
                  <StatusBadge status={professor.actividade || professor.status || "activo"} />
                </div>
              ))}
            </div>
          </DataCard>
        </div>

        {/* Alerts */}
        {professoresAfastados > 0 && (
          <DataCard title="Alertas do Sistema" icon={AlertTriangle} className="border-warning/50">
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-4">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{professoresAfastados} agente(s) afastado(s)</p>
                  <p className="text-xs text-muted-foreground mt-1">Existem agentes em situação de afastamento que podem necessitar de atenção administrativa.</p>
                </div>
                <Link to="/professores" className="ml-auto"><Button variant="outline" size="sm">Ver detalhes</Button></Link>
              </div>
            </div>
          </DataCard>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
