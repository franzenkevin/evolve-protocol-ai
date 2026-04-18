import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link2, X } from "lucide-react";

interface VideoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const VideoUploader = ({ value, onChange }: VideoUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast({ title: "Arquivo muito grande", description: "Máximo 50MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("exercise-videos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      // Bucket é privado: gera signed URL de longa duração (1 ano)
      const { data: signed, error: signErr } = await supabase.storage
        .from("exercise-videos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr) throw signErr;
      onChange(signed.signedUrl);
      setUrlInput(signed.signedUrl);
      toast({ title: "Vídeo enviado!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Vídeo (upload .mp4/.gif ou link YouTube)</Label>
      <div className="flex gap-2">
        <label className="flex-1">
          <input
            type="file"
            accept="video/mp4,video/webm,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="border border-dashed border-border rounded-md px-3 py-2 text-xs text-center cursor-pointer hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2">
            <Upload size={14} />
            {uploading ? "Enviando..." : "Upload (máx 50MB)"}
          </div>
        </label>
      </div>
      <div className="flex gap-2 items-center">
        <Link2 size={14} className="text-muted-foreground shrink-0" />
        <Input
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            onChange(e.target.value || null);
          }}
          placeholder="https://youtube.com/... ou URL do vídeo"
          className="text-xs"
        />
        {urlInput && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setUrlInput("");
              onChange(null);
            }}
          >
            <X size={14} />
          </Button>
        )}
      </div>
      {value && !uploading && (
        <p className="text-[10px] text-success truncate">✓ {value}</p>
      )}
    </div>
  );
};

export default VideoUploader;
