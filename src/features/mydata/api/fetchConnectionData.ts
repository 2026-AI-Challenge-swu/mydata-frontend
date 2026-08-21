import axios from 'axios';
import { httpClient } from './httpClient';
import type { ConnectionCategory, ItemStatus, NationalPensionData } from '../types/connection';
import type {
  RawDcRetirementPensionResponse,
  RawIrpPersonalPensionResponse,
  RawSavingsInvestmentResponse,
} from '../types/rawApiResponses';
import {
  mapRetirementPensionResponse,
  mapPersonalPensionResponse,
  mapSavingsInvestmentResponse,
} from './mappers';
import type { MockScenario } from '../mocks/scenarios';

const ENDPOINT_PATH: Record<ConnectionCategory, string> = {
  nationalPension: 'national-pension',
  retirementPension: 'retirement-pension',
  personalPension: 'personal-pension',
  savingsInvestment: 'savings-investment',
};

// 백엔드가 카테고리별로 다른 모양(raw 스펙 그대로 또는 국민연금은 domain 그대로)의 JSON을 주기 때문에,
// 여기서 카테고리에 맞는 매퍼를 골라서 domain 타입으로 변환.
function toDomainData(category: ConnectionCategory, data: unknown) {
  switch (category) {
    case 'nationalPension':
      return data as NationalPensionData;
    case 'retirementPension':
      return mapRetirementPensionResponse(data as RawDcRetirementPensionResponse);
    case 'personalPension':
      return mapPersonalPensionResponse(data as RawIrpPersonalPensionResponse);
    case 'savingsInvestment':
      return mapSavingsInvestmentResponse(data as RawSavingsInvestmentResponse);
  }
}

// axios 에러(백엔드가 502 + {message, retryable}로 응답한 경우)를 ItemStatus의 error 케이스로 변환.
function toErrorStatus(error: unknown): ItemStatus {
  if (axios.isAxiosError(error) && error.response) {
    const { message, retryable } = error.response.data as { message: string; retryable: boolean };
    return { status: 'error', message, retryable };
  }
  throw error;
}

export async function fetchConnectionItem<C extends ConnectionCategory>(
  category: C,
  scenario: MockScenario = 'success',
): Promise<ItemStatus<C>> {
  try {
    const response = await httpClient.get(ENDPOINT_PATH[category], { params: { scenario } });
    return { status: 'success', data: toDomainData(category, response.data) } as ItemStatus<C>;
  } catch (error) {
    return toErrorStatus(error) as ItemStatus<C>;
  }
}

export async function retryConnectionItem<C extends ConnectionCategory>(
  category: C,
): Promise<ItemStatus<C>> {
  try {
    const response = await httpClient.post(`${ENDPOINT_PATH[category]}/retry`);
    return { status: 'success', data: toDomainData(category, response.data) } as ItemStatus<C>;
  } catch (error) {
    return toErrorStatus(error) as ItemStatus<C>;
  }
}
