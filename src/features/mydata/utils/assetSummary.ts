import type {
  ConnectionItems,
  EmploymentData,
  IdentityData,
  IncomeData,
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

// 만 나이 계산 — 생일이 지났는지는 IdentityData에 월/일이 없어서 반영 못 하고, 연도 차이로만 근사함
// (기존에 "만 29세"를 페르소나 상수로 하드코딩해뒀었는데, 2026-09-03 본인 확인 연동 후에도
// identity.birthYear와 연결 안 된 채로 남아있던 걸 발견 → identity.birthYear에서 바로 계산하도록 수정).
export function getCurrentAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

// 현재 잔액(currentBalance)을 연 복리로 은퇴 시점까지 불리고,
// 연간 납입액(annualContribution)은 매달 나눠 적립하며 월복리로 불린 뒤,
// 두 미래가치를 합쳐서 은퇴 후 20년간 매달 받는다고 가정하고 연금현가공식으로 월 수령액을 역산한다.
export function calculateRetirementMonthlyPension({
  currentBalance,
  annualContribution,
  currentAge,
  retirementAge,
}: {
  currentBalance: number;
  annualContribution: number;
  currentAge: number;
  retirementAge: number;
}) {
  const yearsToRetirement = retirementAge - currentAge;
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
  identity: IdentityData;
  income: IncomeData;
  employment: EmploymentData;
  nationalPension: NationalPensionData;
  retirementPension: RetirementPensionData;
  personalPension: PersonalPensionData;
  savingsInvestment: SavingsInvestmentData;
  bankTransaction: BankTransactionData;
}

// 8개 항목이 전부 연동 성공(success) 상태일 때만 실제 데이터를 꺼내서 돌려줌. 하나라도 아니면 null.
export function getConnectedMydata(items: ConnectionItems): ConnectedMydata | null {
  if (
    items.identity.status !== 'success' ||
    items.income.status !== 'success' ||
    items.employment.status !== 'success' ||
    items.nationalPension.status !== 'success' ||
    items.retirementPension.status !== 'success' ||
    items.personalPension.status !== 'success' ||
    items.savingsInvestment.status !== 'success' ||
    items.bankTransaction.status !== 'success'
  ) {
    return null;
  }

  return {
    identity: items.identity.data,
    income: items.income.data,
    employment: items.employment.data,
    nationalPension: items.nationalPension.data,
    retirementPension: items.retirementPension.data,
    personalPension: items.personalPension.data,
    savingsInvestment: items.savingsInvestment.data,
    bankTransaction: items.bankTransaction.data,
  };
}

// AssetOverviewScreen과 상담용 요약 리포트가 공통으로 쓰는 총자산/예상월연금 등 파생값 계산.
export function computeAssetSummary({
  identity,
  income,
  nationalPension,
  retirementPension,
  personalPension,
  savingsInvestment,
  bankTransaction,
}: ConnectedMydata) {
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
    currentAge: getCurrentAge(identity.birthYear),
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
