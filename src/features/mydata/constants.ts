import type { ConnectionCategory } from './types/connection';

export const CATEGORY_LABELS: Record<ConnectionCategory, string> = {
  nationalPension: '국민연금 가입내역',
  retirementPension: '퇴직연금 현황',
  personalPension: '개인연금 가입여부',
  savingsInvestment: '예적금·투자상품 현황',
  bankTransaction: '은행 거래내역',
};
