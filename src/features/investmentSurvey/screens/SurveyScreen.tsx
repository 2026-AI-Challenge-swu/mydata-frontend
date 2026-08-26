import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSurveyQuestions, submitSurveyAnswers } from '../api/surveyApi';
import type { SurveyQuestion } from '../types/survey';
import { SurveyHeader } from '../components/SurveyHeader';
import { ChoiceQuestion } from '../components/ChoiceQuestion';
import { GaugeQuestion } from '../components/GaugeQuestion';
import { BinaryQuestion } from '../components/BinaryQuestion';

const SELECT_ADVANCE_DELAY_MS = 250;

export function SurveyScreen() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SurveyQuestion[]>();
  const [loadError, setLoadError] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pendingOrder, setPendingOrder] = useState<number>();
  const [submitting, setSubmitting] = useState(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchSurveyQuestions()
      .then((data) => {
        if (!cancelled) setQuestions(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 bg-[#FAFAF7] px-6 text-center">
        <p className="text-sm text-[#6B7280]">설문 문항을 불러오지 못했어요.</p>
        <button
          className="rounded-2xl bg-[#2A78D6] px-6 py-3 text-sm font-bold text-white"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="flex w-full flex-1 items-center justify-center bg-[#FAFAF7]">
        <p className="text-sm text-[#6B7280]">불러오는 중...</p>
      </div>
    );
  }

  const question = questions[stepIndex];
  const isLast = stepIndex === questions.length - 1;

  async function goToNext(selectedOrder: number) {
    const nextAnswers = { ...answers, [question.id]: selectedOrder };
    setAnswers(nextAnswers);

    if (isLast) {
      setSubmitting(true);
      const profile = await submitSurveyAnswers(
        Object.entries(nextAnswers).map(([questionId, order]) => ({ questionId, selectedOrder: order })),
      );
      // questions/answers도 같이 넘김: 상담용 요약 리포트의 "투자성향 점수" 카테고리별 막대는
      // 서버 응답(총점만 있음)이 아니라 클라이언트가 가진 문항별 카테고리+점수로 계산하기 때문.
      navigate('/mydata/investment-profile', { state: { profile, questions, answers: nextAnswers } });
      return;
    }

    setStepIndex((prev) => prev + 1);
    setPendingOrder(undefined);
  }

  function handleBack() {
    clearTimeout(advanceTimeoutRef.current);
    if (stepIndex === 0) {
      navigate(-1);
      return;
    }
    setStepIndex((prev) => prev - 1);
    setPendingOrder(undefined);
  }

  function handleChoiceSelect(order: number) {
    setPendingOrder(order);
    advanceTimeoutRef.current = setTimeout(() => goToNext(order), SELECT_ADVANCE_DELAY_MS);
  }

  function handleGaugeChangeIndex(index: number) {
    const order = question.options[index].order;
    setAnswers((prev) => ({ ...prev, [question.id]: order }));
  }

  if (submitting) {
    return (
      <div className="flex w-full flex-1 items-center justify-center bg-[#FAFAF7]">
        <p className="text-sm text-[#6B7280]">결과를 계산하는 중...</p>
      </div>
    );
  }

  const gaugeSelectedOrder = answers[question.id] ?? question.options[0].order;
  const gaugeSelectedIndex = question.options.findIndex((option) => option.order === gaugeSelectedOrder);

  return (
    <div className="flex w-full flex-1 flex-col bg-[#FAFAF7]">
      <SurveyHeader step={stepIndex + 1} total={questions.length} onBack={handleBack} />

      <div className="flex flex-1 flex-col px-6 pt-5">
        <h1 className="w-full text-[21px] leading-[28.875px] font-extrabold text-[#1A1A2E]">{question.text}</h1>

        <div className="mt-7 flex w-full flex-1 flex-col">
          {question.displayType === 'CHOICE' && (
            <ChoiceQuestion question={question} selected={pendingOrder ?? answers[question.id]} onSelect={handleChoiceSelect} />
          )}

          {question.displayType === 'GAUGE' && (
            <GaugeQuestion
              question={question}
              selectedIndex={gaugeSelectedIndex}
              onChangeIndex={handleGaugeChangeIndex}
              onNext={() => goToNext(gaugeSelectedOrder)}
            />
          )}

          {question.displayType === 'BINARY' && <BinaryQuestion question={question} onSelect={goToNext} />}
        </div>
      </div>

      <div className="flex h-[66px] w-full items-center justify-center px-6">
        <p className="text-center text-xs leading-[18px] text-[#6B7280]">✏️ 정답은 없어요, 솔직한 마음이면 충분해요</p>
      </div>
    </div>
  );
}
