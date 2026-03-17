import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProvinces, useCreateProvince } from "@/hooks/useProvinces";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Map, Plus, MapPin, Building2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Provincias() {
  const { isAdmin } = useAuth();
  const { data: provinces, isLoading } = useProvinces();
  const { data: municipalities } = useMunicipalities();
  const createProvince = useCreateProvince();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");

  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = provinces?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const getMunCount = (provId: string) => municipalities?.filter(m => m.province_id === provId).length || 0;

  const handleCreate = () => {
    if (!name.trim()) return;
    createProvince.mutate({ name, code: code || undefined }, { onSuccess: () => { setOpen(false); setName(""); setCode(""); } });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Map className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{provinces?.length || 0}</p><p className="text-xs text-muted-foreground">Total Províncias</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><MapPin className="h-5 w-5 text-secondary-foreground" /></div>
            <div><p className="text-2xl font-bold">{municipalities?.length || 0}</p><p className="text-xs text-muted-foreground">Total Municípios</p></div>
          </CardContent></Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar províncias..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nome</TableHead><TableHead>Código</TableHead><TableHead>Municípios</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : filtered?.length ? (
                  filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline">{p.code || "-"}</Badge></TableCell>
                      <TableCell>{getMunCount(p.id)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma província</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
