import { useConnectionStore } from '../stores/connectionStore';
import type { ConnectionCategory } from '../types/connection';
import { fetchConnectionItem } from './fetchConnectionData';
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
