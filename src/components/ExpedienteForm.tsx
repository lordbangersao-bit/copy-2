import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUnidadesOrganicas } from "@/hooks/useUnidadesOrganicas";
import { ExpedienteInput, TipoExpediente } from "@/hooks/useExpedientes";

interface ExpedienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpedienteInput) => void;
  isSubmitting?: boolean;
}

const TIPO_OPTIONS: { value: TipoExpediente; label: string; description: string }[] = [
  { value: "MAPA_FALTAS", label: "Mapa de Faltas", description: "Registo mensal de presenças e ausências dos agentes" },
  { value: "MAPA_SUBSIDIO_FERIAS", label: "Mapa de Subsídio de Férias", description: "Solicitação e controlo de subsídios de férias" },
  { value: "MAPA_ESTATISTICO", label: "Mapa Estatístico", description: "Dados estatísticos de alunos, turmas e resultados" },
  { value: "OUTRO", label: "Outro Expediente", description: "Outros documentos e expedientes administrativos" },
];

export function ExpedienteForm({ open, onOpenChange, onSubmit, isSubmitting }: ExpedienteFormProps) {
  const { data: escolas } = useUnidadesOrganicas();
  const [tipo, setTipo] = useState<TipoExpediente | "">("");
  const [escolaId, setEscolaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [periodoReferencia, setPeriodoReferencia] = useState("");
  const [submetidoPor, setSubmetidoPor] = useState("");

  // Dynamic fields based on tipo
  const [dados, setDados] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !escolaId || !titulo) return;

    onSubmit({
      escola_id: escolaId,
      tipo: tipo as TipoExpediente,
      titulo,
      descricao: descricao || undefined,
      periodo_referencia: periodoReferencia || undefined,
      submetido_por: submetidoPor || undefined,
      dados,
    });

    resetForm();
  };

  const resetForm = () => {
    setTipo("");
    setEscolaId("");
    setTitulo("");
    setDescricao("");
    setPeriodoReferencia("");
    setSubmetidoPor("");
    setDados({});
  };

  const updateDados = (key: string, value: any) => {
    setDados(prev => ({ ...prev, [key]: value }));
  };

  const renderDynamicFields = () => {
    if (tipo === "MAPA_FALTAS") {
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary">Dados do Mapa de Faltas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total de Agentes</Label>
              <Input type="number" min={0} value={dados.total_agentes || ""} onChange={(e) => updateDados("total_agentes", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Agentes Presentes</Label>
              <Input type="number" min={0} value={dados.agentes_presentes || ""} onChange={(e) => updateDados("agentes_presentes", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Faltas Justificadas</Label>
              <Input type="number" min={0} value={dados.faltas_justificadas || ""} onChange={(e) => updateDados("faltas_justificadas", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Faltas Injustificadas</Label>
              <Input type="number" min={0} value={dados.faltas_injustificadas || ""} onChange={(e) => updateDados("faltas_injustificadas", parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      );
    }

    if (tipo === "MAPA_SUBSIDIO_FERIAS") {
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary">Dados do Subsídio de Férias</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº de Beneficiários</Label>
              <Input type="number" min={0} value={dados.num_beneficiarios || ""} onChange={(e) => updateDados("num_beneficiarios", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Valor Total Estimado (Kz)</Label>
              <Input type="number" min={0} step="0.01" value={dados.valor_total || ""} onChange={(e) => updateDados("valor_total", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Período de Férias</Label>
              <Input value={dados.periodo_ferias || ""} onChange={(e) => updateDados("periodo_ferias", e.target.value)} placeholder="Ex: Janeiro - Fevereiro 2026" />
            </div>
          </div>
        </div>
      );
    }

    if (tipo === "MAPA_ESTATISTICO") {
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary">Dados Estatísticos</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total de Alunos Matriculados</Label>
              <Input type="number" min={0} value={dados.total_alunos || ""} onChange={(e) => updateDados("total_alunos", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Alunos Masculinos</Label>
              <Input type="number" min={0} value={dados.alunos_masculino || ""} onChange={(e) => updateDados("alunos_masculino", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Alunos Femininos</Label>
              <Input type="number" min={0} value={dados.alunos_feminino || ""} onChange={(e) => updateDados("alunos_feminino", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Total de Turmas</Label>
              <Input type="number" min={0} value={dados.total_turmas || ""} onChange={(e) => updateDados("total_turmas", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Aprovação (%)</Label>
              <Input type="number" min={0} max={100} step="0.1" value={dados.taxa_aprovacao || ""} onChange={(e) => updateDados("taxa_aprovacao", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Desistência (%)</Label>
              <Input type="number" min={0} max={100} step="0.1" value={dados.taxa_desistencia || ""} onChange={(e) => updateDados("taxa_desistencia", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      );
    }

    if (tipo === "OUTRO") {
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary">Informações Adicionais</h4>
          <div className="space-y-2">
            <Label>Categoria do Expediente</Label>
            <Input value={dados.categoria || ""} onChange={(e) => updateDados("categoria", e.target.value)} placeholder="Ex: Transferência, Requisição, etc." />
          </div>
          <div className="space-y-2">
            <Label>Detalhes</Label>
            <Textarea value={dados.detalhes || ""} onChange={(e) => updateDados("detalhes", e.target.value)} placeholder="Forneça detalhes adicionais..." rows={3} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Submeter Novo Expediente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 pb-4">
              {/* Base fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Expediente *</Label>
                  <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoExpediente); setDados({}); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <p>{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unidade Orgânica *</Label>
                  <Select value={escolaId} onValueChange={setEscolaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escola..." />
                    </SelectTrigger>
                    <SelectContent>
                      {escolas?.map((escola) => (
                        <SelectItem key={escola.id} value={escola.id}>
                          {escola.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Mapa de faltas de Janeiro 2026" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Período de Referência</Label>
                    <Input value={periodoReferencia} onChange={(e) => setPeriodoReferencia(e.target.value)} placeholder="Ex: Janeiro 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label>Submetido por</Label>
                    <Input value={submetidoPor} onChange={(e) => setSubmetidoPor(e.target.value)} placeholder="Nome do gestor escolar" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição / Observações</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Informações adicionais sobre este expediente..." rows={2} />
                </div>
              </div>

              {/* Dynamic fields */}
              {tipo && (
                <>
                  <Separator />
                  {renderDynamicFields()}
                </>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!tipo || !escolaId || !titulo || isSubmitting}>
              {isSubmitting ? "A submeter..." : "Submeter Expediente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
