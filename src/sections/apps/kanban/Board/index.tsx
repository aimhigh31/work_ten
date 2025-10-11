'use client';

import { useState, useMemo } from 'react';

// material-ui
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// third-party
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';

// project-imports
import AddColumn from './AddColumn';
import BoardHeader from './BoardHeader';
import Columns from './Columns';
import ItemDetails from './ItemDetails';
import AddItem from './AddItem';

import { updateColumnItemOrder, updateColumnOrder, useGetBacklogs } from 'api/kanban';
import MainCard from 'components/MainCard';
import { GRID_COMMON_SPACING } from 'config';

// types
import { KanbanColumn, KanbanItem } from 'types/kanban';

const getDragWrapper = () => ({
  p: 2.5,
  px: 0,
  bgcolor: 'transparent',
  display: 'flex',
  overflow: 'auto',
  gap: GRID_COMMON_SPACING,
  minHeight: 'calc(100vh - 320px)' // 적절한 최소 높이 설정
});

// 스켈레톤 로딩 높이 옵션
const heightOptions = [120, 160, 200, 240];

// ==============================|| KANBAN - 개선된 보드 ||============================== //

export default function Board() {
  const { backlogs: lists, backlogsLoading: loading } = useGetBacklogs();

  // 필터링 상태
  const [searchValue, setSearchValue] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);

  // 필터링된 아이템들
  const filteredItems = useMemo(() => {
    if (!lists?.items) return [];

    return lists.items.filter((item: KanbanItem) => {
      // 검색 필터 (제목, 설명 포함)
      const matchesSearch =
        !searchValue ||
        item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.description.toLowerCase().includes(searchValue.toLowerCase());

      // 담당자 필터
      const matchesAssignee = assigneeFilter.length === 0 || (item.assign && assigneeFilter.includes(item.assign));

      // 우선순위 필터
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(item.priority);

      return matchesSearch && matchesAssignee && matchesPriority;
    });
  }, [lists?.items, searchValue, assigneeFilter, priorityFilter]);

  // 필터링된 컬럼들 (필터링된 아이템만 포함)
  const filteredColumns = useMemo(() => {
    if (!lists?.columns) return [];

    return lists.columns.map((column: KanbanColumn) => ({
      ...column,
      itemIds: column.itemIds.filter((itemId) => filteredItems.some((item) => item.id === itemId))
    }));
  }, [lists?.columns, filteredItems]);

  // 보드 통계 계산
  const boardStats = useMemo(() => {
    if (!lists?.columns || !lists?.items) {
      return {
        total: 0,
        filtered: 0,
        byColumn: {},
        byPriority: { high: 0, medium: 0, low: 0 }
      };
    }

    // 컬럼별 통계
    const byColumn = lists.columns.reduce((acc: any, column: KanbanColumn) => {
      const columnItems = filteredItems.filter((item) => column.itemIds.includes(item.id));
      acc[column.id] = {
        title: column.title,
        count: columnItems.length,
        totalCount: column.itemIds.length
      };
      return acc;
    }, {});

    // 우선순위별 통계
    const byPriority = {
      high: filteredItems.filter((item) => item.priority === 'high').length,
      medium: filteredItems.filter((item) => item.priority === 'medium').length,
      low: filteredItems.filter((item) => item.priority === 'low').length
    };

    return {
      total: lists.items.length,
      filtered: filteredItems.length,
      byColumn,
      byPriority
    };
  }, [lists, filteredItems]);

  // Drag & Drop 핸들러
  const onDragEnd = (result: DropResult) => {
    let newColumn: KanbanColumn[];
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'column') {
      const newColumnsOrder = Array.from(lists?.columnsOrder as string[]);
      newColumnsOrder.splice(source.index, 1);
      newColumnsOrder.splice(destination?.index, 0, draggableId);
      updateColumnOrder(newColumnsOrder);
      return;
    }

    // 소스 컬럼과 대상 컬럼 찾기
    const sourceColumn = lists?.columns.filter((item: KanbanColumn) => item.id === source.droppableId)[0];
    const destinationColumn = lists?.columns.filter((item: KanbanColumn) => item.id === destination.droppableId)[0];

    if (sourceColumn === destinationColumn) {
      // 같은 컬럼 내에서 이동
      const newItemIds = Array.from(sourceColumn.itemIds);
      newItemIds.splice(source.index, 1);
      newItemIds.splice(destination.index, 0, draggableId);

      const newSourceColumn = { ...sourceColumn, itemIds: newItemIds };
      newColumn = lists?.columns.map((column: KanbanColumn) => (column.id === newSourceColumn.id ? newSourceColumn : column));
    } else {
      // 다른 컬럼으로 이동
      const newSourceItemIds = Array.from(sourceColumn.itemIds);
      newSourceItemIds.splice(source.index, 1);
      const newSourceColumn = { ...sourceColumn, itemIds: newSourceItemIds };

      const newDestinationItemIds = Array.from(destinationColumn.itemIds);
      newDestinationItemIds.splice(destination.index, 0, draggableId);
      const newDestinationColumn = { ...destinationColumn, itemIds: newDestinationItemIds };

      newColumn = lists?.columns.map((column: KanbanColumn) => {
        if (column.id === newSourceColumn.id) return newSourceColumn;
        if (column.id === newDestinationColumn.id) return newDestinationColumn;
        return column;
      });
    }

    updateColumnItemOrder(newColumn);
  };

  const handleAddTask = () => {
    setShowAddItem(true);
  };

  // 활성 필터가 있는지 확인
  const hasActiveFilters = searchValue || assigneeFilter.length > 0 || priorityFilter.length > 0;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4].map((index) => (
            <MainCard key={index} content={false} sx={{ p: 1.5, minWidth: 280, flex: 1, bgcolor: 'secondary.lighter' }}>
              <Stack sx={{ gap: 1.25 }}>
                <Skeleton variant="rounded" width="100%" height={38} />
                <Skeleton variant="rounded" width="100%" height={heightOptions[0]} />
                <Skeleton variant="rounded" width="100%" height={heightOptions[1]} />
                <Skeleton variant="rounded" width="100%" height={heightOptions[2]} />
              </Stack>
            </MainCard>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* 개선된 보드 헤더 */}
      <BoardHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        profiles={lists?.profiles || []}
        onAddTask={handleAddTask}
      />

      {/* 필터 통계 및 요약 */}
      {hasActiveFilters && (
        <MainCard sx={{ mb: 2, bgcolor: 'primary.lighter', border: '1px solid', borderColor: 'primary.main' }}>
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" component="span" sx={{ color: 'primary.main' }}>
                    🔍 필터 결과: {boardStats.filtered}개
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                    (전체 {boardStats.total}개 중)
                  </Typography>
                </Box>

                {filteredItems.length === 0 && (
                  <Box sx={{ color: 'warning.main', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span">⚠️</Box>
                    <Typography variant="body2">조건에 맞는 태스크가 없습니다</Typography>
                  </Box>
                )}
              </Stack>

              {/* 우선순위별 요약 */}
              {filteredItems.length > 0 && (
                <Stack direction="row" spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%' }} />
                    <Typography variant="body2">높음: {boardStats.byPriority.high}개</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%' }} />
                    <Typography variant="body2">보통: {boardStats.byPriority.medium}개</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, bgcolor: 'info.main', borderRadius: '50%' }} />
                    <Typography variant="body2">낮음: {boardStats.byPriority.low}개</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>
        </MainCard>
      )}

      {/* 칸반 보드 메인 영역 */}
      <Box sx={{ display: 'flex', position: 'relative' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="columns" direction="horizontal" type="column">
            {(provided) => (
              <MainCard
                border={false}
                ref={provided.innerRef}
                sx={{
                  bgcolor: 'transparent',
                  width: '100%',
                  boxShadow: 'none'
                }}
                contentSX={getDragWrapper()}
                {...provided.droppableProps}
              >
                {lists?.columnsOrder.map((columnId: string, index: number) => {
                  const originalColumn = lists?.columns.filter((item: KanbanColumn) => item.id === columnId)[0];
                  const filteredColumn = filteredColumns.find((item: KanbanColumn) => item.id === columnId);

                  return <Columns key={columnId} column={filteredColumn || originalColumn} index={index} />;
                })}
                {provided.placeholder}
                <AddColumn />
              </MainCard>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      {/* 아이템 상세 보기 다이얼로그 */}
      <ItemDetails />

      {/* 새 아이템 추가 다이얼로그는 AddItem 내부에서 관리됨 */}
    </Box>
  );
}
