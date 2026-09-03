import type {
  ConnectionItems,
  NationalPensionData,
  RetirementPensionData,
  PersonalPensionData,
  SavingsInvestmentData,
  BankTransactionData,
} from '../types/connection';

// 퇴직연금 DC 잔액을 월 수령액으로 환산하는 공식(S1-05 확정, 2026-08-26 기획팀 검토 완료).
// 가정: 은퇴까지 매년 3% 복리로 자산이 불어나고, 은퇴 후 20년(240개월)에 걸쳐 연금현가공식으로 나눠 받음.
export const ASSUMED_ANNUAL_RETURN_RATE = 0.03;
export const PENSION_PAYOUT_YEARS = 20;
// 페르소나 기준표(만 29세) — 마이데이터로 연동되는 값이 아니라서 상수로 둠. 은퇴 나이는 국민연금 수급개시연령(paymentStartAge)을 그대로 재사용.
export const CURRENT_AGE = 29;

// 현재 잔액(currentBalance)을 연 복리로 은퇴 시점까지 불리고,
// 연간 납입액(annualContribution)은 매달 나눠 적립하며 월복리로 불린 뒤,
// 두 미래가치를 합쳐서 은퇴 후 20년간 매달 받는다고 가정하고 연금현가공식으로 월 수령액을 역산한다.
export function calculateRetirementMonthlyPension({
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

  const futureValueOfBalance =
    currentBalance * Math.pow(1 + ASSUMED_ANNUAL_RETURN_RATE, yearsToRetirement);

  const monthlyContribution = annualContribution / 12;
  const monthsToRetirement = yearsToRetirement * 12;
  const futureValueOfContributions =
    monthlyContribution *
    ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);

  const totalFutureValue = futureValueOfBalance + futureValueOfContributions;

  const payoutMonths = PENSION_PAYOUT_YEARS * 12;
  const monthlyPayoutFactor = monthlyRate / (1 - Math.pow(1 + monthlyRate, -payoutMonths));

  return Math.round(totalFutureValue * monthlyPayoutFactor);
}

export function formatManwon(won: number) {
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

export interface ConnectedMydata {
  nationalPension: NationalPensionData;
  retirementPension: RetirementPensionData;
  personalPension: PersonalPensionData;
  savingsInvestment: SavingsInvestmentData;
  bankTransaction: BankTransactionData;
}

// 5개 항목이 전부 연동 성공(success) 상태일 때만 실제 데이터를 꺼내서 돌려줌. 하나라도 아니면 null.
export function getConnectedMydata(items: ConnectionItems): ConnectedMydata | null {
  if (
    items.nationalPension.status !== 'success' ||
    items.retirementPension.status !== 'success' ||
    items.personalPension.status !== 'success' ||
    items.savingsInvestment.status !== 'success' ||
    items.bankTransaction.status !== 'success'
  ) {
    return null;
  }

  return {
    nationalPension: items.nationalPension.data,
    retirementPension: items.retirementPension.data,
    personalPension: items.personalPension.data,
    savingsInvestment: items.savingsInvestment.data,
    bankTransaction: items.bankTransaction.data,
  };
}

// AssetOverviewScreen과 상담용 요약 리포트가 공통으로 쓰는 총자산/예상월연금 등 파생값 계산.
// annualSalaryPreTax(세전 연봉)는 마이데이터 응답이 아니라 페르소나 상수라 이 유틸(assetSummary.ts)이
// 직접 참조하지 않고, 호출하는 쪽(PERSONA를 이미 알고 있는 화면)에서 넘겨받음 — assetSummary.ts는
// investmentSurvey/hooks/useRetirementReport.ts가 이미 이 파일(CURRENT_AGE)을 가져다 쓰고 있어서,
// 반대 방향으로 PERSONA를 가져오면 순환 참조(circular import)가 생기기 때문.
export function computeAssetSummary(
  { nationalPension, retirementPension, personalPension, savingsInvestment, bankTransaction }: ConnectedMydata,
  annualSalaryPreTax: number,
) {
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
    annualContribution: annualSalaryPreTax / 12,
    retirementAge: nationalPension.paymentStartAge,
  });
  // 예상 월 연금 = 국민연금(자동 월액) + 퇴직연금(연금현가공식 환산). 정의서 S1-05 기준
  const expectedMonthlyPension = nationalPension.estimatedMonthlyAmount + retirementMonthlyEstimate;
  const savingsRate =
    bankTransaction.monthlyIncome === 0
      ? 0
      : Math.round((bankTransaction.monthlySavings / bankTransaction.monthlyIncome) * 100);

  return {
    personalPensionBalance,
    personalPensionEmployeeContribution,
    cashBalance,
    stockBalance,
    etfBalance,
    totalAssets,
    retirementMonthlyEstimate,
    expectedMonthlyPension,
    savingsRate,
  };
}
