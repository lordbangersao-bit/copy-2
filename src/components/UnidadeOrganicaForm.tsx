import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnidadeOrganica, UnidadeOrganicaInput } from "@/hooks/useUnidadesOrganicas";
import { useEffect } from "react";

const unidadeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo_organico: z.string().nullable(),
  decreto_criacao: z.string().nullable(),
  residencia: z.string().nullable(),
  distancia_sede: z.string().nullable(),
  construcao: z.string().nullable(),
  endereco: z.string().nullable(),
  telefone: z.string().nullable(),
  email: z.string().email("Email inválido").nullable().or(z.literal("")),
  diretor: z.string().nullable(),
  prof_masculino: z.coerce.number().nullable(),
  prof_feminino: z.coerce.number().nullable(),
  total_docentes: z.coerce.number().nullable(),
  alunos_masculino: z.coerce.number().nullable(),
  alunos_feminino: z.coerce.number().nullable(),
  total_alunos: z.coerce.number().nullable(),
  total_turmas: z.coerce.number().nullable(),
  turmas_iniciacao: z.coerce.number().nullable(),
  alunos_masc_iniciacao: z.coerce.number().nullable(),
  alunos_fem_iniciacao: z.coerce.number().nullable(),
  total_alunos_iniciacao: z.coerce.number().nullable(),
  turmas_1_classe: z.coerce.number().nullable(),
  alunos_masc_1_classe: z.coerce.number().nullable(),
  alunos_fem_1_classe: z.coerce.number().nullable(),
  total_alunos_1_classe: z.coerce.number().nullable(),
  turmas_2_classe: z.coerce.number().nullable(),
  alunos_masc_2_classe: z.coerce.number().nullable(),
  alunos_fem_2_classe: z.coerce.number().nullable(),
  total_alunos_2_classe: z.coerce.number().nullable(),
  turmas_3_classe: z.coerce.number().nullable(),
  alunos_masc_3_classe: z.coerce.number().nullable(),
  alunos_fem_3_classe: z.coerce.number().nullable(),
  total_alunos_3_classe: z.coerce.number().nullable(),
  turmas_4_classe: z.coerce.number().nullable(),
  alunos_masc_4_classe: z.coerce.number().nullable(),
  alunos_fem_4_classe: z.coerce.number().nullable(),
  total_alunos_4_classe: z.coerce.number().nullable(),
  turmas_5_classe: z.coerce.number().nullable(),
  alunos_masc_5_classe: z.coerce.number().nullable(),
  alunos_fem_5_classe: z.coerce.number().nullable(),
  total_alunos_5_classe: z.coerce.number().nullable(),
  turmas_6_classe: z.coerce.number().nullable(),
  alunos_masc_6_classe: z.coerce.number().nullable(),
  alunos_fem_6_classe: z.coerce.number().nullable(),
  total_alunos_6_classe: z.coerce.number().nullable(),
  turmas_7_classe: z.coerce.number().nullable(),
  alunos_masc_7_classe: z.coerce.number().nullable(),
  alunos_fem_7_classe: z.coerce.number().nullable(),
  total_alunos_7_classe: z.coerce.number().nullable(),
  turmas_8_classe: z.coerce.number().nullable(),
  alunos_masc_8_classe: z.coerce.number().nullable(),
  alunos_fem_8_classe: z.coerce.number().nullable(),
  total_alunos_8_classe: z.coerce.number().nullable(),
  turmas_9_classe: z.coerce.number().nullable(),
  alunos_masc_9_classe: z.coerce.number().nullable(),
  alunos_fem_9_classe: z.coerce.number().nullable(),
  total_alunos_9_classe: z.coerce.number().nullable(),
  turmas_10_classe: z.coerce.number().nullable(),
  alunos_masc_10_classe: z.coerce.number().nullable(),
  alunos_fem_10_classe: z.coerce.number().nullable(),
  total_alunos_10_classe: z.coerce.number().nullable(),
  turmas_11_classe: z.coerce.number().nullable(),
  alunos_masc_11_classe: z.coerce.number().nullable(),
  alunos_fem_11_classe: z.coerce.number().nullable(),
  total_alunos_11_classe: z.coerce.number().nullable(),
  turmas_12_classe: z.coerce.number().nullable(),
  alunos_masc_12_classe: z.coerce.number().nullable(),
  alunos_fem_12_classe: z.coerce.number().nullable(),
  total_alunos_12_classe: z.coerce.number().nullable(),
  turmas_13_classe: z.coerce.number().nullable(),
  alunos_masc_13_classe: z.coerce.number().nullable(),
  alunos_fem_13_classe: z.coerce.number().nullable(),
  total_alunos_13_classe: z.coerce.number().nullable(),
});

interface UnidadeOrganicaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidade?: UnidadeOrganica | null;
  onSubmit: (data: UnidadeOrganicaInput) => void;
  isLoading?: boolean;
}

const construcaoOptions = ["Sim", "Não", "Em construção", "Parcial"];

export function UnidadeOrganicaForm({
  open,
  onOpenChange,
  unidade,
  onSubmit,
  isLoading,
}: UnidadeOrganicaFormProps) {
  const form = useForm<UnidadeOrganicaInput>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: getDefaultValues(unidade),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(unidade));
    }
  }, [open, unidade, form]);

  function getDefaultValues(unidade?: UnidadeOrganica | null): UnidadeOrganicaInput {
    return {
      nome: unidade?.nome || "",
      codigo_organico: unidade?.codigo_organico || "",
      decreto_criacao: unidade?.decreto_criacao || "",
      residencia: unidade?.residencia || "",
      distancia_sede: unidade?.distancia_sede || "",
      construcao: unidade?.construcao || "",
      endereco: unidade?.endereco || "",
      telefone: unidade?.telefone || "",
      email: unidade?.email || "",
      diretor: unidade?.diretor || "",
      prof_masculino: unidade?.prof_masculino || 0,
      prof_feminino: unidade?.prof_feminino || 0,
      total_docentes: unidade?.total_docentes || 0,
      alunos_masculino: unidade?.alunos_masculino || 0,
      alunos_feminino: unidade?.alunos_feminino || 0,
      total_alunos: unidade?.total_alunos || 0,
      total_turmas: unidade?.total_turmas || 0,
      turmas_iniciacao: unidade?.turmas_iniciacao || 0,
      alunos_masc_iniciacao: unidade?.alunos_masc_iniciacao || 0,
      alunos_fem_iniciacao: unidade?.alunos_fem_iniciacao || 0,
      total_alunos_iniciacao: unidade?.total_alunos_iniciacao || 0,
      turmas_1_classe: unidade?.turmas_1_classe || 0,
      alunos_masc_1_classe: unidade?.alunos_masc_1_classe || 0,
      alunos_fem_1_classe: unidade?.alunos_fem_1_classe || 0,
      total_alunos_1_classe: unidade?.total_alunos_1_classe || 0,
      turmas_2_classe: unidade?.turmas_2_classe || 0,
      alunos_masc_2_classe: unidade?.alunos_masc_2_classe || 0,
      alunos_fem_2_classe: unidade?.alunos_fem_2_classe || 0,
      total_alunos_2_classe: unidade?.total_alunos_2_classe || 0,
      turmas_3_classe: unidade?.turmas_3_classe || 0,
      alunos_masc_3_classe: unidade?.alunos_masc_3_classe || 0,
      alunos_fem_3_classe: unidade?.alunos_fem_3_classe || 0,
      total_alunos_3_classe: unidade?.total_alunos_3_classe || 0,
      turmas_4_classe: unidade?.turmas_4_classe || 0,
      alunos_masc_4_classe: unidade?.alunos_masc_4_classe || 0,
      alunos_fem_4_classe: unidade?.alunos_fem_4_classe || 0,
      total_alunos_4_classe: unidade?.total_alunos_4_classe || 0,
      turmas_5_classe: unidade?.turmas_5_classe || 0,
      alunos_masc_5_classe: unidade?.alunos_masc_5_classe || 0,
      alunos_fem_5_classe: unidade?.alunos_fem_5_classe || 0,
      total_alunos_5_classe: unidade?.total_alunos_5_classe || 0,
      turmas_6_classe: unidade?.turmas_6_classe || 0,
      alunos_masc_6_classe: unidade?.alunos_masc_6_classe || 0,
      alunos_fem_6_classe: unidade?.alunos_fem_6_classe || 0,
      total_alunos_6_classe: unidade?.total_alunos_6_classe || 0,
      turmas_7_classe: unidade?.turmas_7_classe || 0,
      alunos_masc_7_classe: unidade?.alunos_masc_7_classe || 0,
      alunos_fem_7_classe: unidade?.alunos_fem_7_classe || 0,
      total_alunos_7_classe: unidade?.total_alunos_7_classe || 0,
      turmas_8_classe: unidade?.turmas_8_classe || 0,
      alunos_masc_8_classe: unidade?.alunos_masc_8_classe || 0,
      alunos_fem_8_classe: unidade?.alunos_fem_8_classe || 0,
      total_alunos_8_classe: unidade?.total_alunos_8_classe || 0,
      turmas_9_classe: unidade?.turmas_9_classe || 0,
      alunos_masc_9_classe: unidade?.alunos_masc_9_classe || 0,
      alunos_fem_9_classe: unidade?.alunos_fem_9_classe || 0,
      total_alunos_9_classe: unidade?.total_alunos_9_classe || 0,
      turmas_10_classe: unidade?.turmas_10_classe || 0,
      alunos_masc_10_classe: unidade?.alunos_masc_10_classe || 0,
      alunos_fem_10_classe: unidade?.alunos_fem_10_classe || 0,
      total_alunos_10_classe: unidade?.total_alunos_10_classe || 0,
      turmas_11_classe: unidade?.turmas_11_classe || 0,
      alunos_masc_11_classe: unidade?.alunos_masc_11_classe || 0,
      alunos_fem_11_classe: unidade?.alunos_fem_11_classe || 0,
      total_alunos_11_classe: unidade?.total_alunos_11_classe || 0,
      turmas_12_classe: unidade?.turmas_12_classe || 0,
      alunos_masc_12_classe: unidade?.alunos_masc_12_classe || 0,
      alunos_fem_12_classe: unidade?.alunos_fem_12_classe || 0,
      total_alunos_12_classe: unidade?.total_alunos_12_classe || 0,
      turmas_13_classe: unidade?.turmas_13_classe || 0,
      alunos_masc_13_classe: unidade?.alunos_masc_13_classe || 0,
      alunos_fem_13_classe: unidade?.alunos_fem_13_classe || 0,
      total_alunos_13_classe: unidade?.total_alunos_13_classe || 0,
    };
  }

  const handleSubmit = (data: UnidadeOrganicaInput) => {
    const cleanData = {
      ...data,
      email: data.email || null,
      endereco: data.endereco || null,
      telefone: data.telefone || null,
      diretor: data.diretor || null,
      codigo_organico: data.codigo_organico || null,
      decreto_criacao: data.decreto_criacao || null,
      residencia: data.residencia || null,
      distancia_sede: data.distancia_sede || null,
      construcao: data.construcao || null,
    };
    onSubmit(cleanData);
    form.reset();
    onOpenChange(false);
  };

  const renderNumberField = (name: keyof UnidadeOrganicaInput, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              {...field}
              value={field.value ?? 0}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
              className="h-9"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderClasseTab = (classe: string, prefix: string) => (
    <div className="grid grid-cols-2 gap-3">
      {renderNumberField(`turmas_${prefix}` as keyof UnidadeOrganicaInput, `Nº de Turmas`)}
      {renderNumberField(`alunos_masc_${prefix}` as keyof UnidadeOrganicaInput, `Masculino`)}
      {renderNumberField(`alunos_fem_${prefix}` as keyof UnidadeOrganicaInput, `Feminino`)}
      {renderNumberField(`total_alunos_${prefix}` as keyof UnidadeOrganicaInput, `Total`)}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {unidade ? "Editar Unidade Orgânica" : "Nova Unidade Orgânica"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              <Tabs defaultValue="identificacao" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="identificacao">Identificação</TabsTrigger>
                  <TabsTrigger value="docentes">Docentes</TabsTrigger>
                  <TabsTrigger value="alunos">Alunos Geral</TabsTrigger>
                  <TabsTrigger value="classes">Por Classe</TabsTrigger>
                </TabsList>

                <TabsContent value="identificacao" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codigo_organico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Orgânico</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 001" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="decreto_criacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decreto de Criação</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Decreto nº 123/2020" {...field} value={field.value || ""} />
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
                        <FormLabel>Nome da Unidade Orgânica *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Escola Primária Maria Hashondali" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="residencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Residência da Escola</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Namacunde" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="distancia_sede"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distância da Sede (Direção)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 15 km" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="construcao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Construção</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {construcaoOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diretor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diretor(a)</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do diretor" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 0000-0000" {...field} value={field.value || ""} />
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
                            <Input type="email" placeholder="escola@email.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="docentes" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {renderNumberField("prof_masculino", "Professores Masculino")}
                    {renderNumberField("prof_feminino", "Professores Feminino")}
                    {renderNumberField("total_docentes", "Total de Docentes")}
                  </div>
                </TabsContent>

                <TabsContent value="alunos" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderNumberField("alunos_masculino", "Alunos Masculino")}
                    {renderNumberField("alunos_feminino", "Alunos Feminino")}
                    {renderNumberField("total_alunos", "Total de Alunos")}
                    {renderNumberField("total_turmas", "Total de Turmas")}
                  </div>
                </TabsContent>

                <TabsContent value="classes" className="space-y-4">
                  <Tabs defaultValue="iniciacao" className="w-full">
                    <TabsList className="flex flex-wrap gap-1 h-auto">
                      <TabsTrigger value="iniciacao" className="text-xs">Iniciação</TabsTrigger>
                      <TabsTrigger value="1classe" className="text-xs">1ª</TabsTrigger>
                      <TabsTrigger value="2classe" className="text-xs">2ª</TabsTrigger>
                      <TabsTrigger value="3classe" className="text-xs">3ª</TabsTrigger>
                      <TabsTrigger value="4classe" className="text-xs">4ª</TabsTrigger>
                      <TabsTrigger value="5classe" className="text-xs">5ª</TabsTrigger>
                      <TabsTrigger value="6classe" className="text-xs">6ª</TabsTrigger>
                      <TabsTrigger value="7classe" className="text-xs">7ª</TabsTrigger>
                      <TabsTrigger value="8classe" className="text-xs">8ª</TabsTrigger>
                      <TabsTrigger value="9classe" className="text-xs">9ª</TabsTrigger>
                      <TabsTrigger value="10classe" className="text-xs">10ª</TabsTrigger>
                      <TabsTrigger value="11classe" className="text-xs">11ª</TabsTrigger>
                      <TabsTrigger value="12classe" className="text-xs">12ª</TabsTrigger>
                      <TabsTrigger value="13classe" className="text-xs">13ª</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="iniciacao" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">Iniciação</h4>
                      {renderClasseTab("Iniciação", "iniciacao")}
                    </TabsContent>
                    <TabsContent value="1classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">1ª Classe</h4>
                      {renderClasseTab("1ª Classe", "1_classe")}
                    </TabsContent>
                    <TabsContent value="2classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">2ª Classe</h4>
                      {renderClasseTab("2ª Classe", "2_classe")}
                    </TabsContent>
                    <TabsContent value="3classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">3ª Classe</h4>
                      {renderClasseTab("3ª Classe", "3_classe")}
                    </TabsContent>
                    <TabsContent value="4classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">4ª Classe</h4>
                      {renderClasseTab("4ª Classe", "4_classe")}
                    </TabsContent>
                    <TabsContent value="5classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">5ª Classe</h4>
                      {renderClasseTab("5ª Classe", "5_classe")}
                    </TabsContent>
                    <TabsContent value="6classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">6ª Classe</h4>
                      {renderClasseTab("6ª Classe", "6_classe")}
                    </TabsContent>
                    <TabsContent value="7classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">7ª Classe</h4>
                      {renderClasseTab("7ª Classe", "7_classe")}
                    </TabsContent>
                    <TabsContent value="8classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">8ª Classe</h4>
                      {renderClasseTab("8ª Classe", "8_classe")}
                    </TabsContent>
                    <TabsContent value="9classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">9ª Classe</h4>
                      {renderClasseTab("9ª Classe", "9_classe")}
                    </TabsContent>
                    <TabsContent value="10classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">10ª Classe</h4>
                      {renderClasseTab("10ª Classe", "10_classe")}
                    </TabsContent>
                    <TabsContent value="11classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">11ª Classe</h4>
                      {renderClasseTab("11ª Classe", "11_classe")}
                    </TabsContent>
                    <TabsContent value="12classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">12ª Classe</h4>
                      {renderClasseTab("12ª Classe", "12_classe")}
                    </TabsContent>
                    <TabsContent value="13classe" className="mt-4">
                      <h4 className="text-sm font-medium mb-3">13ª Classe</h4>
                      {renderClasseTab("13ª Classe", "13_classe")}
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
