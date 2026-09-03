export type QuestionDisplayType = 'CHOICE' | 'GAUGE' | 'BINARY';

export interface SurveyOption {
  text: string;
  order: number;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  category: string;
  displayOrder: number;
  displayType: QuestionDisplayType;
  options: SurveyOption[];
}

export interface SurveyAnswer {
  questionId: string;
  selectedOrder: number;
}

export interface InvestmentProfileCategoryScore {
  label: string;
  percent: number;
}

export interface InvestmentProfile {
  totalScore: number;
  type: string;
  grade: number;
  emoji: string;
  officialName: string;
  nickname: string;
  description: string;
  cardBackground: string;
  badgeBackground: string;
  accentColor: string;
  // 투자성향 점수 카드 5개 항목(투자 경험/손실 감내도/투자 기간/수익 추구도/소득 안정성) %.
  // 등급별 확정값 — 백엔드(InvestmentProfileType enum)가 계산해서 내려줌, 클라이언트에서 재계산하지 않음.
  categoryScores: InvestmentProfileCategoryScore[];
}
