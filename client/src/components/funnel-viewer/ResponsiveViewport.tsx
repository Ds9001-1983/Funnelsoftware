import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { responsiveDevice } from "@shared/funnel-responsive";
const WidthContext = createContext<number | null>(null);
export function useResponsiveDevice() { return responsiveDevice(useContext(WidthContext) ?? window.innerWidth); }

/** Measure the funnel viewport, not individual columns or the surrounding editor. */
export function ResponsiveViewport({ children, inspect }: { children: ReactNode; inspect?: (id: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const [overflow, setOverflow] = useState<string[]>([]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let frame = 0;
    const check = () => {
      setWidth(node.getBoundingClientRect().width);
      if (!inspect) return;
      const bounds = node.getBoundingClientRect();
      const ids: string[] = [];
      node.querySelectorAll<HTMLElement>("[data-funnel-element]").forEach(element => {
        const rect = element.getBoundingClientRect();
        const clippedText = Array.from(element.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p")).some(text => {
          const style = getComputedStyle(text);
          return ["hidden", "clip"].includes(style.overflowY) && text.scrollHeight > text.clientHeight + 2;
        });
        const exceeds = rect.width > 0 && (element.scrollWidth > element.clientWidth + 2 || rect.right > bounds.right + 2 || rect.left < bounds.left - 2 || clippedText);
        if (exceeds) ids.push(element.dataset.funnelElement!);
        element.toggleAttribute("data-funnel-overflow", exceeds);
      });
      setOverflow(current => current.join("|") === ids.join("|") ? current : ids);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(check); };
    const resize = new ResizeObserver(schedule); resize.observe(node);
    const mutation = new MutationObserver(schedule);
    if (inspect) mutation.observe(node, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["style", "src", "class"] });
    node.addEventListener("load", schedule, true);
    void document.fonts?.ready.then(schedule);
    schedule();
    return () => { resize.disconnect(); mutation.disconnect(); node.removeEventListener("load", schedule, true); cancelAnimationFrame(frame); };
  }, [inspect]);
  return <WidthContext.Provider value={width}><div ref={root} className="w-full min-w-0 h-full">
    {inspect && overflow.length > 0 && <div role="status" className="mb-3 border border-amber-500 bg-amber-50 text-amber-950 rounded p-3 text-sm"><p>Möglicher Überlauf oder abgeschnittener Text in {overflow.length} Element(en).</p>{overflow.map((id, index) => <button key={id} className="underline mr-3" onClick={() => inspect(id)}>Element {index + 1} prüfen</button>)}</div>}
    {children}
  </div></WidthContext.Provider>;
}
