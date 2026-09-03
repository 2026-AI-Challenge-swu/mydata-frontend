export type ConnectionCategory =
  | 'identity'
  | 'income'
  | 'employment'
  | 'nationalPension'
  | 'retirementPension'
  | 'personalPension'
  | 'savingsInvestment'
  | 'bankTransaction';

export type ScreenStep = 'intro' | 'consent' | 'loading' | 'result';

// 본인인증(PASS 등): 실제로는 회원가입 시점에 한 번 받는 값이라 나머지 항목들과 데이터 소스
// 성격은 다르지만, 이 프로젝트엔 별도 회원가입 플로우가 없어서 같은 연동 체크리스트로 편입(2026-09-03).
export interface IdentityData {
  name: string;
  birthYear: number;
  gender: 'MALE' | 'FEMALE';
}

// 소득 정보: 공공 마이데이터(정부24) 소득금액증명원 대응. 국민연금과 같은 명분으로 mock.
export interface IncomeData {
  annualGrossSalary: number; // 세전 연봉(원)
}

// 재직 정보: 공공 마이데이터 건강보험 자격득실확인서/재직증명서 대응. "직종" 세부 카테고리까지는
// 이 서류들의 표준 필드가 아니라서 jobLabel은 근사 mock임(EmploymentResponse 주석 참고).
export interface EmploymentData {
  jobLabel: string;
}

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
  issueDate: string; // 가입일(YYYY-MM-DD) — /api/retirement-report 연동용(화면엔 노출 안 함)
}

export interface PersonalPensionAccount {
  accountType: 'IRP' | 'PENSION_SAVINGS';
  productName: string;
  balance: number;
  accumAmt: number; // 누적 납입액(원) — /api/retirement-report 연동용(화면엔 노출 안 함)
  employerAmt: number; // 회사 부담금(원) — /api/retirement-report 연동용(화면엔 노출 안 함)
  employeeContribution: number; // 본인부담금 누적(원) — 절세효과 분석 API 호출용
  issueDate: string; // 계좌 개설일(YYYY-MM-DD)
  rcvStartDate: string; // 연금 수령 개시 예정일(YYYY-MM-DD) — /api/retirement-report 연동용(화면엔 노출 안 함)
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
  identity: IdentityData;
  income: IncomeData;
  employment: EmploymentData;
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
