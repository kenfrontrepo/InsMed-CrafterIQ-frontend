"use client";

import { memo } from "react";
import { motion } from "framer-motion";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onSelect: (suggestion: Suggestion) => void;
}

export const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  index,
  onSelect,
}: SuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(suggestion)}
      className="group flex flex-col items-start gap-3 p-4 bg-card border border-border-subtle rounded-[14px] text-left hover:border-border-strong hover:bg-hover transition-all duration-200"
    >
      <div className="p-2.5 bg-page rounded-[10px] text-text-secondary group-hover:bg-text-primary/10 group-hover:text-text-primary transition-colors">
        {suggestion.icon}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-[13px] text-text-primary leading-tight">
          {suggestion.title}
        </h3>
        <p className="text-[12px] text-text-tertiary leading-relaxed">
          {suggestion.description}
        </p>
      </div>
    </motion.button>
  );
});
