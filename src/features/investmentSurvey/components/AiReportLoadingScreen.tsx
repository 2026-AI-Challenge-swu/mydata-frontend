import { useEffect, useState } from 'react';
import { AiAvatarIcon, AlertCircleIcon } from './icons';

// AI 리포트(/api/retirement-report) 콜드스타트 때문에 응답이 오래 걸릴 수 있어서, 그 동안 계속
// 같은 문구를 보여주면 멈춘 것처럼 느껴짐 — 경과 시간에 따라 문구를 바꿔가며 "진행되고 있다"는
// 인상을 줌. 마지막 문구("거의 다 됐어요")는 실제 진행률을 알 수 없는 상태에서 도달 후 오래 멈춰
// 있으면 오히려 신뢰를 깎아먹으므로, 완료를 단정하는 표현 대신 "조금만 기다려주세요" 정도로만 둠.
// 실제 생성이 보통 35~46초 걸리는 것으로 확인돼서(2026-09-06), 문구 전환 간격을 그 시간대에
// 맞춰 넉넉하게 둠 — 너무 자주 바뀌면 오히려 정신없어 보임.
const LOADING_MESSAGES = [
  { afterMs: 0, text: '당신의 자산 데이터를 확인하고 있어요' },
  { afterMs: 6000, text: 'AI가 당신에게 딱 맞는 연금 설계를 하는 중이에요' },
  { afterMs: 15000, text: '예상 수령액과 부족 자금을 계산하고 있어요' },
  { afterMs: 28000, text: '거의 다 됐어요, 조금만 기다려주세요' },
];

interface AiReportLoadingScreenProps {
  // true면 리포트 생성이 실패한 상태 — 스피너 대신 재시도 화면을 보여줌.
  error?: boolean;
  onRetry?: () => void;
}

export function AiReportLoadingScreen({ error = false, onRetry }: AiReportLoadingScreenProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (error) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 500);
    return () => clearInterval(timer);
  }, [error]);

  if (error) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-white px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#FFE2E2] bg-[#FEF2F2]">
          <AlertCircleIcon color="#E85D4A" />
        </div>
        <p className="mt-8 max-w-[320px] text-[15px] leading-[22.5px] font-bold text-[#1A1A2E]">
          리포트를 만드는 데 문제가 생겼어요
        </p>
        <p className="mt-2 text-[13px] leading-[19.5px] text-[#6B7280]">
          잠시 후 다시 시도해주세요
        </p>
        <button
          className="mt-6 rounded-2xl bg-[#1A1A2E] px-6 py-3 text-sm leading-[21px] font-bold text-white"
          onClick={onRetry}
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  // 뒤에서부터 찾아서 "지금 경과 시간을 이미 넘긴 것 중 가장 최근 문구"를 고름.
  const message = [...LOADING_MESSAGES].reverse().find((step) => elapsedMs >= step.afterMs)!.text;

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center bg-white px-6 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span
          className="absolute inset-0 animate-spin rounded-full border-4 border-[#DBEAFE] border-t-[#2A78D6]"
          aria-hidden="true"
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF3FF]">
          <AiAvatarIcon color="#2A78D6" />
        </span>
      </div>
      <p className="mt-8 max-w-[320px] text-[15px] leading-[22.5px] font-bold text-[#1A1A2E]">{message}</p>
      <p className="mt-2 text-[13px] leading-[19.5px] text-[#6B7280]">
        마이데이터를 바탕으로 리포트를 만들고 있어요
      </p>
    </div>
  );
}
