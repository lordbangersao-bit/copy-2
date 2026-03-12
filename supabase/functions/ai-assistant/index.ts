import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Assistente DMN Gestor, um assistente inteligente e interactivo do sistema de gestão educacional da Direcção Provincial da Educação.

## CAPACIDADES PRINCIPAIS
Você tem acesso aos dados reais do sistema que são enviados como contexto em cada mensagem. Use esses dados para responder com precisão.

### Dados disponíveis:
- Lista completa de agentes (professores, administrativos, operários) com nome, função, categoria, escola, género, status, contacto
- Lista de unidades orgânicas (escolas) com nome, director, total de alunos, docentes, turmas
- Estatísticas calculadas de classificação do pessoal

### Acções que pode executar:
Quando o utilizador pedir uma acção, inclua comandos de acção no formato especial abaixo. O sistema irá renderizar botões clicáveis.

Formato: [[ACTION:tipo:parâmetros]]

Tipos disponíveis:
- [[ACTION:navigate:/caminho]] — Navegar para uma página (ex: /professores, /escolas, /expedientes, /assiduidade, /relatorios)
- [[ACTION:search:termo]] — Pesquisar agentes por nome
- [[ACTION:print:titulo]] — Imprimir/gerar PDF com dados
- [[ACTION:filter:campo=valor]] — Filtrar dados (ex: genero=Masculino, status=ativo, classe=docente)
- [[ACTION:group:campo]] — Agrupar dados por campo (ex: escola, classe, genero, status)

### Exemplos de uso:
- "Pesquisar Maria" → Busque nos dados e mostre resultados + [[ACTION:search:Maria]]
- "Imprimir lista de docentes" → Gere relatório + [[ACTION:print:Lista de Docentes]]
- "Ir para agentes" → [[ACTION:navigate:/professores]]
- "Agrupar por escola" → Mostre agrupamento + [[ACTION:group:escola]]
- "Filtrar mulheres" → Filtre e mostre + [[ACTION:filter:genero=Feminino]]

## REGRAS
- Responda SEMPRE em Português de Angola
- Use os dados reais do contexto — NUNCA invente dados
- Quando pesquisar, mostre resultados em tabela markdown
- Para impressão, formate os dados de forma organizada
- Seja conciso mas completo
- Use formatação markdown para organizar respostas
- Quando o utilizador pedir para "listar", "mostrar", "ver" dados, use os dados do contexto
- Inclua sempre as acções relevantes como botões ao final da resposta
- Para agrupamentos, calcule os totais e mostre em tabela`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context message with real data
    let contextMessage = "";
    if (context) {
      contextMessage = `\n\n## DADOS DO SISTEMA (actualizados agora)\n`;
      
      if (context.resumo) {
        contextMessage += `\n### Resumo Geral:\n${JSON.stringify(context.resumo, null, 2)}\n`;
      }
      
      if (context.agentes && context.agentes.length > 0) {
        contextMessage += `\n### Lista de Agentes (${context.agentes.length} total):\n`;
        contextMessage += JSON.stringify(context.agentes.map((a: any) => ({
          nome: a.nome,
          funcao: a.funcao,
          categoria: a.categoria,
          escola: a.escola_nome,
          genero: a.genero,
          status: a.status,
          actividade: a.actividade,
          telefone: a.telefone,
          email: a.email,
          classe: a.classe,
          subclasse: a.subclasse,
        })), null, 2) + "\n";
      }
      
      if (context.escolas && context.escolas.length > 0) {
        contextMessage += `\n### Unidades Orgânicas (${context.escolas.length} total):\n`;
        contextMessage += JSON.stringify(context.escolas.map((e: any) => ({
          nome: e.nome,
          director: e.diretor,
          total_alunos: e.total_alunos,
          total_docentes: e.total_docentes,
          total_turmas: e.total_turmas,
          endereco: e.endereco,
          telefone: e.telefone,
        })), null, 2) + "\n";
      }
      
      if (context.classificacao) {
        contextMessage += `\n### Classificação do Pessoal:\n${JSON.stringify(context.classificacao, null, 2)}\n`;
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + contextMessage;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Contacte o administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
