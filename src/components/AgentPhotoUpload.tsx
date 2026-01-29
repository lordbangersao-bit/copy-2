import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface AgentPhotoUploadProps {
  agentId: string;
  currentPhotoUrl?: string | null;
  onPhotoUploaded: (url: string) => void;
}

export function AgentPhotoUpload({
  agentId,
  currentPhotoUrl,
  onPhotoUploaded,
}: AgentPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${agentId}-${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("agent-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("agent-photos")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onPhotoUploaded(publicUrl);
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao carregar a foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onPhotoUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Photo Preview */}
        <div className="relative w-24 h-28 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Foto do agente"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground hover:bg-destructive/80 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground/50" />
          )}
        </div>

        {/* Upload Button */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {previewUrl ? "Trocar Foto" : "Carregar Foto"}
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Formato: JPG, PNG. Máx: 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
