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
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import HardwareTable from 'views/apps/HardwareTable';
import HardwareEditDialog from 'components/HardwareEditDialog';
import { hardwareData, hardwareStatusColors, assigneeAvatars } from 'data/hardware';
import { HardwareTableData, HardwareStatus, HardwareRecord } from 'types/hardware';
import { ThemeMode } from 'config';

// Supabase hook
import { useSupabaseHardware, HardwareData } from 'hooks/useSupabaseHardware';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement } from 'hooks/useSupabaseDepartmentManagement';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';

// 변경로그 타입 정의 (13필드 - title 추가)
interface ChangeLog {
  id: string;
  dateTime: string;
  title: string;
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

// ==============================|| 하드웨어관리 메인 페이지 ||============================== //

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
      id={`hardware-tabpanel-${index}`}
      aria-labelledby={`hardware-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `hardware-tab-${index}`,
    'aria-controls': `hardware-tabpanel-${index}`
  };
}

// 칸반 뷰 컴포넌트
interface KanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  hardware: HardwareTableData[];
  setHardware: React.Dispatch<React.SetStateAction<HardwareTableData[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string, beforeValue?: string, afterValue?: string, changedField?: string) => void;
  assigneeList?: any[];
  statusTypes?: any[];
  onHardwareSave?: (hardware: Partial<HardwareRecord>) => Promise<void>;
}

function KanbanView({ selectedYear, selectedTeam, selectedStatus, selectedAssignee, hardware, setHardware, addChangeLog, assigneeList, statusTypes = [], onHardwareSave }: KanbanViewProps) {
  const theme = useTheme();

  // 상태 관리
  const [activeHardware, setActiveHardware] = useState<HardwareTableData | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingHardware, setEditingHardware] = useState<HardwareTableData | null>(null);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = hardware.filter((task) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const taskYear = new Date(task.startDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedHardware = hardware.find((task) => task.id === active.id);
    setActiveHardware(draggedHardware || null);
    setIsDraggingState(true);
  };

  // 카드 클릭 핸들러
  const handleCardClick = (hardware: HardwareTableData) => {
    setEditingHardware(hardware);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingHardware(null);
  };

  // Hardware 저장 핸들러

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveHardware(null);
    setIsDraggingState(false);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id as HardwareStatus;

    // 상태가 변경된 경우만 업데이트
    const currentHardware = hardware.find((task) => task.id === taskId);
    if (currentHardware && currentHardware.status !== newStatus) {
      const oldStatus = currentHardware.status;

      setHardware((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));

      // 변경로그 추가
      const taskCode = currentHardware.code || `TASK-${taskId}`;
      const workContent = currentHardware.workContent || '업무내용 없음';
      const description = `${workContent} 상태를 "${oldStatus}"에서 "${newStatus}"로 변경`;

      addChangeLog('업무 상태 변경', taskCode, description, currentHardware.team || '미분류');
    }
  };

  // 상태별 컬럼 정의 (동적 생성)
  const statusColumns = React.useMemo(() => {
    if (statusTypes.length === 0) {
      return [
        { key: '대기', title: '대기', pillBg: '#F0F0F0', pillColor: '#424242' },
        { key: '진행', title: '진행', pillBg: '#E3F2FD', pillColor: '#1976D2' },
        { key: '완료', title: '완료', pillBg: '#E8F5E8', pillColor: '#388E3C' },
        { key: '홀딩', title: '홀딩', pillBg: '#FFEBEE', pillColor: '#D32F2F' }
      ];
    }

    const colorPalette = [
      { pillBg: '#F0F0F0', pillColor: '#424242' },
      { pillBg: '#E3F2FD', pillColor: '#1976D2' },
      { pillBg: '#E8F5E8', pillColor: '#388E3C' },
      { pillBg: '#FFEBEE', pillColor: '#D32F2F' },
      { pillBg: '#FFF3E0', pillColor: '#F57C00' },
      { pillBg: '#F3E5F5', pillColor: '#7B1FA2' }
    ];

    return statusTypes.map((status, index) => ({
      key: status.subcode_name,
      title: status.subcode_name,
      pillBg: colorPalette[index % colorPalette.length].pillBg,
      pillColor: colorPalette[index % colorPalette.length].pillColor
    }));
  }, [statusTypes]);

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
  };

  // 팀별 색상 매핑 (데이터 테이블과 동일)
  const getTeamColor = (team: string) => {
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

  // 담당자별 아바타 매핑 (하드웨어팀)
  const assigneeAvatars = {
    김하드: '/assets/images/users/avatar-1.png',
    이인프: '/assets/images/users/avatar-2.png',
    박시스: '/assets/images/users/avatar-3.png',
    최네트: '/assets/images/users/avatar-4.png',
    정서버: '/assets/images/users/avatar-5.png'
  };

  // 상태 태그 스타일 함수 (동적)
  const getStatusTagStyle = (status: string) => {
    const column = statusColumns.find((col) => col.key === status);
    if (column) {
      // pillColor를 기반으로 투명도 적용한 배경색 생성
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
      const rgb = hexToRgb(column.pillColor);
      return {
        backgroundColor: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : 'rgba(156, 163, 175, 0.15)',
        color: column.pillColor
      };
    }
    return { backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#4b5563' };
  };

  // 드래그 가능한 카드 컴포넌트 (표준화된 5단계 구조)
  function DraggableCard({ task }: { task: HardwareTableData }) {
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
            handleCardClick(task);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(task.status)}>
            {task.status}
          </span>
          <span className="incident-type-tag">하드웨어</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{task.workContent || '업무내용 없음'}</h3>

        {/* 3. 정보 라인 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">팀:</span>
            <span className="info-value">{task.team}</span>
          </div>
          <div className="info-line">
            <span className="info-label">시작일:</span>
            <span className="info-value">{task.startDate}</span>
          </div>
          <div className="info-line">
            <span className="info-label">완료일:</span>
            <span className="info-value">{task.completedDate || '미정'}</span>
          </div>
        </div>

        {/* 4. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              src={
                assigneeList?.find((user) => user.user_name === task.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === task.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={task.assignee}
              className="assignee-avatar"
            />
            <span className="assignee-name">{task.assignee || '미할당'}</span>
          </div>
        </div>
      </article>
    );
  }

  // 드롭 가능한 컬럼 컴포넌트 (표준화된 포맷)
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
        /* 표준화된 칸반 디자인 */
        .kanban-board {
          display: flex;
          gap: 16px;
          padding: 24px 0 24px 24px;
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
        
        /* 컬럼 스타일 */
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
        
        /* 카운트 표시 */
        .count {
          font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
          margin-left: 8px;
          color: #606060;
        }
        
        /* 카드 컨테이너 */
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
          cursor: pointer;
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
        
        /* 4. 카드 푸터 */
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
          transition: transform 0.2s ease;
        }
        
        .stat-item:hover {
          transform: scale(1.1);
        }
        
        .stat-icon {
          font-size: 13px;
          color: #9ca3af;
        }
        
        .stat-item[style*="cursor: pointer"] .stat-icon {
          color: #ef4444;
        }
        
        .stat-number {
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
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

        <DragOverlay>{activeHardware ? <DraggableCard task={activeHardware} /> : null}</DragOverlay>
      </DndContext>

      {/* Hardware 편집 다이얼로그 */}
      {editDialog && (
        <HardwareEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          data={editingHardware ? (() => {
            console.log('🔍 KanbanView editingHardware 전체 데이터:', editingHardware);
            console.log('🔍 KanbanView 주요 필드들:', {
              status: editingHardware.status,
              assignee: editingHardware.assignee,
              model: editingHardware.model,
              manufacturer: editingHardware.manufacturer,
              vendor: editingHardware.vendor,
              location: editingHardware.location,
              currentUser: editingHardware.currentUser,
              serialNumber: editingHardware.serialNumber
            });

            const hardwareRecord = {
              id: String(editingHardware.id),
              no: editingHardware.no,
              registrationDate: editingHardware.registrationDate,
              code: editingHardware.code,
              assetCategory: editingHardware.assetCategory || '',
              assetName: editingHardware.assetName || '',
              assetDescription: editingHardware.assetDescription || '',
              model: editingHardware.model || '',
              manufacturer: editingHardware.manufacturer || '',
              vendor: editingHardware.vendor || '',
              detailSpec: editingHardware.detailSpec || '',
              status: editingHardware.status || '예비',
              purchaseDate: editingHardware.purchaseDate || '',
              warrantyEndDate: editingHardware.warrantyEndDate || '',
              serialNumber: editingHardware.serialNumber || '',
              currentUser: editingHardware.currentUser || '',
              location: editingHardware.location || '',
              assignee: editingHardware.assignee || '',
              team: editingHardware.team || '',
              registrant: editingHardware.registrant || '',
              images: [],
              image_1_url: editingHardware.image_1_url || '',
              image_2_url: editingHardware.image_2_url || ''
            };

            console.log('🔍 KanbanView Dialog에 전달할 데이터:', {
              status: hardwareRecord.status,
              assignee: hardwareRecord.assignee,
              image_1_url: hardwareRecord.image_1_url,
              image_2_url: hardwareRecord.image_2_url
            });
            return hardwareRecord;
          })() : null}
          mode={editingHardware ? 'edit' : 'add'}
          onSave={onHardwareSave || (() => Promise.resolve())}
          statusOptions={statusTypes.length > 0 ? statusTypes.map((s) => s.subcode_name) : undefined}
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
  hardware: HardwareTableData[];
  onCardClick: (hardware: HardwareTableData) => void;
}

function MonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  hardware,
  onCardClick
}: MonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  // 데이터 필터링
  const filteredData = hardware.filter((task) => {
    // 연도 필터 (메인 필터 사용)
    if (selectedYear !== '전체') {
      const taskYear = new Date(task.startDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: HardwareTableData[] } = {};
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
                  boxSizing: 'border-box'
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
                  boxSizing: 'border-box'
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
  hardware: HardwareTableData[];
}

function DashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  selectedRecentStatus,
  setSelectedRecentStatus,
  hardware
}: DashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: HardwareTableData[]) => {
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
              전체 업무 현황
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
              완료된 업무
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
              진행중인 업무
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
              보류중인 업무
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
              대기중인 업무
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

export default function HardwareManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  // Supabase 훅 사용 (즉시 렌더링 - loading 상태 제거)
  const { hardware, error, fetchHardware, createHardware, updateHardware, deleteHardware, deleteMultipleHardware } = useSupabaseHardware();
  const { users } = useSupabaseUserManagement();
  const { departments, fetchDepartments } = useSupabaseDepartmentManagement();
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // 변경로그 Supabase 훅
  const { logs: changeLogData, loading: changeLogLoading, error: changeLogError, fetchChangeLogs } = useSupabaseChangeLog('it_hardware');
  const { data: session } = useSession();
  const { user } = useUser();

  // 부서 데이터 로드
  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // 마스터코드에서 상태 옵션 가져오기
  const statusTypes = React.useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  // 공유 Tasks 상태 - Supabase 데이터를 HardwareTableData 형식으로 변환
  const [tasks, setTasks] = useState<HardwareTableData[]>([]);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingHardware, setEditingHardware] = useState<HardwareTableData | null>(null);

  // Supabase 데이터를 HardwareTableData 형식으로 변환하는 함수
  const convertHardwareToTask = (hardwareItem: HardwareData): HardwareTableData => {
    console.log('🔄 convertHardwareToTask - asset_description:', hardwareItem.asset_description);
    console.log('🔄 convertHardwareToTask - asset_name:', hardwareItem.asset_name);

    const converted = {
      id: hardwareItem.id || 0,
      no: 0, // 프론트엔드에서 계산됨
      registrationDate: hardwareItem.registration_date || new Date().toISOString(),
      code: hardwareItem.code || '',
      team: hardwareItem.team || '개발팀',
      department: hardwareItem.department || 'IT',
      workContent: hardwareItem.work_content || hardwareItem.asset_name || '',
      status: hardwareItem.status || '예비',
      assignee: hardwareItem.assignee || '', // DB의 assignee를 그대로 사용
      registrant: hardwareItem.assignee || '', // DB의 assignee를 registrant로도 매핑
      startDate: hardwareItem.start_date || '',
      completedDate: hardwareItem.completed_date || '',
      attachments: hardwareItem.attachments || [],

      // 하드웨어 특화 필드
      assetCategory: hardwareItem.asset_category || '',
      assetName: hardwareItem.asset_name || '',
      assetDescription: hardwareItem.asset_description || '',
      location: hardwareItem.location || '',
      currentUser: hardwareItem.assigned_user || '', // DB의 assigned_user를 currentUser로 매핑

      // 추가된 하드웨어 상세 필드들
      model: hardwareItem.model || '',
      manufacturer: hardwareItem.manufacturer || '',
      vendor: hardwareItem.vendor || '',
      detailSpec: hardwareItem.detail_spec || '',
      purchaseDate: hardwareItem.purchase_date || '',
      warrantyEndDate: hardwareItem.warranty_end_date || '',
      serialNumber: hardwareItem.serial_number || '',

      // 개별 이미지 URL 필드들
      image_1_url: hardwareItem.image_1_url || '',
      image_2_url: hardwareItem.image_2_url || ''
    };

    return converted;
  };

  // Supabase 데이터가 변경되면 tasks 상태 업데이트 (즉시 렌더링)
  useEffect(() => {
    console.log('🔍 Supabase 하드웨어 데이터 상태:', {
      length: hardware.length,
      error,
      sampleData: hardware.slice(0, 2)
    });

    const convertedTasks = hardware.map(convertHardwareToTask);
    setTasks(convertedTasks);
    console.log('🔄 Supabase 하드웨어 데이터를 HardwareTableData로 변환 완료:', convertedTasks.length + '개');
  }, [hardware, error]);

  // currentUser 찾기 (email 기반)
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  // 변경로그 데이터 변환 (Supabase → UI)
  const changeLogs = React.useMemo<ChangeLog[]>(() => {
    if (!changeLogData) return [];

    return changeLogData.map((log) => ({
      id: String(log.id),
      dateTime: log.created_at ? new Date(log.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace('.', '').replace(',', '') : '',
      title: log.title || '',
      code: log.record_id || '',
      target: log.record_id || '',
      location: '개요탭',
      action: log.action_type || '',
      changedField: log.changed_field || undefined,
      description: log.description || '',
      beforeValue: log.before_value || undefined,
      afterValue: log.after_value || undefined,
      team: log.team || '시스템',
      user: log.user_name || '시스템'
    }));
  }, [changeLogData]);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

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

  // 변경로그 추가 함수 (Supabase 기반, 8 파라미터)
  const addChangeLog = async (
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
      const supabase = createClient();
      const userName = user?.name || currentUser?.user_name || '시스템';

      const logData = {
        page: 'it_hardware',
        record_id: target,
        action_type: action,
        description: description,
        before_value: beforeValue || null,
        after_value: afterValue || null,
        changed_field: changedField || null,
        title: title || null,
        user_name: userName,
        team: currentUser?.department || '시스템',
        user_department: currentUser?.department,
        user_position: currentUser?.position,
        user_profile_image: currentUser?.profile_image_url,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('common_log_data').insert([logData]).select();

      if (error) {
        console.error('❌ 변경로그 추가 실패:', error);
      } else {
        console.log('✅ 변경로그 추가 성공:', data);
        // 변경로그 목록 새로고침
        await fetchChangeLogs();
      }
    } catch (error) {
      console.error('❌ 변경로그 추가 중 오류:', error);
    }
  };

  // 카드 클릭 핸들러
  const handleCardClick = (hardware: HardwareTableData) => {
    setEditingHardware(hardware);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingHardware(null);
  };

  // Hardware 저장 핸들러
  const handleEditHardwareSave = async (updatedHardware: Partial<HardwareRecord>) => {
    const originalHardware = tasks.find((t) => t.id === Number(updatedHardware.id));

    console.log('🔍 HardwareEditDialog에서 받은 데이터:', updatedHardware);

    try {
      if (originalHardware) {
        // 업데이트 - HardwareRecord를 Supabase 형식으로 변환
        const hardwareData: any = {
          code: updatedHardware.code,
          team: updatedHardware.team || '개발팀', // 팀 필드 매핑
          department: 'IT', // 기본값
          work_content: updatedHardware.assetName || '하드웨어',
          status: updatedHardware.status || '예비',
          assignee: updatedHardware.registrant || updatedHardware.assignee || '미할당', // registrant를 assignee에 매핑
          start_date: new Date().toISOString().split('T')[0] // 기본값
        };

        // HardwareRecord의 필드들을 Supabase 형식으로 매핑
        if (updatedHardware.assetCategory) hardwareData.asset_category = updatedHardware.assetCategory;
        if (updatedHardware.assetName) hardwareData.asset_name = updatedHardware.assetName;
        if (updatedHardware.assetDescription !== undefined) hardwareData.asset_description = updatedHardware.assetDescription;
        if (updatedHardware.model) hardwareData.model = updatedHardware.model;
        if (updatedHardware.manufacturer) hardwareData.manufacturer = updatedHardware.manufacturer;
        if (updatedHardware.vendor) hardwareData.vendor = updatedHardware.vendor;
        if (updatedHardware.detailSpec) hardwareData.detail_spec = updatedHardware.detailSpec;
        if (updatedHardware.purchaseDate) hardwareData.purchase_date = updatedHardware.purchaseDate;
        if (updatedHardware.warrantyEndDate) hardwareData.warranty_end_date = updatedHardware.warrantyEndDate;
        if (updatedHardware.serialNumber) hardwareData.serial_number = updatedHardware.serialNumber;
        if (updatedHardware.currentUser) hardwareData.assigned_user = updatedHardware.currentUser;
        if (updatedHardware.location) hardwareData.location = updatedHardware.location;

        // 이미지 URL 필드 매핑
        if (updatedHardware.image_1_url !== undefined) hardwareData.image_1_url = updatedHardware.image_1_url;
        if (updatedHardware.image_2_url !== undefined) hardwareData.image_2_url = updatedHardware.image_2_url;

        console.log('🖼️ 이미지 URL 저장 데이터:', {
          image_1_url: hardwareData.image_1_url,
          image_2_url: hardwareData.image_2_url
        });

        console.log('💾 Supabase로 전송할 전체 데이터:', hardwareData);

        await updateHardware(Number(updatedHardware.id), hardwareData);

        // Supabase에서 최신 데이터 다시 불러오기
        await fetchHardware();

        console.log('✅ 하드웨어 업데이트 성공');
      } else {
        // 새로 생성 - HardwareRecord를 Supabase 형식으로 변환
        const hardwareData: any = {
          code: updatedHardware.code || `HW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
          team: updatedHardware.team || '개발팀', // 팀 필드 매핑
          department: 'IT', // 기본값
          work_content: updatedHardware.assetName || '신규 하드웨어',
          status: updatedHardware.status || '예비',
          assignee: updatedHardware.registrant || updatedHardware.assignee || '미할당', // registrant를 assignee에 매핑
          start_date: new Date().toISOString().split('T')[0] // 기본값
        };

        // HardwareRecord의 필드들을 Supabase 형식으로 매핑 (새로 생성)
        if (updatedHardware.assetCategory) hardwareData.asset_category = updatedHardware.assetCategory;
        if (updatedHardware.assetName) hardwareData.asset_name = updatedHardware.assetName;
        if (updatedHardware.assetDescription !== undefined) hardwareData.asset_description = updatedHardware.assetDescription;
        if (updatedHardware.model) hardwareData.model = updatedHardware.model;
        if (updatedHardware.manufacturer) hardwareData.manufacturer = updatedHardware.manufacturer;
        if (updatedHardware.vendor) hardwareData.vendor = updatedHardware.vendor;
        if (updatedHardware.detailSpec) hardwareData.detail_spec = updatedHardware.detailSpec;
        if (updatedHardware.purchaseDate) hardwareData.purchase_date = updatedHardware.purchaseDate;
        if (updatedHardware.warrantyEndDate) hardwareData.warranty_end_date = updatedHardware.warrantyEndDate;
        if (updatedHardware.serialNumber) hardwareData.serial_number = updatedHardware.serialNumber;
        if (updatedHardware.currentUser) hardwareData.assigned_user = updatedHardware.currentUser;
        if (updatedHardware.location) hardwareData.location = updatedHardware.location;

        // 이미지 URL 필드 매핑 (새로 생성)
        if (updatedHardware.image_1_url !== undefined) hardwareData.image_1_url = updatedHardware.image_1_url;
        if (updatedHardware.image_2_url !== undefined) hardwareData.image_2_url = updatedHardware.image_2_url;

        console.log('🖼️ 새로 생성 - 이미지 URL:', {
          image_1_url: hardwareData.image_1_url,
          image_2_url: hardwareData.image_2_url
        });

        console.log('📝 새로 생성할 하드웨어 데이터:', hardwareData);
        console.log('📝 전체 데이터 키:', Object.keys(hardwareData));
        console.log('📝 image_1_url 값:', hardwareData.image_1_url);
        console.log('📝 image_2_url 값:', hardwareData.image_2_url);

        console.log('🚀 createHardware 함수 호출 시작...');
        const createdHardware = await createHardware(hardwareData);
        console.log('🚀 createHardware 함수 호출 완료:', createdHardware);

        // Supabase에서 최신 데이터 다시 불러오기
        console.log('🔄 fetchHardware 호출 시작...');
        await fetchHardware();
        console.log('🔄 fetchHardware 호출 완료');

        console.log('✅ 하드웨어 생성 성공');
        addChangeLog('하드웨어 생성', hardwareData.code, `새로운 하드웨어가 생성되었습니다: ${updatedHardware.assetName}`, '개발팀');
      }

      handleEditDialogClose();

    } catch (error) {
      console.error('❌ 하드웨어 저장 실패:', error);
      alert('하드웨어 저장 중 오류가 발생했습니다.');
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
                하드웨어관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                IT메뉴 &gt; 하드웨어관리
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
              aria-label="하드웨어관리 탭"
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
                  p: 1.5,
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
                <HardwareTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
                  setTasks={setTasks}
                  addChangeLog={addChangeLog}
                  deleteMultipleHardware={deleteMultipleHardware}
                  onHardwareSave={handleEditHardwareSave}
                  statusTypes={statusTypes}
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
                  hardware={tasks}
                  setHardware={setTasks}
                  addChangeLog={addChangeLog}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  statusTypes={statusTypes}
                  onHardwareSave={handleEditHardwareSave}
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
                  hardware={tasks}
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
                  hardware={tasks}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={4}>
              {/* 변경로그 탭 (12컬럼 - 소프트웨어관리와 동일) */}
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0.5 }}>
                {/* 상단 정보 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 4.5, flexShrink: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    총 {changeLogs.length}건
                  </Typography>
                </Box>

                {/* 변경로그 테이블 (12컬럼) */}
                <TableContainer
                  sx={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 0,
                    overflowX: 'auto',
                    overflowY: 'auto',
                    boxShadow: 'none',
                    minHeight: 0,
                    '& .MuiTable-root': { minWidth: 1400 },
                    '&::-webkit-scrollbar': { width: '10px', height: '10px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#f8f9fa', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#e9ecef', borderRadius: '4px', border: '2px solid #f8f9fa' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#dee2e6' },
                    '&::-webkit-scrollbar-corner': { backgroundColor: '#f8f9fa' }
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                        <TableCell sx={{ fontWeight: 600, width: 50 }}>NO</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 110 }}>변경시간</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 150 }}>제목</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 100 }}>코드</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 80 }}>변경분류</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 80 }}>변경위치</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 100 }}>변경필드</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 120 }}>변경전</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 120 }}>변경후</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 360 }}>변경 세부내용</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 90 }}>팀</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 90 }}>변경자</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {changeLogs.slice(changeLogPage * changeLogRowsPerPage, (changeLogPage + 1) * changeLogRowsPerPage).map((log, index) => (
                        <TableRow key={log.id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                              {changeLogs.length - (changeLogPage * changeLogRowsPerPage + index)}
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
                          '& .MuiSelect-select': { py: 0.5, px: 1, fontSize: '0.875rem' },
                          '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e0e0e0' }
                        }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                      </Select>
                    </FormControl>
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
                            const pageNumber = parseInt(changeLogGoToPage, 10);
                            const totalPages = Math.ceil(changeLogs.length / changeLogRowsPerPage);
                            if (pageNumber >= 1 && pageNumber <= totalPages) {
                              setChangeLogPage(pageNumber - 1);
                            }
                            setChangeLogGoToPage('');
                          }
                        }}
                        placeholder="1"
                        sx={{
                          width: 60,
                          '& .MuiOutlinedInput-root': {
                            '& input': { py: 0.5, px: 1, textAlign: 'center', fontSize: '0.875rem' },
                            '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e0e0e0' }
                          }
                        }}
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          const pageNumber = parseInt(changeLogGoToPage, 10);
                          const totalPages = Math.ceil(changeLogs.length / changeLogRowsPerPage);
                          if (pageNumber >= 1 && pageNumber <= totalPages) {
                            setChangeLogPage(pageNumber - 1);
                          }
                          setChangeLogGoToPage('');
                        }}
                        sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.875rem' }}
                      >
                        Go
                      </Button>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {changeLogs.length > 0
                        ? `${changeLogPage * changeLogRowsPerPage + 1}-${Math.min((changeLogPage + 1) * changeLogRowsPerPage, changeLogs.length)} of ${changeLogs.length}`
                        : '0-0 of 0'}
                    </Typography>
                    {Math.ceil(changeLogs.length / changeLogRowsPerPage) > 0 && (
                      <Pagination
                        count={Math.ceil(changeLogs.length / changeLogRowsPerPage)}
                        page={changeLogPage + 1}
                        onChange={(event, newPage) => setChangeLogPage(newPage - 1)}
                        color="primary"
                        size="small"
                        showFirstButton
                        showLastButton
                        sx={{
                          '& .MuiPaginationItem-root': { fontSize: '0.875rem', minWidth: '32px', height: '32px', borderRadius: '4px' },
                          '& .MuiPaginationItem-page.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'white !important',
                            borderRadius: '4px',
                            fontWeight: 500,
                            '&:hover': { backgroundColor: 'primary.dark', color: 'white !important' }
                          },
                          '& .MuiPaginationItem-page': { borderRadius: '4px', '&:hover': { backgroundColor: 'grey.100' } }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>

      {/* Hardware 편집 다이얼로그 */}
      {editDialog && (
        <HardwareEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          data={editingHardware ? (() => {
            console.log('🔍 editingHardware 전체 데이터:', editingHardware);
            console.log('🔍 주요 필드들:', {
              model: editingHardware.model,
              manufacturer: editingHardware.manufacturer,
              vendor: editingHardware.vendor,
              location: editingHardware.location,
              currentUser: editingHardware.currentUser,
              serialNumber: editingHardware.serialNumber
            });

            const hardwareRecord = {
              id: String(editingHardware.id),
              no: editingHardware.no,
              registrationDate: editingHardware.registrationDate,
              code: editingHardware.code,
              assetCategory: editingHardware.assetCategory || '',
              assetName: editingHardware.assetName || '',
              assetDescription: editingHardware.assetDescription || '',
              model: editingHardware.model || '',
              manufacturer: editingHardware.manufacturer || '',
              vendor: editingHardware.vendor || '',
              detailSpec: editingHardware.detailSpec || '',
              status: editingHardware.status,
              purchaseDate: editingHardware.purchaseDate || '',
              warrantyEndDate: editingHardware.warrantyEndDate || '',
              serialNumber: editingHardware.serialNumber || '',
              currentUser: editingHardware.currentUser || '',
              location: editingHardware.location || '',
              assignee: editingHardware.assignee,
              team: editingHardware.team || '',
              registrant: editingHardware.registrant || '',
              images: []
            };

            console.log('🔍 Dialog에 전달할 데이터:', hardwareRecord);
            return hardwareRecord;
          })() : null}
          mode={editingHardware ? 'edit' : 'add'}
          onSave={handleEditHardwareSave}
        />
      )}
    </Box>
  );
}
