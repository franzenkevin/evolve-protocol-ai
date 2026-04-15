import { useState, useRef } from "react";
import { Camera, Upload, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PhotoSlot {
  key: string;
  label: string;
  description: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { key: "front", label: "Frente", description: "De frente, braços relaxados ao lado do corpo" },
  { key: "back", label: "Costas", description: "De costas, braços relaxados ao lado do corpo" },
  { key: "right", label: "Lateral Direita", description: "Perfil direito, braços relaxados" },
  { key: "left", label: "Lateral Esquerda", description: "Perfil esquerdo, braços relaxados" },
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
                    <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground text-center px-2">
                      {slot.description}
                    </span>
                  </>
                )}

                <input
                  ref={(el) => (fileRefs.current[slot.key] = el)}
                  type="file"
                  accept="image/*"
                  capture="environment"
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
