import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiAvatarIcon, AlertCircleIcon, BankIcon, DownloadIcon, HomeIcon, ShareIcon } from '../components/icons';
import { analyzeTaxSaving, type TaxSavingAnalysisResponse } from '../api/taxSavingApi';
import { analyzeReport, type ReportAnalysisResponse } from '../api/reportApi';
import { useConnectionStore } from '../../mydata/stores/connectionStore';
import {
  ASSUMED_ANNUAL_RETURN_RATE,
  CURRENT_AGE,
  PENSION_PAYOUT_YEARS,
  calculateRetirementMonthlyPension,
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
  investmentExperienceLabel: '1~3년',
  // 추천 포트폴리오 배분표가 성별별로 갈리는데 마이데이터/설문에 성별 필드가 없어 이름(김민준)으로 추정한 상수값.
  gender: '남' as const,
  // 정의서 확정표: "본인 납입액 0원, 데이터출처 퇴직연금사 연동 — 자동". mock의 employee_amt(430만원)는
  // 이 확정값과 어긋나는 목데이터 쪽 오류라 판단, employee_amt 대신 이 확정 상수를 사용.
  personalContributionBySelf: 0,
};

// "목표 생활비"는 정의서에 국민연금연구원 통계 기본값으로 명시된 페르소나 상수값.
const TARGET_MONTHLY_LIVING_COST = 2_500_000;
// 부족 자금 계산에 적용하는 물가상승률 가정(정의서 S4-08 이슈#7 확정: 91만원×12개월×20년×(1.025)^36년 방식, 기획팀 검증 완료).
const INFLATION_RATE = 0.025;

// 투자성향 점수 5개 막대의 카테고리 매핑. 서버는 총점만 주기 때문에,
// 문항 카테고리+선택한 보기 순서(order == 배점)로 클라이언트에서 직접 계산함.
// %로 바꾸는 공식(선택값/만점)이 정의서에 없어서 임시로 넣은 값 — 기획 확인 필요.
const SCORE_BAR_CATEGORIES: { category: string; label: string; color: string }[] = [
  { category: '투자 경험', label: '투자 경험', color: '#E85D4A' },
  { category: '손실 감내(변동성)', label: '손실 감내도', color: '#7C3AED' },
  { category: '투자 기간', label: '투자 기간', color: '#EA8C00' },
  { category: '수익 추구 성향', label: '수익 추구도', color: '#2A78D6' },
  { category: '소득 안정성', label: '소득 안정성', color: '#1FAB6A' },
];

// 미래 자산 시뮬레이션 3개 시나리오 박스 색상(현재 유지/+20만/+40만 순서, Figma 확인값).
const SCENARIO_COLORS = ['#9CA3AF', '#2196F3', '#1FAB6A'];

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
  const [job, setJob] = useState(PERSONA.job);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [goalLivingCost, setGoalLivingCost] = useState(TARGET_MONTHLY_LIVING_COST);
  const [retirementAge, setRetirementAge] = useState(65);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [draftGoalManwon, setDraftGoalManwon] = useState(TARGET_MONTHLY_LIVING_COST / 10_000);
  const [draftRetirementAge, setDraftRetirementAge] = useState(65);
  const [taxSaving, setTaxSaving] = useState<TaxSavingAnalysisResponse | null>(null);
  const connectedMydata = getConnectedMydata(items);
  const personalPension = connectedMydata?.personalPension;

  // 절세효과 분석은 백엔드 /api/tax-saving/analysis(hyojin 구현)를 그대로 호출 — 프론트에서 재계산하지 않음.
  // IRP/연금저축은 세액공제 한도가 달라서(연금저축 단독 600만원, 합산 900만원) 계좌 리스트에서 accountType으로
  // 각각 구분해서 전달 — 연금저축 계좌가 없으면 자연히 0원(가정이 아니라 실제로 계좌가 없어서 0).
  // 개인연금(IRP) 본인 납입액은 정의서 확정값(0원, PERSONA.personalContributionBySelf)을 그대로 전달 —
  // mock의 employee_amt(누적값)는 "이번 해 납입액"과는 다른 개념이라 사용하지 않음.
  const irpAccount = personalPension?.accounts.find((account) => account.accountType === 'IRP');
  const pensionSavingsAccount = personalPension?.accounts.find(
    (account) => account.accountType === 'PENSION_SAVINGS',
  );

  useEffect(() => {
    if (!irpAccount) return;
    analyzeTaxSaving({
      totalSalary: PERSONA.annualSalaryPreTax,
      pensionSavingsAccumAmt: pensionSavingsAccount?.employeeContribution ?? 0,
      pensionSavingsIssueDate: pensionSavingsAccount?.issueDate ?? irpAccount.issueDate,
      personalPensionEmployeeAmt: PERSONA.personalContributionBySelf,
      personalPensionIssueDate: irpAccount.issueDate,
    })
      .then(setTaxSaving)
      .catch(() => setTaxSaving(null));
  }, [irpAccount?.issueDate, pensionSavingsAccount?.employeeContribution, pensionSavingsAccount?.issueDate]);

  const [report, setReport] = useState<ReportAnalysisResponse | null>(null);

  // "AI 종합 의견"/"실행 로드맵"/"상담 포인트"는 백엔드 /api/report(hyojin 구현, 외부 AI 리포트 생성 서비스 프록시)를
  // 호출해서 받아옴. 외부 서비스가 꺼져있으면 502가 나므로 그 경우 report는 null로 두고 기존 데모 문구로 폴백.
  useEffect(() => {
    if (!connectedMydata) return;
    const reportSummary = computeAssetSummary(connectedMydata);
    const ageBand = getAgeBand(CURRENT_AGE);
    const allocationPlan = PORTFOLIO_ALLOCATION_PLAN[profile.grade] ?? PORTFOLIO_ALLOCATION_PLAN[3];
    const allocation = allocationPlan.byAgeGender[ageBand][PERSONA.gender];
    const portfolio = ALLOCATION_CATEGORY_META.map((meta) => ({
      category: meta.label,
      weightPercent: allocation[meta.key],
    })).filter((item) => item.weightPercent > 0);

    const yearsToTarget = retirementAge - CURRENT_AGE;
    const expectedAssetAtRetirement = calculateFutureAssetValue({
      currentTotal: reportSummary.totalAssets,
      monthlyExtraContribution: 0,
      years: yearsToTarget,
    });
    // "20년 후 자산 증가액" 정의가 정의서에 없어 순수 복리 증식분(20년 후 미래가치 − 현재 총자산)으로 임시 구현.
    const assetAfter20Years = calculateFutureAssetValue({
      currentTotal: reportSummary.totalAssets,
      monthlyExtraContribution: 0,
      years: 20,
    });

    analyzeReport({
      userProfile: {
        totalScore: profile.totalScore,
        type: profile.type,
        grade: profile.grade,
        emoji: profile.emoji,
        officialName: profile.officialName,
        nickname: profile.nickname,
        description: profile.description,
      },
      portfolio,
      retirementPlan: {
        monthlyContribution: connectedMydata.bankTransaction.monthlyInvestment,
        currentAge: CURRENT_AGE,
        targetAge: retirementAge,
        expectedReturnRate: ASSUMED_ANNUAL_RETURN_RATE,
        totalContribution: connectedMydata.retirementPension.balance + connectedMydata.personalPension.totalContribution,
        expectedProfit: Math.max(expectedAssetAtRetirement - reportSummary.totalAssets, 0),
        taxBenefit: taxSaving?.recommendedDeductionAmount ?? 0,
        expectedAssetAtRetirement,
      },
      metrics: {
        annualTaxBenefit: taxSaving?.recommendedDeductionAmount ?? 0,
        assetAt65: expectedAssetAtRetirement,
        assetIncreaseAfter20Years: Math.max(assetAfter20Years - reportSummary.totalAssets, 0),
        cumulativeTaxBenefit: (taxSaving?.increaseAmount ?? 0) * 10,
      },
    })
      .then(setReport)
      .catch(() => setReport(null));
  }, [
    connectedMydata?.retirementPension.balance,
    connectedMydata?.bankTransaction.monthlyInvestment,
    connectedMydata?.personalPension.totalContribution,
    retirementAge,
    profile.grade,
    profile.totalScore,
    taxSaving,
  ]);

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

  if (!connectedMydata) {
    return null;
  }

  const { nationalPension, retirementPension, bankTransaction } = connectedMydata;
  const summary = computeAssetSummary(connectedMydata);
  const yearsToRetirement = nationalPension.paymentStartAge - CURRENT_AGE;

  // "노후 부족 자금 분석" 카드의 수정 팝업(목표생활비/희망은퇴나이)에 따른 what-if 재계산.
  // 다른 섹션(자산 현황, 미래 자산 시뮬레이션 등)의 기준값에는 영향을 주지 않도록 이 카드 전용 변수로 분리.
  const goalYearsToRetirement = retirementAge - CURRENT_AGE;
  const goalRetirementMonthlyEstimate = calculateRetirementMonthlyPension({
    currentBalance: retirementPension.balance,
    annualContribution: bankTransaction.monthlyIncome,
    retirementAge,
  });
  const goalExpectedMonthlyPension = nationalPension.estimatedMonthlyAmount + goalRetirementMonthlyEstimate;
  const goalMonthlyShortfall = Math.max(goalLivingCost - goalExpectedMonthlyPension, 0);
  const goalInflatedMonthlyShortfall =
    goalMonthlyShortfall * Math.pow(1 + INFLATION_RATE, goalYearsToRetirement);
  // 은퇴 후 20년(65~85세)치 생활비, 할인 없이 단순 합산 — 정의서 S4-08 이슈#7 확정 방식.
  const goalTotalShortfallNeeded = goalInflatedMonthlyShortfall * 12 * PENSION_PAYOUT_YEARS;

  const scoreBars = SCORE_BAR_CATEGORIES.map(({ category, label, color }) => {
    const question = questions.find((q) => q.category === category);
    if (!question) return { label, percent: 0, color };
    const selectedOrder = answers[question.id] ?? 0;
    const maxOrder = Math.max(...question.options.map((option) => option.order));
    const percent = maxOrder === 0 ? 0 : Math.round((selectedOrder / maxOrder) * 100);
    return { label, percent, color };
  });

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

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#FAFAF7] px-6 pt-6 pb-10">
      <ReportHeader />

      <Section title="고객 기본 정보">
        <InfoRow label="이름" value={PERSONA.name} />
        <InfoRow label="나이" value={`만 ${CURRENT_AGE}세 (${PERSONA.birthYear}년생)`} />
        <InfoRow label="연봉(세전)" value={formatManwon(PERSONA.annualSalaryPreTax)} />
        <InfoRow label="월급(세후)" value={formatManwon(connectedMydata.bankTransaction.monthlyIncome)} />
        <InfoRow label="투자 경험" value={PERSONA.investmentExperienceLabel} />
        <InfoRow label="위험 허용도" value={`${profile.officialName} ${profile.grade}등급`} />
        <JobRow
          job={job}
          isEditing={isEditingJob}
          onEdit={() => setIsEditingJob(true)}
          onSave={(value) => {
            setJob(value);
            setIsEditingJob(false);
          }}
        />
      </Section>

      <Section title="투자성향 점수" badge={`총 ${profile.totalScore}점 / ${profile.officialName} ${profile.grade}등급`}>
        <div className="flex flex-col gap-3">
          {scoreBars.map((bar) => (
            <ScoreBar key={bar.label} label={bar.label} percent={bar.percent} color={bar.color} />
          ))}
        </div>
      </Section>

      <Section title="자산·연금 현황">
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="총자산" value={formatManwon(summary.totalAssets)} />
          <MiniStat label="예상 월 연금" value={formatManwon(summary.expectedMonthlyPension)} />
          <MiniStat label="국민연금" value={`${formatManwon(nationalPension.estimatedMonthlyAmount)}/월`} />
          <MiniStat label="퇴직연금(DC)" value={`${formatManwon(summary.retirementMonthlyEstimate)}/월(추정)`} />
        </div>
        <div className="mt-3 rounded-xl bg-[#F0F0EC] px-3 py-2">
          <div className="text-[10px] leading-[15px] text-[#6B7280]">개인연금 (IRP·연금저축)</div>
          <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#1A1A2E]">
            {formatManwon(summary.personalPensionBalance)} (본인 납입 {PERSONA.personalContributionBySelf}원)
          </div>
        </div>
      </Section>

      <Section title="노후 부족 자금 분석">
        <div className="text-[11px] leading-[16.5px] text-[#6B7280]">목표 생활비</div>
        <div className="flex items-center gap-2">
          <span className="text-[18px] leading-[27px] font-extrabold text-[#1A1A2E]">
            월 {formatManwon(goalLivingCost)}
          </span>
          <button
            type="button"
            className="text-[11px] leading-[16.5px] font-medium text-[#2A78D6]"
            onClick={() => {
              setDraftGoalManwon(goalLivingCost / 10_000);
              setDraftRetirementAge(retirementAge);
              setIsEditingGoal(true);
            }}
          >
            ✏️ 수정
          </button>
        </div>
        <p className="text-[11px] leading-[16.5px] text-[#6B7280]">
          20대 후반 평균 기준 · {retirementAge}세 은퇴 기준
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex-1 rounded-xl bg-[#F0F0EC] py-2 text-center">
            <div className="text-[10px] leading-[15px] text-[#6B7280]">목표 생활비</div>
            <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#1A1A2E]">
              {formatManwon(goalLivingCost)}
            </div>
          </div>
          <span className="text-[18px] leading-[28px] font-bold text-[#E85D4A]">−</span>
          <div className="flex-1 rounded-xl bg-[#F0F0EC] py-2 text-center">
            <div className="text-[10px] leading-[15px] text-[#6B7280]">예상 연금</div>
            <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#1A1A2E]">
              {formatManwon(goalExpectedMonthlyPension)}
            </div>
          </div>
          <span className="text-[18px] leading-[28px] font-bold text-[#E85D4A]">=</span>
          <div className="flex-1 rounded-xl bg-[#FEF2F2] py-2 text-center">
            <div className="text-[10px] leading-[15px] text-[#E85D4A]">월 부족</div>
            <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#E85D4A]">
              {formatManwon(goalMonthlyShortfall)}
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-center">
          <p className="text-[11px] leading-[16.5px] text-[#6B7280]">{retirementAge}세까지 준비 필요 금액</p>
          <p className="text-[22px] leading-[33px] font-extrabold text-[#E85D4A]">
            약 {formatEok(goalTotalShortfallNeeded)}원
          </p>
          <p className="text-[10px] leading-[15px] text-[#6B7280]">
            물가상승률 {INFLATION_RATE * 100}% 반영
          </p>
        </div>
      </Section>

      {isEditingGoal && (
        <GoalEditModal
          goalManwon={draftGoalManwon}
          retirementAge={draftRetirementAge}
          onChangeGoalManwon={setDraftGoalManwon}
          onChangeRetirementAge={setDraftRetirementAge}
          onCancel={() => setIsEditingGoal(false)}
          onApply={() => {
            setGoalLivingCost(Math.max(0, Math.round(draftGoalManwon)) * 10_000);
            setRetirementAge(draftRetirementAge);
            setIsEditingGoal(false);
          }}
        />
      )}

      <RecommendedPortfolioSection grade={profile.grade} officialName={profile.officialName} />

      <Section title="절세 효과 분석">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F0F0EC] p-3 text-center">
            <p className="text-[10px] leading-[15px] text-[#6B7280]">현재 세액공제</p>
            <p className="text-[18px] leading-[27px] font-extrabold text-[#6B7280]">
              {taxSaving?.currentDeductionAmount ? formatManwon(taxSaving.currentDeductionAmount) : '0원'}
            </p>
            <p className="text-[10px] leading-[15px] text-[#6B7280]">본인 납입 없음</p>
          </div>
          <div className="rounded-2xl bg-[#EBF3FF] p-3 text-center">
            <p className="text-[10px] leading-[15px] text-[#2A78D6]">추천 설계 시</p>
            <p className="text-[18px] leading-[27px] font-extrabold text-[#2A78D6]">
              {formatManwonPrecise(taxSaving?.recommendedDeductionAmount ?? 0)}
            </p>
            <p className="text-[10px] leading-[15px] text-[#2A78D6]">연간</p>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-[#EBF3FF] py-3 text-center">
          <p className="text-[11px] leading-[16.5px] text-[#6B7280]">연간 절세 증가</p>
          <p className="text-[26px] leading-[39px] font-extrabold text-[#2A78D6]">
            +{formatManwonPrecise(taxSaving?.increaseAmount ?? 0)}
          </p>
          <p className="text-[10px] leading-[15px] text-[#6B7280]">
            10년 누적 약 {formatManwon((taxSaving?.increaseAmount ?? 0) * 10)} 절세
          </p>
        </div>
      </Section>

      <Section title="미래 자산 시뮬레이션">
        {/* Section 기본 mt-3(12px)보다 좁게 — Figma는 타이틀에 훨씬 더 가까이 붙어있음. */}
        <p className="-mt-2 text-[12px] leading-[18px] text-[#6B7280]">65세까지 시나리오별 예상</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {scenarios.map((scenario, index) => (
            <div key={scenario.label} className="rounded-xl bg-[#F0F0EC] py-2 text-center">
              <div className="text-[10px] leading-[15px] text-[#6B7280]">{scenario.label}</div>
              <div
                className="text-[13px] leading-[19.5px] font-extrabold"
                style={{ color: SCENARIO_COLORS[index] }}
              >
                {formatEok(scenario.futureValue)}
              </div>
            </div>
          ))}
        </div>
        <FutureAssetChart currentTotal={summary.totalAssets} yearsToRetirement={yearsToRetirement} />
      </Section>

      <AiSummarySection totalComment={report?.total_comment} />
      <RoadmapSection roadMap={report?.road_map} />
      <ConsultingPointsSection counsellingPoints={report?.counselling_points} />
      <RecommendedProductsSection />

      <Section title={<span className="font-bold">상담 메모</span>}>
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="상담 시 특이사항이나 고객 요청사항을 입력해주세요..."
          className="min-h-[96px] w-full resize-none rounded-xl border border-black/8 bg-[#F0F0EC] px-3 py-2.5 text-[13px] leading-[19.5px] text-[#1A1A2E] outline-none placeholder:text-[#6B7280]/60"
        />
        <button
          className="mt-3 w-full rounded-xl border border-[#2A78D6] py-2.5 text-[13px] leading-[19.5px] font-bold text-[#2A78D6]"
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
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  function showComingSoon(feature: string) {
    setToast(`${feature} 기능은 아직 준비 중이에요`);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm leading-[21px] font-bold whitespace-nowrap text-[#1A1A2E]">리포트 미리보기</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="flex items-center gap-1.5 rounded-xl bg-[#2A78D6] px-4 py-2 text-[13px] font-bold whitespace-nowrap text-white"
            onClick={() => showComingSoon('PDF 저장')}
          >
            <DownloadIcon color="#FFFFFF" /> PDF 저장
          </button>
          <button
            className="flex items-center gap-1.5 rounded-xl border border-black/8 bg-white px-4 py-2 text-[13px] font-bold whitespace-nowrap text-[#1A1A2E]"
            onClick={() => showComingSoon('공유')}
          >
            <ShareIcon color="#1A1A2E" /> 공유
          </button>
          <button
            className="flex items-center justify-center gap-1.5 rounded-xl border border-black/8 bg-white px-4 py-2"
            onClick={() => navigate('/')}
            aria-label="처음으로"
          >
            <HomeIcon color="#000000" />
          </button>
        </div>
      </div>
      {toast && <p className="text-[11px] text-[#6B7280]">{toast}</p>}
      <div className="flex items-center gap-2.5 rounded-2xl bg-[#1A1A2E] px-4 py-3">
        <BankIcon color="#BEDBFF" />
        <span className="text-xs leading-[18px] font-normal text-[#BEDBFF]">은행 상담 담당자용 요약 자료</span>
      </div>
    </div>
  );
}

function Section({
  title,
  badge,
  children,
  contentClassName = 'mt-3',
}: {
  title: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm leading-[21px] font-medium text-[#1A1A2E]">{title}</h2>
        {badge && (
          <span className="rounded-full bg-[#EBF3FF] px-2.5 py-1 text-xs leading-[18px] font-bold text-[#2A78D6]">
            {badge}
          </span>
        )}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/8 py-2.5 text-[13px] leading-[19.5px]">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-medium text-[#1A1A2E]">{value}</span>
    </div>
  );
}

function JobRow({
  job,
  isEditing,
  onEdit,
  onSave,
}: {
  job: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(job);

  useEffect(() => {
    if (isEditing) setDraft(job);
  }, [isEditing, job]);

  function commit() {
    onSave(draft.trim() || job);
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-black/8 py-2.5 text-[13px] leading-[19.5px]">
        <span className="text-[#6B7280]">직업</span>
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="w-32 rounded-md border border-[#2A78D6] px-2 py-0.5 text-right text-[13px] font-medium text-[#1A1A2E] outline-none"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#1A1A2E]">{job}</span>
            <button
              onClick={onEdit}
              className="rounded border border-[#2A78D6]/30 bg-[#EBF3FF] px-1.5 py-0.5 text-[10px] leading-[15px] font-medium text-[#2A78D6]"
            >
              수정
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] leading-[15px] text-[#6B7280]">직업을 알려주면 더 정확한 추천이 가능해요</p>
    </div>
  );
}

const RETIREMENT_AGE_MIN = 60;
const RETIREMENT_AGE_MAX = 70;

function GoalEditModal({
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

        <label className="mt-4 block text-[12px] leading-[18px] font-bold text-[#1A1A2E]">
          희망 은퇴 나이
        </label>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onChangeRetirementAge(Math.max(RETIREMENT_AGE_MIN, retirementAge - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EC] text-xl font-bold text-[#1A1A2E]"
          >
            −
          </button>
          <span className="text-[24px] leading-[36px] font-extrabold text-[#2A78D6]">
            {retirementAge}세
          </span>
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

function ScoreBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs leading-[18px]">
        <span className="text-[#6B7280]">{label}</span>
        <span className="font-bold" style={{ color }}>
          {percent}%
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-[#F0F0EC]">
        <div className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
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
    <div className="rounded-xl bg-[#F0F0EC] px-3 py-2">
      <div className="text-[10px] leading-[15px] text-[#6B7280]">{label}</div>
      <div className={`mt-0.5 text-[13px] leading-[19.5px] font-bold ${valueClassName}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-[#6B7280]">{sub}</div>}
    </div>
  );
}

type AgeBand = '20-24' | '25-29' | '30-34' | '35-39';

interface AllocationRow {
  pensionSavingsStock: number;
  pensionSavingsBond: number;
  irpStock: number;
  irpBond: number;
  irpGuaranteed: number;
}

interface GradeAllocationPlan {
  phrases: string[];
  byAgeGender: Record<AgeBand, Record<'남' | '여', AllocationRow>>;
}

// 기획팀 정의 "투자성향 × 연령 × 성별 자산 배분 기준표"(룰 기반, AI 미사용). DC 기본안(원리금보장/채권형/주식형 비중)은
// 이 도넛차트 대상이 아니라 별도 관리 항목이라 미반영.
const PORTFOLIO_ALLOCATION_PLAN: Record<number, GradeAllocationPlan> = {
  1: {
    phrases: [
      '원리금보장형 상품 우선 편입',
      '연금저축은 채권형 상품 중심으로 운용',
      '시장 변동성이 커질 경우 자산배분 재점검',
    ],
    byAgeGender: {
      '20-24': {
        남: { pensionSavingsStock: 0, pensionSavingsBond: 25, irpStock: 0, irpBond: 20, irpGuaranteed: 55 },
        여: { pensionSavingsStock: 5, pensionSavingsBond: 25, irpStock: 0, irpBond: 15, irpGuaranteed: 55 },
      },
      '25-29': {
        남: { pensionSavingsStock: 0, pensionSavingsBond: 25, irpStock: 0, irpBond: 20, irpGuaranteed: 55 },
        여: { pensionSavingsStock: 5, pensionSavingsBond: 25, irpStock: 0, irpBond: 15, irpGuaranteed: 55 },
      },
      '30-34': {
        남: { pensionSavingsStock: 0, pensionSavingsBond: 20, irpStock: 0, irpBond: 20, irpGuaranteed: 60 },
        여: { pensionSavingsStock: 0, pensionSavingsBond: 20, irpStock: 0, irpBond: 20, irpGuaranteed: 60 },
      },
      '35-39': {
        남: { pensionSavingsStock: 0, pensionSavingsBond: 15, irpStock: 0, irpBond: 20, irpGuaranteed: 65 },
        여: { pensionSavingsStock: 0, pensionSavingsBond: 15, irpStock: 0, irpBond: 20, irpGuaranteed: 65 },
      },
    },
  },
  2: {
    phrases: [
      '연금저축 세액공제 한도 우선 활용',
      '채권형 상품으로 안정성을 확보하면서 주식형 상품 일부 편입',
      '연 1회 자산배분 점검',
    ],
    byAgeGender: {
      '20-24': {
        남: { pensionSavingsStock: 20, pensionSavingsBond: 25, irpStock: 10, irpBond: 20, irpGuaranteed: 25 },
        여: { pensionSavingsStock: 25, pensionSavingsBond: 25, irpStock: 15, irpBond: 20, irpGuaranteed: 15 },
      },
      '25-29': {
        남: { pensionSavingsStock: 15, pensionSavingsBond: 25, irpStock: 10, irpBond: 20, irpGuaranteed: 30 },
        여: { pensionSavingsStock: 20, pensionSavingsBond: 25, irpStock: 15, irpBond: 20, irpGuaranteed: 20 },
      },
      '30-34': {
        남: { pensionSavingsStock: 10, pensionSavingsBond: 25, irpStock: 10, irpBond: 25, irpGuaranteed: 30 },
        여: { pensionSavingsStock: 15, pensionSavingsBond: 25, irpStock: 10, irpBond: 25, irpGuaranteed: 25 },
      },
      '35-39': {
        남: { pensionSavingsStock: 10, pensionSavingsBond: 25, irpStock: 0, irpBond: 25, irpGuaranteed: 40 },
        여: { pensionSavingsStock: 10, pensionSavingsBond: 25, irpStock: 0, irpBond: 25, irpGuaranteed: 40 },
      },
    },
  },
  3: {
    phrases: [
      'TDF 등을 활용해 장기적인 자산배분 관리',
      '국내·해외 주식 및 채권 분산',
      '시장 상황에 따라 정기적으로 리밸런싱',
    ],
    byAgeGender: {
      '20-24': {
        남: { pensionSavingsStock: 35, pensionSavingsBond: 20, irpStock: 20, irpBond: 15, irpGuaranteed: 10 },
        여: { pensionSavingsStock: 40, pensionSavingsBond: 20, irpStock: 20, irpBond: 15, irpGuaranteed: 5 },
      },
      '25-29': {
        남: { pensionSavingsStock: 30, pensionSavingsBond: 20, irpStock: 20, irpBond: 20, irpGuaranteed: 10 },
        여: { pensionSavingsStock: 35, pensionSavingsBond: 20, irpStock: 20, irpBond: 20, irpGuaranteed: 5 },
      },
      '30-34': {
        남: { pensionSavingsStock: 25, pensionSavingsBond: 20, irpStock: 15, irpBond: 20, irpGuaranteed: 20 },
        여: { pensionSavingsStock: 30, pensionSavingsBond: 20, irpStock: 20, irpBond: 20, irpGuaranteed: 10 },
      },
      '35-39': {
        남: { pensionSavingsStock: 20, pensionSavingsBond: 20, irpStock: 15, irpBond: 25, irpGuaranteed: 20 },
        여: { pensionSavingsStock: 25, pensionSavingsBond: 20, irpStock: 15, irpBond: 25, irpGuaranteed: 15 },
      },
    },
  },
  4: {
    phrases: [
      '국내·해외 분산 ETF 중심으로 장기 투자',
      '반기 1회 이상 자산배분 점검',
      '단기 시장 변동성을 감당할 수 있는 경우 적합',
    ],
    byAgeGender: {
      '20-24': {
        남: { pensionSavingsStock: 45, pensionSavingsBond: 10, irpStock: 30, irpBond: 10, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 50, pensionSavingsBond: 10, irpStock: 30, irpBond: 10, irpGuaranteed: 0 },
      },
      '25-29': {
        남: { pensionSavingsStock: 40, pensionSavingsBond: 15, irpStock: 30, irpBond: 10, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 45, pensionSavingsBond: 15, irpStock: 30, irpBond: 10, irpGuaranteed: 0 },
      },
      '30-34': {
        남: { pensionSavingsStock: 35, pensionSavingsBond: 15, irpStock: 30, irpBond: 15, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 40, pensionSavingsBond: 15, irpStock: 30, irpBond: 15, irpGuaranteed: 0 },
      },
      '35-39': {
        남: { pensionSavingsStock: 30, pensionSavingsBond: 15, irpStock: 25, irpBond: 20, irpGuaranteed: 10 },
        여: { pensionSavingsStock: 35, pensionSavingsBond: 15, irpStock: 30, irpBond: 20, irpGuaranteed: 0 },
      },
    },
  },
  5: {
    phrases: [
      '국내·해외 주식형 ETF 중심의 장기 분산투자',
      '분기 1회 이상 포트폴리오 점검',
      '높은 단기 손실 가능성을 감내할 수 있는 투자자에게 적합',
    ],
    byAgeGender: {
      '20-24': {
        남: { pensionSavingsStock: 55, pensionSavingsBond: 0, irpStock: 35, irpBond: 5, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 60, pensionSavingsBond: 0, irpStock: 35, irpBond: 5, irpGuaranteed: 0 },
      },
      '25-29': {
        남: { pensionSavingsStock: 50, pensionSavingsBond: 5, irpStock: 35, irpBond: 5, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 55, pensionSavingsBond: 5, irpStock: 35, irpBond: 5, irpGuaranteed: 0 },
      },
      '30-34': {
        남: { pensionSavingsStock: 45, pensionSavingsBond: 10, irpStock: 35, irpBond: 5, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 50, pensionSavingsBond: 10, irpStock: 35, irpBond: 5, irpGuaranteed: 0 },
      },
      '35-39': {
        남: { pensionSavingsStock: 40, pensionSavingsBond: 10, irpStock: 35, irpBond: 10, irpGuaranteed: 5 },
        여: { pensionSavingsStock: 45, pensionSavingsBond: 10, irpStock: 35, irpBond: 10, irpGuaranteed: 0 },
      },
    },
  },
};

function getAgeBand(age: number): AgeBand {
  if (age <= 24) return '20-24';
  if (age <= 29) return '25-29';
  if (age <= 34) return '30-34';
  return '35-39';
}

const ALLOCATION_CATEGORY_META: { key: keyof AllocationRow; label: string }[] = [
  { key: 'pensionSavingsStock', label: '연금저축 주식' },
  { key: 'pensionSavingsBond', label: '연금저축 채권' },
  { key: 'irpStock', label: 'IRP 주식' },
  { key: 'irpBond', label: 'IRP 채권' },
  { key: 'irpGuaranteed', label: 'IRP 원리금보장' },
];

// 도넛차트 색상 — 카테고리별 고정색이 아니라 비중 순위에 따라 진한 파랑→연한 파랑 그라데이션(Figma 확인값).
const DONUT_COLOR_SCALE = ['#2A78D6', '#64A8EF', '#99C6F7', '#C4E0FF', '#E7F4FF'];

function RecommendedPortfolioSection({ grade, officialName }: { grade: number; officialName: string }) {
  const plan = PORTFOLIO_ALLOCATION_PLAN[grade] ?? PORTFOLIO_ALLOCATION_PLAN[3];
  const ageBand = getAgeBand(CURRENT_AGE);
  const allocation = plan.byAgeGender[ageBand][PERSONA.gender];

  const slices = ALLOCATION_CATEGORY_META.map((meta) => ({ ...meta, percent: allocation[meta.key] }))
    .filter((slice) => slice.percent > 0)
    .sort((a, b) => b.percent - a.percent) // 도넛차트는 비중 많은 순으로 그림.
    .map((slice, index) => ({ ...slice, color: DONUT_COLOR_SCALE[index] ?? DONUT_COLOR_SCALE[DONUT_COLOR_SCALE.length - 1] }));

  const circumference = 100;
  const arcs = slices.reduce<{ slice: (typeof slices)[number]; cumulative: number }[]>((acc, slice) => {
    const cumulative = acc.length === 0 ? 0 : acc[acc.length - 1].cumulative + acc[acc.length - 1].slice.percent;
    return [...acc, { slice, cumulative }];
  }, []);

  return (
    <Section title="추천 포트폴리오">
      <p className="text-[12px] leading-[18px] text-[#6B7280]">{officialName} 기준 자산 배분</p>
      <div className="mt-3 flex items-center gap-6">
        <svg viewBox="0 0 42 42" className="h-24 w-24 shrink-0 -scale-x-100 rotate-180">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#FFFFFF" strokeWidth="8" />
          {arcs.map(({ slice, cumulative }) => {
            const visible = Math.max(slice.percent - 1, 0);
            return (
              <circle
                key={slice.key}
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
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] leading-[13.75px] text-[#1A1A2E]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden="true" />
                {slice.label}
              </span>
              <span className="text-[11px] leading-[16.5px] font-bold" style={{ color: slice.color }}>
                {slice.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-[11px] leading-[16.5px] text-[#6B7280]">
        {plan.phrases.map((phrase) => (
          <li key={phrase} className="flex items-center gap-1.5">
            <svg viewBox="0 0 9 7" className="h-[5.5px] w-2 shrink-0" aria-hidden="true">
              <path
                d="M8.5 0.5L3 6L0.5 3.5"
                fill="none"
                stroke="#2A78D6"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {phrase}
          </li>
        ))}
      </ul>
    </Section>
  );
}

// 차트 Y축을 0/25/50/75/100% 지점에서 딱 떨어지는 값으로 나누기 위한 "nice number" 계산.
function getNiceAxisMax(rawMax: number) {
  if (rawMax <= 0) return { max: 1, step: 0.25 };
  const roughStep = rawMax / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  return { max: step * 4, step };
}

function FutureAssetChart({ currentTotal, yearsToRetirement }: { currentTotal: number; yearsToRetirement: number }) {
  const plotWidth = 239;
  const plotHeight = 110;

  const rawMaxValue = calculateFutureAssetValue({ currentTotal, monthlyExtraContribution: 0, years: yearsToRetirement });
  const { max: axisMaxInEok, step: axisStepInEok } = getNiceAxisMax(rawMaxValue / 100_000_000);
  const axisMaxValue = axisMaxInEok * 100_000_000;

  const points = Array.from({ length: 6 }, (_, index) => {
    const year = Math.round((yearsToRetirement * index) / 5);
    const value = calculateFutureAssetValue({ currentTotal, monthlyExtraContribution: 0, years: year });
    return {
      year,
      x: (year / yearsToRetirement) * plotWidth,
      // 세로 구분선/눈금은 정수 좌표라야 안티앨리어싱 없이 선명하게 그려짐(곡선용 x와는 별도로 반올림).
      xRounded: Math.round((year / yearsToRetirement) * plotWidth),
      y: plotHeight - (value / axisMaxValue) * plotHeight,
    };
  });
  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const yAxisTicks = [4, 3, 2, 1, 0].map((multiplier) => multiplier * axisStepInEok);
  // 가로 구분선/눈금도 정수 좌표라야 선명하게 그려짐.
  const yPos = (index: number) => Math.round((index / 4) * plotHeight);

  return (
    <div className="mt-4 flex gap-1.5">
      <div
        className="flex shrink-0 flex-col justify-between text-right text-[9px] text-[#9CA3AF]"
        style={{ height: plotHeight }}
      >
        {yAxisTicks.map((tick) => (
          <span key={tick}>{Number.isInteger(tick) ? tick : tick.toFixed(1)}억</span>
        ))}
      </div>
      <div className="flex-1">
        <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} className="w-full overflow-visible">
          {/* 내부 보조 구분선 — 맨 아래/왼쪽 끝은 축 실선이 대신하므로 제외하고, 맨 위/오른쪽 끝을 포함한 나머지는 옅은 점선으로. */}
          {yAxisTicks.slice(0, -1).map((_, index) => (
            <line
              key={`h-${index}`}
              x1={0}
              x2={plotWidth}
              y1={yPos(index)}
              y2={yPos(index)}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}
          {points.slice(1).map((point) => (
            <line
              key={`v-${point.year}`}
              x1={point.xRounded}
              x2={point.xRounded}
              y1={0}
              y2={plotHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="2 2"
              shapeRendering="crispEdges"
            />
          ))}
          {/* Y축(왼쪽 실선 + 눈금)과 X축(아래쪽 실선 + 눈금) */}
          <line x1={0} x2={0} y1={0} y2={plotHeight} stroke="#666" strokeWidth="1" shapeRendering="crispEdges" />
          <line
            x1={0}
            x2={plotWidth}
            y1={plotHeight}
            y2={plotHeight}
            stroke="#666"
            strokeWidth="1"
            shapeRendering="crispEdges"
          />
          {/* 눈금선은 축 실선 안쪽으로는 들어가지 않고 바깥쪽으로만 튀어나오게(Figma 시안 기준). */}
          {yAxisTicks.map((_, index) => (
            <line
              key={`ytick-${index}`}
              x1={-4}
              x2={0}
              y1={yPos(index)}
              y2={yPos(index)}
              stroke="#666"
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
          ))}
          {points.map((point) => (
            <line
              key={`xtick-${point.year}`}
              x1={point.xRounded}
              x2={point.xRounded}
              y1={plotHeight}
              y2={plotHeight + 4}
              stroke="#666"
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
          ))}
          <path d={pathData} fill="none" stroke="#1FAB6A" strokeWidth="2" />
        </svg>
        <div className="mt-1 flex justify-between text-[9px] text-[#9CA3AF]">
          {points.map((point) => (
            <span key={point.year}>{CURRENT_AGE + point.year}세</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 아래 3개 섹션은 백엔드 /api/report(외부 AI 리포트 생성 서비스 프록시)를 호출해서 채움.
// 그 서비스가 꺼져있어 호출이 실패하면 안정추구형 2등급 페르소나 기준 고정 문구로 폴백(데모 범위).
function AiSummarySection({ totalComment }: { totalComment?: string }) {
  return (
    <Section
      title={
        <span className="inline-flex items-center gap-1.5 font-bold">
          <AiAvatarIcon color="#2A78D6" />
          AI 종합 의견
        </span>
      }
      contentClassName="mt-2"
    >
      <p className="text-[13px] leading-[21.125px] text-[#6B7280]">
        {totalComment ??
          `10문항 진단 총점 ${19}점 → 안정추구형 2등급. 손실 감내도 낮음·투자 경험 부족·단기 유동성 필요 3개 요인이
        복합 반영. 개인연금 미가입 확인됨. 우선 연금저축계좌 개설 → 세액공제 최대화 → DC형 운용전략 채권형 전환
        순서로 상담 진행 권고.`}
      </p>
    </Section>
  );
}

const FALLBACK_ROADMAP_STEPS = [
  { id: 1, time: '이번 달', todo: '연금저축계좌 개설' },
  { id: 2, time: '다음 달', todo: '월 20만원 자동이체 설정' },
  { id: 3, time: '3개월 후', todo: '퇴직연금 DC형 운용전략 변경' },
  { id: 4, time: '1년 후', todo: '포트폴리오 리밸런싱 점검' },
  { id: 5, time: '매년', todo: '세액공제 한도 확인 및 조정' },
];

function RoadmapSection({ roadMap }: { roadMap?: { id: number; time: string; todo: string }[] }) {
  const steps = roadMap && roadMap.length > 0 ? roadMap : FALLBACK_ROADMAP_STEPS;
  return (
    <Section title={<span className="font-bold">실행 로드맵</span>}>
      <ol className="relative flex flex-col gap-4">
        {/* 원형 스텝 아이콘들을 잇는 세로 연결선 — 첫 원의 중심~마지막 원의 중심까지(원 지름 16px의 절반인 8px씩 안쪽으로). */}
        <div className="absolute top-2 bottom-2 left-2 w-[2px] bg-black/8" aria-hidden="true" />
        {steps.map((step) => (
          <li key={step.id} className="relative flex items-start gap-2.5">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-black/8 bg-white" aria-hidden="true" />
            <p className="text-xs leading-[18px] text-[#1A1A2E]">
              <span className="mr-1.5 text-[10px] leading-[15px] font-bold text-[#2A78D6]">{step.time}</span>
              {step.todo}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const FALLBACK_CONSULTING_POINTS = [
  { tendency: '계획형 성향', detail: '목표금액 시뮬레이션이 효과적' },
  { tendency: 'DC형 자기운용 가능', detail: '운용전략 변경 상담' },
  { tendency: '위험 허용 낮음', detail: '원리금보장+채권형 혼합 제안' },
];

function ConsultingPointsSection({
  counsellingPoints,
}: {
  counsellingPoints?: { tendency: string; detail: string }[];
}) {
  const points = counsellingPoints && counsellingPoints.length > 0 ? counsellingPoints : FALLBACK_CONSULTING_POINTS;
  return (
    <Section title={<span className="font-bold">상담 포인트</span>}>
      <ul className="flex flex-col gap-2">
        {points.map((point) => (
          <li key={`${point.tendency}-${point.detail}`} className="flex items-center gap-2 text-xs text-[#1A1A2E]">
            <AlertCircleIcon />
            {point.tendency} — {point.detail}
          </li>
        ))}
      </ul>
    </Section>
  );
}

const RECOMMENDED_PRODUCTS = ['안정형 TDF', '채권형 펀드', '연금저축펀드(안정형)', 'IRP(채권 비중↑)'];

function RecommendedProductsSection() {
  return (
    <Section title={<span className="font-bold">추천 상품 후보</span>}>
      <ul className="flex flex-col gap-2">
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
