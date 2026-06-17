"use client";

import { memo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
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

// ── Option configs ──────────────────────────────────────────
const TONE_OPTIONS = [
  { value: "executive", label: "Executive" },
  { value: "analytical", label: "Analytical" },
  { value: "casual", label: "Casual" },
] as const;

const DETAIL_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
] as const;

const STYLE_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "narrative", label: "Narrative" },
  { value: "bullet_points", label: "Bullet Points" },
] as const;

type Tone = (typeof TONE_OPTIONS)[number]["value"];
type DetailLevel = (typeof DETAIL_OPTIONS)[number]["value"];
type Style = (typeof STYLE_OPTIONS)[number]["value"];

// ── Fetch function ──────────────────────────────────────────
import { fetchBoardSummary } from "@/lib/api/boardsApi";

interface SummaryResponse {
  status: boolean;
  board_id: string;
  board_name: string;
  summary: string;
  tone: string;
  detail_level: string;
  style: string;
}

async function fetchSummary(
  boardId: string,
  userId: string,
  tone: Tone,
  detail_level: DetailLevel,
  style: Style,
  force_regenerate: boolean
): Promise<SummaryResponse> {
  return fetchBoardSummary(boardId, userId, {
    tone,
    detail_level,
    style,
    force_regenerate,
  });
}

// ── Component ───────────────────────────────────────────────
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
  const [tone, setTone] = useState<Tone>("executive");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("short");
  const [style, setStyle] = useState<Style>("concise");

  // Applied values — only sent to the API when user clicks Apply or on initial load
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
    enabled: !!boardId,
    staleTime: 60_000,
  });

  const handleApply = useCallback(() => {
    setAppliedTone(tone);
    setAppliedDetail(detailLevel);
    setAppliedStyle(style);
    // React Query will auto-refetch because the queryKey changes
  }, [tone, detailLevel, style]);

  const handleRegenerate = useCallback(async () => {
    // Force regenerate with current applied settings
    await fetchSummary(boardId, userId, appliedTone, appliedDetail, appliedStyle, true);
    refetch();
  }, [boardId, userId, appliedTone, appliedDetail, appliedStyle, refetch]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="font-medium text-gray-900 text-sm">AI Summary</h2>

        {isWriteMode && (
        <div className="flex items-center gap-2">
          {/* Tone Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1 text-xs">
                {TONE_OPTIONS.find((t) => t.value === tone)?.label}
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
                {TONE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Detail Level Dropdown */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1 text-xs">
                {DETAIL_OPTIONS.find((d) => d.value === detailLevel)?.label}
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
                {DETAIL_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* Style Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="h-7 gap-1 text-xs">
                {STYLE_OPTIONS.find((s) => s.value === style)?.label}
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
                {STYLE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Apply Button — shown when dropdown values differ from applied */}
          {hasChanges && (
            <Button
              size="xs"
              className="h-7 text-xs bg-text-primary hover:bg-[#333330] text-white"
              onClick={handleApply}
            >
              Apply
            </Button>
          )}

          {/* Regenerate Button */}
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

      {/* Summary Content */}
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
          <ReactMarkdown>
            {summaryData?.summary || "No summary available yet."}
          </ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
});
