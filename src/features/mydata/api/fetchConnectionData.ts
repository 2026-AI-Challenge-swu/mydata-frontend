import type { ConnectionCategory, ItemStatus } from '../types/connection';
import { mockScenarios, type MockScenario } from '../mocks/scenarios';

const MOCK_DELAY_MS = 800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 실제 마이데이터 API가 붙기 전까지 사용하는 mock fetch.
// 나중에 실 API로 교체할 땐 이 함수 내부만 axios 호출로 바꾸면 되고,
// 호출하는 쪽(스토어/컴포넌트)은 Promise<ItemStatus<C>>를 그대로 받으므로 수정할 필요 없음.
export async function fetchConnectionItem<C extends ConnectionCategory>(
  category: C,
  scenario: MockScenario = 'success',
): Promise<ItemStatus<C>> {
  await delay(MOCK_DELAY_MS);
  return mockScenarios[scenario][category];
}
