import { useEffect, useState } from "react";
import { ExternalLink, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseVideoProps {
  exerciseName: string;
  videoUrl?: string | null;
  videoQuery?: string | null;
}

/**
 * Renders an embedded execution video for an exercise.
 * - If a direct YouTube/Vimeo URL or GIF is provided, embed it.
 * - Otherwise show a "Watch on YouTube" link using the search query.
 */
const ExerciseVideo = ({ exerciseName, videoUrl, videoQuery }: ExerciseVideoProps) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(videoUrl || null);

  // Bucket exercise-videos é privado: URLs antigas /object/public/ precisam virar signed URL
  useEffect(() => {
    if (!videoUrl) {
      setResolvedUrl(null);
      return;
    }
    const legacyMatch = videoUrl.match(/\/storage\/v1\/object\/public\/exercise-videos\/(.+?)(\?|$)/);
    if (legacyMatch) {
      const path = legacyMatch[1];
      supabase.storage
        .from("exercise-videos")
        .createSignedUrl(path, 60 * 60 * 24 * 7)
        .then(({ data }) => setResolvedUrl(data?.signedUrl || videoUrl));
    } else {
      setResolvedUrl(videoUrl);
    }
  }, [videoUrl]);

  const query = videoQuery || `${exerciseName} execução correta`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  // Embedded search loops the first result on YouTube — works without API key
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
