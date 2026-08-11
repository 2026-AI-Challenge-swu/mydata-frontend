import { create } from 'zustand';
import type { ConnectionCategory, ItemStatus, ScreenStep } from '../types/connection';

interface ConnectionState {
  step: ScreenStep;
  agreed: boolean;
  items: Record<ConnectionCategory, ItemStatus>;

  setStep: (step: ScreenStep) => void;
  setAgreed: (agreed: boolean) => void;
  setItemStatus: (category: ConnectionCategory, status: ItemStatus) => void;
  resetItem: (category: ConnectionCategory) => void;
}

const initialItems: Record<ConnectionCategory, ItemStatus> = {
  nationalPension: { status: 'idle' },
  retirementPension: { status: 'idle' },
  personalPension: { status: 'idle' },
  savingsInvestment: { status: 'idle' },
};

export const useConnectionStore = create<ConnectionState>((set) => ({
  step: 'intro',
  agreed: false,
  items: initialItems,

  setStep: (step) => set({ step }),
  setAgreed: (agreed) => set({ agreed }),
  setItemStatus: (category, status) =>
    set((state) => ({
      items: { ...state.items, [category]: status },
    })),
  resetItem: (category) =>
    set((state) => ({
      items: { ...state.items, [category]: { status: 'idle' } },
    })),
}));

export function getOverallStatus(
  items: Record<ConnectionCategory, ItemStatus>,
): 'pending' | 'success' | 'partial' | 'failure' {
  const statuses = Object.values(items).map((item) => item.status);

  if (statuses.every((status) => status === 'success')) return 'success';
  if (statuses.every((status) => status === 'error')) return 'failure';
  if (statuses.some((status) => status === 'success')) return 'partial';
  return 'pending';
}
