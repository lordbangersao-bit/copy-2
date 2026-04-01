import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProvinces } from "@/hooks/useProvinces";
import { useMunicipalities, useCreateMunicipality } from "@/hooks/useMunicipalities";
import { useEscolas } from "@/hooks/useEscolas";
import { useProfessores } from "@/hooks/useProfessores";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Plus, Building2, Search, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Municipios() {
  const { role, roleInfo, isAdmin } = useAuth();
  const { data: provinces } = useProvinces();
  const { data: municipalities, isLoading } = useMunicipalities(
    role === "GESTOR_PROVINCIAL" ? roleInfo.province_id || undefined : undefined
  );
  const { data: escolas } = useEscolas();
  const { data: professores } = useProfessores();
  const createMunicipality = useCreateMunicipality();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [search, setSearch] = useState("");
  const [expandedMun, setExpandedMun] = useState<string | null>(null);

  const canCreate = isAdmin || role === "GESTOR_PROVINCIAL";

  const filtered = municipalities?.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const getSchools = (munId: string) => escolas?.filter(e => e.municipality_id === munId) || [];
  const getTeachers = (schoolId: string) => professores?.filter(p => p.escola_id === schoolId) || [];
  const getProvinceName = (provId: string) => provinces?.find(p => p.id === provId)?.name || "-";

  const totalSchools = escolas?.length || 0;
  const totalTeachers = professores?.length || 0;

  const handleCreate = () => {
    if (!name.trim() || !provinceId) return;
    createMunicipality.mutate({ name, province_id: provinceId, code: code || undefined }, {
      onSuccess: () => { setOpen(false); setName(""); setCode(""); setProvinceId(""); },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Municípios (Direcções)" description="Gestão dos municípios e suas escolas" icon={<MapPin className="h-6 w-6" />} />
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Município</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Município</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Província</Label>
                    <Select value={provinceId} onValueChange={setProvinceId}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {provinces?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ondjiva" /></div>
                  <div className="space-y-2"><Label>Código</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: OND" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={createMunicipality.isPending}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{municipalities?.length || 0}</p><p className="text-xs text-muted-foreground">Municípios</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><Building2 className="h-5 w-5 text-secondary-foreground" /></div>
            <div><p className="text-2xl font-bold">{totalSchools}</p><p className="text-xs text-muted-foreground">Escolas</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{totalTeachers}</p><p className="text-xs text-muted-foreground">Agentes</p></div>
          </CardContent></Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar municípios..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Municipality Cards with Schools */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filtered?.length ? (
          <div className="space-y-3">
            {filtered.map(mun => {
              const munSchools = getSchools(mun.id);
              const munTeachers = munSchools.flatMap(s => getTeachers(s.id));
              const isExpanded = expandedMun === mun.id;

              return (
                <Card key={mun.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedMun(isExpanded ? null : mun.id)}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{mun.name}</h3>
                              <p className="text-xs text-muted-foreground">{getProvinceName(mun.province_id)}</p>
                            </div>
                            {mun.code && <Badge variant="outline" className="text-xs">{mun.code}</Badge>}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{munSchools.length} escolas</span>
                              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{munTeachers.length} agentes</span>
                            </div>
                            {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-3 space-y-2 bg-muted/10">
                        {munSchools.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">Nenhuma escola associada a este município</p>
                        ) : (
                          munSchools.map(school => {
                            const teachers = getTeachers(school.id);
                            return (
                              <div key={school.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-4 w-4 text-primary" />
                                  <div>
                                    <p className="font-medium text-sm">{school.nome}</p>
                                    {school.diretor && <p className="text-xs text-muted-foreground">Dir: {school.diretor}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="text-xs font-mono">{teachers.length} agentes</Badge>
                                  {school.total_alunos ? (
                                    <Badge variant="outline" className="text-xs font-mono">{school.total_alunos} alunos</Badge>
                                  ) : null}
                                </div>
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
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum município encontrado</CardContent></Card>
        )}
      </div>
    </AppLayout>
  );
}
