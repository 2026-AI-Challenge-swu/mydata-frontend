export type ConnectionCategory =
  | 'nationalPension'
  | 'retirementPension'
  | 'personalPension'
  | 'savingsInvestment'
  | 'bankTransaction';

export type ScreenStep = 'intro' | 'consent' | 'loading' | 'result';

// 국민연금: 금융 마이데이터 대상이 아니라 자체 설계 규격으로 mock 처리
export interface NationalPensionData {
  estimatedMonthlyAmount: number; // 예상 월 수령액(원)
  paymentStartAge: number; // 수급 개시 예정 연령
  contributionYears: number; // 가입 기간(년)
}

// 퇴직연금 DC형: 잔액·평가금액 제공, 월 수령액은 자체 환산 필요
export interface RetirementPensionData {
  type: 'DC';
  balance: number; // 적립금 잔액(원)
  evaluationAmount: number; // 평가금액(원)
}

export interface PersonalPensionAccount {
  accountType: 'IRP' | 'PENSION_SAVINGS';
  productName: string;
  balance: number;
  employeeContribution: number; // 본인부담금 누적(원) — 절세효과 분석 API 호출용
  issueDate: string; // 계좌 개설일(YYYY-MM-DD)
}

export interface PersonalPensionData {
  accounts: PersonalPensionAccount[];
  totalContribution: number; // 총 납입액(원, 전 계좌 합산)
}

export interface SavingsInvestmentAccount {
  productName: string;
  balance: number;
}

export interface SavingsInvestmentData {
  accounts: SavingsInvestmentAccount[];
  totalBalance: number;
}

// 은행-004(거래내역) 기반. 실제 스펙은 원본 거래 목록이라 급여/소비를 패턴으로 추정해야 하지만,
// 계산 방식이 정의서에도 TBD라 이번엔 월급·소비 집계값만 받아서 저축액만 자체 계산
export interface BankTransactionData {
  monthlyIncome: number; // 월급(세후, 원)
  monthlyExpense: number; // 평균 소비(원)
  monthlySavings: number; // monthlyIncome - monthlyExpense (저축+투자 합산 여력)
  monthlyInvestment: number; // 위 monthlySavings 중 투자로 나간 금액(원)
}

// 카테고리 문자열 → 해당 카테고리의 실제 데이터 타입을 연결해주는 매핑
export interface CategoryDataMap {
  nationalPension: NationalPensionData;
  retirementPension: RetirementPensionData;
  personalPension: PersonalPensionData;
  savingsInvestment: SavingsInvestmentData;
  bankTransaction: BankTransactionData;
}

export type ItemStatus<C extends ConnectionCategory = ConnectionCategory> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: CategoryDataMap[C] }
  | { status: 'error'; message: string; retryable?: boolean };

export type ConnectionItems = {
  [C in ConnectionCategory]: ItemStatus<C>;
};
