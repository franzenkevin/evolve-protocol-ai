// Share a generated story image via the Web Share API (covers Instagram,
// WhatsApp, etc on mobile) with a download fallback.

export type ShareResult = "shared" | "downloaded" | "cancelled";

export const shareStoryImage = async (
  blob: Blob,
  filename = "treino-evoria.png",
): Promise<ShareResult> => {
  const file = new File([blob], filename, { type: "image/png" });

  // Try native share with file (iOS/Android Chrome/Safari)
  const navAny = navigator as any;
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navAny.canShare === "function" &&
    navAny.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Treino concluído 💪",
        text: "Mais um treino completo no Evoria!",
      });
      return "shared";
    } catch (err: any) {
      // User cancelled — don't fall back to download
      if (err?.name === "AbortError") return "cancelled";
      // otherwise fall through to download
    }
  }

  // Fallback: download
  downloadBlob(blob, filename);
  return "downloaded";
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
