import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change or screen resize, auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 lg:hidden transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AppSidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} mobile />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="p-3 sm:p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t px-4 lg:px-6 py-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Direcção Municipal da Educação de Namacunde •
            Sistema de Gestão Educacional v2.0
          </p>
        </footer>
      </div>
    </div>
  );
}