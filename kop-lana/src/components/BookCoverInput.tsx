import { Camera, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fileToDataUrl(file: File, maxSize = 1200): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kunde inte läsa bilden");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function BookCoverInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handle = async (input: HTMLInputElement | null) => {
    const file = input?.files?.[0];
    if (!file) return;
    onChange(await fileToDataUrl(file));
    if (input) input.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex aspect-3/4 w-full max-w-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        {value ? (
          <img src={value} alt="Omslag" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
        )}
      </div>

      {/*
        Fil-inputen ligger inuti en synlig etikett (label) i stället för att
        öppnas med JavaScript-klick. Det gör att bildväljaren/kameran öppnas
        som ett riktigt användarklick – även på mobiler och inuti ramar där
        programmatiska klick blockeras.
      */}
      <div className="flex flex-wrap gap-2">
        <label
          className={cn(
            buttonVariants({ variant: "default" }),
            "cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
          )}
        >
          {value ? <RefreshCw className="size-4" /> : <Camera className="size-4" />}
          {value ? "Fotografera igen" : "Fotografera omslag"}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={() => handle(cameraRef.current)}
          />
        </label>
        <label
          className={cn(
            buttonVariants({ variant: "outline" }),
            "cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
          )}
        >
          <ImageIcon className="size-4" />
          Välj bild
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={() => handle(galleryRef.current)}
          />
        </label>
      </div>
    </div>
  );
}
