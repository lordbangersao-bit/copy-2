import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "consulta_agente",
  title: "Consultar agente",
  description:
    "Consulta pública de dados de um agente do DMEN Gestor. Requer número de agente, número do BI e a chave única fornecida pelo sistema.",
  inputSchema: {
    numero_agente: z.string().min(1).describe("Número de agente"),
    bi: z.string().min(1).describe("Número do Bilhete de Identidade"),
    chave_unica: z.string().min(1).describe("Chave única de 12 caracteres fornecida pelo sistema"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ numero_agente, bi, chave_unica }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Configuração do backend indisponível." }], isError: true };
    }
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("consulta_publica_agente", {
      _numero_agente: numero_agente.trim(),
      _bi: bi.trim(),
      _chave: chave_unica.trim(),
    });
    if (error) {
      return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return { content: [{ type: "text", text: "Nenhum agente encontrado com os dados fornecidos." }] };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
      structuredContent: { agente: row },
    };
  },
});
