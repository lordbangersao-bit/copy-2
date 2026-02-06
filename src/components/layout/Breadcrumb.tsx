import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/escolas": "Unidades Orgânicas",
  "/unidades-organicas": "Unidades Orgânicas",
  "/professores": "Agentes",
  "/assiduidade": "Assiduidade",
  "/horarios": "Colocação e Horários",
  "/avaliacoes": "Avaliação de Desempenho",
  "/processos": "Processos",
  "/comunicados": "Comunicação",
  "/documentos": "Documentos",
  "/relatorios": "Relatórios & BI",
  "/configuracoes": "Configurações",
  "/auth": "Autenticação",
};

export function Breadcrumb() {
  const location = useLocation();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (location.pathname === "/") {
      return [{ label: "Dashboard" }];
    }
    
    breadcrumbs.push({ label: "Início", path: "/" });
    
    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = routeLabels[currentPath] || path.charAt(0).toUpperCase() + path.slice(1);
      
      if (index === paths.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, path: currentPath });
      }
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
            )}
            {item.path ? (
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-1 hover:text-foreground transition-colors",
                  index === 0 && "text-primary"
                )}
              >
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="font-medium text-foreground flex items-center gap-1">
                {index === 0 && breadcrumbs.length === 1 && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}