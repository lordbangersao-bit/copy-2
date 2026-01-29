import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgentIDCard } from "./AgentIDCard";
import { AgentPhotoUpload } from "./AgentPhotoUpload";
import { ProfessorWithEscola } from "@/hooks/useProfessores";
import { useUpdateProfessor } from "@/hooks/useProfessores";
import { Printer, Download, Camera } from "lucide-react";
import { toast } from "sonner";

interface EmitirIDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor: ProfessorWithEscola | null;
}

export function EmitirIDDialog({
  open,
  onOpenChange,
  professor,
}: EmitirIDDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const updateProfessor = useUpdateProfessor();
  const [localProfessor, setLocalProfessor] = useState<ProfessorWithEscola | null>(null);

  // Use local state if photo was just uploaded, otherwise use prop
  const displayProfessor = localProfessor || professor;

  const handlePhotoUploaded = (url: string) => {
    if (!professor) return;

    // Update local state immediately for preview
    setLocalProfessor({
      ...professor,
      foto_url: url,
    });

    // Save to database
    updateProfessor.mutate({
      id: professor.id,
      foto_url: url || null,
    });
  };

  const handlePrint = () => {
    if (!cardRef.current) return;

    const printContent = cardRef.current.outerHTML;
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartão de Identificação - ${displayProfessor?.nome}</title>
          <style>
            @page {
              size: 86mm 54mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10mm;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              font-family: 'Segoe UI', system-ui, sans-serif;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printContent}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `cartao-id-${displayProfessor?.nome?.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Cartão salvo com sucesso!");
    } catch (error) {
      console.error("Error downloading card:", error);
      toast.error("Erro ao salvar o cartão");
    }
  };

  const handleClose = () => {
    setLocalProfessor(null);
    onOpenChange(false);
  };

  if (!displayProfessor) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Emitir Cartão de Identificação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Upload Section */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Fotografia do Agente</h4>
            <AgentPhotoUpload
              agentId={displayProfessor.id}
              currentPhotoUrl={displayProfessor.foto_url}
              onPhotoUploaded={handlePhotoUploaded}
            />
          </div>

          {/* Card Preview */}
          <div>
            <h4 className="text-sm font-medium mb-3">Pré-visualização do Cartão</h4>
            <div className="flex justify-center p-4 bg-muted/20 rounded-lg">
              <AgentIDCard ref={cardRef} professor={displayProfessor} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar PNG
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
