import { useLocation } from 'react-router-dom';
import { useConnectionStore, getOverallStatus } from '../stores/connectionStore';
import type { InvestmentProfile } from '../../investmentSurvey/types/survey';
import { SurveyResultScreen } from '../../investmentSurvey/screens/SurveyResultScreen';

export function InvestmentProfilePlaceholderScreen() {
  const location = useLocation();
  const items = useConnectionStore((state) => state.items);
  const profile = (location.state as { profile?: InvestmentProfile } | null)?.profile;

  if (profile) {
    return <SurveyResultScreen profile={profile} connected={getOverallStatus(items) === 'success'} />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-xl font-bold text-[#1A1A2E]">투자성향 진단</h1>
      <p className="mt-3 text-sm text-[#6B7280]">
        화면 내용은 다음 작업에서 구현 예정이에요.
        <br />
        (네비게이션 연결 확인용 placeholder)
      </p>
    </div>
  );
}
