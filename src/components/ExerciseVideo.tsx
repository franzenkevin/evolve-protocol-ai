import { useEffect, useState } from "react";
import { ExternalLink, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ExerciseVideoProps {
  exerciseName: string;
  videoUrl?: string | null;
  videoQuery?: string | null;
}

// Normaliza nome para comparar (sem acento, sem pontuação, lowercase)
function normName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Garante que a URL é absoluta (alguns vídeos foram salvos sem https://)
function normalizeUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(www\.)?(youtube\.com|youtu\.be)/i.test(url)) return `https://${url}`;
  if (/^\/\//.test(url)) return `https:${url}`;
  return url;
}

// Mapa nome→video_url da biblioteca de exercícios.
function useExerciseVideoMap() {
  return useQuery({
    queryKey: ["exercise-video-map"],
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("name, video_url");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((e: any) => {
        if (e?.name && e?.video_url) {
          map[normName(e.name)] = normalizeUrl(String(e.video_url));
        }
      });
      return map;
    },
  });
}

// Lookup tolerante: tenta exato, sem qualificadores, e por substring
function lookupVideo(map: Record<string, string> | undefined, name: string): string | null {
  if (!map) return null;
  const n = normName(name);
  if (map[n]) return map[n];
  const stripped = n
    .replace(/\b(com|na|no|de|da|do)\s+(barra|halteres|halter|smith|maquina|polia|cabo|cabos|corda|ez)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped && map[stripped]) return map[stripped];
  for (const key of Object.keys(map)) {
    if (key.length >= 6 && (n.includes(key) || key.includes(n))) {
      return map[key];
    }
  }
  return null;
}

const ExerciseVideo = ({ exerciseName, videoUrl, videoQuery }: ExerciseVideoProps) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const { data: videoMap } = useExerciseVideoMap();

  const libraryVideo = lookupVideo(videoMap, exerciseName);
  const effectiveVideoUrl = libraryVideo || (videoUrl ? normalizeUrl(videoUrl) : null);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(effectiveVideoUrl);

  useEffect(() => {
    if (!effectiveVideoUrl) {
      setResolvedUrl(null);
      return;
    }
    const legacyMatch = effectiveVideoUrl.match(/\/storage\/v1\/object\/public\/exercise-videos\/(.+?)(\?|$)/);
    const signedMatch = effectiveVideoUrl.match(/\/storage\/v1\/object\/sign\/exercise-videos\/(.+?)(\?|$)/);
    const match = legacyMatch || signedMatch;
    if (match) {
      const path = match[1];
      supabase.storage
        .from("exercise-videos")
        .createSignedUrl(path, 60 * 60 * 24 * 7)
        .then(({ data }) => setResolvedUrl(data?.signedUrl || effectiveVideoUrl));
    } else {
      setResolvedUrl(effectiveVideoUrl);
    }
  }, [effectiveVideoUrl]);


  const query = videoQuery || `${exerciseName} execução correta`;
  // Se temos a URL real, "Abrir no YouTube" leva direto pro vídeo
  const youtubeSearchUrl = resolvedUrl && /youtube\.com|youtu\.be/i.test(resolvedUrl)
    ? resolvedUrl
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const youtubeEmbedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;

  // If a direct media URL is provided, render it
  if (resolvedUrl) {
    const isGif = /\.gif(\?|$)/i.test(resolvedUrl);
    const isYoutube = /youtube\.com|youtu\.be/i.test(resolvedUrl);

    if (isGif) {
      return (
        <div className="rounded-lg overflow-hidden border border-border bg-black/40">
          <img
            src={resolvedUrl}
            alt={`Execução de ${exerciseName}`}
            className="w-full h-auto max-h-64 object-contain"
            loading="lazy"
          />
        </div>
      );
    }

    if (isYoutube) {
      // Convert watch URL to embed URL
      let embedUrl = resolvedUrl;
      const watchMatch = resolvedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
      if (watchMatch) embedUrl = `https://www.youtube.com/embed/${watchMatch[1]}`;
      return (
        <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
          <iframe
            src={embedUrl}
            title={`Execução de ${exerciseName}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            loading="lazy"
          />
        </div>
      );
    }
  }

  // No direct URL — show toggle to embed YouTube search results
  if (showEmbed) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
          <iframe
            src={youtubeEmbedUrl}
            title={`Vídeo: ${exerciseName}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            loading="lazy"
          />
        </div>
        <a
          href={youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
        >
          <ExternalLink size={10} />
          Abrir no YouTube
        </a>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs w-full"
      onClick={(e) => {
        e.stopPropagation();
        setShowEmbed(true);
      }}
    >
      <Youtube size={14} className="text-destructive" />
      Ver vídeo de execução
    </Button>
  );
};

export default ExerciseVideo;
