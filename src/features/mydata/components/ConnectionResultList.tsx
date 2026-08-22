import type { ReactNode } from 'react';
import { useConnectionStore, getOverallStatus } from '../stores/connectionStore';
import type { ConnectionCategory } from '../types/connection';
import { ConnectionItemRow } from './ConnectionItemRow';

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M18.1083 15L11.4417 3.33332C11.2963 3.07682 11.0855 2.86347 10.8308 2.71504C10.576 2.56661 10.2865 2.4884 9.99167 2.4884C9.69685 2.4884 9.4073 2.56661 9.15257 2.71504C8.89783 2.86347 8.68703 3.07682 8.54167 3.33332L1.875 15C1.72807 15.2544 1.65103 15.5432 1.65168 15.8371C1.65233 16.1309 1.73065 16.4194 1.87871 16.6732C2.02676 16.927 2.23929 17.1371 2.49475 17.2823C2.7502 17.4275 3.03951 17.5026 3.33334 17.5H16.6667C16.9591 17.4997 17.2463 17.4225 17.4994 17.2761C17.7525 17.1297 17.9627 16.9192 18.1088 16.6659C18.2548 16.4126 18.3317 16.1253 18.3316 15.8329C18.3316 15.5405 18.2545 15.2532 18.1083 15Z"
        stroke="#FE9A00"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 7.5V10.8333" stroke="#FE9A00" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14.1667H10.0083" stroke="#FE9A00" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2 8C2 6.4087 2.63214 4.88258 3.75736 3.75736C4.88258 2.63214 6.4087 2 8 2C9.67737 2.00631 11.2874 2.66082 12.4933 3.82667L14 5.33333"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V5.33333H10.6667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M14 8C14 9.5913 13.3679 11.1174 12.2426 12.2426C11.1174 13.3679 9.5913 14 8 14C6.32263 13.9937 4.71265 13.3392 3.50667 12.1733L2 10.6667"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.33333 10.6666H2V14" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CATEGORY_ORDER: ConnectionCategory[] = [
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
  'bankTransaction',
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

// partial은 시안 dev mode에서 뽑은 정확한 값, 나머지 상태는 아직 시안이 없어 기존 근사치 유지
const OVERALL_STATUS_STYLE: Record<OverallStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  success: 'bg-blue-50 text-blue-600',
  partial: 'bg-[#FFFBEB] border border-[#FEE685] text-[#BB4D00]',
  failure: 'bg-red-50 text-red-600',
};

const HEADING_SUBTEXT: Partial<Record<OverallStatus, ReactNode>> = {
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

  const canContinue = overallStatus === 'success' || overallStatus === 'partial';

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className={`rounded-2xl px-4 py-3.5 text-sm ${OVERALL_STATUS_STYLE[overallStatus]}`}>
        <div className="flex items-center gap-1.5 font-bold">
          {overallStatus === 'partial' && <WarningIcon />}
          {OVERALL_STATUS_LABEL[overallStatus]}
        </div>
        {OVERALL_STATUS_SUBTEXT[overallStatus] && (
          <div className="mt-0.5 text-xs text-[#E17100]">{OVERALL_STATUS_SUBTEXT[overallStatus]}</div>
        )}
      </div>

      {HEADING_SUBTEXT[overallStatus] && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#1A1A2E]">연동 결과 확인</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{HEADING_SUBTEXT[overallStatus]}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col divide-y divide-black/8 rounded-2xl border border-black/8 bg-white px-4">
        {CATEGORY_ORDER.map((category) => (
          <ConnectionItemRow key={category} category={category} status={items[category]} />
        ))}
      </div>

      {overallStatus === 'partial' && (
        <div className="mt-8 rounded-2xl bg-[#F0F0EC] px-4 py-3 text-xs text-[#6B7280]">
          <span aria-hidden="true">💡</span> 실패한 항목은 결과 화면에서 언제든 다시 연동할 수 있어요.
          <br />
          지금 가진 정보로도 진단을 충분히 진행할 수 있어요.
        </div>
      )}

      {canContinue && (
        <button
          className="mt-8 rounded-2xl bg-[#2A78D6] py-4 text-[15px] font-bold text-white"
          onClick={onContinue}
        >
          이대로 계속하기
        </button>
      )}

      {overallStatus === 'partial' && (
        <button
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-black/8 bg-white py-4 text-[15px] font-bold text-[#1A1A2E]"
          onClick={onRetryFailed}
        >
          <RefreshIcon color="#1A1A2E" />
          실패한 항목만 다시 연동하기
        </button>
      )}
    </div>
  );
}
