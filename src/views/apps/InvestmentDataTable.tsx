'use client';

import React, { useState, useMemo, useRef } from 'react';

// Material-UI
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Avatar,
  Pagination,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Trash, DocumentDownload, FolderOpen, CloseCircle, Edit } from '@wandersonalwes/iconsax-react';

// Project imports
import { investmentData, investmentAssigneeAvatars } from 'data/investment';
import { InvestmentTableData, InvestmentStatus, InvestmentTeam, InvestmentType, InvestmentData } from 'types/investment';

// hooks
import { useSupabaseInvestment } from 'hooks/useSupabaseInvestment';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';

// ==============================|| 투자 데이터 테이블 ||============================== //

interface InvestmentDataTableProps {
  selectedInvestmentType: string;
  selectedStatus: string;
  selectedYear: string;
  selectedTeam: string;
  selectedAssignee: string;
  investments: InvestmentTableData[];
  setInvestments: (investments: InvestmentTableData[]) => void;
  onEditInvestment?: (investment: InvestmentTableData) => void;
  onAddInvestment?: () => void;
  onDeleteInvestments?: (investments: InvestmentTableData[]) => void;
  addChangeLog?: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string
  ) => void;
}

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  investmentType: 100,
  investmentName: 200,
  amount: 130,
  team: 100,
  assignee: 110,
  status: 90,
  startDate: 100,
  completedDate: 110,
  attachment: 80
};

export default function InvestmentDataTable({
  selectedInvestmentType,
  selectedStatus,
  selectedYear,
  selectedTeam,
  selectedAssignee,
  investments,
  setInvestments,
  onEditInvestment,
  onAddInvestment,
  onDeleteInvestments,
  addChangeLog
}: InvestmentDataTableProps) {
  const theme = useTheme();

  // 사용자 프로필 정보 가져오기
  const { getUserAvatars } = useSupabaseUsers();
  const userAvatars = getUserAvatars();

  // props로 받은 investments를 사용
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [goToPage, setGoToPage] = useState<string>('');

  // 첨부파일 관련 상태
  const [attachmentDialog, setAttachmentDialog] = useState(false);
  const [currentInvestmentId, setCurrentInvestmentId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환
      const excelData = filteredData.map((investment, index) => ({
        NO: filteredData.length - index,
        등록일: investment.registrationDate,
        코드: investment.code,
        팀: investment.team,
        부서: investment.department,
        투자명: investment.investmentName,
        카테고리: investment.category,
        상태: investment.status,
        담당자: investment.assignee,
        투자금액: `${(investment.amount / 100000000).toFixed(0)}억원`,
        기대수익률: `${investment.expectedReturn}%`,
        위험도: investment.riskLevel,
        시작일: investment.startDate,
        완료일: investment.completedDate || '미정'
      }));

      // CSV 형식으로 데이터 변환 (Excel에서 열 수 있음)
      const csvContent = [
        // 헤더
        Object.keys(excelData[0] || {}).join(','),
        // 데이터 행들
        ...excelData.map((row) =>
          Object.values(row)
            .map((value) =>
              // CSV에서 쉼표가 포함된 값은 따옴표로 감싸기
              typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            )
            .join(',')
        )
      ].join('\n');

      // BOM 추가 (한글 깨짐 방지)
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 파일 다운로드
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `투자관리_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel 다운로드 중 오류 발생:', error);
      alert('Excel 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return investments.filter((investment) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const investmentYear = new Date(investment.registrationDate).getFullYear().toString();
        if (investmentYear !== selectedYear) return false;
      }
      // 투자유형 필터
      if (selectedInvestmentType !== '전체' && investment.investmentType !== selectedInvestmentType) return false;
      // 상태 필터
      if (selectedStatus !== '전체' && investment.status !== selectedStatus) return false;
      // 팀 필터
      if (selectedTeam !== '전체' && investment.team !== selectedTeam) return false;
      // 담당자 필터
      if (selectedAssignee !== '전체' && investment.assignee !== selectedAssignee) return false;

      return true;
    });
  }, [investments, selectedInvestmentType, selectedStatus, selectedYear, selectedTeam, selectedAssignee]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 전체 선택 처리
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map((investment) => investment.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 개별 선택 처리
  const handleSelectItem = (investmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, investmentId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== investmentId));
    }
  };

  // 페이지 변경 핸들러
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // Go to 페이지 핸들러
  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum - 1);
      setGoToPage('');
    }
  };

  // 상태 색상
  const getStatusColor = (status: InvestmentStatus) => {
    switch (status) {
      case '검토중':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행중':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '보류':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  // 팀 색상
  const getTeamColor = (team: InvestmentTeam) => {
    switch (team) {
      case '투자팀':
        return '#e3f2fd';
      case '분석팀':
        return '#f3e5f5';
      case '자산운용팀':
        return '#e1f5fe';
      case '리스크관리팀':
        return '#e8f5e8';
      default:
        return '#ffffff';
    }
  };

  // 투자유형 색상
  const getInvestmentTypeColor = (type: InvestmentType) => {
    switch (type) {
      case '주식':
        return '#e3f2fd';
      case '채권':
        return '#f3e5f5';
      case '펀드':
        return '#e1f5fe';
      case '부동산':
        return '#e8f5e8';
      case '원자재':
        return '#fff3e0';
      case '기타':
        return '#f5f5f5';
      default:
        return '#ffffff';
    }
  };

  // 위험도 색상
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case '낮음':
        return '#4caf50';
      case '보통':
        return '#2196f3';
      case '높음':
        return '#ff9800';
      case '매우높음':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  // 첨부파일 다이얼로그 열기
  const handleAttachmentClick = (investmentId: number) => {
    setCurrentInvestmentId(investmentId);
    setAttachmentDialog(true);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentInvestmentId) return;

    const fileNames = Array.from(files).map((file) => file.name);

    setInvestments(
      investments.map((investment) => {
        if (investment.id === currentInvestmentId) {
          return {
            ...investment,
            attachments: [...(investment.attachments || []), ...fileNames]
          };
        }
        return investment;
      })
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 첨부파일 삭제
  const handleAttachmentDelete = (fileName: string) => {
    if (!currentInvestmentId) return;

    setInvestments(
      investments.map((investment) => {
        if (investment.id === currentInvestmentId) {
          return {
            ...investment,
            attachments: investment.attachments?.filter((file) => file !== fileName) || []
          };
        }
        return investment;
      })
    );
  };

  // 편집 핸들러
  const handleEditInvestment = (investment: InvestmentTableData) => {
    if (onEditInvestment) {
      onEditInvestment(investment);
    }
  };

  const currentInvestment = currentInvestmentId ? investments.find((investment) => investment.id === currentInvestmentId) : null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DocumentDownload />}
            size="small"
            onClick={handleExcelDownload}
            sx={{
              borderColor: '#4CAF50',
              color: '#4CAF50',
              '&:hover': {
                borderColor: '#45A049',
                backgroundColor: '#E8F5E9'
              }
            }}
          >
            Excel Down
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            size="small"
            onClick={() => {
              console.log('추가 버튼 클릭됨', onAddInvestment);
              if (onAddInvestment) {
                onAddInvestment();
              } else {
                console.warn('onAddInvestment 함수가 정의되지 않음');
              }
            }}
          >
            추가
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Trash />}
            size="small"
            disabled={selectedItems.length === 0}
            onClick={() => {
              if (onDeleteInvestments && selectedItems.length > 0) {
                const selectedInvestments = investments.filter((inv) => selectedItems.includes(inv.id));
                if (window.confirm(`선택한 ${selectedItems.length}개의 투자를 삭제하시겠습니까?`)) {
                  selectedInvestments.forEach((investment) => {
                    // 변경로그 추가 (삭제 전에 호출)
                    if (addChangeLog) {
                      const investmentName = investment.investmentName || '투자';
                      addChangeLog(
                        '삭제',
                        investment.code,
                        `투자관리 ${investmentName}(${investment.code})이 삭제되었습니다.`,
                        investment.team || '미분류',
                        undefined,
                        undefined,
                        undefined,
                        investmentName
                      );
                    }
                    onDeleteInvestments([investment]);
                  });
                  setSelectedItems([]);
                }
              }
            }}
          >
            삭제({selectedItems.length})
          </Button>
        </Box>
      </Box>

      {/* 테이블 */}
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
            minWidth: 1400
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
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <Checkbox
                  checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < paginatedData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.investmentType, fontWeight: 600 }}>투자유형</TableCell>
              <TableCell sx={{ width: columnWidths.investmentName, fontWeight: 600 }}>투자명</TableCell>
              <TableCell sx={{ width: columnWidths.amount, fontWeight: 600 }}>투자금액</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completedDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.attachment, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((investment, index) => (
              <TableRow
                key={investment.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedItems.includes(investment.id)}
                    onChange={(e) => handleSelectItem(investment.id, e.target.checked)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {filteredData.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {investment.registrationDate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {investment.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {investment.investmentType}
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
                      maxWidth: 180
                    }}
                    title={investment.investmentName || '투자명 없음'}
                  >
                    {investment.investmentName || '투자명 없음'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {formatAmount(investment.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {investment.team}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      src={
                        userAvatars[investment.assignee] ||
                        investmentAssigneeAvatars[investment.assignee as keyof typeof investmentAssigneeAvatars]
                      }
                      alt={investment.assignee}
                      sx={{ width: 24, height: 24 }}
                    >
                      {investment.assignee?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '13px' }}>
                      {investment.assignee}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={investment.status}
                    size="small"
                    sx={{
                      ...getStatusColor(investment.status as InvestmentStatus),
                      fontWeight: 500,
                      fontSize: '13px'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {investment.startDate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                    {investment.completedDate || '미정'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="수정">
                      <IconButton size="small" onClick={() => handleEditInvestment(investment)} sx={{ color: 'primary.main' }}>
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
                setRowsPerPage(Number(e.target.value));
                setPage(0);
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
              onChange={(e) => setGoToPage(e.target.value)}
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
            {filteredData.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredData.length)} of ${filteredData.length}`
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

      {/* 첨부파일 관리 다이얼로그 */}
      <Dialog open={attachmentDialog} onClose={() => setAttachmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          첨부파일 관리
          {currentInvestment && (
            <Typography variant="body2" color="text.secondary">
              투자: {currentInvestment.code} - {currentInvestment.investmentName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {/* 파일 업로드 영역 */}
            <Box>
              <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="*/*" />
              <Button variant="outlined" onClick={() => fileInputRef.current?.click()} startIcon={<Add />} fullWidth>
                파일 선택
              </Button>
            </Box>

            {/* 첨부파일 목록 */}
            {currentInvestment?.attachments && currentInvestment.attachments.length > 0 ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  첨부된 파일 ({currentInvestment.attachments.length}개)
                </Typography>
                <List>
                  {currentInvestment.attachments.map((fileName, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <FolderOpen size={20} />
                      </ListItemIcon>
                      <ListItemText primary={fileName} secondary={`파일 ${index + 1}`} />
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="다운로드">
                          <IconButton color="primary" size="small">
                            <DocumentDownload size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton color="error" onClick={() => handleAttachmentDelete(fileName)} size="small">
                            <CloseCircle size={16} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  첨부된 파일이 없습니다.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
