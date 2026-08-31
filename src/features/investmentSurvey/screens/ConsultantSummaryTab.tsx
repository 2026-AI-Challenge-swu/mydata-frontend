import { useState } from 'react';
import { useConnectionStore } from '../../mydata/stores/connectionStore';
import {
  ASSUMED_ANNUAL_RETURN_RATE,
  CURRENT_AGE,
  computeAssetSummary,
  formatManwon,
  getConnectedMydata,
} from '../../mydata/utils/assetSummary';
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
// 연금저축·IRP 세액공제 한도(2023년 개정 세법 기준). 합산 연 900만원까지, 총급여 5,500만원 이하 구간 공제율 16.5%.
// AssetOverviewScreen의 PENSION_TAX_DEDUCTION_LIMIT/RATE와 동일한 계산(900만원 × 16.5% = 148.5만원).
const MAX_ANNUAL_TAX_SAVING = 1_485_000;

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

function calculateFutureAssetValue({
  currentTotal,
  monthlyExtraContribution,
  years,
}: {
  currentTotal: number;
  monthlyExtraContribution: number;
  years: number;
}) {
  const monthlyRate = ASSUMED_ANNUAL_RETURN_RATE / 12;
  const months = years * 12;

  const futureValueOfCurrent = currentTotal * Math.pow(1 + ASSUMED_ANNUAL_RETURN_RATE, years);
  const futureValueOfContributions =
    monthlyExtraContribution === 0
      ? 0
      : monthlyExtraContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return futureValueOfCurrent + futureValueOfContributions;
}

function formatEok(won: number) {
  return `${(won / 100_000_000).toFixed(1)}억`;
}

// formatManwon과 달리 소수점 첫째 자리까지 보존(세액공제 한도처럼 148.5만원 같은 반올림 안 되는 값용)
function formatManwonPrecise(won: number) {
  return `${(won / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원`;
}

export function ConsultantSummaryTab({ profile, questions, answers, connected }: ConsultantSummaryTabProps) {
  const items = useConnectionStore((state) => state.items);
  const [memo, setMemo] = useState('');
  const [memoSavedAt, setMemoSavedAt] = useState<Date | null>(null);

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

  const scenarios = [
    { label: '현재 유지', monthlyExtra: 0 },
    { label: '+20만/월', monthlyExtra: 200_000 },
    { label: '+40만/월', monthlyExtra: 400_000 },
  ].map((scenario) => ({
    ...scenario,
    futureValue: calculateFutureAssetValue({
      currentTotal: summary.totalAssets,
      monthlyExtraContribution: scenario.monthlyExtra,
      years: yearsToRetirement,
    }),
  }));

  const currentAnnualTaxSaving = PERSONA.personalContributionBySelf > 0 ? MAX_ANNUAL_TAX_SAVING : 0;
  const additionalAnnualTaxSaving = MAX_ANNUAL_TAX_SAVING - currentAnnualTaxSaving;

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
        <p className="mt-1 text-[11px] text-[#6B7280]">
          20대 후반 평균 기준 · 65세 은퇴 기준
        </p>
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

      <RecommendedPortfolioSection />

      <Section title="절세 효과 분석">
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="현재 세액공제" value={formatManwon(currentAnnualTaxSaving)} sub="본인 납입 기준" />
          <MiniStat
            label="추천 설계 시"
            value={formatManwonPrecise(MAX_ANNUAL_TAX_SAVING)}
            sub="연간"
            valueClassName="text-[#2A78D6]"
          />
        </div>
        <div className="mt-3 rounded-2xl bg-[#EBF3FF] px-4 py-3.5 text-center">
          <p className="text-[11px] text-[#2A78D6]">연간 절세 증가</p>
          <p className="mt-1 text-xl font-bold text-[#2A78D6]">+{formatManwonPrecise(additionalAnnualTaxSaving)}</p>
          <p className="mt-1 text-[11px] text-[#6B7280]">
            10년 누적 약 {formatManwon(additionalAnnualTaxSaving * 10)} 절세
          </p>
        </div>
      </Section>

      <Section title="미래 자산 시뮬레이션">
        <p className="text-[11px] text-[#6B7280]">65세까지 시나리오별 예상 (연 {ASSUMED_ANNUAL_RETURN_RATE * 100}% 수익률 가정)</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {scenarios.map((scenario) => (
            <div key={scenario.label} className="rounded-xl bg-[#F0F0EC] px-2 py-2.5 text-center">
              <div className="text-[11px] text-[#6B7280]">{scenario.label}</div>
              <div className="mt-1 text-sm font-bold text-[#1A1A2E]">{formatEok(scenario.futureValue)}</div>
            </div>
          ))}
        </div>
        <FutureAssetChart currentTotal={summary.totalAssets} yearsToRetirement={yearsToRetirement} />
      </Section>

      <AiSummarySection />
      <RoadmapSection />
      <ConsultingPointsSection />
      <RecommendedProductsSection />

      <Section title="상담 메모">
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="상담 시 특이사항이나 고객 요청사항을 입력해주세요..."
          className="min-h-[90px] w-full resize-none rounded-xl border border-black/8 bg-white p-3 text-xs text-[#1A1A2E] outline-none placeholder:text-[#9CA3AF]"
        />
        <button
          className="mt-3 w-full rounded-2xl border border-[#2A78D6] py-3 text-sm font-bold text-[#2A78D6]"
          onClick={() => setMemoSavedAt(new Date())}
        >
          메모 저장
        </button>
        {memoSavedAt && (
          <p className="mt-2 text-center text-[11px] text-[#6B7280]">
            {memoSavedAt.toLocaleTimeString()}에 이 브라우저에만 임시 저장됨 (서버 저장은 아직 미구현)
          </p>
        )}
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

function MiniStat({
  label,
  value,
  sub,
  valueClassName = 'text-[#1A1A2E]',
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-[#F0F0EC] px-3 py-2.5">
      <div className="text-[11px] text-[#6B7280]">{label}</div>
      <div className={`mt-1 text-sm font-bold ${valueClassName}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-[#6B7280]">{sub}</div>}
    </div>
  );
}

// 안정추구형 2등급 페르소나 기준 고정 추천값 — 실제 AI 추천 로직이 아니라 데모용 정적 콘텐츠.
const RECOMMENDED_PORTFOLIO = [
  { label: 'IRP(개인연금)', percent: 40, color: '#8B5CF6' },
  { label: '연금저축ETF', percent: 30, color: '#2A78D6' },
  { label: '채권형 ETF', percent: 20, color: '#06B6D4' },
  { label: '현금성 자산', percent: 10, color: '#1FAB6A' },
];

function RecommendedPortfolioSection() {
  const circumference = 100;
  const arcs = RECOMMENDED_PORTFOLIO.reduce<{ slice: (typeof RECOMMENDED_PORTFOLIO)[number]; cumulative: number }[]>(
    (acc, slice) => {
      const cumulative = acc.length === 0 ? 0 : acc[acc.length - 1].cumulative + acc[acc.length - 1].slice.percent;
      return [...acc, { slice, cumulative }];
    },
    [],
  );

  return (
    <Section title="AI 추천 포트폴리오 (안정추구형 기준)">
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 42 42" className="h-24 w-24 shrink-0 rotate-180">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#FFFFFF" strokeWidth="8" />
          {arcs.map(({ slice, cumulative }) => {
            const visible = Math.max(slice.percent - 1, 0);
            return (
              <circle
                key={slice.label}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={slice.color}
                strokeWidth="8"
                strokeDasharray={`${visible} ${circumference - visible}`}
                strokeDashoffset={circumference - cumulative}
              />
            );
          })}
        </svg>
        <ul className="flex flex-1 flex-col gap-1.5">
          {RECOMMENDED_PORTFOLIO.map((slice) => (
            <li key={slice.label} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-[#1A1A2E]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden="true" />
                {slice.label}
              </span>
              <span className="font-bold text-[#1A1A2E]">{slice.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-[11px] text-[#1A1A2E]">
        <li>✅ 세액공제 한도 내 우선 납입</li>
        <li>✅ 장기 분산 투자로 복리 극대화</li>
        <li>✅ 연 1회 리밸런싱 원칙</li>
      </ul>
    </Section>
  );
}

function FutureAssetChart({ currentTotal, yearsToRetirement }: { currentTotal: number; yearsToRetirement: number }) {
  const width = 300;
  const height = 120;
  const points: { x: number; y: number }[] = [];
  const maxValue = calculateFutureAssetValue({ currentTotal, monthlyExtraContribution: 0, years: yearsToRetirement });

  for (let year = 0; year <= yearsToRetirement; year += Math.max(1, Math.round(yearsToRetirement / 6))) {
    const value = calculateFutureAssetValue({ currentTotal, monthlyExtraContribution: 0, years: year });
    points.push({
      x: (year / yearsToRetirement) * width,
      y: height - (value / maxValue) * height,
    });
  }

  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <path d={pathData} fill="none" stroke="#1FAB6A" strokeWidth="2" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[#6B7280]">
        <span>{CURRENT_AGE}세</span>
        <span>{CURRENT_AGE + yearsToRetirement}세</span>
      </div>
    </div>
  );
}

// 아래 3개 섹션은 안정추구형 2등급 페르소나 기준 고정 문구(실제 AI 생성 텍스트 아님) — 데모 범위.
function AiSummarySection() {
  return (
    <Section title="🤖 AI 종합 의견">
      <p className="text-xs leading-[1.6] text-[#1A1A2E]">
        10문항 진단 총점 {19}점 → 안정추구형 2등급. 손실 감내도 낮음·투자 경험 부족·단기 유동성 필요 3개 요인이
        복합 반영. 개인연금 미가입 확인됨. 우선 연금저축계좌 개설 → 세액공제 최대화 → DC형 운용전략 채권형 전환
        순서로 상담 진행 권고.
      </p>
    </Section>
  );
}

const ROADMAP_STEPS = [
  { when: '이번 달', what: '연금저축계좌 개설' },
  { when: '다음 달', what: '월 20만원 자동이체 설정' },
  { when: '3개월 후', what: '퇴직연금 DC형 운용전략 변경' },
  { when: '1년 후', what: '포트폴리오 리밸런싱 점검' },
  { when: '매년', what: '세액공제 한도 확인 및 조정' },
];

function RoadmapSection() {
  return (
    <Section title="실행 로드맵">
      <ol className="flex flex-col gap-3">
        {ROADMAP_STEPS.map((step) => (
          <li key={step.when} className="flex items-start gap-2.5">
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#2A78D6]" aria-hidden="true" />
            <p className="text-xs text-[#1A1A2E]">
              <span className="font-bold text-[#2A78D6]">{step.when}</span> {step.what}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const CONSULTING_POINTS = [
  '계획형 성향 — 목표금액 시뮬레이션이 효과적',
  'DC형 자기운용 가능 — 운용전략 변경 상담',
  '위험 허용 낮음 — 원리금보장+채권형 혼합 제안',
];

function ConsultingPointsSection() {
  return (
    <Section title="상담 포인트">
      <ul className="flex flex-col gap-2">
        {CONSULTING_POINTS.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs text-[#1A1A2E]">
            <span aria-hidden="true">⚠️</span>
            {point}
          </li>
        ))}
      </ul>
    </Section>
  );
}

const RECOMMENDED_PRODUCTS = ['안정형 TDF', '채권형 펀드', '연금저축펀드(안정형)', 'IRP(채권 비중↑)'];

function RecommendedProductsSection() {
  return (
    <Section title="추천 상품 후보">
      <ul className="flex flex-col gap-1.5">
        {RECOMMENDED_PRODUCTS.map((product) => (
          <li key={product} className="flex items-center gap-2 text-xs text-[#1A1A2E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A78D6]" aria-hidden="true" />
            {product}
          </li>
        ))}
      </ul>
    </Section>
  );
}
