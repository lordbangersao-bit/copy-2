import { useState } from "react";
import { Bell, Search, Moon, Sun, Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Breadcrumb } from "./Breadcrumb";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onMobileMenuToggle, sidebarCollapsed }: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Monitor online status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header
      className="sticky top-0 z-30 h-14 sm:h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-all duration-300"
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb - hidden on mobile */}
          <div className="hidden sm:block">
            <Breadcrumb />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              className="w-64 pl-9 bg-muted/50 border-0 focus:bg-background focus:ring-1"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50 sm:flex">
              ⌘K
            </kbd>
          </div>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Connection Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  isOnline
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {isOnline ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isOnline
                ? "Dados sincronizados"
                : "Sem conexão - dados podem estar desatualizados"}
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notificações
                <Badge variant="secondary" className="text-xs">
                  3 novas
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                  <p className="font-medium text-sm">Novo processo disciplinar</p>
                  <p className="text-xs text-muted-foreground">
                    Processo #2024-001 foi aberto para análise
                  </p>
                  <span className="text-xs text-primary">há 5 minutos</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                  <p className="font-medium text-sm">Relatório mensal disponível</p>
                  <p className="text-xs text-muted-foreground">
                    O relatório de Janeiro 2024 está pronto para download
                  </p>
                  <span className="text-xs text-primary">há 1 hora</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                  <p className="font-medium text-sm">Atualização de dados</p>
                  <p className="text-xs text-muted-foreground">
                    15 novos agentes foram sincronizados
                  </p>
                  <span className="text-xs text-primary">há 3 horas</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary">
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDark ? "Modo claro" : "Modo escuro"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar agentes, escolas..."
              className="w-full pl-9"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}