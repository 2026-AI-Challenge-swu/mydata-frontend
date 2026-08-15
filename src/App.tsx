import { useState } from 'react';
import { useConnectionStore, getOverallStatus } from './features/mydata/stores/connectionStore';
import { loadAllConnectionItems, retryFailedItems } from './features/mydata/api/loadAllConnectionItems';
import type { MockScenario } from './features/mydata/mocks/scenarios';
import { ConnectionResultList } from './features/mydata/components/ConnectionResultList';
import { ConnectionFailureScreen } from './features/mydata/components/ConnectionFailureScreen';

function App() {
  const items = useConnectionStore((state) => state.items);
  const overallStatus = getOverallStatus(items);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScenario, setLastScenario] = useState<MockScenario>('success');

  async function runScenario(scenario: MockScenario) {
    setLastScenario(scenario);
    setIsLoading(true);
    await loadAllConnectionItems(scenario);
    setIsLoading(false);
  }

  async function handleRetryFailed() {
    setIsLoading(true);
    await retryFailedItems();
    setIsLoading(false);
  }

  function handleContinue() {
    // 리포트 화면으로 넘어가는 라우팅은 아직 없어서 콘솔로만 확인
    console.log('성공한 정보로 다음 단계 진행');
  }

  function handleSkip() {
    console.log('연동 없이 테스트만 진행');
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
        <button
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => runScenario('failure')}
          disabled={isLoading}
        >
          전체 실패 시나리오
        </button>
      </div>

      {overallStatus === 'failure' ? (
        <ConnectionFailureScreen onRetry={() => runScenario(lastScenario)} onSkip={handleSkip} />
      ) : (
        <ConnectionResultList onContinue={handleContinue} onRetryFailed={handleRetryFailed} />
      )}
    </div>
  );
}

export default App;
