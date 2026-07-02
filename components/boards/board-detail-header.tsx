"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Pencil, FileText, ListFilter, Plus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface BoardDetailHeaderProps {
  boardName: string;
  pinCount: number;
  isWriteMode: boolean;
  canManage: boolean;
  isSharedView?: boolean;
  accessLabel?: string | null;
  showSummary: boolean;
  showSearchFilter: boolean;
  onBack: () => void;
  onModeChange: (writeMode: boolean) => void;
  onToggleSummary: () => void;
  onToggleSearchFilter: () => void;
  onAddPins: () => void;
}

export const BoardDetailHeader = memo(function BoardDetailHeader({
  boardName,
  pinCount,
  isWriteMode,
  canManage,
  isSharedView = false,
  accessLabel,
  showSummary,
  showSearchFilter,
  onBack,
  onModeChange,
  onToggleSummary,
  onToggleSearchFilter,
  onAddPins,
}: BoardDetailHeaderProps) {
  const router = useRouter();

  return (
    <header className="w-full z-10 bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left: Breadcrumb + Title */}
        <div className="flex flex-col gap-1 min-w-0 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-semibold text-text-primary truncate max-w-[200px]">
              {/* {boardName} */} Board Details
            </h1>
          </div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="text-xs cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/Boards");
                  }}
                >
                  Boards
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs truncate max-w-[200px]">
                  {boardName}
                </BreadcrumbPage>
              </BreadcrumbItem>
              {accessLabel ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {accessLabel}
                    </span>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right: Summary Toggle + Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Edit-mode only controls — owner or manage permission */}
          {canManage && isWriteMode && (
            <>
              {/* Filter Toggle */}
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showSearchFilter ? "secondary" : "outline"}
                      size="icon-sm"
                      onClick={onToggleSearchFilter}
                    >
                      <ListFilter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showSearchFilter ? "Hide filters" : "Show filters"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Summary Toggle */}
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showSummary ? "secondary" : "outline"}
                      size="icon-sm"
                      onClick={onToggleSummary}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showSummary ? "Hide summary" : "Show summary"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Add Pins Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onAddPins}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Pins
              </Button>
            </>
          )}

          {/* Mode Toggle — hidden for view-only shared boards */}
          {canManage ? (
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center border border-border-mid rounded-lg p-1 bg-hover">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={!isWriteMode ? "secondary" : "ghost"}
                      className={!isWriteMode ? "bg-text-primary/10" : ""}
                      size="icon-sm"
                      onClick={() => onModeChange(false)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Read mode</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isWriteMode ? "secondary" : "ghost"}
                      className={isWriteMode ? "bg-text-primary/10" : ""}
                      size="icon-sm"
                      onClick={() => onModeChange(true)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit mode</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          ) : isSharedView ? (
            <span className="text-xs font-medium text-text-secondary px-2.5 py-1.5 rounded-md bg-hover border border-border-mid">
              View only
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
});
