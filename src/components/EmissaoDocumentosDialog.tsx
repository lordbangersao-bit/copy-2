import { useState } from "react";
import { getOfficialPrintHTML, openPrintWindow } from "@/lib/printTemplate";
import { calcularIdade, calcularTempoServico } from "@/lib/calcularAgente";
import { ProfessorWithEscola } from "@/hooks/useProfessores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FileDown, Landmark, Briefcase, Printer } from "lucide-react";

const BANCOS_ANGOLA = [
  "BAI - Banco Angolano de Investimentos",
  "BPC - Banco de Poupança e Crédito",
  "BFA - Banco de Fomento Angola",
  "BIC - Banco BIC",
  "YETU - Banco Yetu",
  "BCI - Banco de Comércio e Indústria",
  "ATLÂNTICO - Banco Millennium Atlântico",
  "SOL - Banco SOL",
  "BE - Banco Económico",
  "BDA - Banco de Desenvolvimento de Angola",
  "BNI - Banco de Negócios Internacional",
  "FNB - Banco FNB Angola",
  "SBA - Standard Bank Angola",
  "BVB - Banco Valor",
  "BKI - Banco Keve",
  "BCH - Banco Comercial do Huambo",
  "BIR - Banco de Investimento Rural",
  "Outro",
];

interface EmissaoDocumentosDialogProps {
  professor: ProfessorWithEscola | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmissaoDocumentosDialog({
  professor,
  open,
  onOpenChange,
}: EmissaoDocumentosDialogProps) {
  const [selectedBank, setSelectedBank] = useState("");
  const [outroBanco, setOutroBanco] = useState("");
  const [finalidade, setFinalidade] = useState("criação de conta bancária");

  if (!professor) return null;

  const val = (v: string | number | boolean | null | undefined): string =>
    v === true ? "Sim" : v === false ? "Não" : v != null ? String(v) : "-";

  const dataAtual = new Date().toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;width:200px;background:#f8f9fa;">${label}</td><td>${value}</td></tr>`;

  const sectionTitle = (name: string) =>
    `<h2 style="font-size:13pt;font-weight:bold;margin:20px 0 10px;border-left:4px solid #1a365d;padding-left:10px;">${name}</h2>`;

  // ===== FICHA COMPLETA =====
  const emitirFichaCompleta = () => {
    const content = `
      ${sectionTitle("Identificação")}
      <table>${[
        row("Nº de Cadastro", val(professor.numero_cadastro)),
        row("Nº Agente", val(professor.numero_agente)),
        row("Nome Completo", val(professor.nome)),
        row("Data de Nascimento", val(professor.data_nascimento)),
        row("Idade", calcularIdade(professor.data_nascimento) !== null ? `${calcularIdade(professor.data_nascimento)} anos` : "-"),
        row("Género", val(professor.genero)),
        row("Documento (BI)", val(professor.cpf)),
        row("Estado Civil", val(professor.estado_civil)),
        row("Telefone", val(professor.telefone)),
        row("Email", val(professor.email)),
        row("Condição Física", val(professor.condicao_fisica)),
        row("Estado de Saúde", val(professor.estado_saude)),
      ].join("")}</table>
      ${sectionTitle("Dados Profissionais")}
      <table>${[
        row("Função", val(professor.funcao)),
        row("Categoria", val(professor.categoria)),
        row("Local de Trabalho", val(professor.escolas?.nome)),
        row("Nível Académico", val(professor.nivel_academico)),
        row("Formado em", val(professor.formado_em)),
        row("Disciplina", val(professor.disciplina)),
        row("Regime de Contrato", val(professor.regime_contrato)),
        row("Data de Admissão", val(professor.data_admissao)),
        row("Início de Função", val(professor.inicio_funcao)),
        row("Tempo de Serviço", val(calcularTempoServico(professor.data_admissao))),
        row("Proc. Disciplinares", val(professor.qtd_processo_disciplinar)),
        row("Actividade", val(professor.actividade)),
        row("Agente Transferido", val(professor.agente_transferido)),
        row("Arquivo Pessoal", val(professor.arquivo_pessoal)),
      ].join("")}</table>
      ${sectionTitle("Localização")}
      <table>${[
        row("Província", val(professor.provincia)),
        row("Comuna", val(professor.comuna)),
        row("Bairro / Localidade", val(professor.bairro_localidade)),
      ].join("")}</table>
      ${sectionTitle("Dados Familiares")}
      <table>${[
        row("Dependentes", val(professor.dependentes)),
        row("Nº de Dependentes", val(professor.num_dependentes)),
        row("Nome do(a) Parceiro(a)", val(professor.nome_parceira)),
        row("Tel. Parceiro(a)", val(professor.telefone_parceira)),
        row("Outro Familiar", val(professor.outro_familiar)),
      ].join("")}</table>
    `;
    openPrintWindow(getOfficialPrintHTML({ title: "FICHA COMPLETA DO AGENTE", content }));
  };

  // ===== FICHA RESUMIDA =====
  const emitirFichaResumida = () => {
    const content = `
      <table>${[
        row("Nome", val(professor.nome)),
        row("Nº Agente", val(professor.numero_agente)),
        row("Nº de Cadastro", val(professor.numero_cadastro)),
        row("Documento (BI)", val(professor.cpf)),
        row("Telefone", val(professor.telefone)),
        row("Género", val(professor.genero)),
        row("Função", val(professor.funcao)),
        row("Categoria", val(professor.categoria)),
        row("Local de Trabalho", val(professor.escolas?.nome)),
        row("Data de Admissão", val(professor.data_admissao)),
        row("Tempo de Serviço", val(calcularTempoServico(professor.data_admissao))),
        row("Actividade", val(professor.actividade)),
      ].join("")}</table>
    `;
    openPrintWindow(getOfficialPrintHTML({ title: "FICHA RESUMIDA DO AGENTE", content }));
  };

  // ===== DECLARAÇÃO DE SERVIÇO =====
  const emitirDeclaracaoServico = () => {
    const content = `
      <p style="text-indent: 40px; font-size: 12pt; line-height: 2; text-align: justify;">
        Para os devidos efeitos, declara-se que <strong>${professor.nome}</strong>, 
        portador(a) do Bilhete de Identidade nº <strong>${val(professor.cpf)}</strong>, 
        Agente nº <strong>${val(professor.numero_agente)}</strong>, 
        é funcionário(a) desta Direcção Municipal da Educação em Namacunde, 
        exercendo a função de <strong>${val(professor.funcao)}</strong>, 
        na categoria de <strong>${val(professor.categoria)}</strong>, 
        colocado(a) na escola/instituição <strong>${val(professor.escolas?.nome)}</strong>, 
        desde <strong>${val(professor.data_admissao)}</strong>, 
        contando com <strong>${val(calcularTempoServico(professor.data_admissao))}</strong> de serviço efectivo.
      </p>
      <br/>
      <p style="text-indent: 40px; font-size: 12pt; line-height: 2; text-align: justify;">
        O(A) declarado(a) encontra-se actualmente em situação de <strong>${val(professor.actividade)}</strong>, 
        sob o regime de contrato <strong>${val(professor.regime_contrato)}</strong>.
      </p>
      <br/>
      <p style="text-indent: 40px; font-size: 12pt; line-height: 2; text-align: justify;">
        A presente declaração é passada a pedido do(a) interessado(a), para os fins que entender convenientes.
      </p>
    `;
    openPrintWindow(getOfficialPrintHTML({ title: "DECLARAÇÃO DE SERVIÇO", content }));
  };

  // ===== DECLARAÇÃO PARA CRÉDITO BANCÁRIO =====
  const emitirDeclaracaoBancaria = () => {
    const nomeBanco = selectedBank === "Outro" ? outroBanco : selectedBank;
    if (!nomeBanco) return;

    const content = `
      <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 20px;">
        Ao ${nomeBanco}
      </p>
      <br/>
      <p style="text-indent: 40px; font-size: 12pt; line-height: 2; text-align: justify;">
        Para os devidos efeitos, junto ao <strong>${nomeBanco}</strong>, declara-se que 
        <strong>${professor.nome}</strong>, portador(a) do Bilhete de Identidade nº <strong>${val(professor.cpf)}</strong>, 
        Agente nº <strong>${val(professor.numero_agente)}</strong>, 
        é funcionário(a) efectivo(a) desta Direcção Municipal da Educação em Namacunde, 
        Governo Provincial do Cunene, exercendo a função de <strong>${val(professor.funcao)}</strong>, 
        na categoria de <strong>${val(professor.categoria)}</strong>, 
        colocado(a) na escola/instituição <strong>${val(professor.escolas?.nome)}</strong>.
      </p>
      <br/>
      <p style="text-indent: 40px; font-size: 12pt; line-height: 2; text-align: justify;">
        O(A) referido(a) agente encontra-se ao serviço desta instituição desde <strong>${val(professor.data_admissao)}</strong>, 
        contando com <strong>${val(calcularTempoServico(professor.data_admissao))}</strong> de serviço efectivo, 
        sob o regime de contrato <strong>${val(professor.regime_contrato)}</strong>, 
        encontrando-se actualmente em situação de <strong>${val(professor.actividade)}</strong>.
      </p>
      <br/>
      <p style="text-indent: 40px; font-size: 12pt; line-height: 2; text-align: justify;">
        A presente declaração é emitida para efeitos de <strong>${finalidade}</strong>, 
        junto ao <strong>${nomeBanco}</strong>, e vai devidamente assinada e carimbada.
      </p>
      <br/>
      <p style="font-size: 11pt; margin-top: 20px;">
        <strong>Dados do Agente:</strong>
      </p>
      <table style="margin-top:10px;">${[
        row("Nome Completo", val(professor.nome)),
        row("Nº Agente", val(professor.numero_agente)),
        row("Nº de Cadastro", val(professor.numero_cadastro)),
        row("Bilhete de Identidade", val(professor.cpf)),
        row("Função", val(professor.funcao)),
        row("Categoria", val(professor.categoria)),
        row("Local de Trabalho", val(professor.escolas?.nome)),
        row("Data de Admissão", val(professor.data_admissao)),
        row("Tempo de Serviço", val(calcularTempoServico(professor.data_admissao))),
        row("Telefone", val(professor.telefone)),
      ].join("")}</table>
    `;
    openPrintWindow(getOfficialPrintHTML({ title: "DECLARAÇÃO PARA FINS BANCÁRIOS", content }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Emissão de Documentos — {professor.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="fichas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fichas" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              Fichas
            </TabsTrigger>
            <TabsTrigger value="declaracao" className="gap-1.5 text-xs sm:text-sm">
              <Briefcase className="h-4 w-4" />
              Declaração
            </TabsTrigger>
            <TabsTrigger value="banco" className="gap-1.5 text-xs sm:text-sm">
              <Landmark className="h-4 w-4" />
              Crédito Bancário
            </TabsTrigger>
          </TabsList>

          {/* ===== FICHAS ===== */}
          <TabsContent value="fichas" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={emitirFichaCompleta}>
                <CardContent className="pt-6 text-center space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-primary/60" />
                  <div>
                    <h3 className="font-semibold">Ficha Completa</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Todos os dados pessoais, profissionais, localização e familiares
                    </p>
                  </div>
                  <Button size="sm" className="w-full gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir Ficha Completa
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={emitirFichaResumida}>
                <CardContent className="pt-6 text-center space-y-3">
                  <FileDown className="h-12 w-12 mx-auto text-primary/60" />
                  <div>
                    <h3 className="font-semibold">Ficha Resumida</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados essenciais: nome, função, categoria e tempo de serviço
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir Ficha Resumida
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== DECLARAÇÃO DE SERVIÇO ===== */}
          <TabsContent value="declaracao" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Briefcase className="h-10 w-10 text-primary/60 shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h3 className="font-semibold">Declaração de Serviço</h3>
                    <p className="text-sm text-muted-foreground">
                      Documento oficial que comprova o vínculo laboral do agente com a Direcção Municipal da Educação em Namacunde.
                    </p>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agente:</span>
                    <span className="font-medium">{professor.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nº Agente:</span>
                    <span className="font-medium">{professor.numero_agente || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Função:</span>
                    <span className="font-medium">{professor.funcao || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo de Serviço:</span>
                    <span className="font-medium">{calcularTempoServico(professor.data_admissao) || "-"}</span>
                  </div>
                </div>
                <Button onClick={emitirDeclaracaoServico} className="w-full gap-2">
                  <Printer className="h-4 w-4" />
                  Emitir Declaração de Serviço
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== DECLARAÇÃO BANCÁRIA ===== */}
          <TabsContent value="banco" className="mt-4">
            <ScrollArea className="h-[50vh]">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Landmark className="h-10 w-10 text-primary/60 shrink-0 mt-1" />
                    <div className="space-y-1">
                      <h3 className="font-semibold">Declaração para Crédito Bancário</h3>
                      <p className="text-sm text-muted-foreground">
                        Documento oficial dirigido a instituições bancárias para efeitos de criação de conta, adesão de crédito ou outros serviços financeiros.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="banco">Banco Destinatário *</Label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger id="banco">
                          <SelectValue placeholder="Seleccione o banco..." />
                        </SelectTrigger>
                        <SelectContent>
                          {BANCOS_ANGOLA.map((banco) => (
                            <SelectItem key={banco} value={banco}>
                              {banco}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedBank === "Outro" && (
                      <div className="space-y-2">
                        <Label htmlFor="outro-banco">Nome do Banco</Label>
                        <Input
                          id="outro-banco"
                          placeholder="Digite o nome do banco..."
                          value={outroBanco}
                          onChange={(e) => setOutroBanco(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="finalidade">Finalidade</Label>
                      <Select value={finalidade} onValueChange={setFinalidade}>
                        <SelectTrigger id="finalidade">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="criação de conta bancária">Criação de Conta Bancária</SelectItem>
                          <SelectItem value="adesão de crédito pessoal">Adesão de Crédito Pessoal</SelectItem>
                          <SelectItem value="adesão de crédito habitação">Adesão de Crédito Habitação</SelectItem>
                          <SelectItem value="adesão de crédito automóvel">Adesão de Crédito Automóvel</SelectItem>
                          <SelectItem value="adesão de microcrédito">Adesão de Microcrédito</SelectItem>
                          <SelectItem value="comprovação de vínculo laboral">Comprovação de Vínculo Laboral</SelectItem>
                          <SelectItem value="domiciliação de salário">Domiciliação de Salário</SelectItem>
                          <SelectItem value="outros fins bancários">Outros Fins Bancários</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agente:</span>
                      <span className="font-medium">{professor.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BI:</span>
                      <span className="font-medium">{professor.cpf || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Função:</span>
                      <span className="font-medium">{professor.funcao || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banco:</span>
                      <span className="font-medium">
                        {selectedBank === "Outro" ? outroBanco || "—" : selectedBank || "—"}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={emitirDeclaracaoBancaria}
                    className="w-full gap-2"
                    disabled={!selectedBank || (selectedBank === "Outro" && !outroBanco)}
                  >
                    <Printer className="h-4 w-4" />
                    Emitir Declaração Bancária
                  </Button>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
