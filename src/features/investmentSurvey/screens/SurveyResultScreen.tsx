import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvestmentProfile, SurveyQuestion } from '../types/survey';
import type { RetirementReportResult } from '../api/retirementReportApi';
import { AiAvatarIcon, DatabaseIcon, ReportIcon } from '../components/icons';
import { FloatingChatButton } from '../components/FloatingChatButton';
import { CounselingSummaryTab } from '../components/CounselingSummaryTab';
import { getRecommendedProductGroup } from '../constants/recommendedProductGroups';

interface SurveyResultScreenProps {
  profile: InvestmentProfile;
  questions: SurveyQuestion[];
  answers: Record<string, number>;
  connected: boolean;
  // 마이데이터 연동됐을 때만 존재 — useRetirementReport로 만든 리포트를 부모(InvestmentProfilePlaceholderScreen)가
  // 내려줌. "AI 한줄 조언"/"지금 당장 할 일"은 이 값에서 그대로 뽑아 써서, 뒤에 나오는 전문가 리포트
  // 화면과 내용이 절대 어긋나지 않게 함(같은 리포트를 두 화면이 나눠서 보여주는 구조).
  retirementReport: RetirementReportResult | null;
}

// road_map은 백엔드가 5단계(이번 달/다음 달/3개월 후/1년 후/매년)로 내려주는데, "내 결과" 화면은
// 그중 앞 3개만 "이번 달/다음 달/이후"로 뭉뚱그려 보여줌(Figma 시안 기준 — 나머지 2단계는 전문가
// 리포트의 "실행 로드맵" 섹션에서 전체를 다 보여줌).
const QUICK_TODO_LABELS = ['이번 달', '다음 달', '이후'];
// 아이콘 배경은 Figma 시안 기준 3개 다 같은 연한 파랑(#EBF3FF) — 등급별로 다르게 칠했던 이전 버전은 오류였음.
const QUICK_TODO_ICONS = [
  { emoji: '🏦', background: '#EBF3FF' },
  { emoji: '⚡', background: '#EBF3FF' },
  { emoji: '📈', background: '#EBF3FF' },
];

type ResultTab = 'result' | 'summary';

export function SurveyResultScreen({ profile, questions, answers, connected, retirementReport }: SurveyResultScreenProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ResultTab>('result');
  const recommendedProducts = getRecommendedProductGroup(profile.officialName);
  const quickTodos = (retirementReport?.aiReport.road_map ?? []).slice(0, 3);

  return (
    <div className="relative flex w-full flex-1 flex-col bg-[#FAFAF7]">
      <div className="flex w-full border-b-[0.667px] border-black/8">
        <button
          className={`flex-1 border-b-2 py-4 text-center text-sm leading-[21px] font-bold ${
            activeTab === 'result' ? 'border-[#2A78D6] text-[#2A78D6]' : 'border-transparent text-[#6B7280]'
          }`}
          onClick={() => setActiveTab('result')}
        >
          내 결과
        </button>
        <button
          className={`flex-1 border-b-2 py-4 text-center text-sm leading-[21px] font-bold ${
            activeTab === 'summary' ? 'border-[#2A78D6] text-[#2A78D6]' : 'border-transparent text-[#6B7280]'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          상담용 요약
        </button>
      </div>

      {activeTab === 'result' ? (
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pt-6 pb-[75px]">
          {!connected && (
            <div className="flex items-start gap-2.5 rounded-2xl border-[0.667px] border-[#FEE685] bg-[#FFFBEB] px-4 py-3.5">
              <span className="text-lg leading-[28px]">💡</span>
              <p className="text-[13px] leading-[21.125px] text-[#BB4D00]">
                마이데이터를 연동하면 실제 자산 기반으로 훨씬 정확한 결과를 볼 수 있어요
              </p>
            </div>
          )}

          <div
            className="flex w-full flex-col items-center rounded-2xl p-6"
            style={{ backgroundColor: profile.cardBackground }}
          >
            <span className="text-5xl leading-[48px]">{profile.emoji}</span>
            <h1
              className="mt-3 text-center text-[26px] leading-[39px] font-extrabold"
              style={{ color: profile.accentColor }}
            >
              {profile.nickname}
            </h1>
            <span
              className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] leading-[16.5px] font-bold"
              style={{ backgroundColor: profile.badgeBackground, color: profile.accentColor }}
            >
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
                onClick={() => navigate('/mydata/consent', { state: { returnTo: 'investment-profile', profile } })}
              >
                <DatabaseIcon />
                마이데이터 연동하기
              </button>
            </div>
          )}

          {recommendedProducts.length > 0 && (
            <div className="flex w-full flex-col rounded-2xl border border-black/8 bg-white p-5">
              <h2 className="text-sm leading-[21px] font-bold text-[#1A1A2E]">추천 상품군</h2>
              <div className="mt-3 flex flex-col gap-2">
                {/* Figma 실측: 태그마다 폭이 다 다름(Width: Hug — 텍스트 길이에 맞춰 자기 크기만큼만 차지)이면서도
                    한 줄에 항상 2개씩. flex-wrap은 내용에 따라 3개+1개로도 묶일 수 있어서, 2개씩 행을 직접 나눠
                    각 행 안에서만 자기 content-width를 유지하게 함. 배경/글자색은 "공식 분류" 배지와 같은 방식으로
                    등급별 강조색을 따름(Figma 실측: 안정형 카드는 초록, 안정추구형은 파랑 등 카드 테마 색 그대로). */}
                {Array.from({ length: Math.ceil(recommendedProducts.length / 2) }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {recommendedProducts.slice(rowIndex * 2, rowIndex * 2 + 2).map((product) => (
                      <span
                        key={product}
                        className="rounded-full px-3 py-1.5 text-[12px] leading-[18px] font-bold"
                        style={{ backgroundColor: profile.badgeBackground, color: profile.accentColor }}
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-[15px] text-[#6B7280]">
                * 10문항 응답 결과를 은행권 표준 위험성향 5단계 기준으로 산출한 결과예요.
              </p>
            </div>
          )}

          {connected && (
            <div className="flex w-full flex-col rounded-2xl border border-black/8 bg-white p-5">
              <h2 className="flex items-center gap-1.5 text-sm leading-[21px] font-bold text-[#1A1A2E]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF3FF]">
                  <AiAvatarIcon color="#2A78D6" />
                </span>
                AI 한줄 조언
              </h2>
              <p className="mt-2 text-[13px] leading-[21.125px] text-[#6B7280]">
                {retirementReport ? retirementReport.aiReport.total_comment : '불러오는 중...'}
              </p>
            </div>
          )}

          {connected && (
            <div className="flex w-full flex-col rounded-2xl border border-black/8 bg-white p-5">
              <h2 className="text-sm leading-[21px] font-bold text-[#1A1A2E]">지금 당장 할 일</h2>
              <ul className="mt-3 flex flex-col gap-4">
                {QUICK_TODO_LABELS.map((label, index) => (
                  <li key={label} className="relative flex items-center gap-3">
                    {/* Figma 실측값: 행 사이 간격 16px, 연결선도 정확히 2×16px로 그 간격을 꽉 채움
                        (원 자체는 각 행 안에서 위아래로 살짝 여유가 있어서 선이 원 테두리에 직접 닿진 않음). */}
                    {index > 0 && (
                      <div className="absolute -top-4 left-[15px] h-4 w-[2px] bg-black/8" aria-hidden="true" />
                    )}
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                      style={{ backgroundColor: QUICK_TODO_ICONS[index]?.background }}
                    >
                      {QUICK_TODO_ICONS[index]?.emoji}
                    </span>
                    <div>
                      <p className="text-[11px] leading-[16.5px] font-bold text-[#2A78D6]">{label}</p>
                      <p className="text-[13px] leading-[19.5px] text-[#1A1A2E]">
                        {quickTodos[index]?.todo ?? '불러오는 중...'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <CounselingSummaryTab profile={profile} connected={connected} retirementReport={retirementReport} />
        </div>
      )}

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

      {/* CTA를 스크롤 영역 밖으로 빼서 화면 하단에 고정 — 챗봇 플로팅 버튼이 이 바로 위에 뜨도록 하기 위함.
          Figma 실측: "상담용 요약" 탭도 "내 결과" 탭과 똑같이 이 CTA+플로팅 챗봇이 항상 붙어있음. */}
      {connected && (
        <div className="w-full border-t-[0.667px] border-black/8 bg-[#FAFAF7] px-6 pt-4 pb-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A2E] py-4 text-sm leading-[21px] font-bold text-white"
            onClick={() =>
              navigate('/mydata/investment-profile/report', { state: { profile, questions, answers, retirementReport } })
            }
          >
            <ReportIcon />
            더 자세한 리포트 보기
          </button>
        </div>
      )}

      {connected && (
        <FloatingChatButton
          accentColor={profile.accentColor}
          bottomClassName="bottom-[86px]"
          onClick={() => navigate('/mydata/investment-profile/chat', { state: { profile } })}
        />
      )}
    </div>
  );
}
