import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProvinces, useCreateProvince } from "@/hooks/useProvinces";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { useEscolas } from "@/hooks/useEscolas";
import { useProfessores } from "@/hooks/useProfessores";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Map, Plus, MapPin, Building2, Search, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Provincias() {
  const { isAdmin } = useAuth();
  const { data: provinces, isLoading } = useProvinces();
  const { data: municipalities } = useMunicipalities();
  const { data: escolas } = useEscolas();
  const { data: professores } = useProfessores();
  const createProvince = useCreateProvince();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = provinces?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const getMunicipalities = (provId: string) => municipalities?.filter(m => m.province_id === provId) || [];
  const getSchoolsByMunicipality = (munId: string) => escolas?.filter(e => e.municipality_id === munId) || [];
  const getTeachersBySchool = (schoolId: string) => professores?.filter(p => p.escola_id === schoolId) || [];
  const getTeachersByProvince = (provId: string) => {
    const muns = getMunicipalities(provId);
    const schoolIds = muns.flatMap(m => getSchoolsByMunicipality(m.id).map(s => s.id));
    return professores?.filter(p => p.escola_id && schoolIds.includes(p.escola_id)) || [];
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createProvince.mutate({ name, code: code || undefined }, { onSuccess: () => { setOpen(false); setName(""); setCode(""); } });
  };

  const totalTeachers = professores?.length || 0;
  const totalSchools = escolas?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Províncias" description="Gestão das províncias do sistema" icon={<Map className="h-6 w-6" />} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Província</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Província</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cunene" /></div>
                <div className="space-y-2"><Label>Código</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: CUN" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createProvince.isPending}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Map className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{provinces?.length || 0}</p><p className="text-xs text-muted-foreground">Províncias</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><MapPin className="h-5 w-5 text-secondary-foreground" /></div>
            <div><p className="text-2xl font-bold">{municipalities?.length || 0}</p><p className="text-xs text-muted-foreground">Municípios</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10"><Building2 className="h-5 w-5 text-accent-foreground" /></div>
            <div><p className="text-2xl font-bold">{totalSchools}</p><p className="text-xs text-muted-foreground">Escolas</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{totalTeachers}</p><p className="text-xs text-muted-foreground">Agentes</p></div>
          </CardContent></Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar províncias..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Province Cards with Hierarchy */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : filtered?.length ? (
          <div className="space-y-4">
            {filtered.map(province => {
              const muns = getMunicipalities(province.id);
              const provTeachers = getTeachersByProvince(province.id);
              const provSchools = muns.flatMap(m => getSchoolsByMunicipality(m.id));
              const isExpanded = expandedProvince === province.id;

              return (
                <Card key={province.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedProvince(isExpanded ? null : province.id)}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Map className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{province.name}</h3>
                              {province.code && <Badge variant="outline" className="text-xs">{province.code}</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-6 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{muns.length} municípios</span>
                              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{provSchools.length} escolas</span>
                              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{provTeachers.length} agentes</span>
                            </div>
                            {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-3 space-y-3 bg-muted/10">
                        {muns.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">Nenhum município associado</p>
                        ) : (
                          muns.map(mun => {
                            const munSchools = getSchoolsByMunicipality(mun.id);
                            const munTeachers = munSchools.flatMap(s => getTeachersBySchool(s.id));
                            return (
                              <div key={mun.id} className="rounded-lg border bg-card p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{mun.name}</span>
                                    {mun.code && <Badge variant="outline" className="text-xs">{mun.code}</Badge>}
                                  </div>
                                  <div className="flex gap-4 text-xs text-muted-foreground">
                                    <span>{munSchools.length} escolas</span>
                                    <span>{munTeachers.length} agentes</span>
                                  </div>
                                </div>
                                {munSchools.length > 0 && (
                                  <div className="ml-6 space-y-1">
                                    {munSchools.map(school => {
                                      const teachers = getTeachersBySchool(school.id);
                                      return (
                                        <div key={school.id} className="flex items-center justify-between rounded bg-muted/50 px-3 py-1.5 text-sm">
                                          <div className="flex items-center gap-2">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{school.nome}</span>
                                          </div>
                                          <Badge variant="secondary" className="text-xs font-mono">{teachers.length} agentes</Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma província encontrada</CardContent></Card>
        )}
      </div>
    </AppLayout>
  );
}
