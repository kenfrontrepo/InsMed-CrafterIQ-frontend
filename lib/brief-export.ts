import {
  fetchBrief,
  normalizeBriefData,
  type BriefData,
  type BriefViewModel,
} from "@/lib/api/briefsApi";

export type BriefVisualSpecLike = {
  type?: string;
  brief_id?: string;
  brief_data?: BriefData | null;
  entity_name?: string;
};

/** Prefer in-memory brief_data; otherwise fetch the latest saved brief. */
export async function resolveLatestBriefData(options: {
  userId: string;
  briefId?: string | null;
  briefData?: BriefData | null;
  entityName?: string;
  preferCached?: boolean;
}): Promise<{ briefData: BriefData; entityName: string; briefId?: string } | null> {
  const {
    userId,
    briefId,
    briefData,
    entityName = "",
    preferCached = true,
  } = options;

  if (preferCached && briefData) {
    return {
      briefData,
      entityName:
        entityName ||
        ("entity_name" in briefData && typeof briefData.entity_name === "string"
          ? briefData.entity_name
          : ""),
      briefId: briefId ?? undefined,
    };
  }

  if (!briefId) {
    if (briefData) {
      return {
        briefData,
        entityName:
          entityName ||
          ("entity_name" in briefData && typeof briefData.entity_name === "string"
            ? briefData.entity_name
            : ""),
        briefId: undefined,
      };
    }
    return null;
  }

  const response = await fetchBrief(briefId, userId);
  if (!response.status || !response.brief?.brief_data) {
    if (briefData) {
      return {
        briefData,
        entityName: entityName || response.brief?.entity_name || "",
        briefId,
      };
    }
    return null;
  }

  return {
    briefData: response.brief.brief_data,
    entityName: response.brief.entity_name || entityName,
    briefId: response.brief.id,
  };
}

/** Build a plain-text email body from structured brief data (never sysoutput). */
export function briefDataToEmailBody(
  briefData: BriefData,
  entityName = ""
): string {
  const view = normalizeBriefData(briefData, entityName);
  return briefViewToEmailBody(view);
}

export function briefViewToEmailBody(view: BriefViewModel): string {
  const lines: string[] = [];

  lines.push(view.title || "CrafterIQ Brief");
  if (view.subtitle) lines.push(view.subtitle);
  if (view.entityName) lines.push(`Entity: ${view.entityName}`);
  if (view.statusBadge) lines.push(`Status: ${view.statusBadge}`);

  for (const [key, value] of Object.entries(view.headerExtra)) {
    lines.push(`${formatKey(key)}: ${value}`);
  }

  lines.push("");

  if (view.aiSummaryParagraph || view.aiSummaryInsights.length > 0) {
    lines.push(view.aiSummaryTitle || "CrafterIQ Analysis");
    lines.push("-".repeat(40));
    if (view.aiSummaryParagraph) {
      lines.push(view.aiSummaryParagraph);
      lines.push("");
    }
    for (const insight of view.aiSummaryInsights) {
      lines.push(`• ${insight}`);
    }
    lines.push("");
  }

  if (view.stats.length > 0) {
    lines.push("Key Metrics");
    lines.push("-".repeat(40));
    for (const stat of view.stats) {
      const change = stat.change ? ` (${stat.change})` : "";
      lines.push(`${stat.label}: ${stat.value}${change}`);
    }
    lines.push("");
  }

  if (view.timeline.length > 0) {
    lines.push("Timeline");
    lines.push("-".repeat(40));
    for (const item of view.timeline) {
      lines.push(`${item.label}: ${item.value || "—"}`);
    }
    lines.push("");
  }

  for (const section of view.donutCharts) {
    lines.push(section.title);
    lines.push("-".repeat(40));
    const labels = section.labels ?? [];
    const values = section.values ?? [];
    labels.forEach((label, i) => {
      lines.push(`${label}: ${values[i] ?? 0}`);
    });
    if (section.center_label != null && section.center_value != null) {
      lines.push(`${section.center_label}: ${section.center_value}`);
    }
    lines.push("");
  }

  for (const section of view.horizontalBarCharts) {
    lines.push(section.title);
    lines.push("-".repeat(40));
    const categories = (section.y as string[]) ?? (section.labels as string[]) ?? [];
    const values =
      (section.x as number[]) ?? (section.values as number[]) ?? [];
    categories.forEach((label, i) => {
      lines.push(`${label}: ${values[i] ?? 0}`);
    });
    lines.push("");
  }

  for (const section of view.tableSections) {
    lines.push(section.title);
    lines.push("-".repeat(40));
    const columns = section.columns ?? [];
    const rows = section.data ?? [];
    if (columns.length > 0) {
      lines.push(columns.join(" | "));
      for (const row of rows) {
        lines.push(
          columns.map((col) => String(row[col] ?? "")).join(" | ")
        );
      }
    }
    lines.push("");
  }

  for (const section of view.legacySections) {
    lines.push(section.title);
    lines.push("-".repeat(40));
    if (section.content?.trim()) {
      lines.push(section.content.trim());
      lines.push("");
    }
    for (const chart of section.charts ?? []) {
      lines.push(chart.title);
      const labels = chart.labels ?? [];
      const values = chart.values ?? [];
      labels.forEach((label, i) => {
        lines.push(`${label}: ${values[i] ?? 0}`);
      });
      lines.push("");
    }
  }

  lines.push("—");
  lines.push("Generated by CrafterIQ");

  return lines.join("\n").trim();
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function openBriefEmail(options: {
  subject: string;
  body: string;
}): void {
  const subject = encodeURIComponent(options.subject);
  const body = encodeURIComponent(options.body);
  // Keep under common mailto length limits
  const href =
    body.length > 1800
      ? `mailto:?subject=${subject}&body=${encodeURIComponent(
          `${options.body.slice(0, 1600)}\n\n…(truncated — open the brief in CrafterIQ for full details)`
        )}`
      : `mailto:?subject=${subject}&body=${body}`;

  window.location.href = href;
}

/**
 * AmCharts canvas often prints blank. Snapshot visible canvases to <img>
 * for the print pass, then restore afterward.
 */
export function snapshotCanvasesForPrint(root: ParentNode): () => void {
  const restorers: Array<() => void> = [];

  root.querySelectorAll("canvas").forEach((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    if (canvas.width === 0 || canvas.height === 0) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      if (!dataUrl || dataUrl === "data:,") return;

      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "";
      img.setAttribute("data-print-chart-snapshot", "true");
      img.style.display = "block";
      img.style.width = canvas.style.width || `${canvas.clientWidth || canvas.width}px`;
      img.style.height =
        canvas.style.height || `${canvas.clientHeight || canvas.height}px`;
      img.style.maxWidth = "100%";

      const prevDisplay = canvas.style.display;
      canvas.style.display = "none";
      canvas.parentElement?.insertBefore(img, canvas);

      restorers.push(() => {
        img.remove();
        canvas.style.display = prevDisplay;
      });
    } catch {
      // tainted canvas / security — leave original
    }
  });

  return () => {
    for (const restore of restorers) restore();
  };
}

/**
 * Print only the brief document in an isolated iframe so app-shell
 * h-screen/overflow-hidden cannot clip to a single page.
 */
export async function printBriefDocument(root: HTMLElement): Promise<void> {
  const restoreCharts = snapshotCanvasesForPrint(root);
  await waitForPrintLayout(40);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Brief print");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    restoreCharts();
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
  doc.close();

  doc.documentElement.className = document.documentElement.className;
  doc.body.className = document.body.className;

  // Carry over app styles so the brief looks the same
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true));
  });

  const printStyle = doc.createElement("style");
  printStyle.textContent = `
    @page { size: auto; margin: 12mm; }
    html, body {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-document {
      max-width: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 24px !important;
      overflow: visible !important;
      height: auto !important;
    }
    .print\\:hidden,
    [class*="print:hidden"] {
      display: none !important;
    }
    .print-avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    img, svg, canvas, table, tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `;
  doc.head.appendChild(printStyle);

  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll('[class*="print:hidden"], .print-hide')
    .forEach((el) => el.remove());
  doc.body.appendChild(clone);

  // Wait for cloned chart images to decode
  const images = Array.from(doc.images);
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
    )
  );
  await waitForPrintLayout(100);

  const cleanup = () => {
    restoreCharts();
    iframe.remove();
  };

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    cleanup();
    window.print();
    return;
  }

  frameWindow.focus();
  frameWindow.addEventListener("afterprint", cleanup, { once: true });
  frameWindow.print();
  // Fallback if afterprint is skipped (some browsers)
  window.setTimeout(cleanup, 2000);
}

/** Wait a frame (and a short settle) so React/layout can update before print. */
export function waitForPrintLayout(ms = 80): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, ms);
    });
  });
}

/**
 * AmCharts redraws asynchronously after React updates. Poll until canvases
 * look painted (or timeout) so print snapshots aren't blank.
 */
export async function waitForChartsReady(
  root: ParentNode,
  timeoutMs = 800
): Promise<void> {
  const start = Date.now();
  await waitForPrintLayout(50);

  while (Date.now() - start < timeoutMs) {
    const canvases = Array.from(root.querySelectorAll("canvas")).filter(
      (node): node is HTMLCanvasElement =>
        node instanceof HTMLCanvasElement &&
        node.width > 0 &&
        node.height > 0
    );

    if (canvases.length === 0) return;

    const anyPainted = canvases.some((canvas) => {
      try {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return false;
        const sample = ctx.getImageData(
          Math.floor(canvas.width / 2),
          Math.floor(canvas.height / 2),
          1,
          1
        ).data;
        // Non-transparent pixel ≈ chart has drawn
        return sample[3] > 0;
      } catch {
        return true;
      }
    });

    if (anyPainted) {
      await waitForPrintLayout(40);
      return;
    }

    await waitForPrintLayout(60);
  }
}
