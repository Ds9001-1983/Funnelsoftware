import { useState, useRef } from "react";
import { Music, Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (passt zum UI-Hinweis + Server-Limit)

interface AudioUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

/**
 * Drag-and-Drop-Uploader für Audio-Dateien. Lädt gegen /api/uploads/audio
 * (Original-Format, keine Konvertierung) und zeigt nach dem Upload eine
 * native <audio>-Vorschau.
 */
export function AudioUploader({ value, onChange, className }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("audio/")) {
      setError("Bitte eine Audio-Datei wählen (.mp3, .wav, .ogg).");
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
      const res = await apiRequest("POST", "/api/uploads/audio", formData);
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

  return (
    <div className={className}>
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

      {value && (
        <div className="relative mb-2 rounded-md overflow-hidden border bg-muted p-2">
          <audio controls src={value} className="w-full">
            Dein Browser unterstützt das audio-Element nicht.
          </audio>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Audio entfernen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label="Audio-Datei ablegen oder klicken zum Durchsuchen"
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
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
        ) : (
          <Music className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-xs text-muted-foreground">
          {uploading ? "Wird hochgeladen…" : "Audio-Datei ablegen oder klicken zum Durchsuchen"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">(Max. 50MB; .mp3 .wav .ogg)</p>
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
