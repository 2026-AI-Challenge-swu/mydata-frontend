import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConnectionStore, getOverallStatus } from '../stores/connectionStore';
import { loadAllConnectionItems, retryFailedItems } from '../api/loadAllConnectionItems';
import type { MockScenario } from '../mocks/scenarios';
import type { InvestmentProfile } from '../../investmentSurvey/types/survey';
import { ConnectionResultList } from '../components/ConnectionResultList';
import { ConnectionFailureScreen } from '../components/ConnectionFailureScreen';

interface ConnectionFlowState {
  returnTo?: 'investment-profile';
  profile?: InvestmentProfile;
}

export function MydataConnectionScreen() {
  const items = useConnectionStore((state) => state.items);
  const overallStatus = getOverallStatus(items);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScenario, setLastScenario] = useState<MockScenario>('success');
  const navigate = useNavigate();
  const location = useLocation();
  const flowState = location.state as ConnectionFlowState | null;

  async function runScenario(scenario: MockScenario) {
    setLastScenario(scenario);
    setIsLoading(true);
    await loadAllConnectionItems(scenario);
    setIsLoading(false);
  }

  // 동의화면에서 "동의하고 불러오기"로 넘어오면 버튼 클릭 없이 바로 조회가 시작돼야 함
  // (아래 개발용 시나리오 버튼은 QA 확인용으로만 남겨둠)
  // zustand 스토어(외부 상태)만 갱신하는 loadAllConnectionItems를 직접 불러서,
  // 컴포넌트 로컬 state(setIsLoading 등)를 effect 안에서 동기 호출하지 않도록 함
  useEffect(() => {
    loadAllConnectionItems('success');
  }, []);

  async function handleRetryFailed() {
    setIsLoading(true);
    await retryFailedItems();
    setIsLoading(false);
  }

  function handleContinue() {
    if (flowState?.returnTo === 'investment-profile' && flowState.profile) {
      navigate('/mydata/investment-profile', { state: { profile: flowState.profile } });
      return;
    }
    navigate('/mydata/report');
  }

  function handleSkip() {
    navigate('/mydata/survey');
  }

  return (
    <div className="flex min-h-screen flex-col items-stretch bg-slate-100 sm:items-center sm:gap-6 sm:py-10">
      {/* 개발용 시나리오 컨트롤 — 실제 화면(폰 프레임) 밖에 둠 */}
      <div className="flex justify-center gap-3 p-4 sm:p-0">
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

      {/* 폰 프레임 — sm(640px) 이상에서는 390x931 미리보기 카드, 그 밑(실제 폰 폭)에서는 화면 전체를 꽉 채움 */}
      <div className="flex w-full flex-1 flex-col overflow-hidden bg-white sm:w-[390px] sm:flex-none sm:min-h-[931.333px] sm:rounded-[32px] sm:border sm:border-slate-300 sm:shadow-xl">
        <div className="px-6 pt-12 text-[13px] leading-[19.5px] font-bold text-[#6B7280]">마이데이터 연동</div>

        <div className="flex-1">
          {overallStatus === 'failure' ? (
            <ConnectionFailureScreen onRetry={() => runScenario(lastScenario)} onSkip={handleSkip} />
          ) : (
            <div className="px-6 py-8">
              <ConnectionResultList onContinue={handleContinue} onRetryFailed={handleRetryFailed} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
