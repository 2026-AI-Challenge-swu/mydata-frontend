import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { AiAvatarIcon, AlertCircleIcon, BankIcon, DownloadIcon, HomeIcon, ShareIcon } from '../components/icons';
import type { PortfolioRecommendationResult, RetirementReportResult } from '../api/retirementReportApi';
import { useConnectionStore } from '../../mydata/stores/connectionStore';
import {
  PENSION_PAYOUT_YEARS,
  calculateRetirementMonthlyPension,
  computeAssetSummary,
  formatManwon,
  getConnectedMydata,
  getCurrentAge,
} from '../../mydata/utils/assetSummary';
import type { InvestmentProfile, SurveyQuestion } from '../types/survey';
import { TARGET_MONTHLY_LIVING_COST, useRetirementReport } from '../hooks/useRetirementReport';
import { getRecommendedProductGroup } from '../constants/recommendedProductGroups';
import { GoalEditModal } from '../components/GoalEditModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ConsultantSummaryTabProps {
  profile: InvestmentProfile;
  questions: SurveyQuestion[];
  answers: Record<string, number>;
  connected: boolean;
  // "내 결과" 화면(SurveyResultScreen)에서 이미 만들어둔 리포트가 있으면 이걸로 넘겨받음 — 있으면
  // useRetirementReport가 같은 조건으로 다시 호출하지 않고 그대로 재사용함(화면 간 데이터 일치 보장).
  initialReport?: RetirementReportResult | null;
}

// 부족 자금 계산에 적용하는 물가상승률 가정(정의서 S4-08 이슈#7 확정: 91만원×12개월×20년×(1.025)^36년 방식, 기획팀 검증 완료).
const INFLATION_RATE = 0.025;

// 투자성향 점수 5개 막대 색상 — 값 자체는 백엔드가 등급별 확정값으로 내려주는 profile.categoryScores를
// 그대로 쓰고, 라벨별 색상만 여기서 매핑함(백엔드 라벨 문자열과 정확히 일치해야 함).
const SCORE_BAR_COLORS: Record<string, string> = {
  '투자 경험': '#E85D4A',
  '손실 감내도': '#7C3AED',
  '투자 기간': '#EA8C00',
  '수익 추구도': '#2A78D6',
  '소득 안정성': '#1FAB6A',
};

// 미래 자산 시뮬레이션 3개 시나리오 박스 색상(현재 유지/+20만/+40만 순서, Figma 확인값).
const SCENARIO_COLORS = ['#9CA3AF', '#2196F3', '#1FAB6A'];

function formatEok(won: number) {
  return `${(won / 100_000_000).toFixed(1)}억`;
}

export function ConsultantSummaryTab({ profile, questions, answers, connected, initialReport }: ConsultantSummaryTabProps) {
  const items = useConnectionStore((state) => state.items);
  const connectedMydata = getConnectedMydata(items);
  const [memo, setMemo] = useState('');
  const [memoSavedAt, setMemoSavedAt] = useState<Date | null>(null);
  const [job, setJob] = useState(connectedMydata?.employment.jobLabel ?? '');
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [goalLivingCost, setGoalLivingCost] = useState(TARGET_MONTHLY_LIVING_COST);
  const [retirementAge, setRetirementAge] = useState(65);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [draftGoalManwon, setDraftGoalManwon] = useState(TARGET_MONTHLY_LIVING_COST / 10_000);
  const [draftRetirementAge, setDraftRetirementAge] = useState(65);
  const contentRef = useRef<HTMLDivElement>(null);

  // 절세효과/미래자산 시뮬레이션/추천 포트폴리오/AI 리포트를 각각 따로 호출하던 것을 백엔드
  // /api/retirement-report(효진 구현) 하나로 통합 — mydata 스냅샷+설문답변을 보내면 전부 계산해서 반환해줌.
  // fetch 로직 자체는 useRetirementReport 훅으로 옮겨서 SurveyResultScreen과 공유함 — "내 결과" 화면에서
  // 이미 만든 리포트(initialReport)가 있으면 여기서 똑같은 조건으로 다시 호출하지 않고 그대로 재사용해서,
  // 두 화면에 보이는 AI 조언/할 일 내용이 어긋나지 않게 함.
  const retirementReport = useRetirementReport({
    answers,
    connectedMydata,
    targetLivingCost: goalLivingCost,
    initialReport,
  });

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

  const { identity, income, nationalPension, retirementPension } = connectedMydata;
  const summary = computeAssetSummary(connectedMydata);
  const currentAge = getCurrentAge(identity.birthYear);

  // "노후 부족 자금 분석" 카드의 수정 팝업(목표생활비/희망은퇴나이)에 따른 what-if 재계산.
  // 다른 섹션(자산 현황, 미래 자산 시뮬레이션 등)의 기준값에는 영향을 주지 않도록 이 카드 전용 변수로 분리.
  const goalYearsToRetirement = retirementAge - currentAge;
  const goalRetirementMonthlyEstimate = calculateRetirementMonthlyPension({
    currentBalance: retirementPension.balance,
    annualContribution: income.annualGrossSalary / 12,
    currentAge,
    retirementAge,
  });
  const goalExpectedMonthlyPension = nationalPension.estimatedMonthlyAmount + goalRetirementMonthlyEstimate;
  const goalMonthlyShortfall = Math.max(goalLivingCost - goalExpectedMonthlyPension, 0);
  const goalInflatedMonthlyShortfall =
    goalMonthlyShortfall * Math.pow(1 + INFLATION_RATE, goalYearsToRetirement);
  // 은퇴 후 20년(65~85세)치 생활비, 할인 없이 단순 합산 — 정의서 S4-08 이슈#7 확정 방식.
  const goalTotalShortfallNeeded = goalInflatedMonthlyShortfall * 12 * PENSION_PAYOUT_YEARS;

  const scoreBars = profile.categoryScores.map(({ label, percent }) => ({
    label,
    percent,
    color: SCORE_BAR_COLORS[label] ?? '#9CA3AF',
  }));

  // "투자 경험"은 별도 채널이 필요 없음 — 설문 1번 문항(category: "투자 경험")에서 이미 물어본 답변을
  // 그대로 씀(2026-09-03: PERSONA.investmentExperienceLabel이라는 무관한 고정 문구("1~3년")를 대신
  // 쓰고 있던 걸 발견해서 수정 — 애초에 이 문항은 "투자 연차"가 아니라 "가장 과감했던 투자 상품"을
  // 물어보는 문항이라 "1~3년" 같은 연차 표현 자체도 문항 의도와 안 맞았음).
  const investmentExperienceQuestion = questions.find((question) => question.category === '투자 경험');
  const investmentExperienceOption = investmentExperienceQuestion?.options.find(
    (option) => option.order === answers[investmentExperienceQuestion.id]
  );
  const investmentExperienceLabel = investmentExperienceOption
    ? investmentExperienceOption.text.replace(/^\S+\s*/, '')
    : '응답 없음';

  // 미래 자산 시뮬레이션은 백엔드 /api/retirement-report의 futureAssetSimulation.points(currentAge~65세,
  // 1년 단위)를 그대로 사용 — 로컬 복리 계산은 더 이상 하지 않음. 마지막 포인트(65세)가 3개 시나리오 카드 값.
  const futureAssetPoints = retirementReport?.futureAssetSimulation.points ?? [];
  const lastFutureAssetPoint = futureAssetPoints[futureAssetPoints.length - 1];
  const scenarios = [
    { label: '현재 유지', futureValue: lastFutureAssetPoint?.maintainAmount ?? 0 },
    { label: '+20만/월', futureValue: lastFutureAssetPoint?.plus20Amount ?? 0 },
    { label: '+40만/월', futureValue: lastFutureAssetPoint?.plus40Amount ?? 0 },
  ];

  async function handleDownloadPdf() {
    if (!contentRef.current) return;
    // 툴바 버튼(PDF 저장/공유/처음으로)은 리포트 내용이 아니라 화면 조작용이라 PDF에는 안 실음.
    const canvas = await html2canvas(contentRef.current, {
      backgroundColor: '#FAFAF7',
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => element.classList.contains('pdf-ignore'),
    });
    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`연금나침반_상담리포트_${identity.name}.pdf`);
  }

  return (
    <div ref={contentRef} className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#FAFAF7] px-6 pt-6 pb-10">
      <ReportHeader onDownloadPdf={handleDownloadPdf} />

      <Section title="고객 기본 정보">
        <InfoRow label="이름" value={identity.name} />
        <InfoRow label="나이" value={`만 ${currentAge}세 (${identity.birthYear}년생)`} />
        <InfoRow label="연봉(세전)" value={formatManwon(income.annualGrossSalary)} />
        <InfoRow label="월급(세후)" value={formatManwon(connectedMydata.bankTransaction.monthlyIncome)} />
        <InfoRow label="투자 경험" value={investmentExperienceLabel} />
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
            {formatManwon(summary.personalPensionBalance)} (본인 납입 {formatManwon(summary.personalPensionEmployeeContribution)})
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
        <p className="text-[11px] leading-[16.5px] text-[#6B7280]">{retirementAge}세 은퇴 기준</p>
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

      <RecommendedPortfolioSection
        officialName={profile.officialName}
        recommendedPortfolio={retirementReport?.recommendedPortfolio}
      />

      <Section title="미래 자산 시뮬레이션">
        {/* Section 기본 mt-3(12px)보다 좁게 — Figma는 타이틀에 훨씬 더 가까이 붙어있음. */}
        <p className="-mt-2 text-[12px] leading-[18px] text-[#6B7280]">65세까지 시나리오별 예상</p>
        {retirementReport ? (
          <>
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
            <FutureAssetChart points={futureAssetPoints} />
          </>
        ) : (
          <div className="mt-3 flex justify-center py-2">
            <LoadingSpinner className="h-4 w-4" />
          </div>
        )}
      </Section>

      <AiSummarySection totalComment={retirementReport?.aiReport.total_comment} />
      <RoadmapSection roadMap={retirementReport?.aiReport.road_map} />
      <ConsultingPointsSection counsellingPoints={retirementReport?.aiReport.counselling_points} />
      <RecommendedProductsSection officialName={profile.officialName} />

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

function ReportHeader({ onDownloadPdf }: { onDownloadPdf: () => Promise<void> }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  function showComingSoon(feature: string) {
    setToast(`${feature} 기능은 아직 준비 중이에요`);
    setTimeout(() => setToast(null), 2000);
  }

  async function handlePdfClick() {
    setIsDownloading(true);
    try {
      await onDownloadPdf();
    } catch {
      setToast('PDF 저장에 실패했어요. 잠시 후 다시 시도해주세요');
      setTimeout(() => setToast(null), 2000);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm leading-[21px] font-bold whitespace-nowrap text-[#1A1A2E]">리포트 미리보기</h1>
        <div className="pdf-ignore flex shrink-0 items-center gap-2">
          <button
            className="flex items-center gap-1.5 rounded-xl bg-[#2A78D6] px-4 py-2 text-[13px] font-bold whitespace-nowrap text-white disabled:opacity-60"
            onClick={handlePdfClick}
            disabled={isDownloading}
          >
            <DownloadIcon color="#FFFFFF" /> {isDownloading ? '저장 중...' : 'PDF 저장'}
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

// 도넛차트 색상 — 카테고리별 고정색이 아니라 비중 순위에 따라 진한 파랑→연한 파랑 그라데이션(Figma 확인값).
const DONUT_COLOR_SCALE = ['#2A78D6', '#64A8EF', '#99C6F7', '#C4E0FF', '#E7F4FF'];

// 추천 포트폴리오 배분은 예전엔 프론트 로컬 표(PORTFOLIO_ALLOCATION_PLAN)에서 바로 읽었는데, 이제
// 백엔드 /api/retirement-report의 recommendedPortfolio(PortfolioTemplateSeeder, 같은 기준표를 MongoDB로 이전)
// 응답을 그대로 씀 — 로컬 표는 삭제하고 백엔드 값을 그대로 신뢰하기로 함(2026-09-02).
function RecommendedPortfolioSection({
  officialName,
  recommendedPortfolio,
}: {
  officialName: string;
  recommendedPortfolio?: PortfolioRecommendationResult;
}) {
  if (!recommendedPortfolio) {
    return (
      <Section title="추천 포트폴리오">
        <div className="flex justify-center py-1">
          <LoadingSpinner className="h-4 w-4" />
        </div>
      </Section>
    );
  }

  const slices = recommendedPortfolio.compositions
    .filter((composition) => composition.weightPercent > 0)
    .sort((a, b) => b.weightPercent - a.weightPercent) // 도넛차트는 비중 많은 순으로 그림.
    .map((composition, index) => ({
      key: composition.category,
      label: composition.category,
      percent: composition.weightPercent,
      color: DONUT_COLOR_SCALE[index] ?? DONUT_COLOR_SCALE[DONUT_COLOR_SCALE.length - 1],
    }));

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
        {recommendedPortfolio.recommendationReasons.map((phrase) => (
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

// points: 백엔드 futureAssetSimulation.points(currentAge~65세, 1년 단위)의 3개 시나리오
// (현재 유지/+20만원/+40만원)를 전부 그림 — 예전엔 maintainAmount 한 줄만 그려서, 위 요약
// 카드에는 3개 시나리오(1.6억/3.5억/5.4억)가 다 보이는데 그래프는 1개 선만 나오고 Y축도
// "현재 유지" 최종값 기준으로만 잡혀 다른 두 시나리오보다 훨씬 낮게 잘려 보이는 문제가 있었음.
// 6개 지점만 균등 샘플링해서 그림(축 라벨이 6개인 Figma 시안에 맞춤).
const FUTURE_ASSET_SCENARIO_KEYS = ['maintainAmount', 'plus20Amount', 'plus40Amount'] as const;

function FutureAssetChart({
  points,
}: {
  points: { age: number; maintainAmount: number; plus20Amount: number; plus40Amount: number }[];
}) {
  const plotWidth = 239;
  const plotHeight = 110;

  if (points.length === 0) return null;

  const startAge = points[0].age;
  const totalYears = points[points.length - 1].age - startAge;
  const lastPoint = points[points.length - 1];

  const rawMaxValue = Math.max(lastPoint.maintainAmount, lastPoint.plus20Amount, lastPoint.plus40Amount);
  const { max: axisMaxInEok, step: axisStepInEok } = getNiceAxisMax(rawMaxValue / 100_000_000);
  const axisMaxValue = axisMaxInEok * 100_000_000;

  const sampledYears = Array.from({ length: 6 }, (_, index) =>
    totalYears === 0 ? 0 : Math.round((totalYears * index) / 5),
  );
  const sampledPoints = sampledYears.map((year) => {
    const x = totalYears === 0 ? 0 : (year / totalYears) * plotWidth;
    return {
      year,
      x,
      // 세로 구분선/눈금은 정수 좌표라야 안티앨리어싱 없이 선명하게 그려짐(곡선용 x와는 별도로 반올림).
      xRounded: Math.round(x),
    };
  });
  const scenarioPathData = FUTURE_ASSET_SCENARIO_KEYS.map((key) =>
    sampledYears
      .map((year, index) => {
        const value = points.find((point) => point.age - startAge === year)?.[key] ?? rawMaxValue;
        const y = plotHeight - (value / axisMaxValue) * plotHeight;
        return `${index === 0 ? 'M' : 'L'}${sampledPoints[index].x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' '),
  );
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
          {sampledPoints.slice(1).map((point) => (
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
          {sampledPoints.map((point) => (
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
          {/* 현재 유지(회색)를 맨 아래에, +40만원(초록)을 맨 위에 그려서 겹치는 부분에서도 세 선이 다 보이게 함. */}
          {scenarioPathData.map((d, index) => (
            <path key={FUTURE_ASSET_SCENARIO_KEYS[index]} d={d} fill="none" stroke={SCENARIO_COLORS[index]} strokeWidth="2" />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[9px] text-[#9CA3AF]">
          {sampledPoints.map((point) => (
            <span key={point.year}>{startAge + point.year}세</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 아래 3개 섹션은 백엔드 /api/retirement-report 응답의 aiReport 필드(내부적으로 /api/report → 외부 AI
// 리포트 생성 서비스 프록시를 호출)로 채움. 예전엔 그 서비스가 꺼져있어 호출이 실패하면 고정 문구/데모
// 데이터로 조용히 폴백했는데, 로딩 중인지 실패한 건지 구분이 안 돼서 혼란스러웠음(2026-09-03) — 값이
// 아직 없으면 그냥 스피너를 보여주는 것으로 통일함. 다른 스피너 처리 구간과 동일한 패턴.
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
      {totalComment ? (
        <p className="text-[13px] leading-[21.125px] text-[#6B7280]">{totalComment}</p>
      ) : (
        <div className="flex justify-center py-2">
          <LoadingSpinner className="h-4 w-4" />
        </div>
      )}
    </Section>
  );
}

function RoadmapSection({ roadMap }: { roadMap?: { id: number; time: string; todo: string }[] }) {
  if (!roadMap || roadMap.length === 0) {
    return (
      <Section title={<span className="font-bold">실행 로드맵</span>}>
        <div className="flex justify-center py-2">
          <LoadingSpinner className="h-4 w-4" />
        </div>
      </Section>
    );
  }
  return (
    <Section title={<span className="font-bold">실행 로드맵</span>}>
      <ol className="relative flex flex-col gap-4">
        {/* 원형 스텝 아이콘들을 잇는 세로 연결선 — 첫 원의 중심~마지막 원의 중심까지(원 지름 16px의 절반인 8px씩 안쪽으로). */}
        <div className="absolute top-2 bottom-2 left-2 w-[2px] bg-black/8" aria-hidden="true" />
        {roadMap.map((step) => (
          <li key={step.id} className="relative flex items-start gap-2.5">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-black/8 bg-white" aria-hidden="true" />
            <div>
              <p className="text-[10px] leading-[15px] font-bold text-[#2A78D6]">{step.time}</p>
              <p className="mt-1 text-xs leading-[18px] text-[#1A1A2E]">{step.todo}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function ConsultingPointsSection({
  counsellingPoints,
}: {
  counsellingPoints?: { tendency: string; detail: string }[];
}) {
  if (!counsellingPoints || counsellingPoints.length === 0) {
    return (
      <Section title={<span className="font-bold">상담 포인트</span>}>
        <div className="flex justify-center py-2">
          <LoadingSpinner className="h-4 w-4" />
        </div>
      </Section>
    );
  }
  return (
    <Section title={<span className="font-bold">상담 포인트</span>}>
      <ul className="flex flex-col gap-2">
        {counsellingPoints.map((point) => (
          <li key={`${point.tendency}-${point.detail}`} className="flex items-center gap-2 text-xs text-[#1A1A2E]">
            <AlertCircleIcon />
            {point.tendency} — {point.detail}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RecommendedProductsSection({ officialName }: { officialName: string }) {
  const recommendedProducts = getRecommendedProductGroup(officialName);

  return (
    <Section title={<span className="font-bold">추천 상품 후보</span>}>
      <ul className="flex flex-col gap-2">
        {recommendedProducts.map((product) => (
          <li key={product} className="flex items-center gap-2 text-xs text-[#1A1A2E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A78D6]" aria-hidden="true" />
            {product}
          </li>
        ))}
      </ul>
    </Section>
  );
}
