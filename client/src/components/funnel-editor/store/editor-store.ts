import { create } from "zustand";
import type { FunnelPage, PageElement } from "@shared/schema";
import type { EditorStore, HistoryEntry } from "./editor-types";
import { registry } from "../registry/element-registry";

const MAX_HISTORY = 50;

function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createHistoryEntry(label: string, pages: FunnelPage[], currentPageId: string | null): HistoryEntry {
  return {
    label,
    timestamp: Date.now(),
    pages: JSON.parse(JSON.stringify(pages)),
    currentPageId,
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  funnelId: null,
  funnelName: "",
  funnelUuid: "",
  pages: [],
  theme: { primaryColor: "#7C3AED", backgroundColor: "#ffffff", textColor: "#1a1a1a", fontFamily: "Inter" },
  status: "draft",
  currentPageId: null,
  selectedElementId: null,
  hoveredElementId: null,
  devicePreview: "mobile",
  isDragging: false,
  leftPanelOpen: true,
  rightPanelOpen: true,
  settingsTab: "inhalt",
  history: [],
  historyIndex: -1,
  saveStatus: "saved",
  lastSavedAt: null,

  // --- Initialization ---
  initFunnel: (funnel) => {
    const initialHistory = createHistoryEntry("Initialer Stand", funnel.pages, funnel.pages[0]?.id || null);
    set({
      funnelId: funnel.id,
      funnelUuid: funnel.uuid,
      funnelName: funnel.name,
      pages: funnel.pages,
      theme: funnel.theme,
      status: funnel.status,
      currentPageId: funnel.pages[0]?.id || null,
      selectedElementId: null,
      history: [initialHistory],
      historyIndex: 0,
      saveStatus: "saved",
    });
  },

  // --- Page actions ---
  setCurrentPage: (pageId) => {
    set({ currentPageId: pageId, selectedElementId: null });
  },

  addPage: (type, afterPageId) => {
    const state = get();
    const newPage: FunnelPage = {
      id: `page-${Date.now()}`,
      type,
      title: type === "welcome" ? "Willkommen" : type === "thankyou" ? "Vielen Dank!" : "Neue Seite",
      subtitle: "",
      elements: [],
      buttonText: type === "thankyou" ? undefined : "Weiter",
    };
    const pages = [...state.pages];
    if (afterPageId) {
      const idx = pages.findIndex((p) => p.id === afterPageId);
      pages.splice(idx + 1, 0, newPage);
    } else {
      pages.push(newPage);
    }
    pushHistory("Seite hinzugefügt", pages, newPage.id);
    set({ pages, currentPageId: newPage.id, selectedElementId: null, saveStatus: "unsaved" });
  },

  deletePage: (pageId) => {
    const state = get();
    if (state.pages.length <= 1) return;
    const pages = state.pages.filter((p) => p.id !== pageId);
    const currentPageId = state.currentPageId === pageId ? pages[0]?.id || null : state.currentPageId;
    pushHistory("Seite gelöscht", pages, currentPageId);
    set({ pages, currentPageId, selectedElementId: null, saveStatus: "unsaved" });
  },

  updatePage: (pageId, updates) => {
    const state = get();
    const pages = state.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p));
    set({ pages, saveStatus: "unsaved" });
  },

  movePage: (fromIndex, toIndex) => {
    const state = get();
    const pages = [...state.pages];
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);
    pushHistory("Seite verschoben", pages, state.currentPageId);
    set({ pages, saveStatus: "unsaved" });
  },

  duplicatePage: (pageId) => {
    const state = get();
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return;
    const newPage: FunnelPage = {
      ...JSON.parse(JSON.stringify(page)),
      id: `page-${Date.now()}`,
      title: `${page.title} (Kopie)`,
    };
    // Regenerate element IDs
    newPage.elements = newPage.elements.map((el: PageElement) => ({ ...el, id: generateId() }));
    const pages = [...state.pages];
    const idx = pages.findIndex((p) => p.id === pageId);
    pages.splice(idx + 1, 0, newPage);
    pushHistory("Seite dupliziert", pages, newPage.id);
    set({ pages, currentPageId: newPage.id, saveStatus: "unsaved" });
  },

  // --- Element actions ---
  addElement: (type, position) => {
    const state = get();
    const page = state.pages.find((p) => p.id === state.currentPageId);
    if (!page) return;

    const definition = registry.get(type);
    if (!definition) return;
    const newElement: PageElement = {
      id: generateId(),
      type,
      ...definition?.defaultProps,
    };

    const elements = [...page.elements];
    if (position !== undefined && position >= 0) {
      elements.splice(position, 0, newElement);
    } else {
      elements.push(newElement);
    }

    const pages = state.pages.map((p) =>
      p.id === state.currentPageId ? { ...p, elements } : p
    );
    const label = definition?.label || type;
    pushHistory(`${label} hinzugefügt`, pages, state.currentPageId);
    set({ pages, selectedElementId: newElement.id, settingsTab: "inhalt", saveStatus: "unsaved" });
  },

  deleteElement: (elementId) => {
    const state = get();
    const page = state.pages.find((p) => p.id === state.currentPageId);
    if (!page) return;
    const elements = page.elements.filter((el) => el.id !== elementId);
    const pages = state.pages.map((p) =>
      p.id === state.currentPageId ? { ...p, elements } : p
    );
    pushHistory("Element gelöscht", pages, state.currentPageId);
    set({
      pages,
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
      saveStatus: "unsaved",
    });
  },

  updateElement: (elementId, updates) => {
    const state = get();
    const page = state.pages.find((p) => p.id === state.currentPageId);
    if (!page) return;
    const elements = page.elements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    const pages = state.pages.map((p) =>
      p.id === state.currentPageId ? { ...p, elements } : p
    );
    set({ pages, saveStatus: "unsaved" });
  },

  moveElement: (elementId, newPosition) => {
    const state = get();
    const page = state.pages.find((p) => p.id === state.currentPageId);
    if (!page) return;
    const elements = [...page.elements];
    const oldIndex = elements.findIndex((el) => el.id === elementId);
    if (oldIndex === -1) return;
    if (newPosition < 0 || newPosition >= elements.length) return;
    const [moved] = elements.splice(oldIndex, 1);
    elements.splice(newPosition, 0, moved);
    const pages = state.pages.map((p) =>
      p.id === state.currentPageId ? { ...p, elements } : p
    );
    pushHistory("Element verschoben", pages, state.currentPageId);
    set({ pages, saveStatus: "unsaved" });
  },

  duplicateElement: (elementId) => {
    const state = get();
    const page = state.pages.find((p) => p.id === state.currentPageId);
    if (!page) return;
    const elementIndex = page.elements.findIndex((el) => el.id === elementId);
    if (elementIndex === -1) return;
    const original = page.elements[elementIndex];
    const duplicate: PageElement = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
    };
    const elements = [...page.elements];
    elements.splice(elementIndex + 1, 0, duplicate);
    const pages = state.pages.map((p) =>
      p.id === state.currentPageId ? { ...p, elements } : p
    );
    pushHistory("Element dupliziert", pages, state.currentPageId);
    set({ pages, selectedElementId: duplicate.id, saveStatus: "unsaved" });
  },

  // --- Selection & hover ---
  selectElement: (elementId) => {
    set({ selectedElementId: elementId, settingsTab: "inhalt" });
  },

  hoverElement: (elementId) => {
    set({ hoveredElementId: elementId });
  },

  // --- UI state ---
  setDevicePreview: (device) => set({ devicePreview: device }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  // --- History ---
  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    set({
      pages: JSON.parse(JSON.stringify(entry.pages)),
      currentPageId: entry.currentPageId,
      historyIndex: newIndex,
      selectedElementId: null,
      saveStatus: "unsaved",
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    set({
      pages: JSON.parse(JSON.stringify(entry.pages)),
      currentPageId: entry.currentPageId,
      historyIndex: newIndex,
      selectedElementId: null,
      saveStatus: "unsaved",
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // --- Save ---
  setSaveStatus: (status) => set({ saveStatus: status }),
  markSaved: () => set({ saveStatus: "saved", lastSavedAt: Date.now() }),

  // --- Theme ---
  updateTheme: (updates) => {
    const state = get();
    set({ theme: { ...state.theme, ...updates }, saveStatus: "unsaved" });
  },

  updateFunnelName: (name) => set({ funnelName: name, saveStatus: "unsaved" }),

  // --- Helpers ---
  getCurrentPage: () => {
    const state = get();
    return state.pages.find((p) => p.id === state.currentPageId) || null;
  },

  getSelectedElement: () => {
    const state = get();
    const page = state.pages.find((p) => p.id === state.currentPageId);
    if (!page || !state.selectedElementId) return null;
    return page.elements.find((el) => el.id === state.selectedElementId) || null;
  },
}));

// Helper to push a history entry (called from actions)
function pushHistory(label: string, pages: FunnelPage[], currentPageId: string | null) {
  const state = useEditorStore.getState();
  const history = state.history.slice(0, state.historyIndex + 1);
  history.push(createHistoryEntry(label, pages, currentPageId));
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  useEditorStore.setState({
    history,
    historyIndex: history.length - 1,
  });
}
