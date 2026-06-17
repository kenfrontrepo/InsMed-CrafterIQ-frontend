"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={new Date(currentYear - 50, 0)}
      endMonth={new Date(currentYear, 11)}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center items-center px-9 pt-1",
        caption_label: "hidden",
        dropdowns: "flex items-center gap-1",
        dropdown_root: "relative inline-flex items-center",
        dropdown: "absolute inset-0 w-full opacity-0 cursor-pointer z-10",
        months_dropdown: "h-7 appearance-none pl-2 pr-6 text-sm font-medium bg-card border border-border-mid rounded hover:bg-hover cursor-pointer",
        years_dropdown: "h-7 appearance-none pl-2 pr-6 text-sm font-medium bg-card border border-border-mid rounded hover:bg-hover cursor-pointer",
        nav: "absolute top-1 left-1 right-1 flex items-center justify-between z-10 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
        weeks: "w-full",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
        Dropdown: ({ value, onChange, options }) => {
          const selected = options?.find((o) => o.value === value)
          return (
            <div className="relative inline-flex items-center">
              <span className="h-7 inline-flex items-center pl-2 pr-6 text-sm font-medium bg-card border border-border-mid rounded pointer-events-none select-none">
                {selected?.label}
              </span>
              <ChevronDown className="absolute right-1.5 size-3 text-text-secondary pointer-events-none" />
              <select
                value={value}
                onChange={onChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              >
                {options?.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
