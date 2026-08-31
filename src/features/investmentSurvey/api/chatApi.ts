const CHAT_API_BASE_URL = import.meta.env.VITE_CHAT_API_BASE_URL ?? 'http://localhost:8000/api/v1';

interface ChatNodeEvent {
  event: 'node_enter' | 'node_exit';
  session_id: string;
  node: string;
  message: string;
}

interface ChatFinalResultEvent {
  event: 'final_result';
  session_id: string;
  response: string;
}

interface ChatErrorEvent {
  event: 'error';
  session_id: string;
  message: string;
}

interface ChatCloseEvent {
  status: string;
  session_id: string;
}

export type ChatStreamEvent = ChatNodeEvent | ChatFinalResultEvent | ChatErrorEvent | ChatCloseEvent;

// ai-agent-core의 POST /api/v1/chat/sse는 EventSourceResponse(POST + SSE)라 브라우저 기본 EventSource(GET 전용)를
// 못 써서, fetch의 ReadableStream을 직접 파싱함. 프레임은 "event: ...\ndata: {...}\n\n" 형태.
export async function* streamChat(sessionId: string, query: string): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`${CHAT_API_BASE_URL}/chat/sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`채팅 서버 응답 오류 (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 프레임 구분자는 \r\n\r\n (서버가 CRLF 개행을 사용함) — \n\n으로 찾으면 절대 안 걸림
    let separatorIndex;
    while ((separatorIndex = buffer.indexOf('\r\n\r\n')) !== -1) {
      const rawFrame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 4);

      // sse_starlette는 15초마다 ": ping ..." 코멘트 라인도 보내는데, data가 없으니 자연히 건너뜀
      const dataLine = rawFrame.split('\r\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const json = dataLine.slice(5).trim();
      if (!json) continue;
      yield JSON.parse(json) as ChatStreamEvent;
    }
  }
}
