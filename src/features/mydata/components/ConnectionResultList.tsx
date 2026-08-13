import { useConnectionStore, getOverallStatus } from '../stores/connectionStore';
import type { ConnectionCategory } from '../types/connection';
import { ConnectionItemRow } from './ConnectionItemRow';

const CATEGORY_ORDER: ConnectionCategory[] = [
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
];

type OverallStatus = ReturnType<typeof getOverallStatus>;

const OVERALL_STATUS_LABEL: Record<OverallStatus, string> = {
  pending: '조회 진행 중입니다',
  success: '모든 항목 조회가 완료됐어요',
  partial: '일부 항목은 조회에 실패했어요',
  failure: '조회에 실패했어요',
};

const OVERALL_STATUS_STYLE: Record<OverallStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  success: 'bg-blue-50 text-blue-600',
  partial: 'bg-amber-50 text-amber-600',
  failure: 'bg-red-50 text-red-600',
};

export function ConnectionResultList() {
  const items = useConnectionStore((state) => state.items);
  const overallStatus = getOverallStatus(items);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className={`rounded-lg px-4 py-2 text-sm font-medium ${OVERALL_STATUS_STYLE[overallStatus]}`}>
        {OVERALL_STATUS_LABEL[overallStatus]}
      </div>

      {CATEGORY_ORDER.map((category) => (
        <ConnectionItemRow key={category} category={category} status={items[category]} />
      ))}
    </div>
  );
}
