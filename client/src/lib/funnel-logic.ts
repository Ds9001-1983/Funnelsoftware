import type { FunnelPage } from "@shared/schema";

/**
 * Berechnet den nächsten anzuzeigenden Seiten-Index eines Funnels nach der
 * etablierten Prioritätskette:
 *
 * 1. Button-Element mit explizitem `buttonNextPageId` (Action: page)
 * 2. Element-`optionRouting` (select/radio)
 * 3. Seitenweites `conditionalRouting` (Antwort → Seite)
 * 4. Fortgeschrittene `conditions` (`equals` / `notEquals` / `contains` / `isEmpty`)
 * 5. Festes `nextPageId`
 * 6. Sequentielle nächste Seite, oder `null` am Ende
 *
 * Aus `pages/public-funnel.tsx` als pure Funktion extrahiert (Stufe 3.3),
 * damit die Routing-Logik isoliert testbar ist.
 */
export function getNextPageIndex(
  pages: FunnelPage[],
  currentPageIndex: number,
  formValues: Record<string, string>,
): number | null {
  const page = pages[currentPageIndex];
  if (!page) return null;

  // 0. Button-Elemente mit explizitem Seiten-Ziel
  for (const el of page.elements) {
    if (el.type === "button" && el.buttonAction === "page" && el.buttonNextPageId) {
      const targetIdx = pages.findIndex((p) => p.id === el.buttonNextPageId);
      if (targetIdx >= 0) return targetIdx;
    }
  }

  // 0.5 Element-level optionRouting (select/radio)
  for (const el of page.elements) {
    if ((el.type === "select" || el.type === "radio") && el.optionRouting) {
      const selectedValue = formValues[el.id];
      if (selectedValue && el.optionRouting[selectedValue]) {
        const targetIdx = pages.findIndex((p) => p.id === el.optionRouting![selectedValue]);
        if (targetIdx >= 0) return targetIdx;
      }
    }
  }

  // 1. Seitenweites conditionalRouting (Antwort-Wert → Seite).
  // WICHTIG (deterministische Reihenfolge): Die Map ist nach Antwort-WERT
  // gekeyt, nicht nach Element. Haben mehrere Elemente einer Seite einen Wert,
  // gewinnt das ERSTE in `page.elements`-Reihenfolge, dessen Wert ein Key in
  // conditionalRouting ist. Das ist bewusst und stabil — pro Seite sollte daher
  // nur ein routing-relevantes Element konfiguriert werden.
  if (page.conditionalRouting) {
    for (const el of page.elements) {
      const value = formValues[el.id];
      if (value && page.conditionalRouting[value]) {
        const targetIdx = pages.findIndex((p) => p.id === page.conditionalRouting![value]);
        if (targetIdx >= 0) return targetIdx;
      }
    }
  }

  // 2. Fortgeschrittene conditions (equals/notEquals/contains/isEmpty)
  if (page.conditions && page.conditions.length > 0) {
    for (const cond of page.conditions) {
      const value = formValues[cond.elementId] || "";
      let match = false;
      switch (cond.operator) {
        case "equals":
          match = value === cond.value;
          break;
        case "notEquals":
          match = value !== cond.value;
          break;
        case "contains":
          match = value.includes(cond.value || "");
          break;
        case "isEmpty":
          match = !value.trim();
          break;
      }
      if (match) {
        const targetIdx = pages.findIndex((p) => p.id === cond.targetPageId);
        if (targetIdx >= 0) return targetIdx;
      }
    }
  }

  // 3. Festes nextPageId
  if (page.nextPageId) {
    const targetIdx = pages.findIndex((p) => p.id === page.nextPageId);
    if (targetIdx >= 0) return targetIdx;
  }

  // 4. Default: nächste sequentielle Seite (oder Ende)
  const nextIndex = currentPageIndex + 1;
  return nextIndex < pages.length ? nextIndex : null;
}
