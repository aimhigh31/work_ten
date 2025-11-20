'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
import VOCDataTable from 'views/apps/VOCDataTable';
import VOCEditDialog from 'components/VOCEditDialog';
import { vocData, vocStatusColors, assigneeAvatars, assignees, teams, vocStatusOptions } from 'data/voc';
import { VOCTableData, VOCStatus } from 'types/voc';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';
import { useMenuPermission } from '../../hooks/usePermissions';
import { useSupabaseVoc } from 'hooks/useSupabaseVoc';

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
import { TableDocument, Chart, Calendar, Element, DocumentText } from '@wandersonalwes/iconsax-react';

// ==============================|| VOC관리 메인 페이지 ||============================== //

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
      id={`voc-tabpanel-${index}`}
      aria-labelledby={`voc-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `voc-tab-${index}`,
    'aria-controls': `voc-tabpanel-${index}`
  };
}

// 칸반 뷰 컴포넌트
interface KanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  vocs: VOCTableData[];
  setVOCs: React.Dispatch<React.SetStateAction<VOCTableData[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string) => void;
  assigneeList?: any[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  users?: any[];
  getVocTypeName?: (subcode: string) => string;
  getPriorityName?: (subcode: string) => string;
  getStatusName?: (subcode: string) => string;
  getStatusCode?: (subcodeName: string) => string;
  updateVoc?: (id: number, voc: Partial<any>) => Promise<boolean>;
  onSaveVOC?: (updatedVOC: VOCTableData) => Promise<void>;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
  setSnackbar: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

function KanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  vocs,
  setVOCs,
  addChangeLog,
  assigneeList,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  users = [],
  getVocTypeName = (subcode: string) => subcode,
  getPriorityName = (subcode: string) => subcode,
  getStatusName = (subcode: string) => subcode,
  getStatusCode = (subcodeName: string) => subcodeName,
  updateVoc,
  onSaveVOC,
  snackbar,
  setSnackbar
}: KanbanViewProps) {
  // 세션 정보 가져오기
  const { data: session } = useSession();

  // 권한 체크 - 현재 사용자 확인
  const currentUser = useMemo(() => {
    if (!session?.user?.email || !users || users.length === 0) return null;
    const found = users.find((u: any) => u.email === session.user.email);
    console.log('🔐 KanbanView - currentUser:', found);
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 (createdBy 또는 assignee)
  const isDataOwner = useCallback((voc: VOCTableData) => {
    if (!currentUser) return false;
    const isCreator = voc.createdBy === currentUser.user_name;
    const isAssignee = voc.assignee === currentUser.user_name;
    console.log('🔐 KanbanView - isDataOwner:', {
      vocId: voc.id,
      currentUserName: currentUser.user_name,
      createdBy: voc.createdBy,
      assignee: voc.assignee,
      isCreator,
      isAssignee,
      isOwner: isCreator || isAssignee
    });
    return isCreator || isAssignee;
  }, [currentUser]);

  // 상태 관리
  const [activeVOC, setActiveVOC] = useState<VOCTableData | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingVOC, setEditingVOC] = useState<VOCTableData | null>(null);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = vocs.filter((voc) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const vocYear = new Date(voc.registrationDate).getFullYear().toString();
      if (vocYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && voc.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && voc.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && voc.status !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedVOC = vocs.find((voc) => voc.id === active.id);
    setActiveVOC(draggedVOC || null);
    setIsDraggingState(true);
  };

  // 카드 클릭 핸들러
  const handleCardClick = (voc: VOCTableData) => {
    setEditingVOC(voc);
    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingVOC(null);
  };

  // VOC 저장 핸들러
  const handleEditVOCSave = (updatedVOC: VOCTableData) => {
    // VOCEditDialog에서 이미 DB 저장 및 변경로그 생성이 완료됨
    // 여기서는 메모리 상태만 업데이트
    setVOCs((prev) => prev.map((voc) => (voc.id === updatedVOC.id ? updatedVOC : voc)));

    // 토스트 알림 표시
    const vocTitle = updatedVOC.workContent || updatedVOC.requestContent || updatedVOC.content || 'VOC';

    // 한글 받침 감지 함수
    const getKoreanParticle = (word: string): string => {
      const lastChar = word.charAt(word.length - 1);
      const code = lastChar.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const hasJongseong = (code - 0xAC00) % 28 !== 0;
        return hasJongseong ? '이' : '가';
      }
      return '가';
    };

    const josa = getKoreanParticle(vocTitle);
    setSnackbar({
      open: true,
      message: `${vocTitle}${josa} 성공적으로 수정되었습니다.`,
      severity: 'success'
    });

    handleEditDialogClose();
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveVOC(null);
    setIsDraggingState(false);

    if (!over) return;

    const vocId = active.id;
    const newStatusName = over.id as string; // 서브코드명 (예: '대기', '진행')
    const newStatusCode = getStatusCode(newStatusName); // 서브코드로 변환 (예: 'GROUP002-SUB001')

    // 상태가 변경된 경우만 업데이트
    const currentVOC = vocs.find((voc) => voc.id === vocId);
    if (currentVOC && currentVOC.status !== newStatusName) {
      const oldStatusName = currentVOC.status;

      // 로컬 상태 업데이트 (화면에는 서브코드명 사용)
      setVOCs((prev) => prev.map((voc) => (voc.id === vocId ? { ...voc, status: newStatusName } : voc)));

      // DB에 상태 변경 저장 (DB에는 서브코드 저장)
      if (updateVoc && typeof currentVOC.id === 'number') {
        try {
          console.log('🔄 칸반 드래그: 상태 변경 DB 저장 시작', {
            vocId: currentVOC.id,
            oldStatusName,
            newStatusName,
            newStatusCode
          });

          const success = await updateVoc(currentVOC.id, {
            status: newStatusCode // DB에는 서브코드 저장
          });

          if (!success) {
            throw new Error('DB 업데이트 실패');
          }

          console.log('✅ 칸반 드래그: 상태 변경 DB 저장 성공');

          // 토스트 알림 - 상태 변경 성공
          const vocTitle = currentVOC.content || currentVOC.title || 'VOC';
          const vocCode = currentVOC.code || `VOC-${vocId}`;
          setSnackbar({
            open: true,
            message: `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 상태가 ${oldStatusName} → ${newStatusName}로 수정 되었습니다.`,
            severity: 'success'
          });
        } catch (error) {
          console.error('🔴 칸반 드래그: 상태 변경 DB 저장 실패:', error);
          // 실패 시 원래 상태로 되돌림
          setVOCs((prev) => prev.map((voc) => (voc.id === vocId ? { ...voc, status: oldStatusName } : voc)));

          // 토스트 알림 - 에러
          setSnackbar({
            open: true,
            message: '상태 변경 저장에 실패했습니다.',
            severity: 'error'
          });
          return;
        }
      }

      // 변경로그 추가
      const vocCode = currentVOC.code || `VOC-${vocId}`;
      const vocTitle = currentVOC.content || currentVOC.title || 'VOC';
      const description = `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 상태가 ${oldStatusName} → ${newStatusName}로 수정 되었습니다.`;

      addChangeLog('수정', vocCode, description, currentVOC.team || '미분류', oldStatusName, newStatusName, '상태', vocTitle, '칸반탭');
    }
  };

  // 상태별 컬럼 정의 (표준화된 칸반 디자인)
  const statusColumns = [
    { key: '대기', title: '대기', pillBg: '#F5F5F5', pillColor: '#757575' },
    { key: '진행', title: '진행중', pillBg: '#E3F2FD', pillColor: '#1976D2' },
    { key: '완료', title: '완료', pillBg: '#E8F5E9', pillColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillBg: '#FFEBEE', pillColor: '#D32F2F' }
  ];

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
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

  // 요청유형별 색상
  const getRequestTypeColor = (requestType: string) => {
    const colorMap = {
      기능개선: { backgroundColor: '#E3F2FD', color: '#1976D2' },
      오류신고: { backgroundColor: '#FFEBEE', color: '#D32F2F' },
      문의: { backgroundColor: '#E0F2F1', color: '#388E3C' },
      기타: { backgroundColor: '#F3E5F5', color: '#7B1FA2' }
    };
    return colorMap[requestType as keyof typeof colorMap] || { backgroundColor: '#F5F5F5', color: '#666666' };
  };

  // 상태 태그 스타일 함수 (동적)
  const getStatusTagStyle = (status: string) => {
    const column = statusColumns.find((col) => col.key === status);
    if (column) {
      return {
        backgroundColor: column.pillBg,
        color: column.pillColor
      };
    }
    return { backgroundColor: '#F5F5F5', color: '#757575' };
  };

  // 팀별 색상
  const getTeamColor = (team: string) => {
    const colorMap = {
      개발팀: { backgroundColor: '#E8F5E8', color: '#2E7D32' },
      디자인팀: { backgroundColor: '#F3E5F5', color: '#7B1FA2' },
      기획팀: { backgroundColor: '#E0F2F1', color: '#00796B' },
      마케팅팀: { backgroundColor: '#FFF3E0', color: '#F57C00' }
    };
    return colorMap[team as keyof typeof colorMap] || { backgroundColor: '#F5F5F5', color: '#666666' };
  };

  // 상태별 진행률 계산
  const getProgressFromStatus = (status: string) => {
    switch (status) {
      case '대기':
        return 25;
      case '진행':
        return 75;
      case '완료':
        return 100;
      case '홀딩':
        return 10;
      default:
        return 0;
    }
  };

  // 드래그 가능한 카드 컴포넌트
  function DraggableCard({ voc, canEditOwn = true, canEditOthers = true, isDragDisabled = false }: { voc: VOCTableData; canEditOwn?: boolean; canEditOthers?: boolean; isDragDisabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: voc.id,
      disabled: isDragDisabled
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : 'pointer'
        }
      : { cursor: 'pointer' };

    // 사용자 프로필 이미지 가져오기 (최적화: find 한 번만 호출)
    const assigneeUser = React.useMemo(() => {
      return assigneeList?.find((user) => user.user_name === voc.assignee);
    }, [voc.assignee]);

    const assigneeAvatar = assigneeUser?.profile_image_url || assigneeUser?.avatar_url || '/assets/images/users/avatar-1.png';

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
            handleCardClick(voc);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(getStatusName(voc.status))}>
            {getStatusName(voc.status)}
          </span>
          <span className="incident-type-tag">{getVocTypeName(voc.vocType) || '일반요청'}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{voc.content || 'VOC내용 없음'}</h3>

        {/* 3. 정보 라인들 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">
              IT-VOC-{new Date(voc.registrationDate).getFullYear().toString().slice(-2)}-{String(voc.no).padStart(3, '0')}
            </span>
          </div>
          <div className="info-line">
            <span className="info-label">VOC유형:</span>
            <span className="info-value">{getVocTypeName(voc.vocType) || '미설정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">우선순위:</span>
            <span className="info-value">{getPriorityName(voc.priority) || '미설정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">완료일:</span>
            <span className="info-value">{voc.resolutionDate || '미정'}</span>
          </div>
        </div>

        {/* 4. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              src={assigneeAvatar}
              alt={voc.assignee || '담당자'}
              className="assignee-avatar"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지로 대체
                e.currentTarget.src = '/assets/images/users/avatar-1.png';
              }}
            />
            <span className="assignee-name">{voc.assignee || '미할당'}</span>
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

        .incident-type-tag {
          padding: 4px 12px;
          border-radius: 20px;
          background-color: rgba(156, 163, 175, 0.15);
          color: #4b5563;
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
        }

        .card-title {
          font: 600 16px/1.3 "Inter", "Noto Sans KR", sans-serif;
          color: #1f2937;
          margin: 0 0 3px 0;
        }

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
                {items.map((item) => {
                  const isDragDisabled = !(canEditOthers || (canEditOwn && isDataOwner(item)));
                  return <DraggableCard key={item.id} voc={item} canEditOwn={canEditOwn} canEditOthers={canEditOthers} isDragDisabled={isDragDisabled} />;
                })}

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

        <DragOverlay>
          {activeVOC ? (
            <DraggableCard
              voc={activeVOC}
              canEditOwn={canEditOwn}
              canEditOthers={canEditOthers}
              isDragDisabled={!(canEditOthers || (canEditOwn && isDataOwner(activeVOC)))}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* VOC 편집 다이얼로그 */}
      {editDialog && (
        <VOCEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          voc={editingVOC}
          onSave={handleEditVOCSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={vocStatusOptions}
          statusColors={vocStatusColors}
          teams={teams}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
          setSnackbar={setSnackbar}
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

// 월간일정 뷰 컴포넌트
interface MonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  vocs: VOCTableData[];
  onCardClick: (voc: VOCTableData) => void;
}

function MonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  vocs,
  onCardClick
}: MonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  // 데이터 필터링
  const filteredData = vocs.filter((voc) => {
    // 연도 필터 (메인 필터 사용)
    if (selectedYear !== '전체') {
      const vocYear = new Date(voc.registrationDate).getFullYear().toString();
      if (vocYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && voc.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && voc.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && voc.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (registrationDate 기준)
  const monthlyData: { [key: number]: VOCTableData[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.registrationDate);
    const month = date.getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(item);
  });

  // 월 이름 배열
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 상태별 색상 (VOC 상태에 맞게 수정)
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
            items.sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

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
                  const date = new Date(item.registrationDate);
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
                        title={item.content || 'VOC내용 없음'}
                      >
                        {item.content || 'VOC내용 없음'}
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
            items.sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

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
                  const date = new Date(item.registrationDate);
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
                        title={item.content || 'VOC내용 없음'}
                      >
                        {item.content || 'VOC내용 없음'}
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
  vocs: VOCTableData[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function ChangeLogView({
  changeLogs,
  vocs,
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
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600, width: 50, fontSize: '12px' }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 130, fontSize: '12px' }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 200, fontSize: '12px' }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 80, fontSize: '12px' }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '12px' }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '12px' }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 250, fontSize: '12px' }}>변경 세부내용</TableCell>
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
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {changeLogs.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500 }}>
                    {log.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.location}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.changedField || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
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
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.team}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
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

// 대시보드 뷰 컴포넌트
interface DashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
  vocs: VOCTableData[];
  getVocTypeName?: (subcode: string) => string;
  getPriorityName?: (subcode: string) => string;
  getStatusName?: (subcode: string) => string;
}

function DashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  selectedRecentStatus,
  setSelectedRecentStatus,
  vocs,
  getVocTypeName = (subcode: string) => subcode,
  getPriorityName = (subcode: string) => subcode,
  getStatusName = (subcode: string) => subcode
}: DashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: VOCTableData[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((voc) => {
      const vocDate = new Date(voc.registrationDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return vocDate >= start && vocDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return vocDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return vocDate <= end;
      }

      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(vocs).filter((voc) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const vocYear = new Date(voc.registrationDate).getFullYear().toString();
      if (vocYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && voc.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && voc.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && voc.status !== selectedStatus) return false;
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

  // VOC분류별 통계 (원형차트용) - vocType 필드 사용, 서브코드명으로 변환
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = getVocTypeName(item.vocType) || '기타';
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

  // 월별 통계 (막대차트용) - DB 실제 상태 값에 맞게 수정
  const monthlyStats: { month: string; 대기: number; 진행: number; 완료: number; 홀딩: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const date = new Date(item.registrationDate);
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
  console.log('🔍 VOC분류 데이터 확인:', {
    filteredData: filteredData.length,
    categoryStats,
    categoryLabels,
    categoryValues,
    sampleData: filteredData.slice(0, 3).map((item) => ({
      vocType: item.vocType,
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
  console.log('🔍 VOC담당 데이터 확인:', {
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
        text: 'VOC 건수'
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
        // 각 상태별 실제 값을 합산하여 정확한 총합 계산 (안전한 숫자 변환) - DB 실제 상태로 수정
        const 대기 = Number(item.대기) || 0;
        const 진행 = Number(item.진행) || 0;
        const 완료 = Number(item.완료) || 0;
        const 홀딩 = Number(item.홀딩) || 0;
        const total = 대기 + 진행 + 완료 + 홀딩;

        // 디버깅: 각 월의 데이터 확인
        console.log(`${item.month}: 대기=${대기}, 진행=${진행}, 완료=${완료}, 홀딩=${홀딩}, total=${total}`);

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
          VOC 현황 대시보드
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
              전체 VOC 현황
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
              대기중인 VOC
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
              진행중인 VOC
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
              완료된 VOC
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
              보류중인 VOC
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: VOC분류 - VOC목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* VOC분류 원형차트 */}
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
              VOC분류
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

        {/* VOC 목록 */}
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
              VOC 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>VOC내용</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>완료일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((voc, index) => (
                      <TableRow key={voc.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{filteredData.length - (startIndex + index)}</TableCell>
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
                          {voc.content || 'VOC내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{voc.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{voc.resolutionDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={getStatusName(voc.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(getStatusName(voc.status)),
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

      {/* 하단 레이아웃: VOC담당 - 월별VOC */}
      <Grid container spacing={3}>
        {/* VOC담당 원형차트 */}
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
              VOC담당
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

        {/* 월별 VOC현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 VOC현황
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

export default function VOCManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers } = useMenuPermission('/it/voc');

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 세션 및 사용자 정보
  const { data: session } = useSession();
  const user = useUser();
  const userName = user?.name || session?.user?.name || '시스템';

  // Supabase 훅 사용 (즉시 렌더링 - loading 상태 제거)
  const { users, departments, masterCodes } = useCommonData(); // 🏪 공용 창고에서 가져오기

  // 현재 로그인한 사용자 정보
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  // 마스터코드에서 상태 옵션 가져오기 (GROUP002의 서브코드만 필터링)
  const statusTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 VOC유형 옵션 가져오기 (GROUP023)
  const vocTypesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP023' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 우선순위 옵션 가져오기 (GROUP024)
  const priorityTypesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP024' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수들
  const getVocTypeName = React.useCallback((subcode: string) => {
    if (!subcode) return '미분류';
    const found = vocTypesMap.find(
      item => item.subcode === subcode || `${item.group_code}-${item.subcode}` === subcode
    );
    return found ? found.subcode_name : subcode;
  }, [vocTypesMap]);

  const getPriorityName = React.useCallback((subcode: string) => {
    if (!subcode) return '미분류';
    const found = priorityTypesMap.find(
      item => item.subcode === subcode || `${item.group_code}-${item.subcode}` === subcode
    );
    return found ? found.subcode_name : subcode;
  }, [priorityTypesMap]);

  const getStatusName = React.useCallback((subcode: string) => {
    if (!subcode) return '미분류';
    const found = statusTypes.find(
      item => item.subcode === subcode || `${item.group_code}-${item.subcode}` === subcode
    );
    return found ? found.subcode_name : subcode;
  }, [statusTypes]);

  // 서브코드명 → 서브코드 역변환 함수 (상태용)
  const getStatusCode = React.useCallback((subcodeName: string) => {
    const found = statusTypes.find(item => item.subcode_name === subcodeName);
    return found ? found.subcode : subcodeName;
  }, [statusTypes]);

  // ⭐ Investment 패턴: 데이터 로딩 함수만 가져오기 (KPI 패턴 적용)
  const {
    vocs: vocsFromHook,
    getVocs,
    getVocById,
    createVoc,
    updateVoc,
    deleteVoc,
    convertToVocData,
    convertToDbVocData,
    loading: vocLoading,
    error
  } = useSupabaseVoc();

  // 공유 VOCs 상태
  const [vocs, setVOCs] = useState<VOCTableData[]>([]);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingVOC, setEditingVOC] = useState<VOCTableData | null>(null);
  const [originalVOC, setOriginalVOC] = useState<VOCTableData | null>(null);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // Supabase 변경로그 훅 사용 (page='it_voc')
  const { logs, loading: changeLogLoading, error: changeLogError, fetchChangeLogs, addChangeLog: addSupabaseChangeLog, isAdding } = useSupabaseChangeLog('it_voc');

  // 변경로그 데이터 변환 (ChangeLogData -> ChangeLog)
  const changeLogs = React.useMemo(() => {
    return logs.map((log: ChangeLogData) => ({
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
      location: 'VOC관리',
      changedField: log.changed_field || undefined,
      beforeValue: log.before_value || undefined,
      afterValue: log.after_value || undefined,
      description: log.description,
      team: log.team || '시스템',
      user: log.user_name
    }));
  }, [logs]);

  // 필터 상태
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');
  const [selectedRecentStatus, setSelectedRecentStatus] = useState('전체');

  // ⭐ 초기 데이터 로딩
  React.useEffect(() => {
    const loadAllData = async () => {
      try {
        console.time('⚡ VOCManagement - 페이지 데이터 로딩');

        // ⚡ VOC만 로딩! (users, departments, masterCodes는 CommonData에 이미 있음)
        await getVocs(); // ✅ 훅 내부에서 setVocs 호출됨 (KPI 패턴)

        console.timeEnd('⚡ VOCManagement - 페이지 데이터 로딩');

        console.log('✅ VOCManagement 로딩 완료');
      } catch (error) {
        console.error('❌ 데이터 로딩 실패:', error);
      }
    };

    loadAllData();
  }, [getVocs]);

  // Supabase 데이터가 변경되면 vocs 상태 업데이트 (즉시 렌더링)
  useEffect(() => {
    console.log('🔍 Supabase VOC 데이터 상태:', {
      length: vocsFromHook.length,
      error,
      sampleData: vocsFromHook.slice(0, 2)
    });

    // DB 데이터를 프론트엔드 형식으로 변환
    const vocData = vocsFromHook.map((dbVoc) => {
      const converted = convertToVocData(dbVoc);

      // subcode를 subcode_name으로 변환
      return {
        ...converted,
        vocType: getVocTypeName(converted.vocType) || converted.vocType,
        priority: getPriorityName(converted.priority) || converted.priority,
        status: getStatusName(converted.status) || converted.status
      };
    });

    setVOCs(vocData);
    console.log('🔄 Supabase VOC 데이터를 VOCTableData로 변환 완료:', vocData.length + '개');

    if (vocData.length > 0) {
      console.log('📝 변환된 첫 번째 VOC 샘플:', vocData[0]);
    }
  }, [vocsFromHook, error, convertToVocData, getVocTypeName, getPriorityName, getStatusName]);

  // 변경로그 탭 전환 시 자동 갱신
  useEffect(() => {
    if (value === 4) {
      // 변경로그 탭으로 전환되면 최신 데이터 로드
      console.log('📊 변경로그 탭 활성화 - 최신 데이터 로드 중...');
      fetchChangeLogs();
    }
  }, [value, fetchChangeLogs]);

  // 연도 옵션 생성
  const currentYearValue = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYearValue - 3; i <= currentYearValue + 3; i++) {
    yearOptions.push(i.toString());
  }

  // 변경로그 추가 함수 (Supabase 버전)
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
      const logData = {
        page: 'it_voc',
        record_id: target,
        action_type: action,
        description: description,
        before_value: beforeValue || null,
        after_value: afterValue || null,
        changed_field: changedField || null,
        title: title || null,
        change_location: location || '개요탭',
        user_name: userName,
        team: currentUser?.department || '시스템',
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

  // 카드 클릭 핸들러 (하드웨어관리와 동일한 패턴)
  const handleCardClick = async (voc: VOCTableData) => {
    setEditingVOC(voc);

    // 🔍 DB에서 최신 데이터를 가져와서 원본으로 저장 (메모리 데이터는 구버전일 수 있음)
    try {
      const latestData = await getVocById(voc.id);
      if (latestData) {
        // DB 데이터를 VOCTableData 형식으로 변환
        const originalData: VOCTableData = {
          ...voc,
          customerName: latestData.customer_name || voc.customerName,
          companyName: latestData.company_name || voc.companyName,
          vocType: latestData.voc_type || voc.vocType,
          channel: latestData.channel || voc.channel,
          requestContent: latestData.content || voc.requestContent,
          workContent: latestData.content || voc.workContent,
          responseContent: latestData.response_content || voc.responseContent,
          actionContent: latestData.response_content || voc.actionContent,
          team: latestData.team || voc.team,
          assignee: latestData.assignee || voc.assignee,
          status: latestData.status || voc.status,
          priority: latestData.priority || voc.priority,
          resolutionDate: latestData.resolution_date || voc.resolutionDate,
          completedDate: latestData.resolution_date || voc.completedDate,
          registrationDate: latestData.registration_date || voc.registrationDate,
          receptionDate: latestData.reception_date || voc.receptionDate
        };
        setOriginalVOC(originalData);
        console.log('🔍 [handleCardClick] DB에서 가져온 최신 원본 데이터:', originalData);
      } else {
        setOriginalVOC(JSON.parse(JSON.stringify(voc)));
      }
    } catch (error) {
      console.error('❌ [handleCardClick] DB 조회 실패, 메모리 데이터 사용:', error);
      setOriginalVOC(JSON.parse(JSON.stringify(voc)));
    }

    setEditDialog(true);
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingVOC(null);
    setOriginalVOC(null);
  };

  // 받침 감지 함수
  const getKoreanParticle = (word: string): string => {
    const lastChar = word.charAt(word.length - 1);
    const code = lastChar.charCodeAt(0);

    // 한글 범위: 0xAC00 ~ 0xD7A3
    if (code >= 0xAC00 && code <= 0xD7A3) {
      // 받침이 있으면 (code - 0xAC00) % 28 !== 0
      const hasJongseong = (code - 0xAC00) % 28 !== 0;
      return hasJongseong ? '이' : '가';
    }
    return '가'; // 한글이 아닌 경우 기본값
  };

  // VOC 저장 핸들러 (데이터탭용)
  const handleEditVOCSave = (updatedVOC: VOCTableData) => {
    console.log('🔔 [handleEditVOCSave] 호출됨, originalVOC:', originalVOC ? 'exists' : 'null', 'updatedVOC:', updatedVOC);
    // VOCEditDialog에서 이미 DB 저장 및 변경로그 생성이 완료됨
    // 여기서는 로컬 상태 업데이트와 토스트 알림만 처리

    // 로컬 상태 업데이트
    setVOCs((prevVOCs) => prevVOCs.map((voc) => (voc.id === updatedVOC.id ? { ...updatedVOC } : voc)));

    // 토스트 알림 표시 (originalVOC 유무와 관계없이 항상 표시)
    let message = '';
    if (originalVOC) {
      // 필드 변경 감지 (fieldMap)
      const fieldMap: { [key: string]: string } = {
        vocType: 'VOC유형',
        workCategory: '업무분류',
        workContent: '요청내용',
        requestContent: '요청내용',
        content: '요청내용',
        actionContent: '조치내용',
        requester: '요청자',
        requestDate: '요청일',
        completedDate: '완료일',
        status: '상태',
        assignee: '담당자',
        team: '팀',
        customerName: 'VOC요청자',
        priority: '우선순위',
        responseContent: '처리내용'
      };

      const changedFields: string[] = [];
      Object.keys(fieldMap).forEach((key) => {
        const oldValue = (originalVOC as any)[key];
        const newValue = (updatedVOC as any)[key];

        if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
          changedFields.push(fieldMap[key]);
        }
      });

      // 토스트 메시지 생성 with Korean particle detection
      if (changedFields.length > 0) {
        const fieldsText = changedFields.join(', ');
        // 마지막 필드명의 받침 유무에 따라 조사 결정
        const lastField = changedFields[changedFields.length - 1];
        const josa = getKoreanParticle(lastField);
        message = `${updatedVOC.workContent || updatedVOC.requestContent || 'VOC'}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
      } else {
        // 필드 변경이 없는 경우
        const josa = getKoreanParticle(updatedVOC.workContent || updatedVOC.requestContent || 'VOC');
        message = `${updatedVOC.workContent || updatedVOC.requestContent || 'VOC'}${josa} 성공적으로 수정되었습니다.`;
      }
    } else {
      // originalVOC가 없는 경우 (칸반 탭 수정 시 발생 가능)
      const vocTitle = updatedVOC.workContent || updatedVOC.requestContent || 'VOC';
      const josa = getKoreanParticle(vocTitle);
      message = `${vocTitle}${josa} 성공적으로 수정되었습니다.`;
      console.log('⚠️ originalVOC가 없어서 기본 토스트 알림 표시');
    }

    // 토스트 알림 표시
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });

    if (originalVOC) {

      // 변경로그 생성 전 originalVOC 존재 확인 (하드웨어관리 패턴)
      if (!originalVOC) {
        console.log('⚠️ originalVOC가 없어서 변경로그 생성 불가');
        handleEditDialogClose();
        return;
      }

      // 변경로그 추가 (하드웨어관리와 동일한 방식으로 필드별 세밀하게 추적)
      console.log('🔍 [handleEditVOCSave] 변경로그 생성 시작');
      console.log('🔍 [handleEditVOCSave] originalVOC:', originalVOC);
      console.log('🔍 [handleEditVOCSave] updatedVOC:', updatedVOC);

      const vocCode = updatedVOC.code || `VOC-${updatedVOC.id}`;
      const vocTitle = updatedVOC.requestContent || updatedVOC.workContent || 'VOC';
      const normalizeValue = (value: any) => (value === undefined || value === null || value === '' ? '' : String(value).trim());

      // VOC요청자 변경
      if (originalVOC.customerName !== updatedVOC.customerName &&
          normalizeValue(originalVOC.customerName) !== normalizeValue(updatedVOC.customerName)) {
        console.log('✅ [변경로그] VOC요청자 변경 감지:', originalVOC.customerName, '→', updatedVOC.customerName);
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 VOC요청자가 ${originalVOC.customerName || ''} → ${updatedVOC.customerName || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalVOC.customerName || '',
          updatedVOC.customerName || '',
          'VOC요청자',
          vocTitle,
          '칸반탭'
        );
      }

      // VOC유형 변경
      if (originalVOC.vocType !== updatedVOC.vocType &&
          normalizeValue(originalVOC.vocType) !== normalizeValue(updatedVOC.vocType)) {
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 VOC유형이 ${originalVOC.vocType || ''} → ${updatedVOC.vocType || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalVOC.vocType || '',
          updatedVOC.vocType || '',
          'VOC유형',
          vocTitle,
          '칸반탭'
        );
      }

      // 우선순위 변경
      if (originalVOC.priority !== updatedVOC.priority &&
          normalizeValue(originalVOC.priority) !== normalizeValue(updatedVOC.priority)) {
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 우선순위가 ${originalVOC.priority || ''} → ${updatedVOC.priority || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalVOC.priority || '',
          updatedVOC.priority || '',
          '우선순위',
          vocTitle,
          '칸반탭'
        );
      }

      // 요청내용 변경
      const originalContent = originalVOC.requestContent || originalVOC.workContent || '';
      const updatedContent = updatedVOC.requestContent || updatedVOC.workContent || '';
      if (normalizeValue(originalContent) !== normalizeValue(updatedContent)) {
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 요청내용이 ${originalContent || ''} → ${updatedContent || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalContent || '',
          updatedContent || '',
          '요청내용',
          vocTitle,
          '칸반탭'
        );
      }

      // 처리내용 변경
      const originalResponse = originalVOC.responseContent || originalVOC.actionContent || '';
      const updatedResponse = updatedVOC.responseContent || updatedVOC.actionContent || '';
      if (normalizeValue(originalResponse) !== normalizeValue(updatedResponse)) {
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 처리내용이 ${originalResponse || ''} → ${updatedResponse || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalResponse || '',
          updatedResponse || '',
          '처리내용',
          vocTitle,
          '칸반탭'
        );
      }

      // 상태 변경
      if (originalVOC.status !== updatedVOC.status &&
          normalizeValue(originalVOC.status) !== normalizeValue(updatedVOC.status)) {
        console.log('✅ [변경로그] 상태 변경 감지:', originalVOC.status, '→', updatedVOC.status);
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 상태가 ${originalVOC.status || ''} → ${updatedVOC.status || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalVOC.status || '',
          updatedVOC.status || '',
          '상태',
          vocTitle,
          '칸반탭'
        );
      }

      // 담당자 변경
      if (originalVOC.assignee !== updatedVOC.assignee &&
          normalizeValue(originalVOC.assignee) !== normalizeValue(updatedVOC.assignee)) {
        console.log('✅ [변경로그] 담당자 변경 감지:', originalVOC.assignee, '→', updatedVOC.assignee);
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 담당자가 ${originalVOC.assignee || ''} → ${updatedVOC.assignee || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalVOC.assignee || '',
          updatedVOC.assignee || '',
          '담당자',
          vocTitle,
          '칸반탭'
        );
      }

      // 팀 변경
      if (originalVOC.team !== updatedVOC.team &&
          normalizeValue(originalVOC.team) !== normalizeValue(updatedVOC.team)) {
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 팀이 ${originalVOC.team || ''} → ${updatedVOC.team || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalVOC.team || '',
          updatedVOC.team || '',
          '팀',
          vocTitle,
          '칸반탭'
        );
      }

      // 완료일 변경
      const originalCompletedDate = originalVOC.completedDate || originalVOC.resolutionDate || '';
      const updatedCompletedDate = updatedVOC.completedDate || updatedVOC.resolutionDate || '';
      if (normalizeValue(originalCompletedDate) !== normalizeValue(updatedCompletedDate)) {
        addChangeLog(
          '수정',
          vocCode,
          `VOC관리 ${vocTitle}(${vocCode}) 개요탭의 완료일이 ${originalCompletedDate || ''} → ${updatedCompletedDate || ''}로 수정 되었습니다.`,
          updatedVOC.team || '미분류',
          originalCompletedDate || '',
          updatedCompletedDate || '',
          '완료일',
          vocTitle,
          '칸반탭'
        );
      }

      console.log('🎉 [handleEditVOCSave] 변경로그 생성 완료');
    } else {
      // 새로 생성
      setVOCs((prevVOCs) => [...prevVOCs, updatedVOC]);

      // 성공 알림
      const vocTitle = updatedVOC.requestContent || updatedVOC.workContent || 'VOC';
      const vocCode = updatedVOC.code;

      setSnackbar({
        open: true,
        message: `VOC관리 ${vocTitle}(${vocCode})의 데이터가 추가 되었습니다.`,
        severity: 'success'
      });

      addChangeLog('추가', vocCode, `VOC관리 ${vocTitle}(${vocCode})의 데이터가 추가 되었습니다.`, updatedVOC.team);
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
                VOC관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                IT메뉴 &gt; VOC관리
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
                  aria-label="VOC관리 탭"
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
                <VOCDataTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  vocs={vocs}
                  setVOCs={setVOCs}
                  addChangeLog={addChangeLog}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                  users={users}
                  snackbar={snackbar}
                  setSnackbar={setSnackbar}
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
                  vocs={vocs}
                  setVOCs={setVOCs}
                  addChangeLog={addChangeLog}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                  users={users}
                  getVocTypeName={getVocTypeName}
                  getPriorityName={getPriorityName}
                  getStatusName={getStatusName}
                  getStatusCode={getStatusCode}
                  updateVoc={updateVoc}
                  snackbar={snackbar}
                  setSnackbar={setSnackbar}
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
                  vocs={vocs}
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
                  vocs={vocs}
                  getVocTypeName={getVocTypeName}
                  getPriorityName={getPriorityName}
                  getStatusName={getStatusName}
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
                  vocs={vocs}
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

      {/* VOC 편집 다이얼로그 */}
      {editDialog && (
        <VOCEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          voc={editingVOC}
          onSave={handleEditVOCSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={vocStatusOptions}
          statusColors={vocStatusColors}
          teams={teams}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
          setSnackbar={setSnackbar}
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
