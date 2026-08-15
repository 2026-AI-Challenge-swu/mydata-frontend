import type { ConnectionCategory, ItemStatus } from '../types/connection';

const CATEGORY_LABELS: Record<ConnectionCategory, string> = {
  nationalPension: '국민연금 가입내역',
  retirementPension: '퇴직연금 현황',
  personalPension: '개인연금 가입여부',
  savingsInvestment: '예적금·투자상품 현황',
};

function CheckBadge() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D6F6E6]">
      <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
          stroke="#1FAB6A"
          strokeWidth="1.16667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function XBadge() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEF2F2]">
      <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M10.5 3.5L3.5 10.5"
          stroke="#E85D4A"
          strokeWidth="1.16667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 3.5L10.5 10.5"
          stroke="#E85D4A"
          strokeWidth="1.16667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface ConnectionItemRowProps {
  category: ConnectionCategory;
  status: ItemStatus;
}

export function ConnectionItemRow({ category, status }: ConnectionItemRowProps) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="flex items-center gap-2 text-sm text-[#1A1A2E]">
        {status.status === 'success' && <CheckBadge />}
        {status.status === 'error' && <XBadge />}
        {CATEGORY_LABELS[category]}
      </span>

      {status.status === 'idle' && <span className="text-sm text-[#6B7280]">대기 중</span>}

      {status.status === 'loading' && (
        <span className="flex items-center gap-2 text-sm text-blue-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          불러오는 중...
        </span>
      )}

      {status.status === 'success' && <span className="text-xs font-bold text-[#1FAB6A]">연동됨</span>}

      {status.status === 'error' && <span className="text-xs font-bold text-[#E85D4A]">연동 실패</span>}
    </div>
  );
}
