// 투자성향 5개 등급(officialName+grade)별 "추천 상품군" — Figma 시안(투자성향테스트결과 화면) 고정값.
// 마이데이터/AI 리포트와 달리 매번 계산하는 값이 아니라 등급마다 미리 정해둔 상품 카테고리 4개라
// 정적 테이블로 둠. profile.officialName 기준으로 찾음(officialName은 백엔드 진단 결과의 "공식 분류" 문구).
export const RECOMMENDED_PRODUCT_GROUPS: Record<string, string[]> = {
  안정형: ['원리금보장형 연금저축', 'MMF', '초단기채권형 펀드', '국공채펀드'],
  안정추구형: ['채권혼합형펀드', '인컴펀드', '채권형펀드', '우량회사채펀드'],
  위험중립형: ['균형형 TDF', '주식혼합형펀드', '배당주펀드', '리츠(REITs)펀드'],
  적극투자형: ['국내주식형펀드', '해외주식형펀드', '성장주펀드', '섹터·테마 ETF'],
  공격투자형: ['레버리지·인버스 ETF', '공격형 TDF', '신흥국 주식형펀드', '파생결합증권(ELS/DLS)'],
};

export function getRecommendedProductGroup(officialName: string): string[] {
  return RECOMMENDED_PRODUCT_GROUPS[officialName] ?? [];
}
