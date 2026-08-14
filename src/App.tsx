import { useState } from 'react';
import { useConnectionStore } from './features/mydata/stores/connectionStore';
import { mockScenarios, type MockScenario } from './features/mydata/mocks/scenarios';
import { ConnectionResultList } from './features/mydata/components/ConnectionResultList';
import type { ConnectionCategory } from './features/mydata/types/connection';

const CATEGORIES: ConnectionCategory[] = [
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
];

function App() {
  const setItemStatus = useConnectionStore((state) => state.setItemStatus);
  const [isLoading, setIsLoading] = useState(false);

  // 실제 API 붙이면 이 setTimeout 자리에 loadAllConnectionItems 호출이 들어감
  function runScenario(scenario: MockScenario) {
    setIsLoading(true);
    CATEGORIES.forEach((category) => setItemStatus(category, { status: 'loading' }));

    setTimeout(() => {
      CATEGORIES.forEach((category) => setItemStatus(category, mockScenarios[scenario][category]));
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-100 py-10">
      <div className="flex gap-3">
        <button
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => runScenario('success')}
          disabled={isLoading}
        >
          성공 시나리오
        </button>
        <button
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => runScenario('partialFailure')}
          disabled={isLoading}
        >
          부분 실패 시나리오
        </button>
      </div>

      <ConnectionResultList />
    </div>
  );
}

export default App;
