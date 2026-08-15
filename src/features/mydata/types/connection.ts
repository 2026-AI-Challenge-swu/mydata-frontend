export type ConnectionCategory =
  | 'nationalPension'
  | 'retirementPension'
  | 'personalPension'
  | 'savingsInvestment';

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
  productName: string;
  balance: number;
}

export interface PersonalPensionData {
  accounts: PersonalPensionAccount[];
  totalContribution: number; // 총 납입액(원)
}

export interface SavingsInvestmentAccount {
  productName: string;
  balance: number;
}

export interface SavingsInvestmentData {
  accounts: SavingsInvestmentAccount[];
  totalBalance: number;
}

// 카테고리 문자열 → 해당 카테고리의 실제 데이터 타입을 연결해주는 매핑
export interface CategoryDataMap {
  nationalPension: NationalPensionData;
  retirementPension: RetirementPensionData;
  personalPension: PersonalPensionData;
  savingsInvestment: SavingsInvestmentData;
}

export type ItemStatus<C extends ConnectionCategory = ConnectionCategory> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: CategoryDataMap[C] }
  | { status: 'error'; message: string; retryable?: boolean };

export type ConnectionItems = {
  [C in ConnectionCategory]: ItemStatus<C>;
};
