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
}
