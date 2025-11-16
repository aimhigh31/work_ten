'use client';

import React, { useState, useEffect } from 'react';

// third-party
import ReactApexChart from 'react-apexcharts';
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
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Project imports
import KpiTable from 'views/apps/KpiTable';
import KpiEditDialog from 'components/KpiEditDialog';
import { taskStatusColors, assigneeAvatars } from 'data/kpi';
import { TaskTableData, TaskStatus } from 'types/kpi';
import { ThemeMode } from 'config';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import { useSupabaseKpi, KpiData } from 'hooks/useSupabaseKpi';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useMenuPermission } from 'hooks/usePermissions'; // 권한 관리
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';

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

// ==============================|| KPI관리 메인 페이지 ||============================== //

// 한국어 조사 처리 함수
const getJosa = (word: string, josaType: '이/가' | '을/를' | '은/는'): string => {
  if (!word) return josaType.split('/')[0]; // 빈 문자열일 경우 첫 번째 조사 반환

  const lastChar = word[word.length - 1];
  const code = lastChar.charCodeAt(0);

  // 한글인 경우
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const hasJongseong = (code - 0xAC00) % 28 > 0;

    if (josaType === '이/가') return hasJongseong ? '이' : '가';
    if (josaType === '을/를') return hasJongseong ? '을' : '를';
    if (josaType === '은/는') return hasJongseong ? '은' : '는';
  }

  // 영어나 숫자인 경우 (받침 없음으로 처리)
  return josaType.split('/')[1];
};

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
  tasks: TaskTableData[];
  setTasks: React.Dispatch<React.SetStateAction<TaskTableData[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string) => void;
  setSnackbar: React.Dispatch<React.SetStateAction<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>>;
  fetchKpis?: () => Promise<void>;
  assigneeList?: any[];
  assignees: string[];
  assigneeAvatars: any;
  taskStatusOptions: string[];
  taskStatusColors: any;
  teams: string[];
  // 🔐 권한 관리
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

function KanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  tasks,
  setTasks,
  addChangeLog,
  setSnackbar,
  fetchKpis,
  assigneeList,
  assignees,
  assigneeAvatars,
  taskStatusOptions,
  taskStatusColors,
  teams,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}: KanbanViewProps) {
  const theme = useTheme();

  // useSupabaseKpi 훅 사용
  const { updateKpi } = useSupabaseKpi();

  // CommonData에서 마스터코드 가져오기
  const { getSubCodesByGroup } = useCommonData();

  // GROUP002의 상태 목록 가져오기
  const statusOptions = getSubCodesByGroup('GROUP002');

  // 상태 코드를 이름으로 변환하는 함수
  const getStatusName = React.useCallback((status: string) => {
    if (!status) return '미분류';
    // "GROUP002-SUB001" 형태에서 서브코드명 찾기
    const statusOption = statusOptions.find(
      (option) => option.subcode === status || `${option.group_code}-${option.subcode}` === status
    );
    return statusOption?.subcode_name || status;
  }, [statusOptions]);

  // 현재 로그인한 사용자 정보
  const { data: session } = useSession();
  const { users } = useSupabaseUsers();

  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 함수
  const isDataOwner = React.useCallback((task: TaskTableData) => {
    if (!currentUser) return false;
    // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자
    return task.createdBy === currentUser.user_name ||
           task.assignee === currentUser.user_name;
  }, [currentUser]);

  // 상태 관리
  const [activeTask, setActiveTask] = useState<TaskTableData | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);

  // 센서 설정 (사양에 맞춰 8px 활성화 거리)
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

    // 상태 필터 (상태명으로 비교)
    if (selectedStatus !== '전체' && getStatusName(task.status) !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTask = tasks.find((task) => task.id === active.id);
    setActiveTask(draggedTask || null);
    setIsDraggingState(true);
  };

  // 카드 클릭 핸들러
  const handleCardClick = (task: TaskTableData) => {
    setEditingTask(task);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // Task 저장 핸들러
  const handleEditTaskSave = async (updatedTask: TaskTableData) => {
    const originalTask = tasks.find((t) => t.id === updatedTask.id);

    console.log('📝 칸반뷰 - Task 저장 중:', updatedTask);

    try {
      if (originalTask) {
        // DB 형식으로 변환
        const kpiData: Partial<KpiData> = {
          code: updatedTask.code,
          work_content: updatedTask.workContent,
          description: updatedTask.description,
          selection_background: (updatedTask as any).selectionBackground,
          impact: (updatedTask as any).impact,
          evaluation_criteria_s: (updatedTask as any).evaluationCriteria?.S,
          evaluation_criteria_a: (updatedTask as any).evaluationCriteria?.A,
          evaluation_criteria_b: (updatedTask as any).evaluationCriteria?.B,
          evaluation_criteria_c: (updatedTask as any).evaluationCriteria?.C,
          evaluation_criteria_d: (updatedTask as any).evaluationCriteria?.D,
          management_category: (updatedTask as any).managementCategory,
          target_kpi: (updatedTask as any).targetKpi,
          current_kpi: (updatedTask as any).currentKpi,
          department: updatedTask.department,
          progress: updatedTask.progress,
          status: updatedTask.status,
          start_date: (updatedTask as any).startDate,
          completed_date: updatedTask.completedDate,
          team: updatedTask.team,
          assignee: updatedTask.assignee
        };

        console.log('💾 칸반뷰 - DB 업데이트 데이터:', kpiData);

        // DB에 업데이트
        await updateKpi(updatedTask.id, kpiData);
        console.log('✅ 칸반뷰 - DB 업데이트 성공');

        // DB에서 최신 데이터 다시 가져오기
        if (fetchKpis) {
          await fetchKpis();
          console.log('✅ 칸반뷰 - 데이터 새로고침 완료');
        }

        // 변경로그 추가 - 변경된 필드 확인
        const changes: string[] = [];
        const changedFields: string[] = [];
        const taskCode = updatedTask.code || `TASK-${updatedTask.id}`;

        if (originalTask.status !== updatedTask.status) {
          changes.push(`상태: "${getStatusName(originalTask.status)}" → "${getStatusName(updatedTask.status)}"`);
          changedFields.push('상태');
        }
        if (originalTask.assignee !== updatedTask.assignee) {
          changes.push(`담당자: "${originalTask.assignee || '미할당'}" → "${updatedTask.assignee || '미할당'}"`);
          changedFields.push('담당자');
        }
        if (originalTask.workContent !== updatedTask.workContent) {
          changes.push(`업무내용 수정`);
          changedFields.push('업무내용');
        }
        if (originalTask.progress !== updatedTask.progress) {
          changes.push(`진행율: ${originalTask.progress || 0}% → ${updatedTask.progress || 0}%`);
          changedFields.push('진행률');
        }
        if (originalTask.completedDate !== updatedTask.completedDate) {
          changes.push(`완료일: "${originalTask.completedDate || '미정'}" → "${updatedTask.completedDate || '미정'}"`);
          changedFields.push('완료일');
        }

        if (changes.length > 0) {
          addChangeLog(
            '업무 정보 수정',
            taskCode,
            `${updatedTask.workContent || '업무'} - ${changes.join(', ')}`,
            updatedTask.team || '미분류'
          );
        }

        // 토스트 알림
        const workContent = updatedTask.workContent || 'KPI';

        if (changedFields.length > 0) {
          const firstField = changedFields[0];
          const josaField = getJosa(firstField, '이/가');

          if (changedFields.length === 1) {
            // 1개 필드만 수정된 경우
            setSnackbar({
              open: true,
              message: `${workContent}의 ${firstField}${josaField} 성공적으로 수정되었습니다.`,
              severity: 'success'
            });
          } else {
            // 여러 필드가 수정된 경우
            setSnackbar({
              open: true,
              message: `${workContent}의 ${changedFields.length}개 항목이 성공적으로 수정되었습니다.`,
              severity: 'success'
            });
          }
        } else {
          // 변경사항이 없는 경우도 성공 메시지 표시
          const josa = getJosa(workContent, '이/가');
          setSnackbar({
            open: true,
            message: `${workContent}${josa} 성공적으로 저장되었습니다.`,
            severity: 'success'
          });
        }
      }

      handleEditDialogClose();
    } catch (error) {
      console.error('❌ 칸반뷰 - Task 저장 실패:', error);
      setSnackbar({
        open: true,
        message: 'KPI 정보 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDraggingState(false);

    if (!over) return;

    const taskId = active.id;
    const newStatusName = over.id as TaskStatus; // '대기', '진행', '완료', '홀딩'

    // 상태가 변경된 경우만 업데이트
    const currentTask = tasks.find((task) => task.id === taskId);
    if (currentTask) {
      const currentStatusName = getStatusName(currentTask.status);

      // 상태명이 다른 경우만 업데이트
      if (currentStatusName !== newStatusName) {
        const oldStatus = currentTask.status;
        const oldStatusName = currentStatusName;

        console.log('📝 칸반뷰 - KPI 상태 업데이트 중:', {
          taskId,
          oldStatus,
          oldStatusName,
          newStatusName
        });

        // DB에 업데이트 (상태명 그대로 저장)
        try {
          await updateKpi(taskId as number, { status: newStatusName });
          console.log('✅ 칸반뷰 - DB 업데이트 성공');

          // DB에서 최신 데이터 다시 가져오기
          if (fetchKpis) {
            await fetchKpis();
            console.log('✅ 칸반뷰 - 드래그 후 데이터 새로고침 완료');
          }

          // 변경로그 추가
          const taskCode = currentTask.code || `TASK-${taskId}`;
          const workContent = currentTask.workContent || '업무내용 없음';
          const description = `KPI관리 ${workContent}(${taskCode}) 개요탭의 상태가 ${oldStatusName} → ${newStatusName}로 수정 되었습니다.`;

          addChangeLog('수정', taskCode, description, currentTask.team || '미분류', oldStatusName, newStatusName, '상태', workContent, '칸반탭');

          // 토스트 알림
          setSnackbar({
            open: true,
            message: `${workContent}의 상태가 ${oldStatusName} → ${newStatusName}로 변경되었습니다.`,
            severity: 'success'
          });
        } catch (error) {
          console.error('❌ 칸반뷰 - DB 업데이트 실패:', error);
          setSnackbar({
            open: true,
            message: '상태 변경에 실패했습니다.',
            severity: 'error'
          });
        }
      }
    }
  };

  // 상태별 컬럼 정의 (사양에 맞춰 수정)
  const statusColumns = [
    { key: '대기', title: '대기', pillBg: '#F0F0F0', pillColor: '#424242' },
    { key: '진행', title: '진행', pillBg: '#E3F2FD', pillColor: '#1976D2' },
    { key: '완료', title: '완료', pillBg: '#E8F5E8', pillColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillBg: '#FFEBEE', pillColor: '#D32F2F' }
  ];

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => getStatusName(item.status) === status);
  };

  // 팀별 색상 매핑 (데이터 테이블과 동일)
  const getTeamColor = (team: string) => {
    switch (team) {
      case 'IT팀':
        return { backgroundColor: '#FFF3E0', color: '#333333' };
      case '개발팀':
        return { backgroundColor: '#E8F5E8', color: '#333333' };
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

  // 상태별 진행률 계산
  const getProgressFromStatus = (status: string) => {
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
  function DraggableCard({ task, canEditOwn = true, canEditOthers = true }: { task: TaskTableData; canEditOwn?: boolean; canEditOthers?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id,
      disabled: !(canEditOthers || (canEditOwn && isDataOwner(task)))
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
            handleCardClick(task);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(getStatusName(task.status))}>
            {getStatusName(task.status)}
          </span>
          <span className="incident-type-tag">{task.team || '일반'}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{task.workContent || '업무내용 없음'}</h3>

        {/* 3. 정보 라인 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{task.code || `TASK-${task.id}`}</span>
          </div>
          <div className="info-line">
            <span className="info-label">시작일:</span>
            <span className="info-value">{task.startDate || '미정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">완료일:</span>
            <span className="info-value">{task.completedDate || '미정'}</span>
          </div>
        </div>

        {/* 4. 진행도 섹션 */}
        <div className="progress-section">
          <div className="progress-info">
            <div className="progress-left">
              <span className="progress-text">진행도</span>
              <span className="progress-stage">
                {(() => {
                  const progress = task.progress || getProgressFromStatus(getStatusName(task.status));
                  if (progress >= 80) return '근본 개선';
                  if (progress >= 60) return '즉시 해결';
                  if (progress >= 40) return '개선 조치 중';
                  if (progress >= 20) return '현황 분석';
                  return '사고 탐지';
                })()}
              </span>
            </div>
            <span className="progress-percentage">{task.progress || getProgressFromStatus(getStatusName(task.status))}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${task.progress || getProgressFromStatus(getStatusName(task.status))}%` }} />
          </div>
        </div>

        {/* 5. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={
                assigneeList?.find((user) => user.user_name === task.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === task.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={task.assignee || '미할당'}
            />
            <span className="assignee-name">{task.assignee || '미할당'}</span>
          </div>
        </div>
      </article>
    );
  }

  // 드롭 가능한 컬럼 컴포넌트 (사양에 맞춰 수정)
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
              backgroundColor: column.pillBg,
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
        /* 칸반 보드 전체 */
        .kanban-board {
          display: flex;
          gap: 32px;
          padding: 24px;
          overflow-x: auto;
          height: 100%;
          font-family: "Inter", "Noto Sans KR", sans-serif;
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
        
        /* 칸반 컬럼 */
        .kanban-column {
          width: 340px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-shrink: 0;
        }
        
        /* 컬럼 헤더 */
        .column-header {
          display: flex;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #E4E6EB;
          margin-bottom: 8px;
        }
        
        /* 상태 필 */
        .pill {
          padding: 6px 20px;
          border-radius: 9999px;
          font: 500 13px/0.5 "Inter", "Noto Sans KR", sans-serif;
        }
        
        /* 카운트 */
        .count {
          font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
          margin-left: 8px;
          color: #606060;
        }
        
        /* 칸반 카드 */
        .kanban-card {
          background: #fff;
          border: 1px solid #E4E6EB;
          border-radius: 10px;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          background-color: rgba(156, 163, 175, 0.15);
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
          background-color: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        
        /* 5. 카드 푸터 */
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          border: 1px solid #e5e7eb;
          object-fit: cover;
        }
        
        .assignee-name {
          font: 500 12px "Inter", "Noto Sans KR", sans-serif;
          color: #4b5563;
        }
        
        .card-stats {
          display: flex;
          gap: 8px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .stat-item:hover {
          transform: scale(1.1);
        }
        
        .stat-icon {
          font-size: 13px;
          color: #9ca3af;
        }
        
        .stat-number {
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #9ca3af;
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
          .kanban-column {
            width: 220px;
          }
          
          .kanban-card {
            padding: 12px 16px;
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
                  <DraggableCard key={item.id} task={item} canEditOwn={canEditOwn} canEditOthers={canEditOthers} />
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

        <DragOverlay>{activeTask ? <DraggableCard task={activeTask} canEditOwn={canEditOwn} canEditOthers={canEditOthers} /> : null}</DragOverlay>
      </DndContext>

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <KpiEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={taskStatusOptions}
          statusColors={taskStatusColors}
          teams={teams}
          tasks={tasks}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
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
  tasks: TaskTableData[];
  onCardClick: (task: TaskTableData) => void;
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
    const taskYear = new Date(task.startDate).getFullYear().toString();
    if (taskYear !== useYear) return false;

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터 (상태명으로 비교)
    if (selectedStatus !== '전체' && getStatusName(task.status) !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: TaskTableData[] } = {};
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
                        key={`month-${monthIndex}-item-${item.id}`}
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
                          title={item.workContent || '업무내용 없음'}
                        >
                          {item.workContent || '업무내용 없음'}
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
                        key={`month-second-${index}-item-${item.id}`}
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
                          title={item.workContent || '업무내용 없음'}
                        >
                          {item.workContent || '업무내용 없음'}
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

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  tasks: TaskTableData[];
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

      {/* 변경로그 테이블 - 12컬럼 구조 */}
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
              <TableCell sx={{ fontWeight: 600, width: 130, fontSize: '12px' }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140, fontSize: '12px' }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180, fontSize: '12px' }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 300, fontSize: '12px' }}>변경 세부내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경자</TableCell>
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
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {changeLogs.length - (page * rowsPerPage + index)}
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
                    {log.title}
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
  tasks: TaskTableData[];
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
  const filterByDateRange = (data: TaskTableData[]) => {
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
  const filteredData = filterByDateRange(tasks).filter((task) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const taskYear = new Date(task.startDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;
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

  // 업무분류별 통계 (원형차트용) - department 필드 사용 (핵심 수정!)
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = item.department || '기타';
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

      {/* 상단 레이아웃: 업무분류 - 업무목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 업무분류 원형차트 */}
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
              업무분류
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
                          {task.workContent || '업무내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{task.completedDate || '-'}</TableCell>
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

export default function KpiManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  // Supabase 훅 사용
  const { users, departments, masterCodes } = useCommonData(); // 🏪 공용 창고에서 가져오기
  const { kpis, loading: kpisLoading, addKpi, updateKpi, deleteKpi, deleteKpis, fetchKpis } = useSupabaseKpi();

  // 변경로그 Hook (page='main_kpi')
  const { logs: dbChangeLogs, loading: changeLogsLoading, fetchChangeLogs } = useSupabaseChangeLog('main_kpi');

  // 사용자 정보
  const { data: session } = useSession();
  const { user: currentUser } = useUser();

  // 🔐 권한 관리
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers, loading: permissionLoading } = useMenuPermission('/apps/kpi');

  // 토스트 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 변경로그탭이 활성화될 때 데이터 강제 새로고침
  React.useEffect(() => {
    if (value === 4 && fetchChangeLogs) {
      console.log('🔄 변경로그탭 활성화 - 데이터 새로고침');
      fetchChangeLogs();
    }
  }, [value, fetchChangeLogs]);

  // 마스터코드에서 상태 옵션 가져오기 (GROUP002의 서브코드만 필터링)
  const statusTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 관리분류 옵션 가져오기 (GROUP040)
  const managementCategoriesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP040' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 업무분류 옵션 가져오기 (GROUP031)
  const departmentsMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP031' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수들
  const getManagementCategoryName = React.useCallback((subcode: string) => {
    const found = managementCategoriesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [managementCategoriesMap]);

  const getDepartmentName = React.useCallback((subcode: string) => {
    const found = departmentsMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [departmentsMap]);

  const getStatusName = React.useCallback((subcode: string) => {
    const found = statusTypes.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [statusTypes]);

  // 담당자 목록 생성
  const assignees = React.useMemo(() => {
    return users.map((user) => user.user_name);
  }, [users]);

  // 상태 옵션 생성
  const taskStatusOptions = React.useMemo(() => {
    return statusTypes.filter((status) => status.subcode_status === 'active').map((status) => status.subcode_name);
  }, [statusTypes]);

  // 팀 목록 생성
  const teams = React.useMemo(() => {
    return ['개발팀', '디자인팀', '기획팀', '마케팅팀'];
  }, []);

  // Supabase 데이터를 TaskTableData 형식으로 변환
  const tasks = React.useMemo(() => {
    return kpis.map(
      (kpi, index) =>
        ({
          id: kpi.id,
          no: kpis.length - index, // 역순 번호
          code: kpi.code,
          workContent: kpi.work_content,
          selectionBackground: kpi.selection_background || '',
          impact: kpi.impact || '',
          evaluationCriteria: {
            S: kpi.evaluation_criteria_s || '',
            A: kpi.evaluation_criteria_a || '',
            B: kpi.evaluation_criteria_b || '',
            C: kpi.evaluation_criteria_c || '',
            D: kpi.evaluation_criteria_d || ''
          },
          assignee: kpi.assignee || '',
          status: kpi.status as TaskStatus,
          registrationDate: kpi.registration_date,
          startDate: kpi.start_date || '',
          completedDate: kpi.completed_date || '',
          description: kpi.description || '',
          team: kpi.team || '',
          department: kpi.department || '',
          progress: kpi.progress || 0,
          managementCategory: kpi.management_category || '',
          targetKpi: kpi.target_kpi || '',
          currentKpi: kpi.current_kpi || '',
          attachments: []
        }) as TaskTableData
    );
  }, [kpis]);

  const setTasks = React.useCallback(() => {
    // setTasks는 더 이상 직접 사용하지 않음 (Supabase 훅 사용)
    console.warn('setTasks is deprecated. Use Supabase hooks instead.');
  }, []);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableData | null>(null);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // DB 변경로그를 UI 형식으로 변환
  const changeLogs = React.useMemo(() => {
    if (!dbChangeLogs) return [];

    // action_type 매핑 함수
    const mapActionType = (actionType: string): string => {
      if (actionType === '추가' || actionType.includes('추가') || actionType.includes('등록') || actionType.includes('생성')) {
        return '추가';
      } else if (actionType === '수정' || actionType.includes('수정') || actionType.includes('변경')) {
        return '수정';
      } else if (actionType === '삭제' || actionType.includes('삭제')) {
        return '삭제';
      }
      return '수정'; // 기본값
    };

    return dbChangeLogs.map((log: ChangeLogData) => {
      // record_id로 해당 KPI 찾기 (record_id는 코드로 저장되어 있음)
      const kpi = tasks.find((t) => t.code === log.record_id);

      const date = new Date(log.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}.${month}.${day} ${hour}:${minute}`;

      return {
        id: String(log.id),
        dateTime: formattedDateTime,
        title: log.title || '',
        code: log.record_id,
        action: mapActionType(log.action_type),
        location: log.change_location || '-',
        changedField: log.changed_field || '-',
        beforeValue: log.before_value || '-',
        afterValue: log.after_value || '-',
        description: log.description,
        team: log.team || log.user_department || '-',
        user: log.user_name
      } as ChangeLog;
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

  // 변경로그 추가 함수 - Supabase 연동
  const addChangeLog = React.useCallback(
    async (
      action: string,
      target: string,
      description: string,
      team?: string,
      beforeValue?: string,
      afterValue?: string,
      changedField?: string,
      title?: string,
      location?: string
    ) => {
      try {
        const supabase = createClient();
        const userName = currentUser?.user_name || session?.user?.name || '시스템';

        const logData = {
          page: 'main_kpi',
          record_id: target, // target → record_id
          action_type: action, // action → action_type
          description: description,
          before_value: beforeValue || null,
          after_value: afterValue || null,
          changed_field: changedField || null,
          title: title || null,
          change_location: location || '개요탭',
          user_name: userName, // changed_by → user_name
          team: currentUser?.department || team || '시스템',
          user_department: currentUser?.department,
          user_position: currentUser?.position,
          user_profile_image: currentUser?.profile_image_url,
          created_at: new Date().toISOString()
        };

        console.log('📝 변경로그 저장 시도:', logData);

        const { data, error } = await supabase.from('common_log_data').insert(logData).select();

        if (error) {
          console.error('❌ 변경로그 저장 실패:', error);
          console.error('❌ 에러 상세:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else {
          console.log('✅ 변경로그 저장 성공:', data);
          // 변경로그 목록 새로고침
          await fetchChangeLogs();
        }
      } catch (err) {
        console.error('🔴 변경로그 추가 중 예외:', err);
      }
    },
    [currentUser, session, fetchChangeLogs]
  );

  // 카드 클릭 핸들러
  const handleCardClick = (task: TaskTableData) => {
    setEditingTask(task);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // KPI 저장 핸들러
  const handleEditTaskSave = async (updatedTask: TaskTableData) => {
    const originalTask = tasks.find((t) => t.id === updatedTask.id);

    console.log('🔍 handleEditTaskSave 호출됨:', {
      updatedTask,
      managementCategory: (updatedTask as any).managementCategory,
      targetKpi: (updatedTask as any).targetKpi,
      currentKpi: (updatedTask as any).currentKpi
    });

    try {
      if (originalTask) {
        // 업데이트
        const kpiData: Partial<KpiData> = {
          code: updatedTask.code,
          work_content: updatedTask.workContent,
          description: updatedTask.description,
          selection_background: (updatedTask as any).selectionBackground,
          impact: (updatedTask as any).impact,
          evaluation_criteria_s: (updatedTask as any).evaluationCriteria?.S,
          evaluation_criteria_a: (updatedTask as any).evaluationCriteria?.A,
          evaluation_criteria_b: (updatedTask as any).evaluationCriteria?.B,
          evaluation_criteria_c: (updatedTask as any).evaluationCriteria?.C,
          evaluation_criteria_d: (updatedTask as any).evaluationCriteria?.D,
          management_category: (updatedTask as any).managementCategory,
          target_kpi: (updatedTask as any).targetKpi,
          current_kpi: (updatedTask as any).currentKpi,
          department: updatedTask.department,
          progress: updatedTask.progress,
          status: updatedTask.status,
          start_date: (updatedTask as any).startDate,
          completed_date: updatedTask.completedDate,
          team: updatedTask.team,
          assignee: updatedTask.assignee
        };

        console.log('📦 업데이트용 kpiData:', kpiData);
        await updateKpi(updatedTask.id, kpiData);

        // 변경로그 추가 - 필드별 추적
        const fieldNameMap: Record<string, string> = {
          workContent: '업무내용',
          status: '상태',
          assignee: '담당자',
          completedDate: '완료일',
          startDate: '시작일',
          team: '팀',
          department: '부서',
          progress: '진행률',
          description: '설명',
          selectionBackground: '선정배경',
          impact: '파급효과',
          managementCategory: '관리분류',
          targetKpi: '목표 KPI',
          currentKpi: '현재 KPI'
        };

        // 변경된 필드 찾기
        const changes: Array<{ field: string; fieldKorean: string; before: any; after: any }> = [];

        // 일반 필드 비교
        Object.keys(fieldNameMap).forEach((field) => {
          const beforeVal = (originalTask as any)[field];
          const afterVal = (updatedTask as any)[field];

          // 값이 다른 경우만 추가
          if (beforeVal !== afterVal) {
            changes.push({
              field,
              fieldKorean: fieldNameMap[field],
              before: beforeVal || '',
              after: afterVal || ''
            });
          }
        });

        // 평가기준표 비교 (객체 형태)
        const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
        evaluationGrades.forEach((grade) => {
          const beforeVal = (originalTask as any).evaluationCriteria?.[grade];
          const afterVal = (updatedTask as any).evaluationCriteria?.[grade];

          if (beforeVal !== afterVal) {
            changes.push({
              field: `evaluationCriteria.${grade}`,
              fieldKorean: `평가기준 ${grade}`,
              before: beforeVal || '',
              after: afterVal || ''
            });
          }
        });

        console.log('🔍 변경 감지된 필드들:', changes);

        const kpiTitle = updatedTask.workContent || 'KPI';

        // 변경된 필드가 있으면 각각 로그 기록
        if (changes.length > 0) {
          for (const change of changes) {
            const description = `KPI관리 ${kpiTitle}(${updatedTask.code}) 정보의 개요탭 ${change.fieldKorean}이 ${change.before} → ${change.after} 로 수정 되었습니다.`;

            await addChangeLog(
              '수정',
              updatedTask.code,
              description,
              updatedTask.team || '시스템',
              String(change.before),
              String(change.after),
              change.fieldKorean,
              kpiTitle,
              '개요탭'
            );
          }
        }

        // 토스트 알림 (수정)
        if (changes.length > 0) {
          const firstField = changes[0].fieldKorean;
          const josaField = getJosa(firstField, '이/가');

          if (changes.length === 1) {
            // 1개 필드만 수정된 경우
            setSnackbar({
              open: true,
              message: `${kpiTitle}의 ${firstField}${josaField} 성공적으로 수정되었습니다.`,
              severity: 'success'
            });
          } else {
            // 여러 필드가 수정된 경우
            setSnackbar({
              open: true,
              message: `${kpiTitle}의 ${changes.length}개 항목이 성공적으로 수정되었습니다.`,
              severity: 'success'
            });
          }
        } else {
          // 변경사항이 없는 경우도 성공 메시지 표시
          const josa = getJosa(kpiTitle, '이/가');
          setSnackbar({
            open: true,
            message: `${kpiTitle}${josa} 성공적으로 저장되었습니다.`,
            severity: 'success'
          });
        }
      } else {
        // 새로 생성
        console.log('📝 신규 KPI 생성 시작:', updatedTask);

        const kpiData: Omit<KpiData, 'id' | 'created_at' | 'updated_at'> = {
          code: updatedTask.code,
          work_content: updatedTask.workContent,
          description: updatedTask.description || null,
          selection_background: (updatedTask as any).selectionBackground || null,
          impact: (updatedTask as any).impact || null,
          evaluation_criteria_s: (updatedTask as any).evaluationCriteria?.S || null,
          evaluation_criteria_a: (updatedTask as any).evaluationCriteria?.A || null,
          evaluation_criteria_b: (updatedTask as any).evaluationCriteria?.B || null,
          evaluation_criteria_c: (updatedTask as any).evaluationCriteria?.C || null,
          evaluation_criteria_d: (updatedTask as any).evaluationCriteria?.D || null,
          management_category: (updatedTask as any).managementCategory || null,
          target_kpi: (updatedTask as any).targetKpi || null,
          current_kpi: (updatedTask as any).currentKpi || null,
          department: updatedTask.department || null,
          progress: updatedTask.progress || 0,
          status: updatedTask.status,
          start_date: (updatedTask as any).startDate || updatedTask.registrationDate || null,
          completed_date: updatedTask.completedDate || null,
          team: updatedTask.team || null,
          assignee: updatedTask.assignee || null,
          registration_date: updatedTask.registrationDate
        };

        console.log('📦 Supabase에 전송할 데이터:', kpiData);
        await addKpi(kpiData);

        const kpiTitle = updatedTask.workContent || 'KPI';
        await addChangeLog(
          '추가',
          updatedTask.code,
          `KPI관리 ${kpiTitle}(${updatedTask.code})의 데이터가 추가 되었습니다.`,
          updatedTask.team || '시스템',
          undefined,
          undefined,
          undefined,
          kpiTitle,
          '개요탭'
        );

        // 토스트 알림 (추가)
        const josaAdd = getJosa(kpiTitle, '이/가');
        setSnackbar({
          open: true,
          message: `${kpiTitle}${josaAdd} 성공적으로 등록되었습니다.`,
          severity: 'success'
        });
      }

      handleEditDialogClose();
    } catch (error) {
      console.error('KPI 저장 오류:', error);
      setSnackbar({
        open: true,
        message: 'KPI 저장 중 오류가 발생했습니다.',
        severity: 'error'
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
                KPI관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                메인메뉴 &gt; KPI관리
              </Typography>
            </Box>
          </Box>

          {/* 권한 체크: 카테고리 보기만 있는 경우 */}
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
              aria-label="KPI관리 탭"
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
                <KpiTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                  setSnackbar={setSnackbar}
                  users={users}
                  onDeleteKpis={deleteKpis}
                  onSaveKpi={handleEditTaskSave}
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
                  p: 0,
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
                <KanbanView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                  setSnackbar={setSnackbar}
                  fetchKpis={fetchKpis}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  assignees={assignees}
                  assigneeAvatars={assigneeAvatars}
                  taskStatusOptions={taskStatusOptions}
                  taskStatusColors={taskStatusColors}
                  teams={teams}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
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
          </>
          )}
        </CardContent>
      </Card>

      {/* KPI 편집 다이얼로그 */}
      {editDialog && (
        <KpiEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={taskStatusOptions}
          statusColors={taskStatusColors}
          teams={teams}
          tasks={tasks}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}

      {/* 토스트 알림 Snackbar */}
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
