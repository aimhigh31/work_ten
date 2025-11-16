'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
  Stack,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Project imports
import SalesDataTable from './SalesDataTable';
import SalesEditDialog from '../../components/SalesEditDialog';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import { useSupabaseSales } from 'hooks/useSupabaseSales';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';
import { useSession } from 'next-auth/react';
import useUser from 'hooks/useUser';
import type { SalesRecord } from 'types/sales';
import { useMenuPermission } from '../../hooks/usePermissions';

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

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  sales: SalesRecord[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function ChangeLogView({
  changeLogs,
  sales,
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
      case '영업팀':
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
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600, width: 50, fontSize: '12px' }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 110, fontSize: '12px' }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 160, fontSize: '12px' }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150, fontSize: '12px' }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 330, fontSize: '12px' }}>변경 세부내용</TableCell>
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
                    {log.changedField}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.beforeValue}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    {log.afterValue}
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
                    fontSize: '0.875rem',
                    textAlign: 'center'
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

// Icons
import { TableDocument, Chart, Calendar, Element, DocumentText } from '@wandersonalwes/iconsax-react';

// Chart imports for dashboard
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// useEffect import for dashboard

// 대시보드 뷰 컴포넌트
interface SalesDashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
  sales: SalesRecord[];
  getBusinessUnitName?: (subcode: string) => string;
  getCustomerName?: (subcode: string) => string;
  getSalesTypeName?: (subcode: string) => string;
  getStatusName?: (subcode: string) => string;
}

function SalesDashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  selectedRecentStatus,
  setSelectedRecentStatus,
  sales,
  getBusinessUnitName = (subcode: string) => subcode,
  getCustomerName = (subcode: string) => subcode,
  getSalesTypeName = (subcode: string) => subcode,
  getStatusName = (subcode: string) => subcode
}: SalesDashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: SalesRecord[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((sale) => {
      const saleDate = new Date(sale.registrationDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return saleDate >= start && saleDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return saleDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return saleDate <= end;
      }

      return true;
    });
  };

  // 데이터 필터링
  const filteredData = filterByDateRange(sales).filter((sale) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const saleYear = new Date(sale.registrationDate).getFullYear().toString();
      if (saleYear !== selectedYear) return false;
    }

    if (selectedTeam !== '전체' && sale.team !== selectedTeam) return false;
    if (selectedAssignee !== '전체' && sale.registrant !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && sale.status !== selectedStatus) return false;
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

  // 판매유형별 통계 (원형차트용) - salesType 필드 사용
  const categoryStats = filteredData.reduce(
    (acc, item) => {
      const category = item.salesType || '기타';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 담당자별 통계 (원형차트용)
  const assigneeStats = filteredData.reduce(
    (acc, item) => {
      // registrant에서 서브코드 제거 (예: "송씨 GROUP004-SUB003" → "송씨")
      const rawAssignee = item.registrant || '미할당';
      const assignee = rawAssignee.replace(/\s+GROUP\d+-SUB\d+$/g, '').trim() || '미할당';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 월별 통계 (막대차트용)
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
  // 서브코드를 서브코드명으로 변환한 라벨
  const categoryLabelNames = categoryLabels.map(label => getSalesTypeName(label));

  // 원형차트 옵션 - 새로운 접근방식: 내장 툴팁 포맷터 사용
  const pieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: categoryLabelNames,
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
        const capturedLabelNames = [...categoryLabelNames];
        const capturedValues = [...categoryValues];

        const value = capturedValues[seriesIndex] || 0;
        const label = capturedLabelNames[seriesIndex] || '분류';
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
        text: '매출 건수'
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
          매출 현황 대시보드
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
              전체 매출 현황
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
              대기중인 매출
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
              진행중인 매출
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
              완료된 매출
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
              보류중인 매출
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 판매유형 - 매출목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 판매유형 원형차트 */}
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
              판매유형
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
                            {getSalesTypeName(key)} - {count}건 ({percentage}%)
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

        {/* 매출 목록 */}
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
              매출 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>고객명</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>품목명</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>배송일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((sale, index) => (
                      <TableRow key={sale.id} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{filteredData.length - (startIndex + index)}</TableCell>
                        <TableCell
                          sx={{
                            py: 0.5,
                            fontSize: '13px',
                            maxWidth: 120,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {getCustomerName(sale.customerName) || '고객명 없음'}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.5,
                            fontSize: '13px',
                            maxWidth: 120,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sale.itemName || '-'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{sale.deliveryDate || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={getStatusName(sale.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(getStatusName(sale.status)),
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

      {/* 하단 레이아웃: 매출담당 - 월별매출 */}
      <Grid container spacing={3}>
        {/* 매출담당 원형차트 */}
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
              매출담당
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

        {/* 월별 매출현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 매출현황
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

// ==============================|| 매출관리 메인 페이지 ||============================== //

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
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ p: 0, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `sales-tab-${index}`,
    'aria-controls': `sales-tabpanel-${index}`
  };
}

// 월간일정 뷰 컴포넌트
interface SalesMonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  sales: any[];
  onCardClick: (sales: any) => void;
}

function SalesMonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  sales,
  onCardClick
}: SalesMonthlyScheduleViewProps) {
  const theme = useTheme();
  const { masterCodes } = useCommonData();

  // 코드를 코드명으로 변환하는 함수
  const getCodeName = useMemo(() => {
    return (groupCode: string, subCode: string) => {
      if (!masterCodes || masterCodes.length === 0) return subCode;

      const masterCode = masterCodes.find(
        (mc) => mc.group_code === groupCode && mc.subcode === subCode && mc.is_active
      );

      return masterCode?.subcode_name || subCode;
    };
  }, [masterCodes]);

  // 데이터 필터링
  const filteredData = sales.filter((sale) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const saleYear = new Date(sale.startDate || sale.contractDate || sale.registrationDate).getFullYear().toString();
      if (saleYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && sale.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && sale.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && sale.salesType !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (시작일 기준)
  const monthlyData: { [key: number]: any[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.startDate || item.contractDate || item.registrationDate);
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
              items.sort(
                (a, b) =>
                  new Date(a.contractDate || a.registrationDate).getTime() - new Date(b.contractDate || b.registrationDate).getTime()
              );

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
                    const date = new Date(item.startDate || item.contractDate || item.registrationDate);
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');

                    return (
                      <Box
                        key={`month-${monthIndex}-item-${item.id}`}
                        onClick={async () => {
                          try {
                            await Promise.resolve(onCardClick(item));
                          } catch (error) {
                            console.error('월간일정 카드 클릭 오류:', error);
                          }
                        }}
                        sx={{
                          mb: itemIndex < items.length - 1 ? 0.8 : 0,
                          p: 0.6,
                          borderRadius: 1,
                          backgroundColor: getStatusColor(getCodeName('GROUP002', item.status)),
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
                            color: getStatusTextColor(getCodeName('GROUP002', item.status)),
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <span>{`${month}-${day}`}</span>
                          <span>{getCodeName('GROUP002', item.status)}</span>
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
                          title={getCodeName('GROUP039', item.customerName) || '고객명 없음'}
                        >
                          {getCodeName('GROUP039', item.customerName) || '고객명 없음'}
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
            {monthNames.slice(6, 12).map((_, monthIndex) => {
              const items = monthlyData[monthIndex + 6] || [];
              items.sort(
                (a, b) =>
                  new Date(a.startDate || a.contractDate || a.registrationDate).getTime() -
                  new Date(b.startDate || b.contractDate || b.registrationDate).getTime()
              );

              return (
                <Box
                  key={`month-content-second-${monthIndex}`}
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
                    const date = new Date(item.startDate || item.contractDate || item.registrationDate);
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');

                    return (
                      <Box
                        key={`month-second-${monthIndex}-item-${item.id}`}
                        onClick={async () => {
                          try {
                            await Promise.resolve(onCardClick(item));
                          } catch (error) {
                            console.error('월간일정 카드 클릭 오류:', error);
                          }
                        }}
                        sx={{
                          mb: itemIndex < items.length - 1 ? 0.8 : 0,
                          p: 0.6,
                          borderRadius: 1,
                          backgroundColor: getStatusColor(getCodeName('GROUP002', item.status)),
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
                            color: getStatusTextColor(getCodeName('GROUP002', item.status)),
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <span>{`${month}-${day}`}</span>
                          <span>{getCodeName('GROUP002', item.status)}</span>
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
                          title={getCodeName('GROUP039', item.customerName) || '고객명 없음'}
                        >
                          {getCodeName('GROUP039', item.customerName) || '고객명 없음'}
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

export default function SalesManagement() {
  const [value, setValue] = useState(0);
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers } = useMenuPermission('/planning/sales');

  // 🏪 공용 창고에서 재료 가져오기
  const { users, departments, masterCodes } = useCommonData();
  const { getSales, createSales, updateSales, deleteSales, loading: salesLoading, error: salesError } = useSupabaseSales();

  // Supabase 변경로그 연동
  const { data: session } = useSession();
  const user = useUser();
  const userName = user?.name || session?.user?.name || '시스템';
  const currentUser = users.find((u) => u.email === session?.user?.email);
  const { logs: changeLogData, fetchChangeLogs } = useSupabaseChangeLog('plan_sales');

  // 마스터코드에서 상태 옵션 가져오기 (GROUP002의 서브코드만 필터링)
  const statusTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 사업부 옵션 가져오기 (GROUP035)
  const businessUnitsMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP035' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 고객명 옵션 가져오기 (GROUP039)
  const customerNamesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP039' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 마스터코드에서 판매유형 옵션 가져오기 (GROUP036)
  const salesTypesMap = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP036' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수들
  const getBusinessUnitName = React.useCallback((subcode: string) => {
    const found = businessUnitsMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [businessUnitsMap]);

  const getCustomerName = React.useCallback((subcode: string) => {
    const found = customerNamesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [customerNamesMap]);

  const getSalesTypeName = React.useCallback((subcode: string) => {
    const found = salesTypesMap.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [salesTypesMap]);

  const getStatusName = React.useCallback((subcode: string) => {
    const found = statusTypes.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [statusTypes]);

  // 공유 Sales 상태 (DB에서 로드)
  const [sales, setSales] = useState<SalesRecord[]>([]);

  // 매출 데이터 로드
  React.useEffect(() => {
    const loadSalesData = async () => {
      try {
        const data = await getSales();
        setSales(data);
      } catch (error) {
        console.error('매출 데이터 로드 실패:', error);
      }
    };
    loadSalesData();
  }, [getSales]);

  // 편집 다이얼로그 상태 (모든 탭에서 공용)
  const [editDialog, setEditDialog] = useState(false);
  const [editingSales, setEditingSales] = useState<SalesRecord | null>(null);

  // Snackbar 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 대시보드용 최근 상태 필터
  const [selectedRecentStatus, setSelectedRecentStatus] = useState('전체');

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

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
      location: log.change_location || '-',
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
    console.log('📋 매출관리 변경로그 데이터 로드 시작');
    fetchChangeLogs();
  }, [fetchChangeLogs]);

  // 변경로그 데이터 디버깅
  useEffect(() => {
    console.log('📊 Sales changeLogData:', changeLogData);
    console.log('📊 Sales changeLogs (변환된 데이터):', changeLogs);
  }, [changeLogData, changeLogs]);

  // 필터 상태
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');

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
      const logData = {
        page: 'plan_sales',
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

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // 전역 오류 처리기
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('전역 오류 감지:', event.error);
      console.error('오류 메시지:', event.message);
      console.error('파일:', event.filename);
      console.error('라인:', event.lineno);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('처리되지 않은 Promise rejection:', {
        reason: event.reason,
        reasonType: typeof event.reason,
        reasonString: String(event.reason),
        stack: event.reason?.stack,
        promise: event.promise
      });
      // Next.js Dev Overlay에서 [object Event] 에러 방지
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 카드 클릭 핸들러 (칸반과 데이터 테이블에서 공통 사용)
  const handleCardClick = async (sales: SalesRecord) => {
    try {
      if (!sales || typeof sales !== 'object') {
        console.warn('유효하지 않은 매출 데이터:', sales);
        return;
      }

      // 상태 업데이트
      setEditingSales(sales);
      setEditDialog(true);
    } catch (error) {
      console.error('카드 클릭 처리 중 오류:', error);
      console.error('에러 상세:', {
        message: error.message,
        stack: error.stack,
        sales: sales
      });
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingSales(null);
  };

  // 추가 버튼 클릭 핸들러
  const handleAddClick = () => {
    // 신규 추가는 null로 설정하여 SalesEditDialog에서 초기값 사용
    setEditingSales(null);
    setEditDialog(true);
  };

  // 코드 생성 (기존 로컬 메모리 기반 - 참고용)
  const generateCode = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const lastRecord = sales[sales.length - 1];
    const lastNumber = lastRecord ? parseInt(lastRecord.code.split('-')[2]) : 0;
    return `SALES-${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`;
  };

  // 매출 코드 자동 생성 함수 (Supabase DB 기반)
  const generateSalesCode = React.useCallback(async (): Promise<string> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2);

      // 현재 연도의 모든 코드 조회 (PLAN-SALES-YY-XXX 형식)
      const { data, error } = await supabase
        .from('plan_sales_data')
        .select('code')
        .like('code', `PLAN-SALES-${currentYearStr}-%`);

      if (error) {
        console.error('❌ 매출 코드 조회 실패:', error);
        throw error;
      }

      console.log('📊 [generateSalesCode] DB 조회 결과:', data);
      console.log('📊 [generateSalesCode] 현재 연도:', currentYearStr);

      let nextSequence = 1;
      if (data && data.length > 0) {
        // 모든 코드에서 일련번호 추출하여 최대값 찾기
        const sequences = data
          .map(item => {
            const parts = item.code.split('-');
            // PLAN-SALES-25-001 형식에서 001 추출 (인덱스 3)
            return parts.length === 4 ? parseInt(parts[3]) : 0;
          })
          .filter(num => !isNaN(num));

        console.log('📊 [generateSalesCode] 추출된 일련번호들:', sequences);

        if (sequences.length > 0) {
          const maxSequence = Math.max(...sequences);
          nextSequence = maxSequence + 1;
          console.log('📊 [generateSalesCode] 최대 일련번호:', maxSequence);
          console.log('📊 [generateSalesCode] 다음 일련번호:', nextSequence);
        }
      } else {
        console.log('📊 [generateSalesCode] DB에 데이터 없음, 001부터 시작');
      }

      const formattedSequence = nextSequence.toString().padStart(3, '0');
      const newCode = `PLAN-SALES-${currentYearStr}-${formattedSequence}`;

      console.log('✅ [generateSalesCode] 생성된 코드:', newCode);
      return newCode;
    } catch (error) {
      console.error('❌ 매출 코드 생성 실패:', error);
      // 오류 시 임시 코드 반환
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `PLAN-SALES-${year}-${random}`;
    }
  }, []);

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
            minHeight: 0,
            '&:last-child': {
              pb: 0
            }
          }}
        >
          {/* 페이지 타이틀 및 브레드크럼 */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                매출관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                기획메뉴 &gt; 매출관리
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
                  mt: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <Tabs
                  value={value}
                  onChange={handleChange}
                  aria-label="매출관리 탭"
              sx={{
                flexGrow: 1,
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.91rem',
                  fontWeight: 500
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab
                icon={<TableDocument size={18} />}
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
                icon={<Element size={18} />}
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
                icon={<Calendar size={18} />}
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
                icon={<Chart size={18} />}
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
                icon={<DocumentText size={18} />}
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

          {/* 탭 컨텐츠 */}
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
                <SalesDataTable
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  sales={sales}
                  setSales={setSales}
                  addChangeLog={addChangeLog}
                  isEditDialogOpen={editDialog}
                  onEditDialogClose={handleEditDialogClose}
                  editingRecord={editingSales}
                  onEditClick={handleCardClick}
                  onAddClick={handleAddClick}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                  users={users}
                  snackbar={snackbar}
                  setSnackbar={setSnackbar}
                  deleteSales={deleteSales}
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
                <SalesKanbanView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  salesData={sales}
                  setSalesData={setSales}
                  addChangeLog={addChangeLog}
                  onCardClick={handleCardClick}
                  assigneeList={users.filter((user) => user.status === 'active')}
                  users={users}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                  snackbar={snackbar}
                  setSnackbar={setSnackbar}
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
                <SalesMonthlyScheduleView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  sales={sales}
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
                <SalesDashboardView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  selectedRecentStatus={selectedRecentStatus}
                  setSelectedRecentStatus={setSelectedRecentStatus}
                  sales={sales}
                  getBusinessUnitName={getBusinessUnitName}
                  getCustomerName={getCustomerName}
                  getSalesTypeName={getSalesTypeName}
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
                  sales={sales}
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

      {/* Sales 편집 다이얼로그 */}
      <SalesEditDialog
        open={editDialog}
        onClose={handleEditDialogClose}
        salesRecord={editingSales}
        canCreateData={canCreateData}
        canEditOwn={canEditOwn}
        canEditOthers={canEditOthers}
        users={users}
        generateSalesCode={generateSalesCode}
        setSnackbar={setSnackbar}
        onSave={async (updatedRecord) => {
          console.log('💾 [SalesManagement] onSave 호출됨, editingSales:', editingSales);
          console.log('📦 [SalesManagement] updatedRecord:', updatedRecord);

          // editingSales가 있으면 수정, 없으면 신규 생성
          if (editingSales) {
            // 기존 데이터 업데이트
            const originalSales = sales.find((s) => s.id === editingSales.id);
            // 변경된 필드 추적 (try 블록 밖에서 선언)
            let changedFields: string[] = [];

            try {
              console.log('🔄 기존 매출 수정 시작, ID:', editingSales.id);

              // 서브코드를 서브코드명으로 변환
              const customerNameText = getCustomerName(updatedRecord.customerName);
              const salesTypeText = getSalesTypeName(updatedRecord.salesType);
              const statusText = getStatusName(updatedRecord.status);
              const businessUnitText = getBusinessUnitName(updatedRecord.businessUnit);

              console.log('🔄 서브코드명 변환 (수정):', {
                고객명: `${updatedRecord.customerName} → ${customerNameText}`,
                판매유형: `${updatedRecord.salesType} → ${salesTypeText}`,
                상태: `${updatedRecord.status} → ${statusText}`,
                사업부: `${updatedRecord.businessUnit} → ${businessUnitText}`
              });

              // 서브코드명으로 변환된 데이터
              const updateInput = {
                ...updatedRecord,
                customerName: customerNameText,
                salesType: salesTypeText,
                status: statusText,
                businessUnit: businessUnitText
              };

              // DB 업데이트
              await updateSales(updatedRecord.id, updateInput);

              // 로컬 상태 업데이트
              setSales((prev) => prev.map((s) => (s.id === updatedRecord.id ? updateInput : s)));

              // 변경로그 추가 (필드별)
              if (originalSales) {
                const salesCode = updateInput.code || `SALES-${updateInput.id}`;
                const salesTitle = updateInput.itemName || '매출';

                // 각 필드별 변경사항 추적
                if (originalSales.customerName !== updateInput.customerName) {
                  changedFields.push('고객명');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 고객명이 ${originalSales.customerName || ''} → ${updateInput.customerName || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.customerName || '',
                    updateInput.customerName || '',
                    '고객명',
                    salesTitle
                  );
                }

                if (originalSales.salesType !== updateInput.salesType) {
                  changedFields.push('판매유형');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 판매유형이 ${originalSales.salesType || ''} → ${updateInput.salesType || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.salesType || '',
                    updateInput.salesType || '',
                    '판매유형',
                    salesTitle
                  );
                }

                if (originalSales.businessUnit !== updateInput.businessUnit) {
                  changedFields.push('사업부');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 사업부가 ${originalSales.businessUnit || ''} → ${updateInput.businessUnit || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.businessUnit || '',
                    updateInput.businessUnit || '',
                    '사업부',
                    salesTitle
                  );
                }

                if (originalSales.itemName !== updateInput.itemName) {
                  changedFields.push('품목명');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 품목명이 ${originalSales.itemName || ''} → ${updateInput.itemName || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.itemName || '',
                    updateInput.itemName || '',
                    '품목명',
                    salesTitle
                  );
                }

                if (originalSales.status !== updateInput.status) {
                  changedFields.push('상태');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 상태가 ${originalSales.status || ''} → ${updateInput.status || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.status || '',
                    updateInput.status || '',
                    '상태',
                    salesTitle
                  );
                }

                if (originalSales.team !== updateInput.team) {
                  changedFields.push('팀');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 팀이 ${originalSales.team || ''} → ${updateInput.team || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.team || '',
                    updateInput.team || '',
                    '팀',
                    salesTitle
                  );
                }

                if (originalSales.registrant !== updateInput.registrant) {
                  changedFields.push('등록자');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 등록자가 ${originalSales.registrant || ''} → ${updateInput.registrant || ''} 로 수정 되었습니다.`,
                    updateInput.businessUnit || '미분류',
                    originalSales.registrant || '',
                    updateInput.registrant || '',
                    '등록자',
                    salesTitle
                  );
                }

                if (originalSales.modelCode !== updatedRecord.modelCode) {
                  changedFields.push('모델코드');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 모델코드가 ${originalSales.modelCode || ''} → ${updatedRecord.modelCode || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    originalSales.modelCode || '',
                    updatedRecord.modelCode || '',
                    '모델코드',
                    salesTitle
                  );
                }

                if (originalSales.itemCode !== updatedRecord.itemCode) {
                  changedFields.push('품목코드');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 품목코드가 ${originalSales.itemCode || ''} → ${updatedRecord.itemCode || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    originalSales.itemCode || '',
                    updatedRecord.itemCode || '',
                    '품목코드',
                    salesTitle
                  );
                }

                if (originalSales.quantity !== updatedRecord.quantity) {
                  changedFields.push('수량');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 수량이 ${originalSales.quantity || ''} → ${updatedRecord.quantity || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    String(originalSales.quantity || ''),
                    String(updatedRecord.quantity || ''),
                    '수량',
                    salesTitle
                  );
                }

                if (originalSales.unitPrice !== updatedRecord.unitPrice) {
                  changedFields.push('단가');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 단가가 ${originalSales.unitPrice || ''} → ${updatedRecord.unitPrice || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    String(originalSales.unitPrice || ''),
                    String(updatedRecord.unitPrice || ''),
                    '단가',
                    salesTitle
                  );
                }

                if (originalSales.totalAmount !== updatedRecord.totalAmount) {
                  changedFields.push('총액');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 총액이 ${originalSales.totalAmount || ''} → ${updatedRecord.totalAmount || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    String(originalSales.totalAmount || ''),
                    String(updatedRecord.totalAmount || ''),
                    '총액',
                    salesTitle
                  );
                }

                if (originalSales.deliveryDate !== updatedRecord.deliveryDate) {
                  changedFields.push('납품일');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 납품일이 ${originalSales.deliveryDate || ''} → ${updatedRecord.deliveryDate || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    originalSales.deliveryDate || '',
                    updatedRecord.deliveryDate || '',
                    '납품일',
                    salesTitle
                  );
                }

                if (originalSales.notes !== updatedRecord.notes) {
                  changedFields.push('비고');
                  await addChangeLog(
                    '수정',
                    salesCode,
                    `매출관리 ${salesTitle}(${salesCode}) 개요탭의 비고가 ${originalSales.notes || ''} → ${updatedRecord.notes || ''} 로 수정 되었습니다.`,
                    updatedRecord.businessUnit || '미분류',
                    originalSales.notes || '',
                    updatedRecord.notes || '',
                    '비고',
                    salesTitle
                  );
                }
              }

              console.log('✅ 매출 수정 완료');

              // 토스트 알림 추가
              if (changedFields.length > 0) {
                const salesCode = updateInput.code || `SALES-${updateInput.id}`;
                const fieldsText = changedFields.join(', ');
                setSnackbar({
                  open: true,
                  message: `${salesCode}의 ${fieldsText}이 수정되었습니다.`,
                  severity: 'success'
                });
              }
            } catch (error) {
              console.error('❌ 매출 데이터 업데이트 실패:', error);
            }
          } else {
            // 신규 데이터 생성
            try {
              console.log('📝 신규 매출 데이터 생성:', updatedRecord);

              // 서브코드를 서브코드명으로 변환
              const customerNameText = getCustomerName(updatedRecord.customerName);
              const salesTypeText = getSalesTypeName(updatedRecord.salesType);
              const statusText = getStatusName(updatedRecord.status);
              const businessUnitText = getBusinessUnitName(updatedRecord.businessUnit);

              console.log('🔄 서브코드명 변환:', {
                고객명: `${updatedRecord.customerName} → ${customerNameText}`,
                판매유형: `${updatedRecord.salesType} → ${salesTypeText}`,
                상태: `${updatedRecord.status} → ${statusText}`,
                사업부: `${updatedRecord.businessUnit} → ${businessUnitText}`
              });

              // SalesRecord를 CreateSalesInput으로 변환
              const createInput = {
                code: updatedRecord.code, // SalesEditDialog에서 생성된 코드 사용
                customerName: customerNameText, // 서브코드명으로 저장
                salesType: salesTypeText, // 서브코드명으로 저장
                status: statusText, // 서브코드명으로 저장
                businessUnit: businessUnitText, // 서브코드명으로 저장
                modelCode: updatedRecord.modelCode,
                itemCode: updatedRecord.itemCode,
                itemName: updatedRecord.itemName,
                quantity: updatedRecord.quantity,
                unitPrice: updatedRecord.unitPrice,
                totalAmount: updatedRecord.totalAmount,
                team: updatedRecord.team,
                registrant: updatedRecord.registrant,
                deliveryDate: updatedRecord.deliveryDate,
                notes: updatedRecord.notes,
                contractDate: updatedRecord.contractDate,
                assignee: updatedRecord.assignee,
                registrationDate: updatedRecord.registrationDate
              };

              const newSales = await createSales(createInput);

              if (newSales) {
                console.log('✅ 신규 매출 생성 성공:', newSales);
                // 로컬 상태에 추가
                setSales((prev) => [newSales, ...prev]);

                // 변경로그 추가
                await addChangeLog(
                  '추가',
                  newSales.code,
                  `매출관리 ${newSales.customerName}(${newSales.code})의 데이터가 추가 되었습니다.`,
                  newSales.businessUnit || '미분류',
                  undefined,
                  undefined,
                  undefined,
                  newSales.itemName,
                  undefined
                );

                // 토스트 알림 추가
                const salesCode = newSales.code;
                setSnackbar({
                  open: true,
                  message: `${salesCode}이 성공적으로 등록되었습니다.`,
                  severity: 'success'
                });
              }
            } catch (error) {
              console.error('❌ 매출 데이터 생성 실패:', error);
            }
          }

          // 다이얼로그 닫기
          handleEditDialogClose();
        }}
      />

      {/* Snackbar 알림 */}
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

// SalesRecord 타입 정의 (SalesDataTable에서 가져옴)
interface SalesRecord {
  id: number;
  registrationDate: string;
  code: string;
  customerName: string;
  salesType: string; // 개발, 양산, 상품, 설비, 기타
  businessUnit: string;
  modelCode: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  team: string; // 팀
  registrant: string;
  deliveryDate: string;
  status: string; // 대기, 진행, 완료, 홀딩
  notes: string;
  isNew?: boolean;
  comments?: Array<{ id: number; author: string; content: string; timestamp: string; avatar?: string }>;
  materials?: Array<{ id: number; name: string; type: string; size: string; file?: File; uploadDate: string }>;
}

// 칸반 뷰 컴포넌트
interface SalesKanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  salesData: SalesRecord[];
  setSalesData: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string) => void;
  onCardClick: (sales: SalesRecord) => void;
  assigneeList?: any[];
  users?: any[];
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  snackbar?: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

function SalesKanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  salesData,
  setSalesData,
  addChangeLog,
  onCardClick,
  assigneeList,
  users,
  canEditOwn = true,
  canEditOthers = true,
  snackbar,
  setSnackbar
}: SalesKanbanViewProps) {
  const theme = useTheme();
  const { data: session } = useSession();
  const { masterCodes } = useCommonData();
  const { updateSales } = useSupabaseSales();

  // 코드를 코드명으로 변환하는 함수
  const getCodeName = useMemo(() => {
    return (groupCode: string, subCode: string) => {
      if (!masterCodes || masterCodes.length === 0) return subCode;

      const masterCode = masterCodes.find(
        (mc) => mc.group_code === groupCode && mc.subcode === subCode && mc.is_active
      );

      return masterCode?.subcode_name || subCode;
    };
  }, [masterCodes]);

  // 현재 로그인한 사용자 정보 조회
  const currentUser = useMemo(() => {
    if (!session?.user?.email || !users || users.length === 0) {
      console.log('🔍 [SalesKanbanView] currentUser: 없음');
      return null;
    }
    const found = users.find((u) => u.email === session.user.email);
    console.log('🔍 [SalesKanbanView] currentUser:', found ? found.user_name : '없음');
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 (생성자 또는 담당자)
  const isDataOwner = useCallback((sales: SalesRecord) => {
    if (!currentUser) return false;

    const currentUserName = currentUser.user_name;

    // registrant로 확인
    // registrant가 "홍길동 팀장" 형식일 수 있으므로, startsWith도 체크
    const registrantStartsWith = sales.registrant?.startsWith(currentUserName);
    const isAssignee = sales.registrant === currentUserName || registrantStartsWith;

    const result = isAssignee;

    console.log('🔍 [SalesKanbanView] 드래그 권한 체크:', {
      salesId: sales.id,
      registrant: sales.registrant,
      currentUserName,
      registrantStartsWith,
      isAssignee,
      isDataOwner: result,
      canEditOwn,
      canEditOthers,
      isDragDisabled: !(canEditOthers || (canEditOwn && result))
    });

    return result;
  }, [currentUser, canEditOwn, canEditOthers]);

  // 상태 관리
  const [activeSales, setActiveSales] = useState<SalesRecord | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // 데이터 필터링
  const filteredData = salesData.filter((sales) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const salesYear = new Date(sales.registrationDate).getFullYear().toString();
      if (salesYear !== selectedYear) return false;
    }

    // 팀 필터 (사업부로 매핑)
    if (selectedTeam !== '전체' && sales.businessUnit !== selectedTeam) return false;

    // 담당자 필터 (등록자로 매핑)
    if (selectedAssignee !== '전체' && sales.registrant !== selectedAssignee) return false;

    // 상태 필터 (판매유형으로 매핑)
    if (selectedStatus !== '전체' && sales.salesType !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    try {
      if (!event || !event.active || !event.active.id) {
        console.warn('유효하지 않은 드래그 시작 이벤트:', event);
        return;
      }

      const { active } = event;
      const draggedSales = salesData.find((sales) => sales.id === active.id);

      if (!draggedSales) {
        console.warn('드래그할 매출 데이터를 찾을 수 없음:', active.id);
        return;
      }

      setActiveSales(draggedSales);
      setIsDraggingState(true);
    } catch (error) {
      console.error('드래그 시작 처리 중 오류:', error);
      console.error('에러 상세:', {
        message: error.message,
        stack: error.stack,
        event: event ? { active: event.active } : null
      });
      setActiveSales(null);
      setIsDraggingState(false);
    }
  };

  // Sales 저장 핸들러
  const handleEditSalesSave = async (updatedSales: SalesRecord) => {
    // editingSales가 있으면 수정, 없으면 신규 생성
    if (editingSales) {
      // 기존 데이터 업데이트
      const originalSales = sales.find((s) => s.id === editingSales.id);
      try {
        // DB 업데이트
        await updateSales(updatedSales.id, updatedSales);

        // 로컬 상태 업데이트
        setSales((prev) => prev.map((s) => (s.id === updatedSales.id ? updatedSales : s)));

        // 변경로그 추가 - 변경된 필드 확인
        if (originalSales) {
          const changes: string[] = [];
          const salesCode = updatedSales.code || `SALES-${updatedSales.id}`;

          if (originalSales.salesType !== updatedSales.salesType) {
            changes.push(`판매유형: "${originalSales.salesType}" → "${updatedSales.salesType}"`);
          }
          if (originalSales.registrant !== updatedSales.registrant) {
            changes.push(`등록자: "${originalSales.registrant || '미할당'}" → "${updatedSales.registrant || '미할당'}"`);
          }
          if (originalSales.customerName !== updatedSales.customerName) {
            changes.push(`고객명: "${originalSales.customerName}" → "${updatedSales.customerName}"`);
          }
          if (originalSales.itemName !== updatedSales.itemName) {
            changes.push(`품목명 수정`);
          }
          if (originalSales.quantity !== updatedSales.quantity) {
            changes.push(`수량: ${originalSales.quantity} → ${updatedSales.quantity}`);
          }
          if (originalSales.deliveryDate !== updatedSales.deliveryDate) {
            changes.push(`배송일: "${originalSales.deliveryDate || '미정'}" → "${updatedSales.deliveryDate || '미정'}"`);
          }

          if (changes.length > 0) {
            addChangeLog(
              '매출 정보 수정',
              salesCode,
              `${updatedSales.customerName || '매출'} - ${changes.join(', ')}`,
              updatedSales.businessUnit || '미분류'
            );
          }
        }
      } catch (error) {
        console.error('매출 데이터 업데이트 실패:', error);
      }
    } else {
      // 신규 데이터 생성
      try {
        console.log('📝 신규 매출 데이터 생성:', updatedSales);

        // 코드 자동 생성 (DB의 id 기반)
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const dbSales = await getSales();
        const maxId = Math.max(...dbSales.map((s) => s.id || 0), 0);
        const newCode = `SALES-${currentYear}-${String(maxId + 1).padStart(3, '0')}`;

        console.log('🆕 자동 생성된 코드:', newCode);

        // SalesRecord를 CreateSalesInput으로 변환
        const createInput = {
          code: newCode, // 자동 생성된 코드 사용
          customerName: updatedSales.customerName,
          salesType: updatedSales.salesType,
          status: updatedSales.status,
          businessUnit: updatedSales.businessUnit,
          modelCode: updatedSales.modelCode,
          itemCode: updatedSales.itemCode,
          itemName: updatedSales.itemName,
          quantity: updatedSales.quantity,
          unitPrice: updatedSales.unitPrice,
          totalAmount: updatedSales.totalAmount,
          team: updatedSales.team,
          registrant: updatedSales.registrant,
          deliveryDate: updatedSales.deliveryDate,
          notes: updatedSales.notes,
          contractDate: updatedSales.contractDate,
          assignee: updatedSales.assignee,
          registrationDate: updatedSales.registrationDate
        };

        const newSales = await createSales(createInput);

        if (newSales) {
          console.log('✅ 신규 매출 생성 성공:', newSales);
          // 로컬 상태에 추가
          setSales((prev) => [newSales, ...prev]);

          // 변경로그 추가
          addChangeLog(
            '매출 데이터 생성',
            newSales.code,
            `${newSales.customerName} - ${newSales.itemName} (${Number(newSales.totalAmount).toLocaleString()}원)`,
            newSales.businessUnit || '미분류'
          );
        }
      } catch (error) {
        console.error('❌ 매출 데이터 생성 실패:', error);
      }
    }

    // 다이얼로그 닫기는 부모 컴포넌트에서 처리
    setEditDialog(false);
    setEditingSales(null);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    try {
      if (!event || !event.active) {
        console.warn('유효하지 않은 드래그 종료 이벤트:', event);
        setActiveSales(null);
        setIsDraggingState(false);
        return;
      }

      const { active, over } = event;
      setActiveSales(null);
      setIsDraggingState(false);

      if (!over || !active.id || !over.id) {
        console.warn('드롭 대상이나 드래그 대상 ID가 없음:', { active: active?.id, over: over?.id });
        return;
      }

      const salesId = active.id;
      const newStatus = over.id as string;

      // 상태가 변경된 경우만 업데이트
      const currentSales = salesData.find((s) => s.id === salesId);

      if (!currentSales) {
        console.warn('드래그한 매출 데이터를 찾을 수 없음:', salesId);
        return;
      }

      if (currentSales.status !== newStatus) {
        const oldStatus = currentSales.status;

        try {
          // DB 업데이트
          await updateSales(salesId as number, { status: newStatus });

          // 로컬 상태 업데이트
          setSalesData((prev) => {
            try {
              return prev.map((s) => (s.id === salesId ? { ...s, status: newStatus } : s));
            } catch (error) {
              console.error('상태 업데이트 중 오류:', error);
              return prev;
            }
          });

          // 변경로그 추가
          try {
            const salesCode = currentSales.code || `SALES-${salesId}`;
            const customerName = getCodeName('GROUP039', currentSales.customerName) || '매출정보 없음';
            const businessUnitName = getCodeName('GROUP035', currentSales.businessUnit) || '미분류';
            const description = `매출관리 ${customerName}(${salesCode}) 개요탭의 상태가 ${oldStatus} → ${newStatus}로 수정 되었습니다.`;

            addChangeLog('수정', salesCode, description, businessUnitName, oldStatus, newStatus, '상태', customerName, '칸반탭').catch((logError) => {
              console.error('변경로그 추가 중 비동기 오류:', logError);
            });
          } catch (logError) {
            console.error('변경로그 추가 중 오류:', logError);
          }

          // 토스트 알림 추가
          const salesCode = currentSales.code || `SALES-${salesId}`;
          const customerName = getCodeName('GROUP039', currentSales.customerName) || '매출정보 없음';
          setSnackbar({
            open: true,
            message: `매출관리 ${customerName}(${salesCode}) 개요탭의 상태가 ${oldStatus} → ${newStatus}로 수정 되었습니다.`,
            severity: 'success'
          });
        } catch (error) {
          console.error('매출 상태 업데이트 실패:', error);
        }
      }
    } catch (error) {
      console.error('드래그 종료 처리 중 오류:', error);
      console.error('에러 상세:', {
        message: error.message,
        stack: error.stack,
        event: event ? { active: event.active, over: event.over } : null
      });
      setActiveSales(null);
      setIsDraggingState(false);
    }
  };

  // 상태별 컬럼 정의 (판매유형 기준)
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

  // 매출관리 담당자 아바타 매핑
  const assigneeAvatars = {
    김영업: '/assets/images/users/avatar-1.png',
    이마케팅: '/assets/images/users/avatar-2.png',
    박세일즈: '/assets/images/users/avatar-3.png',
    최고객: '/assets/images/users/avatar-4.png',
    정판매: '/assets/images/users/avatar-5.png',
    한매출: '/assets/images/users/avatar-6.png',
    송비즈: '/assets/images/users/avatar-7.png',
    윤거래: '/assets/images/users/avatar-8.png'
  } as const;

  // 팀별 색상 매핑 (사업부 기준)
  const getTeamColor = (businessUnit: string) => {
    return { color: '#333333' };
  };

  // 담당자별 배경색 매핑 (등록자 기준)
  const getAssigneeStyle = (registrant: string) => {
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
    return colorMap[registrant] || '#E0E0E0';
  };

  // 드래그 가능한 카드 컴포넌트 (사양에 맞춰 완전히 새로 작성)
  function DraggableCard({ sales, canEditOwn = true, canEditOthers = true }: { sales: SalesRecord; canEditOwn?: boolean; canEditOthers?: boolean }) {
    // 드래그 권한 확인
    const isDragDisabled = !(canEditOthers || (canEditOwn && isDataOwner(sales)));

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: sales.id,
      disabled: isDragDisabled
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : (isDragDisabled ? 'default' : 'grab')
        }
      : { cursor: isDragDisabled ? 'default' : 'grab' };

    // 상태별 태그 색상 (매출관리 전용)
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
    const progress = sales.progress || getProgressByStatus(sales.status);
    const progressStage = (() => {
      if (progress >= 80) return '계약 체결';
      if (progress >= 60) return '협상 진행';
      if (progress >= 40) return '제안서 검토';
      if (progress >= 20) return '요구사항 분석';
      return '초기 접촉';
    })();

    return (
      <article
        ref={setNodeRef}
        style={style}
        {...(isDragDisabled ? {} : listeners)}
        {...attributes}
        className="kanban-card"
        onClick={async (e) => {
          try {
            if (!isDraggingState && !isDragging) {
              e.stopPropagation();
              await Promise.resolve(onCardClick(sales));
            }
          } catch (error) {
            console.error('카드 클릭 처리 중 오류:', error);
          }
        }}
      >
        {/* 1. 상태 태그 영역 */}
        <div className="status-tags">
          <span className="status-tag" style={getStatusTagStyle(sales.status)}>
            {sales.status}
          </span>
          <span className="incident-type-tag">{getCodeName('GROUP035', sales.businessUnit) || '일반사업부'}</span>
        </div>

        {/* 2. 카드 제목 */}
        <h3 className="card-title">{getCodeName('GROUP039', sales.customerName) || '고객명 없음'}</h3>

        {/* 3. 정보 라인 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">품목:</span>
            <span className="info-value">{sales.itemName || '품목명 없음'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">금액:</span>
            <span className="info-value">₩{sales.totalAmount?.toLocaleString() || '0'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">배송일:</span>
            <span className="info-value">{sales.deliveryDate || '미정'}</span>
          </div>
        </div>

        {/* 4. 카드 푸터 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={
                assigneeList?.find((user) => user.user_name === sales.registrant)?.profile_image_url ||
                assigneeList?.find((user) => user.user_name === sales.registrant)?.avatar_url ||
                '/assets/images/users/avatar-1.png'
              }
              alt={sales.registrant || '미할당'}
            />
            <span className="assignee-name">{sales.registrant || '미할당'}</span>
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
                  <DraggableCard key={item.id} sales={item} canEditOwn={canEditOwn} canEditOthers={canEditOthers} />
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

        <DragOverlay>{activeSales ? <DraggableCard sales={activeSales} /> : null}</DragOverlay>
      </DndContext>
    </Box>
  );
}
