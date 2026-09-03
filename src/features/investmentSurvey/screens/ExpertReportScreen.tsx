import { useLocation, useNavigate } from 'react-router-dom';
import { useConnectionStore, getOverallStatus } from '../../mydata/stores/connectionStore';
import { ConsultantSummaryTab } from './ConsultantSummaryTab';
import type { InvestmentProfile, SurveyQuestion } from '../types/survey';
import type { RetirementReportResult } from '../api/retirementReportApi';

interface NavigationState {
  profile?: InvestmentProfile;
  questions?: SurveyQuestion[];
  answers?: Record<string, number>;
  // "내 결과" 화면에서 이미 만들어둔 리포트 — 있으면 ConsultantSummaryTab에 그대로 넘겨서
  // 똑같은 조건으로 다시 호출하지 않게 함.
  retirementReport?: RetirementReportResult | null;
}

// 화면5(전문가용 리포트) — "상담용 요약" 탭의 "더 자세한 리포트 보기" 버튼으로만 진입.
// 직접 URL로 들어오는 등 필요한 state가 없으면 설문으로 돌려보냄.
export function ExpertReportScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useConnectionStore((state) => state.items);
  const { profile, questions, answers, retirementReport } = (location.state as NavigationState | null) ?? {};

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
        initialReport={retirementReport}
      />
    </div>
  );
}
