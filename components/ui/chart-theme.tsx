/**
 * Resolves amCharts-compatible hex colors based on the current light/dark theme.
 * Reads the `class` attribute on <html> at call time so the chart layout effect
 * always picks up the active mode.
 */

function isDark(): boolean {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  }
  
  export function getChartColors() {
    const dark = isDark();
    return {
      /** Axis tick / label text */
      axisLabel: dark ? "#a1a1aa" : "#6b7280",
      /** Axis title text (bolder) */
      axisTitle: dark ? "#d4d4d8" : "#374151",
      /** Grid lines */
      grid: dark ? "#3f3f46" : "#e5e7eb",
      /** Lighter secondary text (sub-labels, value labels) */
      secondary: dark ? "#a1a1aa" : "#9ca3af",
      /** Legend label text */
      legend: dark ? "#d4d4d8" : "#6b7280",
      /** Gauge hand / pin */
      gaugeHand: dark ? "#d4d4d8" : "#374151",
      /** Gauge pin border */
      gaugePinStroke: dark ? "#27272a" : "#ffffff",
    };
  }