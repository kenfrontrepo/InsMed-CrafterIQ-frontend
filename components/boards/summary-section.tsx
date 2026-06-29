"use client";

import { memo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCw, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchBoardSummary,
  fetchSummaryOptions,
  type BoardSummaryResponse,
} from "@/lib/api/boardsApi";

const DEFAULT_TONE_OPTIONS = [
  { value: "executive", label: "Executive" },
  { value: "strategic", label: "Strategic" },
  { value: "analytical", label: "Analytical" },
  { value: "casual", label: "Casual" },
  { value: "anomaly_focused", label: "Anomaly Focused" },
] as const;

const DEFAULT_DETAIL_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "detailed", label: "Detailed" },
  { value: "comprehensive", label: "Comprehensive" },
] as const;

const DEFAULT_STYLE_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "narrative", label: "Narrative" },
  { value: "bullet_points", label: "Bullet Points" },
  { value: "numbered", label: "Numbered" },
] as const;

type Tone = (typeof DEFAULT_TONE_OPTIONS)[number]["value"];
type DetailLevel = (typeof DEFAULT_DETAIL_OPTIONS)[number]["value"];
type Style = (typeof DEFAULT_STYLE_OPTIONS)[number]["value"];

function labelForValue(
  options: readonly { value: string; label: string }[],
  value: string
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Match playpower summary typography (explicit list styles — no typography plugin) */
const summaryMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-sm text-gray-600 leading-relaxed my-1">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-1 space-y-0.5 text-sm text-gray-600 leading-relaxed list-disc pl-5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 space-y-0.5 text-sm text-gray-600 leading-relaxed list-decimal pl-5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="my-0.5 pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-800">{children}</strong>
  ),
};

/** Normalize summary string to markdown lists (fallback when summary_items absent) */
function normalizeSummaryMarkdown(summary: string, style: Style): string {
  const trimmed = summary.trim();
  if (!trimmed) return summary;

  if (style === "bullet_points") {
    if (/^\s*[-*]\s/m.test(trimmed)) return trimmed;

    const bulletLines = trimmed
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (
      bulletLines.length > 1 &&
      bulletLines.every((line) => /^•\s+/.test(line))
    ) {
      return bulletLines
        .map((line) => `- ${line.replace(/^•\s+/, "")}`)
        .join("\n");
    }

    if (trimmed.includes("•")) {
      const items = trimmed
        .split(/\s*•\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 1) {
        return items.map((item) => `- ${item}`).join("\n");
      }
    }
  }

  if (style === "numbered") {
    if (/^\s*\d+\.\s/m.test(trimmed) && trimmed.includes("\n")) return trimmed;

    const inlineParts = trimmed
      .split(/\s*(?=\d+\.\s)/)
      .map((s) => s.replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean);
    if (inlineParts.length > 1) {
      return inlineParts.map((item, i) => `${i + 1}. ${item}`).join("\n");
    }
  }

  return summary;
}

/** Prefer structured summary_items from API, same rendering path as playpower markdown */
function buildSummaryMarkdown(
  data: BoardSummaryResponse | undefined,
  style: Style
): string {
  if (!data?.summary && !data?.summary_items?.length) {
    return "No summary available yet.";
  }

  const effectiveStyle = (data?.style as Style) || style;

  if (data?.summary_items?.length) {
    if (effectiveStyle === "bullet_points") {
      return data.summary_items.map((item) => `- ${item}`).join("\n");
    }
    if (effectiveStyle === "numbered") {
      return data.summary_items
        .map((item, i) => `${i + 1}. ${item}`)
        .join("\n");
    }
  }

  return normalizeSummaryMarkdown(data?.summary ?? "", effectiveStyle);
}

async function fetchSummary(
  boardId: string,
  userId: string,
  tone: Tone,
  detail_level: DetailLevel,
  style: Style,
  force_regenerate: boolean
): Promise<BoardSummaryResponse> {
  return fetchBoardSummary(boardId, userId, {
    tone,
    detail_level,
    style,
    force_regenerate,
  });
}

interface SummarySectionProps {
  boardId: string;
  userId: string;
  isWriteMode?: boolean;
}

export const SummarySection = memo(function SummarySection({
  boardId,
  userId,
  isWriteMode = false,
}: SummarySectionProps) {
  const { data: summaryOptions } = useQuery({
    queryKey: ["board-summary-options"],
    queryFn: fetchSummaryOptions,
    staleTime: 5 * 60_000,
  });

  const toneOptions =
    summaryOptions?.tones?.map((value) => ({
      value,
      label: labelForValue(DEFAULT_TONE_OPTIONS, value),
    })) ?? DEFAULT_TONE_OPTIONS;

  const detailOptions =
    summaryOptions?.detail_levels?.map((value) => ({
      value,
      label: labelForValue(DEFAULT_DETAIL_OPTIONS, value),
    })) ?? DEFAULT_DETAIL_OPTIONS;

  const styleOptions =
    summaryOptions?.styles?.map((value) => ({
      value,
      label: labelForValue(DEFAULT_STYLE_OPTIONS, value),
    })) ?? DEFAULT_STYLE_OPTIONS;

  const [tone, setTone] = useState<Tone>("executive");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("short");
  const [style, setStyle] = useState<Style>("concise");

  const [appliedTone, setAppliedTone] = useState<Tone>("executive");
  const [appliedDetail, setAppliedDetail] = useState<DetailLevel>("short");
  const [appliedStyle, setAppliedStyle] = useState<Style>("concise");

  const hasChanges =
    tone !== appliedTone ||
    detailLevel !== appliedDetail ||
    style !== appliedStyle;

  const {
    data: summaryData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["board-summary", boardId, appliedTone, appliedDetail, appliedStyle],
    queryFn: () =>
      fetchSummary(boardId, userId, appliedTone, appliedDetail, appliedStyle, false),
    enabled: !!boardId && !!userId,
    staleTime: 60_000,
  });

  const handleApply = useCallback(() => {
    setAppliedTone(tone);
    setAppliedDetail(detailLevel);
    setAppliedStyle(style);
  }, [tone, detailLevel, style]);

  const handleRegenerate = useCallback(async () => {
    await fetchSummary(boardId, userId, appliedTone, appliedDetail, appliedStyle, true);
    refetch();
  }, [boardId, userId, appliedTone, appliedDetail, appliedStyle, refetch]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="font-medium text-gray-900 text-sm">AI Summary</h2>

        {isWriteMode && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1 text-xs">
                {labelForValue(toneOptions, tone)}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs text-gray-500">
                Tone
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={tone}
                onValueChange={(v) => setTone(v as Tone)}
              >
                {toneOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1 text-xs">
                {labelForValue(detailOptions, detailLevel)}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs text-gray-500">
                Detail Level
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={detailLevel}
                onValueChange={(v) => setDetailLevel(v as DetailLevel)}
              >
                {detailOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1 text-xs">
                {labelForValue(styleOptions, style)}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs text-gray-500">
                Style
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={style}
                onValueChange={(v) => setStyle(v as Style)}
              >
                {styleOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasChanges && (
            <Button
              size="xs"
              className="h-7 text-xs bg-text-primary hover:bg-[#333330] text-white"
              onClick={handleApply}
            >
              Apply
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRegenerate}
            disabled={isFetching}
            className="h-7 w-7"
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      ) : (
        <motion.div
          key={`${appliedTone}-${appliedDetail}-${appliedStyle}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="prose prose-sm max-w-none text-gray-600 leading-relaxed
            prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
            prose-headings:text-gray-800 prose-strong:text-gray-800"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={summaryMarkdownComponents}
          >
            {buildSummaryMarkdown(summaryData, appliedStyle)}
          </ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
});
