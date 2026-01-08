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
import { Escola, EscolaInput } from "@/hooks/useEscolas";

const escolaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  endereco: z.string().nullable(),
  telefone: z.string().nullable(),
  email: z.string().email("Email inválido").nullable().or(z.literal("")),
  diretor: z.string().nullable(),
});

interface EscolaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escola?: Escola | null;
  onSubmit: (data: EscolaInput) => void;
  isLoading?: boolean;
}

export function EscolaForm({
  open,
  onOpenChange,
  escola,
  onSubmit,
  isLoading,
}: EscolaFormProps) {
  const form = useForm<EscolaInput>({
    resolver: zodResolver(escolaSchema),
    defaultValues: {
      nome: escola?.nome || "",
      endereco: escola?.endereco || "",
      telefone: escola?.telefone || "",
      email: escola?.email || "",
      diretor: escola?.diretor || "",
    },
  });

  const handleSubmit = (data: EscolaInput) => {
    const cleanData = {
      ...data,
      email: data.email || null,
      endereco: data.endereco || null,
      telefone: data.telefone || null,
      diretor: data.diretor || null,
    };
    onSubmit(cleanData);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {escola ? "Editar Escola" : "Nova Escola"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Escola *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: EMEF João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Rua, número, bairro" 
                      {...field} 
                      value={field.value || ""} 
                    />
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
                      <Input 
                        placeholder="(00) 0000-0000" 
                        {...field} 
                        value={field.value || ""} 
                      />
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
                      <Input 
                        type="email" 
                        placeholder="escola@email.com" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="diretor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diretor(a)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome do diretor" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
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
