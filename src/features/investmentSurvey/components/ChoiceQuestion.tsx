import type { SurveyQuestion } from '../types/survey';
import { CheckBadgeIcon } from './icons';

interface ChoiceQuestionProps {
  question: SurveyQuestion;
  selected?: number;
  onSelect: (order: number) => void;
}

export function ChoiceQuestion({ question, selected, onSelect }: ChoiceQuestionProps) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {question.options.map((option) => {
        const isSelected = option.order === selected;
        return (
          <button
            key={option.order}
            className={`flex w-full items-center gap-3.5 rounded-2xl border-[0.667px] px-4 py-3.5 text-left ${
              isSelected
                ? 'border-[#2A78D6] bg-[#EBF3FF] shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]'
                : 'border-black/8 bg-white'
            }`}
            onClick={() => onSelect(option.order)}
          >
            <span className="flex-1 text-sm leading-[19.25px] font-bold text-[#1A1A2E]">{option.text}</span>
            {isSelected && <CheckBadgeIcon />}
          </button>
        );
      })}
    </div>
  );
}
