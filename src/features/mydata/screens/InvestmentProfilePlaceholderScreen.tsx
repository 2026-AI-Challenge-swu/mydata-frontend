import { useLocation } from 'react-router-dom';
import { useConnectionStore, getOverallStatus } from '../stores/connectionStore';
import { getConnectedMydata } from '../utils/assetSummary';
import type { InvestmentProfile, SurveyQuestion } from '../../investmentSurvey/types/survey';
import { SurveyResultScreen } from '../../investmentSurvey/screens/SurveyResultScreen';
import { TARGET_MONTHLY_LIVING_COST, useRetirementReport } from '../../investmentSurvey/hooks/useRetirementReport';

interface NavigationState {
  profile?: InvestmentProfile;
  questions?: SurveyQuestion[];
  answers?: Record<string, number>;
}

export function InvestmentProfilePlaceholderScreen() {
  const location = useLocation();
  const items = useConnectionStore((state) => state.items);
  const { profile, questions, answers } = (location.state as NavigationState | null) ?? {};
  // "내 결과" 화면(SurveyResultScreen)이 여기서 딱 한 번 리포트를 만듦 — 이후 "더 자세한 리포트
  // 보기" 버튼을 누르면 이 결과를 그대로 navigate state에 실어 보내서, 전문가 리포트 화면이 같은
  // 조건으로 다시 호출하지 않고 재사용하게 됨(두 화면 내용이 어긋나지 않게 하는 핵심 지점).
  const retirementReport = useRetirementReport({
    answers: answers ?? {},
    connectedMydata: getConnectedMydata(items),
    targetLivingCost: TARGET_MONTHLY_LIVING_COST,
  });

  if (profile && questions && answers) {
    return (
      <SurveyResultScreen
        profile={profile}
        questions={questions}
        answers={answers}
        connected={getOverallStatus(items) === 'success'}
        retirementReport={retirementReport}
      />
    );
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
