import { useEffect, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import type { FunnelPage, PageElement, PageLayout as Layout, Theme } from "@shared/schema";
import { loadFont } from "@/lib/font-loader";
import { layoutErrors } from "@shared/funnel-layout";
import "./page-layout.css";

interface PageLayoutProps {
  page: FunnelPage;
  spacing: number;
  textColor: string;
  renderElement: (element: PageElement, textColor: string, themeOverride?: Theme) => ReactNode;
  sectionControls?: (section: Layout["sections"][number], index: number) => ReactNode;
  columnControls?: (column: Layout["sections"][number]["columns"][number], index: number) => ReactNode;
  columnEvents?: (columnId: string) => HTMLAttributes<HTMLDivElement>;
}

/** Layout owns placement only; fields and answers keep their canonical IDs. */
export function PageLayout({ page, spacing, textColor, renderElement, sectionControls, columnControls, columnEvents }: PageLayoutProps) {
  const sectionFont = (theme?: Theme) => theme?.design && theme.fontFamily === "Geist" ? "Geist Sans" : theme?.fontFamily;
  useEffect(() => { for (const section of page.layout?.sections ?? []) { const font = sectionFont(section.themeOverride); if (font) loadFont(font); } }, [page.layout]);
  if (!page.layout || layoutErrors(page).length) {
    // A malformed draft must still show all its content in the owner preview.
    return <div className={spacing === 16 ? "space-y-4" : "flex flex-col"} style={spacing === 16 ? undefined : { gap: spacing }}>{page.elements.map(element => (
      <div key={element.id}>{renderElement(element, textColor)}</div>
    ))}</div>;
  }
  const byId = new Map(page.elements.map(element => [element.id, element]));
  return (
    <div className="funnel-layout" style={{ gap: spacing }}>
      {page.layout.sections.map((section, index) => (
        <section key={section.id} data-layout-section={section.id} style={{
          backgroundColor: section.backgroundColor ?? section.themeOverride?.backgroundColor,
          color: section.textColor || section.themeOverride?.textColor || textColor,
          fontFamily: sectionFont(section.themeOverride),
          padding: section.padding ?? 0,
          minWidth: 0,
        }}>
          {sectionControls?.(section, index)}
          <div className="funnel-layout-columns" style={{
            "--funnel-columns": section.columns.length,
            gap: section.gap ?? section.themeOverride?.design?.spacing ?? spacing,
          } as CSSProperties}>
            {section.columns.map((column, index) => (
              <div {...columnEvents?.(column.id)} key={column.id} className="funnel-layout-column" data-layout-column={column.id} style={{ gap: section.themeOverride?.design?.spacing ?? spacing }}>
                {columnControls?.(column, index)}
                {column.elementIds.map(id => (
                  <div key={id}>{renderElement(byId.get(id)!, section.textColor || section.themeOverride?.textColor || textColor, section.themeOverride)}</div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
