import { useState } from 'react';
import { useConnectionStore } from '../../mydata/stores/connectionStore';
import { CURRENT_AGE, computeAssetSummary, formatManwon, getConnectedMydata } from '../../mydata/utils/assetSummary';
import type { InvestmentProfile, SurveyQuestion } from '../types/survey';

interface ConsultantSummaryTabProps {
  profile: InvestmentProfile;
  questions: SurveyQuestion[];
  answers: Record<string, number>;
  connected: boolean;
}

// 페르소나 기준표(김민준, 29세) — 마이데이터로 연동되지 않는 값들이라 상수로 둠.
const PERSONA = {
  name: '김민준',
  birthYear: 1997,
  annualSalaryPreTax: 48_000_000, // 연봉(세전). bankTransaction은 세후 월급만 제공해서 이 값은 정의서 기준 그대로 하드코딩.
  job: '직장인 (IT·기획)',
  investmentExperienceLabel: '1~3년 (예적금 위주)',
  // personalPension.totalContribution(430만원)은 회사+본인 합산 누적 납입액이라 "본인 납입" 여부 판단에 못 씀.
  // 정의서 기준 "본인 납입 0원"이 별도 확정 사실이라 그대로 상수로 둠.
  personalContributionBySelf: 0,
};

// "목표 생활비"는 정의서에 국민연금연구원 통계 기본값으로 명시된 페르소나 상수값.
const TARGET_MONTHLY_LIVING_COST = 2_500_000;
// 부족 자금 계산에 적용하는 물가상승률 가정. 정의서(S4-08)에 방식 자체가 TBD로 남아있던 항목이라
// 일단 연금 계산과 동일한 방식(미래가치 인플레이션)으로 임시 구현 — 기획 확인 후 공식 조정 필요.
const INFLATION_RATE = 0.025;

// 투자성향 점수 5개 막대의 카테고리 매핑. 서버는 총점만 주기 때문에,
// 문항 카테고리+선택한 보기 순서(order == 배점)로 클라이언트에서 직접 계산함.
// %로 바꾸는 공식(선택값/만점)이 정의서에 없어서 임시로 넣은 값 — 기획 확인 필요.
const SCORE_BAR_CATEGORIES: { category: string; label: string }[] = [
  { category: '투자 경험', label: '투자 경험' },
  { category: '손실 감내(변동성)', label: '손실 감내도' },
  { category: '투자 기간', label: '투자 기간' },
  { category: '수익 추구 성향', label: '수익 추구도' },
  { category: '소득 안정성', label: '소득 안정성' },
];

function formatEok(won: number) {
  return `${(won / 100_000_000).toFixed(1)}억`;
}

export function ConsultantSummaryTab({ profile, questions, answers, connected }: ConsultantSummaryTabProps) {
  const items = useConnectionStore((state) => state.items);

  if (!connected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-[#FAFAF7] px-6 py-16 text-center">
        <span className="text-3xl" aria-hidden="true">
          🔒
        </span>
        <p className="text-sm text-[#6B7280]">마이데이터 연동 후에 이용할 수 있는 리포트예요</p>
      </div>
    );
  }

  const connectedMydata = getConnectedMydata(items);
  if (!connectedMydata) {
    return null;
  }

  const { nationalPension } = connectedMydata;
  const summary = computeAssetSummary(connectedMydata);
  const yearsToRetirement = nationalPension.paymentStartAge - CURRENT_AGE;

  const scoreBars = SCORE_BAR_CATEGORIES.map(({ category, label }) => {
    const question = questions.find((q) => q.category === category);
    if (!question) return { label, percent: 0 };
    const selectedOrder = answers[question.id] ?? 0;
    const maxOrder = Math.max(...question.options.map((option) => option.order));
    const percent = maxOrder === 0 ? 0 : Math.round((selectedOrder / maxOrder) * 100);
    return { label, percent };
  });

  const monthlyShortfall = Math.max(TARGET_MONTHLY_LIVING_COST - summary.expectedMonthlyPension, 0);
  const inflatedMonthlyShortfall = monthlyShortfall * Math.pow(1 + INFLATION_RATE, yearsToRetirement);
  const totalShortfallNeeded = inflatedMonthlyShortfall * 12 * 20; // 은퇴 후 20년치, 할인 없이 단순 합산(임시 방식)

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-[#FAFAF7] px-6 pt-6 pb-10">
      <ReportHeader />

      <Section title="고객 기본 정보">
        <InfoRow label="이름" value={PERSONA.name} />
        <InfoRow label="나이" value={`만 ${CURRENT_AGE}세 (${PERSONA.birthYear}년생)`} />
        <InfoRow label="연봉(세전)" value={formatManwon(PERSONA.annualSalaryPreTax)} />
        <InfoRow label="월급(세후)" value={formatManwon(connectedMydata.bankTransaction.monthlyIncome)} />
        <InfoRow label="투자 경험" value={PERSONA.investmentExperienceLabel} />
        <InfoRow label="위험 허용도" value={`${profile.officialName} ${profile.grade}등급`} />
        <InfoRow label="직업" value={PERSONA.job} />
      </Section>

      <Section title={`투자성향 점수 (총 ${profile.totalScore}점 / ${profile.officialName} ${profile.grade}등급)`}>
        <div className="flex flex-col gap-3">
          {scoreBars.map((bar) => (
            <ScoreBar key={bar.label} label={bar.label} percent={bar.percent} />
          ))}
        </div>
      </Section>

      <Section title="자산·연금 현황">
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="총자산" value={formatManwon(summary.totalAssets)} />
          <MiniStat label="예상 월 연금" value={formatManwon(summary.expectedMonthlyPension)} />
          <MiniStat label="국민연금" value={`${formatManwon(nationalPension.estimatedMonthlyAmount)}/월`} />
          <MiniStat label="퇴직연금(DC, 추정)" value={`${formatManwon(summary.retirementMonthlyEstimate)}/월`} />
        </div>
        <div className="mt-3 rounded-xl bg-[#F0F0EC] px-3 py-2.5 text-xs text-[#6B7280]">
          개인연금(IRP·연금저축) {formatManwon(summary.personalPensionBalance)} · 본인 납입{' '}
          {formatManwon(PERSONA.personalContributionBySelf)}
        </div>
      </Section>

      <Section title="노후 부족 자금 분석">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">목표 생활비(월)</span>
          <span className="font-bold text-[#1A1A2E]">{formatManwon(TARGET_MONTHLY_LIVING_COST)}</span>
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">20대 후반 평균 기준 · 65세 은퇴 기준</p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <div className="flex-1 rounded-xl bg-[#F0F0EC] px-3 py-2.5 text-center">
            <div className="text-[#6B7280]">목표 생활비</div>
            <div className="mt-1 font-bold text-[#1A1A2E]">{formatManwon(TARGET_MONTHLY_LIVING_COST)}</div>
          </div>
          <span className="text-[#6B7280]">−</span>
          <div className="flex-1 rounded-xl bg-[#F0F0EC] px-3 py-2.5 text-center">
            <div className="text-[#6B7280]">예상 연금</div>
            <div className="mt-1 font-bold text-[#1A1A2E]">{formatManwon(summary.expectedMonthlyPension)}</div>
          </div>
          <span className="text-[#6B7280]">=</span>
          <div className="flex-1 rounded-xl bg-[#FFF1F0] px-3 py-2.5 text-center">
            <div className="text-[#BB4D00]">월 부족</div>
            <div className="mt-1 font-bold text-[#BB4D00]">{formatManwon(monthlyShortfall)}</div>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-[#FFFBEB] px-4 py-3.5 text-center">
          <p className="text-[11px] text-[#BB4D00]">65세까지 준비 필요 총액 (물가상승률 {INFLATION_RATE * 100}% 반영)</p>
          <p className="mt-1 text-xl font-bold text-[#BB4D00]">약 {formatEok(totalShortfallNeeded)}원</p>
        </div>
      </Section>
    </div>
  );
}

function ReportHeader() {
  const [toast, setToast] = useState<string | null>(null);

  function showComingSoon(feature: string) {
    setToast(`${feature} 기능은 아직 준비 중이에요`);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#1A1A2E]">리포트 미리보기</h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 rounded-xl bg-[#2A78D6] px-3 py-2 text-xs font-bold text-white"
            onClick={() => showComingSoon('PDF 저장')}
          >
            ⬇ PDF 저장
          </button>
          <button
            className="flex items-center gap-1 rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold text-[#1A1A2E]"
            onClick={() => showComingSoon('공유')}
          >
            공유
          </button>
        </div>
      </div>
      {toast && <p className="text-[11px] text-[#6B7280]">{toast}</p>}
      <div className="flex items-center gap-2 rounded-2xl bg-[#1A1A2E] px-4 py-3">
        <span aria-hidden="true">🏦</span>
        <span className="text-xs font-bold text-white">은행 상담 담당자용 요약 자료</span>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <h2 className="text-sm font-medium text-[#1A1A2E]">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/8 py-2 text-xs last:border-b-0">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-bold text-[#1A1A2E]">{value}</span>
    </div>
  );
}

function ScoreBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#6B7280]">{label}</span>
        <span className="font-bold text-[#1A1A2E]">{percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-[#F0F0EC]">
        <div className="h-1.5 rounded-full bg-[#2A78D6]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F0F0EC] px-3 py-2.5">
      <div className="text-[11px] text-[#6B7280]">{label}</div>
      <div className="mt-1 text-sm font-bold text-[#1A1A2E]">{value}</div>
    </div>
  );
}
