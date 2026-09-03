import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { InvestmentProfile } from '../types/survey';
import { streamChat } from '../api/chatApi';
import { CHAT_SUGGESTED_QUESTIONS } from '../data/chatFaq';
import { AiAvatarIcon, LeftArrowIcon, SendIcon } from '../components/icons';
import { MarkdownLiteText } from '../components/MarkdownLiteText';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

function greetingFor(profile: InvestmentProfile): ChatMessage {
  return {
    id: 'greeting',
    role: 'bot',
    text: `안녕하세요! ${profile.emoji} ${profile.nickname}이시군요.\n결과에 대해 궁금한 게 있으면 편하게 물어보세요. 어려운 말 없이 쉽게 설명해 드릴게요 😊`,
  };
}

export function ChatScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = (location.state as { profile?: InvestmentProfile } | null)?.profile;

  const [messages, setMessages] = useState<ChatMessage[]>(() => (profile ? [greetingFor(profile)] : []));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>();
  const sessionIdRef = useRef(crypto.randomUUID());
  const nextId = useRef(0);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isTyping, statusMessage]);

  if (!profile) {
    navigate(-1);
    return null;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    nextId.current += 1;
    setMessages((prev) => [...prev, { id: `user-${nextId.current}`, role: 'user', text: trimmed }]);
    setInputValue('');
    setIsTyping(true);
    setStatusMessage(undefined);

    try {
      for await (const event of streamChat(sessionIdRef.current, trimmed)) {
        if (!('event' in event)) continue; // close 프레임엔 event 키가 없음

        if (event.event === 'node_enter') {
          setStatusMessage(event.message);
        } else if (event.event === 'final_result') {
          nextId.current += 1;
          setMessages((prev) => [...prev, { id: `bot-${nextId.current}`, role: 'bot', text: event.response }]);
        } else if (event.event === 'error') {
          nextId.current += 1;
          setMessages((prev) => [...prev, { id: `bot-${nextId.current}`, role: 'bot', text: event.message }]);
        }
      }
    } catch {
      nextId.current += 1;
      setMessages((prev) => [
        ...prev,
        { id: `bot-${nextId.current}`, role: 'bot', text: '지금은 AI 상담 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setIsTyping(false);
      setStatusMessage(undefined);
    }
  }

  const showSuggestions = messages.length === 1 && !isTyping;

  return (
    <div className="flex w-full flex-1 flex-col bg-[#FAFAF7]">
      <div className="flex items-center gap-3 border-b-[0.667px] border-black/8 bg-white px-5 pt-3.5 pb-3.5">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F0EC]"
          onClick={() => navigate(-1)}
          aria-label="이전으로"
        >
          <LeftArrowIcon />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: profile.badgeBackground }}
          >
            <AiAvatarIcon color={profile.accentColor} />
          </div>
          <div>
            <p className="text-sm leading-[14px] font-bold text-[#1A1A2E]">AI 상담</p>
            <p className="mt-0.5 text-[10px] leading-[15px] font-medium text-[#1FAB6A]">● 온라인</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-5 pb-4">
        {messages.map((message) =>
          message.role === 'bot' ? (
            <div key={message.id} className="flex items-end gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: profile.badgeBackground }}
              >
                <AiAvatarIcon color={profile.accentColor} />
              </div>
              <div className="max-w-[280px] rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[10px] border-[0.667px] border-black/8 bg-white px-4 py-3 text-[13px] leading-[21.125px] text-[#1A1A2E]">
                <MarkdownLiteText text={message.text} />
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[10px] bg-[#2A78D6] px-4 py-3">
                <p className="text-[13px] leading-[21.125px] text-white">{message.text}</p>
              </div>
            </div>
          ),
        )}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: profile.badgeBackground }}
            >
              <AiAvatarIcon color={profile.accentColor} />
            </div>
            {statusMessage ? (
              <div className="rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[10px] border-[0.667px] border-black/8 bg-white px-4 py-3 text-xs leading-[18px] text-[#6B7280]">
                {statusMessage}
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[10px] border-[0.667px] border-black/8 bg-white px-4 py-3.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6B7280]" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6B7280]" style={{ animationDelay: '120ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6B7280]" style={{ animationDelay: '240ms' }} />
              </div>
            )}
          </div>
        )}

        {showSuggestions && (
          <div className="pl-9">
            <p className="mb-2 text-[11px] leading-[16.5px] text-[#6B7280]">자주 묻는 질문</p>
            <div className="flex flex-wrap gap-2">
              {CHAT_SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  className="rounded-full border-2 border-black/8 bg-white px-3.5 py-2 text-xs leading-[18px] font-medium text-[#1A1A2E]"
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={scrollBottomRef} />
      </div>

      <div className="border-t-[0.667px] border-black/8 bg-[rgba(250,250,247,0.95)] px-4 pt-3 pb-3">
        <div className="flex items-center gap-2 rounded-2xl border-[0.667px] border-black/8 bg-white px-4 py-2.5">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendMessage(inputValue);
            }}
            placeholder="궁금한 거 편하게 물어보세요"
            className="h-[21px] flex-1 text-sm text-[#1A1A2E] placeholder:text-[rgba(107,114,128,0.6)] focus:outline-none"
          />
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: inputValue.trim() ? '#E85D4A' : '#F0F0EC' }}
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            aria-label="전송"
          >
            <SendIcon color={inputValue.trim() ? 'white' : '#6B7280'} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] leading-[15px] text-[#6B7280]">
          AI 답변은 참고용이며 실제 투자 결정은 담당 상담사와 함께해요
        </p>
      </div>
    </div>
  );
}
