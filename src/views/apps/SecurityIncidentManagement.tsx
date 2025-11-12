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
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import SecurityIncidentTable from 'views/apps/SecurityIncidentTable';
import SecurityIncidentEditDialog from 'components/SecurityIncidentEditDialog';
import { SecurityIncidentRecord } from 'types/security-incident';
import { useSupabaseSecurityAccident } from 'hooks/useSupabaseSecurityAccident';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useMenuPermission } from '../../hooks/usePermissions';

// 임시 데이터 매핑
const teams = ['보안팀', 'IT팀', '운영팀', '관리팀'];
const assignees = ['김철수', '이영희', '박민수', '최지연', '정현우', '강민정', '윤성호', '송민정'];
const taskStatusOptions = ['대기', '진행', '완료', '홀딩'];
const taskStatusColors = {
  대기: 'warning',
  진행: 'info',
  완료: 'success',
  홀딩: 'error'
};
import { ThemeMode } from 'config';

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

// ==============================|| 보안사고관리 메인 페이지 ||============================== //

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
  tasks: SecurityIncidentRecord[];
  setTasks: React.Dispatch<React.SetStateAction<SecurityIncidentRecord[]>>;
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
  onCardClick?: (task: SecurityIncidentRecord) => void;
  assigneeList?: any[];
  users?: any[];
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  updateAccident?: (id: number, data: Partial<any>) => Promise<any>;
  activeTask?: SecurityIncidentRecord | null;
  onDragStart?: (event: any) => void;
  onDragEnd?: (event: any) => void;
  isDraggingState?: boolean;
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
  assigneeList,
  users = [],
  canEditOwn = true,
  canEditOthers = true,
  updateAccident,
  activeTask,
  onDragStart,
  onDragEnd,
  isDraggingState
}: KanbanViewProps) {
  const theme = useTheme();

  // 공용 데이터 가져오기
  const { masterCodes } = useCommonData();

  // 마스터코드에서 사고유형 옵션 가져오기 (GROUP009)
  const incidentTypesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP009' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수
  const getIncidentTypeName = React.useCallback((subcode: string) => {
    const found = incidentTypesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [incidentTypesMap]);

  // 상태 코드를 이름으로 변환하는 함수
  const getStatusName = React.useCallback((subcode: string) => {
    if (!subcode) return '대기';
    const statusItem = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP002' && code.subcode === subcode
    );
    return statusItem?.subcode_name || subcode;
  }, [masterCodes]);

  // 현재 로그인한 사용자 정보
  const { data: session } = useSession();
  const user = useUser();

  const currentUser = useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 함수 - createdBy 또는 assignee가 본인인 경우
  const isDataOwner = useCallback((incident: SecurityIncidentRecord) => {
    if (!currentUser) return false;
    return (
      incident.createdBy === currentUser.user_name ||
      incident.assignee === currentUser.user_name
    );
  }, [currentUser]);

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
      const taskYear = new Date(task.startDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터 - 서브코드를 서브코드명으로 변환해서 비교
    if (selectedStatus !== '전체' && getStatusName(task.status) !== selectedStatus) return false;

    return true;
  });

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

  // 팀별 색상 매핑 (데이터 테이블과 동일)
  const getTeamColor = (team: string) => {
    switch (team) {
      case '디자인팀':
        return { backgroundColor: '#F3E5F5', color: '#333333' };
      case '기획팀':
        return { backgroundColor: '#E0F2F1', color: '#333333' };
      case '마케팅팀':
        return { backgroundColor: '#E3F2FD', color: '#333333' };
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

  // 사고유형별 색상 (연한 회색 배경)
  const getIncidentTypeColor = (incidentType: string) => {
    return '#F5F5F5'; // 연한 회색 배경
  };

  // 사고유형별 글자색 (회색)
  const getIncidentTypeTextColor = (incidentType: string) => {
    return '#757575'; // 회색 글자
  };

  // 사고유형별 아이콘 (텍스트 기반)
  const getIncidentTypeIcon = (incidentType: string) => {
    const iconMap: Record<string, string> = {
      악성코드: '🛡',
      랜섬웨어: '🔒',
      정보유출: '📋',
      계정탈취: '👤',
      디도스: '🌐',
      DB손상: '💾'
    };
    return iconMap[incidentType] || '⚠';
  };

  // 드래그 가능한 카드 컴포넌트
  function DraggableCard({ task }: { task: SecurityIncidentRecord }) {
    // 드래그 가능 여부: canEditOthers가 있거나, canEditOwn이 있고 자신의 데이터인 경우
    const isDragDisabled = !(canEditOthers || (canEditOwn && isDataOwner(task)));
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id,
      disabled: isDragDisabled
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : (isDragDisabled ? 'default' : 'grab')
        }
      : { cursor: isDragDisabled ? 'default' : 'grab' };

    // 사용자 프로필 이미지 가져오기 (최적화: find 한 번만 호출)
    const assigneeUser = React.useMemo(() => {
      return assigneeList?.find((user) => user.user_name === task.assignee);
    }, [task.assignee]);

    const assigneeAvatar = assigneeUser?.profile_image_url || assigneeUser?.avatar_url || '/assets/images/users/avatar-1.png';

    return (
      <article
        ref={setNodeRef}
        style={style}
        {...(isDragDisabled ? {} : listeners)}
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

            if (onCardClick) {
              onCardClick(task);
            }
          }
        }}
      >
        {/* 상태 및 사고유형 태그 */}
        <div className="status-tags">
          <span className={`status-tag status-${task.status?.toLowerCase() || 'waiting'}`}>{task.status || '대기'}</span>
          <span className="incident-type-tag">{getIncidentTypeName(task.incidentType || '')}</span>
        </div>

        {/* 카드 제목 */}
        <h3 className="card-title">{task.mainContent || 'Wireframing'}</h3>

        {/* 카드 정보 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{task.code || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">시작일:</span>
            <span className="info-value">{task.startDate || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">완료일:</span>
            <span className="info-value">{task.completedDate || '-'}</span>
          </div>
        </div>

        {/* 하단 - 담당자와 통계 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={assigneeAvatar}
              alt={task.assignee || '김철수'}
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지로 대체
                e.currentTarget.src = '/assets/images/users/avatar-1.png';
              }}
            />
            <span className="assignee-name">{task.assignee || '김철수'}</span>
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
        
        .incident-type-tag {
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
    </Box>
  );
}

// 월간일정 뷰 컴포넌트
interface MonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  tasks: SecurityIncidentRecord[];
  onCardClick: (task: SecurityIncidentRecord) => void;
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
  const { masterCodes } = useCommonData();

  // 상태 코드를 이름으로 변환하는 함수
  const getStatusName = React.useCallback((subcode: string) => {
    if (!subcode) return '대기';
    const statusItem = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP002' && code.subcode === subcode
    );
    return statusItem?.subcode_name || subcode;
  }, [masterCodes]);

  // 데이터 필터링
  const filteredData = tasks.filter((task) => {
    // 연도 필터 (메인 필터가 전체가 아니면 메인 필터 우선, 아니면 뷰 필터 사용)
    const useYear = selectedYear !== '전체' ? selectedYear : viewYear;
    const taskYear = new Date(task.startDate).getFullYear().toString();
    if (taskYear !== useYear) return false;

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터 - 서브코드를 서브코드명으로 변환해서 비교
    if (selectedStatus !== '전체' && getStatusName(task.status) !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: SecurityIncidentRecord[] } = {};
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
              key={`month-header-first-${index}`}
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
                key={`month-content-first-${monthIndex}`}
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
                {items.map((item, itemIndex) => {
                  const date = new Date(item.startDate);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');

                  return (
                    <Box
                      key={`month-${monthIndex}-item-${item.id}`}
                      onClick={() => onCardClick(item)}
                      sx={{
                        mb: itemIndex < items.length - 1 ? 0.8 : 0,
                        p: 0.6,
                        borderRadius: 1,
                        backgroundColor: getStatusColor(getStatusName(item.status)),
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
                          color: getStatusTextColor(getStatusName(item.status)),
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <span>{`${month}-${day}`}</span>
                        <span>{getStatusName(item.status)}</span>
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
                        title={item.mainContent || '사고내용 없음'}
                      >
                        {item.mainContent || '사고내용 없음'}
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
              key={`month-header-second-${index}`}
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
                key={`month-content-second-${index}`}
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
                {items.map((item, itemIndex) => {
                  const date = new Date(item.startDate);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');

                  return (
                    <Box
                      key={`month-second-${index}-item-${item.id}`}
                      onClick={() => onCardClick(item)}
                      sx={{
                        mb: itemIndex < items.length - 1 ? 0.8 : 0,
                        p: 0.6,
                        borderRadius: 1,
                        backgroundColor: getStatusColor(getStatusName(item.status)),
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
                          color: getStatusTextColor(getStatusName(item.status)),
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <span>{`${month}-${day}`}</span>
                        <span>{getStatusName(item.status)}</span>
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
                        title={item.mainContent || '사고내용 없음'}
                      >
                        {item.mainContent || '사고내용 없음'}
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

// ChangeLogView 컴포넌트 제거 (보안교육관리 스타일로 대체)

// 대시보드 뷰 컴포넌트
interface DashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
  tasks: SecurityIncidentRecord[];
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

  // 공용 데이터 가져오기
  const { masterCodes } = useCommonData();

  // 마스터코드에서 사고유형 옵션 가져오기 (GROUP009)
  const incidentTypesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP009' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수
  const getIncidentTypeName = React.useCallback((subcode: string) => {
    const found = incidentTypesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [incidentTypesMap]);

  // 상태 코드를 이름으로 변환하는 함수
  const getStatusName = React.useCallback((subcode: string) => {
    if (!subcode) return '대기';
    const statusItem = masterCodes.find(
      (code) => code.codetype === 'subcode' && code.group_code === 'GROUP002' && code.subcode === subcode
    );
    return statusItem?.subcode_name || subcode;
  }, [masterCodes]);

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: SecurityIncidentRecord[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((task) => {
      const taskDate = new Date(task.startDate);

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
  const filteredData = filterByDateRange(tasks)
    .filter((task) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const taskYear = new Date(task.startDate).getFullYear().toString();
        if (taskYear !== selectedYear) return false;
      }

      if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;
      if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;
      // 상태 필터 - 서브코드를 서브코드명으로 변환해서 비교
      if (selectedStatus !== '전체' && getStatusName(task.status) !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => (b.no || 0) - (a.no || 0)); // No 기준 역순 정렬

  // 통계 계산
  const totalCount = filteredData.length;
  const statusStats = filteredData.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 사고유형별 통계 (원형차트용) - incidentType 필드 사용
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const subcode = item.incidentType || '기타';
      const category = getIncidentTypeName(subcode);
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
  const monthlyStats: { month: string; 대기: number; 진행: number; 완료: number; 홀딩: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const date = new Date(item.startDate);
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

  // 라벨과 값 배열 미리 생성
  const categoryLabels = Object.keys(categoryStats);
  const categoryValues = Object.values(categoryStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 사고유형 데이터 확인:', {
    filteredData: filteredData.length,
    categoryStats,
    categoryLabels,
    categoryValues,
    sampleData: filteredData.slice(0, 3).map((item) => ({
      incidentType: item.incidentType,
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
        text: '업무 건수'
      }
    },
    colors: ['#90A4AE', '#7986CB', '#81C784', '#E57373'],
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
          업무 현황 대시보드
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
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            sx={{ whiteSpace: 'nowrap' }}
          >
            초기화
          </Button>
        </Box>
      </Box>

      {/* 상태 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* 총건수 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#26C6DA',
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
              전체 업무 현황
            </Typography>
          </Card>
        </Grid>

        {/* 대기 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#90A4AE',
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
              대기중인 업무
            </Typography>
          </Card>
        </Grid>

        {/* 진행 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#7986CB',
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
              진행중인 업무
            </Typography>
          </Card>
        </Grid>

        {/* 완료 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#81C784',
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
              완료된 업무
            </Typography>
          </Card>
        </Grid>

        {/* 홀딩 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#E57373',
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
              보류중인 업무
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 사고유형 - 업무목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 사고유형 원형차트 */}
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
              사고유형
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

        {/* 업무 목록 */}
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
              업무 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>업무내용</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>완료일</TableCell>
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
                          {task.mainContent || '사고내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.completedDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={getStatusName(task.status)}
                            size="small"
                            sx={{
                              bgcolor: (() => {
                                const statusName = getStatusName(task.status);
                                switch (statusName) {
                                  case '대기':
                                    return '#90A4AE';
                                  case '진행':
                                    return '#7986CB';
                                  case '완료':
                                    return '#81C784';
                                  case '홀딩':
                                    return '#E57373';
                                  default:
                                    return '#9e9e9e';
                                }
                              })(),
                              color: '#fff',
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
              업무담당
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

        {/* 월별 업무현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 업무현황
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

export default function SecurityIncidentManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers } = useMenuPermission('/security/incident');

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 드래그 상태
  const [activeTask, setActiveTask] = useState<SecurityIncidentRecord | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // Supabase 연동 (병렬 호출 최적화)
  const { items, error, fetchAccidents, updateAccident, deleteAccident } = useSupabaseSecurityAccident();
  const { users, departments, masterCodes } = useCommonData(); // 🏪 공용 창고에서 가져오기

  // 마스터코드에서 상태 옵션 가져오기 (GROUP002의 서브코드만 필터링)
  const statusTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 사고유형 옵션 가져오기 (GROUP009의 서브코드만 필터링)
  const incidentTypesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP009' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 헬퍼 함수
  const getIncidentTypeName = React.useCallback((subcode: string) => {
    const found = incidentTypesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [incidentTypesMap]);

  const getStatusName = React.useCallback((subcode: string) => {
    const found = statusTypes.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [statusTypes]);

  // 마스터코드에서 대응단계 옵션 가져오기 (GROUP010의 서브코드만 필터링)
  const responseStagesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP010' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  const getResponseStageName = React.useCallback((subcode: string) => {
    const found = responseStagesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [responseStagesMap]);

  // 마스터코드에서 발견방법 옵션 가져오기 (GROUP011)
  const discoveryMethodsMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP011' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  const getDiscoveryMethodName = React.useCallback((subcode: string) => {
    const found = discoveryMethodsMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [discoveryMethodsMap]);

  // 마스터코드에서 보고방식 옵션 가져오기 (GROUP014)
  const reportMethodsMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP014' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  const getReportMethodName = React.useCallback((subcode: string) => {
    const found = reportMethodsMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [reportMethodsMap]);

  // 마스터코드에서 서비스/비즈니스영향도 옵션 가져오기 (GROUP012)
  const serviceImpactsMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP012' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  const getServiceImpactName = React.useCallback((subcode: string) => {
    const found = serviceImpactsMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [serviceImpactsMap]);

  // 마스터코드에서 대응방식 옵션 가져오기 (GROUP013)
  const responseMethodsMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP013' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  const getResponseMethodName = React.useCallback((subcode: string) => {
    const found = responseMethodsMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [responseMethodsMap]);

  // 사용자 프로필 이미지 매핑 (동적 생성)
  const assigneeAvatars = React.useMemo(() => {
    const avatarMap: Record<string, string> = {};
    users.forEach((user) => {
      avatarMap[user.user_name] = user.profile_image_url || user.avatar_url || '/assets/images/users/default-avatar.png';
    });
    return avatarMap;
  }, [users]);

  // 공유 Tasks 상태 (Supabase 데이터로 변환)
  const [tasks, setTasks] = useState<SecurityIncidentRecord[]>([]);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SecurityIncidentRecord | null>(null);
  const [originalTask, setOriginalTask] = useState<SecurityIncidentRecord | null>(null); // 원본 데이터 저장 (변경 감지용)

  // Supabase 데이터를 SecurityIncidentRecord 형식으로 변환 (보안교육관리와 동일한 패턴)
  useEffect(() => {
    console.log('🔄 데이터 변환 시작, items:', items.length, '건');

    const convertedTasks: SecurityIncidentRecord[] = items.map((item) => ({
      id: item.id,
      no: item.no || 0,
      registrationDate: item.registration_date,
      code: item.code,
      incidentType: item.incident_type as '악성코드' | '랜섬웨어' | '정보유출' | '계정탈취' | '디도스' | 'DB손상',
      requestContent: item.request_content || '',
      mainContent: item.main_content,
      responseAction: item.response_action || '',
      description: item.description || '',
      severity: item.severity as '높음' | '중간' | '낮음',
      status: item.status as '대기' | '진행' | '완료' | '홀딩',
      responseStage: item.response_stage as '사고 탐지' | '현황 분석' | '개선 조치 중' | '즉시 해결' | '근본개선' | undefined,
      assignee: item.assignee || '',
      createdBy: item.created_by, // DB의 created_by 필드 매핑
      team: item.team || '',
      discoverer: item.discoverer || '',
      impactScope: item.impact_scope || '',
      causeAnalysis: item.cause_analysis || '',
      preventionPlan: item.prevention_plan || '',
      occurrenceDate: item.occurrence_date || '',
      completedDate: item.completed_date || '',
      startDate: item.start_date || '',
      progress: item.progress || 0,
      attachment: item.attachment || false,
      attachmentCount: item.attachment_count || 0,
      attachments: item.attachments || [],
      likes: item.likes || 0,
      likedBy: item.liked_by || [],
      views: item.views || 0,
      viewedBy: item.viewed_by || [],
      comments: item.comments || []
    }));

    console.log('✅ 변환 완료, tasks:', convertedTasks.length, '건');
    setTasks(convertedTasks);
  }, [items]);

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

  // 변경로그 Hook (전체 보안사고의 변경 이력)
  const { logs: dbChangeLogs, loading: changeLogsLoading, fetchChangeLogs } = useSupabaseChangeLog('security_incident');

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
      // record_id로 해당 보안사고 찾기 (record_id는 코드로 저장되어 있음)
      const incident = tasks.find((t) => t.code === log.record_id);

      const date = new Date(log.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}.${month}.${day} ${hour}:${minute}`;

      // 서브코드를 서브코드명으로 변환하는 함수
      const getSubcodeName = (value: string | null | undefined): string => {
        if (!value) return '-';

        // GROUP 또는 하이픈이 포함된 경우 서브코드로 판단
        if (value.includes('GROUP') || value.includes('-')) {
          // MasterCodeFlat는 flat 배열 구조이므로 codetype으로 필터링
          const allSubcodes = masterCodes?.filter(item => item.codetype === 'subcode') || [];

          // 해당 서브코드 찾기
          const subcode = allSubcodes.find(sub => sub.subcode === value);

          if (subcode) {
            return subcode.subcode_name;
          } else {
            return value; // 찾지 못하면 원본 반환
          }
        }

        return value; // 일반 텍스트는 그대로 반환
      };

      return {
        id: log.id,
        dateTime: formattedDateTime,
        code: log.record_id, // record_id가 이미 코드임
        target: log.title || incident?.mainContent || log.record_id, // title 우선 사용
        location: log.change_location || '-', // 변경위치
        action: log.action_type,
        changedField: log.changed_field || '-', // 변경필드
        description: log.description,
        beforeValue: getSubcodeName(log.before_value),
        afterValue: getSubcodeName(log.after_value),
        team: log.team || log.user_department || '-',
        user: log.user_name
      };
    });
  }, [dbChangeLogs, tasks, masterCodes]);

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
  const addChangeLog = React.useCallback(
    async (
      action: string,
      target: string,
      description: string,
      team: string = '시스템',
      beforeValue?: string,
      afterValue?: string,
      changedField?: string,
      title?: string,
      location?: string
    ) => {
      try {
        const userName = currentUser?.user_name || currentUser?.name || user?.name || '시스템';

        const logData = {
          page: 'security_incident',
          record_id: target, // 코드를 record_id로 사용
          action_type: action,
          title: title || null, // 제목 필드 추가
          description: description,
          before_value: beforeValue || null,
          after_value: afterValue || null,
          changed_field: changedField || null,
          change_location: location || '개요탭',
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
  const handleCardClick = (task: SecurityIncidentRecord) => {
    setEditingTask(task);
    setOriginalTask(JSON.parse(JSON.stringify(task))); // Deep copy - 원본 데이터 저장
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
    setOriginalTask(null);
  };

  // Task 저장 핸들러
  const handleEditTaskSave = (updatedTask: SecurityIncidentRecord) => {
    console.log('🎯 handleEditTaskSave 호출:', updatedTask);
    console.log('🔍 originalTask:', originalTask);

    // tasks 배열에서 해당 ID가 있는지 확인하여 추가/수정 구분
    const existingTask = tasks.find((t) => t.id === updatedTask.id);
    const isNewTask = !existingTask;

    console.log('🔍 existingTask:', existingTask);
    console.log('🔍 isNewTask:', isNewTask);

    if (!isNewTask) {
      // 기존 데이터 수정
      console.log('✅ 보안사고 데이터 수정');

      // UI 업데이트
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? { ...updatedTask } : task)));

      // 변경된 필드 찾기 - 원본 데이터와 비교 (state에 저장된 originalTask 사용)
      const changedFields: string[] = [];
      const fieldMap: { [key: string]: string } = {
        mainContent: '사고내용',
        incidentType: '사고유형',
        status: '상태',
        assignee: '담당자',
        discoveryDate: '발견일',
        completedDate: '완료일',
        responseStage: '대응단계',
        team: '팀'
      };

      if (originalTask) {
        Object.keys(fieldMap).forEach((key) => {
          const oldValue = (originalTask as any)[key];
          const newValue = (updatedTask as any)[key];
          if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
            changedFields.push(fieldMap[key]);
          }
        });
      }

      // 성공 알림 with Korean particle detection
      let message = '';
      if (changedFields.length > 0) {
        const fieldsText = changedFields.join(', ');
        // 마지막 필드명의 받침 유무에 따라 조사 결정
        const lastField = changedFields[changedFields.length - 1];
        const lastChar = lastField.charAt(lastField.length - 1);
        const code = lastChar.charCodeAt(0);
        const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
        const josa = hasJongseong ? '이' : '가';
        message = `${updatedTask.mainContent}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
      } else {
        // 필드 변경이 없는 경우
        const lastChar = updatedTask.mainContent.charAt(updatedTask.mainContent.length - 1);
        const code = lastChar.charCodeAt(0);
        const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
        const josa = hasJongseong ? '이' : '가';
        message = `${updatedTask.mainContent}${josa} 성공적으로 수정되었습니다.`;
      }

      console.log('📢 토스트 알림 설정:', message);
      setSnackbar({
        open: true,
        message: message,
        severity: 'success'
      });
      console.log('📢 snackbar state 업데이트 완료:', { open: true, message, severity: 'success' });

      // 변경로그 추가
      const changes = [];
      if (originalTask?.status !== updatedTask.status) {
        changes.push(`상태: ${originalTask?.status} → ${updatedTask.status}`);
      }
      if (originalTask?.assignee !== updatedTask.assignee) {
        changes.push(`담당자: ${originalTask?.assignee} → ${updatedTask.assignee}`);
      }
      if (originalTask?.completedDate !== updatedTask.completedDate) {
        changes.push(`완료일: ${originalTask?.completedDate} → ${updatedTask.completedDate}`);
      }

      if (changes.length > 0) {
        addChangeLog(
          '업무 수정',
          updatedTask.code,
          changes.join(', '),
          updatedTask.team,
          undefined,
          undefined,
          undefined,
          updatedTask.mainContent
        );
      }
    } else {
      // 새 데이터 추가
      console.log('✅ 새 보안사고 데이터 추가');

      // UI 업데이트
      setTasks((prevTasks) => [...prevTasks, updatedTask]);

      // 성공 알림 with Korean particle detection
      const lastChar = updatedTask.mainContent.charAt(updatedTask.mainContent.length - 1);
      const code = lastChar.charCodeAt(0);
      const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
      const josa = hasJongseong ? '이' : '가';

      const addMessage = `${updatedTask.mainContent}${josa} 성공적으로 추가되었습니다.`;
      console.log('📢 토스트 알림 설정 (추가):', addMessage);
      setSnackbar({
        open: true,
        message: addMessage,
        severity: 'success'
      });
      console.log('📢 snackbar state 업데이트 완료 (추가):', { open: true, message: addMessage, severity: 'success' });

      // 변경로그 추가
      addChangeLog(
        '사고 생성',
        updatedTask.code,
        `새로운 보안사고가 생성되었습니다: ${updatedTask.mainContent}`,
        updatedTask.team,
        undefined,
        undefined,
        undefined,
        updatedTask.mainContent
      );
    }

    handleEditDialogClose();
  };

  // Incident 삭제 핸들러
  const handleDeleteIncidents = async (ids: number[]) => {
    console.log('🗑️ handleDeleteIncidents 시작:', ids);

    // 삭제할 사고 데이터 정보 미리 저장 (변경로그용)
    const deletedIncidents = tasks.filter((task) => ids.includes(task.id));

    let successCount = 0;
    let failCount = 0;

    try {
      // 각 사고를 개별적으로 삭제 (useSupabaseSecurityAccident의 deleteAccident 사용)
      for (const id of ids) {
        try {
          const result = await deleteAccident(id);

          if (result) {
            console.log(`✅ 사고 ID ${id} 삭제 성공`);
            successCount++;
          } else {
            console.error(`🔴 사고 ID ${id} 삭제 실패`);
            failCount++;
          }
        } catch (err) {
          console.error(`🔴 사고 ID ${id} 삭제 중 오류:`, err);
          failCount++;
        }
      }

      // 성공한 경우에만 로컬 상태 업데이트
      if (successCount > 0) {
        // UI 업데이트 - 삭제된 항목 제거
        setTasks((prevTasks) => prevTasks.filter((task) => !ids.includes(task.id)));

        // 변경로그 추가
        deletedIncidents.forEach((incident) => {
          addChangeLog(
            '삭제',
            incident.code || `INC-${incident.id}`,
            `${incident.mainContent} - 삭제됨`,
            incident.team,
            undefined,
            undefined,
            undefined,
            incident.mainContent
          );
        });
      }

      // 토스트 알림
      if (successCount === ids.length) {
        // 전체 성공
        if (successCount === 1 && deletedIncidents.length > 0) {
          // 단일 삭제 - Korean particle detection
          const incidentContent = deletedIncidents[0].mainContent;
          const lastChar = incidentContent.charAt(incidentContent.length - 1);
          const code = lastChar.charCodeAt(0);
          const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
          const josa = hasJongseong ? '이' : '가';

          setSnackbar({
            open: true,
            message: `${incidentContent}${josa} 성공적으로 삭제되었습니다.`,
            severity: 'error'
          });
        } else {
          // 다중 삭제
          setSnackbar({
            open: true,
            message: `${successCount}개 보안사고가 성공적으로 삭제되었습니다.`,
            severity: 'error'
          });
        }
        console.log('✅ 보안사고 데이터 삭제 완료');
      } else if (successCount > 0) {
        // 부분 실패
        setSnackbar({
          open: true,
          message: `삭제 완료: ${successCount}개, 실패: ${failCount}개`,
          severity: 'warning'
        });
        console.log(`⚠️ 보안사고 데이터 부분 삭제: 성공 ${successCount}, 실패 ${failCount}`);
      } else {
        // 전체 실패
        setSnackbar({
          open: true,
          message: '보안사고 삭제에 실패했습니다.',
          severity: 'error'
        });
        console.error('🔴 보안사고 데이터 삭제 전체 실패');
      }
    } catch (error) {
      console.error('🔴 보안사고 삭제 중 오류:', error);
      setSnackbar({
        open: true,
        message: '보안사고 삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTask = tasks.find((task) => task.id === active.id);
    setActiveTask(draggedTask || null);
    setIsDraggingState(true);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDraggingState(false);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id as TaskStatus;

    // 상태가 변경된 경우만 업데이트
    const currentTask = tasks.find((task) => task.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      const oldStatus = currentTask.status;

      // 로컬 상태 업데이트
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));

      // DB에 상태 변경 저장
      if (updateAccident && currentTask.id) {
        try {
          console.log('🔄 칸반 드래그: 상태 변경 DB 저장 시작', {
            taskId: currentTask.id,
            oldStatus,
            newStatus
          });

          await updateAccident(currentTask.id, {
            status: newStatus
          });

          console.log('✅ 칸반 드래그: 상태 변경 DB 저장 성공');
        } catch (error) {
          console.error('🔴 칸반 드래그: 상태 변경 DB 저장 실패:', error);
          // 실패 시 원래 상태로 되돌림
          setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: oldStatus } : task)));
          alert('상태 변경 저장에 실패했습니다.');
          return;
        }
      }

      // 변경로그 추가
      const taskCode = currentTask.code || `TASK-${taskId}`;
      const mainContent = currentTask.mainContent || '사고내용 없음';
      const description = `${mainContent} 상태를 "${oldStatus}"에서 "${newStatus}"로 변경`;

      addChangeLog('수정', taskCode, description, currentTask.team || '미분류', oldStatus, newStatus, '상태', mainContent, '칸반탭');

      // 토스트 알림
      setSnackbar({
        open: true,
        message: `상태가 "${oldStatus}"에서 "${newStatus}"로 변경되었습니다.`,
        severity: 'success'
      });
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
                보안사고관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                메인메뉴 &gt; 보안사고관리
              </Typography>
            </Box>
          </Box>

          {/* 권한 체크: KPI관리 패턴 (깜빡임 방지) */}
          {canViewCategory && !canReadData ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                py: 8
              }}
            >
              <Typography variant="h5" color="text.secondary">
                이 페이지에 대한 데이터 조회 권한이 없습니다.
              </Typography>
              <Typography variant="body2" color="text.disabled">
                관리자에게 권한을 요청하세요.
              </Typography>
            </Box>
          ) : (
            <>
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
              aria-label="보안사고관리 탭"
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
                  <MenuItem key="year-all" value="전체">
                    전체
                  </MenuItem>
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
                  <MenuItem key="team-all" value="전체">
                    전체
                  </MenuItem>
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
                  <MenuItem key="assignee-all" value="전체">
                    전체
                  </MenuItem>
                  {users
                    .filter((user) => user.is_active)
                    .map((user) => (
                      <MenuItem key={`assignee-${user.id}`} value={user.user_name}>
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
                  <MenuItem key="status-all" value="전체">
                    전체
                  </MenuItem>
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
                <SecurityIncidentTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                  onDelete={handleDeleteIncidents}
                  error={error}
                  onDataRefresh={fetchAccidents}
                  setSnackbar={setSnackbar}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
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
                  onCardClick={handleCardClick}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  users={users}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                  updateAccident={updateAccident}
                  activeTask={activeTask}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDraggingState={isDraggingState}
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
                        <TableCell sx={{ fontWeight: 600, width: 50, fontSize: '12px' }}>NO</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 150, fontSize: '12px' }}>변경시간</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 140, fontSize: '12px' }}>코드</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 180, fontSize: '12px' }}>제목</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경분류</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경위치</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경필드</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경전</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경후</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 400, fontSize: '12px' }}>변경세부내용</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>팀</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경자</TableCell>
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
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {changeLogs.length - (changeLogPage * changeLogRowsPerPage + index)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.dateTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.target}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.action}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.changedField || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '12px',
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
                                fontSize: '12px',
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
                                fontSize: '12px',
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
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {log.team}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
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
                        <MenuItem key="rows-5" value={5}>
                          5
                        </MenuItem>
                        <MenuItem key="rows-10" value={10}>
                          10
                        </MenuItem>
                        <MenuItem key="rows-25" value={25}>
                          25
                        </MenuItem>
                        <MenuItem key="rows-50" value={50}>
                          50
                        </MenuItem>
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
                      <Button
                        size="small"
                        onClick={handleChangeLogGoToPage}
                        sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.875rem' }}
                      >
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
            </TabPanel>
          </Box>
          </>
          )}
        </CardContent>
      </Card>

      {/* Task 편집 다이얼로그 */}
      {editDialog && editingTask && (
        <SecurityIncidentEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={taskStatusOptions}
          statusColors={{}}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}

      {/* 알림 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
