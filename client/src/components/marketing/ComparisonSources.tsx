import { comparisonReviewDate, comparisonScope, type ComparisonEvidence } from "@shared/comparison-evidence";

export function ComparisonSources({ evidence }: { evidence: ComparisonEvidence[] }) {
  return (
    <div className="text-xs text-muted-foreground text-center mt-4 space-y-2">
      <p>{comparisonScope}</p>
      {evidence.map((entry) => (
        <p key={entry.sources[0].url}>
          Quellen geprüft am <time dateTime={entry.reviewedOn}>{comparisonReviewDate(entry.reviewedOn)}</time>:{" "}
          {entry.sources.map((source, index) => (
            <span key={source.url}>
              {index > 0 && " · "}
              <a href={source.url} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
