// Generates a 1080x1920 PNG story image with workout summary.
// Pure client-side rendering via <canvas> — no backend.

import logoUrl from "@/assets/evoria-logo-horizontal.png";

export interface StoryData {
  workoutName: string;        // e.g. "Treino A — Peito e Tríceps"
  totalVolume: number;        // kg
  totalSets: number;
  durationMin: number | null; // null = hide
  userPhoto?: string | null;  // dataURL or objectURL
}

const W = 1080;
const H = 1920;

const COLORS = {
  bg: "#000000",
  primary: "#00C4B3",
  text: "#F3F1EC",
  muted: "#8B93A7",
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const ensureFonts = async () => {
  if (typeof document === "undefined" || !(document as any).fonts) return;
  try {
    await Promise.all([
      (document as any).fonts.load('700 140px "Space Grotesk"'),
      (document as any).fonts.load('600 56px "Space Grotesk"'),
      (document as any).fonts.load('500 36px "Inter"'),
      (document as any).fonts.load('400 28px "Inter"'),
    ]);
  } catch {
    /* ignore */
  }
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const ratio = Math.max(w / iw, h / ih);
  const nw = iw * ratio;
  const nh = ih * ratio;
  const nx = x + (w - nw) / 2;
  const ny = y + (h - nh) / 2;
  ctx.drawImage(img, nx, ny, nw, nh);
};

export const renderStoryToCanvas = async (
  canvas: HTMLCanvasElement,
  data: StoryData,
): Promise<void> => {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");

  await ensureFonts();

  // --- Pure black background ---
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // --- Optional user photo (full canvas, cover) ---
  if (data.userPhoto) {
    try {
      const photo = await loadImage(data.userPhoto);
      drawCoverImage(ctx, photo, 0, 0, W, H);
      // bottom gradient for text legibility
      const overlay = ctx.createLinearGradient(0, H * 0.45, 0, H);
      overlay.addColorStop(0, "rgba(0,0,0,0)");
      overlay.addColorStop(0.55, "rgba(0,0,0,0.75)");
      overlay.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, W, H);
    } catch {
      /* ignore photo errors */
    }
  }

  // --- Bottom content block ---
  const padX = 80;

  // Workout name (above the volume)
  ctx.fillStyle = COLORS.muted;
  ctx.font = '500 36px "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  const nameLines = wrapText(ctx, data.workoutName, W - padX * 2, 36);
  let nameY = H - 560;
  for (const line of nameLines.slice(0, 2)) {
    ctx.fillText(line, W / 2, nameY);
    nameY += 48;
  }

  // Volume — the hero number
  const volume = formatVolume(data.totalVolume);
  ctx.fillStyle = COLORS.text;
  let size = 280;
  ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  while (ctx.measureText(volume).width > W - padX * 2 && size > 120) {
    size -= 10;
    ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.fillText(volume, W / 2, H - 280);

  // "VOLUME TOTAL" label under the number
  ctx.fillStyle = COLORS.primary;
  ctx.font = '600 32px "Inter", system-ui, sans-serif';
  ctx.fillText("VOLUME TOTAL", W / 2, H - 220);

  // --- Footer ---
  ctx.fillStyle = COLORS.muted;
  ctx.font = '400 30px "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("evoriacoach.com", W / 2, H - 110);
};

const drawMetricCard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
) => {
  // glassy card
  ctx.fillStyle = COLORS.card;
  roundRect(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.cardBorder;
  roundRect(ctx, x, y, w, h, 28);
  ctx.stroke();

  // value
  ctx.fillStyle = COLORS.primary;
  // auto-shrink large numbers
  let size = 130;
  ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  while (ctx.measureText(value).width > w - 60 && size > 60) {
    size -= 8;
    ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, x + w / 2, y + h / 2 - 18);

  // label
  ctx.fillStyle = COLORS.muted;
  ctx.font = '600 28px "Inter", system-ui, sans-serif';
  ctx.fillText(label, x + w / 2, y + h - 38);
  ctx.textBaseline = "alphabetic";
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _fontSize: number,
): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? current + " " + w : w;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const formatVolume = (kg: number): string => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg >= 10000 ? 0 : 1).replace(".", ",")}T`;
  return `${Math.round(kg)}KG`;
};

export const generateStoryBlob = async (data: StoryData): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  await renderStoryToCanvas(canvas, data);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))),
      "image/png",
      0.95,
    );
  });
};
