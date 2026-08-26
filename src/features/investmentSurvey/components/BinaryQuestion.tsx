import type { SurveyQuestion } from '../types/survey';
import { LeftArrowIcon, RightArrowIcon } from './icons';

interface BinaryQuestionProps {
  question: SurveyQuestion;
  onSelect: (order: number) => void;
}

export function BinaryQuestion({ question, onSelect }: BinaryQuestionProps) {
  const [left, right] = question.options;

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-2xl border-[0.667px] border-black/8 bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-2">
          <div className="border-r-[0.667px] border-black/8 px-5 py-5">
            <p className="text-[10px] leading-[15px] font-bold tracking-[0.25px] text-[#6B7280] uppercase">👈 이쪽</p>
            <p className="mt-2 text-[13px] leading-[17.875px] font-bold text-[#1A1A2E]">{left.text}</p>
          </div>
          <div className="px-5 py-5">
            <p className="text-[10px] leading-[15px] font-bold tracking-[0.25px] text-[#6B7280] uppercase">이쪽 👉</p>
            <p className="mt-2 text-[13px] leading-[17.875px] font-bold text-[#1A1A2E]">{right.text}</p>
          </div>
        </div>
        <div className="border-t-[0.667px] border-black/8 bg-[#F0F0EC] px-5 py-2.5 text-center">
          <p className="text-[11px] leading-[16.5px] text-[#6B7280]">더 나에게 가까운 쪽을 골라주세요</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-black/8 bg-white py-4"
          onClick={() => onSelect(left.order)}
        >
          <LeftArrowIcon />
          <span className="text-sm leading-[21px] font-bold text-[#1A1A2E]">이쪽이요</span>
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#2A78D6] py-4"
          onClick={() => onSelect(right.order)}
        >
          <span className="text-sm leading-[21px] font-bold text-white">저쪽이요</span>
          <RightArrowIcon />
        </button>
      </div>
    </div>
  );
}
