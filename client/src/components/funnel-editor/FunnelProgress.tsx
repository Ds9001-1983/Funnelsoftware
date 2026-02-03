interface FunnelProgressProps {
  currentPage: number;
  totalPages: number;
  primaryColor: string;
}

/**
 * Fortschrittsanzeige für den Funnel.
 * Zeigt dem Benutzer an, wie weit er im Funnel fortgeschritten ist.
 */
export function FunnelProgress({ currentPage, totalPages, primaryColor }: FunnelProgressProps) {
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div className="w-full px-4 py-2">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-500">
        <span>Schritt {currentPage + 1} von {totalPages}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
