import { create } from 'zustand';

export type LayoutAlgorithm = 'force' | 'dagre-tb' | 'dagre-lr' | 'grid' | 'radial';

export interface GraphState {
  // Selection
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filters
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  hideOrphans: boolean;
  setHideOrphans: (hide: boolean) => void;

  // View / Layout Options
  layoutAlgorithm: LayoutAlgorithm;
  setLayoutAlgorithm: (layout: LayoutAlgorithm) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;

  // UI Panels
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;
  toggleFilterPanel: () => void;
  isDiagnosticsPanelOpen: boolean;
  setIsDiagnosticsPanelOpen: (open: boolean) => void;
  toggleDiagnosticsPanel: () => void;

  // Actions
  resetFilters: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedFolder: null,
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),

  selectedTag: null,
  setSelectedTag: (tag) => set({ selectedTag: tag }),

  hideOrphans: false,
  setHideOrphans: (hide) => set({ hideOrphans: hide }),

  layoutAlgorithm: 'force',
  setLayoutAlgorithm: (layout) => set({ layoutAlgorithm: layout }),

  showLabels: true,
  setShowLabels: (show) => set({ showLabels: show }),

  isFilterPanelOpen: false,
  setIsFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),
  toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),

  isDiagnosticsPanelOpen: false,
  setIsDiagnosticsPanelOpen: (open) => set({ isDiagnosticsPanelOpen: open }),
  toggleDiagnosticsPanel: () => set((state) => ({ isDiagnosticsPanelOpen: !state.isDiagnosticsPanelOpen })),

  resetFilters: () =>
    set({
      searchQuery: '',
      selectedFolder: null,
      selectedTag: null,
      hideOrphans: false,
    }),
}));
