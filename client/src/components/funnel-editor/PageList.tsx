import React, { useCallback } from "react";
import {
  Plus,
  GripVertical,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "./store/editor-store";
import type { FunnelPage } from "@shared/schema";

const PAGE_TYPE_LABELS: Record<string, string> = {
  welcome: "Willkommen",
  question: "Frage",
  multiChoice: "Multiple Choice",
  contact: "Kontakt",
  calendar: "Kalender",
  thankyou: "Danke",
};

const PAGE_TYPE_COLORS: Record<string, string> = {
  welcome: "bg-green-500",
  question: "bg-blue-500",
  multiChoice: "bg-purple-500",
  contact: "bg-orange-500",
  calendar: "bg-cyan-500",
  thankyou: "bg-pink-500",
};

interface PageListProps {
  fullHeight?: boolean;
}

/**
 * Kompakte Seitenliste in der linken Sidebar.
 */
export function PageList({ fullHeight }: PageListProps) {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);
  const addPage = useEditorStore((s) => s.addPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);

  const handleAddPage = useCallback((type: FunnelPage["type"]) => {
    addPage(type, currentPageId || undefined);
  }, [addPage, currentPageId]);

  return (
    <div className={fullHeight ? "bg-card h-full flex flex-col" : "border-b border-border bg-card"}>
      <div className="p-3 flex items-center justify-between shrink-0">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Seiten ({pages.length})
        </h4>
        <Select onValueChange={(v) => handleAddPage(v as FunnelPage["type"])}>
          <SelectTrigger className="h-7 w-7 p-0 border-0 [&>svg]:hidden">
            <Plus className="h-3.5 w-3.5" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome">Willkommen</SelectItem>
            <SelectItem value="question">Frage</SelectItem>
            <SelectItem value="multiChoice">Multiple Choice</SelectItem>
            <SelectItem value="contact">Kontakt</SelectItem>
            <SelectItem value="calendar">Kalender</SelectItem>
            <SelectItem value="thankyou">Danke</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={`px-2 pb-2 space-y-0.5 ${fullHeight ? "flex-1 overflow-y-auto" : "max-h-[200px] overflow-y-auto"}`}>
        {pages.map((page, index) => (
          <PageItem
            key={page.id}
            page={page}
            index={index}
            isSelected={page.id === currentPageId}
            onSelect={() => setCurrentPage(page.id)}
            onDelete={() => deletePage(page.id)}
            onDuplicate={() => duplicatePage(page.id)}
            canDelete={pages.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

function PageItem({
  page,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  canDelete,
}: {
  page: FunnelPage;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  canDelete: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-foreground"
      }`}
      onClick={onSelect}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          PAGE_TYPE_COLORS[page.type] || "bg-gray-500"
        }`}
      />
      <span className="text-xs font-medium truncate flex-1">
        {index + 1}. {page.title}
      </span>

      <div className="hidden group-hover:flex items-center gap-0.5">
        <button
          className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted-foreground/10"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
        {canDelete && (
          <button
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
