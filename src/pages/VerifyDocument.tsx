import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, ArrowLeft } from "lucide-react";

interface IssuedDoc {
  document_code: string;
  document_number: string;
  document_type: string;
  title: string;
  document_hash: string;
  signature_hash: string;
  municipality: string;
  issued_by_name: string | null;
  revoked: boolean;
  revoked_at: string | null;
  revoke_reason: string | null;
  issued_at: string;
}

export default function VerifyDocument() {
  const { code } = useParams<{ code: string }>();
  const [doc, setDoc] = useState<IssuedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data, error } = await supabase
        .from("issued_documents")
        .select(
          "document_code, document_number, document_type, title, document_hash, signature_hash, municipality, issued_by_name, revoked, revoked_at, revoke_reason, issued_at"
        )
        .eq("document_code", code)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setDoc(data as IssuedDoc);
      }
      setLoading(false);
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            República de Angola · Governo Provincial do Cunene
          </div>
          <h1 className="text-2xl font-bold mt-1">
            Verificação Oficial de Documento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Direcção Municipal da Educação · SIGE
          </p>
        </header>

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3">A validar documento...</span>
            </CardContent>
          </Card>
        )}

        {!loading && notFound && (
          <Card className="border-destructive">
            <CardHeader className="text-center">
              <ShieldX className="h-14 w-14 mx-auto text-destructive" />
              <CardTitle className="text-destructive mt-2">
                Documento Não Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>
                O código <code className="font-mono">{code}</code> não corresponde
                a nenhum documento emitido pelo sistema oficial.
              </p>
              <p className="mt-3">
                Se recebeu este documento de fonte confiável, contacte a Direcção
                Municipal da Educação para confirmação.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && doc && (
          <Card
            className={
              doc.revoked
                ? "border-destructive"
                : "border-emerald-500/60"
            }
          >
            <CardHeader className="text-center pb-2">
              {doc.revoked ? (
                <>
                  <ShieldAlert className="h-14 w-14 mx-auto text-destructive" />
                  <CardTitle className="text-destructive mt-2">
                    Documento Revogado
                  </CardTitle>
                  <Badge variant="destructive" className="mx-auto mt-1">
                    INVÁLIDO
                  </Badge>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-14 w-14 mx-auto text-emerald-600" />
                  <CardTitle className="text-emerald-700 dark:text-emerald-400 mt-2">
                    Documento Autêntico
                  </CardTitle>
                  <Badge className="mx-auto mt-1 bg-emerald-600 hover:bg-emerald-700">
                    VÁLIDO
                  </Badge>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm pt-4">
              <Row label="Título" value={doc.title} />
              <Row label="Tipo" value={doc.document_type} />
              <Row label="Código Oficial" value={doc.document_code} mono />
              <Row label="Nº do Documento" value={doc.document_number} mono />
              <Row label="Município" value={doc.municipality} />
              <Row
                label="Emitido em"
                value={new Date(doc.issued_at).toLocaleString("pt-AO")}
              />
              {doc.issued_by_name && (
                <Row label="Emitido por" value={doc.issued_by_name} />
              )}
              <Row label="Hash SHA-256" value={doc.document_hash} mono break />
              <Row label="Assinatura Digital" value={doc.signature_hash} mono break />

              {doc.revoked && (
                <div className="mt-4 p-3 border border-destructive/50 bg-destructive/5 rounded text-destructive">
                  <p className="font-semibold">⚠ Este documento foi revogado.</p>
                  {doc.revoked_at && (
                    <p className="text-xs mt-1">
                      Revogado em:{" "}
                      {new Date(doc.revoked_at).toLocaleString("pt-AO")}
                    </p>
                  )}
                  {doc.revoke_reason && (
                    <p className="text-xs mt-1">Motivo: {doc.revoke_reason}</p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Esta verificação confirma que o documento foi emitido pelo sistema
                oficial DMEN-SIGE. Para validar a integridade do conteúdo, compare
                o <strong>Hash SHA-256</strong> acima com o exibido no documento
                impresso. Qualquer divergência indica que o documento foi alterado.
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao sistema
            </Link>
          </Button>
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} DMEN — Sistema desenvolvido por Áureo
          Chissanhino Maria da Silva
        </footer>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  break: breakWord,
}: {
  label: string;
  value: string;
  mono?: boolean;
  break?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </div>
      <div
        className={`col-span-2 ${mono ? "font-mono text-xs" : ""} ${
          breakWord ? "break-all" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
