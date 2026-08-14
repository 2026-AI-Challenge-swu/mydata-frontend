import type { CategoryDataMap, ConnectionCategory, ItemStatus } from '../types/connection';

const CATEGORY_LABELS: Record<ConnectionCategory, string> = {
  nationalPension: '국민연금',
  retirementPension: '퇴직연금',
  personalPension: '개인연금(IRP)',
  savingsInvestment: '예적금·투자',
};

function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

// data는 4개 카테고리 데이터 타입의 유니온이라, 각 타입에만 있는 고유 필드로 'in' 검사해서 구분
function renderSummary(data: CategoryDataMap[ConnectionCategory]): string {
  if ('estimatedMonthlyAmount' in data) {
    return `예상 월 수령액 ${formatWon(data.estimatedMonthlyAmount)} (${data.paymentStartAge}세부터, 가입 ${data.contributionYears}년)`;
  }
  if ('evaluationAmount' in data) {
    return `평가금액 ${formatWon(data.evaluationAmount)}`;
  }
  if ('totalContribution' in data) {
    return `총 납입액 ${formatWon(data.totalContribution)} (계좌 ${data.accounts.length}개)`;
  }
  return `총 잔액 ${formatWon(data.totalBalance)} (계좌 ${data.accounts.length}개)`;
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
        <span className="text-sm text-slate-600">{renderSummary(status.data)}</span>
      )}

      {status.status === 'error' && <span className="text-sm text-red-500">{status.message}</span>}
    </div>
  );
}
