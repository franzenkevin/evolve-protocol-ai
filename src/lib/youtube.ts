/**
 * Detecta se a URL é do YouTube e retorna o ID do vídeo (ou null).
 * Suporta formatos: youtube.com/watch?v=XXX, youtu.be/XXX, youtube.com/shorts/XXX, youtube.com/embed/XXX
 */
export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m && m[1]) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function isYoutubeUrl(url: string | null | undefined): boolean {
  return !!getYoutubeId(url);
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function getYoutubeThumbnail(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
