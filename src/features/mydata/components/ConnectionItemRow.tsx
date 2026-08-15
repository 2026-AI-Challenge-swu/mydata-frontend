import type { ConnectionCategory, ItemStatus } from '../types/connection';

const CATEGORY_LABELS: Record<ConnectionCategory, string> = {
  nationalPension: '국민연금 가입내역',
  retirementPension: '퇴직연금 현황',
  personalPension: '개인연금 가입여부',
  savingsInvestment: '예적금·투자상품 현황',
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="10" className="fill-emerald-100" />
      <path
        d="M6 10.5l2.5 2.5L14 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-600"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="10" className="fill-red-100" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-red-500"
      />
    </svg>
  );
}

interface ConnectionItemRowProps {
  category: ConnectionCategory;
  status: ItemStatus;
}

export function ConnectionItemRow({ category, status }: ConnectionItemRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="font-medium text-slate-700">{CATEGORY_LABELS[category]}</span>

      {status.status === 'idle' && <span className="text-sm text-slate-400">대기 중</span>}

      {status.status === 'loading' && (
        <span className="flex items-center gap-2 text-sm text-blue-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          불러오는 중...
        </span>
      )}

      {status.status === 'success' && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <CheckIcon />
          연동됨
        </span>
      )}

      {status.status === 'error' && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
          <XIcon />
          연동 실패
        </span>
      )}
    </div>
  );
}
