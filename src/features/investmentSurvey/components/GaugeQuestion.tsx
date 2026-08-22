import type { SurveyQuestion } from '../types/survey';

interface GaugeQuestionProps {
  question: SurveyQuestion;
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  onNext: () => void;
}

export function GaugeQuestion({ question, selectedIndex, onChangeIndex, onNext }: GaugeQuestionProps) {
  const { options } = question;
  const percent = (selectedIndex / (options.length - 1)) * 100;
  const current = options[selectedIndex];

  return (
    <div className="flex w-full flex-col">
      <div className="flex h-6 items-center">
        <input
          type="range"
          min={0}
          max={options.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(event) => onChangeIndex(Number(event.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#2A78D6] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2A78D6] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          style={{ background: `linear-gradient(to right, #2A78D6 ${percent}%, #E5E7EB ${percent}%)` }}
          aria-label={question.text}
        />
      </div>

      <div className="mt-2 flex items-start justify-between px-0.5">
        {options.map((option) => (
          <span key={option.order} className="text-[10px] leading-[15px] text-[#6B7280]">
            {option.text}
          </span>
        ))}
      </div>

      <div className="mt-5 mb-8 flex w-full flex-col items-center rounded-2xl border-[0.667px] border-black/8 bg-white px-4 py-3.5">
        <p className="text-center text-sm leading-[21px] font-bold text-[#1A1A2E]">{current.text}</p>
      </div>

      <button className="w-full rounded-2xl bg-[#2A78D6] py-4 text-base leading-6 font-bold text-white" onClick={onNext}>
        다음으로
      </button>
    </div>
  );
}
