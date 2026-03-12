import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { getOfficialPrintHTML, openPrintWindow } from "@/lib/printTemplate";

interface PrintableReportProps {
  title: string;
  children: React.ReactNode;
  userName?: string;
}

export function PrintableReport({ title, children, userName }: PrintableReportProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;

    const html = getOfficialPrintHTML({
      title,
      content: printContent.innerHTML,
      userName,
    });
    openPrintWindow(html);
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
