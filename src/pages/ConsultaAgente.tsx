import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";
import insignia from "@/assets/insignia-angola.png";

type Resultado = {
  numero_agente: string | null;
  nome: string | null;
  categoria: string | null;
  funcao: string | null;
  disciplina: string | null;
  nivel_academico: string | null;
  regime_contrato: string | null;
  data_admissao: string | null;
  status: string | null;
  unidade_organica: string | null;
  municipio: string | null;
  provincia: string | null;
};

export default function ConsultaAgente() {
  const [numero, setNumero] = useState("");
  const [bi, setBi] = useState("");
  const [chave, setChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const handleConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setResultado(null);

    if (!numero.trim() || !bi.trim() || !chave.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("consulta_publica_agente", {
      _numero_agente: numero.trim(),
      _bi: bi.trim(),
      _chave: chave.trim(),
    });
    setLoading(false);

    if (error) {
      setErro("Não foi possível efectuar a consulta. Tente novamente.");
      return;
    }
    const row = Array.isArray(data) && data.length > 0 ? (data[0] as Resultado) : null;
    if (!row) {
      setErro("Nenhum agente encontrado. Verifique o número, BI e chave única.");
      return;
    }
    setResultado(row);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Consulta pública
          </Badge>
        </div>

        <div className="mb-6 flex flex-col items-center text-center">
          <img src={insignia} alt="Insígnia de Angola" className="h-20 w-20 object-contain" />
          <h1 className="mt-3 text-2xl font-bold">SIGE+ · Consulta Pública de Agente</h1>
          <p className="text-sm text-muted-foreground">
            Direcção Municipal da Educação de Namacunde
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verificar os meus dados</CardTitle>
            <CardDescription>
              Introduza o seu <strong>Número de Agente</strong>, o número do <strong>BI</strong>{" "}
              (conforme cópia entregue) e a <strong>Chave Única</strong> fornecida pelo sistema.
              Todos os três devem coincidir para revelar a informação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConsulta} className="space-y-4">
              <div>
                <Label htmlFor="numero">Número de Agente</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex.: 123456"
                  autoComplete="off"
                  maxLength={30}
                />
              </div>
              <div>
                <Label htmlFor="bi">Número do BI</Label>
                <Input
                  id="bi"
                  value={bi}
                  onChange={(e) => setBi(e.target.value)}
                  placeholder="Ex.: 000000000LA000"
                  autoComplete="off"
                  maxLength={30}
                />
              </div>
              <div>
                <Label htmlFor="chave">Chave Única</Label>
                <Input
                  id="chave"
                  value={chave}
                  onChange={(e) => setChave(e.target.value.toUpperCase())}
                  placeholder="Ex.: A1B2C3D4E5F6"
                  autoComplete="off"
                  maxLength={20}
                  className="font-mono uppercase tracking-wider"
                />
              </div>

              {erro && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Consultar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {resultado && (
          <Card className="mt-6 border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{resultado.nome ?? "—"}</span>
                <Badge>{resultado.status ?? "—"}</Badge>
              </CardTitle>
              <CardDescription>
                Nº Agente: <strong>{resultado.numero_agente ?? "—"}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Info label="Categoria" value={resultado.categoria} />
                <Info label="Função" value={resultado.funcao} />
                <Info label="Disciplina" value={resultado.disciplina} />
                <Info label="Nível Académico" value={resultado.nivel_academico} />
                <Info label="Regime de Contrato" value={resultado.regime_contrato} />
                <Info label="Data de Admissão" value={resultado.data_admissao} />
                <Info label="Unidade Orgânica" value={resultado.unidade_organica} />
                <Info label="Município" value={resultado.municipio} />
                <Info label="Província" value={resultado.provincia} />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Dados oficiais registados na Direcção Municipal da Educação. Para correcções, dirija-se aos serviços.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Todas as consultas são registadas para efeitos de segurança.
        </p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value ?? "—"}</dd>
    </div>
  );
}
