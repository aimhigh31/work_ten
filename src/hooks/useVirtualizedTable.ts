import { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

export interface VirtualizedTableProps<T> {
  data: T[];
  height: number;
  itemHeight: number;
  overscan?: number;
}

export interface VirtualizedTableRow<T> {
  index: number;
  style: React.CSSProperties;
  data: T;
}

export function useVirtualizedTable<T>({
  data,
  height,
  itemHeight,
  overscan = 5
}: VirtualizedTableProps<T>) {
  const [scrollOffset, setScrollOffset] = useState(0);

  const itemCount = data.length;

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    setScrollOffset(scrollOffset);
  }, []);

  const ListComponent = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => (
      <List
        height={height}
        itemCount={itemCount}
        itemSize={itemHeight}
        itemData={data}
        overscanCount={overscan}
        onScroll={handleScroll}
      >
        {children}
      </List>
    );
  }, [data, height, itemCount, itemHeight, overscan, handleScroll]);

  return {
    ListComponent,
    scrollOffset,
    itemCount,
    visibleStartIndex: Math.floor(scrollOffset / itemHeight),
    visibleStopIndex: Math.min(
      Math.floor((scrollOffset + height) / itemHeight),
      itemCount - 1
    )
  };
}