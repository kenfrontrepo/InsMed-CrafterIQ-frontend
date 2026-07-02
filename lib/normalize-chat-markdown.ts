/** Unescape literal escape sequences sometimes returned by the API/DB. */
function unescapeMarkdownText(content: string): string {
  if (!content.includes("\\")) return content;

  return content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

/** Ensure GFM tables parse when preceded by a single newline. */
function ensureTableSpacing(content: string): string {
  return content.replace(/([^\n])\n(\|)/g, "$1\n\n$2");
}

/** Convert • bullet lines (and inline • blocks) to markdown list syntax. */
function normalizeBulletMarkdown(content: string): string {
  const lines = content.split("\n");
  const hasBulletLines = lines.some((line) => /^\s*•\s+/.test(line.trim()));

  if (hasBulletLines) {
    const out: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^•\s+/.test(trimmed)) {
        if (!inList && out.length > 0 && out[out.length - 1] !== "") {
          out.push("");
        }
        inList = true;
        out.push(`- ${trimmed.replace(/^•\s+/, "")}`);
        continue;
      }

      if (inList && trimmed) {
        out.push("");
        inList = false;
      }

      out.push(line);
      if (!trimmed) inList = false;
    }

    return out.join("\n");
  }

  if (!content.includes("•")) return content;

  return content
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed.includes("•")) return block;

      const items = trimmed
        .split(/\s*•\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length > 1) {
        return items.map((item) => `- ${item}`).join("\n");
      }

      return block;
    })
    .join("\n\n");
}

/** Normalize streamed/stored insight markdown for ReactMarkdown + remark-gfm. */
export function normalizeChatMarkdown(content: string): string {
  if (!content) return "";

  let text = unescapeMarkdownText(content);
  text = normalizeBulletMarkdown(text);
  text = ensureTableSpacing(text);

  return text.trim();
}
