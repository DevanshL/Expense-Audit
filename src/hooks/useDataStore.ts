import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcessedDataset } from '../types';

interface DataStore {
  dataset: ProcessedDataset | null;
  setDataset: (dataset: ProcessedDataset | null) => void;
  clearDataset: () => void;
}

export const useDataStore = create<DataStore>()(
  persist(
    (set) => ({
      dataset: null,
      setDataset: (dataset: ProcessedDataset | null) => set({ dataset }),
      clearDataset: () => set({ dataset: null }),
    }),
    {
      name: 'expense-audit-data',
      // Only persist essential data, not the full dataset for performance
      partialize: (state: DataStore) => ({ 
        dataset: state.dataset ? {
          ...state.dataset,
          // Keep only essential data for persistence
          rawData: [], // Don't persist raw data
        } : null 
      }),
    }
  )
);
