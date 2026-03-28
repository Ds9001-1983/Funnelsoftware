import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUploader({ value, onChange, className }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Datei ist zu groß (max. 5 MB)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Upload fehlgeschlagen");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      {value && (
        <div className="relative mb-2 rounded-md overflow-hidden border">
          <img src={value} alt="Preview" className="w-full h-24 object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
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
        onClick={() => fileInputRef.current?.click()}
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

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
