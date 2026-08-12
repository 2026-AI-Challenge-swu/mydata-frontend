import type { RetirementPensionData, PersonalPensionData, SavingsInvestmentData } from '../types/connection';
import type {
  RawDcRetirementPensionResponse,
  RawIrpPersonalPensionResponse,
  RawSavingsInvestmentResponse,
} from '../types/rawApiResponses';

// 실제 API 붙일 때도 이 함수들은 그대로 재사용됨 —
// fetch 함수 내부만 mock 대신 axios 호출로 바뀔 뿐, raw 응답을 domain 타입으로 바꾸는 이 로직은 안 바뀜.

export function mapRetirementPensionResponse(
  raw: RawDcRetirementPensionResponse,
): RetirementPensionData {
  return {
    type: 'DC',
    balanceAmt: raw.balance_amt,
    evalAmt: raw.eval_amt,
    issueDate: raw.issue_date,
  };
}

export function mapPersonalPensionResponse(raw: RawIrpPersonalPensionResponse): PersonalPensionData {
  return {
    accumAmt: raw.accum_amt,
    evalAmt: raw.eval_amt,
    employerAmt: raw.employer_amt,
    employeeAmt: raw.employee_amt,
    issueDate: raw.issue_date,
    rcvStartDate: raw.rcv_start_date,
  };
}

export function mapSavingsInvestmentResponse(
  raw: RawSavingsInvestmentResponse,
): SavingsInvestmentData {
  const accounts = raw.accounts.map((account) => ({
    accountNum: account.account_num,
    prodName: account.prod_name,
    balanceAmt: account.balance_amt,
  }));

  return {
    accounts,
    totalBalance: accounts.reduce((sum, account) => sum + account.balanceAmt, 0),
  };
}
