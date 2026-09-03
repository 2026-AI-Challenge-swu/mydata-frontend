import { TARGET_MONTHLY_LIVING_COST } from '../hooks/useRetirementReport';

// "노후 부족 자금 분석" 카드의 목표 생활비/희망 은퇴나이를 고치는 팝업 — 전문가 리포트 화면과
// "상담용 요약" 탭이 똑같이 씀(두 화면 다 같은 계산식을 쓰니 입력 UI도 공유).
export const RETIREMENT_AGE_MIN = 60;
export const RETIREMENT_AGE_MAX = 70;

export function GoalEditModal({
  goalManwon,
  retirementAge,
  onChangeGoalManwon,
  onChangeRetirementAge,
  onCancel,
  onApply,
}: {
  goalManwon: number;
  retirementAge: number;
  onChangeGoalManwon: (value: number) => void;
  onChangeRetirementAge: (value: number) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-sm leading-[21px] font-bold text-[#1A1A2E]">노후 부족 자금 분석</h3>

        <label className="mt-4 block text-[12px] leading-[18px] font-bold text-[#1A1A2E]">
          목표 생활비 (만원/월)
        </label>
        <p className="mt-1 text-[11px] leading-[16.5px] text-[#6B7280]">
          당신 또래 평균은 {TARGET_MONTHLY_LIVING_COST / 10_000}만원이에요
        </p>
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          value={goalManwon}
          onChange={(e) => onChangeGoalManwon(Number(e.target.value))}
          className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2.5 text-[16px] leading-[24px] font-bold text-[#1A1A2E] outline-none focus:border-[#2A78D6]"
        />

        <label className="mt-4 block text-[12px] leading-[18px] font-bold text-[#1A1A2E]">희망 은퇴 나이</label>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onChangeRetirementAge(Math.max(RETIREMENT_AGE_MIN, retirementAge - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EC] text-xl font-bold text-[#1A1A2E]"
          >
            −
          </button>
          <span className="text-[24px] leading-[36px] font-extrabold text-[#2A78D6]">{retirementAge}세</span>
          <button
            type="button"
            onClick={() => onChangeRetirementAge(Math.min(RETIREMENT_AGE_MAX, retirementAge + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EC] text-xl font-bold text-[#1A1A2E]"
          >
            +
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-black/8 bg-white py-2.5 text-[14px] leading-[21px] font-bold text-[#6B7280]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-xl bg-[#2A78D6] py-2.5 text-[14px] leading-[21px] font-bold text-white"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
