import { LucideIcon, AlertCircle, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateType = "empty" | "error" | "loading" | "no-results";

interface EmptyStateProps {
  type?: StateType;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

const defaultIcons: Record<StateType, LucideIcon> = {
  empty: Database,
  error: AlertCircle,
  loading: RefreshCw,
  "no-results": Database,
};

const defaultStyles: Record<StateType, string> = {
  empty: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
  loading: "bg-primary/10 text-primary animate-pulse-subtle",
  "no-results": "bg-muted text-muted-foreground",
};

export function EmptyState({
  type = "empty",
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon || defaultIcons[type];
  const iconStyle = defaultStyles[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full mb-4",
          iconStyle
        )}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}