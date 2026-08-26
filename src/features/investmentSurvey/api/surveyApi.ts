import { surveyHttpClient } from './httpClient';
import type { InvestmentProfile, SurveyAnswer, SurveyQuestion } from '../types/survey';

export async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await surveyHttpClient.get<SurveyQuestion[]>('/questions');
  return response.data;
}

export async function submitSurveyAnswers(answers: SurveyAnswer[]): Promise<InvestmentProfile> {
  const response = await surveyHttpClient.post<InvestmentProfile>('/responses', { answers });
  return response.data;
}
