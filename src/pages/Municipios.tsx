import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProvinces } from "@/hooks/useProvinces";
import { useMunicipalities, useCreateMunicipality } from "@/hooks/useMunicipalities";
import { useEscolas } from "@/hooks/useEscolas";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Building2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Municipios() {
  const { role, roleInfo, isAdmin } = useAuth();
  const { data: provinces } = useProvinces();
  const { data: municipalities, isLoading } = useMunicipalities(
    role === "GESTOR_PROVINCIAL" ? roleInfo.province_id || undefined : undefined
  );
  const { data: escolas } = useEscolas();
  const createMunicipality = useCreateMunicipality();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [search, setSearch] = useState("");

  const canCreate = isAdmin || role === "GESTOR_PROVINCIAL";

  const filtered = municipalities?.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const getSchoolCount = (munId: string) => escolas?.filter(e => e.municipality_id === munId).length || 0;
  const getProvinceName = (provId: string) => provinces?.find(p => p.id === provId)?.name || "-";

  const handleCreate = () => {
    if (!name.trim() || !provinceId) return;
    createMunicipality.mutate({ name, province_id: provinceId, code: code || undefined }, {
      onSuccess: () => { setOpen(false); setName(""); setCode(""); setProvinceId(""); },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Municípios" description="Gestão dos municípios" icon={<MapPin className="h-6 w-6" />} />
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{municipalities?.length || 0}</p><p className="text-xs text-muted-foreground">Municípios</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><Building2 className="h-5 w-5 text-secondary-foreground" /></div>
            <div><p className="text-2xl font-bold">{escolas?.length || 0}</p><p className="text-xs text-muted-foreground">Escolas</p></div>
          </CardContent></Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar municípios..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nome</TableHead><TableHead>Província</TableHead><TableHead>Código</TableHead><TableHead>Escolas</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : filtered?.length ? (
                  filtered.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{getProvinceName(m.province_id)}</TableCell>
                      <TableCell><Badge variant="outline">{m.code || "-"}</Badge></TableCell>
                      <TableCell>{getSchoolCount(m.id)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum município</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
