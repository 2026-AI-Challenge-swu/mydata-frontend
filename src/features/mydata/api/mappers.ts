import type {
  RetirementPensionData,
  PersonalPensionData,
  SavingsInvestmentData,
  BankTransactionData,
} from '../types/connection';
import type {
  RawDcRetirementPensionResponse,
  RawIrpPersonalPensionResponse,
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
  };
}

// IRP는 계좌가 하나뿐이라(raw에 계좌명이 따로 없음) accounts 배열엔 단일 항목만 들어감.
// balance는 평가금액(eval_amt), totalContribution은 누적 납입액(accum_amt = employer_amt + employee_amt)
export function mapPersonalPensionResponse(raw: RawIrpPersonalPensionResponse): PersonalPensionData {
  return {
    accounts: [{ productName: 'IRP', balance: raw.eval_amt }],
    totalContribution: raw.accum_amt,
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
