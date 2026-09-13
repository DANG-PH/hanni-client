import { Fragment } from "react";

/** Áp dụng **in đậm** và `code` trong 1 dòng — đủ cho văn phong trả lời của trợ lý AI. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded bg-black/8 px-1 py-0.5 text-[0.85em] dark:bg-white/10"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

/**
 * Render tối giản markdown cho trả lời của trợ lý AI (Gemini) — chỉ xử lý
 * **in đậm**, `code`, gạch đầu dòng (-, *) và danh sách số (1.) theo từng
 * dòng. Không dùng thư viện markdown đầy đủ vì hệ thống prompt chỉ yêu cầu
 * model dùng đúng 2 kiểu này (xem assistant.service.ts phía server).
 */
export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: { type: "ul" | "ol" | "p"; items: string[] }[] = [];

  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else if (numbered) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol") last.items.push(numbered[1]);
      else blocks.push({ type: "ol", items: [numbered[1]] });
    } else if (line.trim() === "") {
      // dòng trống ngăn cách đoạn — bỏ qua, mỗi block đã có margin riêng
    } else {
      const last = blocks[blocks.length - 1];
      if (last?.type === "p") last.items.push(line);
      else blocks.push({ type: "p", items: [line] });
    }
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        if (block.type === "ul") {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item, `${bi}-${ii}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item, `${bi}-${ii}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={bi}>
            {block.items.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
