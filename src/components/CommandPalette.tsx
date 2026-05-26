import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home, Building2, MapPin, School, Users, FileText, ClipboardCheck,
  Calendar, Award, Gavel, Megaphone, FolderOpen, BarChart3, Shield, History, Moon, Sun, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ROUTES = [
  { label: "Dashboard", path: "/", icon: Home, group: "Navegação" },
  { label: "Províncias", path: "/provincias", icon: MapPin, group: "Navegação" },
  { label: "Municípios", path: "/municipios", icon: Building2, group: "Navegação" },
  { label: "Unidades Orgânicas", path: "/unidades-organicas", icon: School, group: "Navegação" },
  { label: "Agentes / Professores", path: "/professores", icon: Users, group: "Navegação" },
  { label: "Expedientes", path: "/expedientes", icon: FileText, group: "Navegação" },
  { label: "Assiduidade", path: "/assiduidade", icon: ClipboardCheck, group: "Navegação" },
  { label: "Horários", path: "/horarios", icon: Calendar, group: "Navegação" },
  { label: "Avaliações", path: "/avaliacoes", icon: Award, group: "Navegação" },
  { label: "Processos Disciplinares", path: "/processos", icon: Gavel, group: "Navegação" },
  { label: "Comunicados", path: "/comunicados", icon: Megaphone, group: "Navegação" },
  { label: "Documentos", path: "/documentos", icon: FolderOpen, group: "Navegação" },
  { label: "Relatórios", path: "/relatorios", icon: BarChart3, group: "Navegação" },
  { label: "Utilizadores", path: "/utilizadores", icon: Shield, group: "Administração" },
  { label: "Auditoria", path: "/auditoria", icon: History, group: "Administração" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", () => setOpen(true));
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 50);
  };

  const groups = Array.from(new Set(ROUTES.map((r) => r.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Pesquisar páginas, acções..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {ROUTES.filter((r) => r.group === group).map((r) => {
              const Icon = r.icon;
              return (
                <CommandItem key={r.path} onSelect={() => run(() => navigate(r.path))}>
                  <Icon className="mr-2 h-4 w-4" />
                  {r.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Acções rápidas">
          <CommandItem onSelect={() => run(() => document.documentElement.classList.toggle("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            Alternar tema claro/escuro
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(async () => {
                await supabase.auth.signOut();
                toast.info("Sessão terminada");
                navigate("/auth");
              })
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            Terminar sessão
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
