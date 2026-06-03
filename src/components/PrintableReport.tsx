import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { printOfficialDocument } from "@/lib/printTemplate";
import { toast } from "sonner";

interface PrintableReportProps {
  title: string;
  children: React.ReactNode;
  userName?: string;
  documentType?: string;
  municipality?: string;
}

export function PrintableReport({ title, children, userName, documentType, municipality }: PrintableReportProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const printContent = contentRef.current;
    if (!printContent) return;
    try {
      await printOfficialDocument({
        title,
        content: printContent.innerHTML,
        userName,
        documentType,
        municipality,
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar o documento");
    }
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
