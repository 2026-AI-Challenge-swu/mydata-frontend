import type { InvestmentProfile } from '../types/survey';
import { CompassIcon } from './icons';

interface CounselingSummaryTabProps {
  profile: InvestmentProfile;
  connected: boolean;
}

// 포트폴리오 추천/노후자금 분석/절세 효과 등은 아직 그 데이터를 주는 API가 없어서,
// 지금 실제로 알 수 있는 투자성향 진단 결과만 담음 (Figma "AI 연금 설계 리포트" 시안 중 일부).
export function CounselingSummaryTab({ profile, connected }: CounselingSummaryTabProps) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="bg-[#1A1A2E] px-8 py-7">
        <div className="flex items-center gap-2">
          <CompassIcon />
          <span className="text-xs leading-[18px] font-bold tracking-[1.2px] text-[#8EC5FF] uppercase">연금나침반</span>
        </div>
        <h2 className="mt-3 text-[22px] leading-[33px] font-extrabold text-white">AI 연금 설계 리포트</h2>
        <p className="mt-2 text-xs leading-[18px] text-[#99A1AF]">기준일: {today}</p>
      </div>

      <div className="flex flex-col gap-7 px-8 py-7">
        <section>
          <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">진단 결과</p>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: profile.cardBackground }}
            >
              <span className="text-3xl leading-none">{profile.emoji}</span>
            </div>
            <div>
              <p className="text-xl leading-[30px] font-extrabold" style={{ color: profile.accentColor }}>
                {profile.nickname}
              </p>
              <span
                className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] leading-[16.5px] font-bold"
                style={{ backgroundColor: profile.badgeBackground, color: profile.accentColor }}
              >
                {profile.officialName} {profile.grade}등급
              </span>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-[21.125px] text-[#6B7280]">{profile.description}</p>
        </section>

        <section>
          <p className="text-[10px] leading-[15px] font-bold tracking-[1px] text-[#6B7280] uppercase">데이터 소스</p>
          <div className="mt-2.5 flex gap-2">
            <span className="rounded-full bg-[#EBF3FF] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#2A78D6]">
              진단 테스트 완료
            </span>
            {connected ? (
              <span className="rounded-full bg-[#D6F5E6] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#1FAB6A]">
                마이데이터 연동됨
              </span>
            ) : (
              <span className="rounded-full bg-[#F0F0EC] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#6B7280]">
                마이데이터 미연동
              </span>
            )}
          </div>
        </section>

        <p className="border-t border-black/8 pt-5 text-[10px] leading-[16.25px] text-[rgba(107,114,128,0.7)]">
          본 리포트는 AI 분석 결과로 실제 수익을 보장하지 않으며, 투자 결정의 참고 자료로만 활용하시기 바랍니다. 투자는
          원금손실 위험이 있으며, 투자 결정에 대한 책임은 투자자 본인에게 있습니다. 금융투자상품에 관한 투자권유는 별도
          상담을 통해 이루어집니다.
        </p>
      </div>
    </div>
  );
}
