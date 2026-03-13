import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  Bell,
  FolderOpen,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
  module?: string;
}

const mainNavItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, module: "principal" },
  { path: "/escolas", label: "Unidades Orgânicas", icon: Building2, module: "gestao" },
  { path: "/professores", label: "Agentes", icon: Users, module: "gestao" },
];

const managementNavItems: NavItem[] = [
  { path: "/expedientes", label: "Expedientes", icon: FileText, module: "gestao" },
  { path: "/assiduidade", label: "Assiduidade", icon: CheckSquare, module: "gestao" },
  { path: "/horarios", label: "Colocação e Horários", icon: Calendar, module: "gestao" },
  { path: "/avaliacoes", label: "Avaliação Desempenho", icon: ClipboardList, module: "gestao" },
  { path: "/processos", label: "Processos", icon: FileText, module: "gestao" },
];

const systemNavItems: NavItem[] = [
  { path: "/comunicados", label: "Comunicação", icon: Bell, module: "sistema" },
  { path: "/documentos", label: "Documentos", icon: FolderOpen, module: "sistema" },
  { path: "/relatorios", label: "Relatórios & BI", icon: BarChart3, module: "sistema" },
];

const adminNavItems: NavItem[] = [
  { path: "/utilizadores", label: "Gestão de Utilizadores", icon: Shield, module: "admin" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

export function AppSidebar({ collapsed, onToggle, mobile = false }: AppSidebarProps) {
  const location = useLocation();
  const { user, role, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
            {item.badge && (
              <Badge variant="secondary" className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                {item.badge}
              </Badge>
            )}
            {item.disabled && (
              <Badge variant="outline" className="text-[10px] opacity-60 border-sidebar-border">
                Em breve
              </Badge>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {item.disabled && <span className="text-xs opacity-60">(Em breve)</span>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const NavSection = ({ title, items }: { title?: string; items: NavItem[] }) => (
    <div className="space-y-1">
      {title && !collapsed && (
        <h3 className="px-3 py-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      {collapsed && title && <Separator className="my-2 bg-sidebar-border" />}
      {items.map((item) => (
        <NavLink key={item.path} item={item} />
      ))}
    </div>
  );

  return (
    <aside
      className={cn(
        "left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        mobile ? "relative z-auto" : "fixed z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center")}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">DMEN Gestor</span>
              <span className="text-[10px] text-sidebar-muted-foreground leading-tight">
                Direcção Municipal da Educação de Namacunde
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          <NavSection items={mainNavItems} />
          <NavSection title="Gestão" items={managementNavItems} />
          <NavSection title="Sistema" items={systemNavItems} />
          {isAdmin && <NavSection title="Administração" items={adminNavItems} />}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* User Info */}
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
                {isAdmin ? "Administrador" : "Visualizador"}
              </p>
            </div>
            {isAdmin && (
              <Badge className="bg-sidebar-primary text-sidebar-primary-foreground text-[10px]">
                Admin
              </Badge>
            )}
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
              <p className="text-xs text-muted-foreground">{isAdmin ? "Administrador" : "Visualizador"}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Actions */}
        <div className={cn("flex gap-2", collapsed && "flex-col")}>
          {!collapsed ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                disabled
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-10 h-10"
                    disabled
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Configurações</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10 w-10 h-10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Terminar Sessão</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Recolher
            </>
          )}
        </Button>
      </div>

      {/* Créditos do criador - NÃO ALTERAR */}
      <div className={cn(
        "px-3 py-2 border-t border-sidebar-border",
        collapsed && "px-1"
      )}>
        <p className={cn(
          "text-[10px] text-sidebar-muted-foreground/60 text-center leading-tight select-none",
          collapsed && "hidden"
        )}>
          Criado por <span className="font-semibold text-sidebar-muted-foreground/80">Áureo Chissanhino Maria da Silva</span>
          <br />Advogado e Codificador Informático
        </p>
      </div>
    </aside>
  );
}