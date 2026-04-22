import { useState, useRef } from "react";
import { Camera, Check, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import poseFront from "@/assets/pose-front.png";
import poseBack from "@/assets/pose-back.png";
import poseRight from "@/assets/pose-right.png";
import poseLeft from "@/assets/pose-left.png";

interface PhotoSlot {
  key: string;
  label: string;
  description: string;
  silhouette: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { key: "front", label: "Frente", description: "Braços relaxados ao lado do corpo", silhouette: poseFront },
  { key: "back", label: "Costas", description: "De costas para a câmera", silhouette: poseBack },
  { key: "right", label: "Lateral Direita", description: "Perfil direito, braços relaxados", silhouette: poseRight },
  { key: "left", label: "Lateral Esquerda", description: "Perfil esquerdo, braços relaxados", silhouette: poseLeft },
];

interface BodyPhotoUploadProps {
  photos: Record<string, string>; // key -> storage path
  onPhotosChange: (photos: Record<string, string>) => void;
}

export const BodyPhotoUpload = ({ photos, onPhotosChange }: BodyPhotoUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (slotKey: string, file: File) => {
    if (!user) return;
    setUploading(slotKey);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/assessment/${slotKey}.${ext}`;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => ({ ...prev, [slotKey]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);

      const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
      if (error) throw error;

      onPhotosChange({ ...photos, [slotKey]: path });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (slotKey: string) => {
    const newPhotos = { ...photos };
    delete newPhotos[slotKey];
    onPhotosChange(newPhotos);
    const newPreviews = { ...previews };
    delete newPreviews[slotKey];
    setPreviews(newPreviews);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Avaliação Física</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tire fotos nas 4 posições abaixo. A IA analisará sua composição corporal, postura e dará recomendações personalizadas.
        </p>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs text-primary font-medium">📸 Dicas para boas fotos:</p>
        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
          <li>Use roupas justas ou traje de banho</li>
          <li>Boa iluminação, fundo neutro</li>
          <li>Postura natural, braços ao lado do corpo</li>
          <li>Distância de ~2 metros da câmera</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PHOTO_SLOTS.map((slot) => {
          const hasPhoto = !!photos[slot.key];
          const preview = previews[slot.key];
          const isUploading = uploading === slot.key;

          return (
            <div key={slot.key} className="space-y-1.5">
              <Label className="text-xs">{slot.label}</Label>
              <div
                className={`relative aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  hasPhoto
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30 bg-muted/30"
                }`}
                onClick={() => !isUploading && fileRefs.current[slot.key]?.click()}
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : preview ? (
                  <>
                    <img
                      src={preview}
                      alt={slot.label}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(slot.key);
                        }}
                        className="p-1 rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={slot.silhouette}
                      alt={`Pose ${slot.label}`}
                      width={512}
                      height={768}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-contain opacity-40"
                    />
                    <div className="relative z-10 flex flex-col items-center bg-background/60 backdrop-blur-sm rounded-md px-2 py-1.5">
                      <Camera className="w-5 h-5 text-primary mb-1" />
                      <span className="text-[10px] text-foreground text-center font-medium leading-tight">
                        {slot.description}
                      </span>
                    </div>
                  </>
                )}

                <input
                  ref={(el) => (fileRefs.current[slot.key] = el)}
                  type="file"
                  accept="image/*"
                  
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(slot.key, file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {Object.keys(photos).length}/4 fotos • Mínimo 1 foto para análise
      </p>
    </div>
  );
};
