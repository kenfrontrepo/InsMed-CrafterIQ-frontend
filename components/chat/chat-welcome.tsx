"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore, type ChatContext } from "@/stores/chat-store";

interface DynCard {
  meta: string;
  question: string;
  highlights: string[];
  prompt: string;
}

const SAMPLE_QUESTIONS: DynCard[] = [
  {
    meta: "Status breakdown",
    question: "How many projects are in progress vs. closed vs. on hold?",
    highlights: ["in progress", "closed", "on hold"],
    prompt: "How many projects are currently in progress vs. closed vs. on hold?",
  },
  {
    meta: "Project types",
    question: "What's the distribution of project types (AI/Complex/Simple) by business unit?",
    highlights: ["project types", "business unit"],
    prompt: "What's the distribution of project types (AI/Complex/Simple) by business unit?",
  },
  {
    meta: "Off-track risk",
    question: "Which business units have the most off-track projects?",
    highlights: ["business units", "off-track"],
    prompt: "Which business units have the most off-track projects?",
  },
  {
    meta: "Growth over time",
    question: "How has the portfolio grown over time by created date?",
    highlights: ["portfolio grown over time"],
    prompt: "How has the portfolio grown over time (by Created on)?",
  },
];

const CARDS_BY_CONTEXT: Record<ChatContext, DynCard[]> = {
  sales: SAMPLE_QUESTIONS,
  opportunities: SAMPLE_QUESTIONS,
};

interface DatasetOption {
  key: ChatContext;
  label: string;
  initials: string;
  iconBg: string;
  iconColor: string;
  meta: string;
  description: string;
  pillMeta: string;
  badge: "active" | "live" | "stale";
  updated: string;
  category?: string;
}

const DATASETS: DatasetOption[] = [
  {
    key: "sales",
    label: "IT Project Portfolio",
    initials: "IP",
    iconBg: "#EBF3FD",
    iconColor: "#185FA5",
    meta: "Insmed · Projects, budgets, status, business units",
    description: "Project portfolio data from Insmed IT. Pick a direction or ask directly below.",
    pillMeta: "Insmed CrafterIQ",
    badge: "active",
    updated: "Live",
    category: "Portfolio",
  },
];

function highlightText(text: string, highlights: string[]) {
  let result = text;
  for (const h of highlights) {
    result = result.replace(
      new RegExp(`(${h})`, "gi"),
      `<em class="not-italic text-accent-green-dark font-medium">$1</em>`
    );
  }
  return result;
}

function DatasetSwitcherOverlay({
  open,
  activeKey,
  onSelect,
  onClose,
}: {
  open: boolean;
  activeKey: ChatContext;
  onSelect: (ds: DatasetOption) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = !search.trim()
      ? DATASETS
      : DATASETS.filter((ds) => {
          const q = search.toLowerCase();
          return ds.label.toLowerCase().includes(q) || ds.meta.toLowerCase().includes(q);
        });

    const groups: { category: string; items: DatasetOption[] }[] = [];
    for (const ds of list) {
      const cat = ds.category || "Other";
      const existing = groups.find((g) => g.category === cat);
      if (existing) existing.items.push(ds);
      else groups.push({ category: cat, items: [ds] });
    }
    return groups;
  }, [search]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-surface/97 z-20 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-12 pt-5 shrink-0">
            <div className="text-[17px] font-medium text-text-primary flex-1">Switch dataset</div>
            <button
              onClick={onClose}
              className="w-[30px] h-[30px] rounded-md border border-border-mid bg-transparent flex items-center justify-center cursor-pointer hover:bg-hover transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M4 4l8 8M12 4l-8 8"/>
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="px-12 py-3.5 shrink-0">
            <input
              type="text"
              placeholder="Search datasets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 border border-border-mid rounded-[10px] bg-card text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-border-strong"
            />
          </div>

          {/* Dataset list */}
          <div className="flex-1 overflow-y-auto px-12 pb-8">
            {filtered.map((group) => (
              <div key={group.category} className="mb-4">
                <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-text-tertiary mb-2 px-1">
                  {group.category}
                </div>
                {group.items.map((ds, idx) => {
                  const isActive = ds.key === activeKey && ds.badge === "active";
                  const badgeClass = isActive
                    ? "bg-[#EBF3FD] text-[#185FA5]"
                    : ds.badge === "stale"
                      ? "bg-[#FEF2F2] text-[#dc2626]"
                      : "bg-accent-green-light text-accent-green-dark";
                  const badgeLabel = isActive ? "In use" : ds.badge === "stale" ? "Stale" : "Live";
                  return (
                    <button
                      key={`${ds.label}-${idx}`}
                      onClick={() => onSelect(ds)}
                      className={`flex items-center gap-3 w-full bg-card border rounded-[14px] px-3.5 py-3 mb-1.5 cursor-pointer text-left transition-colors ${
                        isActive
                          ? "border-accent-green border-[1.5px]"
                          : "border-border-subtle hover:border-border-strong"
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-medium shrink-0"
                        style={{ background: ds.iconBg, color: ds.iconColor }}
                      >
                        {ds.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-text-primary truncate">{ds.label}</div>
                        <div className="text-[11px] text-text-tertiary mt-0.5">{ds.meta}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-px rounded-full whitespace-nowrap ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                        <span className="text-[11px] text-text-tertiary">{ds.updated}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ChatWelcomeProps {
  onSuggestionSelect: (query: string) => void;
}

export function ChatWelcome({ onSuggestionSelect }: ChatWelcomeProps) {
  const selectedContext = useChatStore((state) => state.selectedContext);
  const setSelectedContext = useChatStore((state) => state.setSelectedContext);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const activeDataset = useMemo(
    () => DATASETS.find((d) => d.key === selectedContext) ?? DATASETS[0],
    [selectedContext]
  );

  const cards = useMemo(
    () => CARDS_BY_CONTEXT[selectedContext] ?? SAMPLE_QUESTIONS,
    [selectedContext]
  );

  const handleChipClick = useCallback(
    (prompt: string) => {
      onSuggestionSelect(prompt);
    },
    [onSuggestionSelect]
  );

  const handleDatasetSelect = useCallback(
    (ds: DatasetOption) => {
      setSelectedContext(ds.key);
      setSwitcherOpen(false);
    },
    [setSelectedContext]
  );

  return (
    <div className="flex-1 overflow-y-auto px-12 pt-12 pb-36 relative">
      {/* Dataset Switcher Overlay */}
      <DatasetSwitcherOverlay
        open={switcherOpen}
        activeKey={selectedContext}
        onSelect={handleDatasetSelect}
        onClose={() => setSwitcherOpen(false)}
      />

      <div className="max-w-3xl p-4 w-full mx-auto" style={{ animation: "fadeUp 0.3s ease both" }}>
        {/* Dataset pill — click to open switcher */}
        <button
          onClick={() => setSwitcherOpen(true)}
          className="inline-flex items-center gap-[7px] bg-card border border-border-mid rounded-full px-3 py-[5px] pl-2 text-xs text-text-secondary cursor-pointer hover:border-border-strong hover:bg-hover transition-colors mb-8 select-none"
        >
          <div className="w-[7px] h-[7px] rounded-full bg-accent-green shrink-0" />
          <span className="font-medium text-text-primary">{activeDataset.label}</span>
          <span className="text-border-strong">·</span>
          <span>{activeDataset.pillMeta}</span>
          <span className="text-[9px] text-text-tertiary ml-0.5">▾</span>
        </button>

        {/* Greeting */}
        <h1
          className="text-2xl font-light text-text-primary mb-1.5 leading-snug tracking-tight"
          style={{ animationDelay: "0.08s", animation: "fadeUp 0.3s ease both" }}
        >
          What do you want to <strong className="font-medium">understand</strong> today?
        </h1>

        {/* Subtext */}
        <p
          className="text-sm text-text-secondary mb-8 leading-relaxed"
          style={{ animationDelay: "0.12s", animation: "fadeUp 0.3s ease both" }}
        >
          You&apos;re in{" "}
          <span className="not-italic text-accent-green-dark font-mono text-xs bg-accent-green-light px-1.5 py-px rounded">
            {activeDataset.label}
          </span>{" "}
          — {activeDataset.description}
        </p>

        {/* Sample questions */}
        <div style={{ animationDelay: "0.16s", animation: "fadeUp 0.3s ease both" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
            {cards.map((card) => (
                <button
                  key={card.meta}
                  type="button"
                  onClick={() => handleChipClick(card.prompt)}
                  className="bg-card border border-border-subtle rounded-[14px] px-4 py-3.5 cursor-pointer text-left hover:border-border-strong hover:bg-hover transition-all active:scale-[0.985]"
                >
                  <div className="text-[10px] text-text-tertiary tracking-wide mb-1.5">
                    {card.meta}
                  </div>
                  <div
                    className="text-[13px] text-text-primary leading-snug"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(card.question, card.highlights),
                    }}
                  />
                </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
