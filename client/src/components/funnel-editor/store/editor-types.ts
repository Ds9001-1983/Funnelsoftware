import type { FunnelPage, PageElement, Theme, PageCondition, PageAnimation } from "@shared/schema";
import type { DeviceType } from "../DevicePreview";

// Element styles with responsive overrides
export interface ElementStyles {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  tablet?: Partial<Omit<ElementStyles, "tablet" | "mobile">>;
  mobile?: Partial<Omit<ElementStyles, "tablet" | "mobile">>;
}

// History entry for undo/redo
export interface HistoryEntry {
  label: string;
  timestamp: number;
  pages: FunnelPage[];
  currentPageId: string | null;
}

// Save status indicator
export type SaveStatus = "saved" | "saving" | "error" | "unsaved";

// Left panel view mode
export type LeftPanelView = "pages" | "elements" | "settings";

// Editor state
export interface EditorState {
  // Funnel data
  funnelId: number | null;
  funnelName: string;
  funnelUuid: string;
  pages: FunnelPage[];
  theme: Theme;
  status: "draft" | "published" | "archived";

  // UI state
  currentPageId: string | null;
  selectedElementId: string | null;
  hoveredElementId: string | null;
  devicePreview: DeviceType;
  isDragging: boolean;
  leftPanelOpen: boolean;
  leftPanelView: LeftPanelView;
  settingsTab: "inhalt" | "style" | "erweitert";

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Save state
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
}

// Editor actions
export interface EditorActions {
  // Initialization
  initFunnel: (funnel: {
    id: number;
    uuid: string;
    name: string;
    pages: FunnelPage[];
    theme: Theme;
    status: "draft" | "published" | "archived";
  }) => void;

  // Page actions
  setCurrentPage: (pageId: string) => void;
  addPage: (type: FunnelPage["type"], afterPageId?: string) => void;
  deletePage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<FunnelPage>) => void;
  movePage: (fromIndex: number, toIndex: number) => void;
  duplicatePage: (pageId: string) => void;

  // Element actions
  addElement: (type: PageElement["type"], position?: number) => void;
  deleteElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<PageElement>) => void;
  moveElement: (elementId: string, newPosition: number) => void;
  duplicateElement: (elementId: string) => void;

  // Selection & hover
  selectElement: (elementId: string | null) => void;
  hoverElement: (elementId: string | null) => void;

  // UI state
  setDevicePreview: (device: DeviceType) => void;
  setIsDragging: (dragging: boolean) => void;
  toggleLeftPanel: () => void;
  setLeftPanelView: (view: LeftPanelView) => void;
  setSettingsTab: (tab: EditorState["settingsTab"]) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Save
  setSaveStatus: (status: SaveStatus) => void;
  markSaved: () => void;

  // Theme
  updateTheme: (updates: Partial<Theme>) => void;
  updateFunnelName: (name: string) => void;

  // Helpers
  getCurrentPage: () => FunnelPage | null;
  getSelectedElement: () => PageElement | null;
}

export type EditorStore = EditorState & EditorActions;
