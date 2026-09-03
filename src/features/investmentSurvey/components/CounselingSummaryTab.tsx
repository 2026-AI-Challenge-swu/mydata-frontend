import { useState } from 'react';
import type { InvestmentProfile } from '../types/survey';
import type { RetirementReportResult } from '../api/retirementReportApi';
import { CompassIcon } from './icons';
import { GoalEditModal } from './GoalEditModal';
import { PERSONA, TARGET_MONTHLY_LIVING_COST } from '../hooks/useRetirementReport';
import { useConnectionStore } from '../../mydata/stores/connectionStore';
import {
  CURRENT_AGE,
  PENSION_PAYOUT_YEARS,
  calculateRetirementMonthlyPension,
  formatManwon,
  getConnectedMydata,
} from '../../mydata/utils/assetSummary';

interface CounselingSummaryTabProps {
  profile: InvestmentProfile;
  connected: boolean;
  // 마이데이터 연동됐을 때만 존재 — "내 결과" 탭과 같은 훅(useRetirementReport)으로 만든 리포트를 그대로
  // 내려받아 씀. "추천 포트폴리오"/"핵심 지표" 일부/"상담 포인트"처럼 백엔드·AI가 계산해주는 값은 이 리포트에서
  // 그대로 뽑아 써서 전문가 리포트 화면(ConsultantSummaryTab)과 절대 어긋나지 않게 함. 반면 "노후 부족 자금
  // 분석"은 AI 응답이 아니라 프론트에서 직접 계산하는 값이라(아래 참고) retirementReport 없이도 항상 보임.
  retirementReport: RetirementReportResult | null;
}

function formatEok(won: number) {
  return `${(won / 100_000_000).toFixed(1)}억원`;
}

// 추천 포트폴리오 막대 색상 — 비중 순위에 따라 진한 파랑→연한 파랑(ConsultantSummaryTab의
// DONUT_COLOR_SCALE과 같은 값. 도넛 대신 막대라 별도 파일로 안 빼고 여기 그대로 둠).
const PORTFOLIO_BAR_COLORS = ['#2A78D6', '#64A8EF', '#99C6F7', '#C4E0FF', '#E7F4FF'];

// 부족 자금 계산에 적용하는 물가상승률 가정 — ConsultantSummaryTab과 동일(정의서 S4-08 이슈#7 확정).
const INFLATION_RATE = 0.025;
// 백엔드 futureAssetSimulation은 목표 은퇴나이 수정과 무관하게 항상 65세 시점 기준으로 내려옴
// ("핵심 지표"의 "OO세 예상 자산" 라벨용 — ConsultantSummaryTab의 "미래 자산 시뮬레이션" 섹션과 동일).
const FUTURE_ASSET_TARGET_AGE = 65;

// 포트폴리오 추천/노후자금 분석/절세 효과 등은 아직 그 데이터를 주는 API가 없어서,
// 지금 실제로 알 수 있는 투자성향 진단 결과만 담음 (Figma "AI 연금 설계 리포트" 시안 중 일부).
export function CounselingSummaryTab({ profile, connected, retirementReport }: CounselingSummaryTabProps) {
  const items = useConnectionStore((state) => state.items);
  const connectedMydata = getConnectedMydata(items);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // ConsultantSummaryTab의 "노후 부족 자금 분석" 카드와 똑같이, 상담원이 목표 생활비/희망 은퇴나이를
  // 직접 수정할 수 있어야 해서 이 탭에도 같은 상태+팝업(GoalEditModal)을 그대로 둠.
  const [goalLivingCost, setGoalLivingCost] = useState(TARGET_MONTHLY_LIVING_COST);
  const [retirementAge, setRetirementAge] = useState(65);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [draftGoalManwon, setDraftGoalManwon] = useState(TARGET_MONTHLY_LIVING_COST / 10_000);
  const [draftRetirementAge, setDraftRetirementAge] = useState(65);

  const portfolioBars = (retirementReport?.recommendedPortfolio.compositions ?? [])
    .filter((composition) => composition.weightPercent > 0)
    .sort((a, b) => b.weightPercent - a.weightPercent);
  const lastFutureAssetPoint =
    retirementReport?.futureAssetSimulation.points[retirementReport.futureAssetSimulation.points.length - 1];
  const counsellingPoints = retirementReport?.aiReport.counselling_points ?? [];

  // "노후 부족 자금 분석"은 AI 리포트가 아니라 마이데이터로 프론트에서 바로 계산하는 값이라, retirementReport를
  // 기다릴 필요 없이 connectedMydata만 있으면 항상 보여줌 — ConsultantSummaryTab의 goal* 계산과 동일한 공식.
  const yearsToRetirement = retirementAge - CURRENT_AGE;
  const fundAnalysis = connectedMydata
    ? (() => {
        const retirementMonthlyEstimate = calculateRetirementMonthlyPension({
          currentBalance: connectedMydata.retirementPension.balance,
          annualContribution: connectedMydata.bankTransaction.monthlyIncome,
          retirementAge,
        });
        const expectedMonthlyPension = connectedMydata.nationalPension.estimatedMonthlyAmount + retirementMonthlyEstimate;
        const monthlyShortfall = Math.max(goalLivingCost - expectedMonthlyPension, 0);
        const inflatedMonthlyShortfall = monthlyShortfall * Math.pow(1 + INFLATION_RATE, yearsToRetirement);
        const requiredAmountAtRetirement = inflatedMonthlyShortfall * 12 * PENSION_PAYOUT_YEARS;
        return {
          targetLivingCost: goalLivingCost,
          expectedMonthlyPension,
          monthlyShortfall,
          requiredAmountAtRetirement,
        };
      })()
    : null;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-[75px]">
      <div className="bg-[#1A1A2E] px-8 py-7">
        <div className="flex items-center gap-2">
          <CompassIcon />
          <span className="text-xs leading-[18px] font-bold tracking-[1.2px] text-[#8EC5FF] uppercase">연금나침반</span>
        </div>
        <h2 className="mt-3 text-[22px] leading-[33px] font-extrabold text-white">AI 연금 설계 리포트</h2>
        <p className="mt-2 text-xs leading-[18px] text-[#99A1AF]">
          기준일: {today} · 고객명: {PERSONA.name}
        </p>
      </div>

      <div className="flex flex-col gap-7 px-8 py-7">
        <section>
          <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">진단 결과</p>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: profile.cardBackground }}
            >
              <span className="text-3xl leading-none">{profile.emoji}</span>
            </div>
            <div>
              <p className="text-xl leading-[30px] font-extrabold" style={{ color: profile.accentColor }}>
                {profile.nickname}
              </p>
              <span
                className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] leading-[16.5px] font-bold"
                style={{ backgroundColor: profile.badgeBackground, color: profile.accentColor }}
              >
                {profile.officialName} {profile.grade}등급
              </span>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-[21.125px] text-[#6B7280]">{profile.description}</p>
        </section>

        {connected && (
          <>
            <section>
              <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">
                추천 포트폴리오
              </p>
              {portfolioBars.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {portfolioBars.map((composition, index) => (
                    <li key={composition.category} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: PORTFOLIO_BAR_COLORS[index] ?? PORTFOLIO_BAR_COLORS[PORTFOLIO_BAR_COLORS.length - 1] }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-[13px] leading-[19.5px] text-[#1A1A2E]">{composition.category}</span>
                      <div className="h-1.5 w-[70px] rounded-full bg-[#F0F0EC]">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${composition.weightPercent}%`,
                            backgroundColor: PORTFOLIO_BAR_COLORS[index] ?? PORTFOLIO_BAR_COLORS[PORTFOLIO_BAR_COLORS.length - 1],
                          }}
                        />
                      </div>
                      <span className="w-9 text-right text-[11px] leading-[16.5px] font-bold text-[#6B7280]">
                        {composition.weightPercent}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12px] leading-[18px] text-[#6B7280]">불러오는 중...</p>
              )}
            </section>

            <section className="rounded-2xl border border-black/8 bg-white p-4">
              <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">
                노후 부족 자금 분석
              </p>
              <div className="mt-2.5 text-[11px] leading-[16.5px] text-[#6B7280]">목표 생활비</div>
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
                    {fundAnalysis ? formatManwon(fundAnalysis.targetLivingCost) : '불러오는 중...'}
                  </div>
                </div>
                <span className="text-[18px] leading-[28px] font-bold text-[#E85D4A]">−</span>
                <div className="flex-1 rounded-xl bg-[#F0F0EC] py-2 text-center">
                  <div className="text-[10px] leading-[15px] text-[#6B7280]">예상 연금</div>
                  <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#1A1A2E]">
                    {fundAnalysis ? formatManwon(fundAnalysis.expectedMonthlyPension) : '불러오는 중...'}
                  </div>
                </div>
                <span className="text-[18px] leading-[28px] font-bold text-[#E85D4A]">=</span>
                <div className="flex-1 rounded-xl bg-[#FEF2F2] py-2 text-center">
                  <div className="text-[10px] leading-[15px] text-[#E85D4A]">월 부족</div>
                  <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#E85D4A]">
                    {fundAnalysis ? formatManwon(fundAnalysis.monthlyShortfall) : '불러오는 중...'}
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-center">
                <p className="text-[11px] leading-[16.5px] text-[#6B7280]">{retirementAge}세까지 준비 필요 금액</p>
                <p className="text-[22px] leading-[33px] font-extrabold text-[#E85D4A]">
                  {fundAnalysis ? `약 ${formatEok(fundAnalysis.requiredAmountAtRetirement)}` : '불러오는 중...'}
                </p>
                {fundAnalysis && (
                  <p className="text-[10px] leading-[15px] text-[#6B7280]">물가상승률 {INFLATION_RATE * 100}% 반영</p>
                )}
              </div>
            </section>

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

            <section>
              <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">핵심 지표</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F0F0EC] px-3 py-2">
                  <div className="text-[10px] leading-[15px] text-[#6B7280]">연간 절세 효과</div>
                  <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#2A78D6]">
                    {retirementReport ? `+${formatManwon(retirementReport.taxSavingAnalysis.increaseAmount)}` : '불러오는 중...'}
                  </div>
                </div>
                <div className="rounded-xl bg-[#F0F0EC] px-3 py-2">
                  <div className="text-[10px] leading-[15px] text-[#6B7280]">{FUTURE_ASSET_TARGET_AGE}세 예상 자산 (현행)</div>
                  <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#1A1A2E]">
                    {lastFutureAssetPoint ? formatEok(lastFutureAssetPoint.maintainAmount) : '불러오는 중...'}
                  </div>
                </div>
                <div className="rounded-xl bg-[#F0F0EC] px-3 py-2">
                  <div className="text-[10px] leading-[15px] text-[#6B7280]">{FUTURE_ASSET_TARGET_AGE}세 예상 자산 (+20만)</div>
                  <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#2196F3]">
                    {lastFutureAssetPoint ? formatEok(lastFutureAssetPoint.plus20Amount) : '불러오는 중...'}
                  </div>
                </div>
                <div className="rounded-xl bg-[#F0F0EC] px-3 py-2">
                  <div className="text-[10px] leading-[15px] text-[#6B7280]">월 부족 생활비</div>
                  <div className="mt-0.5 text-[13px] leading-[19.5px] font-bold text-[#E85D4A]">
                    {fundAnalysis ? formatManwon(fundAnalysis.monthlyShortfall) : '불러오는 중...'}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">상담 포인트</p>
              {counsellingPoints.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {counsellingPoints.map((point) => (
                    <li key={`${point.tendency}-${point.detail}`} className="flex items-center gap-2 text-xs text-[#1A1A2E]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF8904]" aria-hidden="true" />
                      {point.tendency} — {point.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12px] leading-[18px] text-[#6B7280]">불러오는 중...</p>
              )}
            </section>
          </>
        )}

        <section>
          <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">데이터 소스</p>
          <div className="mt-2.5 flex gap-2">
            <span className="rounded-full bg-[#EBF3FF] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#2A78D6]">
              진단 테스트 완료
            </span>
            {connected ? (
              <span className="rounded-full bg-[#D6F5E6] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#1FAB6A]">
                마이데이터 연동됨
              </span>
            ) : (
              <span className="rounded-full bg-[#F0F0EC] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#6B7280]">
                마이데이터 미연동
              </span>
            )}
          </div>
        </section>

        <p className="border-t border-black/8 pt-5 text-[10px] leading-[16.25px] text-[rgba(107,114,128,0.7)]">
          본 리포트는 AI 분석 결과로 실제 수익을 보장하지 않으며, 투자 결정의 참고 자료로만 활용하시기 바랍니다. 투자는
          원금손실 위험이 있으며, 투자 결정에 대한 책임은 투자자 본인에게 있습니다. 금융투자상품에 관한 투자권유는 별도
          상담을 통해 이루어집니다.
        </p>
      </div>
    </div>
  );
}
