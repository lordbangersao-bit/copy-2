import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface PrintableReportProps {
  title: string;
  children: React.ReactNode;
}

export function PrintableReport({ title, children }: PrintableReportProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - DMN Gestor</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 4px; }
          .header p { font-size: 12px; color: #666; }
          .header .org { font-size: 14px; color: #333; font-weight: 600; margin-bottom: 2px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
          .stat-box .value { font-size: 28px; font-weight: 700; color: #2563eb; }
          .stat-box .label { font-size: 11px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; color: #374151; }
          tr:nth-child(even) { background: #fafafa; }
          .section { margin-bottom: 24px; }
          .section h2 { font-size: 16px; color: #1f2937; margin-bottom: 12px; border-left: 4px solid #2563eb; padding-left: 10px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="org">Direcção Provincial da Educação</p>
          <h1>${title}</h1>
          <p>Gerado em ${new Date().toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        ${printContent.innerHTML}
        <div class="footer">
          <p>DMN Gestor — Sistema de Gestão Educacional • Documento gerado automaticamente</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <Printer className="h-4 w-4" />
        Imprimir PDF
      </Button>
      {/* Hidden printable content */}
      <div ref={contentRef} className="hidden">
        {children}
      </div>
    </div>
  );
}
