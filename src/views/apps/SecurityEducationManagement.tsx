'use client';

import React, { useState, useEffect, useCallback } from 'react';

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
import SecurityEducationDataTable from 'views/apps/SecurityEducationDataTable';
import SecurityEducationEditDialog from 'components/SecurityEducationEditDialog';
import { teams, assignees, securityEducationStatusOptions, securityEducationStatusColors, assigneeAvatars } from 'data/security-education';
import { SecurityEducationTableData, SecurityEducationStatus, SecurityEducationRecord } from 'types/security-education';
import { ThemeMode } from 'config';
import { useSupabaseSecurityEducation, SecurityEducationItem } from '../../hooks/useSupabaseSecurityEducation';
import { useSupabaseMasterCode3 } from '../../hooks/useSupabaseMasterCode3';
import { useSupabaseUserManagement } from '../../hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement } from '../../hooks/useSupabaseDepartmentManagement';
import { useSupabaseChangeLog } from '../../hooks/useSupabaseChangeLog';
import { ChangeLogData } from '../../types/changelog';
import { safeJsonParse } from '../../utils/changeLogHelper';
import { useSession } from 'next-auth/react';
import useUser from '../../hooks/useUser';
import { createClient } from '@/lib/supabase/client';

// 변경로그 타입 정의 (UI용)
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

// Icons
import { TableDocument, Chart, Calendar, Element, DocumentText } from '@wandersonalwes/iconsax-react';

// 데이터 변환 함수
const convertTableDataToRecord = (tableData: SecurityEducationTableData): SecurityEducationRecord => {
  return {
    id: tableData.id,
    no: tableData.no,
    registrationDate: tableData.registrationDate,
    code: tableData.code,
    educationType: tableData.educationType,
    educationName: tableData.educationName,
    description: tableData.description,
    location: tableData.location,
    participantCount: tableData.attendeeCount,
    executionDate: tableData.executionDate,
    status: tableData.status,
    assignee: tableData.assignee,
    team: tableData.team || '보안팀', // 팀 필드 추가
    attachment: Boolean(tableData.attachments?.length),
    attachmentCount: tableData.attachments?.length || 0,
    attachments: tableData.attachments || [],
    isNew: false,
    achievements: tableData.achievements || '',
    improvement_points: tableData.improvements || '',
    feedback: tableData.feedback || ''
  };
};

// ==============================|| 보안교육관리 메인 페이지 ||============================== //

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
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-tab-${index}`,
    'aria-controls': `task-tabpanel-${index}`
  };
}

// 칸반 뷰 컴포넌트
interface KanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  tasks: SecurityEducationTableData[];
  setTasks: React.Dispatch<React.SetStateAction<SecurityEducationTableData[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string) => void;
  onCardClick?: (task: SecurityEducationTableData) => void;
  onSave?: (task: SecurityEducationRecord) => Promise<void>;
  educationTypes?: string[];
  statusTypes?: string[];
  assigneeList?: any[];
  assignees?: string[];
  assigneeAvatars?: Record<string, string>;
  statusOptions?: any[];
  statusColors?: any;
  teams?: string[];
}

function KanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  tasks,
  setTasks,
  addChangeLog,
  onCardClick,
  onSave,
  educationTypes,
  statusTypes,
  assigneeList,
  assignees,
  assigneeAvatars,
  statusOptions,
  statusColors,
  teams
}: KanbanViewProps) {
  const theme = useTheme();

  // 상태 관리
  const [activeTask, setActiveTask] = useState<SecurityEducationTableData | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SecurityEducationTableData | null>(null);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = tasks.filter((task) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const taskYear = new Date(task.executionDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    // 교육유형 필터
    if (selectedTeam !== '전체' && task.educationType !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTask = tasks.find((task) => task.id === active.id);
    setActiveTask(draggedTask || null);
    setIsDraggingState(true);
  };

  // 카드 클릭 핸들러 - DB에서 최신 데이터 가져오기
  const handleCardClick = async (task: SecurityEducationTableData) => {
    if (onCardClick) {
      onCardClick(task);
    } else {
      try {
        // DB에서 최신 데이터 가져오기
        const { data: latestData, error } = await supabase
          .from('security_education_data')
          .select('*')
          .eq('id', task.id)
          .single();

        if (error) {
          console.error('❌ DB 조회 실패:', error);
          // 실패 시 메모리 데이터 사용
          setEditingTask(task);
        } else {
          console.log('✅ DB에서 최신 데이터 조회:', latestData);
          // 최신 데이터로 TableData 형식 변환
          const latestTask: SecurityEducationTableData = {
            ...task,
            team: latestData.team || '보안팀',
            achievements: latestData.achievements || '',
            improvements: latestData.improvement_points || '',
            feedback: latestData.feedback || ''
          };
          setEditingTask(latestTask);
        }
      } catch (error) {
        console.error('❌ 편집 준비 오류:', error);
        // 오류 시 메모리 데이터 사용
        setEditingTask(task);
      }
      setEditDialog(true);
    }
  };

  // 편집 다이얼로그 닫기
  const handleKanbanEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // Task 저장 핸들러는 2434번 줄의 데이터베이스 연동 함수로 통합됨

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDraggingState(false);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id as SecurityEducationStatus;

    // 상태가 변경된 경우만 업데이트
    const currentTask = tasks.find((task) => task.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      const oldStatus = currentTask.status;

      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));

      // 변경로그 추가
      const taskCode = currentTask.code || `EDU-${taskId}`;
      const educationName = currentTask.educationName || '교육명 없음';
      const description = `${educationName} 상태를 "${oldStatus}"에서 "${newStatus}"로 변경`;

      addChangeLog('교육 상태 변경', taskCode, description, currentTask.educationType || '미분류', oldStatus, newStatus, '상태', educationName);
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

  // 교육유형별 색상 매핑
  const getTeamColor = (team: string) => {
    switch (team) {
      case '보안교육':
        return { backgroundColor: '#F3E5F5', color: '#333333' };
      case '신입사원교육':
        return { backgroundColor: '#E0F2F1', color: '#333333' };
      case '리더십교육':
        return { backgroundColor: '#E3F2FD', color: '#333333' };
      case '직무교육':
        return { backgroundColor: '#FFF8E1', color: '#333333' };
      case '외부교육':
        return { backgroundColor: '#FCE4EC', color: '#333333' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#333333' };
    }
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

  // 드래그 가능한 카드 컴포넌트
  function DraggableCard({ task }: { task: SecurityEducationTableData }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : 'pointer'
        }
      : { cursor: 'pointer' };

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

            // 조회수 증가 (중복 방지)
            const currentUser = '현재사용자'; // 실제로는 로그인한 사용자 정보
            const viewedBy = task.viewedBy || [];
            if (!viewedBy.includes(currentUser)) {
              const updatedTask = {
                ...task,
                views: (task.views || 0) + 1,
                viewedBy: [...viewedBy, currentUser]
              };
              // 조회수 업데이트
              setTasks((prevTasks) => prevTasks.map((t) => (t.id === task.id ? updatedTask : t)));
            }

            handleCardClick(task);
          }
        }}
      >
        {/* 상태 및 교육유형 태그 */}
        <div className="status-tags">
          <span className={`status-tag status-${task.status?.toLowerCase() || 'waiting'}`}>{task.status || '대기'}</span>
          <span className="education-type-tag">{task.educationType || 'IT기술교육'}</span>
        </div>

        {/* 카드 제목 */}
        <h3 className="card-title">{task.educationName || '교육명 없음'}</h3>

        {/* 카드 정보 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{task.code || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">교육일:</span>
            <span className="info-value">{task.executionDate || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">장소:</span>
            <span className="info-value">{task.location || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">참석수:</span>
            <span className="info-value">{task.attendeeCount || 0}명</span>
          </div>
        </div>

        {/* 하단 - 담당자와 통계 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={
                assigneeList?.find((user) => user.user_name === task.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === task.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={task.assignee || '담당자'}
            />
            <span className="assignee-name">{task.assignee || '미할당'}</span>
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
          row-gap: 20px;
          flex-shrink: 0;
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
        
        .status-대기 {
          background: rgba(251, 191, 36, 0.15);
          color: #f59e0b;
        }
        
        .status-진행 {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        
        .status-완료 {
          background: rgba(34, 197, 94, 0.15);
          color: #16a34a;
        }
        
        .status-홀딩 {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }
        
        .education-type-tag {
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(156, 163, 175, 0.15);
          color: #4b5563;
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
        }

        .card-title {
          font: 600 16px/1.3 "Inter", "Noto Sans KR", sans-serif;
          color: #1f2937;
          margin: 0 0 3px 0;
        }
        
        .card-info {
          margin: 0 0 7px 0;
        }
        
        .info-line {
          display: flex;
          align-items: center;
          margin: 0 0 8px 0;
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
        
        .progress-section {
          margin-bottom: 16px;
        }
        
        .progress-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .progress-text {
          font: 600 12px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #374151;
        }
        
        .progress-left {
          display: flex;
          align-items: center;
          gap: 8px;
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
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .assignee-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .assignee-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #e5e7eb;
        }
        
        .assignee-name {
          font-size: 12px;
          color: #4b5563;
          font-weight: 500;
        }
        
        .card-stats {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .stat-item.clickable {
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .stat-item.clickable:hover {
          transform: scale(1.1);
        }
        
        .stat-icon {
          font-size: 13px;
          color: #9ca3af;
          opacity: 1;
          font-weight: 300;
        }
        
        .stat-icon.liked {
          color: #ef4444;
        }
        
        .stat-number {
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #9ca3af;
        }
        
        
        @media (max-width: 768px) {
          .kanban-column {
            width: 220px;
          }
        }
      `}</style>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {statusColumns.map((column) => {
            const items = getItemsByStatus(column.key);
            return (
              <DroppableColumn key={column.key} column={column}>
                {items.map((item) => (
                  <DraggableCard key={item.id} task={item} />
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

        <DragOverlay>{activeTask ? <DraggableCard task={activeTask} /> : null}</DragOverlay>
      </DndContext>

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <SecurityEducationEditDialog
          open={editDialog}
          onClose={handleKanbanEditDialogClose}
          data={editingTask ? convertTableDataToRecord(editingTask) : null}
          mode={editingTask ? 'edit' : 'add'}
          onSave={onSave}
          educationTypes={educationTypes}
          statusTypes={statusTypes}
          assigneeList={assigneeList}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={statusOptions}
          statusColors={statusColors}
          teams={teams}
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
  tasks: SecurityEducationTableData[];
  onCardClick: (task: SecurityEducationTableData) => void;
}

function MonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  tasks,
  onCardClick
}: MonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  // 데이터 필터링
  const filteredData = tasks.filter((task) => {
    // 연도 필터 (메인 필터가 전체가 아니면 메인 필터 우선, 아니면 뷰 필터 사용)
    const useYear = selectedYear !== '전체' ? selectedYear : viewYear;
    const taskYear = new Date(task.executionDate).getFullYear().toString();
    if (taskYear !== useYear) return false;

    // 교육유형 필터
    if (selectedTeam !== '전체' && task.educationType !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: SecurityEducationTableData[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.executionDate);
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
            items.sort((a, b) => new Date(a.executionDate).getTime() - new Date(b.executionDate).getTime());

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
                  const date = new Date(item.executionDate);
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
                        title={item.educationName || '교육명 없음'}
                      >
                        {item.educationName || '교육명 없음'}
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
            items.sort((a, b) => new Date(a.executionDate).getTime() - new Date(b.executionDate).getTime());

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
                  boxSizing: 'border-box',
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
                  const date = new Date(item.executionDate);
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
                        title={item.educationName || '교육명 없음'}
                      >
                        {item.educationName || '교육명 없음'}
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
  );
}

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  tasks: SecurityEducationTableData[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function ChangeLogView({
  changeLogs,
  tasks,
  page,
  rowsPerPage,
  goToPage,
  onPageChange,
  onRowsPerPageChange,
  onGoToPageChange
}: ChangeLogViewProps) {
  const theme = useTheme();

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
    return { color: '#333333' };
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
              <TableCell sx={{ fontWeight: 600, width: 130 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 300 }}>변경 세부내용</TableCell>
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
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {changeLogs.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {log.title}
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
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {log.team}
                  </Typography>
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
            <Button size="small" onClick={handleGoToPage} sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.875rem' }}>
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

// 대시보드 뷰 컴포넌트
interface DashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
  tasks: SecurityEducationTableData[];
}

function DashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  selectedRecentStatus,
  setSelectedRecentStatus,
  tasks
}: DashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: SecurityEducationTableData[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((task) => {
      const taskDate = new Date(task.executionDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return taskDate >= start && taskDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return taskDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return taskDate <= end;
      }

      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(tasks).filter((task) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const taskYear = new Date(task.executionDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && task.educationType !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;
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

  // 교육유형별 통계 (원형차트용) - educationType 필드 사용
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = item.educationType || '기타';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 담당자별 통계 (원형차트용)
  const assigneeStats = filteredData.reduce(
    (acc, item) => {
      const assignee = item.assignee || '미할당';
      acc[assignee] = (acc[assignee] || 0) + 1;
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
  const monthlyStats: { month: string; 계획: number; 진행중: number; 완료: number; 취소: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const date = new Date(item.executionDate);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthData[monthKey]) {
      monthData[monthKey] = { 계획: 0, 진행중: 0, 완료: 0, 취소: 0 };
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
        계획: monthData[month]['계획'] || 0,
        진행중: monthData[month]['진행중'] || 0,
        완료: monthData[month]['완료'] || 0,
        취소: monthData[month]['취소'] || 0
      });
    });

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '계획':
        return '#ED8936';
      case '진행중':
        return '#4267B2';
      case '완료':
        return '#4A5568';
      case '취소':
        return '#E53E3E';
      default:
        return '#9e9e9e';
    }
  };

  // 라벨과 값 배열 미리 생성
  const categoryLabels = Object.keys(categoryStats);
  const categoryValues = Object.values(categoryStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 업무분류 데이터 확인:', {
    filteredData: filteredData.length,
    categoryStats,
    categoryLabels,
    categoryValues,
    sampleData: filteredData.slice(0, 3).map((item) => ({
      department: item.department,
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

  // 담당자 라벨과 값 배열 미리 생성
  const assigneeLabels = Object.keys(assigneeStats);
  const assigneeValues = Object.values(assigneeStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 업무담당 데이터 확인:', {
    assigneeStats,
    assigneeLabels,
    assigneeValues
  });

  // 담당자 원형차트 옵션 - 새로운 접근방식: 내장 툴팁 포맷터 사용
  const assigneePieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: assigneeLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2', '#A8C5D8', '#6B9BD1'],
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
        const capturedLabels = [...assigneeLabels];
        const capturedValues = [...assigneeValues];

        const value = capturedValues[seriesIndex] || 0;
        const label = capturedLabels[seriesIndex] || '담당자';
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

  const assigneePieChartSeries = assigneeValues;

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
        text: '교육 건수'
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
        const 계획 = Number(item.계획) || 0;
        const 진행중 = Number(item.진행중) || 0;
        const 완료 = Number(item.완료) || 0;
        const 취소 = Number(item.취소) || 0;
        const total = 계획 + 진행중 + 완료 + 취소;

        // 디버깅: 각 월의 데이터 확인
        console.log(`${item.month}: 계획=${계획}, 진행중=${진행중}, 완료=${완료}, 취소=${취소}, total=${total}`);

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
      name: '계획',
      data: monthlyStats.map((item) => item.계획)
    },
    {
      name: '진행중',
      data: monthlyStats.map((item) => item.진행중)
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
          교육 현황 대시보드
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
              전체 교육 현황
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
              완료된 교육
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
              진행중
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['진행중'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              진행중인 교육
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
              취소
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['취소'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              취소된 교육
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
              계획
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['계획'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              계획중인 교육
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 교육유형별 - 교육목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 교육유형별 원형차트 */}
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
              교육유형별
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

        {/* 교육 목록 */}
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
              교육 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>교육명</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>교육일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.no}</TableCell>
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
                          {task.educationName || '교육명 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.executionDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={task.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(task.status),
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

      {/* 하단 레이아웃: 업무담당 - 월별업무 */}
      <Grid container spacing={3}>
        {/* 업무담당 원형차트 */}
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
              교육담당
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
              {assigneePieChartSeries.length > 0 ? (
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
                    <ReactApexChart options={assigneePieChartOptions} series={assigneePieChartSeries} type="pie" height={250} width={250} />
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
                    {Object.keys(assigneeStats).map((key, index) => {
                      const count = assigneeStats[key];
                      const total = Object.values(assigneeStats).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                      return (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '2px',
                              backgroundColor: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2', '#A8C5D8', '#6B9BD1'][
                                index
                              ]
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

        {/* 월별 교육현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 교육현황
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

export default function SecurityEducationManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  // 현재 사용자 정보
  const user = useUser();
  const { data: session } = useSession();
  const { users } = useSupabaseUserManagement();

  // 세션 email로 DB에서 사용자 찾기
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  // Supabase hooks
  const {
    items: securityEducations,
    loading: educationsLoading,
    createEducation,
    updateEducation,
    deleteEducation,
    fetchEducations
  } = useSupabaseSecurityEducation();
  const { getSubCodesByGroup } = useSupabaseMasterCode3();
  const { departments, fetchDepartments } = useSupabaseDepartmentManagement();

  // 컴포넌트 마운트 시 부서 목록 로드
  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // GROUP002 서브코드 목록 (상태용)
  const statusTypes = React.useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  // 공유 Tasks 상태 - 데이터베이스 데이터를 SecurityEducationTableData 형식으로 변환
  const [tasks, setTasks] = useState<SecurityEducationTableData[]>([]);

  // 데이터베이스 데이터를 테이블 형식으로 변환
  useEffect(() => {
    console.log('🟡 useEffect 트리거됨, securityEducations 개수:', securityEducations.length);
    console.log('🟡 securityEducations 첫번째 데이터:', securityEducations[0]);

    // 첫번째 education의 code 필드 확인
    if (securityEducations.length > 0) {
      console.log('🔍🔍🔍 DB에서 가져온 education.code:', securityEducations[0].code);
      console.log('🔍🔍🔍 DB에서 가져온 education 전체 키:', Object.keys(securityEducations[0]));
    }

    const convertedTasks: SecurityEducationTableData[] = securityEducations.map((education: SecurityEducationItem) => {
      const convertedCode = education.code || `EDU-${education.id}`;

      console.log(`🔍 ID ${education.id}: DB code="${education.code}" → 사용할 code="${convertedCode}"`);

      return {
        id: education.id,
        no: education.no || education.id,
        title: education.education_name,
        educationName: education.education_name || '교육명 없음',
        educationType: education.education_type || '온라인',
        assignee: education.assignee || '미정',
        team: education.team || '보안팀', // DB에서 팀 정보 로드
        executionDate: education.execution_date || new Date().toISOString().split('T')[0],
        attendeeCount: education.participant_count || 0,
        participantCount: education.participant_count || 0,
        status: (education.status as SecurityEducationStatus) || '계획',
        description: education.description || '',
        location: education.location || '',
        code: convertedCode,
        registrationDate: education.registration_date || new Date().toISOString().split('T')[0],
        achievements: education.achievements || '', // 성과
        feedback: education.feedback || '', // 교육소감
        improvementPoints: education.improvement_points || '',
        improvements: education.improvement_points || '', // improvement_points에서 개선사항 로드
        effectivenessScore: education.effectiveness_score || 0,
        completionRate: education.completion_rate || 0,
        satisfactionScore: education.satisfaction_score || 0
      };
    });

    console.log('🟡 변환된 tasks 개수:', convertedTasks.length);
    console.log('🟡 변환된 첫번째 task.code:', convertedTasks[0]?.code);
    setTasks(convertedTasks);
  }, [securityEducations]);

  // 강제 데이터 새로고침 함수
  const handleRefreshData = useCallback(async () => {
    console.log('🔄 데이터 강제 새로고침 시작');
    await fetchEducations();
  }, [fetchEducations]);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SecurityEducationTableData | null>(null);

  // 편집 다이얼로그 핸들러
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // 교육 저장 핸들러
  const handleEditTaskSave = async (record: SecurityEducationRecord) => {
    try {
      console.log('🔵 교육 저장 시작:', record);

      const educationData = {
        education_name: record.educationName,
        description: record.description,
        education_type: record.educationType,
        assignee: record.assignee,
        execution_date: record.executionDate,
        location: record.location,
        status: record.status,
        participant_count: record.participantCount,
        code: record.code,
        achievements: record.achievements,
        feedback: record.feedback,
        improvement_points: record.improvement_points,
        effectiveness_score: null,
        completion_rate: null,
        satisfaction_score: null
      };

      console.log('🔵 전송할 데이터:', educationData);

      if (record.id && record.id !== 'new' && record.id !== '' && !isNaN(parseInt(record.id.toString()))) {
        // 기존 교육 수정
        console.log('🔵 기존 교육 수정 시작:', record.id);
        const success = await updateEducation(parseInt(record.id.toString()), educationData);
        console.log('🔵 수정 결과:', success);
        if (success) {
          addChangeLog(
            '수정',
            record.code || record.educationName,
            `보안교육 "${record.educationName}" 정보가 수정되었습니다.`,
            record.educationType,
            undefined,
            undefined,
            undefined,
            record.educationName
          );
          // 수정 후 즉시 데이터 새로고침
          console.log('🔄 수정 후 데이터 새로고침');
          await handleRefreshData();
        }
      } else {
        // 새 교육 생성
        console.log('🔵 새 교육 생성 시작');
        const success = await createEducation(educationData);
        console.log('🔵 생성 결과:', success);
        if (success) {
          addChangeLog(
            '생성',
            record.code || record.educationName,
            `보안교육 "${record.educationName}"이 생성되었습니다.`,
            record.educationType,
            undefined,
            undefined,
            undefined,
            record.educationName
          );
          // 생성 후 즉시 데이터 새로고침
          console.log('🔄 생성 후 데이터 새로고침');
          await handleRefreshData();
        }
      }

      setEditDialog(false);
      setEditingTask(null);
    } catch (error) {
      console.error('🔴 교육 저장 오류:', error);
    }
  };

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // 변경로그 Hook (전체 보안교육의 변경 이력)
  const { logs: dbChangeLogs, loading: changeLogsLoading, fetchChangeLogs } = useSupabaseChangeLog('main_education');

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
      // record_id로 해당 교육 찾기 (record_id는 코드로 저장되어 있음)
      const education = tasks.find(t => t.code === log.record_id);

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
        title: log.title || education?.educationName || log.record_id,
        code: log.record_id,
        action: log.action_type,
        location: log.description.includes('개요탭') ? '개요탭' : log.description.includes('데이터탭') ? '데이터탭' : '-',
        changedField: log.changed_field || '-',
        beforeValue: log.before_value || '-',
        afterValue: log.after_value || '-',
        description: log.description,
        team: log.team || log.user_department || '-',
        user: log.user_name
      };
    });
  }, [dbChangeLogs, tasks]);

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

  // 변경로그 추가 함수
  const addChangeLog = useCallback(
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
          page: 'main_education',
          record_id: target, // 코드를 record_id로 사용
          action_type: action,
          description: description,
          before_value: beforeValue || null,
          after_value: afterValue || null,
          changed_field: changedField || null,
          title: title || null,
          user_name: userName,
          team: currentUser?.department || team, // 로그인한 사용자의 부서
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
          console.log('✅ 변경로그 저장 성공:', data);
          await fetchChangeLogs();
        }
      } catch (err) {
        console.error('❌ 변경로그 저장 중 오류:', err);
      }
    },
    [currentUser, user, fetchChangeLogs]
  );

  // 카드 클릭 핸들러
  const handleCardClick = (task: SecurityEducationTableData) => {
    setEditingTask(task);
    setEditDialog(true);
  };

  // Kanban Task 저장 핸들러
  const handleKanbanEditTaskSave = (updatedTask: SecurityEducationTableData) => {
    const originalTask = tasks.find((t) => t.id === updatedTask.id);

    if (originalTask) {
      // 업데이트
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? { ...updatedTask } : task)));

      // 변경로그 추가
      const changes = [];
      if (originalTask.status !== updatedTask.status) {
        changes.push(`상태: ${originalTask.status} → ${updatedTask.status}`);
      }
      if (originalTask.assignee !== updatedTask.assignee) {
        changes.push(`담당자: ${originalTask.assignee} → ${updatedTask.assignee}`);
      }
      if (originalTask.completedDate !== updatedTask.completedDate) {
        changes.push(`완료일: ${originalTask.completedDate} → ${updatedTask.completedDate}`);
      }

      if (changes.length > 0) {
        addChangeLog('업무 수정', updatedTask.code, changes.join(', '), updatedTask.team, undefined, undefined, undefined, updatedTask.educationName || updatedTask.workContent);
      }
    } else {
      // 새로 생성
      setTasks((prevTasks) => [...prevTasks, updatedTask]);
      addChangeLog('업무 생성', updatedTask.code, `새로운 업무가 생성되었습니다: ${updatedTask.workContent}`, updatedTask.team, undefined, undefined, undefined, updatedTask.educationName || updatedTask.workContent);
    }

    handleEditDialogClose();
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
                보안교육관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                보안메뉴 &gt; 보안교육관리
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
              aria-label="보안교육관리 탭"
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
                  <MenuItem key="year-all" value="전체">전체</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={`year-${year}`} value={year}>
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
                  <MenuItem key="team-all" value="전체">전체</MenuItem>
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
                  <MenuItem key="assignee-all" value="전체">전체</MenuItem>
                  {users
                    .filter((user) => user.status === 'active')
                    .map((user, index) => (
                      <MenuItem key={`assignee-${user.id || index}`} value={user.user_name}>
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
                  <MenuItem key="status-all" value="전체">전체</MenuItem>
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
                <SecurityEducationDataTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                  onDataRefresh={handleRefreshData}
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
                  tasks={tasks}
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                  onSave={handleEditTaskSave}
                  educationTypes={getSubCodesByGroup('GROUP008').map((code) => code.sub_code_name)}
                  statusTypes={getSubCodesByGroup('GROUP002').map((code) => code.sub_code_name)}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  assignees={assignees}
                  assigneeAvatars={assigneeAvatars}
                  statusOptions={securityEducationStatusOptions}
                  statusColors={securityEducationStatusColors}
                  teams={teams}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={2}>
              {/* 월간일정 탭 */}
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
                <MonthlyScheduleView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
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
                  tasks={tasks}
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
                <ChangeLogView
                  changeLogs={changeLogs}
                  tasks={tasks}
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

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <SecurityEducationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          data={editingTask ? convertTableDataToRecord(editingTask) : null}
          mode={editingTask ? 'edit' : 'add'}
          onSave={handleKanbanEditTaskSave}
          educationTypes={getSubCodesByGroup('GROUP008').map((code) => code.sub_code_name)}
          statusTypes={getSubCodesByGroup('GROUP002').map((code) => code.sub_code_name)}
          assigneeList={users.filter((user) => user.status === 'active')}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={securityEducationStatusOptions}
          statusColors={securityEducationStatusColors}
          teams={teams}
        />
      )}
    </Box>
  );
}
