import type { ConnectionCategory, ItemStatus } from '../types/connection';
import {
  mapRetirementPensionResponse,
  mapPersonalPensionResponse,
  mapSavingsInvestmentResponse,
} from '../api/mappers';
import {
  kimMinjunNationalPension,
  kimMinjunRetirementPensionRaw,
  kimMinjunPersonalPensionRaw,
  kimMinjunSavingsInvestmentRaw,
} from './personas/kimMinjun';

export type MockScenario = 'success' | 'partialFailure';

// raw mock → 매퍼 통과 → domain 타입. 실제 API 붙여도 이 조립 방식은 동일하게 유지됨.
const retirementPensionSuccess = mapRetirementPensionResponse(kimMinjunRetirementPensionRaw);
const personalPensionSuccess = mapPersonalPensionResponse(kimMinjunPersonalPensionRaw);
const savingsInvestmentSuccess = mapSavingsInvestmentResponse(kimMinjunSavingsInvestmentRaw);

// 카테고리마다 성공/실패 중 뭐가 나올지 시나리오별로 미리 정의해둔 표
export const mockScenarios: {
  [S in MockScenario]: { [C in ConnectionCategory]: ItemStatus<C> };
} = {
  success: {
    nationalPension: { status: 'success', data: kimMinjunNationalPension },
    retirementPension: { status: 'success', data: retirementPensionSuccess },
    personalPension: { status: 'success', data: personalPensionSuccess },
    savingsInvestment: { status: 'success', data: savingsInvestmentSuccess },
  },
  // 국민연금은 금융 마이데이터 대상이 아니라 실제로도 이용기관 등록 심사 전이라 연계 불가
  // → 부분 실패 시나리오의 실패 사유를 그 이유로 명시
  partialFailure: {
    nationalPension: {
      status: 'error',
      message: '국민연금공단 연계 실패: 이용기관 등록 심사 미완료',
    },
    retirementPension: { status: 'success', data: retirementPensionSuccess },
    personalPension: { status: 'success', data: personalPensionSuccess },
    savingsInvestment: { status: 'success', data: savingsInvestmentSuccess },
  },
};
