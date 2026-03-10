import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Professor, ProfessorInput } from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";

const professorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  numero_cadastro: z.string().nullable(),
  numero_agente: z.string().nullable(),
  cpf: z.string().nullable(),
  email: z.string().email("Email inválido").nullable().or(z.literal("")),
  telefone: z.string().nullable(),
  disciplina: z.string().nullable(),
  escola_id: z.string().nullable(),
  data_admissao: z.string().nullable(),
  status: z.string().default("ativo"),
  idade: z.number().nullable(),
  genero: z.string().nullable(),
  arquivo_pessoal: z.string().nullable(),
  funcao: z.string().nullable(),
  categoria: z.string().nullable(),
  nivel_academico: z.string().nullable(),
  formado_em: z.string().nullable(),
  regime_contrato: z.string().nullable(),
  inicio_funcao: z.string().nullable(),
  tempo_servico: z.string().nullable(),
  qtd_processo_disciplinar: z.number().nullable(),
  estado_civil: z.string().nullable(),
  data_nascimento: z.string().nullable(),
  provincia: z.string().nullable(),
  comuna: z.string().nullable(),
  bairro_localidade: z.string().nullable(),
  condicao_fisica: z.string().nullable(),
  estado_saude: z.string().nullable(),
  actividade: z.string().nullable(),
  agente_transferido: z.boolean().nullable(),
  dependentes: z.string().nullable(),
  num_dependentes: z.number().nullable(),
  nome_parceira: z.string().nullable(),
  telefone_parceira: z.string().nullable(),
  outro_familiar: z.string().nullable(),
});

interface ProfessorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor?: Professor | null;
  onSubmit: (data: ProfessorInput) => void;
  isLoading?: boolean;
}

const GENERO_OPTIONS = ["Masculino", "Feminino", "Outro"];
const FUNCAO_OPTIONS = ["Professor", "Coordenador", "Director", "Subdirector", "Administrativo", "Auxiliar"];
const CATEGORIA_OPTIONS = [
  "Prof. do Ens. Primário e Sec. do 1º Grau",
  "Prof. do Ens. Primário e Sec. do 2º Grau",
  "Prof. do Ens. Primário e Sec. do 3º Grau",
  "Prof. do Ens. Primário e Sec. do 4º Grau",
  "Prof. do Ens. Primário e Sec. do 5º Grau",
  "Prof. do Ens. Primário e Sec. do 6º Grau",
  "Prof. do Ens. Primário e Sec. do 7º Grau",
  "Prof. do Ens. Primário e Sec. do 8º Grau",
  "Prof. do Ens. Primário e Sec. do 9º Grau",
  "Prof. do Ens. Primário e Sec. do 10º Grau",
  "Prof. do Ens. Primário e Sec. do 11º Grau",
  "Prof. do Ens. Primário e Sec. do 12º Grau",
  "Prof. do Ens. Primário e Sec. do 13º Grau",
  "Prof. Auxiliar do 1º grau",
  "Prof. Auxiliar do 2º grau",
  "Prof. Auxiliar do 3º grau",
  "Prof. Auxiliar do 4º grau",
  "Prof. Auxiliar do 5º grau",
  "Auxiliar de Limpeza",
  "Operário Qualificado",
  "Director (Nomeado)",
  "Director (Sem Nomeação)",
  "Subdirector Pedagógico (Nomeado)",
  "Subdirector Pedagógico (Sem Nomeação)",
  "Subdirector Administrativo (Nomeado)",
  "Subdirector Administrativo (Sem Nomeação)",
  "Coordenador da Iniciação",
  "Coordenador da 1ª Classe",
  "Coordenador da 2ª Classe",
  "Coordenador da 3ª Classe",
  "Coordenador da 4ª Classe",
  "Coordenador da 5ª Classe",
  "Coordenador da 6ª Classe",
  "Director Municipal da Educação",
];
const NIVEL_ACADEMICO_OPTIONS = ["Ensino Médio", "Licenciatura", "Bacharelado", "Mestrado", "Doutorado", "Pós-Doutorado"];
const REGIME_CONTRATO_OPTIONS = ["Efectivo", "Contratado", "Temporário", "Estagiário"];
const ESTADO_CIVIL_OPTIONS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União de Facto"];
const CONDICAO_FISICA_OPTIONS = ["Normal", "Deficiência Visual", "Deficiência Auditiva", "Deficiência Motora", "Outra"];
const ESTADO_SAUDE_OPTIONS = ["Bom", "Regular", "Acompanhamento Médico", "Licença Médica"];
const ACTIVIDADE_OPTIONS = ["Activo", "Inactivo", "Reformado", "Licença"];

export function ProfessorForm({
  open,
  onOpenChange,
  professor,
  onSubmit,
  isLoading,
}: ProfessorFormProps) {
  const { data: escolas } = useEscolas();

  const form = useForm<ProfessorInput>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      nome: "",
      numero_cadastro: "",
      numero_agente: "",
      cpf: "",
      email: "",
      telefone: "",
      disciplina: "",
      escola_id: null,
      data_admissao: "",
      status: "ativo",
      idade: null,
      genero: "",
      arquivo_pessoal: "",
      funcao: "",
      categoria: "",
      nivel_academico: "",
      formado_em: "",
      regime_contrato: "",
      inicio_funcao: "",
      tempo_servico: "",
      qtd_processo_disciplinar: 0,
      estado_civil: "",
      data_nascimento: "",
      provincia: "",
      comuna: "",
      bairro_localidade: "",
      condicao_fisica: "",
      estado_saude: "",
      actividade: "activo",
      agente_transferido: false,
      dependentes: "",
      num_dependentes: 0,
      nome_parceira: "",
      telefone_parceira: "",
      outro_familiar: "",
    },
  });

  useEffect(() => {
    if (professor) {
      form.reset({
        nome: professor.nome || "",
        numero_cadastro: professor.numero_cadastro || "",
        numero_agente: professor.numero_agente || "",
        cpf: professor.cpf || "",
        email: professor.email || "",
        telefone: professor.telefone || "",
        disciplina: professor.disciplina || "",
        escola_id: professor.escola_id || null,
        data_admissao: professor.data_admissao || "",
        status: professor.status || "ativo",
        idade: professor.idade || null,
        genero: professor.genero || "",
        arquivo_pessoal: professor.arquivo_pessoal || "",
        funcao: professor.funcao || "",
        categoria: professor.categoria || "",
        nivel_academico: professor.nivel_academico || "",
        formado_em: professor.formado_em || "",
        regime_contrato: professor.regime_contrato || "",
        inicio_funcao: professor.inicio_funcao || "",
        tempo_servico: professor.tempo_servico || "",
        qtd_processo_disciplinar: professor.qtd_processo_disciplinar || 0,
        estado_civil: professor.estado_civil || "",
        data_nascimento: professor.data_nascimento || "",
        provincia: professor.provincia || "",
        comuna: professor.comuna || "",
        bairro_localidade: professor.bairro_localidade || "",
        condicao_fisica: professor.condicao_fisica || "",
        estado_saude: professor.estado_saude || "",
        actividade: professor.actividade || "activo",
        agente_transferido: professor.agente_transferido || false,
        dependentes: professor.dependentes || "",
        num_dependentes: professor.num_dependentes || 0,
        nome_parceira: professor.nome_parceira || "",
        telefone_parceira: professor.telefone_parceira || "",
        outro_familiar: professor.outro_familiar || "",
      });
    } else {
      form.reset({
        nome: "",
        numero_cadastro: "",
        numero_agente: "",
        cpf: "",
        email: "",
        telefone: "",
        disciplina: "",
        escola_id: null,
        data_admissao: "",
        status: "ativo",
        idade: null,
        genero: "",
        arquivo_pessoal: "",
        funcao: "",
        categoria: "",
        nivel_academico: "",
        formado_em: "",
        regime_contrato: "",
        inicio_funcao: "",
        tempo_servico: "",
        qtd_processo_disciplinar: 0,
        estado_civil: "",
        data_nascimento: "",
        provincia: "",
        comuna: "",
        bairro_localidade: "",
        condicao_fisica: "",
        estado_saude: "",
        actividade: "activo",
        agente_transferido: false,
        dependentes: "",
        num_dependentes: 0,
        nome_parceira: "",
        telefone_parceira: "",
        outro_familiar: "",
      });
    }
  }, [professor, form]);

  const handleSubmit = (data: ProfessorInput) => {
    const cleanData = {
      ...data,
      cpf: data.cpf || null,
      email: data.email || null,
      telefone: data.telefone || null,
      disciplina: data.disciplina || null,
      escola_id: data.escola_id || null,
      data_admissao: data.data_admissao || null,
      numero_cadastro: data.numero_cadastro || null,
      numero_agente: data.numero_agente || null,
      genero: data.genero || null,
      arquivo_pessoal: data.arquivo_pessoal || null,
      funcao: data.funcao || null,
      categoria: data.categoria || null,
      nivel_academico: data.nivel_academico || null,
      formado_em: data.formado_em || null,
      regime_contrato: data.regime_contrato || null,
      inicio_funcao: data.inicio_funcao || null,
      tempo_servico: data.tempo_servico || null,
      estado_civil: data.estado_civil || null,
      data_nascimento: data.data_nascimento || null,
      provincia: data.provincia || null,
      comuna: data.comuna || null,
      bairro_localidade: data.bairro_localidade || null,
      condicao_fisica: data.condicao_fisica || null,
      estado_saude: data.estado_saude || null,
      actividade: data.actividade || null,
      dependentes: data.dependentes || null,
      nome_parceira: data.nome_parceira || null,
      telefone_parceira: data.telefone_parceira || null,
      outro_familiar: data.outro_familiar || null,
    };
    onSubmit(cleanData);
    form.reset();
    onOpenChange(false);
  };

  const renderSelectField = (
    name: keyof ProfessorInput,
    label: string,
    options: string[],
    placeholder: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString() || ""}
          >
            <FormControl>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-background z-50">
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {professor ? "Editar Agente" : "Novo Agente"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <Tabs defaultValue="identificacao" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="identificacao">Identificação</TabsTrigger>
                  <TabsTrigger value="profissional">Profissional</TabsTrigger>
                  <TabsTrigger value="localizacao">Localização</TabsTrigger>
                  <TabsTrigger value="familia">Família</TabsTrigger>
                </TabsList>

                <TabsContent value="identificacao" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="numero_cadastro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Cadastro</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de cadastro" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero_agente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº Agente</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do agente" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do agente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {renderSelectField("genero", "Género", GENERO_OPTIONS, "Selecione")}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Documento de Identidade</FormLabel>
                          <FormControl>
                            <Input placeholder="BI / Passaporte" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {renderSelectField("estado_civil", "Estado Civil", ESTADO_CIVIL_OPTIONS, "Selecione")}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="+244 900 000 000" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {renderSelectField("condicao_fisica", "Condição Física", CONDICAO_FISICA_OPTIONS, "Selecione")}
                    {renderSelectField("estado_saude", "Estado de Saúde", ESTADO_SAUDE_OPTIONS, "Selecione")}
                  </div>

                  <FormField
                    control={form.control}
                    name="arquivo_pessoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arquivo Pessoal / Documentos</FormLabel>
                        <FormControl>
                          <Input placeholder="Referência do arquivo" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="profissional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderSelectField("funcao", "Função", FUNCAO_OPTIONS, "Selecione")}
                    {renderSelectField("categoria", "Categoria", CATEGORIA_OPTIONS, "Selecione")}
                  </div>

                  <FormField
                    control={form.control}
                    name="escola_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local de Trabalho</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Selecione uma escola" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            {escolas?.map((escola) => (
                              <SelectItem key={escola.id} value={escola.id}>
                                {escola.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {renderSelectField("nivel_academico", "Nível Académico", NIVEL_ACADEMICO_OPTIONS, "Selecione")}
                    <FormField
                      control={form.control}
                      name="formado_em"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formado em</FormLabel>
                          <FormControl>
                            <Input placeholder="Área de formação" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="disciplina"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplina que Leciona</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Matemática" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {renderSelectField("regime_contrato", "Regime de Contrato", REGIME_CONTRATO_OPTIONS, "Selecione")}
                    <FormField
                      control={form.control}
                      name="inicio_funcao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início de Função</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="qtd_processo_disciplinar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qtd. Processos Disciplinares</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || 0}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {renderSelectField("actividade", "Actividade", ACTIVIDADE_OPTIONS, "Selecione")}
                    <FormField
                      control={form.control}
                      name="agente_transferido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agente Transferido</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={field.value ? "true" : "false"}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="false">Não</SelectItem>
                              <SelectItem value="true">Sim</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="afastado">Afastado</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="localizacao" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Província em que Trabalha</FormLabel>
                        <FormControl>
                          <Input placeholder="Província" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="comuna"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comuna</FormLabel>
                          <FormControl>
                            <Input placeholder="Comuna" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bairro_localidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro / Localidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro ou localidade" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="familia" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dependentes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dependentes</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição dos dependentes" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="num_dependentes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Dependentes</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || 0}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome_parceira"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do(a) Parceiro(a)</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone_parceira"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do(a) Parceiro(a)</FormLabel>
                          <FormControl>
                            <Input placeholder="+244 900 000 000" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="outro_familiar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outro Familiar Próximo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome e contato" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
