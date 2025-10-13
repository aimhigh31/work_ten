'use client';

import React, { useState, useEffect } from 'react';

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
  Checkbox,
  IconButton,
  Button,
  Avatar,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import TaskTable from 'views/apps/TaskTable';
import TaskEditDialog from 'components/TaskEditDialog';
import EducationEditDialog from 'components/EducationEditDialog';
import EducationDataTable from 'views/apps/EducationDataTable';
import { taskData, taskStatusColors, assigneeAvatars } from 'data/task';
import { TaskTableData, TaskStatus } from 'types/task';
import { ThemeMode } from 'config';
import { useSupabaseEducation } from 'hooks/useSupabaseEducation';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement } from 'hooks/useSupabaseDepartmentManagement';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';

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

// Icons
import { TableDocument, Chart, Calendar, Element, DocumentText, Edit, Trash, Add, DocumentDownload } from '@wandersonalwes/iconsax-react';
import Tooltip from '@mui/material/Tooltip';

// ==============================|| 개인교육관리 메인 페이지 ||============================== //

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
      id={`education-tabpanel-${index}`}
      aria-labelledby={`education-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ p: 0, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `education-tab-${index}`,
    'aria-controls': `education-tabpanel-${index}`
  };
}

// ==============================|| EDUCATION KANBAN VIEW ||============================== //

interface EducationKanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  educations: any[];
  onUpdateEducation: (id: string, updates: any) => Promise<boolean>;
  addChangeLog: (action: string, target: string, description: string, team: string, user: string) => void;
  assignees: string[];
  assigneeList?: any[];
  users: any[];
  assigneeAvatars: Record<string, string>;
  educationCategories: string[];
  educationMethods: string[];
  statusOptions: string[];
  departments: string[];
}

function EducationKanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  educations,
  onUpdateEducation,
  addChangeLog,
  assignees,
  assigneeList,
  users,
  assigneeAvatars,
  educationCategories,
  educationMethods,
  statusOptions,
  departments
}: EducationKanbanViewProps) {
  const theme = useTheme();

  // 상태 관리
  const [activeEducation, setActiveEducation] = useState<any | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any | null>(null);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = educations.filter((education) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const educationYear = new Date(education.startDate).getFullYear().toString();
      if (educationYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && education.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && education.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && education.status !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedEducation = educations.find((education) => education.id === active.id);
    setActiveEducation(draggedEducation || null);
    setIsDraggingState(true);
  };

  // 카드 클릭 핸들러
  const handleCardClick = (education: any) => {
    setEditingEducation(education);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingEducation(null);
  };

  // Education 저장 핸들러
  const handleEditEducationSave = async (updatedEducation: any) => {
    const originalEducation = educations.find((e) => e.id === updatedEducation.id);

    if (originalEducation) {
      // Supabase 업데이트
      const success = await onUpdateEducation(updatedEducation.id, {
        start_date: updatedEducation.startDate,
        completion_date: updatedEducation.endDate,
        education_category: updatedEducation.category,
        title: updatedEducation.content,
        description: updatedEducation.description || '',
        education_type: updatedEducation.type,
        team: updatedEducation.team,
        assignee_name: updatedEducation.assignee,
        status: updatedEducation.status
      });

      if (!success) {
        console.error('❌ 교육 데이터 수정 실패');
        return;
      }

      // 변경로그 추가
      const changes: string[] = [];
      const educationCode = updatedEducation.code || `EDU-${updatedEducation.id}`;

      if (originalEducation.content !== updatedEducation.content) {
        changes.push(`교육내용: "${originalEducation.content}" → "${updatedEducation.content}"`);
      }
      if (originalEducation.status !== updatedEducation.status) {
        changes.push(`상태: "${originalEducation.status}" → "${updatedEducation.status}"`);
      }
      if (originalEducation.assignee !== updatedEducation.assignee) {
        changes.push(`담당자: "${originalEducation.assignee}" → "${updatedEducation.assignee}"`);
      }

      if (changes.length > 0) {
        addChangeLog('교육수정', educationCode, changes.join(', '), updatedEducation.team || '개발팀', '현재 사용자');
      }
    }

    handleEditDialogClose();
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEducation(null);
    setIsDraggingState(false);

    if (!over) return;

    const educationId = active.id;
    const newStatus = over.id as string;

    // 상태가 변경된 경우만 업데이트
    const education = educations.find((e) => e.id === educationId);
    if (education && education.status !== newStatus) {
      const oldStatus = education.status;

      // Supabase 업데이트
      const success = await onUpdateEducation(educationId as string, {
        status: newStatus
      });

      if (!success) {
        console.error('❌ 상태 변경 실패');
        return;
      }

      // 변경로그 추가
      const educationCode = education.code || `EDU-${educationId}`;
      addChangeLog(
        '상태변경',
        educationCode,
        `상태가 "${oldStatus}"에서 "${newStatus}"로 변경되었습니다.`,
        education.team || '개발팀',
        '현재 사용자'
      );
    }
  };

  // 상태별 컬럼 정의 (다른 관리 페이지와 통일)
  const statusColumns = [
    { key: '대기', title: '대기', pillBg: '#F0F0F0', pillColor: '#424242' },
    { key: '진행', title: '진행', pillBg: '#E3F2FD', pillColor: '#1976D2' },
    { key: '완료', title: '완료', pillBg: '#E8F5E8', pillColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillBg: '#FFEBEE', pillColor: '#D32F2F' }
  ];

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
  };

  // 팀별 색상 매핑 (업무관리와 동일)
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  // 담당자별 배경색 매핑
  const getAssigneeStyle = (assignee: string) => {
    const colorMap: Record<string, string> = {
      김민수: '#D8DCFF',
      이영희: '#D8CBF4',
      박지훈: '#F8E7B5',
      최수진: '#FAD0D0',
      정우진: '#D8DCFF',
      김철수: '#D8CBF4',
      박민수: '#F8E7B5',
      이준호: '#FAD0D0',
      최지연: '#D8DCFF',
      강민정: '#D8CBF4'
    };
    return colorMap[assignee] || '#E0E0E0';
  };

  // 진행율 계산 (상태 기반)
  const getProgressByStatus = (status: string) => {
    switch (status) {
      case '대기':
        return 0;
      case '진행':
        return 50;
      case '완료':
        return 100;
      case '홀딩':
        return 0;
      default:
        return 0;
    }
  };

  // 드래그 가능한 카드 컴포넌트 (사양에 맞춰 완전히 새로 작성)
  function DraggableCard({ education }: { education: any }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: education.id
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : 'pointer'
        }
      : { cursor: 'pointer' };

    // 상태별 태그 색상
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
    const progress = education.progress || getProgressByStatus(education.status);
    const progressStage = (() => {
      if (progress >= 80) return '근본 개선';
      if (progress >= 60) return '즉시 해결';
      if (progress >= 40) return '개선 조치 중';
      if (progress >= 20) return '현황 분석';
      return '사고 탐지';
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
            handleCardClick(education);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(education.status)}>
            {education.status}
          </span>
          <span className="incident-type-tag">{education.educationType || '일반교육'}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{education.content || '교육내용 없음'}</h3>

        {/* 3. 정보 라인 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{education.code || `EDU-${education.id}`}</span>
          </div>
          <div className="info-line">
            <span className="info-label">시작일:</span>
            <span className="info-value">{education.startDate || '미정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">완료일:</span>
            <span className="info-value">{education.completionDate || '미정'}</span>
          </div>
        </div>

        {/* 4. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={
                assigneeList?.find((user) => user.user_name === education.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === education.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={education.assignee || '미할당'}
            />
            <span className="assignee-name">{education.assignee || '미할당'}</span>
          </div>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-icon">❤️</span>
              <span className="stat-number">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👁</span>
              <span className="stat-number">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💬</span>
              <span className="stat-number">0</span>
            </div>
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
                {items.map((item, itemIndex) => (
                  <DraggableCard key={String(item.id) || `edu-${column.key}-${itemIndex}`} education={item} />
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

        <DragOverlay>{activeEducation ? <DraggableCard education={activeEducation} /> : null}</DragOverlay>
      </DndContext>

      {/* Education 편집 다이얼로그 */}
      {editDialog && (
        <EducationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          education={editingEducation}
          onSave={handleEditEducationSave}
          assignees={users.filter((user) => user.status === 'active').map((user) => user.user_name)}
          assigneeAvatars={assigneeAvatars}
          educationCategories={educationCategories}
          educationMethods={educationMethods}
          statusOptions={statusOptions}
          departments={departments}
          educations={educations}
        />
      )}
    </Box>
  );
}

// 교육 대시보드 뷰 컴포넌트
interface EducationDashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  educations: any[];
}
function EducationDashboardView({ selectedYear, selectedTeam, selectedStatus, selectedAssignee, educations }: EducationDashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: any[]) => {
    if (!startDate && !endDate) {
      return data;
    }
    return data.filter((education) => {
      const educationDate = new Date(education.startDate);
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return educationDate >= start && educationDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return educationDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return educationDate <= end;
      }
      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(educations).filter((education) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const educationYear = new Date(education.startDate).getFullYear().toString();
      if (educationYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && education.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && education.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && education.status !== selectedStatus) return false;
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

  // 교육분류별 통계 (원형차트용)
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = item.category || '기타';
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

  // 월별 통계 (막대차트용)
  const monthlyStats: { month: string; 예정: number; 진행: number; 완료: number; 중단: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const date = new Date(item.startDate);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!monthData[monthKey]) {
      monthData[monthKey] = { 예정: 0, 진행: 0, 완료: 0, 중단: 0 };
    }
    monthData[monthKey][item.status as keyof (typeof monthData)[typeof monthKey]]++;
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
  const categoryLabels = Object.keys(categoryStats);
  const categoryValues = Object.values(categoryStats);

  // 원형차트 옵션
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
          return val + '건';
        }
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const pieChartSeries = categoryValues;

  // 담당자 라벨과 값 배열 미리 생성
  const assigneeLabels = Object.keys(assigneeStats);
  const assigneeValues = Object.values(assigneeStats);

  // 담당자 원형차트 옵션
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
          return val + '건';
        }
      }
    },
    dataLabels: {
      enabled: false
    }
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
        columnWidth: '55%'
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
    tooltip: {
      y: {
        formatter: function (val) {
          return val + '건';
        }
      }
    }
  };

  const barChartSeries = [
    {
      name: '예정',
      data: monthlyStats.map((item) => item.예정)
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
      name: '중단',
      data: monthlyStats.map((item) => item.중단)
    }
  ];

  // 상태 색상 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
      case '예정':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '홀딩':
      case '중단':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
              진행
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['진행'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              진행중인 교육
            </Typography>
          </Card>
        </Grid>
        {/* 중단 */}
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
              중단
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['중단'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              중단된 교육
            </Typography>
          </Card>
        </Grid>
        {/* 예정 */}
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
              예정
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['예정'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              예정된 교육
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 교육분류 - 교육목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 교육분류 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '.pie_box': {
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5
              },
              '.fontsize': { fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.375rem', color: '#000000' },
              '.fontsizeValue': { color: '#000000', fontWeight: 600 }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              교육분류
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
              {categoryLabels.length > 0 ? (
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
                    {categoryLabels.map((label, index) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: pieChartOptions.colors?.[index % pieChartOptions.colors.length]
                          }}
                        />
                        <Typography className="fontsize" sx={{ flex: 1, fontSize: '13px' }}>
                          {label}
                        </Typography>
                        <Typography className="fontsizeValue" sx={{ fontSize: '13px' }}>
                          {categoryValues[index]}
                        </Typography>
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
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>교육내용</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>종료일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((education, eduIndex) => (
                      <TableRow key={String(education.id) || `edu-table-${eduIndex}`} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{education.no}</TableCell>
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
                          {education.content || '교육내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{education.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{education.endDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={education.status}
                            size="small"
                            sx={{
                              ...getStatusColor(education.status),
                              fontSize: '13px',
                              fontWeight: 500
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

      {/* 하단 레이아웃: 교육담당 - 월별교육 */}
      <Grid container spacing={3}>
        {/* 교육담당 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '.pie_box': {
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5
              },
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
              {assigneeLabels.length > 0 ? (
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
                      maxWidth: 180
                    }}
                  >
                    {assigneeLabels.map((label, index) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: assigneePieChartOptions.colors?.[index % assigneePieChartOptions.colors.length]
                          }}
                        />
                        <Typography className="fontsize" sx={{ flex: 1, fontSize: '13px' }}>
                          {label}
                        </Typography>
                        <Typography className="fontsizeValue" sx={{ fontSize: '13px' }}>
                          {assigneeValues[index]}
                        </Typography>
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

// 교육 변경로그 뷰 컴포넌트
interface EducationChangeLogViewProps {
  changeLogs: ChangeLog[];
  educations: any[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function EducationChangeLogView({
  changeLogs,
  educations,
  page,
  rowsPerPage,
  goToPage,
  onPageChange,
  onRowsPerPageChange,
  onGoToPageChange
}: EducationChangeLogViewProps) {
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
    switch (team) {
      case '마케팅팀':
        return '#E3F2FD';
      case '디자인팀':
        return '#F3E5F5';
      case '기획팀':
        return '#E0F2F1';
      case '개발팀':
        return '#F1F8E9';
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
              <TableCell sx={{ fontWeight: 600, width: 130 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 280 }}>변경 세부내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>변경자</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log, index) => (
              <TableRow
                key={String(log.id) || `log-${index}`}
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
                    {log.changedField || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.beforeValue || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.afterValue || '-'}
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

// 교육 월간일정 뷰 컴포넌트 (보안사고관리와 완전 동일)
interface EducationMonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  educations: any[];
  onCardClick: (education: any) => void;
}

function EducationMonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  educations,
  onCardClick
}: EducationMonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  // 데이터 필터링
  const filteredData = educations.filter((task) => {
    // 연도 필터 (메인 필터가 전체가 아니면 메인 필터 우선, 아니면 뷰 필터 사용)
    const useYear = selectedYear !== '전체' ? selectedYear : viewYear;
    const taskYear = new Date(task.startDate).getFullYear().toString();
    if (taskYear !== useYear) return false;

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: any[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.startDate);
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
      case '예정':
        return '#F5F5F5';
      case '진행':
        return '#E3F2FD';
      case '완료':
        return '#E8F5E9';
      case '홀딩':
      case '취소':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case '대기':
      case '예정':
        return '#757575';
      case '진행':
        return '#1976D2';
      case '완료':
        return '#388E3C';
      case '홀딩':
      case '취소':
        return '#D32F2F';
      default:
        return '#757575';
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
                        key={String(item.id) || `monthly-${itemIndex}`}
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
                          title={item.content || '교육내용 없음'}
                        >
                          {item.content || '교육내용 없음'}
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
              items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

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
                        key={String(item.id) || `monthly-${itemIndex}`}
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
                          title={item.content || '교육내용 없음'}
                        >
                          {item.content || '교육내용 없음'}
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

// ==============================|| 개인교육관리 메인 컴포넌트 ||============================== //

export default function EducationManagement() {
  const [value, setValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState<string>('전체');
  const [selectedTeam, setSelectedTeam] = useState<string>('전체');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('전체');
  const [selectedStatus, setSelectedStatus] = useState<string>('전체');
  const [viewYear, setViewYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [goToPage, setGoToPage] = useState('');

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // Supabase 훅 사용
  const { educations: supabaseEducations, loading, error, addEducation, updateEducation, deleteEducation, checkCodeExists } = useSupabaseEducation();

  // 마스터코드 훅 사용 (교육분류)
  const { subCodes, getSubCodesByGroup } = useSupabaseMasterCode3();
  const { users } = useSupabaseUserManagement();
  const { departments, fetchDepartments } = useSupabaseDepartmentManagement();

  // 인증 및 사용자 정보
  const { data: session } = useSession();
  const user = useUser();
  const userName = user?.name || session?.user?.name || '시스템';
  const currentUser = users.find((u) => u.email === session?.user?.email);

  // 변경로그 Hook
  const { logs: dbChangeLogs, loading: changeLogsLoading, fetchChangeLogs } = useSupabaseChangeLog('main_education');

  // 부서 데이터 로드
  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // 마스터코드에서 상태 옵션 가져오기
  const statusTypes = React.useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  // 사용자 아바타 상태 관리
  const [userAvatars, setUserAvatars] = React.useState<Record<string, string>>({});

  // 기존 사용자 조회 코드 (아바타 부분만 유지)
  React.useEffect(() => {
    const fetchUserAvatars = async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        if (result.success) {
          const activeUsers = result.data.filter((user: any) => user.is_active && user.status === 'active');
          const avatarMap = activeUsers.reduce((acc: Record<string, string>, user: any) => {
            if (user.user_name && user.profile_image_url) {
              acc[user.user_name] = user.profile_image_url;
            }
            return acc;
          }, {});
          setUserAvatars(avatarMap);
        }
      } catch (error) {
        console.error('사용자 아바타 조회 실패:', error);
      }
    };
    fetchUserAvatars();
  }, []);

  // GROUP029 (교육분류) 서브코드 목록 추출
  const educationCategories = React.useMemo(() => {
    const group029Codes = subCodes.filter(code => code.group_code === 'GROUP029' && code.subcode_name);
    return group029Codes.map(code => code.subcode_name);
  }, [subCodes]);

  // GROUP008 (교육방식) 서브코드 목록 추출
  const educationMethods = React.useMemo(() => {
    const group008Codes = subCodes.filter(code => code.group_code === 'GROUP008' && code.subcode_name);
    return group008Codes.map(code => code.subcode_name);
  }, [subCodes]);

  // GROUP002 (상태) 서브코드 목록 추출
  const statusOptions = React.useMemo(() => {
    const group002Codes = subCodes.filter(code => code.group_code === 'GROUP002' && code.subcode_name);
    return group002Codes.map(code => code.subcode_name);
  }, [subCodes]);

  // Supabase 데이터를 프론트엔드 형식으로 변환
  const educationData = React.useMemo(() => {
    return supabaseEducations.map((edu, index) => ({
      id: String(edu.id || index),
      no: edu.id, // DB의 id를 NO로 사용 (비용관리/VOC관리와 동일 패턴)
      registrationDate: edu.registration_date,
      code: edu.code,
      category: edu.education_category || '기술교육',
      content: edu.title || '',
      description: edu.description || '',
      type: edu.education_type || '온라인',
      assignee: edu.assignee_name || '',
      team: edu.team || '개발팀',
      status: edu.status || '예정',
      startDate: edu.start_date || '',
      endDate: edu.completion_date || '',
      selected: false
    }));
  }, [supabaseEducations]);

  // 기존 로컬 상태 (백업용)
  const [localEducationData, setLocalEducationData] = useState([
    {
      id: 1,
      no: 5,
      registrationDate: '2025-01-10',
      code: 'MAIN-EDU-25-001',
      category: '기술교육',
      content: 'React 고급 과정',
      type: '온라인',
      assignee: '김민수',
      team: '개발팀',
      status: '완료',
      startDate: '2025-01-15',
      endDate: '2025-02-15',
      selected: false
    },
    {
      id: 2,
      no: 4,
      registrationDate: '2025-01-18',
      code: 'MAIN-EDU-25-002',
      category: '역량교육',
      content: '의사소통 스킬 향상',
      type: '오프라인',
      assignee: '이영희',
      team: '디자인팀',
      status: '진행',
      startDate: '2025-02-01',
      endDate: '2025-02-20',
      selected: false
    },
    {
      id: 3,
      no: 3,
      registrationDate: '2025-02-05',
      code: 'MAIN-EDU-25-003',
      category: '리더십',
      content: '팀 관리와 리더십',
      type: '혼합',
      assignee: '박지훈',
      team: '기획팀',
      status: '대기',
      startDate: '2025-03-01',
      endDate: '2025-03-15',
      selected: false
    },
    {
      id: 4,
      no: 2,
      registrationDate: '2025-02-12',
      code: 'MAIN-EDU-25-004',
      category: '외국어',
      content: '비즈니스 영어',
      type: '온라인',
      assignee: '최수진',
      team: '마케팅팀',
      status: '진행',
      startDate: '2025-02-15',
      endDate: '2025-04-15',
      selected: false
    },
    {
      id: 5,
      no: 1,
      registrationDate: '2025-02-20',
      code: 'MAIN-EDU-25-005',
      category: '기술교육',
      content: 'AI/ML 기초',
      type: '온라인',
      assignee: '정우진',
      team: '개발팀',
      status: '홀딩',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      selected: false
    }
  ]);

  // 담당자 아바타 매핑 (업무관리와 동일한 실제 아바타)
  const assigneeAvatars = {
    김민수: '/assets/images/users/avatar-1.png',
    이영희: '/assets/images/users/avatar-2.png',
    박지훈: '/assets/images/users/avatar-3.png',
    최수진: '/assets/images/users/avatar-4.png',
    정우진: '/assets/images/users/avatar-5.png',
    한나라: '/assets/images/users/avatar-6.png',
    신동욱: '/assets/images/users/avatar-7.png',
    오세영: '/assets/images/users/avatar-8.png',
    김철수: '/assets/images/users/avatar-1.png',
    박민수: '/assets/images/users/avatar-3.png',
    최지연: '/assets/images/users/avatar-4.png'
  };

  // 상태 색상 (파스텔톤 배경, 검정 계열 글자)
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '홀딩':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  // 전체 선택 핸들러 (현재 페이지만)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(paginatedData.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 개별 선택 핸들러
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Dialog 핸들러들
  const handleAddEducation = () => {
    setSelectedEducation(null);
    setEditDialog(true);
  };

  const handleEditEducation = (education: any) => {
    setSelectedEducation(education);
    setEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setEditDialog(false);
    setSelectedEducation(null);
  };

  // 월간일정 카드 클릭 핸들러
  const handleMonthlyCardClick = (education: any) => {
    setSelectedEducation(education);
    setEditDialog(true);
  };

  const handleSaveEducation = async (education: any) => {
    if (selectedEducation) {
      // 기존 교육 수정
      const originalEducation = educationData.find((item) => item.id === education.id);

      const success = await updateEducation(education.id, {
        start_date: education.startDate,
        completion_date: education.endDate,
        education_category: education.category,
        title: education.content,
        description: education.description || '',
        education_type: education.type,
        team: education.team,
        assignee_name: education.assignee,
        status: education.status
      });

      if (!success) {
        console.error('❌ 교육 데이터 수정 실패');
        return;
      }

      // 변경로그 추가 - 변경된 필드 확인
      if (originalEducation) {
        const changes: string[] = [];
        const educationCode = education.code;

        if (originalEducation.content !== education.content) {
          changes.push(`교육내용: "${originalEducation.content}" → "${education.content}"`);
        }
        if (originalEducation.status !== education.status) {
          changes.push(`상태: "${originalEducation.status}" → "${education.status}"`);
        }
        if (originalEducation.assignee !== education.assignee) {
          changes.push(`담당자: "${originalEducation.assignee || '미할당'}" → "${education.assignee || '미할당'}"`);
        }
        if (originalEducation.category !== education.category) {
          changes.push(`카테고리: "${originalEducation.category}" → "${education.category}"`);
        }
        if (originalEducation.endDate !== education.endDate) {
          changes.push(`완료일: "${originalEducation.endDate || '미정'}" → "${education.endDate || '미정'}"`);
        }

        if (changes.length > 0) {
          addChangeLog(
            '교육수정',
            educationCode,
            `${education.content} - ${changes.join(', ')}`,
            education.team || '미분류',
            '현재 사용자'
          );
        }
      }
    } else {
      // 새 교육 추가
      const year = new Date().getFullYear().toString().slice(-2);

      // 코드 생성 로직
      const existingCodes = supabaseEducations
        .filter((item) => item.code.startsWith(`MAIN-EDU-${year}-`))
        .map((item) => {
          const parts = item.code.split('-');
          return parseInt(parts[3]) || 0;
        });

      let maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
      let newEducationCode = `MAIN-EDU-${year}-${(maxNumber + 1).toString().padStart(3, '0')}`;

      // 코드 중복 체크
      while (await checkCodeExists(newEducationCode)) {
        maxNumber++;
        newEducationCode = `MAIN-EDU-${year}-${(maxNumber + 1).toString().padStart(3, '0')}`;
      }

      const result = await addEducation({
        code: newEducationCode,
        registration_date: education.registrationDate || new Date().toISOString().split('T')[0],
        start_date: education.startDate,
        completion_date: education.endDate,
        education_category: education.category,
        title: education.content,
        description: education.description || '',
        education_type: education.type,
        team: education.team,
        assignee_name: education.assignee,
        status: education.status || '예정'
      });

      if (!result) {
        console.error('❌ 교육 데이터 추가 실패');
        return;
      }

      setCurrentPage(1); // 새 데이터 추가 시 첫 페이지로 이동

      // 변경로그 추가
      addChangeLog(
        '교육등록',
        newEducationCode,
        `새로운 교육과정 "${education.content}"이 등록되었습니다.`,
        education.team || '미분류',
        '현재 사용자'
      );
    }
    handleEditDialogClose();
  };

  // 필터링 로직
  const filteredData = React.useMemo(() => {
    const filtered = educationData.filter((item) => {
      // 연도 필터 (메인 필터가 전체가 아니면 메인 필터 우선, 아니면 뷰 필터 사용)
      const useYear = selectedYear !== '전체' ? selectedYear : viewYear;
      const itemYear = new Date(item.registrationDate).getFullYear().toString();
      if (useYear !== itemYear) return false;

      // 팀 필터
      if (selectedTeam !== '전체' && item.team !== selectedTeam) return false;

      // 담당자 필터
      if (selectedAssignee !== '전체' && item.assignee !== selectedAssignee) return false;

      // 상태 필터
      if (selectedStatus !== '전체' && item.status !== selectedStatus) return false;

      return true;
    });

    // NO 기준 역순 정렬 (신규행이 헤더 바로 아래 나오도록)
    return filtered.sort((a, b) => (b.no || 0) - (a.no || 0));
  }, [educationData, selectedYear, viewYear, selectedTeam, selectedAssignee, selectedStatus]);

  // 페이지네이션 로직 (필터링된 데이터 기준)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Row per page 변경 핸들러
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setItemsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  // Go to page 핸들러
  const handleGoToPageChange = (value: string) => {
    setGoToPage(value);
  };

  const handleGoToPageSubmit = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setGoToPage('');
    }
  };

  // 페이지 변경시 선택 상태 초기화
  useEffect(() => {
    setSelectedItems([]);
  }, [currentPage]);

  // 필터 변경시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, viewYear, selectedTeam, selectedAssignee, selectedStatus]);

  // 변경로그 상태 관리
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
      // record_id로 해당 교육 찾기
      const education = educationData.find(edu => edu.code === log.record_id);

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
        title: log.title || education?.content || log.record_id,
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
  }, [dbChangeLogs, educationData]);

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
        const logData = {
          page: 'main_education',
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

        console.log('📝 변경로그 저장 시도:', logData);

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
    [currentUser, userName, fetchChangeLogs]
  );

  // 탭 변경 핸들러
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // 데이터 새로고침 핸들러
  const handleRefreshData = React.useCallback(async () => {
    console.log('🔄 데이터 강제 새로고침');
    // supabaseEducations는 자동으로 업데이트됨
  }, []);

  // Excel 다운로드 함수
  const handleExcelDownload = () => {
    const excelData = filteredData.map((education) => ({
      NO: education.no,
      등록일: education.registrationDate,
      코드: education.code,
      교육분류: education.category,
      교육내용: education.content,
      교육유형: education.type,
      담당자: education.assignee,
      팀: education.team,
      상태: education.status,
      시작일: education.startDate,
      종료일: education.endDate
    }));

    // CSV 헤더 생성
    const headers = Object.keys(excelData[0] || {}).join(',');

    // CSV 데이터 생성
    const csvContent = [
      headers,
      ...excelData.map((row) =>
        Object.values(row)
          .map((value) => {
            // 값에 쉼표나 개행문자가 있으면 따옴표로 감싸기
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      )
    ].join('\n');

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 다운로드
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `개인교육관리_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                개인교육관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                메인메뉴 &gt; 개인교육관리
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
              aria-label="개인교육관리 탭"
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
                      <MenuItem key={String(dept.id)} value={dept.department_name}>
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
                      <MenuItem key={String(user.id)} value={user.user_name}>
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
                    <MenuItem key={String(statusItem.id)} value={statusItem.subcode_name}>
                      {statusItem.subcode_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* 탭 컨텐츠 */}
          <Box sx={{ flex: 1, overflow: 'hidden', mt: 1 }}>
            {/* 데이터 탭 */}
            <TabPanel value={value} index={0}>
              <Box
                sx={{
                  p: 0.5,
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <EducationDataTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={educationData}
                  setTasks={() => {}}
                  addChangeLog={addChangeLog}
                  onDataRefresh={async () => {}}
                />
              </Box>
            </TabPanel>

            {/* 칸반 탭 */}

            {/* 칸반 탭 */}
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
                <EducationKanbanView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  educations={educationData}
                  onUpdateEducation={updateEducation}
                  addChangeLog={addChangeLog}
                  assignees={users.filter((user) => user.status === 'active').map((user) => user.user_name)}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  users={users}
                  assigneeAvatars={assigneeAvatars}
                  educationCategories={educationCategories}
                  educationMethods={educationMethods}
                  statusOptions={statusOptions}
                  departments={departments}
                />
              </Box>
            </TabPanel>

            {/* 월간일정 탭 */}
            <TabPanel value={value} index={2}>
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
                <EducationMonthlyScheduleView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  educations={educationData}
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
                <EducationDashboardView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  educations={educationData}
                />
              </Box>
            </TabPanel>

            {/* 변경로그 탭 */}
            <TabPanel value={value} index={4}>
              <Box
                sx={{
                  p: 0.5,
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
                <EducationChangeLogView
                  changeLogs={changeLogs}
                  educations={educationData}
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

      {/* 교육 편집 Dialog */}
      {editDialog && (
        <EducationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          education={selectedEducation}
          onSave={handleSaveEducation}
          assignees={users}
          assigneeAvatars={userAvatars}
          educationCategories={educationCategories}
          educationMethods={educationMethods}
          statusOptions={statusOptions}
          departments={departments}
          educations={educationData}
        />
      )}
    </Box>
  );
}
