import { create } from 'zustand';
import type { ConnectionCategory, ConnectionItems, ItemStatus, ScreenStep } from '../types/connection';

interface ConnectionState {
  step: ScreenStep;
  agreed: boolean;
  items: ConnectionItems;

  setStep: (step: ScreenStep) => void;
  setAgreed: (agreed: boolean) => void;
  setItemStatus: <C extends ConnectionCategory>(category: C, status: ItemStatus<C>) => void;
  resetItem: (category: ConnectionCategory) => void;
}

const initialItems: ConnectionItems = {
  identity: { status: 'idle' },
  income: { status: 'idle' },
  employment: { status: 'idle' },
  nationalPension: { status: 'idle' },
  retirementPension: { status: 'idle' },
  personalPension: { status: 'idle' },
  savingsInvestment: { status: 'idle' },
  bankTransaction: { status: 'idle' },
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
  items: ConnectionItems,
): 'pending' | 'success' | 'partial' | 'failure' {
  const statuses = Object.values(items).map((item) => item.status);

  if (statuses.every((status) => status === 'success')) return 'success';
  if (statuses.every((status) => status === 'error')) return 'failure';
  if (statuses.some((status) => status === 'success')) return 'partial';
  return 'pending';
}
