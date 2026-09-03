import type {
  RetirementPensionData,
  PersonalPensionData,
  SavingsInvestmentData,
  BankTransactionData,
} from '../types/connection';
import type {
  RawDcRetirementPensionResponse,
  RawPersonalPensionResponse,
  RawSavingsInvestmentResponse,
  RawBankTransactionResponse,
} from '../types/rawApiResponses';

// 실제 API 붙일 때도 이 함수들은 그대로 재사용됨 —
// fetch 함수 내부만 mock 대신 axios 호출로 바뀔 뿐, raw 응답을 domain 타입으로 바꾸는 이 로직은 안 바뀜.

export function mapRetirementPensionResponse(
  raw: RawDcRetirementPensionResponse,
): RetirementPensionData {
  return {
    type: 'DC',
    balance: raw.balance_amt,
    evaluationAmount: raw.eval_amt,
    issueDate: raw.issue_date,
  };
}

// IRP/연금저축은 세액공제 한도가 달라서 accountType으로 구분되는 계좌 리스트로 옴.
// balance는 평가금액(eval_amt), employeeContribution은 본인부담금 누적(employee_amt) — AssetOverviewScreen의 세액공제 안내에 씀.
export function mapPersonalPensionResponse(raw: RawPersonalPensionResponse): PersonalPensionData {
  const accounts = raw.accounts.map((account) => ({
    accountType: account.account_type,
    productName: account.account_type === 'IRP' ? 'IRP' : '연금저축',
    balance: account.eval_amt,
    accumAmt: account.accum_amt,
    employerAmt: account.employer_amt,
    employeeContribution: account.employee_amt,
    issueDate: account.issue_date,
    rcvStartDate: account.rcv_start_date,
  }));

  return {
    accounts,
    totalContribution: raw.accounts.reduce((sum, account) => sum + account.accum_amt, 0),
  };
}

export function mapSavingsInvestmentResponse(
  raw: RawSavingsInvestmentResponse,
): SavingsInvestmentData {
  const accounts = raw.accounts.map((account) => ({
    productName: account.prod_name,
    balance: account.balance_amt,
  }));

  return {
    accounts,
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
  };
}

export function mapBankTransactionResponse(raw: RawBankTransactionResponse): BankTransactionData {
  return {
    monthlyIncome: raw.salary_amt,
    monthlyExpense: raw.expense_amt,
    monthlySavings: raw.salary_amt - raw.expense_amt,
    monthlyInvestment: raw.investment_amt,
  };
}
