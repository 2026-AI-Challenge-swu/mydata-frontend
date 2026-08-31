import type { NationalPensionData } from '../../types/connection';
import type {
  RawDcRetirementPensionResponse,
  RawIrpPersonalPensionResponse,
  RawSavingsInvestmentResponse,
  RawBankTransactionResponse,
} from '../../types/rawApiResponses';

// 페르소나 나이(만 29세) — 기획팀 페르소나 설계 문서 기준. 마이데이터로 연동되는 값이 아니라 상수로 둠.
export const kimMinjunAge = 29;

// 국민연금: 공식 API 스펙이 없어(금융 마이데이터 대상 아님) raw 없이 domain 타입으로 바로 mock
// 값은 기획팀 페르소나 설계 문서 기준 (예상수령액 32만원/월 — 인터페이스 명세서에서 92만원 오기 확인 후 정정, 가입 4년차, 65세 기준)
export const kimMinjunNationalPension: NationalPensionData = {
  estimatedMonthlyAmount: 320000,
  paymentStartAge: 65,
  contributionYears: 4,
};

// 아래부터는 실제 axios가 반환할 응답 JSON을 그대로 흉내 (DC-002, IRP-002, 은행-001/003 스펙 기준)
// 퇴직연금 잔액 320만원은 기획팀 설계 문서 기준. eval_amt(평가금액)는 문서에 별도 명시가 없어 balance_amt와 동일하게 둠
export const kimMinjunRetirementPensionRaw: RawDcRetirementPensionResponse = {
  balance_amt: 3200000,
  eval_amt: 3200000,
  issue_date: '2021-03-15',
};

export const kimMinjunPersonalPensionRaw: RawIrpPersonalPensionResponse = {
  accum_amt: 4300000,
  eval_amt: 4450000,
  employer_amt: 0, // 개인형 IRP는 보통 사용자(회사) 부담금 없이 본인이 자율 납입
  employee_amt: 4300000,
  issue_date: '2022-06-01',
  rcv_start_date: '2054-01-01',
};

// 예금 2,000만원 + 주식·ETF 1,200만원(페르소나 기준표) — 주식/ETF 세부 비율은 문서에 없어서 700/500으로 임의 분리
export const kimMinjunSavingsInvestmentRaw: RawSavingsInvestmentResponse = {
  accounts: [
    { account_num: '110-123-456789', prod_name: '예금', balance_amt: 20000000 },
    { account_num: '110-987-654321', prod_name: '주식', balance_amt: 7000000 },
    { account_num: '110-555-112233', prod_name: 'ETF', balance_amt: 5000000 },
  ],
};

// 월급(세후) 340만원 / 평균 소비 210만원 / 월 투자 40만원 (페르소나 기준표 기준, 은행-004 스펙 필드명)
export const kimMinjunBankTransactionRaw: RawBankTransactionResponse = {
  salary_amt: 3400000,
  expense_amt: 2100000,
  investment_amt: 400000,
};
