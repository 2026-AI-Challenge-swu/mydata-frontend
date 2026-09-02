import { useLocation, useNavigate } from 'react-router-dom';
import { useConnectionStore, getOverallStatus } from '../../mydata/stores/connectionStore';
import { ConsultantSummaryTab } from './ConsultantSummaryTab';
import type { InvestmentProfile, SurveyQuestion } from '../types/survey';

interface NavigationState {
  profile?: InvestmentProfile;
  questions?: SurveyQuestion[];
  answers?: Record<string, number>;
}

// 화면5(전문가용 리포트) — "상담용 요약" 탭의 "더 자세한 리포트 보기" 버튼으로만 진입.
// 직접 URL로 들어오는 등 필요한 state가 없으면 설문으로 돌려보냄.
export function ExpertReportScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useConnectionStore((state) => state.items);
  const { profile, questions, answers } = (location.state as NavigationState | null) ?? {};

  if (!profile || !questions || !answers) {
    navigate('/mydata/survey', { replace: true });
    return null;
  }

  return (
    <div className="flex w-full flex-1 flex-col bg-[#FAFAF7]">
      <ConsultantSummaryTab
        profile={profile}
        questions={questions}
        answers={answers}
        connected={getOverallStatus(items) === 'success'}
      />
    </div>
  );
}
