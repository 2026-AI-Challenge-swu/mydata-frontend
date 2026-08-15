import { useConnectionStore } from '../stores/connectionStore';
import type { ConnectionCategory } from '../types/connection';
import { fetchConnectionItem, retryConnectionItem } from './fetchConnectionData';
import type { MockScenario } from '../mocks/scenarios';

const CATEGORIES: ConnectionCategory[] = [
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
];

// 4개 항목을 한번에 "불러오는" 흉내를 냄.
// 각 항목을 loading으로 먼저 바꾼 뒤, 개별적으로 fetch가 끝나는 대로 store에 반영.
// (Promise.all로 병렬 실행 — 한 항목이 늦어도 다른 항목 결과가 먼저 화면에 반영됨)
export async function loadAllConnectionItems(scenario: MockScenario = 'success'): Promise<void> {
  const { setItemStatus } = useConnectionStore.getState();

  CATEGORIES.forEach((category) => {
    setItemStatus(category, { status: 'loading' });
  });

  await Promise.all(
    CATEGORIES.map(async (category) => {
      const result = await fetchConnectionItem(category, scenario);
      setItemStatus(category, result);
    }),
  );
}

// 실패(error) 상태이면서 재시도 가능한 항목만 골라 다시 조회.
// retryable이 false인 항목(국민연금 등 구조적 실패)은 대상에서 제외하고 그대로 둠.
export async function retryFailedItems(): Promise<void> {
  const { items, setItemStatus } = useConnectionStore.getState();

  const retryTargets = CATEGORIES.filter((category) => {
    const item = items[category];
    return item.status === 'error' && item.retryable !== false;
  });

  retryTargets.forEach((category) => {
    setItemStatus(category, { status: 'loading' });
  });

  await Promise.all(
    retryTargets.map(async (category) => {
      const result = await retryConnectionItem(category);
      setItemStatus(category, result);
    }),
  );
}
