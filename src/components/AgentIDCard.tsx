import { forwardRef, useMemo } from "react";
import { ProfessorWithEscola } from "@/hooks/useProfessores";
import { User } from "lucide-react";

function simplificarFuncao(funcao?: string | null): string {
  if (!funcao) return "-";
  if (/professor/i.test(funcao)) return "Professor";
  if (/director|diretor/i.test(funcao)) return "Director";
  if (/subdirector|subdiretor/i.test(funcao)) return "Subdirector";
  if (/coordenador/i.test(funcao)) return "Coordenador";
  if (/secret[aá]rio/i.test(funcao)) return "Secretário";
  return funcao;
}

function abreviarEscola(nome?: string | null): string {
  if (!nome) return "Não atribuído";
  return nome.replace(/^Complexo Escolar\b/i, "Comp. Esc.");
}

interface AgentIDCardProps {
  professor: ProfessorWithEscola;
}

export const AgentIDCard = forwardRef<HTMLDivElement, AgentIDCardProps>(
  ({ professor }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[340px] h-[214px] bg-gradient-to-br from-primary/90 via-primary to-primary/80 rounded-xl shadow-2xl overflow-hidden relative"
        style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 340 214">
            <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="white" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>

        {/* Header */}
        <div className="bg-white/95 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">DPE</span>
            </div>
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wide">
                República de Angola
              </p>
              <p className="text-[10px] font-semibold text-foreground leading-tight">
                Direcção Provincial da Educação
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-muted-foreground uppercase">Cartão de</p>
            <p className="text-sm font-bold text-primary">IDENTIFICAÇÃO</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-24 h-28 bg-white rounded-lg shadow-inner flex items-center justify-center overflow-hidden border-2 border-white/50">
              {professor.foto_url ? (
                <img
                  src={professor.foto_url}
                  alt={professor.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <User className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-white space-y-2 min-w-0">
            <div>
              <p className="text-[8px] uppercase opacity-70 tracking-wider">Nome</p>
              <p className="text-sm font-bold truncate leading-tight">
                {professor.nome}
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase opacity-70 tracking-wider">Local de Trabalho</p>
              <p className="text-xs font-medium truncate leading-tight">
                {professor.escolas?.nome || "Não atribuído"}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[8px] uppercase opacity-70 tracking-wider">Função</p>
                <p className="text-xs font-medium truncate">
                  {professor.funcao || "-"}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[8px] uppercase opacity-70 tracking-wider">Categoria</p>
                <p className="text-xs font-medium truncate">
                  {professor.categoria || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm px-4 py-1.5 flex items-center justify-between">
          <div>
            <p className="text-[8px] text-white/70 uppercase">Nº Agente</p>
            <p className="text-xs text-white font-mono font-bold">
              {professor.numero_agente || "---"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-white/70 uppercase">Válido</p>
            <p className="text-xs text-white font-medium">
              {new Date().getFullYear()} - {new Date().getFullYear() + 2}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

AgentIDCard.displayName = "AgentIDCard";
