'use client';

import React, { useState, useEffect } from 'react';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';

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
  TableRow
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import MainCard from 'components/MainCard';
import InspectionDataTable from 'views/apps/InspectionDataTable';
import { departmentOptions, statusOptions, InspectionRecord } from 'types/inspection';
import { inspectionData } from 'data/inspection';
import { ThemeMode } from 'config';

// Icons
import { TableDocument, Chart, Calendar, Element, DocumentText } from '@wandersonalwes/iconsax-react';

// ==============================|| 협력사보안관리 메인 페이지 ||============================== //

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
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
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
  selectedDepartment: string;
  selectedStatus: string;
  selectedYear: string;
}

function KanbanView({ selectedDepartment, selectedStatus, selectedYear }: KanbanViewProps) {
  const theme = useTheme();

  // 데이터 필터링
  const filteredData = inspectionData.filter((inspection) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const inspectionYear = new Date(inspection.registrationDate).getFullYear().toString();
      if (inspectionYear !== selectedYear) return false;
    }

    // 부서 필터 (assignee 기준)
    if (selectedDepartment !== '전체') {
      // 부서별 담당자 매핑
      const departmentAssignees: { [key: string]: string[] } = {
        마케팅팀: ['박영희', '김민수'],
        영업팀: ['최윤정', '이민수'],
        IT팀: ['송민호', '김철수'],
        기획팀: ['정상현', '박지민'],
        인사팀: ['노수진', '최영수'],
        재무팀: ['김혜진', '이재훈'],
        개발팀: ['이준호', '김태호'],
        디자인팀: ['한지민', '박서영']
      };

      const assigneesInDepartment = departmentAssignees[selectedDepartment] || [];
      if (!assigneesInDepartment.includes(inspection.assignee)) return false;
    }

    // 상태 필터
    if (selectedStatus !== '전체' && inspection.status !== selectedStatus) return false;

    return true;
  });

  // 상태별 컬럼 정의 (팀KPI와 동일)
  const statusColumns = [
    { key: '대기', title: '대기', pillColor: '#6E6E75', textColor: '#fff' },
    { key: '진행', title: '진행', pillColor: '#3DA9FF', textColor: '#fff' },
    { key: '완료', title: '완료', pillColor: '#D6F231', textColor: '#333' },
    { key: '취소', title: '취소', pillColor: '#F44336', textColor: '#fff' }
  ];

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
  };

  // 담당자별 배경색 매핑 (팀KPI와 동일)
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
      case '취소':
        return 0;
      default:
        return 0;
    }
  };

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
          padding: 0 24px;
          overflow-x: auto;
          height: 100%;
        }
        
        .kanban-column {
          width: 260px;
          display: flex;
          flex-direction: column;
          row-gap: 20px;
          flex-shrink: 0;
        }
        
        .column-header {
          display: flex;
          align-items: center;
        }
        
        .pill {
          padding: 2px 12px;
          border-radius: 9999px;
          font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
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
        
        .card-title {
          font: 400 14px/1.4 "Inter", "Noto Sans KR", sans-serif;
          color: #252525;
          margin: 0;
        }
        
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .level-chip {
          height: 18px;
          padding: 2px 6px;
          border-radius: 9px;
          font: 400 9px/1 "Inter", "Noto Sans KR", sans-serif;
          background-color: #e3f2fd;
          color: #1565c0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          flex-shrink: 0;
        }
        
        .assign-row, .progress-row {
          display: flex;
          align-items: center;
          column-gap: 6px;
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #8C8C8C;
        }
        
        .assignee-name {
          padding: 2px 10px;
          border-radius: 9999px;
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #333;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background: #E0E0E0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: #21B530;
          transition: width 0.3s ease;
        }
        
        .percent {
          min-width: 32px;
          text-align: right;
          font-weight: 400;
          color: #606060;
        }
        
        @media (max-width: 768px) {
          .kanban-column {
            width: 220px;
          }
        }
      `}</style>

      <div className="kanban-board">
        {statusColumns.map((column) => {
          const items = getItemsByStatus(column.key);
          return (
            <section key={column.key} className="kanban-column">
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
                <span className="count">{items.length}</span>
              </header>
              {items.map((item) => (
                <article key={item.id} className="kanban-card">
                  {/* 타이틀과 레벨 */}
                  <div className="title-row">
                    <h3 className="card-title">{item.inspectionTitle}</h3>
                    <span className="level-chip">{item.inspectionType}</span>
                  </div>

                  {/* Assign 항상 표시 */}
                  <div className="assign-row">
                    <span>Assign:</span>
                    {item.assignee ? (
                      <span className="assignee-name" style={{ backgroundColor: getAssigneeStyle(item.assignee) }}>
                        {item.assignee}
                      </span>
                    ) : (
                      <span style={{ color: '#C0C0C0', fontStyle: 'italic' }}>미할당</span>
                    )}
                  </div>

                  {/* Deadline 항상 표시 */}
                  <div className="assign-row">
                    <span>Deadline:</span>
                    <span
                      style={{
                        color: item.inspectionDate ? '#606060' : '#C0C0C0',
                        fontStyle: item.inspectionDate ? 'normal' : 'italic'
                      }}
                    >
                      {item.inspectionDate || '미정'}
                    </span>
                  </div>

                  {/* Progress 항상 표시 */}
                  <div className="progress-row">
                    <span>Progress:</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${getProgressFromStatus(item.status)}%` }} />
                    </div>
                    <span className="percent">{getProgressFromStatus(item.status)}%</span>
                  </div>
                </article>
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
                    fontSize: '12px'
                  }}
                >
                  {column.title} 상태인 항목이 없습니다
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Box>
  );
}

// 월간일정 뷰 컴포넌트
interface MonthlyScheduleViewProps {
  selectedDepartment: string;
  selectedStatus: string;
  selectedYear: string;
}

function MonthlyScheduleView({ selectedDepartment, selectedStatus, selectedYear }: MonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(selectedYear === '전체' ? new Date().getFullYear().toString() : selectedYear);

  // 데이터 필터링
  const filteredData = inspectionData.filter((inspection) => {
    // 연도 필터
    const inspectionYear = new Date(inspection.inspectionDate).getFullYear().toString();
    if (inspectionYear !== viewYear) return false;

    // 부서 필터 (assignee 기준)
    if (selectedDepartment !== '전체') {
      const departmentAssignees: { [key: string]: string[] } = {
        마케팅팀: ['박영희', '김민수'],
        영업팀: ['최윤정', '이민수'],
        IT팀: ['송민호', '김철수'],
        기획팀: ['정상현', '박지민'],
        인사팀: ['노수진', '최영수'],
        재무팀: ['김혜진', '이재훈'],
        개발팀: ['이준호', '김태호'],
        디자인팀: ['한지민', '박서영']
      };

      const assigneesInDepartment = departmentAssignees[selectedDepartment] || [];
      if (!assigneesInDepartment.includes(inspection.assignee)) return false;
    }

    // 상태 필터
    if (selectedStatus !== '전체' && inspection.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화
  const monthlyData: { [key: number]: InspectionRecord[] } = {};
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
        return '#fff3e0';
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
        return '#e65100';
      case '진행':
        return '#1976d2';
      case '완료':
        return '#2e7d32';
      case '취소':
        return '#c62828';
      default:
        return '#666';
    }
  };

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    yearOptions.push(i.toString());
  }

  return (
    <Box>
      {/* 연도 선택 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          연도 선택:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={viewYear}
            onChange={(e) => setViewYear(e.target.value)}
            sx={{
              '& .MuiSelect-select': {
                py: 1,
                px: 2
              }
            }}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}년
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
                p: 2,
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
            // 날짜 순으로 정렬
            items.sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());

            return (
              <Box
                key={monthIndex}
                sx={{
                  borderRight: monthIndex < 5 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  p: 1.5,
                  backgroundColor: '#fff',
                  minHeight: '150px',
                  verticalAlign: 'top'
                }}
              >
                {items.map((item, itemIndex) => {
                  const date = new Date(item.inspectionDate);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        mb: itemIndex < items.length - 1 ? 1 : 0,
                        p: 0.75,
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
                          fontSize: '11px',
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
                          fontSize: '10px',
                          color: theme.palette.text.secondary,
                          mt: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={item.inspectionTitle}
                      >
                        {item.inspectionTitle}
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
                p: 2,
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
            // 날짜 순으로 정렬
            items.sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());

            return (
              <Box
                key={monthIndex}
                sx={{
                  borderRight: index < 5 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  p: 1.5,
                  backgroundColor: '#fff',
                  minHeight: '150px',
                  verticalAlign: 'top'
                }}
              >
                {items.map((item, itemIndex) => {
                  const date = new Date(item.inspectionDate);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        mb: itemIndex < items.length - 1 ? 1 : 0,
                        p: 0.75,
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
                          fontSize: '11px',
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
                          fontSize: '10px',
                          color: theme.palette.text.secondary,
                          mt: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={item.inspectionTitle}
                      >
                        {item.inspectionTitle}
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
function ChangeLogView() {
  const theme = useTheme();

  // 변경로그 샘플 데이터 (최신순으로 정렬)
  const changeLogs = [
    {
      id: 1,
      dateTime: '2024-12-15 14:30',
      team: 'IT팀',
      user: '김철수',
      action: '점검 항목 수정',
      target: 'SEC-24-010',
      description: '서버 보안 점검 항목의 상태를 "진행"에서 "완료"로 변경'
    },
    {
      id: 2,
      dateTime: '2024-12-14 10:15',
      team: '기획팀',
      user: '이영희',
      action: '새 점검 생성',
      target: 'SEC-24-011',
      description: '네트워크 보안 점검 항목 신규 등록'
    },
    {
      id: 3,
      dateTime: '2024-12-13 16:45',
      team: '마케팅팀',
      user: '박민수',
      action: '첨부파일 추가',
      target: 'SEC-24-009',
      description: '점검 결과 보고서.pdf 파일 업로드'
    },
    {
      id: 4,
      dateTime: '2024-12-12 09:30',
      team: 'IT팀',
      user: '김철수',
      action: 'OPL 항목 추가',
      target: 'SEC-24-008',
      description: '보안 취약점 개선 OPL 항목 3건 추가'
    },
    {
      id: 5,
      dateTime: '2024-12-11 15:20',
      team: '인사팀',
      user: '최지연',
      action: '점검 항목 삭제',
      target: 'SEC-24-007',
      description: '중복된 점검 항목 삭제 처리'
    },
    {
      id: 6,
      dateTime: '2024-12-10 11:00',
      team: '개발팀',
      user: '정현우',
      action: '담당자 변경',
      target: 'SEC-24-006',
      description: '담당자를 "김철수"에서 "이영희"로 변경'
    },
    {
      id: 7,
      dateTime: '2024-12-09 13:45',
      team: '디자인팀',
      user: '강민정',
      action: '점검일 변경',
      target: 'SEC-24-005',
      description: '점검 예정일을 2024-12-20에서 2024-12-25로 연기'
    },
    {
      id: 8,
      dateTime: '2024-12-08 10:30',
      team: '영업팀',
      user: '윤성호',
      action: '체크리스트 수정',
      target: 'SEC-24-004',
      description: '보안 점검 체크리스트 평가 항목 10건 업데이트'
    }
  ];

  // 팀별 색상 매핑
  const getTeamColor = (team: string) => {
    switch (team) {
      case '마케팅팀':
        return '#e3f2fd';
      case '디자인팀':
        return '#f3e5f5';
      case '기획팀':
        return '#e1f5fe';
      case '개발팀':
        return '#e8f5e8';
      case 'IT팀':
        return '#fff3e0';
      case '인사팀':
        return '#fce4ec';
      case '재무팀':
        return '#e8eaf6';
      case '영업팀':
        return '#f1f8e9';
      default:
        return '#f5f5f5';
    }
  };

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          총 {changeLogs.length}건
        </Typography>
      </Box>

      {/* 변경로그 테이블 */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600, width: 60 }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>담당자</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140 }}>활동유형</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>활동세부내용</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changeLogs.map((log, index) => (
              <TableRow
                key={log.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {changeLogs.length - index}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.team}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '11px',
                      backgroundColor: getTeamColor(log.team),
                      color: '#333'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.user}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.target}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '11px',
                      backgroundColor: theme.palette.grey[100]
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500 }}>
                    {log.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    {log.description}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// 대시보드 뷰 컴포넌트
interface DashboardViewProps {
  selectedDepartment: string;
  selectedStatus: string;
  selectedYear: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
}

// ==============================|| INSPECTION TYPE PIE CHART ||============================== //

interface InspectionTypePieChartProps {
  typeStats: Record<string, number>;
  sortedEntries: [string, number][];
  colors: string[];
}

function InspectionTypePieChart({ typeStats, sortedEntries, colors }: InspectionTypePieChartProps) {
  const theme = useTheme();
  const downSM = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const mode = theme.palette.mode;
  const { primary } = theme.palette.text;
  const line = theme.palette.divider;
  const backColor = theme.palette.background.paper;

  const types = sortedEntries.map(([type]) => type);
  const values = sortedEntries.map(([, value]) => value);

  const [options, setOptions] = useState<ChartProps>({
    chart: {
      type: 'pie'
    },
    tooltip: {
      enabled: true,
      fillSeriesColor: false
    },
    labels: types,
    legend: {
      show: false
    },
    colors: colors,
    theme: {
      mode: mode === ThemeMode.DARK ? 'dark' : 'light'
    }
  });

  useEffect(() => {
    setOptions({
      chart: {
        type: 'pie',
        offsetY: 0,
        offsetX: 0
      },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        followCursor: true,
        intersect: false,
        inverseOrder: false,
        shared: false,
        style: {
          fontSize: '12px',
          fontFamily: 'inherit'
        },
        custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
          const value = series[seriesIndex];
          const label = w.globals.labels[seriesIndex];
          const total = series.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

          // 테마에 따른 색상 설정
          const isDark = mode === 'dark';
          const backgroundColor = isDark ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)';
          const textColor = isDark ? '#ffffff' : '#000000';
          const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';

          return `
            <div style="
              background: ${backgroundColor};
              color: ${textColor};
              padding: 8px 12px;
              border-radius: 4px;
              font-size: 12px;
              min-width: 120px;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              border: 1px solid ${borderColor};
            ">
              <div style="font-weight: 600; margin-bottom: 2px;">${label}</div>
              <div>${value}건 (${percentage}%)</div>
            </div>
          `;
        },
        marker: {
          show: true
        }
      },
      plotOptions: {
        pie: {
          size: 49,
          donut: {
            size: '0%'
          },
          offsetY: 0,
          offsetX: 0,
          expandOnClick: false,
          dataLabels: {
            offset: 0,
            minAngleToShowLabel: 10
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      labels: types,
      legend: {
        show: false
      },
      colors: colors,
      stroke: {
        colors: [backColor],
        width: 2
      },
      responsive: [
        {
          breakpoint: 600,
          options: {
            chart: {
              height: 196
            },
            plotOptions: {
              pie: {
                size: 39
              }
            }
          }
        }
      ],
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    });
  }, [mode, primary, line, backColor, colors, JSON.stringify(typeStats)]);

  return (
    <div id="chart">
      <ReactApexChart options={options} series={values} type="pie" height={downSM ? 196 : 221} />
    </div>
  );
}

// ==============================|| DASHBOARD VIEW ||============================== //

function DashboardView({
  selectedDepartment,
  selectedStatus,
  selectedYear,
  selectedRecentStatus,
  setSelectedRecentStatus
}: DashboardViewProps) {
  const theme = useTheme();

  // 데이터 필터링
  const filteredData = inspectionData.filter((inspection) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const inspectionYear = new Date(inspection.registrationDate).getFullYear().toString();
      if (inspectionYear !== selectedYear) return false;
    }

    // 부서 필터 (assignee 기준)
    if (selectedDepartment !== '전체') {
      const departmentAssignees: { [key: string]: string[] } = {
        마케팅팀: ['박영희', '김민수'],
        영업팀: ['최윤정', '이민수'],
        IT팀: ['송민호', '김철수'],
        기획팀: ['정상현', '박지민'],
        인사팀: ['노수진', '최영수'],
        재무팀: ['김혜진', '이재훈'],
        개발팀: ['이준호', '김태호'],
        디자인팀: ['한지민', '박서영']
      };

      const assigneesInDepartment = departmentAssignees[selectedDepartment] || [];
      if (!assigneesInDepartment.includes(inspection.assignee)) return false;
    }

    // 상태 필터
    if (selectedStatus !== '전체' && inspection.status !== selectedStatus) return false;

    return true;
  });

  // 통계 계산
  const totalCount = filteredData.length;

  // 유형별 수량
  const typeStats = filteredData.reduce(
    (acc, item) => {
      acc[item.inspectionType] = (acc[item.inspectionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 데이터를 값 기준으로 내림차순 정렬 (큰 값부터 진한 색상)
  const sortedTypeEntries = Object.entries(typeStats).sort(([, a], [, b]) => b - a);

  // 스크린샷과 동일한 색상 순서 (진한 파란색부터 밝은 파란색까지)
  const blueGradientColors = [
    '#1e3a8a', // 진한 파란색 (가장 큰 값용)
    '#3b82f6', // 중간 파란색
    '#60a5fa', // 밝은 파란색
    '#93c5fd', // 더 밝은 파란색
    '#bfdbfe', // 매우 밝은 파란색
    '#dbeafe', // 가장 밝은 파란색
    '#eff6ff' // 거의 흰색에 가까운 파란색
  ];

  // 정렬된 데이터에 맞는 색상 배열 생성
  const chartColors = sortedTypeEntries.map((_, index) => blueGradientColors[index % blueGradientColors.length]);

  const getTypeColor = (type: string, index?: number) => {
    if (index !== undefined) {
      return blueGradientColors[index % blueGradientColors.length];
    }
    // 기존 호환성을 위한 fallback
    const sortedIndex = sortedTypeEntries.findIndex(([t]) => t === type);
    return blueGradientColors[sortedIndex >= 0 ? sortedIndex : 0];
  };

  // 상태별 수량
  const statusStats = filteredData.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 전월 대비 증감 (임시 데이터)
  const monthlyChange = +12; // 12건 증가

  // 최근 점검 리스트 (상위 5개)
  const recentInspections = filteredData
    .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
    .slice(0, 5);

  // 상태별 필터링된 최근 점검 리스트
  const filteredRecentInspections =
    selectedRecentStatus === '전체' ? recentInspections : recentInspections.filter((item) => item.status === selectedRecentStatus);

  // 월간 통계 데이터 생성 (2024년 1~12월 데이터)
  const monthlyStats = [];
  const year = 2024; // 데이터가 2024년 기준이므로 2024년으로 고정

  for (let month = 1; month <= 12; month++) {
    const count = filteredData.filter((item) => {
      const itemDate = new Date(item.inspectionDate);
      return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
    }).length;

    monthlyStats.push({
      date: `${year}-${month.toString().padStart(2, '0')}`,
      label: `${month}월`,
      count
    });
  }

  // 기존 dailyStats를 monthlyStats로 대체 (하위 호환성을 위해)
  const dailyStats = monthlyStats;

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#fff3e0';
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
        return '#e65100';
      case '진행':
        return '#1976d2';
      case '완료':
        return '#2e7d32';
      case '취소':
        return '#c62828';
      default:
        return '#666';
    }
  };

  return (
    <Box>
      {/* 상단 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 총 등록수 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, height: 180 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              총 등록수
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 'calc(100% - 40px)' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main, textAlign: 'center' }}>
                  {totalCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  전체 점검 건수
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* 유형별 수량 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, height: 180 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              유형별 수량
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 'calc(100% - 40px)', justifyContent: 'space-between' }}>
              {sortedTypeEntries.map(([type, count], index) => (
                <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getTypeColor(type, index)
                      }}
                    />
                    <Typography variant="body2">{type}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* 상태별 수량 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, height: 180 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              상태별 수량
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 'calc(100% - 40px)', justifyContent: 'space-between' }}>
              {Object.entries(statusStats).map(([status, count]) => (
                <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={status}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(status),
                      color: getStatusTextColor(status),
                      fontSize: '11px',
                      height: 22
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* 전월 증감 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, height: 180 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              전월 증감
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: 'calc(100% - 40px)' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', flex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: monthlyChange >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    textAlign: 'center'
                  }}
                >
                  {monthlyChange >= 0 ? '+' : ''}
                  {monthlyChange}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  전월 대비 변화량
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 하단 섹션 */}
      <Grid container spacing={3}>
        {/* 점검 유형별 원형 차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: 313 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              점검 유형별 분포
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', height: 'calc(100% - 52px)' }}>
              {/* 파이차트 */}
              <Box sx={{ flex: '0 0 auto' }}>
                <InspectionTypePieChart typeStats={typeStats} sortedEntries={sortedTypeEntries} colors={chartColors} />
              </Box>

              {/* 오른쪽 범례 */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  justifyContent: 'center',
                  ml: 2
                }}
              >
                {sortedTypeEntries.map(([type, count], index) => (
                  <Box
                    key={type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'grey.50'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getTypeColor(type, index)
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {type}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {count}건
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* 최근 점검 리스트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: 313 }}>
            {/* 헤더 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                최근 점검 현황
              </Typography>

              {/* 상태 필터 드랍다운 */}
              <FormControl sx={{ minWidth: 80 }}>
                <Select
                  value={selectedRecentStatus || '전체'}
                  onChange={(e) => setSelectedRecentStatus(e.target.value)}
                  size="small"
                  sx={{
                    fontSize: '12px',
                    height: 32,
                    '& .MuiSelect-select': {
                      py: 0.5,
                      px: 1
                    }
                  }}
                >
                  {['전체', '대기', '진행', '완료', '취소'].map((status) => (
                    <MenuItem key={status} value={status} sx={{ fontSize: '12px' }}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                height: 'calc(100% - 52px)',
                overflow: 'auto',
                // VOC관리와 동일한 스크롤바 스타일
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
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '12px' }}>NO</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '12px' }}>제목</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '12px' }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '12px' }}>점검일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecentInspections.map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '12px' }}>{index + 1}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                              fontSize: '12px'
                            }}
                          >
                            {item.inspectionTitle}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(item.status),
                              color: getStatusTextColor(item.status),
                              fontSize: '10px',
                              height: 20
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {item.inspectionDate}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        </Grid>

        {/* 일자별 막대 차트 */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              월간별 점검 현황
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, height: 200, px: 2 }}>
              {dailyStats.map((stat, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <Typography variant="caption" sx={{ mb: 1, fontWeight: 600 }}>
                    {stat.count}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: stat.count * 20 + 20,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1,
                      mb: 1,
                      minHeight: 20,
                      opacity: stat.count === 0 ? 0.3 : 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function PartnersSecurityManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  // 필터 상태
  const [selectedDepartment, setSelectedDepartment] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedRecentStatus, setSelectedRecentStatus] = useState('전체');

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = ['전체'];
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    yearOptions.push(i.toString());
  }

  return (
    <MainCard
      title="협력사보안관리"
      secondary={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 연도 필터 */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 'max-content' }}>
              등록기간
            </Typography>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 2
                  }
                }}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year === '전체' ? '전체' : `${year}년`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 부서 필터 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  py: 1,
                  px: 2
                }
              }}
            >
              <MenuItem value="전체">전체</MenuItem>
              {departmentOptions.map((department) => (
                <MenuItem key={department} value={department}>
                  {department}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 상태 필터 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiSelect-select': {
                  py: 1,
                  px: 2
                }
              }}
            >
              <MenuItem value="전체">전체</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      }
    >
      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="협력사보안관리 탭"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          <Tab
            icon={<TableDocument size={20} />}
            iconPosition="start"
            label="데이터"
            {...a11yProps(0)}
            sx={{
              gap: 1,
              '& .MuiTab-iconWrapper': {
                margin: 0
              }
            }}
          />
          <Tab
            icon={<Element size={20} />}
            iconPosition="start"
            label="칸반"
            {...a11yProps(1)}
            sx={{
              gap: 1,
              '& .MuiTab-iconWrapper': {
                margin: 0
              }
            }}
          />
          <Tab
            icon={<Calendar size={20} />}
            iconPosition="start"
            label="월간일정"
            {...a11yProps(2)}
            sx={{
              gap: 1,
              '& .MuiTab-iconWrapper': {
                margin: 0
              }
            }}
          />
          <Tab
            icon={<Chart size={20} />}
            iconPosition="start"
            label="대시보드"
            {...a11yProps(3)}
            sx={{
              gap: 1,
              '& .MuiTab-iconWrapper': {
                margin: 0
              }
            }}
          />
          <Tab
            icon={<DocumentText size={20} />}
            iconPosition="start"
            label="변경로그"
            {...a11yProps(4)}
            sx={{
              gap: 1,
              '& .MuiTab-iconWrapper': {
                margin: 0
              }
            }}
          />
        </Tabs>
      </Box>

      {/* 탭 내용 */}
      <TabPanel value={value} index={0}>
        {/* 데이터 탭 - 테이블 */}
        <Box sx={{ p: 3 }}>
          <InspectionDataTable selectedDepartment={selectedDepartment} selectedStatus={selectedStatus} selectedYear={selectedYear} />
        </Box>
      </TabPanel>
      <TabPanel value={value} index={1}>
        {/* 칸반 탭 */}
        <Box sx={{ p: 3, height: '500px' }}>
          <KanbanView selectedDepartment={selectedDepartment} selectedStatus={selectedStatus} selectedYear={selectedYear} />
        </Box>
      </TabPanel>

      <TabPanel value={value} index={2}>
        {/* 월간일정 탭 */}
        <Box sx={{ p: 3 }}>
          <MonthlyScheduleView selectedDepartment={selectedDepartment} selectedStatus={selectedStatus} selectedYear={selectedYear} />
        </Box>
      </TabPanel>

      <TabPanel value={value} index={3}>
        {/* 대시보드 탭 */}
        <Box sx={{ p: 3 }}>
          <DashboardView
            selectedDepartment={selectedDepartment}
            selectedStatus={selectedStatus}
            selectedYear={selectedYear}
            selectedRecentStatus={selectedRecentStatus}
            setSelectedRecentStatus={setSelectedRecentStatus}
          />
        </Box>
      </TabPanel>

      <TabPanel value={value} index={4}>
        {/* 변경로그 탭 */}
        <Box sx={{ p: 3 }}>
          <ChangeLogView />
        </Box>
      </TabPanel>
    </MainCard>
  );
}
