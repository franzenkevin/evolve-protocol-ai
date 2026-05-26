import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Download, Image as ImageIcon, Camera, X } from "lucide-react";
import { toast } from "sonner";
import {
  renderStoryToCanvas,
  generateStoryBlob,
  type StoryData,
} from "@/lib/storyImage";
import { shareStoryImage, downloadBlob } from "@/lib/shareToInstagram";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Omit<StoryData, "userPhoto">;
}

const ShareWorkoutDialog = ({ open, onOpenChange, data }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [sharing, setSharing] = useState(false);

  const draw = async () => {
    if (!canvasRef.current) return;
    setRendering(true);
    try {
      await renderStoryToCanvas(canvasRef.current, { ...data, userPhoto: photo });
    } catch (e) {
      console.error("[story] render error", e);
    } finally {
      setRendering(false);
    }
  };

  useEffect(() => {
    if (open) {
      // small delay so canvas is mounted
      const t = setTimeout(() => { void draw(); }, 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, photo, data.totalVolume, data.totalSets, data.durationMin, data.workoutName]);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await generateStoryBlob({ ...data, userPhoto: photo });
      const result = await shareStoryImage(blob);
      if (result === "shared") {
        toast.success("Compartilhado! 🎉");
        onOpenChange(false);
      } else if (result === "downloaded") {
        toast.success("Imagem baixada — abra o Instagram e suba como story!");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao compartilhar");
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    setSharing(true);
    try {
      const blob = await generateStoryBlob({ ...data, userPhoto: photo });
      downloadBlob(blob, "treino-evoria.png");
      toast.success("Imagem baixada!");
    } catch {
      toast.error("Erro ao baixar imagem");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Compartilhar treino</DialogTitle>
          <DialogDescription className="text-xs">
            Gere uma arte do seu treino e poste nos seus stories.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="relative mx-auto rounded-xl overflow-hidden border border-border bg-background"
             style={{ width: 270, height: 480 }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}
        </div>

        {/* Photo controls */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePhotoPick}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={sharing}
          >
            <ImageIcon size={14} />
            {photo ? "Trocar foto" : "Adicionar minha foto"}
          </Button>
          {photo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPhoto(null)}
              disabled={sharing}
              aria-label="Remover foto"
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full gap-2 glow"
            onClick={handleShare}
            disabled={sharing || rendering}
          >
            {sharing ? <Loader2 className="animate-spin" size={16} /> : <Share2 size={16} />}
            Compartilhar nos Stories
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleDownload}
            disabled={sharing || rendering}
          >
            <Download size={16} />
            Baixar imagem
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center px-4">
          No mobile, escolha o Instagram no menu de compartilhamento para postar como story.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWorkoutDialog;
