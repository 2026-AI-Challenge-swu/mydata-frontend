import { useNavigate } from 'react-router-dom';

// Figma "Copy as SVG"로 그대로 받아온 아이콘 — 배지/캡션 공용
function ClockIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 3V6L8 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Figma "Copy as SVG"로 그대로 받아온 화살표 아이콘 (버튼 안, 흰색 고정)
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3.33325 8H12.6666" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 3.33337L12.6667 8.00004L8 12.6667"
        stroke="white"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EntryScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full flex-col bg-[#FAFAF7] px-6 pt-14 pb-10">
      {/* 상단 배지 */}
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1.5 text-[11px] font-bold tracking-[0.275px] text-[#155DFC]">
        <ClockIcon />
        2030 직장인을 위한 1분 테스트
      </div>

      {/* 타이틀 */}
      <h1 className="mt-4 text-[34px] leading-[40.8px] font-bold text-[#1A1A2E]">
        나는 어떤
        <br />
        금융유형일까?
      </h1>

      {/* 서브타이틀 */}
      <p className="mt-3 text-[15px] leading-[24.375px] text-[#6B7280]">
        국민연금 내고는 있는데,
        <br />
        노후 준비는 뭐부터 해야 할지 막막하다면
      </p>

      {/* 나침반 카드 */}
      <div className="relative mt-10 flex h-[176px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#EBF3FF] to-[#E8F2FF]">
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/20" />
        <div className="absolute bottom-4 left-4 h-12 w-12 rounded-full bg-white/20" />
        <span className="text-5xl leading-none">🧭</span>
        <span className="mt-3 text-[13px] leading-[19.5px] font-bold text-[#2A78D6]">내 금융 나침반 찾기</span>
      </div>

      {/* CTA 버튼 */}
      <button
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A78D6] py-4 text-base leading-6 font-bold text-white shadow"
        onClick={() => navigate('/mydata/consent')}
      >
        테스트 시작하기
        <ArrowRightIcon />
      </button>

      {/* 캡션 */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs leading-[18px] text-[#6B7280]">
        <ClockIcon />
        10문항 · 약 1분 소요 · 결과는 은행권 표준 기준
      </div>

      {/* 안내 리스트 (구분선 + 상단 여백을 이 래퍼 하나가 담당) */}
      <div className="mt-10 border-t border-black/8 pt-7">
        <h2 className="text-[11px] font-bold tracking-[1.1px] text-[#6B7280]">이런 걸 알 수 있어요</h2>
        <ul className="mt-4 flex flex-col gap-4">
          <li className="flex items-center gap-3 text-sm leading-[21px] text-[#1A1A2E]">
            <span className="text-lg">🏷️</span>
            나만의 금융유형 이름과 성향
          </li>
          <li className="flex items-center gap-3 text-sm leading-[21px] text-[#1A1A2E]">
            <span className="text-lg">📦</span>
            유형별 연금·금융상품 카테고리
          </li>
          <li className="flex items-center gap-3 text-sm leading-[21px] text-[#1A1A2E]">
            <span className="text-lg">💡</span>
            절세 효과와 미래 자산 시뮬레이션
          </li>
        </ul>
      </div>
    </div>
  );
}
