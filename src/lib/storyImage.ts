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
  bgTop: "#090B11",
  bgBottom: "#0F121B",
  card: "rgba(29,36,43,0.55)",
  cardBorder: "rgba(0,196,179,0.25)",
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

  // --- Background gradient ---
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, COLORS.bgTop);
  bg.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- Optional user photo as background (top 60%) ---
  if (data.userPhoto) {
    try {
      const photo = await loadImage(data.userPhoto);
      ctx.save();
      roundRect(ctx, 0, 0, W, Math.round(H * 0.62), 0);
      ctx.clip();
      drawCoverImage(ctx, photo, 0, 0, W, Math.round(H * 0.62));
      // dark overlay for legibility
      const overlay = ctx.createLinearGradient(0, 0, 0, Math.round(H * 0.62));
      overlay.addColorStop(0, "rgba(9,11,17,0.55)");
      overlay.addColorStop(1, "rgba(9,11,17,0.95)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, W, Math.round(H * 0.62));
      ctx.restore();
    } catch {
      /* ignore photo errors */
    }
  } else {
    // Subtle teal radial accent
    const radial = ctx.createRadialGradient(W / 2, H * 0.25, 50, W / 2, H * 0.25, 700);
    radial.addColorStop(0, "rgba(0,196,179,0.18)");
    radial.addColorStop(1, "rgba(0,196,179,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);
  }

  // --- Logo (top center) ---
  try {
    const logo = await loadImage(logoUrl);
    const logoH = 90;
    const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
    ctx.drawImage(logo, (W - logoW) / 2, 110, logoW, logoH);
  } catch {
    /* ignore */
  }

  // --- "TREINO CONCLUÍDO" eyebrow ---
  ctx.fillStyle = COLORS.primary;
  ctx.font = '600 44px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.letterSpacing = "8px" as any;
  ctx.fillText("TREINO CONCLUÍDO", W / 2, 760);

  // teal underline
  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(W / 2 - 60, 790, 120, 4);

  // --- Workout name ---
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 72px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = "center";
  const lines = wrapText(ctx, data.workoutName, W - 160, 72);
  let y = 900;
  for (const line of lines.slice(0, 2)) {
    ctx.fillText(line, W / 2, y);
    y += 86;
  }

  // --- Metric cards ---
  const cardsTop = Math.min(y + 60, 1180);
  const padX = 80;
  const gap = 30;
  const colW = (W - padX * 2 - gap) / 2;
  const cardH = 240;

  // Volume + Sets row
  drawMetricCard(ctx, padX, cardsTop, colW, cardH,
    formatVolume(data.totalVolume), "VOLUME TOTAL");
  drawMetricCard(ctx, padX + colW + gap, cardsTop, colW, cardH,
    String(data.totalSets), "SÉRIES");

  // Duration full-width
  if (data.durationMin && data.durationMin > 0) {
    drawMetricCard(ctx, padX, cardsTop + cardH + gap, W - padX * 2, 200,
      `${data.durationMin} MIN`, "DURAÇÃO");
  }

  // --- Footer ---
  ctx.fillStyle = COLORS.muted;
  ctx.font = '500 32px "Inter", system-ui, sans-serif';
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
