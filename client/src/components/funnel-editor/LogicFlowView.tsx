import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Badge } from "@/components/ui/badge";
import { pageTypeLabels, pageTypeIcons } from "./constants";
import type { FunnelPage, PageElement } from "@shared/schema";

interface LogicFlowViewProps {
  pages: FunnelPage[];
  selectedPageId?: string;
  onSelectPage?: (pageId: string) => void;
}

interface PageNodeData extends Record<string, unknown> {
  page: FunnelPage;
  isSelected: boolean;
  onClick: () => void;
  hasIncoming: boolean;
}

const NODE_WIDTH = 220;
const NODE_VGAP = 120;

function PageNode({ data }: { data: PageNodeData }) {
  const { page, isSelected, onClick, hasIncoming } = data;
  const typeColor: Record<string, string> = {
    welcome: "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300",
    thankyou: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300",
    question: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
    multiChoice: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
    contact: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
    content: "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300",
  };
  const colorClass = typeColor[page.type] ?? typeColor.content;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border-2 bg-card px-3 py-2.5 shadow-sm transition-all cursor-pointer hover:shadow-md ${
        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
      style={{ width: NODE_WIDTH }}
    >
      {hasIncoming && <Handle type="target" position={Position.Top} className="!bg-muted-foreground/40 !border-card" />}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded text-xs ${colorClass}`}>
          {pageTypeIcons[page.type] ?? "?"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{page.title}</div>
          <div className="text-[10px] text-muted-foreground">{pageTypeLabels[page.type] ?? page.type}</div>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {page.hidden && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
            verborgen
          </Badge>
        )}
        {page.conditions?.length ? (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
            {page.conditions.length} Regel
            {page.conditions.length === 1 ? "" : "n"}
          </Badge>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/40 !border-card" />
    </div>
  );
}

const nodeTypes = { page: PageNode };

function collectOptionRouting(
  elements: PageElement[] | undefined,
): Array<{ label: string; target: string }> {
  const out: Array<{ label: string; target: string }> = [];
  if (!elements) return out;
  for (const el of elements) {
    if (el.optionRouting) {
      for (const [option, target] of Object.entries(el.optionRouting)) {
        if (target) out.push({ label: option, target });
      }
    }
    if (el.listItems) {
      for (const item of el.listItems) {
        if (item.targetPageId) out.push({ label: item.text || "List-Item", target: item.targetPageId });
      }
    }
  }
  return out;
}

export function LogicFlowView({ pages, selectedPageId, onSelectPage }: LogicFlowViewProps) {
  const pageById = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);

  const incomingTargets = useMemo(() => {
    const set = new Set<string>();
    pages.forEach((p, idx) => {
      if (p.nextPageId) set.add(p.nextPageId);
      else if (idx < pages.length - 1) set.add(pages[idx + 1].id);
      if (p.conditionalRouting) Object.values(p.conditionalRouting).forEach((id) => id && set.add(id));
      collectOptionRouting(p.elements).forEach((r) => set.add(r.target));
    });
    return set;
  }, [pages]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node<PageNodeData>[] = pages.map((page, idx) => ({
      id: page.id,
      type: "page",
      position: { x: 0, y: idx * NODE_VGAP },
      data: {
        page,
        isSelected: page.id === selectedPageId,
        hasIncoming: incomingTargets.has(page.id),
        onClick: () => onSelectPage?.(page.id),
      },
      draggable: false,
      selectable: false,
    }));

    const edges: Edge[] = [];

    pages.forEach((page, idx) => {
      const defaultNext = page.nextPageId ?? pages[idx + 1]?.id;
      if (defaultNext && pageById.has(defaultNext)) {
        edges.push({
          id: `${page.id}->${defaultNext}`,
          source: page.id,
          target: defaultNext,
          type: "smoothstep",
          animated: false,
          style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
        });
      }

      if (page.conditionalRouting) {
        Object.entries(page.conditionalRouting).forEach(([opt, target]) => {
          if (!target || !pageById.has(target)) return;
          edges.push({
            id: `${page.id}:${opt}->${target}`,
            source: page.id,
            target,
            label: opt,
            type: "smoothstep",
            style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5 },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "hsl(var(--popover))", fillOpacity: 0.9 },
            labelStyle: { fontSize: 10 },
          });
        });
      }

      collectOptionRouting(page.elements).forEach(({ label, target }) => {
        if (!pageById.has(target)) return;
        edges.push({
          id: `${page.id}:opt:${label}->${target}`,
          source: page.id,
          target,
          label,
          type: "smoothstep",
          style: { stroke: "hsl(var(--primary) / 0.7)", strokeWidth: 1.2, strokeDasharray: "4 2" },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: "hsl(var(--popover))", fillOpacity: 0.9 },
          labelStyle: { fontSize: 10 },
        });
      });
    });

    return { nodes, edges };
  }, [pages, pageById, incomingTargets, selectedPageId, onSelectPage]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<PageNodeData>) => {
      node.data.onClick();
    },
    [],
  );

  return (
    <div className="w-full h-full" style={{ minHeight: 400 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={() => "hsl(var(--muted))"} maskColor="hsl(var(--background) / 0.8)" />
      </ReactFlow>
    </div>
  );
}

export default LogicFlowView;
