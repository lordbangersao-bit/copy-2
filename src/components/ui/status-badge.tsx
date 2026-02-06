import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "dot" | "pill";
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  // Activity status
  activo: {
    label: "Activo",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  ativo: {
    label: "Activo",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  inactivo: {
    label: "Inactivo",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  inativo: {
    label: "Inactivo",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  reformado: {
    label: "Reformado",
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  licença: {
    label: "Licença",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  afastado: {
    label: "Afastado",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },

  // Process status
  aberto: {
    label: "Aberto",
    bg: "bg-info/10",
    text: "text-info",
    dot: "bg-info",
  },
  "em análise": {
    label: "Em Análise",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  decidido: {
    label: "Decidido",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  arquivado: {
    label: "Arquivado",
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },

  // Attendance status
  presente: {
    label: "Presente",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  ausente: {
    label: "Ausente",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  atrasado: {
    label: "Atrasado",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  justificado: {
    label: "Justificado",
    bg: "bg-info/10",
    text: "text-info",
    dot: "bg-info",
  },

  // Generic
  pendente: {
    label: "Pendente",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  aprovado: {
    label: "Aprovado",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  rejeitado: {
    label: "Rejeitado",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

const defaultConfig = {
  label: "",
  bg: "bg-muted",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
};

export function StatusBadge({
  status,
  variant = "pill",
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().trim() || "";
  const config = statusConfig[normalizedStatus] || {
    ...defaultConfig,
    label: status || "-",
  };

  if (variant === "dot") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("h-2 w-2 rounded-full", config.dot)} />
        <span className={cn("text-sm", config.text)}>{config.label}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}