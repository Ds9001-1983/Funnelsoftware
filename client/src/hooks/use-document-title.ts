import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | FunnelFlow` : "FunnelFlow - Funnel Builder";
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
