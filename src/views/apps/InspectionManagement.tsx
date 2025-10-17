'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// project imports

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
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Pagination,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import InspectionTable from 'views/apps/InspectionTable';
import InspectionEditDialog from 'components/InspectionEditDialog';
import { inspectionData, teams, assignees, inspectionStatusOptions, inspectionStatusColors } from 'data/inspection';
import { InspectionTableData, InspectionStatus } from 'types/inspection';
import { useSupabaseSecurityInspection, SecurityInspectionData } from 'hooks/useSupabaseSecurityInspection';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement } from 'hooks/useSupabaseDepartmentManagement';
import { ThemeMode } from 'config';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';

// 변경로그 타입 정의 (UI용)
interface ChangeLog {
  id: string;
  dateTime: string;
  code: string;
  target: string;
  location: string;
  action: string;
  changedField?: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
  team: string;
  user: string;
}

// Icons
import { TableDocument, Chart, Calendar, Element, DocumentText } from '@wandersonalwes/iconsax-react';

// ==============================|| 보안점검관리 메인 페이지 ||============================== //

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
      id={`inspection-tabpanel-${index}`}
      aria-labelledby={`inspection-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inspection-tab-${index}`,
    'aria-controls': `inspection-tabpanel-${index}`
  };
}

// 칸반 뷰 컴포넌트
interface KanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  inspections: InspectionTableData[];
  setInspections: React.Dispatch<React.SetStateAction<InspectionTableData[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string, beforeValue?: string, afterValue?: string, changedField?: string, title?: string) => void;
  generateInspectionCode?: () => Promise<string>;
  assigneeList?: any[];
}

function KanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  inspections,
  setInspections,
  addChangeLog,
  generateInspectionCode,
  assigneeList
}: KanbanViewProps) {
  const theme = useTheme();

  // 상태 관리
  const [activeInspection, setActiveInspection] = useState<InspectionTableData | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingInspection, setEditingInspection] = useState<InspectionTableData | null>(null);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = inspections.filter((inspection) => {
    // 안전 체크: inspection 객체와 필수 필드 존재 확인
    if (!inspection || !inspection.inspectionDate || !inspection.status) {
      console.warn('⚠️ 유효하지 않은 inspection 데이터:', inspection);
      return false;
    }

    // 연도 필터
    if (selectedYear !== '전체') {
      const inspectionYear = new Date(inspection.inspectionDate).getFullYear().toString();
      if (inspectionYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && inspection.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && inspection.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && inspection.status !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedInspection = inspections.find((inspection) => inspection.id === active.id);
    setActiveInspection(draggedInspection || null);
    setIsDraggingState(true);
  };

  // 카드 클릭 핸들러
  const handleCardClick = (inspection: InspectionTableData) => {
    setEditingInspection(inspection);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingInspection(null);
  };

  // Inspection 저장 핸들러
  const handleEditInspectionSave = (updatedInspection: InspectionTableData) => {
    const originalInspection = inspections.find((t) => t.id === updatedInspection.id);

    if (originalInspection) {
      // 업데이트
      setInspections((prev) => prev.map((inspection) => (inspection.id === updatedInspection.id ? updatedInspection : inspection)));

      // 변경로그 추가 - 변경된 필드 확인
      const changes: string[] = [];
      const inspectionCode = updatedInspection.code || `TASK-${updatedInspection.id}`;

      if (originalInspection.status !== updatedInspection.status) {
        changes.push(`상태: "${originalInspection.status}" → "${updatedInspection.status}"`);
      }
      if (originalInspection.assignee !== updatedInspection.assignee) {
        changes.push(`담당자: "${originalInspection.assignee || '미할당'}" → "${updatedInspection.assignee || '미할당'}"`);
      }
      if (originalInspection.inspectionTitle !== updatedInspection.inspectionTitle) {
        changes.push(`점검내용 수정`);
      }
      if (originalInspection.progress !== updatedInspection.progress) {
        changes.push(`진행율: ${originalInspection.progress || 0}% → ${updatedInspection.progress || 0}%`);
      }
      if (originalInspection.completedDate !== updatedInspection.completedDate) {
        changes.push(`완료일: "${originalInspection.completedDate || '미정'}" → "${updatedInspection.completedDate || '미정'}"`);
      }

      if (changes.length > 0) {
        addChangeLog(
          '점검 정보 수정',
          inspectionCode,
          `${updatedInspection.inspectionTitle || '점검'} - ${changes.join(', ')}`,
          updatedInspection.team || '미분류',
          undefined,
          undefined,
          undefined,
          updatedInspection.inspectionContent || updatedInspection.inspectionTitle
        );
      }
    }

    handleEditDialogClose();
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveInspection(null);
    setIsDraggingState(false);

    if (!over) return;

    const inspectionId = active.id;
    const newStatus = over.id as InspectionStatus;

    // 상태가 변경된 경우만 업데이트
    const currentInspection = inspections.find((inspection) => inspection.id === inspectionId);
    if (currentInspection && currentInspection.status !== newStatus) {
      const oldStatus = currentInspection.status;

      setInspections((prev) =>
        prev.map((inspection) => (inspection.id === inspectionId ? { ...inspection, status: newStatus } : inspection))
      );

      // 변경로그 추가
      const inspectionCode = currentInspection.code || `TASK-${inspectionId}`;
      const inspectionTitle = currentInspection.inspectionTitle || '점검내용 없음';
      const inspectionContent = currentInspection.inspectionContent || inspectionTitle;
      const description = `${inspectionTitle} 상태를 "${oldStatus}"에서 "${newStatus}"로 변경`;

      addChangeLog('점검 상태 변경', inspectionCode, description, currentInspection.team || '미분류', oldStatus, newStatus, '상태', inspectionContent);
    }
  };

  // 상태별 컬럼 정의
  const statusColumns = [
    { key: '대기', title: '대기', pillColor: '#F0F0F0', textColor: '#424242' },
    { key: '진행', title: '진행', pillColor: '#E3F2FD', textColor: '#1976D2' },
    { key: '완료', title: '완료', pillColor: '#E8F5E8', textColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillColor: '#FFEBEE', textColor: '#D32F2F' }
  ];

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
  };

  // 점검대상별 색상 매핑
  const getTeamColor = (target: string) => {
    return { color: '#333333' };
  };

  // 담당자별 배경색 매핑
  const getAssigneeStyle = (assignee: string) => {
    const colorMap: Record<string, string> = {
      김철수: '#D8DCFF',
      이영희: '#D8CBF4',
      박민수: '#F8E7B5',
      최지연: '#FAD0D0',
      정현우: '#D8DCFF',
      강민정: '#D8CBF4',
      윤성호: '#F8E7B5',
      박영희: '#FAD0D0',
      김민수: '#D8DCFF',
      최윤정: '#D8CBF4',
      이민수: '#F8E7B5',
      송민호: '#FAD0D0',
      정상현: '#D8DCFF',
      박지민: '#D8CBF4',
      노수진: '#F8E7B5',
      최영수: '#FAD0D0',
      김혜진: '#D8DCFF',
      이재훈: '#D8CBF4',
      이준호: '#F8E7B5',
      김태호: '#FAD0D0',
      한지민: '#D8DCFF',
      박서영: '#D8CBF4'
    };
    return colorMap[assignee] || '#E0E0E0';
  };

  // 상태별 진행률 계산
  const getProgressFromStatus = (status: string) => {
    switch (status) {
      case '대기':
        return 20;
      case '진행':
        return 60;
      case '완료':
        return 100;
      case '홀딩':
        return 40;
      default:
        return 0;
    }
  };

  // 상태별 태그 색상
  const getStatusTagColor = (status: string) => {
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

  // 드래그 가능한 카드 컴포넌트
  function DraggableCard({ inspection }: { inspection: InspectionTableData }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: inspection.id
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : 'pointer'
        }
      : { cursor: 'pointer' };

    const statusTagColor = getStatusTagColor(inspection.status);
    const progress = getProgressFromStatus(inspection.status);

    return (
      <article
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="kanban-card"
        onClick={(e) => {
          // 드래그가 아닌 경우에만 클릭 이벤트 처리
          if (!isDraggingState && !isDragging) {
            e.stopPropagation();
            handleCardClick(inspection);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={statusTagColor}>
            {inspection.status}
          </span>
          <span className="incident-type-tag">{inspection.inspectionTarget}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{inspection.inspectionContent || '점검내용 없음'}</h3>

        {/* 3. 정보 라인 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{inspection.code || '미정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">점검유형:</span>
            <span className="info-value">{inspection.inspectionType || '미정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">점검일:</span>
            <span className="info-value">{inspection.inspectionDate || '미정'}</span>
          </div>
        </div>

        {/* 5. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={
                assigneeList?.find((user) => user.user_name === inspection.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === inspection.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={inspection.assignee || '미할당'}
            />
            <span className="assignee-name">{inspection.assignee || '미할당'}</span>
          </div>
        </div>
      </article>
    );
  }

  // 드롭 가능한 컬럼 컴포넌트
  function DroppableColumn({
    column,
    children
  }: {
    column: { key: string; title: string; pillColor: string; textColor: string };
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
              background: column.pillColor,
              color: column.textColor
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

        /* 4. 카드 푸터 */
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
                  <DraggableCard key={item.id} inspection={item} />
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

        <DragOverlay>{activeInspection ? <DraggableCard inspection={activeInspection} /> : null}</DragOverlay>
      </DndContext>

      {/* Inspection 편집 다이얼로그 */}
      {editDialog && (
        <InspectionEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          inspection={editingInspection}
          onSave={handleEditInspectionSave}
          generateInspectionCode={generateInspectionCode}
        />
      )}
    </Box>
  );
}

// 월간일정 뷰 컴포넌트
interface MonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  inspections: InspectionTableData[];
  onCardClick: (inspection: InspectionTableData) => void;
}

function MonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  inspections,
  onCardClick
}: MonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  // 데이터 필터링
  const filteredData = inspections.filter((inspection) => {
    // 안전 체크: inspection 객체와 필수 필드 존재 확인
    if (!inspection || !inspection.inspectionDate || !inspection.status) {
      console.warn('⚠️ 유효하지 않은 inspection 데이터:', inspection);
      return false;
    }

    // 연도 필터 (메인 필터가 전체가 아니면 메인 필터 우선, 아니면 뷰 필터 사용)
    const useYear = selectedYear !== '전체' ? selectedYear : viewYear;
    const inspectionYear = new Date(inspection.inspectionDate).getFullYear().toString();
    if (inspectionYear !== useYear) return false;

    // 팀 필터
    if (selectedTeam !== '전체' && inspection.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && inspection.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && inspection.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: InspectionTableData[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.inspectionDate);
    const month = date.getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(item);
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
      case '홀딩':
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
      case '홀딩':
        return '#D32F2F';
      default:
        return '#424242';
    }
  };

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box
        sx={{
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
              items.sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());

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
                    boxSizing: 'border-box'
                  }}
                >
                  {items.filter(item => item && item.status).map((item, itemIndex) => {
                    const date = new Date(item.inspectionDate);
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
                        {/* 첫 번째 줄: 날짜, 점검대상, 상태 */}
                        <Box
                          sx={{
                            fontSize: '13px',
                            color: getStatusTextColor(item.status),
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.15
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{`${month}-${day}`}</span>
                            <span>{item.inspectionTarget}</span>
                          </Box>
                          <span>{item.status}</span>
                        </Box>

                        {/* 두 번째 줄: 점검내용 */}
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
                          title={item.inspectionContent || '점검내용 없음'}
                        >
                          {item.inspectionContent || '점검내용 없음'}
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
            {monthNames.slice(6, 12).map((_, index) => {
              const monthIndex = index + 6;
              const items = monthlyData[monthIndex] || [];
              items.sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());

              return (
                <Box
                  key={monthIndex}
                  sx={{
                    borderRight: index < 5 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    p: 1.5,
                    backgroundColor: '#fff',
                    minHeight: '254px',
                    maxHeight: '254px',
                    overflowY: 'auto',
                    verticalAlign: 'top',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {items.filter(item => item && item.status).map((item, itemIndex) => {
                    const date = new Date(item.inspectionDate);
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
                        {/* 첫 번째 줄: 날짜, 점검대상, 상태 */}
                        <Box
                          sx={{
                            fontSize: '13px',
                            color: getStatusTextColor(item.status),
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.15
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{`${month}-${day}`}</span>
                            <span>{item.inspectionTarget}</span>
                          </Box>
                          <span>{item.status}</span>
                        </Box>

                        {/* 두 번째 줄: 점검내용 */}
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
                          title={item.inspectionContent || '점검내용 없음'}
                        >
                          {item.inspectionContent || '점검내용 없음'}
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

// 대시보드 뷰 컴포넌트
interface DashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
  inspections: InspectionTableData[];
}

function DashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  selectedRecentStatus,
  setSelectedRecentStatus,
  inspections
}: DashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: InspectionTableData[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((inspection) => {
      // 안전 체크: inspection 객체와 inspectionDate 필드 존재 확인
      if (!inspection || !inspection.inspectionDate) {
        return false;
      }

      const inspectionDate = new Date(inspection.inspectionDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return inspectionDate >= start && inspectionDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return inspectionDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return inspectionDate <= end;
      }

      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(inspections).filter((inspection) => {
    // 안전 체크: inspection 객체와 필수 필드 존재 확인
    if (!inspection || !inspection.inspectionDate || !inspection.status) {
      console.warn('⚠️ 유효하지 않은 inspection 데이터:', inspection);
      return false;
    }

    // 연도 필터
    if (selectedYear !== '전체') {
      const inspectionYear = new Date(inspection.inspectionDate).getFullYear().toString();
      if (inspectionYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && inspection.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && inspection.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && inspection.status !== selectedStatus) return false;
    return true;
  });

  // 통계 계산
  const totalCount = filteredData.length;
  const statusStats = filteredData.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 점검분류별 통계 (원형차트용) - inspectionType 필드 사용
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = item.inspectionType || '기타';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 점검대상별 통계 (원형차트용)
  const targetStats = filteredData.reduce(
    (acc, item) => {
      const target = item.inspectionTarget || '기타';
      acc[target] = (acc[target] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 디버깅을 위한 로그 - 제거
  // console.log('Dashboard Debug:', {
  //   filteredData: filteredData.length,
  //   categoryStats,
  //   assigneeStats,
  //   categoryLabels: Object.keys(categoryStats),
  //   categoryValues: Object.values(categoryStats)
  // });

  // 월별 통계 (막대차트용)
  const monthlyStats: { month: string; 대기: number; 진행: number; 완료: number; 홀딩: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const date = new Date(item.inspectionDate);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthData[monthKey]) {
      monthData[monthKey] = { 대기: 0, 진행: 0, 완료: 0, 홀딩: 0 };
    }
    monthData[monthKey][item.status] = (monthData[monthKey][item.status] || 0) + 1;
  });

  // 정렬된 월별 데이터 생성
  Object.keys(monthData)
    .sort()
    .forEach((month) => {
      const [year, monthNum] = month.split('-');
      const yearShort = year.slice(-2); // 연도를 마지막 2자리로
      monthlyStats.push({
        month: `${yearShort}/${monthNum}`,
        대기: monthData[month]['대기'] || 0,
        진행: monthData[month]['진행'] || 0,
        완료: monthData[month]['완료'] || 0,
        홀딩: monthData[month]['홀딩'] || 0
      });
    });

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#ED8936';
      case '진행':
        return '#4267B2';
      case '완료':
        return '#4A5568';
      case '홀딩':
        return '#E53E3E';
      default:
        return '#9e9e9e';
    }
  };

  // 라벨과 값 배열 미리 생성
  const categoryLabels = Object.keys(categoryStats);
  const categoryValues = Object.values(categoryStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 점검분류 데이터 확인:', {
    filteredData: filteredData.length,
    categoryStats,
    categoryLabels,
    categoryValues,
    sampleData: filteredData.slice(0, 3).map((item) => ({
      inspectionType: item.inspectionType,
      team: item.team,
      assignee: item.assignee
    }))
  });

  // 원형차트 옵션 - 새로운 접근방식: 내장 툴팁 포맷터 사용
  const pieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: categoryLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2'],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: any) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '13px',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      custom: function ({ series, seriesIndex, w }: any) {
        // able-pro 표준 스타일 적용
        const capturedLabels = [...categoryLabels];
        const capturedValues = [...categoryValues];

        const value = capturedValues[seriesIndex] || 0;
        const label = capturedLabels[seriesIndex] || '분류';
        const total = capturedValues.reduce((sum: number, val: number) => sum + val, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

        return `<div class="pie_box">
        <span class="PieDot" style='background-color:${w.globals.colors[seriesIndex]}'></span>
        <span class="fontsize">${label}${' '}
        <span class="fontsizeValue">${value}건 (${percentage}%)</span></span></div>`;
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            width: 250,
            offsetX: 0
          },
          legend: {
            position: 'bottom',
            offsetX: 0,
            width: 'auto'
          }
        }
      }
    ]
  };

  const pieChartSeries = categoryValues;

  // 점검대상 라벨과 값 배열 미리 생성
  const targetLabels = Object.keys(targetStats);
  const targetValues = Object.values(targetStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 점검대상 데이터 확인:', {
    targetStats,
    targetLabels,
    targetValues
  });

  // 점검대상 원형차트 옵션 - 새로운 접근방식: 내장 툴팁 포맷터 사용
  const targetPieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: targetLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5'],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: any) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '13px',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      custom: function ({ series, seriesIndex, w }: any) {
        // able-pro 표준 스타일 적용
        const capturedLabels = [...targetLabels];
        const capturedValues = [...targetValues];

        const value = capturedValues[seriesIndex] || 0;
        const label = capturedLabels[seriesIndex] || '점검대상';
        const total = capturedValues.reduce((sum: number, val: number) => sum + val, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

        return `<div class="pie_box">
        <span class="PieDot" style='background-color:${w.globals.colors[seriesIndex]}'></span>
        <span class="fontsize">${label}${' '}
        <span class="fontsizeValue">${value}건 (${percentage}%)</span></span></div>`;
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            width: 250,
            offsetX: 0
          },
          legend: {
            position: 'bottom',
            offsetX: 0,
            width: 'auto'
          }
        }
      }
    ]
  };

  const targetPieChartSeries = targetValues;

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
        columnWidth: '55%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: monthlyStats.map((item) => item.month)
    },
    yaxis: {
      title: {
        text: '점검 건수'
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
    dataLabels: {
      enabled: false
    },
    annotations: {
      points: monthlyStats.map((item, index) => {
        // 각 상태별 실제 값을 합산하여 정확한 총합 계산 (안전한 숫자 변환)
        const 대기 = Number(item.대기) || 0;
        const 진행 = Number(item.진행) || 0;
        const 완료 = Number(item.완료) || 0;
        const 홀딩 = Number(item.홀딩) || 0;
        const total = 대기 + 진행 + 완료 + 홀딩;

        // 디버깅: 각 월의 데이터 확인
        console.log(`${item.month}: 대기=${대기}, 진행=${진행}, 완료=${완료}, 홀딩=${홀딩}, total=${total}`);

        // 6월, 8월 특별 확인
        if (item.month === '06월' || item.month === '08월') {
          console.warn(`⚠️ 문제 월 발견: ${item.month}, total=${total}`, item);
        }

        // total > 0 조건 제거하여 모든 월에 대해 annotation 생성
        return {
          x: item.month,
          y: total, // 막대 최상단에 정확히 위치
          marker: {
            size: 0,
            strokeWidth: 0,
            fillColor: 'transparent'
          },
          label: {
            text: total > 0 ? total.toString() : '',
            offsetY: -5, // 간격 없이 막대 바로 위에 표시
            style: {
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#333',
              background: 'transparent',
              borderWidth: 0,
              padding: 0
            }
          }
        };
      })
    },
    tooltip: {
      marker: {
        show: false
      },
      y: {
        formatter: function (val: any) {
          return val + '건';
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
      name: '홀딩',
      data: monthlyStats.map((item) => item.홀딩)
    }
  ];

  // 페이지네이션 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // 필터가 변경될 때 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedTeam, selectedStatus, selectedAssignee, startDate, endDate]);

  return (
    <Box
      sx={{
        p: 3,
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
      {/* 기간 선택 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          점검 현황 대시보드
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
          <Typography>~</Typography>
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
        {/* 총건수 */}
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              총건수
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {totalCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              전체 점검 현황
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              완료
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['완료'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              완료된 점검
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              진행
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['진행'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              진행중인 점검
            </Typography>
          </Card>
        </Grid>

        {/* 홀딩 */}
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              홀딩
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['홀딩'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              보류중인 점검
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
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              대기
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['대기'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              대기중인 점검
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 점검분류 - 점검목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 점검분류 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              // able-pro 표준 툴팁 스타일 + 사용자 지정 색상
              '.pie_box': {
                padding: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              '.PieDot': { width: 12, height: 12, borderRadius: '50%' },
              '.fontsize': { fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.375rem', color: '#000000' },
              '.fontsizeValue': { color: '#000000', fontWeight: 600 }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              점검분류
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
              {pieChartSeries.length > 0 ? (
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
                      justifyContent: 'center'
                    }}
                  >
                    {Object.keys(categoryStats).map((key, index) => {
                      const count = categoryStats[key];
                      const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                      return (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '2px',
                              backgroundColor: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2'][index]
                            }}
                          />
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {key} - {count}건 ({percentage}%)
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Typography color="text.secondary">데이터가 없습니다</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* 점검 목록 */}
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
              점검 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>점검내용</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>완료일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((inspection) => (
                      <TableRow key={inspection.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{inspection.no}</TableCell>
                        <TableCell
                          sx={{
                            py: 0.5,
                            fontSize: '13px',
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {inspection.inspectionContent || '점검내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{inspection.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{inspection.inspectionDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={inspection.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(inspection.status),
                              color: 'white',
                              fontSize: '13px',
                              height: 18,
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 빈 행으로 높이 유지 */}
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

      {/* 하단 레이아웃: 점검대상 - 월별점검 */}
      <Grid container spacing={3}>
        {/* 점검대상 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              // able-pro 표준 툴팁 스타일 + 사용자 지정 색상
              '.pie_box': {
                padding: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              '.PieDot': { width: 12, height: 12, borderRadius: '50%' },
              '.fontsize': { fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.375rem', color: '#000000' },
              '.fontsizeValue': { color: '#000000', fontWeight: 600 }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              점검대상
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
              {targetPieChartSeries.length > 0 ? (
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
                    <ReactApexChart options={targetPieChartOptions} series={targetPieChartSeries} type="pie" height={250} width={250} />
                  </Box>
                  {/* 커스텀 범례 영역 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: 180,
                      justifyContent: 'center'
                    }}
                  >
                    {Object.keys(targetStats).map((key, index) => {
                      const count = targetStats[key];
                      const total = Object.values(targetStats).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                      return (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '2px',
                              backgroundColor: ['#01439C', '#389CD7', '#59B8D5'][index]
                            }}
                          />
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {key} - {count}건 ({percentage}%)
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Typography color="text.secondary">데이터가 없습니다</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* 월별 점검현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 점검현황
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

export default function InspectionManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  // Supabase 보안점검 관리 훅
  const {
    loading: supabaseLoading,
    error: supabaseError,
    fetchAllInspections,
    createInspection,
    updateInspection,
    deleteInspection,
    fetchInspectionStats,
    generateInspectionCode
  } = useSupabaseSecurityInspection();

  // 마스터코드 훅 (점검유형 가져오기)
  const { getSubCodesByGroup, subCodes } = useSupabaseMasterCode3();

  // 사용자관리 훅
  const { users } = useSupabaseUserManagement();

  // 부서관리 훅
  const { departments, fetchDepartments } = useSupabaseDepartmentManagement();

  // 컴포넌트 마운트 시 부서 목록 로드
  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // 점검유형 목록 가져오기 (GROUP033) - useMemo로 감싸서 마스터코드 로드 후 자동 업데이트
  const inspectionTypesList = React.useMemo(() => {
    const types = getSubCodesByGroup('GROUP033').map((code) => code.subcode_name);
    console.log('🔍 InspectionManagement - GROUP033 점검유형 목록:', types);
    return types;
  }, [subCodes, getSubCodesByGroup]);

  // GROUP002 서브코드 목록 (상태용)
  const statusTypes = React.useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  // 공유 Inspections 상태
  const [inspections, setInspections] = useState<InspectionTableData[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingInspection, setEditingInspection] = useState<InspectionTableData | null>(null);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // 사용자 정보
  const { data: session } = useSession();
  const { user } = useUser();
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  // 변경로그 Hook (전체 보안점검의 변경 이력)
  const { logs: dbChangeLogs, loading: changeLogsLoading, fetchChangeLogs } = useSupabaseChangeLog('security_inspection');

  // 변경로그탭이 활성화될 때 데이터 강제 새로고침
  React.useEffect(() => {
    if (value === 4 && fetchChangeLogs) {
      console.log('🔄 변경로그탭 활성화 - 데이터 새로고침');
      fetchChangeLogs();
    }
  }, [value, fetchChangeLogs]);

  // DB 변경로그를 UI 형식으로 변환
  const changeLogs = React.useMemo(() => {
    return dbChangeLogs.map((log: ChangeLogData) => {
      // record_id로 해당 보안점검 찾기 (record_id는 코드로 저장되어 있음)
      const inspection = inspections.find(i => i.code === log.record_id);

      const date = new Date(log.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}.${month}.${day} ${hour}:${minute}`;

      return {
        id: log.id,
        dateTime: formattedDateTime,
        code: log.record_id, // record_id가 이미 코드임
        target: log.title || inspection?.inspectionContent || log.record_id,
        location: '개요탭', // 변경위치
        action: log.action_type,
        changedField: log.changed_field || '-', // 변경필드
        description: log.description,
        beforeValue: log.before_value,
        afterValue: log.after_value,
        team: log.team || log.user_department || '-',
        user: log.user_name
      };
    });
  }, [dbChangeLogs, inspections]);

  // 보안점검 데이터 로드 함수 (재사용 가능)
  const loadInspectionsFromSupabase = useCallback(async () => {
    console.log('🔄 보안점검 데이터 로드 시작');
    try {
      const data = await fetchAllInspections();
      console.log('📊 fetchAllInspections 결과:', data?.length, '건');

      // Supabase 데이터를 InspectionTableData 형식으로 변환
      const transformedData: InspectionTableData[] = data.map((item: SecurityInspectionData, index: number) => {
        console.log(`🔍 데이터 변환 [${index}]:`, {
          id: item.id,
          status: item.status,
          inspection_type: item.inspection_type,
          hasAllFields: !!(item.id && item.status && item.inspection_type)
        });

        return {
          id: item.id || 0,
          no: item.no || 0,
          registrationDate: item.registration_date || '',
          code: item.code || '',
          inspectionType: item.inspection_type || '보안점검',
          inspectionTarget: item.inspection_target || '고객사',
          inspectionContent: item.inspection_content || '',
          team: item.team || '',
          assignee: item.assignee || '',
          status: item.status || '대기',
          inspectionDate: item.inspection_date || '',
          details: (item as any).details || '',
          performance: item.performance || '',
          improvements: item.improvements || '',
          thoughts: item.thoughts || '',
          notes: item.notes || '',
          attachments: item.attachments || []
        };
      });

      console.log('✅ 변환 완료, 데이터 설정 중:', transformedData.length, '건');
      console.log('📋 변환된 데이터 샘플:', transformedData[0]);

      setInspections(transformedData);
      setIsDataLoaded(true);
      console.log('✅ 보안점검 데이터 로드 완료');
    } catch (error) {
      console.error('🔴 보안점검 데이터 로드 실패:', error);
      console.error('🔴 에러 스택:', (error as Error)?.stack);
      // 실패 시 빈 배열 사용 (inspectionData는 오래된 더미 데이터일 수 있음)
      setInspections([]);
      setIsDataLoaded(true);
    }
  }, [fetchAllInspections]);

  // 데이터 로드 useEffect
  useEffect(() => {
    if (!isDataLoaded) {
      loadInspectionsFromSupabase();
    }
  }, [loadInspectionsFromSupabase, isDataLoaded]);

  // 필터 상태
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');
  const [selectedRecentStatus, setSelectedRecentStatus] = useState('전체');

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  // 변경로그 페이지네이션 적용된 데이터
  const paginatedChangeLogs = React.useMemo(() => {
    const startIndex = changeLogPage * changeLogRowsPerPage;
    return changeLogs.slice(startIndex, startIndex + changeLogRowsPerPage);
  }, [changeLogs, changeLogPage, changeLogRowsPerPage]);

  // 변경로그 총 페이지 수 계산
  const changeLogTotalPages = Math.ceil(changeLogs.length / changeLogRowsPerPage);

  // 변경로그 페이지 변경 핸들러
  const handleChangeLogPageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setChangeLogPage(newPage - 1);
  };

  // 변경로그 Go to 페이지 핸들러
  const handleChangeLogGoToPage = () => {
    const pageNumber = parseInt(changeLogGoToPage, 10);
    if (pageNumber >= 1 && pageNumber <= changeLogTotalPages) {
      setChangeLogPage(pageNumber - 1);
    }
    setChangeLogGoToPage('');
  };

  // 팀별 색상 매핑
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  // 변경로그 추가 함수
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
      try {
        const userName = currentUser?.user_name || currentUser?.name || user?.name || '시스템';

        const logData = {
          page: 'security_inspection',
          record_id: target, // 코드를 record_id로 사용
          action_type: action,
          title: title || null,
          description: description,
          before_value: beforeValue || null,
          after_value: afterValue || null,
          changed_field: changedField || null,
          user_name: userName,
          team: currentUser?.department || '시스템', // 로그인한 사용자의 부서
          user_department: currentUser?.department,
          user_position: currentUser?.position,
          user_profile_image: currentUser?.profile_image_url,
          created_at: new Date().toISOString()
        };

        console.log('📝 변경로그 저장 시도:', logData);

        // common_log_data에 직접 저장
        const supabase = createClient();
        const { data, error } = await supabase.from('common_log_data').insert(logData).select();

        if (error) {
          console.error('❌ 변경로그 저장 실패:', error);
        } else {
          console.log('✅ 변경로그 저장 성공:', description, data);
        }
      } catch (err) {
        console.error('❌ 변경로그 저장 중 오류:', err);
      }
    },
    [currentUser, user]
  );

  // 카드 클릭 핸들러
  const handleCardClick = (inspection: InspectionTableData) => {
    setEditingInspection(inspection);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingInspection(null);
  };

  // Inspection 저장 핸들러
  const handleEditInspectionSave = async (updatedInspection: InspectionTableData) => {
    console.log('🔄 handleEditInspectionSave 시작');
    console.log('📊 받은 데이터:', updatedInspection);

    const originalInspection = inspections.find((t) => t.id === updatedInspection.id);
    console.log('📊 기존 데이터:', originalInspection ? '있음' : '없음');

    try {
      if (originalInspection) {
        // 기존 데이터 업데이트
        console.log('🔄 보안점검 데이터 업데이트:', updatedInspection);

        // InspectionTableData를 SecurityInspectionData 형식으로 변환
        const supabaseData = {
          code: updatedInspection.code,
          inspection_type: updatedInspection.inspectionType,
          inspection_target: updatedInspection.inspectionTarget,
          inspection_content: updatedInspection.inspectionContent,
          inspection_date: updatedInspection.inspectionDate || null,
          team: updatedInspection.team,
          assignee: updatedInspection.assignee,
          status: updatedInspection.status,
          details: updatedInspection.details || null,
          performance: updatedInspection.performance || null,
          improvements: updatedInspection.improvements || null,
          thoughts: updatedInspection.thoughts || null,
          notes: updatedInspection.notes || null,
          attachments: updatedInspection.attachments || []
        };

        console.log('🔄 Supabase로 전송할 데이터:', supabaseData);

        const result = await updateInspection(updatedInspection.id, supabaseData);

        if (result) {
          console.log('✅ 보안점검 데이터 업데이트 성공, 데이터 새로고침 중...');

          // 변경로그는 InspectionTable.tsx에서 자동으로 추가됨 (중복 방지)

          // 전체 데이터 다시 로드 (데이터 형식 불일치 방지)
          await loadInspectionsFromSupabase();

          console.log('✅ 보안점검 데이터 새로고침 완료');

          // 성공 시 다이얼로그 닫기
          handleEditDialogClose();
        } else {
          console.error('🔴 보안점검 데이터 업데이트 실패 - updateInspection returned null');
          throw new Error('보안점검 데이터 업데이트에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        // 새 데이터 생성
        console.log('➕ 새 보안점검 데이터 생성:', updatedInspection);

        const supabaseData = {
          code: updatedInspection.code,
          inspection_type: updatedInspection.inspectionType,
          inspection_target: updatedInspection.inspectionTarget,
          inspection_content: updatedInspection.inspectionContent,
          inspection_date: updatedInspection.inspectionDate || null,
          team: updatedInspection.team,
          assignee: updatedInspection.assignee,
          status: updatedInspection.status,
          details: updatedInspection.details || null,
          performance: updatedInspection.performance || null,
          improvements: updatedInspection.improvements || null,
          thoughts: updatedInspection.thoughts || null,
          notes: updatedInspection.notes || null,
          attachments: updatedInspection.attachments || []
        };

        console.log('🔄 새 데이터 - Supabase로 전송할 데이터:', supabaseData);

        const result = await createInspection(supabaseData);

        if (result) {
          console.log('✅ 새 보안점검 데이터 생성 성공, 데이터 새로고침 중...');

          // 변경로그는 InspectionTable.tsx에서 자동으로 추가됨 (중복 방지)

          // 전체 데이터 다시 로드 (데이터 형식 불일치 방지)
          await loadInspectionsFromSupabase();

          console.log('✅ 보안점검 데이터 새로고침 완료');

          // 성공 시 다이얼로그 닫기
          handleEditDialogClose();
        } else {
          console.error('🔴 새 보안점검 데이터 생성 실패 - createInspection returned null');
          throw new Error('보안점검 데이터 생성에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } catch (error: any) {
      console.error('🔴 보안점검 데이터 저장 중 오류 - Full Object:', error);
      console.error('🔴 보안점검 데이터 저장 중 오류 - Stringified:', JSON.stringify(error, null, 2));
      console.error('🔴 보안점검 데이터 저장 중 오류 - Message:', error?.message);
      console.error('🔴 보안점검 데이터 저장 중 오류 - Stack:', error?.stack);
      alert(`저장 실패: ${error?.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  // Inspection 삭제 핸들러 (소프트 삭제)
  const handleDeleteInspections = async (ids: number[]) => {
    console.log('🗑️ handleDeleteInspections 시작:', ids);

    try {
      // 각 ID에 대해 소프트 삭제 실행
      for (const id of ids) {
        const result = await deleteInspection(id);
        if (!result) {
          throw new Error(`ID ${id} 삭제 실패`);
        }
      }

      // UI에서 삭제된 항목들 제거
      setInspections((prevInspections) => prevInspections.filter((inspection) => !ids.includes(inspection.id)));

      // 변경로그 추가
      const deletedInspections = inspections.filter((inspection) => ids.includes(inspection.id));
      deletedInspections.forEach((inspection) => {
        addChangeLog('점검 삭제', inspection.code, `${inspection.inspectionContent} 삭제`, inspection.team, undefined, undefined, undefined, inspection.inspectionContent);
      });

      console.log('✅ 보안점검 데이터 삭제 완료');
    } catch (error) {
      console.error('🔴 보안점검 데이터 삭제 중 오류:', error);
      throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록
    }
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
                보안점검관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                메인메뉴 &gt; 보안점검관리
              </Typography>
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
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="보안점검관리 탭"
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
                      {year}년
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
              {/* 데이터 탭 - 테이블 */}
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
                <InspectionTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  inspections={inspections}
                  setInspections={setInspections}
                  addChangeLog={addChangeLog}
                  onSave={handleEditInspectionSave}
                  onDelete={handleDeleteInspections}
                  generateInspectionCode={generateInspectionCode}
                />
              </Box>
            </TabPanel>
            <TabPanel value={value} index={1}>
              {/* 칸반 탭 */}
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
                <KanbanView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  inspections={inspections}
                  setInspections={setInspections}
                  addChangeLog={addChangeLog}
                  generateInspectionCode={generateInspectionCode}
                  assigneeList={users.filter((user) => user.status === 'active')}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={2}>
              {/* 월간일정 탭 */}
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
                <MonthlyScheduleView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  inspections={inspections}
                  onCardClick={handleCardClick}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={3}>
              {/* 대시보드 탭 */}
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
                <DashboardView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  selectedRecentStatus={selectedRecentStatus}
                  setSelectedRecentStatus={setSelectedRecentStatus}
                  inspections={inspections}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={4}>
              {/* 변경로그 탭 */}
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
{/* 변경로그 탭 */}
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
                      '& .MuiTable-root': {
                        minWidth: 1200
                      },
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
                        <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                          <TableCell sx={{ fontWeight: 600, width: 50 }}>NO</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 110 }}>변경시간</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 180 }}>제목</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 140 }}>코드</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 70 }}>변경분류</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 70 }}>변경위치</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 90 }}>변경필드</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 100 }}>변경전</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 100 }}>변경후</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 400 }}>변경 세부내용</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 90 }}>팀</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 90 }}>변경자</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedChangeLogs.map((log, index) => (
                          <TableRow
                            key={log.id}
                            hover
                            sx={{
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {changeLogs.length - (changeLogPage * changeLogRowsPerPage + index)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {log.dateTime}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {log.target}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {log.code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {log.action}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {log.location}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                                {log.changedField || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '13px',
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 100
                                }}
                                title={log.beforeValue || '-'}
                              >
                                {log.beforeValue || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '13px',
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 100
                                }}
                                title={log.afterValue || '-'}
                              >
                                {log.afterValue || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '13px',
                                  color: 'text.primary',
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
                              <Chip
                                label={log.team}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '13px',
                                  backgroundColor: getTeamColor(log.team),
                                  color: '#333333'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
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
                          value={changeLogRowsPerPage}
                          onChange={(e) => {
                            setChangeLogRowsPerPage(Number(e.target.value));
                            setChangeLogPage(0);
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
                          <MenuItem key="rows-5" value={5}>5</MenuItem>
                          <MenuItem key="rows-10" value={10}>10</MenuItem>
                          <MenuItem key="rows-25" value={25}>25</MenuItem>
                          <MenuItem key="rows-50" value={50}>50</MenuItem>
                        </Select>
                      </FormControl>

                      {/* Go to */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Go to
                        </Typography>
                        <TextField
                          size="small"
                          value={changeLogGoToPage}
                          onChange={(e) => setChangeLogGoToPage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleChangeLogGoToPage();
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
                        <Button size="small" onClick={handleChangeLogGoToPage} sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.875rem' }}>
                          Go
                        </Button>
                      </Box>
                    </Box>

                    {/* 오른쪽: 페이지 네비게이션 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {changeLogs.length > 0
                          ? `${changeLogPage * changeLogRowsPerPage + 1}-${Math.min((changeLogPage + 1) * changeLogRowsPerPage, changeLogs.length)} of ${changeLogs.length}`
                          : '0-0 of 0'}
                      </Typography>
                      {changeLogTotalPages > 0 && (
                        <Pagination
                          count={changeLogTotalPages}
                          page={changeLogPage + 1}
                          onChange={handleChangeLogPageChange}
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
              </Box>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>

      {/* Inspection 편집 다이얼로그 */}
      {editDialog && (
        <InspectionEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          inspection={editingInspection}
          onSave={handleEditInspectionSave}
          generateInspectionCode={generateInspectionCode}
        />
      )}
    </Box>
  );
}
