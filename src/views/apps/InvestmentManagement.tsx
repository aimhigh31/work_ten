'use client';

import React, { useState, useEffect, useMemo } from 'react';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';
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
  Stack,
  Avatar,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import InvestmentDataTable from 'views/apps/InvestmentDataTable';
import InvestmentEditDialog from 'components/InvestmentEditDialog';
import {
  investmentStatusColors,
  investmentAssigneeAvatars
} from 'data/investment';
import { InvestmentTableData, InvestmentStatus, InvestmentData } from 'types/investment';
import { ThemeMode } from 'config';

// hooks
import { useSupabaseInvestment } from 'hooks/useSupabaseInvestment';
import { useSupabaseInvestmentFinance } from 'hooks/useSupabaseInvestmentFinance';
import { useSupabaseDepartmentManagement } from 'hooks/useSupabaseDepartmentManagement';
import { useSupabaseUserManagement } from 'hooks/useSupabaseUserManagement';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';

// Icons
import { TableDocument, Calendar, Element, DocumentText, Chart } from '@wandersonalwes/iconsax-react';

// 변경 로그 인터페이스

// ==============================|| 투자관리 메인 페이지 ||============================== //

// TabPanel 컴포넌트
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
      id={`investment-tabpanel-${index}`}
      aria-labelledby={`investment-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `investment-tab-${index}`,
    'aria-controls': `investment-tabpanel-${index}`
  };
}

// 칸반 뷰 컴포넌트
interface KanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  investments: InvestmentTableData[];
  setInvestments: React.Dispatch<React.SetStateAction<InvestmentTableData[]>>;
  addChangeLog: (category: string, code: string, description: string, team: string) => void;
  onCardClick: (investment: InvestmentTableData) => void;
  assigneeList?: any[];
}

function KanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  investments,
  setInvestments,
  addChangeLog,
  onCardClick,
  assigneeList
}: KanbanViewProps) {
  const theme = useTheme();

  // 칸반 관련 상태
  const [activeInvestment, setActiveInvestment] = useState<any>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 드래그 센서 설정 (표준화)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 상태별 컬럼 정의 (표준화된 칸반 디자인)
  const statusColumns = [
    { key: '대기', title: '대기', pillBg: '#F0F0F0', pillColor: '#424242' },
    { key: '진행', title: '진행', pillBg: '#E3F2FD', pillColor: '#1976D2' },
    { key: '완료', title: '완료', pillBg: '#E8F5E8', pillColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillBg: '#FFEBEE', pillColor: '#D32F2F' }
  ];

  const filteredData = investments.filter((investment) => {
    if (selectedYear !== '전체') {
      const investmentYear = new Date(investment.startDate).getFullYear().toString();
      if (investmentYear !== selectedYear) return false;
    }
    if (selectedTeam !== '전체' && investment.team !== selectedTeam) return false;
    if (selectedStatus !== '전체' && investment.status !== selectedStatus) return false;
    return true;
  });

  const getItemsByStatus = (status: string) => {
    return filteredData.filter((investment) => investment.status === status);
  };

  // 담당자별 아바타 매핑
  const assigneeAvatars = {
    김투자: '/assets/images/users/avatar-1.png',
    이기획: '/assets/images/users/avatar-2.png',
    박분석: '/assets/images/users/avatar-3.png',
    최검토: '/assets/images/users/avatar-4.png',
    정승인: '/assets/images/users/avatar-5.png'
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const investment = investments.find((item) => item.id === active.id);
    setActiveInvestment(investment);
    setIsDraggingState(true);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveInvestment(null);
    setIsDraggingState(false);

    if (!over) return;

    const investmentId = active.id;
    const newStatus = over.id as string;

    // 상태가 변경된 경우만 업데이트
    const currentInvestment = investments.find((investment) => investment.id === investmentId);
    if (currentInvestment && currentInvestment.status !== newStatus) {
      setInvestments((prev) =>
        prev.map((investment) => (investment.id === investmentId ? { ...investment, status: newStatus } : investment))
      );

      // 변경로그 추가 - 칸반에서 상태 변경
      const investmentCode = currentInvestment.code || `PLAN-INV-25-${String(currentInvestment.id).padStart(3, '0')}`;
      const description = `${currentInvestment.investmentName || '투자'} 상태를 "${currentInvestment.status}"에서 "${newStatus}"로 변경`;
      addChangeLog('상태 변경', investmentCode, description, currentInvestment.team || '미분류');
    }
  };

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

  // 상태 태그 스타일 함수
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

  // 드래그 가능한 투자 카드 컴포넌트 (5단계 구조)
  function DraggableInvestmentCard({ investment }: { investment: any }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: investment.id
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
          if (!isDraggingState && !isDragging) {
            e.stopPropagation();
            onCardClick(investment);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(investment.status)}>
            {investment.status}
          </span>
          <span className="incident-type-tag">{investment.investmentType || '일반투자'}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{investment.investmentName || '투자명 없음'}</h3>

        {/* 3. 정보 라인들 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{investment.code || `PLAN-INV-25-${String(investment.id).padStart(3, '0')}`}</span>
          </div>
          <div className="info-line">
            <span className="info-label">팀:</span>
            <span className="info-value">{investment.team || '미분류'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">시작일:</span>
            <span className="info-value">{investment.startDate || '미설정'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">투자금액:</span>
            <span className="info-value">
              {investment.investmentAmount ? `${investment.investmentAmount.toLocaleString()}원` : '미설정'}
            </span>
          </div>
        </div>

        {/* 4. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              src={
                assigneeList?.find((user) => user.user_name === investment.assignee)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === investment.assignee)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={investment.assignee || '담당자'}
              className="assignee-avatar"
            />
            <span className="assignee-name">{investment.assignee || '미할당'}</span>
          </div>
        </div>
      </article>
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
        /* 칸반 보드 레이아웃 */
        .kanban-board {
          display: flex;
          gap: 32px;
          padding: 24px 24px 0 24px;
          overflow-x: auto;
          height: 100%;
        }
        
        /* 스크롤바 스타일 */
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
            const investments = getItemsByStatus(column.key);
            return (
              <DroppableColumn key={column.key} column={column}>
                {investments.map((investment) => (
                  <DraggableInvestmentCard key={investment.id} investment={investment} />
                ))}

                {/* 빈 칼럼 메시지 */}
                {investments.length === 0 && (
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
                    {column.title} 상태인 투자가 없습니다
                  </div>
                )}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>{activeInvestment ? <DraggableInvestmentCard investment={activeInvestment} /> : null}</DragOverlay>
      </DndContext>
    </Box>
  );
}

// 월간 일정 뷰 컴포넌트
interface MonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedInvestmentType: string;
  investments: any[];
  onCardClick: (investment: any) => void;
}

function MonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedInvestmentType,
  investments,
  onCardClick
}: MonthlyScheduleViewProps) {
  const theme = useTheme();

  // 데이터 필터링
  const filteredData = investments.filter((investment) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const investmentYear = new Date(investment.startDate).getFullYear().toString();
      if (investmentYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && investment.team !== selectedTeam) return false;

    // 투자유형 필터
    if (selectedInvestmentType !== '전체' && investment.investmentType !== selectedInvestmentType) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && investment.status !== selectedStatus) return false;

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
        {/* 2x6 그리드 월간 일정 */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
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
                          title={item.investmentName || '투자명 없음'}
                        >
                          {item.investmentName || '투자명 없음'}
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
                          title={item.investmentName || '투자명 없음'}
                        >
                          {item.investmentName || '투자명 없음'}
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
interface InvestmentDashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  investments: InvestmentTableData[];
}

function InvestmentDashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  investments
}: InvestmentDashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: InvestmentTableData[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((investment) => {
      const investmentDate = new Date(investment.startDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return investmentDate >= start && investmentDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return investmentDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return investmentDate <= end;
      }

      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(investments).filter((investment) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const investmentYear = new Date(investment.startDate).getFullYear().toString();
      if (investmentYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && investment.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && investment.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && investment.status !== selectedStatus) return false;
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

  // 투자유형별 통계 (원형차트용)
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = item.investmentType || '기타';
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
        text: '투자 건수'
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
          투자 현황 대시보드
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
              전체 투자 현황
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
              완료된 투자
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
              진행중인 투자
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
              홀딩중인 투자
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
              대기중인 투자
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 투자유형 - 투자목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 투자유형 원형차트 */}
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
              투자유형
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

        {/* 투자 목록 */}
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
              투자 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>투자명</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>완료일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((investment) => (
                      <TableRow key={investment.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{investment.no}</TableCell>
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
                          {investment.investmentName || '투자명 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{investment.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{investment.completedDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={investment.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(investment.status),
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

      {/* 하단 레이아웃: 투자담당 - 월별투자 */}
      <Grid container spacing={3}>
        {/* 투자담당 원형차트 */}
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
              투자담당
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

        {/* 월별 투자현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 투자현황
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

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  investments: InvestmentData[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

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

function ChangeLogView({
  changeLogs,
  investments,
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
      case '투자팀':
        return '#E3F2FD';
      case '분석팀':
        return '#F3E5F5';
      case '자산운용팀':
        return '#E0F2F1';
      case '리스크관리팀':
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
              <TableCell sx={{ fontWeight: 600, width: 50 }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 110 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>변경필드</TableCell>
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
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
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

// 메인 투자관리 컴포넌트
export default function InvestmentManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [value, setValue] = useState(0);

  // Supabase 투자관리 연동
  const { getInvestments, createInvestment, updateInvestment, deleteInvestment, convertToInvestmentData, convertToDbInvestmentData, loading, error } = useSupabaseInvestment();
  const { saveFinanceItems } = useSupabaseInvestmentFinance();
  const { departments, fetchDepartments } = useSupabaseDepartmentManagement();
  const { users } = useSupabaseUserManagement();
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // Supabase 변경로그 연동
  const { data: session } = useSession();
  const user = useUser();
  const userName = user?.name || session?.user?.name || '시스템';
  const currentUser = users.find((u) => u.email === session?.user?.email);
  const { logs: changeLogData, fetchChangeLogs } = useSupabaseChangeLog('plan_investment');

  // userName 디버깅
  React.useEffect(() => {
    console.log('🔍 userName 디버깅:', {
      'user?.name': user?.name,
      'session?.user?.name': session?.user?.name,
      '최종 userName': userName
    });
  }, [user, session, userName]);

  // 부서 데이터 로드
  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // 마스터코드에서 상태 옵션 가져오기
  const statusTypes = React.useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  // 투자 데이터 상태 - 모든 탭에서 공유
  const [investments, setInvestments] = useState<InvestmentTableData[]>([]);

  // 동적 데이터 상태
  const [investmentTypeOptions, setInvestmentTypeOptions] = useState<string[]>([]);

  // 필터 상태
  const [selectedInvestmentType, setSelectedInvestmentType] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');

  // 편집 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentInvestment, setCurrentInvestment] = useState<InvestmentTableData | null>(null);

  // 변경로그 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // changeLogData를 ChangeLog 형식으로 변환
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
      const logData = {
        page: 'plan_investment',
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

  // 변경로그 데이터 로드
  useEffect(() => {
    console.log('📋 변경로그 데이터 로드 시작');
    fetchChangeLogs();
  }, [fetchChangeLogs]);

  // 변경로그 데이터 디버깅
  useEffect(() => {
    console.log('📊 changeLogData:', changeLogData);
    console.log('📊 changeLogs (변환된 데이터):', changeLogs);
  }, [changeLogData, changeLogs]);

  // Supabase에서 투자 데이터 로드
  useEffect(() => {
    const loadInvestments = async () => {
      try {
        const dbInvestments = await getInvestments();
        const convertedInvestments = dbInvestments.map(convertToInvestmentData);

        // NO 필드를 프론트엔드에서 역순으로 할당 (최신이 1번)
        setInvestments(assignNoToInvestments(convertedInvestments));
      } catch (error) {
        console.error('투자 데이터 로드 실패:', error);
      }
    };

    loadInvestments();
  }, [getInvestments, convertToInvestmentData]);

  // 마스터코드 데이터 로드 (투자유형)
  useEffect(() => {
    const loadMasterCodes = async () => {
      const investmentTypes = await getSubCodesByGroup('GROUP025');
      setInvestmentTypeOptions(investmentTypes.map(item => item.subCodeName));
    };
    loadMasterCodes();
  }, [getSubCodesByGroup]);

  // NO 할당 헬퍼 함수
  const assignNoToInvestments = (investments: InvestmentData[]) => {
    const sortedByDate = investments.sort((a, b) =>
      new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
    );

    return sortedByDate.map((investment, index) => ({
      ...investment,
      no: index + 1
    }));
  };

  // 투자 저장 함수 (생성/수정)
  const handleSaveInvestment = async (investmentData: InvestmentData) => {
    try {
      console.log('💾 저장할 투자 데이터 (프론트엔드 형식):', JSON.stringify(investmentData, null, 2));

      // 필수 필드 검증
      if (!investmentData.investmentName || !investmentData.investmentName.trim()) {
        alert('투자명을 입력해주세요.');
        return;
      }
      if (!investmentData.investmentType || !investmentData.investmentType.trim()) {
        alert('투자유형을 선택해주세요.');
        return;
      }
      if (!investmentData.team || !investmentData.team.trim()) {
        alert('팀을 선택해주세요.');
        return;
      }
      if (!investmentData.assignee || !investmentData.assignee.trim()) {
        alert('담당자를 선택해주세요.');
        return;
      }

      const dbData = convertToDbInvestmentData(investmentData);
      console.log('💾 변환된 DB 데이터:', JSON.stringify(dbData, null, 2));

      if (currentInvestment) {
        // 수정
        console.log('🔄 투자 업데이트 시작, ID:', currentInvestment.id);

        // 원본 데이터 저장
        const originalInvestment = { ...currentInvestment };
        const updatedInvestment = investmentData;
        const investmentCode = updatedInvestment.code;
        const investmentName = updatedInvestment.investmentName || '투자';

        // 필드별 변경사항 추적 (변경로그를 먼저 기록)
        if (originalInvestment.investmentType !== updatedInvestment.investmentType) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 투자유형이 ${originalInvestment.investmentType || ''} → ${updatedInvestment.investmentType || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.investmentType || '',
            updatedInvestment.investmentType || '',
            '투자유형',
            investmentName
          );
        }

        if (originalInvestment.investmentName !== updatedInvestment.investmentName) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 투자명이 ${originalInvestment.investmentName || ''} → ${updatedInvestment.investmentName || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.investmentName || '',
            updatedInvestment.investmentName || '',
            '투자명',
            investmentName
          );
        }

        if (originalInvestment.description !== updatedInvestment.description) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 설명이 ${originalInvestment.description || ''} → ${updatedInvestment.description || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.description || '',
            updatedInvestment.description || '',
            '설명',
            investmentName
          );
        }

        if (originalInvestment.amount !== updatedInvestment.amount) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 투자금액이 ${originalInvestment.amount || ''} → ${updatedInvestment.amount || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            String(originalInvestment.amount || ''),
            String(updatedInvestment.amount || ''),
            '투자금액',
            investmentName
          );
        }

        if (originalInvestment.team !== updatedInvestment.team) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 팀이 ${originalInvestment.team || ''} → ${updatedInvestment.team || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.team || '',
            updatedInvestment.team || '',
            '팀',
            investmentName
          );
        }

        if (originalInvestment.assignee !== updatedInvestment.assignee) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 담당자가 ${originalInvestment.assignee || ''} → ${updatedInvestment.assignee || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.assignee || '',
            updatedInvestment.assignee || '',
            '담당자',
            investmentName
          );
        }

        if (originalInvestment.status !== updatedInvestment.status) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 상태가 ${originalInvestment.status || ''} → ${updatedInvestment.status || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.status || '',
            updatedInvestment.status || '',
            '상태',
            investmentName
          );
        }

        if (originalInvestment.startDate !== updatedInvestment.startDate) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 시작일이 ${originalInvestment.startDate || ''} → ${updatedInvestment.startDate || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.startDate || '',
            updatedInvestment.startDate || '',
            '시작일',
            investmentName
          );
        }

        if (originalInvestment.completedDate !== updatedInvestment.completedDate) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 완료일이 ${originalInvestment.completedDate || ''} → ${updatedInvestment.completedDate || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.completedDate || '',
            updatedInvestment.completedDate || '',
            '완료일',
            investmentName
          );
        }

        if (originalInvestment.expectedReturn !== updatedInvestment.expectedReturn) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 기대수익률이 ${originalInvestment.expectedReturn || ''} → ${updatedInvestment.expectedReturn || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            String(originalInvestment.expectedReturn || ''),
            String(updatedInvestment.expectedReturn || ''),
            '기대수익률',
            investmentName
          );
        }

        if (originalInvestment.actualReturn !== updatedInvestment.actualReturn) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 실제수익률이 ${originalInvestment.actualReturn || ''} → ${updatedInvestment.actualReturn || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            String(originalInvestment.actualReturn || ''),
            String(updatedInvestment.actualReturn || ''),
            '실제수익률',
            investmentName
          );
        }

        if (originalInvestment.riskLevel !== updatedInvestment.riskLevel) {
          await addChangeLog(
            '수정',
            investmentCode,
            `투자관리 ${investmentName}(${investmentCode}) 정보의 개요탭 위험도가 ${originalInvestment.riskLevel || ''} → ${updatedInvestment.riskLevel || ''} 로 수정 되었습니다.`,
            updatedInvestment.team || '미분류',
            originalInvestment.riskLevel || '',
            updatedInvestment.riskLevel || '',
            '위험도',
            investmentName
          );
        }

        const success = await updateInvestment(currentInvestment.id, dbData);
        console.log('✅ 업데이트 결과:', success);
        if (success) {
          // 투자금액 데이터 저장
          const getCurrentAmountData = (window as any).getCurrentAmountData;
          console.log('🔍 getCurrentAmountData 함수 존재 여부:', !!getCurrentAmountData);

          if (getCurrentAmountData) {
            const amountData = getCurrentAmountData();
            console.log('💰 투자금액 데이터:', amountData?.length || 0, '개', amountData);

            if (amountData && amountData.length > 0) {
              const financeItems = amountData.map((item: any, index: number) => ({
                investment_id: currentInvestment.id,
                item_order: index + 1,
                investment_category: item.investmentCategory || '',
                item_name: item.itemName || '',
                budget_amount: parseFloat(item.budgetAmount) || 0,
                execution_amount: parseFloat(item.executionAmount) || 0,
                remarks: item.remarks || ''
              }));

              await saveFinanceItems(currentInvestment.id, financeItems);
              console.log('✅ 투자금액 데이터 저장 완료');
            }
          }

          // 데이터 새로고침 및 NO 재할당
          const dbInvestments = await getInvestments();
          const convertedInvestments = dbInvestments.map(convertToInvestmentData);

          setInvestments(assignNoToInvestments(convertedInvestments));
        }
      } else {
        // 생성
        // 코드 자동 생성 (DB의 id 기반)
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const dbInvestments = await getInvestments();
        const maxId = Math.max(...dbInvestments.map(inv => inv.id || 0), 0);
        const newCode = `PLAN-INV-${currentYear}-${String(maxId + 1).padStart(3, '0')}`;

        const newInvestmentData = {
          ...dbData,
          code: newCode
        };

        console.log('🆕 신규 투자 생성 시작, 코드:', newCode);
        const newInvestment = await createInvestment(newInvestmentData);
        console.log('📊 생성된 투자:', newInvestment);

        if (newInvestment) {
          // 투자금액 데이터 저장
          const getCurrentAmountData = (window as any).getCurrentAmountData;
          console.log('🔍 getCurrentAmountData 함수 존재 여부:', !!getCurrentAmountData);

          if (getCurrentAmountData) {
            const amountData = getCurrentAmountData();
            console.log('💰 투자금액 데이터:', amountData?.length || 0, '개', amountData);

            if (amountData && amountData.length > 0) {
              const financeItems = amountData.map((item: any, index: number) => ({
                investment_id: newInvestment.id,
                item_order: index + 1,
                investment_category: item.investmentCategory || '',
                item_name: item.itemName || '',
                budget_amount: parseFloat(item.budgetAmount) || 0,
                execution_amount: parseFloat(item.executionAmount) || 0,
                remarks: item.remarks || ''
              }));

              await saveFinanceItems(newInvestment.id, financeItems);
              console.log('✅ 투자금액 데이터 저장 완료');
            }
          }

          // 데이터 새로고침 및 NO 재할당
          const updatedDbInvestments = await getInvestments();
          const convertedInvestments = updatedDbInvestments.map(convertToInvestmentData);

          setInvestments(assignNoToInvestments(convertedInvestments));

          // 변경로그 추가
          const investmentName = investmentData.investmentName || '새 투자';
          await addChangeLog(
            '추가',
            newCode,
            `투자관리 ${investmentName}(${newCode})이 신규 등록되었습니다.`,
            investmentData.team || '미분류',
            undefined,
            undefined,
            undefined,
            investmentName
          );
          console.log('✅ 신규 투자 생성 완료');
        } else {
          console.error('❌ 투자 생성 실패: createInvestment가 null을 반환했습니다.');
          alert('투자 생성에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      }

      setEditDialogOpen(false);
      setCurrentInvestment(null);
    } catch (error) {
      console.error('❌ 투자 저장 실패:', error);
      alert(`투자 저장에 실패했습니다.\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 투자 삭제 함수
  const handleDeleteInvestment = async (investment: InvestmentData) => {
    try {
      const investmentName = investment.investmentName || '투자';

      // 변경로그 추가 (삭제 전에 호출)
      await addChangeLog(
        '삭제',
        investment.code,
        `투자관리 ${investmentName}(${investment.code})이 삭제되었습니다.`,
        investment.team || '미분류',
        undefined,
        undefined,
        undefined,
        investmentName
      );

      const success = await deleteInvestment(investment.id);
      if (success) {
        // 데이터 새로고침 및 NO 재할당
        const dbInvestments = await getInvestments();
        const convertedInvestments = dbInvestments.map(convertToInvestmentData);

        setInvestments(assignNoToInvestments(convertedInvestments));
      }
    } catch (error) {
      console.error('투자 삭제 실패:', error);
    }
  };

  const handleChangeLogPageChange = (newPage: number) => {
    setChangeLogPage(newPage);
  };

  const handleChangeLogRowsPerPageChange = (newRowsPerPage: number) => {
    setChangeLogRowsPerPage(newRowsPerPage);
    setChangeLogPage(0);
  };

  const handleGoToPageChange = (page: string) => {
    setGoToPage(page);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
                투자관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                기획메뉴 &gt; 투자관리
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
              onChange={handleTabChange}
              aria-label="투자관리 탭"
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
                  {yearOptions.map((year, index) => (
                    <MenuItem key={`year-${index}-${year}`} value={year}>
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

              {/* 담당자 필터 - 칸반탭에서는 숨김 */}
              {value !== 1 && (
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
              )}

              {/* 투자유형 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>투자유형</InputLabel>
                <Select
                  value={selectedInvestmentType}
                  label="투자유형"
                  onChange={(e) => setSelectedInvestmentType(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {investmentTypeOptions.map((type, index) => (
                    <MenuItem key={`type-${index}-${type}`} value={type}>
                      {type}
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
          <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <TabPanel value={value} index={0}>
              <InvestmentDataTable
                selectedInvestmentType={selectedInvestmentType}
                selectedStatus={selectedStatus}
                selectedYear={selectedYear}
                selectedTeam={selectedTeam}
                selectedAssignee={selectedAssignee}
                investments={investments}
                setInvestments={setInvestments}
                onEditInvestment={(investment) => {
                  setCurrentInvestment(investment);
                  setEditDialogOpen(true);
                }}
                onAddInvestment={() => {
                  console.log('onAddInvestment 호출됨');
                  console.log('현재 editDialogOpen 상태:', editDialogOpen);
                  setCurrentInvestment(null);
                  setEditDialogOpen(true);
                  console.log('editDialogOpen을 true로 설정함');
                }}
                onDeleteInvestments={(investmentsToDelete) => {
                  investmentsToDelete.forEach(investment => {
                    handleDeleteInvestment(investment);
                  });
                }}
                addChangeLog={addChangeLog}
              />
            </TabPanel>

            <TabPanel value={value} index={1}>
              <KanbanView
                selectedYear={selectedYear}
                selectedTeam={selectedTeam}
                selectedStatus={selectedStatus}
                investments={investments}
                setInvestments={setInvestments}
                addChangeLog={addChangeLog}
                onCardClick={(investment) => {
                  setCurrentInvestment(investment);
                  setEditDialogOpen(true);
                }}
              />
            </TabPanel>

            <TabPanel value={value} index={2}>
              <MonthlyScheduleView
                selectedYear={selectedYear}
                selectedTeam={selectedTeam}
                selectedStatus={selectedStatus}
                selectedInvestmentType={selectedInvestmentType}
                investments={investments}
                onCardClick={(investment) => {
                  setCurrentInvestment(investment);
                  setEditDialogOpen(true);
                }}
              />
            </TabPanel>

            <TabPanel value={value} index={3}>
              <InvestmentDashboardView
                selectedYear={selectedYear}
                selectedTeam={selectedTeam}
                selectedStatus={selectedStatus}
                selectedAssignee={selectedAssignee}
                investments={investments}
              />
            </TabPanel>

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
                <ChangeLogView
                  changeLogs={changeLogs}
                  investments={investments}
                  page={changeLogPage}
                  rowsPerPage={changeLogRowsPerPage}
                  goToPage={goToPage}
                  onPageChange={handleChangeLogPageChange}
                  onRowsPerPageChange={handleChangeLogRowsPerPageChange}
                  onGoToPageChange={handleGoToPageChange}
                />
              </Box>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      {(editDialogOpen || currentInvestment) && (
        <InvestmentEditDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setCurrentInvestment(null);
          }}
          investment={currentInvestment}
          onSave={handleSaveInvestment}
          assignees={[]}
          assigneeAvatars={investmentAssigneeAvatars}
          statusOptions={[]}
          statusColors={investmentStatusColors}
          investmentTypes={[]}
          teams={[]}
        />
      )}
    </Box>
  );
}
