import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Trichterwerk` : "Trichterwerk - Funnel Builder";
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
