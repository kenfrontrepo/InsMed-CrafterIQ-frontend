import { BarChart3, Bell, FileText, type LucideIcon } from "lucide-react";
import type { PinItem } from "./types";

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function getTypeConfig(responseType: PinItem["response_type"]): {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
} {
  switch (responseType) {
    case "chart":
    case "table":
      return { icon: BarChart3, bgColor: "bg-blue-50", textColor: "text-blue-600" };
    case "alert":
      return { icon: Bell, bgColor: "bg-red-50", textColor: "text-red-600" };
    case "note":
    default:
      return { icon: FileText, bgColor: "bg-amber-50", textColor: "text-amber-600" };
  }
}
