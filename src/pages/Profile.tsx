import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useCheckins } from "@/hooks/useCheckins";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Shield, FileText, HelpCircle, Bell, BellOff, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: protocol } = useActiveProtocol();
  const { data: checkins = [] } = useCheckins();
  const navigate = useNavigate();
  const push = usePushNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const name = profile?.full_name || user?.user_metadata?.full_name || "Atleta";
  const email = user?.email || "";
  const avatarUrl = profile?.avatar_url || "";
  const initials = name ? name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "?";

  const daysActive = protocol
    ? Math.ceil((Date.now() - new Date(protocol.start_date).getTime()) / 86400000)
    : 0;

  const validCheckins = checkins.filter((c) => c.adherence);
  const avgAdherence = validCheckins.length
    ? Math.round(validCheckins.reduce((a, c) => a + (c.adherence || 0), 0) / validCheckins.length)
    : 0;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

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
      // Cache-bust to force reload across the app
      const finalUrl = `${pub.publicUrl}?v=${Date.now()}`;
      await updateProfile.mutateAsync({ avatar_url: finalUrl });
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const MENU_ITEMS = [
    { icon: Settings, label: "Editar perfil", onClick: () => {} },
    { icon: FileText, label: "Meu protocolo", onClick: () => navigate("/training") },
    { icon: Shield, label: "Privacidade", onClick: () => {} },
    { icon: HelpCircle, label: "Ajuda", onClick: () => {} },
  ];

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Perfil</h1>

        <Card className="p-5 card-gradient border-border flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group shrink-0"
            aria-label="Trocar foto"
          >
            <Avatar className="w-16 h-16 border-2 border-border">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? <Loader2 size={16} className="animate-spin text-primary" /> : <Camera size={16} className="text-primary" />}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </button>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
              {protocol ? "Plano Ativo" : "Sem protocolo"}
            </span>
          </div>
        </Card>

        <Card className="p-4 card-gradient border-border">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-lg font-bold text-foreground">{protocol ? protocol.version : 0}</p><p className="text-xs text-muted-foreground">Protocolos</p></div>
            <div><p className="text-lg font-bold text-foreground">{daysActive}</p><p className="text-xs text-muted-foreground">Dias ativos</p></div>
            <div><p className="text-lg font-bold text-primary">{avgAdherence}%</p><p className="text-xs text-muted-foreground">Aderência</p></div>
          </div>
        </Card>

        {/* Push notifications */}
        {push.supported && (
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {push.isSubscribed ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Lembretes de treino</p>
                  <p className="text-xs text-muted-foreground">
                    {push.isSubscribed ? "Notificações ativadas" : "Receba lembretes no horário do treino"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={push.isSubscribed ? "outline" : "default"}
                disabled={push.loading}
                onClick={async () => {
                  if (push.isSubscribed) {
                    await push.unsubscribe();
                    toast.success("Notificações desativadas");
                  } else {
                    await push.subscribe();
                    if (push.permission === "denied") {
                      toast.error("Permissão negada. Ative nas configurações do navegador.");
                    } else {
                      toast.success("Notificações ativadas! 🔔");
                    }
                  }
                }}
              >
                {push.loading ? <Loader2 size={14} className="animate-spin" /> : push.isSubscribed ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-1">
          {MENU_ITEMS.map(({ icon: Icon, label, onClick }) => (
            <Card key={label} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={onClick}>
              <Icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{label}</span>
            </Card>
          ))}
        </div>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" />Sair
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
