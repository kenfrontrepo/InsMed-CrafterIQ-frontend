"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiMetric {
  label: string;
  value: number;
  delta: number | null;
  delta_type: "increase" | "decrease" | null;
  display_value: string;
}

interface KpiCardProps {
  metrics: KpiMetric[];
}

function DeltaBadge({
  delta,
  deltaType,
}: {
  delta: number | null;
  deltaType: "increase" | "decrease" | null;
}) {
  if (delta === null || delta === undefined) return null;

  const isIncrease = deltaType === "increase";
  const isDecrease = deltaType === "decrease";

  const bgColor = isIncrease
    ? "bg-emerald-50"
    : isDecrease
      ? "bg-red-50"
      : "bg-gray-50";
  const textColor = isIncrease
    ? "text-emerald-600"
    : isDecrease
      ? "text-red-600"
      : "text-gray-500";
  const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium ${bgColor} ${textColor}`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(delta)}%
    </span>
  );
}

export function KpiCard({ metrics }: KpiCardProps) {
  if (!metrics || metrics.length === 0) return null;

  const colCount = metrics.length <= 2 ? metrics.length : metrics.length <= 4 ? 2 : 3;

  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      {metrics.map((metric, idx) => (
        <div
          key={metric.label ?? idx}
          className="bg-gray-50 rounded-xl px-4 py-3.5 flex flex-col gap-1.5 border border-gray-100"
        >
          <span className="text-xs font-medium text-gray-500 truncate">
            {metric.label}
          </span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-semibold text-gray-900 leading-none">
              {metric.display_value ?? String(metric.value ?? "")}
            </span>
            <DeltaBadge delta={metric.delta} deltaType={metric.delta_type} />
          </div>
        </div>
      ))}
    </div>
  );
}
