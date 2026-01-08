import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  variant?: "default" | "primary" | "secondary" | "accent";
}

export function StatCard({
  title,
  value,
  icon,
  description,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all hover:shadow-lg",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "accent" && "bg-accent text-accent-foreground",
        variant === "default" && "bg-card text-card-foreground border shadow-sm"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "opacity-80"
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {description && (
            <p
              className={cn(
                "mt-1 text-sm",
                variant === "default" ? "text-muted-foreground" : "opacity-70"
              )}
            >
              {description}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            variant === "default" && "bg-muted",
            variant === "primary" && "bg-primary-foreground/20",
            variant === "secondary" && "bg-secondary-foreground/20",
            variant === "accent" && "bg-accent-foreground/20"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
