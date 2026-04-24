import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save, Clock, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  useProtocolRegenStatus,
  useConsumeRegenCredit,
} from "@/hooks/useProtocolRegeneration";

const EditProfile = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
    if (user?.email) setEmail(user.email);
  }, [profile, user]);

  const initials = (fullName || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || `image/${ext}`,
        cacheControl: "3600",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const finalUrl = `${pub.publicUrl}?v=${Date.now()}`;
      await updateProfile.mutateAsync({ avatar_url: finalUrl });
      setAvatarUrl(finalUrl);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile.mutateAsync({ full_name: fullName.trim() || null });
      toast.success("Nome atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email || email === user?.email) return;
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("Confirme o novo e-mail pelo link enviado.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar e-mail");
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-foreground">Editar perfil</h1>
        </div>

        <Card className="p-5 card-gradient border-border flex flex-col items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group"
            aria-label="Trocar foto"
          >
            <Avatar className="w-24 h-24 border-2 border-border">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : (
                <Camera size={20} className="text-primary" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <>
                <Loader2 size={14} className="mr-1 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Camera size={14} className="mr-1" />
                Trocar foto
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground">JPG ou PNG, máx 5MB</p>
        </Card>

        <Card className="p-4 card-gradient border-border space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs">
              Nome completo
            </Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm" className="w-full">
            {savingProfile ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
            Salvar nome
          </Button>
        </Card>

        <Card className="p-4 card-gradient border-border space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            <p className="text-[10px] text-muted-foreground">
              Trocar o e-mail exige confirmação por link enviado para o novo endereço.
            </p>
          </div>
          <Button
            onClick={handleSaveEmail}
            disabled={savingEmail || email === user?.email || !email}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {savingEmail ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
            Atualizar e-mail
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EditProfile;
