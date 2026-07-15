function isTableLine(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line.trim());
}

function isTableSeparatorLine(line: string): boolean {
  return /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line.trim());
}

function isMarkdownTableBlock(block: string): boolean {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return false;
  if (!isTableLine(lines[0]) || !isTableSeparatorLine(lines[1])) return false;

  return lines.every(isTableLine);
}

/** Unescape literal escape sequences sometimes returned by the API/DB. */
function unescapeMarkdownText(content: string): string {
  if (!content.includes("\\")) return content;

  return content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

/** Blank line only before a table block starts — never between table rows. */
function ensureTableSpacing(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const isTable = isTableLine(line);
    const prev = out[out.length - 1]?.trim() ?? "";
    const prevIsTable = isTableLine(prev);

    if (isTable && out.length > 0 && prev !== "" && !prevIsTable) {
      out.push("");
    }

    out.push(line);
  }

  return out.join("\n");
}

/** True when a line starts with • or a markdown list marker (-/+/* + space). */
function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  // Do not treat markdown emphasis (**bold**) as a list marker
  return /^(?:\u2022\s*|[-+]\s+|\*\s+)/.test(trimmed);
}

/**
 * Collapse repeated leading bullets (e.g. "• • text", "- • text") into one
 * markdown list item. Returns null for bullet-only / empty lines.
 *
 * Note: require whitespace after -/+/* so "**bold**" is never stripped.
 */
function toMarkdownListItem(line: string): string | null {
  const trimmed = line.trim();
  if (!isBulletLine(trimmed)) return null;

  // Strip every leading • / - / + / * marker so "• • text" → "text"
  const content = trimmed
    .replace(/^(?:(?:\u2022\s*)|(?:[-+*]\s+))+/, "")
    .trim();
  if (!content) return null;

  return `- ${content}`;
}

function normalizeBulletBlock(block: string): string {
  const trimmed = block.trim();
  if (!trimmed || isMarkdownTableBlock(trimmed)) return block;

  const lines = trimmed.split("\n");
  const hasBulletLines = lines.some((line) => isBulletLine(line));

  if (hasBulletLines) {
    const out: string[] = [];
    let inList = false;

    for (const line of lines) {
      const lineTrimmed = line.trim();

      if (isBulletLine(lineTrimmed)) {
        const item = toMarkdownListItem(lineTrimmed);
        if (!item) {
          // Lone "•" / "• •" with no text — drop (avoids empty dots)
          continue;
        }
        if (!inList && out.length > 0 && out[out.length - 1] !== "") {
          out.push("");
        }
        inList = true;
        out.push(item);
        continue;
      }

      if (inList && lineTrimmed) {
        out.push("");
        inList = false;
      }

      out.push(line);
      if (!lineTrimmed) inList = false;
    }

    return out.join("\n");
  }

  if (!trimmed.includes("•")) return block;

  const items = trimmed
    .split(/\s*•\s*/)
    .map((item) =>
      item.replace(/^(?:(?:\u2022\s*)|(?:[-+*]\s+))+/, "").trim()
    )
    .filter(Boolean);

  if (items.length > 1) {
    return items.map((item) => `- ${item}`).join("\n");
  }

  return block;
}

/** Convert • bullet lines (and inline • blocks) to markdown list syntax. */
function normalizeBulletMarkdown(content: string): string {
  return content
    .split(/\n\n+/)
    .map((block) => normalizeBulletBlock(block))
    .join("\n\n");
}

/** Normalize streamed/stored insight markdown for ReactMarkdown + remark-gfm. */
export function normalizeChatMarkdown(content: string): string {
  if (!content) return "";

  let text = unescapeMarkdownText(content);
  text = ensureTableSpacing(text);
  text = normalizeBulletMarkdown(text);

  return text.trim();
}
