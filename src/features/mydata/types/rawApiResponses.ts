// 은행업권 마이데이터 API 규격(developers.mydatakorea.org) 원본 응답 필드 그대로.
// 실제 axios 응답이 이 모양으로 옴 — 절대 임의로 고치지 말고 스펙 바뀌면 여기만 수정.

// DC형 퇴직연금 기본정보 (API ID: DC-002)
export interface RawDcRetirementPensionResponse {
  balance_amt: number;
  eval_amt: number;
  issue_date: string;
}

// 개인형 IRP 계좌 기본정보 (API ID: IRP-002)
export interface RawIrpPersonalPensionResponse {
  accum_amt: number;
  eval_amt: number;
  employer_amt: number;
  employee_amt: number;
  issue_date: string;
  rcv_start_date: string;
}

// 계좌 목록(은행-001) + 추가정보(은행-003)를 합쳐서 항목당 필요한 필드만 추림
export interface RawSavingsAccount {
  account_num: string;
  prod_name: string;
  balance_amt: number;
}

export interface RawSavingsInvestmentResponse {
  accounts: RawSavingsAccount[];
}

// 은행 거래내역 기본정보 (API ID: 은행-004)
export interface RawBankTransactionResponse {
  salary_amt: number;
  expense_amt: number;
  investment_amt: number;
}
