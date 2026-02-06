import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: Trend;
  trendValue?: string;
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "info";
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
  },
  primary: {
    bg: "gradient-primary",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    valueColor: "text-white",
  },
  secondary: {
    bg: "gradient-secondary",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    valueColor: "text-white",
  },
  success: {
    bg: "bg-success",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    valueColor: "text-white",
  },
  warning: {
    bg: "bg-warning",
    iconBg: "bg-black/10",
    iconColor: "text-warning-foreground",
    valueColor: "text-warning-foreground",
  },
  info: {
    bg: "bg-info",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    valueColor: "text-white",
  },
};

const trendStyles: Record<Trend, { icon: typeof TrendingUp; color: string }> = {
  up: { icon: TrendingUp, color: "text-success" },
  down: { icon: TrendingDown, color: "text-destructive" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
};

export function KPICard({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
  variant = "default",
  className,
  onClick,
}: KPICardProps) {
  const styles = variantStyles[variant];
  const isClickable = !!onClick;
  const isColored = variant !== "default";

  return (
    <div
      className={cn(
        "rounded-xl p-5 transition-all duration-200 border",
        styles.bg,
        isColored ? "border-transparent shadow-medium" : "border-border shadow-soft",
        isClickable && "cursor-pointer hover:shadow-strong hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isColored ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tracking-tight",
              styles.valueColor
            )}
          >
            {typeof value === "number" ? value.toLocaleString("pt-AO") : value}
          </p>
          
          {/* Trend & Description */}
          <div className="mt-2 flex items-center gap-2">
            {trend && trendValue && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  isColored ? "text-white/80" : trendStyles[trend].color
                )}
              >
                {(() => {
                  const TrendIcon = trendStyles[trend].icon;
                  return <TrendIcon className="h-3 w-3" />;
                })()}
                {trendValue}
              </span>
            )}
            {description && (
              <span
                className={cn(
                  "text-xs",
                  isColored ? "text-white/60" : "text-muted-foreground"
                )}
              >
                {description}
              </span>
            )}
          </div>
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0",
            styles.iconBg
          )}
        >
          <div className={styles.iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}