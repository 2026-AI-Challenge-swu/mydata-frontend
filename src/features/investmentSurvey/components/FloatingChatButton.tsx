import { ChatIcon } from './icons';

interface FloatingChatButtonProps {
  accentColor: string;
  onClick: () => void;
  // 화면 하단에 고정 CTA 바가 있을 때 그 위로 띄우기 위한 오프셋 — 기본은 화면 맨 아래(bottom-6).
  bottomClassName?: string;
}

export function FloatingChatButton({ accentColor, onClick, bottomClassName = 'bottom-6' }: FloatingChatButtonProps) {
  return (
    <div className={`absolute right-6 ${bottomClassName} z-10 flex flex-col items-end`}>
      <div className="relative mb-2 rounded-full bg-[#1A1A2E] px-3 py-1.5 text-[11px] leading-[16.5px] font-medium whitespace-nowrap text-white shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)]">
        궁금한 거 물어보세요 💬
        <span className="absolute -bottom-[5px] right-4 h-[10px] w-[10px] rotate-45 bg-[#1A1A2E]" />
      </div>
      <button
        type="button"
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-[0px_20px_12.5px_rgba(0,0,0,0.1),0px_8px_5px_rgba(0,0,0,0.1)]"
        style={{ backgroundColor: accentColor }}
        onClick={onClick}
        aria-label="채팅으로 물어보기"
      >
        <ChatIcon />
      </button>
    </div>
  );
}
