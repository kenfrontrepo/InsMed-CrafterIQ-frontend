"use client";

import {
  memo,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  Responsive,
  WidthProvider,
  type Layout,
  type LayoutItem,
} from "react-grid-layout/legacy";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { PinCard, PinCardSkeleton, type Pin } from "./pin-card";

const ResponsiveGridLayout = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 150;
const MARGIN: [number, number] = [16, 16];

function apiSizeToGridW(apiWidth: number): number {
  if (apiWidth >= 2) return 12;
  return 6;
}

function apiSizeToGridH(apiHeight: number): number {
  return Math.max(apiHeight * 3, 3);
}

function gridWToApiSize(w: number): number {
  if (w >= 10) return 2;
  return 1;
}

function gridHToApiSize(h: number): number {
  return Math.max(Math.round(h / 3), 1);
}

function computeLayout(pins: Pin[]): LayoutItem[] {
  const sorted = [...pins].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
  let currentX = 0;
  let currentY = 0;
  let rowMaxH = 0;

  return sorted.map((pin) => {
    const w = apiSizeToGridW(pin.size?.width ?? 1);
    const h = apiSizeToGridH(pin.size?.height ?? 1);

    if (currentX + w > 12) {
      currentX = 0;
      currentY += rowMaxH;
      rowMaxH = 0;
    }

    const item: LayoutItem = {
      i: pin.id,
      x: currentX,
      y: currentY,
      w,
      h,
      minW: 3,
      minH: 2,
    };

    currentX += w;
    rowMaxH = Math.max(rowMaxH, h);

    return item;
  });
}

function layoutToApiPayload(
  layout: Layout
): Array<{
  pin_id: string;
  position: number;
  size: { width: number; height: number };
}> {
  const sorted = [...layout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return sorted.map((item, index) => ({
    pin_id: item.i,
    position: index,
    size: {
      width: gridWToApiSize(item.w),
      height: gridHToApiSize(item.h),
    },
  }));
}

interface PinGridProps {
  pins: Pin[];
  isWriteMode: boolean;
  isLoading?: boolean;
  boardId?: string;
  userId?: string;
  onLayoutSave?: (
    pins: Array<{
      pin_id: string;
      position: number;
      size: { width: number; height: number };
    }>
  ) => void;
}

export const PinGrid = memo(function PinGrid({
  pins,
  isWriteMode,
  isLoading = false,
  boardId,
  userId,
  onLayoutSave,
}: PinGridProps) {
  const [currentLayout, setCurrentLayout] = useState<Layout>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInteractedRef = useRef(false);

  const initialLayouts = useMemo(() => {
    if (pins.length === 0) return { lg: [] as LayoutItem[] };
    return { lg: computeLayout(pins) };
  }, [pins]);

  useEffect(() => {
    if (pins.length > 0) {
      setCurrentLayout(computeLayout(pins));
      userInteractedRef.current = false;
    }
  }, [pins]);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      setCurrentLayout(layout);
      if (!isWriteMode || !onLayoutSave || !userInteractedRef.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const payload = layoutToApiPayload(layout);
        onLayoutSave(payload);
      }, 800);
    },
    [isWriteMode, onLayoutSave]
  );

  const markInteracted = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const heightMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of currentLayout) {
      map.set(item.i, item.h * ROW_HEIGHT);
    }
    return map;
  }, [currentLayout]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <PinCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (pins.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveGridLayout
      className="pin-grid-layout"
      layouts={initialLayouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      margin={MARGIN}
      containerPadding={[0, 0]}
      isDraggable={isWriteMode}
      isResizable={isWriteMode}
      draggableHandle=".drag-handle"
      draggableCancel=".no-drag"
      resizeHandles={["se"]}
      compactType="vertical"
      onLayoutChange={handleLayoutChange}
      onDragStop={markInteracted}
      onResizeStop={markInteracted}
      useCSSTransforms
      autoSize
    >
      {pins.map((pin) => (
        <div key={pin.id}>
          <PinCard
            pin={pin}
            isWriteMode={isWriteMode}
            boardId={boardId}
            userId={userId}
            chartHeight={heightMap.get(pin.id) ?? 450}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
});

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-64 text-center"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Eye className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No pins found</h3>
      <p className="text-sm text-gray-500">
        Try adjusting your search or filters.
      </p>
    </motion.div>
  );
}
