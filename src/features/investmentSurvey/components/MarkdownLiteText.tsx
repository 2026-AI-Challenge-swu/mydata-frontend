// AI 상담 응답에 마크다운(**볼드**, ### 소제목, - 목록)이 섞여 와서,
// 별도 라이브러리 없이 이 세 가지만 가볍게 처리해서 보여줌.
function renderInline(text: string, keyPrefix: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={`${keyPrefix}-${i}`}>{part}</span>
      ),
    );
}

export function MarkdownLiteText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList(key: string) {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-0.5 pl-4">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
      return;
    }
    flushList(`list-${i}`);

    if (!line) return;

    if (line.startsWith('### ')) {
      blocks.push(
        <p key={i} className="font-bold">
          {renderInline(line.slice(4), `h-${i}`)}
        </p>,
      );
      return;
    }

    blocks.push(<p key={i}>{renderInline(line, `p-${i}`)}</p>);
  });
  flushList('list-end');

  return <div className="flex flex-col gap-1.5">{blocks}</div>;
}
