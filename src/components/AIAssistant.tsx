import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bot, X, Send, Sparkles, Loader2, MessageSquare,
  Printer, Search, ArrowRight, Filter, LayoutGrid, Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEscolas } from "@/hooks/useEscolas";
import { useProfessores } from "@/hooks/useProfessores";
import { classificarFuncionario } from "@/lib/classificarFuncionario";
import { getOfficialPrintHTML, openPrintWindow } from "@/lib/printTemplate";

type Msg = { role: "user" | "assistant"; content: string };

interface AIAction {
  type: "navigate" | "search" | "print" | "filter" | "group";
  param: string;
  label: string;
  icon: React.ReactNode;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

// Parse [[ACTION:type:param]] from text
function parseActions(text: string): { cleanText: string; actions: AIAction[] } {
  const actionRegex = /\[\[ACTION:(\w+):([^\]]+)\]\]/g;
  const actions: AIAction[] = [];
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    const [, type, param] = match;
    const iconMap: Record<string, React.ReactNode> = {
      navigate: <ArrowRight className="h-3.5 w-3.5" />,
      search: <Search className="h-3.5 w-3.5" />,
      print: <Printer className="h-3.5 w-3.5" />,
      filter: <Filter className="h-3.5 w-3.5" />,
      group: <LayoutGrid className="h-3.5 w-3.5" />,
    };
    const labelMap: Record<string, string> = {
      navigate: `Ir para ${param}`,
      search: `Pesquisar "${param}"`,
      print: `Imprimir: ${param}`,
      filter: `Filtrar: ${param}`,
      group: `Agrupar por ${param}`,
    };
    actions.push({
      type: type as AIAction["type"],
      param,
      label: labelMap[type] || param,
      icon: iconMap[type] || <ArrowRight className="h-3.5 w-3.5" />,
    });
  }

  const cleanText = text.replace(actionRegex, "").trim();
  return { cleanText, actions };
}

async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  context: any;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (resp.status === 429) {
    toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
    throw new Error("Rate limited");
  }
  if (resp.status === 402) {
    toast.error("Créditos de IA insuficientes.");
    throw new Error("Payment required");
  }
  if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const SUGGESTIONS = [
  "Quantos agentes existem no sistema?",
  "Lista os agentes docentes",
  "Agrupar agentes por escola",
  "Pesquisar agentes femininos",
  "Imprimir relatório geral",
  "Quais escolas têm mais alunos?",
];

export function AIAssistant() {
  const navigate = useNavigate();
  const { data: escolas } = useEscolas();
  const { data: professores } = useProfessores();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Build context data to send to AI
  const context = useMemo(() => {
    if (!professores && !escolas) return null;

    const agentesComClasse = professores?.map((p) => {
      const info = classificarFuncionario(p.categoria, p.funcao);
      const escola = escolas?.find((e) => e.id === p.escola_id);
      return {
        ...p,
        classe: info.label,
        subclasse: info.subclasse,
        escola_nome: escola?.nome || "Sem escola",
      };
    }) || [];

    const classificacao = {
      docente: agentesComClasse.filter((a) => a.classe === "Pessoal Docente").length,
      direccao_chefia: agentesComClasse.filter((a) => a.classe === "Direcção e Chefia").length,
      administrativo: agentesComClasse.filter((a) => a.classe === "Pessoal Administrativo").length,
      operario_apoio: agentesComClasse.filter((a) => a.classe === "Pessoal Operário e de Apoio").length,
    };

    const activos = professores?.filter((p) => p.status === "ativo" || p.actividade?.toLowerCase() === "activo").length || 0;

    return {
      resumo: {
        total_agentes: professores?.length || 0,
        agentes_activos: activos,
        agentes_afastados: (professores?.length || 0) - activos,
        total_escolas: escolas?.length || 0,
        total_alunos: escolas?.reduce((acc, e) => acc + (e.total_alunos || 0), 0) || 0,
      },
      classificacao,
      agentes: agentesComClasse,
      escolas: escolas || [],
    };
  }, [professores, escolas]);

  // Handle AI actions
  const handleAction = useCallback((action: AIAction) => {
    switch (action.type) {
      case "navigate":
        navigate(action.param);
        setOpen(false);
        toast.success(`Navegando para ${action.param}`);
        break;

      case "search": {
        navigate(`/professores?search=${encodeURIComponent(action.param)}`);
        setOpen(false);
        toast.success(`Pesquisando "${action.param}"`);
        break;
      }

      case "print": {
        const lastAssistant = messages.filter((m) => m.role === "assistant").pop();
        const printContent = lastAssistant?.content || "";
        const { cleanText } = parseActions(printContent);

        const formattedContent = cleanText.replace(/\n/g, '<br/>')
          .replace(/\|(.+)\|/g, (match) => {
            const rows = match.split('\n').filter(r => r.trim());
            if (rows.length < 2) return match;
            const headers = rows[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
            const body = rows.slice(2).map(r => {
              const cells = r.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
              return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
          });

        const html = getOfficialPrintHTML({
          title: action.param,
          content: formattedContent,
        });
        openPrintWindow(html);
        toast.success("Documento preparado para impressão");
        break;
      }

      case "filter": {
        const [field, value] = action.param.split("=");
        navigate(`/professores?filter=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`);
        setOpen(false);
        toast.success(`Filtro aplicado: ${action.param}`);
        break;
      }

      case "group": {
        navigate(`/professores?group=${encodeURIComponent(action.param)}`);
        setOpen(false);
        toast.success(`Agrupando por ${action.param}`);
        break;
      }
    }
  }, [navigate, messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        context,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
      });
    } catch {
      setIsLoading(false);
    }
  }, [messages, isLoading, context]);

  const clearChat = useCallback(() => {
    setMessages([]);
    toast.success("Conversa limpa");
  }, []);

  // Render a message with action buttons
  const renderMessage = (msg: Msg, index: number) => {
    if (msg.role === "user") {
      return (
        <div key={index} className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-br-md">
            {msg.content}
          </div>
        </div>
      );
    }

    const { cleanText, actions } = parseActions(msg.content);

    return (
      <div key={index} className="flex justify-start">
        <div className="max-w-[90%] space-y-2">
          <div className="rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground rounded-bl-md">
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>table]:text-xs [&>table]:w-full [&_th]:bg-primary/10 [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
              <ReactMarkdown>{cleanText}</ReactMarkdown>
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {actions.map((action, aIdx) => (
                <Button
                  key={aIdx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(action)}
                  className="h-7 text-xs gap-1.5 rounded-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          open && "scale-0 opacity-0"
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[400px] max-h-[620px] rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
          open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Assistente IA</p>
              <p className="text-[10px] text-muted-foreground">DMEN Gestor • Dados em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">Online</Badge>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat} title="Limpar conversa">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[440px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Olá! 👋</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sou o assistente do DMEN Gestor. Posso pesquisar, agrupar, filtrar e imprimir dados.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors border border-border/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => renderMessage(msg, i))
          )}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pesquisar, agrupar, imprimir..."
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
