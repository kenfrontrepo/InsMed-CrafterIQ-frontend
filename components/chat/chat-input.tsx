"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useImperativeHandle,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFilters } from "@/lib/api/filtersApi";
import {
  Building2,
  User,
  Briefcase,
  Layers,
  Hash,
  TrendingUp,
  Activity,
  Lightbulb,
  Users,
  PauseCircle,
  Tag,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  business_unit: Building2,
  project_status: Hash,
  health: Activity,
  trend: TrendingUp,
  project_manager: User,
  project_type: Briefcase,
  t_shirt_size: Tag,
  idea_status: Lightbulb,
  it_sponsor: Users,
  on_hold: PauseCircle,
};

/** Dimensions omitted from @ mention suggestions */
const EXCLUDED_DIMENSIONS = new Set<string>([]);

interface MentionResult {
  categoryKey: string;
  categoryDisplay: string;
  value: string;
}

export interface ChatInputHandle {
  setValue: (value: string) => void;
}

interface ChatInputProps {
  onSubmit: (message: string, options?: { is_report?: boolean }) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSubmit,
  placeholder = "Ask anything...",
  disabled = false,
  ref,
}: ChatInputProps & { ref?: React.Ref<ChatInputHandle> }) {
  const [inputValue, setInputValue] = useState("");
  const [isReportMode, setIsReportMode] = useState(false);

  const [slashOpen, setSlashOpen] = useState(false);
  const [slashHighlight, setSlashHighlight] = useState(0);
  const slashPopoverRef = useRef<HTMLDivElement>(null);

  const SLASH_COMMANDS = [
    { key: "report", label: "Brief", description: "Generate a detailed info" },
  ];

  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIdx, setMentionStartIdx] = useState<number | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionHighlight, setMentionHighlight] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resizeTextarea = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useImperativeHandle(ref, () => ({
    setValue(value: string) {
      setInputValue(value);
      requestAnimationFrame(() => {
        resizeTextarea();
        inputRef.current?.focus();
      });
    },
  }));

  useEffect(() => {
    resizeTextarea();
  }, [inputValue, resizeTextarea]);

  const fetchMentionResults = useCallback(async (q: string) => {
    setMentionLoading(true);
    try {
      const res = await fetchFilters(q.trim(), 50);
      if (!res.status || !res.dimensions) {
        setMentionResults([]);
        return;
      }
      const results: MentionResult[] = [];
      for (const dim of Object.values(res.dimensions)) {
        if (EXCLUDED_DIMENSIONS.has(dim.dimension)) continue;
        if (!dim.status || !dim.values?.length) continue;
        for (const v of dim.values) {
          results.push({
            categoryKey: dim.dimension,
            categoryDisplay: dim.display,
            value: String(v),
          });
        }
      }
      setMentionResults(results);
    } catch {
      setMentionResults([]);
    } finally {
      setMentionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mentionOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (mentionQuery.trim() === "") {
      fetchMentionResults("");
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchMentionResults(mentionQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mentionQuery, mentionOpen, fetchMentionResults]);

  useEffect(() => {
    setMentionHighlight(0);
  }, [mentionResults]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      const cursorPos = e.target.selectionStart ?? val.length;
      setInputValue(val);

      // Detect / command at start of input (only when not in report mode)
      if (!isReportMode && val.startsWith("/")) {
        setSlashOpen(true);
        setSlashHighlight(0);
      } else if (slashOpen) {
        setSlashOpen(false);
      }

      const textBeforeCursor = val.slice(0, cursorPos);
      const atIdx = textBeforeCursor.lastIndexOf("@");

      if (atIdx !== -1) {
        const charBefore = atIdx > 0 ? val[atIdx - 1] : " ";
        if (charBefore === " " || atIdx === 0) {
          const query = textBeforeCursor.slice(atIdx + 1);
          setMentionOpen(true);
          setMentionStartIdx(atIdx);
          setMentionQuery(query);
          return;
        }
      }

      if (mentionOpen) {
        setMentionOpen(false);
        setMentionQuery("");
        setMentionStartIdx(null);
      }
    },
    [mentionOpen, slashOpen, isReportMode]
  );

  const handleMentionSelect = useCallback(
    (result: MentionResult) => {
      if (mentionStartIdx === null) return;
      const before = inputValue.slice(0, mentionStartIdx);
      const cursorPos = inputRef.current?.selectionStart ?? inputValue.length;
      const after = inputValue.slice(cursorPos);
      const insertText = `${result.categoryDisplay}: ${result.value}`;
      const newValue = `${before}${insertText} ${after}`;
      setInputValue(newValue);
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStartIdx(null);
      setMentionResults([]);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const pos = before.length + insertText.length + 1;
          inputRef.current.setSelectionRange(pos, pos);
        }
      });
    },
    [inputValue, mentionStartIdx]
  );

  const handleSlashSelect = useCallback(
    (command: (typeof SLASH_COMMANDS)[0]) => {
      if (command.key === "report") {
        setIsReportMode(true);
        setInputValue("");
        setSlashOpen(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    []
  );

  const clearReportMode = useCallback(() => {
    setIsReportMode(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed, isReportMode ? { is_report: true } : undefined);
    setInputValue("");
    setMentionOpen(false);
    setIsReportMode(false);
  }, [inputValue, onSubmit, disabled, isReportMode]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Slash command navigation
      if (slashOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashHighlight((prev) => (prev < SLASH_COMMANDS.length - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashHighlight((prev) => (prev > 0 ? prev - 1 : SLASH_COMMANDS.length - 1));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          handleSlashSelect(SLASH_COMMANDS[slashHighlight]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashOpen(false);
          setInputValue("");
          return;
        }
      }

      // Escape report mode
      if (isReportMode && e.key === "Escape") {
        e.preventDefault();
        clearReportMode();
        return;
      }

      if (mentionOpen && mentionResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionHighlight((prev) => (prev < mentionResults.length - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionHighlight((prev) => (prev > 0 ? prev - 1 : mentionResults.length - 1));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          handleMentionSelect(mentionResults[mentionHighlight]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionOpen(false);
          return;
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, mentionOpen, mentionResults, mentionHighlight, handleMentionSelect, slashOpen, slashHighlight, handleSlashSelect, isReportMode, clearReportMode]
  );

  useEffect(() => {
    if (!mentionOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        mentionPopoverRef.current &&
        !mentionPopoverRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setMentionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mentionOpen]);

  const groupedResults = mentionResults.reduce<
    Record<string, { display: string; items: MentionResult[] }>
  >((acc, r) => {
    if (!acc[r.categoryKey]) {
      acc[r.categoryKey] = { display: r.categoryDisplay, items: [] };
    }
    acc[r.categoryKey].items.push(r);
    return acc;
  }, {});

  let flatIdx = -1;

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToCategory = useCallback((categoryKey: string) => {
    const element = categoryRefs.current[categoryKey];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  return (
    <div className="relative w-full">
      {/* Slash Command Popover */}
      <AnimatePresence>
        {slashOpen && (
          <motion.div
            ref={slashPopoverRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 mb-2 bg-card rounded-[10px] shadow-xl border border-border-mid w-[240px] overflow-hidden z-50"
          >
            <div className="px-3 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-wider border-b border-border-subtle">
              Commands
            </div>
            {SLASH_COMMANDS.map((cmd, idx) => (
              <button
                key={cmd.key}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSlashSelect(cmd); }}
                onMouseEnter={() => setSlashHighlight(idx)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                  idx === slashHighlight
                    ? "bg-text-primary/10 text-text-primary"
                    : "text-text-secondary hover:bg-hover"
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-text-primary/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <path d="M3 3h10v10H3z" /><path d="M6 6h4M6 8h4M6 10h2" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium">{cmd.label}</div>
                  <div className="text-[11px] text-text-tertiary">{cmd.description}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention Popover */}
      <AnimatePresence>
        {mentionOpen && (
          <motion.div
            ref={mentionPopoverRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-[10px] shadow-xl border border-border-mid max-w-[480px] overflow-hidden z-50"
          >
            {mentionLoading && mentionResults.length === 0 ? (
              <div className="p-4 text-sm text-text-tertiary text-center">
                <span className="inline-block animate-spin mr-2">&#9696;</span>
                Loading filters…
              </div>
            ) : mentionResults.length === 0 && !mentionLoading ? (
              <div className="p-4 text-sm text-text-tertiary text-center">
                {mentionQuery.trim() ? (
                  <>No results found for &quot;{mentionQuery}&quot;</>
                ) : (
                  <>No results available</>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 px-3 py-2.5 border-b border-border-subtle bg-card">
                  {Object.keys(groupedResults).map((categoryKey) => {
                    const IconComponent = CATEGORY_ICONS[categoryKey] ?? Layers;
                    return (
                      <button
                        key={categoryKey}
                        type="button"
                        onClick={() => scrollToCategory(categoryKey)}
                        className="w-10 h-10 rounded-full hover:bg-hover transition-all flex items-center justify-center group"
                        title={groupedResults[categoryKey].display}
                      >
                        <IconComponent className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
                      </button>
                    );
                  })}
                </div>

                <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
                  {Object.entries(groupedResults).map(([key, group]) => {
                    const IconComponent = CATEGORY_ICONS[key] ?? Layers;
                    return (
                      <div
                        key={key}
                        ref={(el) => { categoryRefs.current[key] = el; }}
                        className="border-b border-border-subtle last:border-b-0"
                      >
                        <div className="px-4 py-2.5 text-sm font-semibold text-text-primary bg-surface sticky top-0">
                          {group.display}
                        </div>
                        <div className="bg-card">
                          {group.items.slice(0, 8).map((item, itemIdx) => {
                            flatIdx++;
                            const idx = flatIdx;
                            return (
                              <button
                                key={`${item.categoryKey}-${item.value}-${itemIdx}`}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(item); }}
                                onMouseEnter={() => setMentionHighlight(idx)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 border-b border-border-subtle last:border-b-0 ${
                                  idx === mentionHighlight
                                    ? "bg-text-primary/10 text-text-primary"
                                    : "text-text-secondary hover:bg-hover"
                                }`}
                              >
                                {IconComponent && (
                                  <IconComponent className="w-4 h-4 shrink-0 text-text-primary" />
                                )}
                                <span className="truncate">{item.value}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input wrapper */}
      <div className="relative">
        {isReportMode && (
          <div className="absolute left-3 top-3 flex items-center gap-1 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-text-primary text-white text-[11px] font-medium rounded-md">
              Brief
              <button
                type="button"
                onClick={clearReportMode}
                className="ml-0.5 hover:opacity-70"
              >
                ×
              </button>
            </span>
          </div>
        )}
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={isReportMode ? "Describe the report you want…" : placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full pr-13 py-3 border border-border-mid rounded-lg bg-card text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-border-strong focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] disabled:opacity-50 resize-none overflow-y-auto scrollbar-hide ${
            isReportMode ? "pl-[85px]" : "px-4"
          }`}
          style={{ maxHeight: 200 }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!inputValue.trim() || disabled}
          className="absolute right-2 bottom-3 w-8 h-8 rounded-[10px] bg-text-primary border-none flex items-center justify-center cursor-pointer transition-all hover:bg-[#333330] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </button>
      </div>

      {/* <div className="text-center text-[11px] text-text-tertiary mt-2">
        Press Enter to send · Shift+Enter for new line
      </div> */}
    </div>
  );
}
