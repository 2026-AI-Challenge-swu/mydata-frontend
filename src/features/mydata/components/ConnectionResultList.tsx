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
  partial: '일부 정보만 불러왔어요',
  failure: '조회에 실패했어요',
};

const OVERALL_STATUS_SUBTEXT: Partial<Record<OverallStatus, string>> = {
  partial: '나머지는 나중에 다시 시도할 수 있어요',
};

const OVERALL_STATUS_STYLE: Record<OverallStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  success: 'bg-blue-50 text-blue-600',
  partial: 'bg-amber-50 text-amber-600',
  failure: 'bg-red-50 text-red-600',
};

const HEADING_SUBTEXT: Partial<Record<OverallStatus, string>> = {
  success: '모든 정보를 확인했어요. 다음 단계로 진행할 수 있어요.',
  partial: '일부 기관에서 오류가 발생했어요. 성공한 정보로 먼저 진행할 수 있어요.',
};

interface ConnectionResultListProps {
  onContinue?: () => void;
  onRetryFailed?: () => void;
}

export function ConnectionResultList({ onContinue, onRetryFailed }: ConnectionResultListProps) {
  const items = useConnectionStore((state) => state.items);
  const overallStatus = getOverallStatus(items);

  const retryableFailedCount = CATEGORY_ORDER.filter((category) => {
    const item = items[category];
    return item.status === 'error' && item.retryable !== false;
  }).length;

  const canContinue = overallStatus === 'success' || overallStatus === 'partial';

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className={`rounded-lg px-4 py-3 text-sm ${OVERALL_STATUS_STYLE[overallStatus]}`}>
        <div className="flex items-center gap-1.5 font-semibold">
          {overallStatus === 'partial' && <span aria-hidden="true">⚠️</span>}
          {OVERALL_STATUS_LABEL[overallStatus]}
        </div>
        {OVERALL_STATUS_SUBTEXT[overallStatus] && (
          <div className="mt-0.5 text-xs opacity-80">{OVERALL_STATUS_SUBTEXT[overallStatus]}</div>
        )}
      </div>

      {HEADING_SUBTEXT[overallStatus] && (
        <div>
          <h2 className="text-lg font-bold text-slate-800">연동 결과 확인</h2>
          <p className="mt-1 text-sm text-slate-500">{HEADING_SUBTEXT[overallStatus]}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {CATEGORY_ORDER.map((category) => (
          <ConnectionItemRow key={category} category={category} status={items[category]} />
        ))}
      </div>

      {overallStatus === 'partial' && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span aria-hidden="true">💡</span>
          <span>
            실패한 항목은 결과 화면에서 언제든 다시 연동할 수 있어요.
            <br />
            지금 가진 정보로도 진단을 충분히 진행할 수 있어요.
          </span>
        </div>
      )}

      {canContinue && (
        <button
          className="rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
          onClick={onContinue}
        >
          이대로 계속하기
        </button>
      )}

      {overallStatus === 'partial' && retryableFailedCount > 0 && (
        <button
          className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600"
          onClick={onRetryFailed}
        >
          실패한 항목만 다시 연동하기
        </button>
      )}
    </div>
  );
}
