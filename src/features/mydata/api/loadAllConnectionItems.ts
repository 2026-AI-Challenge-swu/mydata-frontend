import { useConnectionStore } from '../stores/connectionStore';
import type { ConnectionCategory } from '../types/connection';
import { fetchConnectionItem, retryConnectionItem } from './fetchConnectionData';
import type { MockScenario } from '../mocks/scenarios';

const CATEGORIES: ConnectionCategory[] = [
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
  'bankTransaction',
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

// 실패(error) 상태인 항목을 전부 다시 조회.
// 국민연금처럼 구조적으로 계속 실패하는 항목도 재시도 자체는 시도하고(로딩→다시 실패),
// retryConnectionItem이 항상 같은 실패를 돌려주므로 결과적으로 실패 상태가 유지됨.
export async function retryFailedItems(): Promise<void> {
  const { items, setItemStatus } = useConnectionStore.getState();

  const retryTargets = CATEGORIES.filter((category) => items[category].status === 'error');

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
