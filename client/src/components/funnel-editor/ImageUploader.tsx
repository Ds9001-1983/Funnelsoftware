import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — passt zum UI-Hinweis

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  /**
   * `button` (default): kompakter „Bild hochladen"-Button mit Mini-Preview.
   * `dropzone`: große Drag-and-Drop-Zone mit Klick-zum-Durchsuchen.
   */
  variant?: "button" | "dropzone";
}

export function ImageUploader({ value, onChange, className, variant = "button" }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Bitte eine Bilddatei wählen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Datei ist zu groß (max. ${MAX_BYTES / 1024 / 1024} MB)`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // apiRequest setzt den CSRF-Token automatisch (sonst → 403
      // EBADCSRFTOKEN) und reicht FormData korrekt durch.
      const res = await apiRequest("POST", "/api/uploads", formData);
      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  const openPicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        e.target.value = "";
      }}
    />
  );

  // — Variante: Dropzone —
  if (variant === "dropzone") {
    return (
      <div className={className}>
        {hiddenInput}

        {value && (
          <div className="relative mb-2 rounded-md overflow-hidden border">
            <img src={value} alt="Vorschau" className="w-full h-32 object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Bild entfernen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          aria-label="Bild ablegen oder klicken zum Durchsuchen"
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          } ${uploading ? "opacity-60 cursor-wait" : ""}`}
          data-testid="image-dropzone"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
          ) : (
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground">
            {uploading ? "Wird hochgeladen…" : "Bild ablegen oder klicken zum Durchsuchen"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (Max. 10MB; .png .jpg .webp .gif)
          </p>
        </div>

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }

  // — Variante: Button (default, abwärtskompatibel) —
  return (
    <div className={className}>
      {hiddenInput}

      {value && (
        <div className="relative mb-2 rounded-md overflow-hidden border">
          <img src={value} alt="Preview" className="w-full h-24 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Bild entfernen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={openPicker}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            Wird hochgeladen...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-1.5" />
            Bild hochladen
          </>
        )}
      </Button>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
