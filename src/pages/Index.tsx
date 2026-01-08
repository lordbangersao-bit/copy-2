import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useEscolas } from "@/hooks/useEscolas";
import { useProfessores } from "@/hooks/useProfessores";
import { School, Users, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: escolas, isLoading: escolasLoading } = useEscolas();
  const { data: professores, isLoading: professoresLoading } = useProfessores();

  const totalEscolas = escolas?.length || 0;
  const totalProfessores = professores?.length || 0;
  const professoresAtivos = professores?.filter((p) => p.status === "ativo").length || 0;
  const professoresAfastados = professores?.filter((p) => p.status !== "ativo").length || 0;

  const isLoading = escolasLoading || professoresLoading;

  // Agrupar professores por escola
  const professorPorEscola = escolas?.map((escola) => ({
    escola,
    quantidade: professores?.filter((p) => p.escola_id === escola.id).length || 0,
  })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema municipal de educação
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total de Escolas"
                value={totalEscolas}
                icon={<School className="h-6 w-6" />}
                variant="primary"
              />
              <StatCard
                title="Total de Professores"
                value={totalProfessores}
                icon={<Users className="h-6 w-6" />}
                variant="secondary"
              />
              <StatCard
                title="Professores Ativos"
                value={professoresAtivos}
                icon={<UserCheck className="h-6 w-6" />}
                variant="default"
              />
              <StatCard
                title="Professores Afastados"
                value={professoresAfastados}
                icon={<UserX className="h-6 w-6" />}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Escolas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Escolas com mais professores</CardTitle>
              <Link
                to="/escolas"
                className="text-sm text-primary hover:underline"
              >
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : professorPorEscola && professorPorEscola.length > 0 ? (
                <div className="space-y-3">
                  {professorPorEscola.map(({ escola, quantidade }) => (
                    <div
                      key={escola.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <School className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{escola.nome}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {quantidade} professor{quantidade !== 1 ? "es" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma escola cadastrada ainda.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Professores Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Professores recentes</CardTitle>
              <Link
                to="/professores"
                className="text-sm text-primary hover:underline"
              >
                Ver todos
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : professores && professores.length > 0 ? (
                <div className="space-y-3">
                  {professores.slice(0, 5).map((professor) => (
                    <div
                      key={professor.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
                          <Users className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <span className="font-medium">{professor.nome}</span>
                          {professor.disciplina && (
                            <p className="text-xs text-muted-foreground">
                              {professor.disciplina}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          professor.status === "ativo"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {professor.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum professor cadastrado ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
