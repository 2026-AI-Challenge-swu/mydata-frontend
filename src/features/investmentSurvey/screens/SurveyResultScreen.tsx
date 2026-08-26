import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvestmentProfile, SurveyQuestion } from '../types/survey';
import { DatabaseIcon } from '../components/icons';
import { ConsultantSummaryTab } from './ConsultantSummaryTab';

interface SurveyResultScreenProps {
  profile: InvestmentProfile;
  questions: SurveyQuestion[];
  answers: Record<string, number>;
  connected: boolean;
}

type ResultTab = 'my-result' | 'consultant-summary';

export function SurveyResultScreen({ profile, questions, answers, connected }: SurveyResultScreenProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ResultTab>('my-result');

  return (
    <div className="flex w-full flex-1 flex-col bg-[#FAFAF7]">
      <div className="flex w-full border-b-[0.667px] border-black/8">
        <button
          className={`flex-1 border-b-2 py-4 text-center text-sm leading-[21px] font-bold ${
            activeTab === 'my-result' ? 'border-[#2A78D6] text-[#2A78D6]' : 'border-transparent text-[#6B7280]'
          }`}
          onClick={() => setActiveTab('my-result')}
        >
          내 결과
        </button>
        <button
          className={`flex-1 border-b-2 py-4 text-center text-sm leading-[21px] font-bold ${
            activeTab === 'consultant-summary' ? 'border-[#2A78D6] text-[#2A78D6]' : 'border-transparent text-[#6B7280]'
          }`}
          onClick={() => setActiveTab('consultant-summary')}
        >
          상담용 요약
        </button>
      </div>

      {activeTab === 'consultant-summary' ? (
        <ConsultantSummaryTab profile={profile} questions={questions} answers={answers} connected={connected} />
      ) : (
        <MyResultTab profile={profile} connected={connected} navigate={navigate} />
      )}
    </div>
  );
}

function MyResultTab({
  profile,
  connected,
  navigate,
}: {
  profile: InvestmentProfile;
  connected: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pt-6 pb-10">
        {!connected && (
          <div className="flex items-start gap-2.5 rounded-2xl border-[0.667px] border-[#FEE685] bg-[#FFFBEB] px-4 py-3.5">
            <span className="text-lg leading-[28px]">💡</span>
            <p className="text-[13px] leading-[21.125px] text-[#BB4D00]">
              마이데이터를 연동하면 실제 자산 기반으로 훨씬 정확한 결과를 볼 수 있어요
            </p>
          </div>
        )}

        <div className="flex w-full flex-col items-center rounded-2xl bg-[#EBF3FF] p-6">
          <span className="text-5xl leading-[48px]">{profile.emoji}</span>
          <h1 className="mt-3 text-center text-[26px] leading-[39px] font-extrabold text-[#2A78D6]">{profile.nickname}</h1>
          <span className="mt-2 inline-flex items-center rounded-full bg-[#C8E3FF] px-3 py-1 text-[11px] leading-[16.5px] font-bold text-[#2A78D6]">
            공식 분류: {profile.officialName} {profile.grade}등급
          </span>
          <p className="mt-3 max-w-[294px] text-center text-[13px] leading-[21.125px] text-[#6B7280]">{profile.description}</p>
        </div>

        {!connected && (
          <div className="flex w-full flex-col rounded-2xl bg-[#1A1A2E] p-5">
            <p className="text-[15px] leading-[22.5px] font-bold text-white">내 실제 연금 상황까지 반영하면</p>
            <p className="mt-1 text-[13px] leading-[19.5px] text-[#BEDBFF]">훨씬 정확한 분석과 추천을 받을 수 있어요</p>
            <button
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm leading-[21px] font-bold text-[#1A1A2E]"
              onClick={() => navigate('/mydata/consent')}
            >
              <DatabaseIcon />
              마이데이터 연동하기
            </button>
          </div>
        )}
      </div>

      {!connected && (
        <div className="w-full border-t-[0.667px] border-black/8 bg-[#FAFAF7] px-6 pt-4 pb-4">
          <button
            className="w-full rounded-2xl bg-[#1A1A2E] py-4 text-[15px] leading-[22.5px] font-bold text-white"
            onClick={() => navigate('/')}
          >
            홈으로
          </button>
        </div>
      )}
    </>
  );
}
