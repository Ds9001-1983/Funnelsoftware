import { describe, it, expect } from "vitest";
import { getVideoEmbedUrl } from "./ElementPreviewRenderer";

describe("getVideoEmbedUrl", () => {
  it("wandelt YouTube-URLs in nocookie-Embed-URLs um", () => {
    expect(getVideoEmbedUrl("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(getVideoEmbedUrl("youtube", "https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(getVideoEmbedUrl(undefined, "https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });

  it("wandelt Vimeo-URLs in Player-URLs um", () => {
    expect(getVideoEmbedUrl("vimeo", "https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789"
    );
    expect(getVideoEmbedUrl(undefined, "https://vimeo.com/video/123456789")).toBe(
      "https://player.vimeo.com/video/123456789"
    );
  });

  it("liefert null für leere oder nicht erkennbare URLs", () => {
    expect(getVideoEmbedUrl("youtube", undefined)).toBeNull();
    expect(getVideoEmbedUrl("youtube", "")).toBeNull();
    expect(getVideoEmbedUrl("youtube", "https://evil.example.com/embed/x")).toBeNull();
    expect(getVideoEmbedUrl(undefined, "https://example.com/video.mp4")).toBeNull();
  });

  it("reicht keine fremden Hosts durch (Allowlist statt Passthrough)", () => {
    expect(getVideoEmbedUrl("youtube", "javascript:alert(1)")).toBeNull();
    expect(getVideoEmbedUrl("vimeo", "https://vimeo.com.evil.com/123")).toBeNull();
  });
});
