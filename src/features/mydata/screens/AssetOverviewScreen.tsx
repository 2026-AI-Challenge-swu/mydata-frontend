import { useNavigate } from 'react-router-dom';
import { useConnectionStore } from '../stores/connectionStore';
import { calculateRetirementMonthlyPension } from '../utils/assetSummary';

// 연금저축·IRP 세액공제 한도(2023년 개정 세법 기준). 합산 연 900만원까지 인정, 총급여 5,500만원 이하(종합소득 4,500만원 이하) 구간 공제율 16.5%.
// 5,500만원 초과 구간은 13.2%로 낮아지지만, 김민준의 정확한 세전 소득 구간은 마이데이터로 확인 불가(은행 거래내역엔 세후 급여만 제공)해 낮은 구간을 가정.
const PENSION_TAX_DEDUCTION_LIMIT = 9_000_000;
const PENSION_TAX_DEDUCTION_RATE = 0.165;
const MAX_PENSION_TAX_DEDUCTION = PENSION_TAX_DEDUCTION_LIMIT * PENSION_TAX_DEDUCTION_RATE;

// 퇴직연금 월 환산 공식(S1-05 확정, 2026-08-26 기획팀 검토 완료)은 assetSummary.ts의 것과 완전히 동일한
// 로직이 이 파일에 따로 복붙돼있었음(2026-09-03 발견) — kimMinjunAge/CURRENT_AGE처럼 값은 같지만 출처가
// 다른 상수를 각자 써서 나중에 하나만 바뀌면 두 화면 계산이 어긋날 위험이 있었음. assetSummary.ts의
// export를 그대로 가져다 쓰는 걸로 통합.

function formatManwon(won: number) {
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

// formatManwon과 달리 소수점 첫째 자리까지 보존(세액공제 한도처럼 148.5만원 같은 반올림 안 되는 값용)
function formatManwonPrecise(won: number) {
  return `${(won / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원`;
}

// 정수 %로 보여줄 값들을 각자 반올림하면 합이 100%가 안 될 수 있어(예: 50+30+8+11=99).
// 최대 잉여법(largest remainder method): 일단 전부 버림으로 정수화하고, 모자란 만큼을
// 버려진 소수점(나머지)이 큰 항목 순서대로 1%p씩 채워서 합을 정확히 100%로 맞춘다.
function allocatePercentages(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return values.map(() => 0);

  const exact = values.map((value) => (value / total) * 100);
  const floored = exact.map((value) => Math.floor(value));
  const remainder = 100 - floored.reduce((sum, value) => sum + value, 0);

  const orderByFractionDesc = exact
    .map((value, index) => ({ index, fraction: value - floored[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floored];
  for (let i = 0; i < remainder; i++) {
    result[orderByFractionDesc[i].index] += 1;
  }
  return result;
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
    items.identity.status === 'success' &&
    items.income.status === 'success' &&
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
  const identity = items.identity.status === 'success' ? items.identity.data : null;
  const income = items.income.status === 'success' ? items.income.data : null;
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

  if (!identity || !income || !nationalPension || !retirementPension || !personalPension || !savingsInvestment || !bankTransaction) {
    return null;
  }

  const personalPensionBalance = personalPension.accounts.reduce((sum, account) => sum + account.balance, 0);
  const personalPensionEmployeeContribution = personalPension.accounts.reduce(
    (sum, account) => sum + account.employeeContribution,
    0,
  );
  const cashBalance =
    savingsInvestment.accounts.find((account) => account.productName === '예금')?.balance ?? 0;
  const stockBalance =
    savingsInvestment.accounts.find((account) => account.productName === '주식')?.balance ?? 0;
  const etfBalance =
    savingsInvestment.accounts.find((account) => account.productName === 'ETF')?.balance ?? 0;

  // 총자산 = 예적금+주식/ETF(자동) + 퇴직연금 적립금 + 개인연금 평가금액. 국민연금은 자산이 아니라 월수령액이라 제외(정의서 S1-04 비고)
  const totalAssets = savingsInvestment.totalBalance + retirementPension.balance + personalPensionBalance;
  // 퇴직연금 월 환산액: DC형은 법정 최소 "연봉의 1/12"을 회사가 매년 적립하는 제도라, 은행 거래내역상
  // 월급(세후)이 아니라 연봉(세전)을 12로 나눈 값을 연간 납입액으로 사용(2026-09-03 수정 — 예전엔
  // bankTransaction.monthlyIncome을 그대로 썼는데, 세후 실수령액은 DC 납입 기준과 무관한 값이라 부정확했음).
  const retirementMonthlyEstimate = calculateRetirementMonthlyPension({
    currentBalance: retirementPension.balance,
    annualContribution: income.annualGrossSalary / 12,
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
  const donutPercentages = allocatePercentages(donutSegments.map((segment) => segment.value));

  const now = new Date();

  return (
    <div className="flex h-full w-full flex-col bg-[#FAFAF7] px-6 pt-12 pb-10">
      <div className="flex items-center gap-1.5 text-[13px] leading-[19.5px] font-bold text-[#1FAB6A]">
        <span className="h-2 w-2 rounded-full bg-[#1FAB6A]" aria-hidden="true" />
        마이데이터 연동 완료
      </div>

      <h1 className="mt-2 text-[22px] leading-[33px] font-extrabold text-[#1A1A2E]">{identity.name}님의 자산 현황</h1>
      <p className="mt-1 text-[13px] leading-[19.5px] text-[#6B7280]">
        {now.getFullYear()}년 {now.getMonth() + 1}월 기준
      </p>

      {/* 총자산 / 예상 월 연금 요약 카드 2개 */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-black/8 bg-white p-4">
          <div className="text-[11px] leading-[16.5px] text-[#6B7280]">총자산</div>
          <div className="mt-1 text-xl leading-[30px] font-extrabold text-[#2A78D6]">{formatManwon(totalAssets)}</div>
          <div className="mt-1 text-[10px] leading-[15px] text-[#6B7280]">예금·주식·연금 합산</div>
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-4">
          <div className="text-[11px] leading-[16.5px] text-[#6B7280]">예상 월 연금</div>
          <div className="mt-1 text-xl leading-[30px] font-extrabold text-[#1FAB6A]">{formatManwon(expectedMonthlyPension)}</div>
          <div className="mt-1 text-[10px] leading-[15px] text-[#6B7280]">국민연금+퇴직연금</div>
        </div>
      </div>

      {/* 자산 구성 도넛차트 */}
      <div className="mt-5 rounded-2xl border border-black/8 bg-white p-4">
        <h2 className="text-sm leading-[21px] font-medium text-[#1A1A2E]">현재 자산 구성</h2>
        <div className="mt-3 flex items-center gap-2">
          <DonutChart segments={donutChartSegments} />
          <ul className="flex flex-1 flex-col gap-2">
            {donutSegments.map((segment, index) => {
              const percent = donutPercentages[index];
              return (
                <li key={segment.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[11px] leading-[16.5px] text-[#1A1A2E]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segment.color }}
                      aria-hidden="true"
                    />
                    {segment.label}
                  </span>
                  <span className="text-xs leading-[18px] font-medium text-[#1A1A2E]">{percent}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 소득 및 소비 분석 */}
      <div className="mt-3 rounded-2xl border border-black/8 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm leading-[21px] font-medium text-[#1A1A2E]">소득 및 소비 분석</h2>
          <span className="rounded-full bg-[#D6F6E6] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#1FAB6A]">
            저축률 {savingsRate}%
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 text-xs">
          <IncomeExpenseRow
            label="월급(세후)"
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
            amount={bankTransaction.monthlySavings - bankTransaction.monthlyInvestment}
            ratio={(bankTransaction.monthlySavings - bankTransaction.monthlyInvestment) / bankTransaction.monthlyIncome}
            color="#1FAB6A"
          />
          <IncomeExpenseRow
            label="투자"
            amount={bankTransaction.monthlyInvestment}
            ratio={bankTransaction.monthlyInvestment / bankTransaction.monthlyIncome}
            color="#7C3AED"
          />
        </div>
      </div>

      {/* 연금 현황 카드 3개 */}
      <div className="mt-3 rounded-2xl border border-black/8 bg-white p-4">
        <h2 className="text-sm font-medium text-[#1A1A2E]">연금 현황</h2>

        <div className="mt-4 flex flex-col divide-y divide-black/8">
          <PensionRow
            icon="🏛️"
            iconColor="blue"
            title="국민연금"
            subtitle="국가가 평생 꼬박꼬박 주는 돈이에요"
            amountLabel={`${formatManwon(nationalPension.estimatedMonthlyAmount)}/월`}
            amountColor="#2A78D6"
            badges={[{ label: `${nationalPension.contributionYears}년째 납부중`, color: 'blue' }]}
          />
          <PensionRow
            icon="💼"
            iconColor="orange"
            title="퇴직연금"
            subtitle="다니는 회사가 대신 챙겨주는 돈이에요"
            amountLabel={`${formatManwon(retirementMonthlyEstimate)}/월`}
            badges={[
              { label: 'DC형', color: 'orange' },
              { label: `적립금 ${formatManwon(retirementPension.balance)}`, color: 'gray' },
            ]}
          />
          <PensionRow
            icon="💎"
            iconColor="purple"
            title="개인연금"
            subtitle="내가 직접 골라서 굴리는 돈이에요"
            badges={[
              { label: 'IRP·연금저축', color: 'purple' },
              { label: `잔액 ${formatManwon(personalPensionBalance)}`, color: 'gray' },
              { label: `본인 납입 ${formatManwon(personalPensionEmployeeContribution)}`, color: 'orangeText' },
            ]}
            highlight={
              personalPensionEmployeeContribution > 0
                ? `납입을 늘리면 연 최대 ${formatManwonPrecise(MAX_PENSION_TAX_DEDUCTION)} 세액공제를 받을 수 있어요`
                : `본인 납입을 시작하면 연 최대 ${formatManwonPrecise(MAX_PENSION_TAX_DEDUCTION)} 세액공제를 받을 수 있어요`
            }
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/8 pt-4">
          <span className="text-[13px] leading-[19.5px] text-[#6B7280]">지금까지 준비된 월 연금</span>
          <span className="text-[15px] leading-[22.5px] font-extrabold text-[#1A1A2E]">
            {formatManwon(expectedMonthlyPension)}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A78D6] py-4 text-base leading-6 font-bold text-white"
          onClick={() => navigate('/mydata/survey')}
        >
          다음: 나의 투자성향 알아보기
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3.333 8h9.334M8.667 3.333 13.333 8l-4.666 4.667"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
      <div className="flex items-center justify-between leading-[18px] text-[#1A1A2E]">
        <span className="text-[#6B7280]">{label}</span>
        <span className="font-medium">{formatManwon(amount)}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-[#F0F0EC]">
        <div
          className="h-2 rounded-full"
          style={{ width: `${widthPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const BADGE_STYLES: Record<'blue' | 'orange' | 'purple' | 'gray' | 'orangeText', string> = {
  blue: 'bg-[#EFF6FF] text-[#155DFC]',
  orange: 'bg-[#FFFBEB] text-[#F54900]',
  purple: 'bg-[#F5F3FF] text-[#9810FA]',
  gray: 'bg-[#F0F0EC] text-[#6B7280]',
  // "본인 납입 0원" 전용 — 피그마 확인 결과 배경은 orange와 동일(#FFFBEB), 글자색만 다름(#E17100)
  orangeText: 'bg-[#FFFBEB] text-[#E17100]',
};

const ICON_BG_STYLES: Record<'blue' | 'orange' | 'purple', string> = {
  blue: 'bg-[#EFF6FF]',
  orange: 'bg-[#FFF7ED]',
  purple: 'bg-[#FAF5FF]',
};

function PensionRow({
  icon,
  iconColor,
  title,
  subtitle,
  amountLabel,
  amountColor = '#1A1A2E',
  badges,
  highlight,
}: {
  icon: string;
  iconColor: 'blue' | 'orange' | 'purple';
  title: string;
  subtitle: string;
  amountLabel?: string;
  amountColor?: string;
  badges: { label: string; color: 'blue' | 'orange' | 'purple' | 'gray' | 'orangeText' }[];
  highlight?: string;
}) {
  return (
    <div className="py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg ${ICON_BG_STYLES[iconColor]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div>
            <div className="text-[13px] leading-[19.5px] font-medium text-[#1A1A2E]">{title}</div>
            <div className="mt-0.5 text-[11px] leading-[16.5px] text-[#6B7280]">{subtitle}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {badges.map(({ label, color }) => (
                <span
                  key={label}
                  className={`rounded-full px-2 py-0.5 text-[10px] leading-[15px] font-medium ${BADGE_STYLES[color]}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span
          className="shrink-0 text-sm leading-[21px] font-extrabold"
          style={{ color: amountLabel ? amountColor : '#6B7280' }}
        >
          {amountLabel ?? '—'}
        </span>
      </div>
      {highlight && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#EBF3FF] px-3 py-2.5">
          <span aria-hidden="true">💡</span>
          <span className="text-[11px] leading-[17.875px] font-medium text-[#2A78D6]">{highlight}</span>
        </div>
      )}
    </div>
  );
}
