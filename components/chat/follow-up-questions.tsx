"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FollowUpQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export const FollowUpQuestions = memo(function FollowUpQuestions({
  questions,
  onSelect,
}: FollowUpQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide"
      >
        {questions.map((question, index) => (
          <motion.button
            key={question}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(question)}
            className="px-3 py-1.5 text-xs text-text-primary bg-hover hover:bg-border-subtle border border-border-mid rounded-full transition-colors whitespace-nowrap shrink-0"
          >
            {question}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
});
