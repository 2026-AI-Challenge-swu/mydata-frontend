import { useNavigate } from 'react-router-dom';
import { useConnectionStore } from '../stores/connectionStore';

// 퇴직연금 DC 잔액을 월 수령액으로 환산하는 공식(S1-05 확정, 2026-08-26 기획팀 검토 완료).
// 가정: 은퇴까지 매년 3% 복리로 자산이 불어나고, 은퇴 후 20년(240개월)에 걸쳐 연금현가공식으로 나눠 받음.
const ASSUMED_ANNUAL_RETURN_RATE = 0.03;
const PENSION_PAYOUT_YEARS = 20;
// 페르소나 기준표(만 29세) — 마이데이터로 연동되는 값이 아니라서 상수로 둠. 은퇴 나이는 국민연금 수급개시연령(paymentStartAge)을 그대로 재사용.
const CURRENT_AGE = 29;

// 현재 잔액(currentBalance)을 연 복리로 은퇴 시점까지 불리고,
// 연간 납입액(annualContribution)은 매달 나눠 적립하며 월복리로 불린 뒤,
// 두 미래가치를 합쳐서 은퇴 후 20년간 매달 받는다고 가정하고 연금현가공식으로 월 수령액을 역산한다.
function calculateRetirementMonthlyPension({
  currentBalance,
  annualContribution,
  retirementAge,
}: {
  currentBalance: number;
  annualContribution: number;
  retirementAge: number;
}) {
  const yearsToRetirement = retirementAge - CURRENT_AGE;
  const monthlyRate = ASSUMED_ANNUAL_RETURN_RATE / 12;

  // 1) 기존 잔액의 미래가치: 연 단위 복리
  const futureValueOfBalance =
    currentBalance * Math.pow(1 + ASSUMED_ANNUAL_RETURN_RATE, yearsToRetirement);

  // 2) 향후 납입액의 미래가치: 매달 (연납입액/12)씩 적립, 월복리로 성장(연금의 미래가치 공식)
  const monthlyContribution = annualContribution / 12;
  const monthsToRetirement = yearsToRetirement * 12;
  const futureValueOfContributions =
    monthlyContribution *
    ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);

  const totalFutureValue = futureValueOfBalance + futureValueOfContributions;

  // 3) 은퇴 후 20년(240개월) 동안 매달 동일 금액을 받는다고 가정한 연금현가공식으로 월 지급액 역산
  const payoutMonths = PENSION_PAYOUT_YEARS * 12;
  const monthlyPayoutFactor = monthlyRate / (1 - Math.pow(1 + monthlyRate, -payoutMonths));

  return Math.round(totalFutureValue * monthlyPayoutFactor);
}

function formatManwon(won: number) {
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// 조각 사이에 남길 흰 여백 크기. circumference를 100으로 잡아서 %와 동일한 단위라,
// "1"은 원 둘레의 1%만큼을 각 조각 끝에서 잘라내 여백으로 비운다는 뜻.
// 피그마는 조각 사이를 두꺼운 여백이 아니라 얇은 흰색 선(stroke)으로 구분해서, 그와 비슷한 얇기로 맞춤.
const DONUT_SEGMENT_GAP = 1;

// 순수 SVG로 그리는 도넛 차트. 별도 차트 라이브러리 없이,
// 원 둘레(stroke-dasharray)를 카테고리 비율만큼만 그리고 나머지는 투명하게 둬서 "조각"처럼 보이게 하는 방식.
// viewBox를 42x42, 반지름을 15.9155로 잡으면 원 둘레가 정확히 100이 돼서 %를 그대로 dasharray 값으로 쓸 수 있음(흔히 쓰는 트릭).
function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const circumference = 100;

  // 각 조각의 (비율, 시작 전까지 누적된 비율)을 map 콜백 밖에서 미리 계산해둠.
  // (렌더 함수 안에서 map 콜백이 실행될 때마다 바깥 변수를 mutate하면 React 19 lint 규칙에 걸림 — 순수 함수로 유지)
  const arcs = segments.reduce<{ segment: DonutSegment; percent: number; cumulative: number }[]>(
    (acc, segment) => {
      const percent = total === 0 ? 0 : (segment.value / total) * 100;
      const cumulative = acc.length === 0 ? 0 : acc[acc.length - 1].cumulative + acc[acc.length - 1].percent;
      return [...acc, { segment, percent, cumulative }];
    },
    [],
  );

  return (
    <svg viewBox="0 0 42 42" className="h-28 w-28 shrink-0 rotate-180">
      <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#FFFFFF" strokeWidth="6" />
      {arcs.map(({ segment, percent, cumulative }) => {
        // 조각 끝에서 gap만큼 잘라내서 다음 조각과의 사이에 흰 여백이 보이게 함
        const visiblePercent = Math.max(percent - DONUT_SEGMENT_GAP, 0);
        return (
          <circle
            key={segment.label}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke={segment.color}
            strokeWidth="6"
            strokeDasharray={`${visiblePercent} ${circumference - visiblePercent}`}
            strokeDashoffset={circumference - cumulative}
          />
        );
      })}
    </svg>
  );
}

export function AssetOverviewScreen() {
  const items = useConnectionStore((state) => state.items);
  const navigate = useNavigate();

  // 이 화면은 마이데이터 연동(로딩/결과 화면)을 통과해야만 진입하는 라우트라
  // 정상 흐름에선 5개 항목이 전부 success여야 함. 혹시 직접 URL로 들어온 경우엔 연동 화면으로 돌려보냄.
  const allSuccess =
    items.nationalPension.status === 'success' &&
    items.retirementPension.status === 'success' &&
    items.personalPension.status === 'success' &&
    items.savingsInvestment.status === 'success' &&
    items.bankTransaction.status === 'success';

  if (!allSuccess) {
    navigate('/mydata/connect', { replace: true });
    return null;
  }

  // TypeScript가 위 allSuccess 체크만으로는 각 상태를 success로 좁혀주지 않아서(변수별로 따로 판별),
  // 여기서 status가 'success'인 케이스로 재선언
  const nationalPension =
    items.nationalPension.status === 'success' ? items.nationalPension.data : null;
  const retirementPension =
    items.retirementPension.status === 'success' ? items.retirementPension.data : null;
  const personalPension =
    items.personalPension.status === 'success' ? items.personalPension.data : null;
  const savingsInvestment =
    items.savingsInvestment.status === 'success' ? items.savingsInvestment.data : null;
  const bankTransaction =
    items.bankTransaction.status === 'success' ? items.bankTransaction.data : null;

  if (!nationalPension || !retirementPension || !personalPension || !savingsInvestment || !bankTransaction) {
    return null;
  }

  const personalPensionBalance = personalPension.accounts[0]?.balance ?? 0;
  const cashBalance =
    savingsInvestment.accounts.find((account) => account.productName === '예금')?.balance ?? 0;
  const stockBalance =
    savingsInvestment.accounts.find((account) => account.productName === '주식')?.balance ?? 0;
  const etfBalance =
    savingsInvestment.accounts.find((account) => account.productName === 'ETF')?.balance ?? 0;

  // 총자산 = 예적금+주식/ETF(자동) + 퇴직연금 적립금 + 개인연금 평가금액. 국민연금은 자산이 아니라 월수령액이라 제외(정의서 S1-04 비고)
  const totalAssets = savingsInvestment.totalBalance + retirementPension.balance + personalPensionBalance;
  // 퇴직연금 월 환산액: 연 납입액은 월급(세후)을 그대로 사용(마이데이터로 연동되는 값 기준)
  const retirementMonthlyEstimate = calculateRetirementMonthlyPension({
    currentBalance: retirementPension.balance,
    annualContribution: bankTransaction.monthlyIncome,
    retirementAge: nationalPension.paymentStartAge,
  });
  // 예상 월 연금 = 국민연금(자동 월액) + 퇴직연금(연금현가공식 환산). 정의서 S1-05 기준
  const expectedMonthlyPension = nationalPension.estimatedMonthlyAmount + retirementMonthlyEstimate;
  const savingsRate =
    bankTransaction.monthlyIncome === 0
      ? 0
      : Math.round((bankTransaction.monthlySavings / bankTransaction.monthlyIncome) * 100);

  // 피그마 시안(2026-08-24 수정) 기준: 주식/ETF를 "주식·ETF" 한 카테고리로 통합, 라벨/색상도 피그마 그대로 맞춤
  // 이 배열 순서 = 범례(legend)에 나열되는 순서
  const donutSegments: DonutSegment[] = [
    { label: '현금·예금', value: cashBalance, color: '#2A78D6' },
    { label: '주식·ETF', value: stockBalance + etfBalance, color: '#1FAB6A' },
    { label: '퇴직연금(DC)', value: retirementPension.balance, color: '#7C3AED' },
    { label: 'IRP·연금저축', value: personalPensionBalance, color: '#EA8C00' },
  ];
  // 피그마 실제 도넛은 범례 순서와 다르게 그려짐(현금·예금 다음이 주식·ETF가 아니라 IRP·연금저축) —
  // 그래야 가장 큰 조각(현금·예금)이 도넛 "위쪽 절반"을 차지하는 모양이 나옴. 그 순서 그대로 재배열.
  const donutChartSegments = [donutSegments[0], donutSegments[3], donutSegments[2], donutSegments[1]];

  const now = new Date();

  return (
    <div className="flex h-full w-full flex-col bg-[#FAFAF7] px-6 pt-12 pb-10">
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1FAB6A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1FAB6A]" aria-hidden="true" />
        마이데이터 연동 완료
      </div>

      <h1 className="mt-2 text-[22px] leading-[33px] font-bold text-[#1A1A2E]">김민준님의 자산 현황</h1>
      <p className="mt-1 text-xs text-[#6B7280]">
        {now.getFullYear()}년 {now.getMonth() + 1}월 기준
      </p>

      {/* 총자산 / 예상 월 연금 요약 카드 2개 */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-black/8 bg-white p-4">
          <div className="text-xs text-[#6B7280]">총자산</div>
          <div className="mt-1 text-xl font-bold text-[#1A1A2E]">{formatManwon(totalAssets)}</div>
          <div className="mt-1 text-[11px] text-[#6B7280]">예금·주식·연금 합산</div>
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-4">
          <div className="text-xs text-[#6B7280]">예상 월 연금</div>
          <div className="mt-1 text-xl font-bold text-[#2A78D6]">{formatManwon(expectedMonthlyPension)}</div>
          <div className="mt-1 text-[11px] text-[#6B7280]">국민연금+퇴직연금</div>
        </div>
      </div>

      {/* 자산 구성 도넛차트 */}
      <div className="mt-6 rounded-2xl border border-black/8 bg-white p-4">
        <h2 className="text-sm font-medium text-[#1A1A2E]">현재 자산 구성</h2>
        <div className="mt-4 flex items-center gap-6">
          <DonutChart segments={donutChartSegments} />
          <ul className="flex flex-1 flex-col gap-2">
            {donutSegments.map((segment) => {
              const percent = totalAssets === 0 ? 0 : Math.round((segment.value / totalAssets) * 100);
              return (
                <li key={segment.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#1A1A2E]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                      aria-hidden="true"
                    />
                    {segment.label}
                  </span>
                  <span className="text-xs font-medium text-[#1A1A2E]">{percent}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 소득 및 소비 분석 */}
      <div className="mt-6 rounded-2xl border border-black/8 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#1A1A2E]">소득 및 소비 분석</h2>
          <span className="rounded-full bg-[#D6F6E6] px-2.5 py-1 text-[11px] font-bold text-[#1FAB6A]">
            저축률 {savingsRate}%
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-xs">
          <IncomeExpenseRow
            label="월급"
            amount={bankTransaction.monthlyIncome}
            ratio={1}
            color="#2A78D6"
          />
          <IncomeExpenseRow
            label="평균 소비"
            amount={bankTransaction.monthlyExpense}
            ratio={bankTransaction.monthlyExpense / bankTransaction.monthlyIncome}
            color="#FE9A00"
          />
          <IncomeExpenseRow
            label="저축"
            amount={bankTransaction.monthlySavings}
            ratio={bankTransaction.monthlySavings / bankTransaction.monthlyIncome}
            color="#1FAB6A"
          />
        </div>
      </div>

      {/* 연금 현황 카드 3개 */}
      <div className="mt-6 rounded-2xl border border-black/8 bg-white p-4">
        <h2 className="text-sm font-medium text-[#1A1A2E]">연금 현황</h2>

        <div className="mt-4 flex flex-col divide-y divide-black/8">
          <PensionRow
            icon="🏛️"
            title="국민연금"
            subtitle="국가가 평생 꼬박꼬박 주는 돈이에요"
            amountLabel={`${formatManwon(nationalPension.estimatedMonthlyAmount)}/월`}
            badge={`${nationalPension.contributionYears}년째 납부중`}
            badgeColor="blue"
          />
          <PensionRow
            icon="🏢"
            title="퇴직연금"
            subtitle="다니는 회사가 대신 챙겨주는 돈이에요"
            amountLabel={`${formatManwon(retirementMonthlyEstimate)}/월`}
            badge="DC형"
            badgeColor="orange"
            extra={`적립금 ${formatManwon(retirementPension.balance)}`}
          />
          <PensionRow
            icon="💎"
            title="개인연금"
            subtitle="내가 직접 골라서 굴리는 돈이에요"
            amountLabel={`${formatManwon(personalPensionBalance)} 가입중`}
            badge="IRP"
            badgeColor="purple"
            extra="연 최대 99만원 세액공제 가능해요"
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F0F0EC] px-3 py-2.5 text-xs">
          <span className="text-[#6B7280]">지금까지 준비된 예상 월 연금</span>
          <span className="font-bold text-[#1A1A2E]">{formatManwon(expectedMonthlyPension)}</span>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          className="w-full rounded-2xl bg-[#2A78D6] py-4 text-base leading-6 font-bold text-white shadow"
          onClick={() => navigate('/mydata/investment-profile')}
        >
          다음: 나의 투자성향 알아보기 →
        </button>
      </div>
    </div>
  );
}

function IncomeExpenseRow({
  label,
  amount,
  ratio,
  color,
}: {
  label: string;
  amount: number;
  ratio: number;
  color: string;
}) {
  const widthPercent = Math.min(100, Math.max(0, Math.round(ratio * 100)));

  return (
    <div>
      <div className="flex items-center justify-between text-[#1A1A2E]">
        <span className="text-[#6B7280]">{label}</span>
        <span className="font-bold">{formatManwon(amount)}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-[#F0F0EC]">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${widthPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const BADGE_STYLES: Record<'blue' | 'orange' | 'purple', string> = {
  blue: 'bg-[#EFF6FF] text-[#2A78D6]',
  orange: 'bg-[#FFFBEB] text-[#BB4D00]',
  purple: 'bg-[#F5F3FF] text-[#7C3AED]',
};

function PensionRow({
  icon,
  title,
  subtitle,
  amountLabel,
  badge,
  badgeColor,
  extra,
}: {
  icon: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  badge: string;
  badgeColor: 'blue' | 'orange' | 'purple';
  extra?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3.5">
      <div className="flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
        <div>
          <div className="text-sm font-bold text-[#1A1A2E]">{title}</div>
          <div className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_STYLES[badgeColor]}`}>
              {badge}
            </span>
            {extra && <span className="text-[11px] text-[#6B7280]">{extra}</span>}
          </div>
        </div>
      </div>
      <span className="shrink-0 text-sm font-bold text-[#1A1A2E]">{amountLabel}</span>
    </div>
  );
}
