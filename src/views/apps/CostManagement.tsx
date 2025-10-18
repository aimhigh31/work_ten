'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// third-party
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// dnd-kit
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// Material-UI
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Project imports
import CostDataTable from 'views/apps/CostDataTable';
import { useSupabaseCost } from '../../hooks/useSupabaseCost';
import { costTypeOptions } from 'types/cost';
import { CostRecord } from 'types/cost';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';

// Icons
import { TableDocument, Chart, Calendar, Element, DocumentText } from '@wandersonalwes/iconsax-react';

// ==============================|| 비용관리 메인 페이지 ||============================== //

// 변경로그 타입 정의
interface ChangeLog {
  id: string;
  dateTime: string;
  title: string;
  code: string;
  action: string;
  location: string;
  changedField?: string;
  beforeValue?: string;
  afterValue?: string;
  description: string;
  team: string;
  user: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cost-tabpanel-${index}`}
      aria-labelledby={`cost-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ p: 0, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cost-tab-${index}`,
    'aria-controls': `cost-tabpanel-${index}`
  };
}

// ==============================|| COST KANBAN VIEW ||============================== //
interface CostKanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  costs: CostRecord[];
  updateCostRecord: (id: string, updates: Partial<CostRecord>) => Promise<CostRecord>;
  addChangeLog: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string
  ) => void;
  checkCodeExists: (code: string, excludeId?: number) => Promise<boolean>;
  assigneeList?: any[];
}

function CostKanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  costs,
  updateCostRecord,
  addChangeLog,
  checkCodeExists,
  assigneeList
}: CostKanbanViewProps) {
  const [activeCost, setActiveCost] = useState<CostRecord | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 다이얼로그 상태
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    recordId?: number;
  }>({
    open: false,
    recordId: undefined
  });

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = costs.filter((cost) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const costYear = new Date(cost.registrationDate).getFullYear().toString();
      if (costYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && cost.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && cost.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && cost.status !== selectedStatus) return false;
    return true;
  });

  // 상태별 컬럼 정의
  const statusColumns = [
    { key: '대기', title: '대기', pillBg: '#F0F0F0', pillColor: '#424242' },
    { key: '진행', title: '진행', pillBg: '#E3F2FD', pillColor: '#1976D2' },
    { key: '완료', title: '완료', pillBg: '#E8F5E8', pillColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillBg: '#FFEBEE', pillColor: '#D32F2F' }
  ];

  // 상태별 항목 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
  };

  // 상태에 따른 진행도 계산
  const getProgressByStatus = (status: string): number => {
    switch (status) {
      case '대기':
        return 20;
      case '진행':
        return 60;
      case '완료':
        return 100;
      case '홀딩':
        return 0;
      default:
        return 0;
    }
  };

  // 비용관리 담당자 아바타 매핑
  const assigneeAvatars = {
    김철수: '/assets/images/users/avatar-1.png',
    박영희: '/assets/images/users/avatar-2.png',
    이민수: '/assets/images/users/avatar-3.png',
    최윤정: '/assets/images/users/avatar-4.png',
    정상현: '/assets/images/users/avatar-5.png',
    김혜진: '/assets/images/users/avatar-6.png',
    송민호: '/assets/images/users/avatar-7.png',
    노수진: '/assets/images/users/avatar-8.png'
  } as const;

  // 카드 클릭 핸들러
  const handleCardClick = (cost: CostRecord) => {
    setEditDialog({ open: true, recordId: cost.id });
  };

  // 편집 다이얼로그 닫기
  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, recordId: undefined });
  };

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedCost = filteredData.find((cost) => cost.id === active.id);
    if (draggedCost) {
      setActiveCost(draggedCost);
      setIsDraggingState(true);
    }
  };

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCost(null);
    setIsDraggingState(false);

    if (!over || active.id === over.id) {
      return;
    }

    const costId = active.id as string;
    const newStatus = over.id as string;

    // 상태가 변경된 경우만 업데이트
    const currentCost = costs.find((cost) => cost.id === costId);
    if (currentCost && currentCost.status !== newStatus) {
      const oldStatus = currentCost.status;

      try {
        // Supabase에서 상태 업데이트
        await updateCostRecord(costId, { status: newStatus as typeof currentCost.status });

        // 변경로그 추가
        const costCode = currentCost.code || `COST-${costId}`;
        const content = currentCost.content || '비용내용 없음';
        const description = `비용관리 ${content}(${costCode}) 정보의 개요탭 상태가 ${oldStatus} → ${newStatus} 로 수정 되었습니다.`;
        await addChangeLog('수정', costCode, description, currentCost.team || '미분류', oldStatus, newStatus, '상태', content);
      } catch (error) {
        console.error('드래그 상태 업데이트 실패:', error);
      }
    }
  };

  // 팀 색상 가져오기
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  // 금액 포맷
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 드래그 가능한 카드 컴포넌트 (사양에 맞춰 완전히 새로 작성)
  function DraggableCard({ cost }: { cost: CostRecord }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: cost.id
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : 'pointer'
        }
      : { cursor: 'pointer' };

    // 상태별 태그 색상 (비용관리 전용)
    const getStatusTagStyle = (status: string) => {
      switch (status) {
        case '대기':
          return { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#f59e0b' };
        case '진행':
          return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
        case '완료':
          return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' };
        case '홀딩':
          return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' };
        default:
          return { backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#4b5563' };
      }
    };

    // 진행도 계산
    const progress = cost.progress || getProgressByStatus(cost.status);
    const progressStage = (() => {
      if (progress >= 80) return '결재 완료';
      if (progress >= 60) return '승인 대기';
      if (progress >= 40) return '검토 중';
      if (progress >= 20) return '신청 접수';
      return '신청 대기';
    })();

    return (
      <article
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="kanban-card"
        onClick={(e) => {
          if (!isDraggingState && !isDragging) {
            e.stopPropagation();
            handleCardClick(cost);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(cost.status)}>
            {cost.status}
          </span>
          <span className="incident-type-tag">{cost.costType || '일반비용'}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{cost.content || '비용내용 없음'}</h3>

        {/* 3. 정보 라인 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{cost.code || `COST-${cost.id}`}</span>
          </div>
          <div className="info-line">
            <span className="info-label">금액:</span>
            <span className="info-value">{cost.amount?.toLocaleString() || '0'}원</span>
          </div>
          <div className="info-line">
            <span className="info-label">완료일:</span>
            <span className="info-value">{cost.completionDate || '미정'}</span>
          </div>
        </div>

        {/* 4. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={
                assigneeList?.find((user) => user.user_name === cost.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === cost.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={cost.assignee || '미할당'}
            />
            <span className="assignee-name">{cost.assignee || '미할당'}</span>
          </div>
        </div>
      </article>
    );
  }

  // Droppable Column 컴포넌트
  function DroppableColumn({
    column,
    children
  }: {
    column: { key: string; title: string; pillBg: string; pillColor: string };
    children: React.ReactNode;
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id: column.key
    });

    return (
      <section
        ref={setNodeRef}
        className="kanban-column"
        style={{
          backgroundColor: isOver ? '#f5f5f5' : 'transparent'
        }}
      >
        <header className="column-header">
          <span
            className="pill"
            style={{
              background: column.pillBg,
              color: column.pillColor
            }}
          >
            {column.title}
          </span>
          <span className="count">{getItemsByStatus(column.key).length}</span>
        </header>
        {children}
      </section>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        fontFamily: '"Inter", "Noto Sans KR", sans-serif'
      }}
    >
      <style>{`
        .kanban-board {
          display: flex;
          gap: 32px;
          padding: 24px 24px 0 24px;
          overflow-x: auto;
          height: 100%;
        }
        
        .kanban-board::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .kanban-board::-webkit-scrollbar-track {
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        
        .kanban-board::-webkit-scrollbar-thumb {
          background-color: #e9ecef;
          border-radius: 4px;
          border: 2px solid #f8f9fa;
        }
        
        .kanban-board::-webkit-scrollbar-thumb:hover {
          background-color: #dee2e6;
        }
        
        .kanban-board::-webkit-scrollbar-corner {
          background-color: #f8f9fa;
        }
        
        .kanban-column {
          width: 340px;
          display: flex;
          flex-direction: column;
          row-gap: 12px;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .kanban-column {
            width: 220px;
          }
        }
        
        .column-header {
          display: flex;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #E4E6EB;
          margin-bottom: 8px;
        }
        
        .pill {
          padding: 6px 20px;
          border-radius: 9999px;
          font: 500 13px/0.5 "Inter", "Noto Sans KR", sans-serif;
        }
        
        .count {
          font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
          margin-left: 8px;
          color: #606060;
        }
        
        .kanban-card {
          background: #fff;
          border: 1px solid #E4E6EB;
          border-radius: 10px;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
          display: flex;
          flex-direction: column;
          row-gap: 12px;
          transition: all 0.2s ease;
        }
        
        .kanban-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,.1);
          transform: translateY(-1px);
        }

        /* 1. 상태 태그 영역 */
        .status-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .status-tag {
          padding: 4px 12px;
          border-radius: 20px;
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
        }

        .incident-type-tag {
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(156, 163, 175, 0.15);
          color: #4b5563;
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
        }

        /* 2. 카드 제목 */
        .card-title {
          font: 600 16px/1.3 "Inter", "Noto Sans KR", sans-serif;
          color: #1f2937;
          margin: 0 0 3px 0;
        }

        /* 3. 정보 라인 */
        .card-info {
          margin-bottom: 7px;
        }

        .info-line {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .info-label {
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
          color: #4b5563;
          margin-right: 6px;
          flex-shrink: 0;
        }

        .info-value {
          font: 400 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 4. 진행도 섹션 */
        .progress-section {
          margin-bottom: 16px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .progress-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-text {
          font: 600 12px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #374151;
        }

        .progress-stage {
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #6b7280;
        }

        .progress-percentage {
          font: 500 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #3b82f6;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        /* 5. 카드 푸터 */
        .card-footer {
          display: flex;
          justify-content: space-between;
        }

        .assignee-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .assignee-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font: 500 10px "Inter", "Noto Sans KR", sans-serif;
          color: #fff;
          object-fit: cover;
        }

        .assignee-name {
          font: 400 13px "Inter", "Noto Sans KR", sans-serif;
          color: #374151;
        }

        .card-stats {
          display: flex;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 2px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .stat-item:hover {
          transform: scale(1.1);
        }

        .stat-icon {
          font-size: 14px;
          color: #d1d5db;
        }

        .stat-number {
          font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #9ca3af;
        }
      `}</style>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {statusColumns.map((column) => {
            const items = getItemsByStatus(column.key);
            return (
              <DroppableColumn key={column.key} column={column}>
                {items.map((item) => (
                  <DraggableCard key={item.id} cost={item} />
                ))}
                {/* 빈 칼럼 메시지 */}
                {items.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '32px 16px',
                      color: '#8C8C8C',
                      fontSize: '13px'
                    }}
                  >
                    {column.title} 상태인 항목이 없습니다
                  </div>
                )}
              </DroppableColumn>
            );
          })}
        </div>
        <DragOverlay>{activeCost ? <DraggableCard cost={activeCost} /> : null}</DragOverlay>
      </DndContext>

      {/* 편집 다이얼로그만을 위한 숨겨진 CostDataTable */}
      <Box sx={{ display: 'none' }}>
        <CostDataTable
          selectedTeam={selectedTeam}
          selectedStatus={selectedStatus}
          selectedYear={selectedYear}
          selectedAssignee={selectedAssignee}
          costs={costs}
          setCosts={() => {}}
          checkCodeExists={checkCodeExists}
          externalDialogControl={{
            open: editDialog.open,
            recordId: editDialog.recordId,
            onClose: handleCloseEditDialog
          }}
        />
      </Box>
    </Box>
  );
}

// ==============================|| COST MONTHLY SCHEDULE VIEW ||============================== //
interface CostMonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  costs: CostRecord[];
  onCardClick: (cost: CostRecord) => void;
}

function CostMonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  costs,
  onCardClick
}: CostMonthlyScheduleViewProps) {
  const theme = useTheme();

  // 데이터 필터링
  const filteredData = costs.filter((cost) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const costYear = new Date(cost.startDate).getFullYear().toString();
      if (costYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && cost.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && cost.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && cost.status !== selectedStatus) return false;

    return true;
  });

  console.log('📊 Monthly Schedule Data:', {
    totalCosts: costs.length,
    filteredData: filteredData.length,
    selectedFilters: { selectedYear, selectedTeam, selectedStatus, selectedAssignee },
    sampleData: costs[0]
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: CostRecord[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.startDate);
    const month = date.getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(item);
  });

  console.log('🗓️ Monthly Data Grouping:', {
    monthlyData,
    hasDataInMonths: Object.keys(monthlyData).map((key) => `${key}: ${monthlyData[parseInt(key)].length} items`)
  });

  // 월 이름 배열
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#E0E0E0';
      case '진행':
        return '#e3f2fd';
      case '완료':
        return '#e8f5e8';
      case '취소':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#424242';
      case '진행':
        return '#1976D2';
      case '완료':
        return '#388E3C';
      case '취소':
        return '#D32F2F';
      default:
        return '#424242';
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        height: '100%',
        overflow: 'auto'
      }}
    >
      <Box
        sx={{
          height: '100%',
          overflow: 'auto'
        }}
      >
        {/* 월간 일정 테이블 - 2행 6열 */}
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* 상반기 (1-6월) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              borderBottom: '2px solid',
              borderColor: 'divider'
            }}
          >
            {/* 월 헤더 - 상반기 */}
            {monthNames.slice(0, 6).map((month, index) => (
              <Box
                key={index}
                sx={{
                  py: 1.5,
                  px: 1,
                  textAlign: 'center',
                  borderRight: index < 5 ? '1px solid' : 'none',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.grey[50]
                }}
              >
                {month}
              </Box>
            ))}

            {/* 월 내용 - 상반기 */}
            {monthNames.slice(0, 6).map((_, monthIndex) => {
              const items = monthlyData[monthIndex] || [];
              items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

              return (
                <Box
                  key={monthIndex}
                  sx={{
                    borderRight: monthIndex < 5 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    p: 1.5,
                    backgroundColor: '#fff',
                    minHeight: '254px',
                    maxHeight: '254px',
                    overflowY: 'auto',
                    verticalAlign: 'top',
                    width: '100%',
                    boxSizing: 'border-box',
                    // 스크롤바 스타일
                    '&::-webkit-scrollbar': {
                      width: '10px',
                      height: '10px'
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      border: '2px solid #f8f9fa'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: '#dee2e6'
                    },
                    '&::-webkit-scrollbar-corner': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  {items.map((item, itemIndex) => {
                    const date = new Date(item.startDate);
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');

                    return (
                      <Box
                        key={item.id}
                        onClick={() => onCardClick(item)}
                        sx={{
                          mb: itemIndex < items.length - 1 ? 0.8 : 0,
                          p: 0.6,
                          borderRadius: 1,
                          backgroundColor: getStatusColor(item.status),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '13px',
                            color: getStatusTextColor(item.status),
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <span>{`${month}-${day}`}</span>
                          <span>{item.status}</span>
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '13px',
                            color: theme.palette.text.secondary,
                            mt: 0.15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={item.content || '비용내용 없음'}
                        >
                          {item.content || '비용내용 없음'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>

          {/* 하반기 (7-12월) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)'
            }}
          >
            {/* 월 헤더 - 하반기 */}
            {monthNames.slice(6, 12).map((month, index) => (
              <Box
                key={index + 6}
                sx={{
                  py: 1.5,
                  px: 1,
                  textAlign: 'center',
                  borderRight: index < 5 ? '1px solid' : 'none',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.grey[50]
                }}
              >
                {month}
              </Box>
            ))}

            {/* 월 내용 - 하반기 */}
            {monthNames.slice(6, 12).map((_, monthIndex) => {
              const items = monthlyData[monthIndex + 6] || [];
              items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

              return (
                <Box
                  key={monthIndex + 6}
                  sx={{
                    borderRight: monthIndex < 5 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    p: 1.5,
                    backgroundColor: '#fff',
                    minHeight: '254px',
                    maxHeight: '254px',
                    overflowY: 'auto',
                    verticalAlign: 'top',
                    width: '100%',
                    boxSizing: 'border-box',
                    // 스크롤바 스타일
                    '&::-webkit-scrollbar': {
                      width: '10px',
                      height: '10px'
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      border: '2px solid #f8f9fa'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: '#dee2e6'
                    },
                    '&::-webkit-scrollbar-corner': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  {items.map((item, itemIndex) => {
                    const date = new Date(item.startDate);
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');

                    return (
                      <Box
                        key={item.id}
                        onClick={() => onCardClick(item)}
                        sx={{
                          mb: itemIndex < items.length - 1 ? 0.8 : 0,
                          p: 0.6,
                          borderRadius: 1,
                          backgroundColor: getStatusColor(item.status),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '13px',
                            color: getStatusTextColor(item.status),
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <span>{`${month}-${day}`}</span>
                          <span>{item.status}</span>
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '13px',
                            color: theme.palette.text.secondary,
                            mt: 0.15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={item.content || '비용내용 없음'}
                        >
                          {item.content || '비용내용 없음'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

// ==============================|| COST DASHBOARD VIEW ||============================== //
interface CostDashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  costs: CostRecord[];
}

function CostDashboardView({ selectedYear, selectedTeam, selectedStatus, selectedAssignee, costs }: CostDashboardViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: CostRecord[]) => {
    if (!startDate && !endDate) {
      return data;
    }
    return data.filter((cost) => {
      const costDate = new Date(cost.registrationDate);
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return costDate >= start && costDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return costDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return costDate <= end;
      }
      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(costs).filter((cost) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const costYear = new Date(cost.registrationDate).getFullYear().toString();
      if (costYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && cost.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && cost.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && cost.status !== selectedStatus) return false;
    return true;
  });

  // 통계 계산
  const totalCount = filteredData.length;
  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const statusStats = filteredData.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + item.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  // 비용유형별 통계 (원형차트용)
  const typeStats = filteredData.reduce(
    (acc, item) => {
      const type = item.costType || '기타';
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0 };
      }
      acc[type].count++;
      acc[type].amount += item.amount;
      return acc;
    },
    {} as Record<string, { count: number; amount: number }>
  );

  // 팀별 통계 (원형차트용)
  const teamStats = filteredData.reduce(
    (acc, item) => {
      const team = item.team || '미분류';
      if (!acc[team]) {
        acc[team] = { count: 0, amount: 0 };
      }
      acc[team].count++;
      acc[team].amount += item.amount;
      return acc;
    },
    {} as Record<string, { count: number; amount: number }>
  );

  // 월별 통계 (막대차트용)
  const monthlyStats: { month: string; 대기: number; 진행: number; 완료: number; 취소: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const date = new Date(item.registrationDate);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!monthData[monthKey]) {
      monthData[monthKey] = { 대기: 0, 진행: 0, 완료: 0, 취소: 0 };
    }
    monthData[monthKey][item.status] += item.amount;
  });

  Object.keys(monthData)
    .sort()
    .forEach((month) => {
      monthlyStats.push({
        month: month.substring(5), // MM 형식으로 전환
        ...monthData[month]
      });
    });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
  };

  // 라벨과 값 배열 미리 생성
  const typeLabels = Object.keys(typeStats);
  const typeValues = typeLabels.map((label) => typeStats[label].amount);

  // 원형차트 옵션
  const pieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: typeLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2'],
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '0%'
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toLocaleString('ko-KR') + '원';
        }
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const pieChartSeries = typeValues;

  // 팀별 라벨과 값 배열 미리 생성
  const teamLabels = Object.keys(teamStats);
  const teamValues = teamLabels.map((label) => teamStats[label].amount);

  // 팀별 원형차트 옵션
  const teamPieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: teamLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2', '#A8C5D8', '#6B9BD1'],
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '0%'
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toLocaleString('ko-KR') + '원';
        }
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const teamPieChartSeries = teamValues;

  // 막대차트 옵션
  const barChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%'
      }
    },
    xaxis: {
      categories: monthlyStats.map((item) => item.month)
    },
    yaxis: {
      title: {
        text: '금액 (원)'
      },
      labels: {
        formatter: function (val) {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(0) + 'M';
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + 'K';
          }
          return val.toString();
        }
      }
    },
    colors: ['#ED8936', '#4267B2', '#4A5568', '#E53E3E'],
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toLocaleString('ko-KR') + '원';
        }
      }
    }
  };

  const barChartSeries = [
    {
      name: '대기',
      data: monthlyStats.map((item) => item.대기)
    },
    {
      name: '진행',
      data: monthlyStats.map((item) => item.진행)
    },
    {
      name: '완료',
      data: monthlyStats.map((item) => item.완료)
    },
    {
      name: '취소',
      data: monthlyStats.map((item) => item.취소)
    }
  ];

  // 상태 색상 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#ED8936';
      case '진행':
        return '#4267B2';
      case '완료':
        return '#4A5568';
      case '취소':
        return '#E53E3E';
      default:
        return '#6E6E75';
    }
  };

  // 금액 포맷
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  return (
    <Box
      sx={{
        p: 2,
        height: '100%',
        overflow: 'auto'
      }}
    >
      {/* 기간 선택 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          비용 현황 대시보드
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            type="date"
            label="시작일"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          <TextField
            type="date"
            label="종료일"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
        </Box>
      </Box>

      {/* 상태 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* 총건수/총금액 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#48C4B7',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
              총금액
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {formatAmount(totalAmount)}원
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              총 {totalCount}건
            </Typography>
          </Card>
        </Grid>
        {/* 완료 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#4A5568',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
              완료
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {formatAmount(statusStats['완료'] || 0)}원
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              완료된 비용
            </Typography>
          </Card>
        </Grid>
        {/* 진행 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#4267B2',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
              진행
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {formatAmount(statusStats['진행'] || 0)}원
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              진행중인 비용
            </Typography>
          </Card>
        </Grid>
        {/* 취소 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#E53E3E',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
              취소
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {formatAmount(statusStats['취소'] || 0)}원
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              취소된 비용
            </Typography>
          </Card>
        </Grid>
        {/* 대기 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#ED8936',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
              대기
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {formatAmount(statusStats['대기'] || 0)}원
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              대기중인 비용
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 비용유형 - 비용목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 비용유형 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              비용유형별 현황
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 320,
                px: 3
              }}
            >
              {typeLabels.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 0.5
                  }}
                >
                  {/* 차트 영역 */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <ReactApexChart options={pieChartOptions} series={pieChartSeries} type="pie" height={250} width={250} />
                  </Box>
                  {/* 커스텀 범례 영역 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: 180,
                      maxWidth: 180
                    }}
                  >
                    {typeLabels.map((label, index) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: pieChartOptions.colors?.[index % pieChartOptions.colors.length]
                          }}
                        />
                        <Typography sx={{ flex: 1, fontSize: '13px' }}>{label}</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{formatAmount(typeValues[index])}원</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">데이터가 없습니다</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        {/* 비용 목록 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              비용 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>코드</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>내용</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>유형</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>금액</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((cost) => (
                      <TableRow key={cost.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{cost.code}</TableCell>
                        <TableCell
                          sx={{
                            py: 0.5,
                            fontSize: '13px',
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cost.content || '비용내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{cost.costType}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{formatAmount(cost.amount)}원</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={cost.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(cost.status),
                              color: 'white',
                              fontSize: '11px',
                              height: 20
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 빈 행 추가 (테이블 높이 일정하게 유지) */}
                    {Array.from({ length: Math.max(0, itemsPerPage - paginatedData.length) }).map((_, index) => (
                      <TableRow key={`empty-${index}`} sx={{ height: 33 }}>
                        <TableCell colSpan={5} sx={{ border: 'none' }}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} size="small" color="primary" />
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 하단 레이아웃: 팀별현황 - 월별현황 */}
      <Grid container spacing={3}>
        {/* 팀별 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              팀별 비용현황
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 320,
                px: 3
              }}
            >
              {teamLabels.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 0.5
                  }}
                >
                  {/* 차트 영역 */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <ReactApexChart options={teamPieChartOptions} series={teamPieChartSeries} type="pie" height={250} width={250} />
                  </Box>
                  {/* 커스텀 범례 영역 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: 180,
                      maxWidth: 180
                    }}
                  >
                    {teamLabels.map((label, index) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: teamPieChartOptions.colors?.[index % teamPieChartOptions.colors.length]
                          }}
                        />
                        <Typography sx={{ flex: 1, fontSize: '13px' }}>{label}</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{formatAmount(teamValues[index])}원</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">데이터가 없습니다</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        {/* 월별 비용현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 비용현황
            </Typography>
            {barChartSeries[0].data.length > 0 ? (
              <ReactApexChart options={barChartOptions} series={barChartSeries} type="bar" height={320} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                <Typography color="text.secondary">데이터가 없습니다</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ==============================|| COST CHANGELOG VIEW ||============================== //
interface CostChangeLogViewProps {
  changeLogs: ChangeLog[];
  costs: CostRecord[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function CostChangeLogView({
  changeLogs,
  costs,
  page,
  rowsPerPage,
  goToPage,
  onPageChange,
  onRowsPerPageChange,
  onGoToPageChange
}: CostChangeLogViewProps) {
  // 페이지네이션 적용된 데이터
  const paginatedLogs = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return changeLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [changeLogs, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(changeLogs.length / rowsPerPage);

  // 페이지 변경 핸들러
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    onPageChange(newPage - 1);
  };

  // Go to 페이지 핸들러
  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber - 1);
    }
    onGoToPageChange('');
  };

  // 팀별 색상 매핑
  const getTeamColor = (team: string) => {
    switch (team) {
      case 'IT팀':
        return '#F1F8E9';
      case '마케팅팀':
        return '#E3F2FD';
      case '영업팀':
        return '#F3E5F5';
      case '기획팀':
        return '#E0F2F1';
      case '인사팀':
        return '#FFF3E0';
      default:
        return '#F5F5F5';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 4.5, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {changeLogs.length}건
        </Typography>
      </Box>
      {/* 변경로그 테이블 */}
      <TableContainer
        sx={{
          flex: 1,
          border: 'none',
          borderRadius: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          boxShadow: 'none',
          minHeight: 0,
          // 스크롤바 스타일
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            border: '2px solid #f8f9fa'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#dee2e6'
          },
          '&::-webkit-scrollbar-corner': {
            backgroundColor: '#f8f9fa'
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: 50 }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 110 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 330 }}>변경 세부내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>변경자</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log, index) => (
              <TableRow
                key={log.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {changeLogs.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.location}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.changedField}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.beforeValue}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.afterValue}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'normal',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                    title={log.description}
                  >
                    {log.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.team}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.user}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.5,
          px: 1,
          py: 0.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        {/* 왼쪽: Row per page */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Row per page
          </Typography>
          <FormControl size="small" sx={{ minWidth: 60 }}>
            <Select
              value={rowsPerPage}
              onChange={(e) => {
                onRowsPerPageChange(Number(e.target.value));
                onPageChange(0);
              }}
              sx={{
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 1,
                  fontSize: '0.875rem'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #e0e0e0'
                }
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>

          {/* Go to */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Go to
            </Typography>
            <TextField
              size="small"
              value={goToPage}
              onChange={(e) => onGoToPageChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGoToPage();
                }
              }}
              placeholder="1"
              sx={{
                width: 60,
                '& .MuiOutlinedInput-root': {
                  '& input': {
                    py: 0.5,
                    px: 1,
                    textAlign: 'center',
                    fontSize: '0.875rem'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e0e0e0'
                  }
                }
              }}
            />
            <Button
              size="small"
              onClick={handleGoToPage}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: '0.875rem'
              }}
            >
              Go
            </Button>
          </Box>
        </Box>

        {/* 오른쪽: 페이지 네비게이션 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {changeLogs.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, changeLogs.length)} of ${changeLogs.length}`
              : '0-0 of 0'}
          </Typography>
          {totalPages > 0 && (
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handleChangePage}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: '0.875rem',
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '4px'
                },
                '& .MuiPaginationItem-page.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white !important',
                  borderRadius: '4px',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    color: 'white !important'
                  }
                },
                '& .MuiPaginationItem-page': {
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'grey.100'
                  }
                }
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function CostManagement() {
  const searchParams = useSearchParams();
  const [value, setValue] = useState(0);

  // Supabase 비용 데이터 연동
  const { getCosts, createCost, updateCost, deleteCost, checkCodeExists, loading, error } = useSupabaseCost();
  const { users, departments } = useCommonData(); // 🏪 공용 창고에서 가져오기
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // Supabase 변경로그 연동
  const { data: session } = useSession();
  const user = useUser();
  const userName = user?.name || session?.user?.name || '시스템';
  const currentUser = users.find((u) => u.email === session?.user?.email);
  const { logs: changeLogData, fetchChangeLogs } = useSupabaseChangeLog('main_cost');

  // 마스터코드에서 상태 옵션 가져오기
  const statusTypes = React.useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const data = await getCosts();
      setCostRecords(data);
    };
    loadData();
  }, [getCosts]);

  // 편집 다이얼로그 상태
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    recordId?: number;
  }>({
    open: false,
    recordId: undefined
  });

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    const tab = searchParams.get('tab');
    const cardId = searchParams.get('cardId');
    const action = searchParams.get('action');
    const openDialog = searchParams.get('openDialog');

    // 칸반 탭으로 이동
    if (tab === 'kanban') {
      setValue(1); // 칸반 뷰는 index 1
    }

    // 카드 편집 팝업 열기
    if (cardId && action === 'edit' && openDialog === 'true') {
      // 카드 ID로 해당 비용 기록 찾기
      const recordId = parseInt(cardId);
      const costRecord = costRecords.find((cost) => cost.id === recordId);
      if (costRecord) {
        setEditDialog({
          open: true,
          recordId: recordId
        });
      }
    }
  }, [searchParams, costRecords]);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // Supabase 데이터를 ChangeLog 형식으로 변환
  const changeLogs = React.useMemo<ChangeLog[]>(() => {
    if (!changeLogData || !Array.isArray(changeLogData)) {
      return [];
    }
    return changeLogData.map((log) => ({
      id: log.id,
      dateTime: new Date(log.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      title: log.title || '',
      code: log.record_id,
      action: log.action_type,
      location: log.description.includes('개요탭') ? '개요탭' : log.description.includes('데이터탭') ? '데이터탭' : '-',
      changedField: log.changed_field || '-',
      beforeValue: log.before_value || '-',
      afterValue: log.after_value || '-',
      description: log.description,
      team: log.team || '-',
      user: log.user_name
    }));
  }, [changeLogData]);

  // 변경로그 데이터 로드
  useEffect(() => {
    console.log('📋 비용관리 변경로그 데이터 로드 시작');
    fetchChangeLogs();
  }, [fetchChangeLogs]);

  useEffect(() => {
    console.log('📊 Cost changeLogData:', changeLogData);
    console.log('📊 Cost changeLogs (변환된 데이터):', changeLogs);
  }, [changeLogData, changeLogs]);

  // 필터 상태
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  // 변경로그 추가 함수 (8 파라미터)
  const addChangeLog = React.useCallback(
    async (
      action: string,
      target: string,
      description: string,
      team: string = '시스템',
      beforeValue?: string,
      afterValue?: string,
      changedField?: string,
      title?: string
    ) => {
      const logData = {
        page: 'main_cost',
        record_id: target,
        action_type: action,
        description: description,
        before_value: beforeValue || null,
        after_value: afterValue || null,
        changed_field: changedField || null,
        title: title || null,
        user_name: userName,
        team: currentUser?.department || team,
        user_department: currentUser?.department,
        user_position: currentUser?.position,
        user_profile_image: currentUser?.profile_image_url,
        created_at: new Date().toISOString()
      };

      const supabase = createClient();
      const { data, error } = await supabase.from('common_log_data').insert(logData).select();

      if (error) {
        console.error('❌ 변경로그 추가 실패:', error);
      } else {
        console.log('✅ 변경로그 추가 성공:', data);
        await fetchChangeLogs();
      }
    },
    [currentUser, user, userName, fetchChangeLogs]
  );

  // 비용 레코드 업데이트 함수 (칸반 뷰용)
  const updateCostRecord = async (id: string, updates: Partial<CostRecord>): Promise<CostRecord> => {
    const updated = await updateCost(id, updates);
    if (updated) {
      const allData = await getCosts();
      setCostRecords(allData);
      return updated;
    }
    throw new Error('비용 수정 실패');
  };

  // 월간일정 카드 클릭 핸들러
  const handleMonthlyCardClick = (cost: CostRecord) => {
    setEditDialog({ open: true, recordId: cost.id });
  };

  // 편집 다이얼로그 닫기
  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, recordId: undefined });
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // 스크롤바 스타일
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          border: '2px solid #f8f9fa'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#dee2e6'
        },
        '&::-webkit-scrollbar-corner': {
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      <Card
        sx={{
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <CardContent
          sx={{
            pb: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // 스크롤바 스타일
            '&::-webkit-scrollbar': {
              width: '10px',
              height: '10px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              border: '2px solid #f8f9fa'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#dee2e6'
            },
            '&::-webkit-scrollbar-corner': {
              backgroundColor: '#f8f9fa'
            }
          }}
        >
          {/* 페이지 타이틀 및 브레드크럼 */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                비용관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                메인메뉴 &gt; 비용관리
              </Typography>
              {loading && (
                <Typography variant="body2" color="primary" sx={{ pb: 0.5, ml: 1 }}>
                  🔄 Supabase 데이터 로딩 중...
                </Typography>
              )}
              {error && (
                <Typography variant="body2" color="error" sx={{ pb: 0.5, ml: 1 }}>
                  ❌ 데이터 로딩 실패
                </Typography>
              )}
            </Box>
          </Box>
          {/* 탭 네비게이션 및 필터 */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* 탭 네비게이션 */}
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="비용관리 탭"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.91rem',
                  fontWeight: 500
                }
              }}
            >
              <Tab
                icon={<TableDocument size={19} />}
                iconPosition="start"
                label="데이터"
                {...a11yProps(0)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<Element size={19} />}
                iconPosition="start"
                label="칸반"
                {...a11yProps(1)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<Calendar size={19} />}
                iconPosition="start"
                label="월간일정"
                {...a11yProps(2)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<Chart size={19} />}
                iconPosition="start"
                label="대시보드"
                {...a11yProps(3)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<DocumentText size={19} />}
                iconPosition="start"
                label="변경로그"
                {...a11yProps(4)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
            </Tabs>
            {/* 필터 영역 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mr: 1 }}>
              {/* 연도 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>연도</InputLabel>
                <Select
                  value={selectedYear}
                  label="연도"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* 팀 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>팀</InputLabel>
                <Select
                  value={selectedTeam}
                  label="팀"
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {departments
                    .filter((dept) => dept.is_active)
                    .map((dept) => (
                      <MenuItem key={dept.id} value={dept.department_name}>
                        {dept.department_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {/* 담당자 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>담당자</InputLabel>
                <Select
                  value={selectedAssignee}
                  label="담당자"
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {users
                    .filter((user) => user.status === 'active')
                    .map((user) => (
                      <MenuItem key={user.id} value={user.user_name}>
                        {user.user_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {/* 상태 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={selectedStatus}
                  label="상태"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {statusTypes.map((statusItem) => (
                    <MenuItem key={statusItem.id} value={statusItem.subcode_name}>
                      {statusItem.subcode_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* 탭 내용 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              minHeight: 0,
              // 스크롤바 스타일
              '&::-webkit-scrollbar': {
                width: '10px',
                height: '10px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                border: '2px solid #f8f9fa'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#dee2e6'
              },
              '&::-webkit-scrollbar-corner': {
                backgroundColor: '#f8f9fa'
              }
            }}
          >
            <TabPanel value={value} index={0}>
              {/* 데이터 탭 */}
              <Box
                sx={{
                  p: 0.5,
                  height: '100%',
                  overflow: 'hidden',
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    border: '2px solid #f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#dee2e6'
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <CostDataTable
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedYear={selectedYear}
                  selectedAssignee={selectedAssignee}
                  costs={costRecords}
                  setCosts={setCostRecords}
                  createCostRecord={async (record) => {
                    const created = await createCost(record);
                    if (created) {
                      const updated = await getCosts();
                      // 신규 생성된 레코드에 isNew 플래그 설정
                      const updatedWithNew = updated.map(cost =>
                        cost.id === created.id ? { ...cost, isNew: true } : cost
                      );
                      setCostRecords(updatedWithNew);
                      return created;
                    }
                    throw new Error('비용 생성 실패');
                  }}
                  updateCostRecord={async (id, updates) => {
                    const updated = await updateCost(id, updates);
                    if (updated) {
                      const allData = await getCosts();
                      setCostRecords(allData);
                      return updated;
                    }
                    throw new Error('비용 수정 실패');
                  }}
                  deleteCostRecord={async (id) => {
                    const success = await deleteCost(id);
                    if (success) {
                      const updated = await getCosts();
                      setCostRecords(updated);
                    } else {
                      throw new Error('비용 삭제 실패');
                    }
                  }}
                  checkCodeExists={checkCodeExists}
                  addChangeLog={addChangeLog}
                  externalDialogControl={{
                    open: editDialog.open,
                    recordId: editDialog.recordId,
                    onClose: handleCloseEditDialog
                  }}
                />
              </Box>
            </TabPanel>

            {/* 칸반 탭 */}
            <TabPanel value={value} index={1}>
              <Box
                sx={{
                  p: 1.5,
                  height: '100%',
                  overflow: 'auto',
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    border: '2px solid #f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#dee2e6'
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <CostKanbanView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  costs={costRecords}
                  updateCostRecord={updateCostRecord}
                  addChangeLog={addChangeLog}
                  checkCodeExists={checkCodeExists}
                  assigneeList={users.filter((user) => user.status === 'active')}
                />
              </Box>
            </TabPanel>

            {/* 월간일정 탭 */}
            <TabPanel value={value} index={2}>
              <Box
                sx={{
                  p: 1.5,
                  height: '100%',
                  overflow: 'auto',
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    border: '2px solid #f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#dee2e6'
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <CostMonthlyScheduleView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  costs={costRecords}
                  onCardClick={handleMonthlyCardClick}
                />
              </Box>
            </TabPanel>

            {/* 대시보드 탭 */}
            <TabPanel value={value} index={3}>
              <Box
                sx={{
                  p: 1.5,
                  height: '100%',
                  overflow: 'auto',
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    border: '2px solid #f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#dee2e6'
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <CostDashboardView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  costs={costRecords}
                />
              </Box>
            </TabPanel>

            {/* 변경로그 탭 */}
            <TabPanel value={value} index={4}>
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 0.5,
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#c1c1c1',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#a8a8a8'
                  }
                }}
              >
                <CostChangeLogView
                  changeLogs={changeLogs}
                  costs={costRecords}
                  page={changeLogPage}
                  rowsPerPage={changeLogRowsPerPage}
                  goToPage={changeLogGoToPage}
                  onPageChange={setChangeLogPage}
                  onRowsPerPageChange={setChangeLogRowsPerPage}
                  onGoToPageChange={setChangeLogGoToPage}
                />
              </Box>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>

      {/* 편집 다이얼로그만을 위한 숨겨진 CostDataTable */}
      <Box sx={{ display: 'none' }}>
        <CostDataTable
          selectedTeam={selectedTeam}
          selectedStatus={selectedStatus}
          selectedYear={selectedYear}
          selectedAssignee={selectedAssignee}
          costs={costRecords}
          setCosts={() => {}}
          checkCodeExists={checkCodeExists}
          externalDialogControl={{
            open: editDialog.open,
            recordId: editDialog.recordId,
            onClose: handleCloseEditDialog
          }}
        />
      </Box>
    </Box>
  );
}
