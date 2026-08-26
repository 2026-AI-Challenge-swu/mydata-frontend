import { BackChevronIcon } from './icons';

interface SurveyHeaderProps {
  step: number;
  total: number;
  onBack: () => void;
}

export function SurveyHeader({ step, total, onBack }: SurveyHeaderProps) {
  const progress = (step / total) * 100;

  return (
    <div className="px-6 pt-12 pb-4">
      <div className="flex items-center justify-between">
        <button className="flex items-center justify-center p-1" onClick={onBack} aria-label="이전 문항">
          <BackChevronIcon />
        </button>
        <span className="text-[13px] leading-[19.5px] font-bold text-[#6B7280]">
          {step} / {total}
        </span>
      </div>
      <div className="mt-[31px] h-[6px] w-full overflow-hidden rounded-full bg-[#F0F0EC]">
        <div className="h-[6px] rounded-full bg-[#2A78D6] transition-[width]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
