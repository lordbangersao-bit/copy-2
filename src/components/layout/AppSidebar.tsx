import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard, Building2, Users, Calendar, FileText, BarChart3, Settings, LogOut,
  Shield, ChevronLeft, ChevronRight, GraduationCap, ClipboardList, Bell, FolderOpen,
  CheckSquare, MapPin, Map, History, GitCompare, ArrowLeftRight, FileBarChart, Users2, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import insigniaAngola from "@/assets/insignia-angola.png.asset.json";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
  module?: string;
  roles?: AppRole[];
}

// Display labels — mapped to both legacy DB roles and new SIGE+ standard roles
const roleLabels: Record<string, string> = {
  ADMIN: "Administrador Provincial",
  PROVINCIAL_ADMIN: "Administrador Provincial",
  GESTOR_PROVINCIAL: "Administrador Provincial",
  VALIDADOR_PROVINCIAL: "Director Municipal",
  MUNICIPAL_DIRECTOR: "Director Municipal",
  GESTOR_MUNICIPAL: "Gestor Municipal",
  MUNICIPAL_MANAGER: "Gestor Municipal",
  DIRECTOR_ESCOLA: "Gestor da Unidade Orgânica",
  UNIT_MANAGER: "Gestor da Unidade Orgânica",
  TECNICO: "Operador",
  OPERATOR: "Operador",
  VIEWER: "Consulta",
  AUDITOR: "Auditoria e Conformidade",
};

// === SIGE+ — Estrutura de Módulos Institucionais ===

const dashboardNavItems: NavItem[] = [
  { path: "/", label: "Painel Institucional", icon: LayoutDashboard },
];

// 1. Administração Institucional
const institucionalNavItems: NavItem[] = [
  { path: "/provincias", label: "Direcção Provincial (DPE)", icon: Map, roles: ["ADMIN"] },
  { path: "/municipios", label: "Direcção Municipal (DME)", icon: MapPin, roles: ["ADMIN", "GESTOR_PROVINCIAL"] },
  { path: "/escolas", label: "Unidades Orgânicas (UO)", icon: Building2 },
];

// 2. Recursos Humanos  (Agentes = Quadro de Pessoal)
const rhNavItems: NavItem[] = [
  { path: "/professores", label: "Quadro de Pessoal", icon: Users },
  { path: "/inss", label: "Gerador INSS", icon: FileSpreadsheet, roles: ["ADMIN", "GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL"] },
  { path: "/assiduidade", label: "Assiduidade", icon: CheckSquare },
  { path: "/horarios", label: "Colocação e Horários", icon: Calendar },
  { path: "/avaliacoes", label: "Avaliação de Desempenho", icon: ClipboardList },
  { path: "/processos", label: "Processos do Agente", icon: FileText },
  { path: "/presencas", label: "Presenças (Offline)", icon: CheckSquare },
];

// 3. Mobilidade e Transferências
const mobilidadeNavItems: NavItem[] = [
  { path: "/transferencias", label: "Mobilidade & Transferências", icon: ArrowLeftRight, roles: ["ADMIN", "GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL", "DIRECTOR_ESCOLA"] },
  { path: "/aprovacoes", label: "Fila de Aprovações", icon: GitCompare, roles: ["ADMIN", "GESTOR_PROVINCIAL", "VALIDADOR_PROVINCIAL"] },
];

// 4. Documentação Oficial / Verificação
const documentacaoNavItems: NavItem[] = [
  { path: "/documentos", label: "Documentação Oficial", icon: FolderOpen },
  { path: "/expedientes", label: "Expedientes", icon: FileText },
  { path: "/comunicados", label: "Comunicação Institucional", icon: Bell },
  { path: "/documentos-emitidos", label: "Verificação Documental", icon: ShieldCheck },
];

// 5. Estatísticas e Relatórios
const estatisticasNavItems: NavItem[] = [
  { path: "/relatorios", label: "Estatísticas Educacionais", icon: BarChart3 },
  { path: "/relatorios-oficiais", label: "Relatórios Institucionais", icon: FileBarChart, roles: ["ADMIN", "GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL", "AUDITOR"] },
  { path: "/deficit", label: "Déficit Docente", icon: Users2, roles: ["ADMIN", "GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL"] },
];

// 6. Auditoria e Configurações
const adminNavItems: NavItem[] = [
  { path: "/utilizadores", label: "Gestão de Utilizadores", icon: Shield, roles: ["ADMIN"] },
  { path: "/auditoria", label: "Auditoria e Conformidade", icon: History, roles: ["ADMIN", "GESTOR_PROVINCIAL", "AUDITOR"] },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

export function AppSidebar({ collapsed, onToggle, mobile = false }: AppSidebarProps) {
  const location = useLocation();
  const { user, role, isAdmin, signOut } = useAuth();

  const canSeeItem = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  };

  const handleSignOut = async () => { await signOut(); };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    const linkContent = (
      <Link
        to={item.disabled ? "#" : item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          item.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          collapsed && "justify-center px-2"
        )}
        onClick={(e) => item.disabled && e.preventDefault()}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && <Badge variant="secondary" className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">{item.badge}</Badge>}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  const NavSection = ({ title, items }: { title?: string; items: NavItem[] }) => {
    const visibleItems = items.filter(canSeeItem);
    if (visibleItems.length === 0) return null;
    return (
      <div className="space-y-1">
        {title && !collapsed && (
          <h3 className="px-3 py-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider">{title}</h3>
        )}
        {collapsed && title && <Separator className="my-2 bg-sidebar-border" />}
        {visibleItems.map((item) => <NavLink key={item.path} item={item} />)}
      </div>
    );
  };

  return (
    <aside className={cn(
      "left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
      mobile ? "relative z-auto" : "fixed z-40",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center")}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img src={insigniaAngola.url} alt="Insígnia da República de Angola" className="h-9 w-9 object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">SIGE+</span>
              <span className="text-[10px] text-sidebar-muted-foreground leading-tight">
                Sistema Integrado de Gestão da Educação
              </span>
            </div>
          </div>
        ) : (
          <img src={insigniaAngola.url} alt="Insígnia" className="h-9 w-9 object-contain" />
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          <NavSection items={dashboardNavItems} />
          <NavSection title="Administração Institucional" items={institucionalNavItems} />
          <NavSection title="Recursos Humanos" items={rhNavItems} />
          <NavSection title="Mobilidade" items={mobilidadeNavItems} />
          <NavSection title="Documentação" items={documentacaoNavItems} />
          <NavSection title="Estatísticas & Relatórios" items={estatisticasNavItems} />
          <NavSection title="Auditoria & Configurações" items={adminNavItems} />
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary">
              <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email?.split("@")[0] || "Utilizador"}
              </p>
              <p className="text-xs text-sidebar-muted-foreground">
                {roleLabels[role || ""] || "Sem papel"}
              </p>
            </div>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent/30 mx-auto">
                <Shield className="h-5 w-5 text-sidebar-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{user?.email}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[role || ""]}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className={cn("flex gap-2", collapsed && "flex-col")}>
          {!collapsed ? (
            <>
              <Button asChild variant="ghost" size="sm" className="flex-1 justify-start text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                <Link to="/configuracoes"><Settings className="h-4 w-4 mr-2" />Configurações</Link>
              </Button>
              <Button variant="ghost" size="icon" className="text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="text-sidebar-muted-foreground w-10 h-10">
                    <Link to="/configuracoes"><Settings className="h-5 w-5" /></Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Configurações</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10 w-10 h-10" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Terminar Sessão</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onToggle} className={cn("w-full text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50", collapsed && "justify-center")}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" />Recolher</>}
        </Button>
      </div>

      {/* Créditos do criador - NÃO ALTERAR */}
      <div className={cn("px-3 py-2 border-t border-sidebar-border", collapsed && "px-1")}>
        <p className={cn("text-[10px] text-sidebar-muted-foreground/60 text-center leading-tight select-none", collapsed && "hidden")}>
          Criado por <span className="font-semibold text-sidebar-muted-foreground/80">Áureo Chissanhino Maria da Silva</span>
          <br />Advogado e Codificador Informático
        </p>
      </div>
    </aside>
  );
}
