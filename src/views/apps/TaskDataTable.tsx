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
import { Add, Trash, DocumentDownload, AttachSquare, Profile2User, FolderOpen, CloseCircle, Edit } from '@wandersonalwes/iconsax-react';

// Project imports
import { taskData, assigneeAvatars } from 'data/task';
import { TaskTableData, TaskStatus, TaskDepartment, TaskTeam } from 'types/task';

// ==============================|| 업무 데이터 테이블 ||============================== //

interface TaskDataTableProps {
  selectedTeam: string;
  selectedStatus: string;
  selectedYear: string;
}

// 첨부파일 타입
interface AttachmentFile {
  id: number;
  name: string;
  type: string;
  size: string;
  file?: File;
  uploadDate: string;
}

// 컬럼 너비 정의 (VOC관리와 유사하게)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  team: 100,
  department: 80,
  workContent: 250,
  status: 90,
  assignee: 120,
  completedDate: 100,
  attachment: 80
};

export default function TaskDataTable({ selectedTeam, selectedStatus, selectedYear }: TaskDataTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<TaskTableData[]>(taskData);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [goToPage, setGoToPage] = useState<string>('');

  // 첨부파일 관련 상태
  const [attachmentDialog, setAttachmentDialog] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환
      const excelData = filteredData.map((task, index) => ({
        NO: index + 1,
        등록일: task.registrationDate,
        코드: task.code,
        팀: task.team,
        부서: task.department,
        업무내용: task.workContent,
        상태: task.status,
        담당자: task.assignee,
        완료일: task.completedDate || '미정',
        진행율: `${task.progress || 0}%`
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
      link.setAttribute('download', `업무관리_${new Date().toISOString().slice(0, 10)}.csv`);
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
    return data.filter((task) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const taskYear = new Date(task.registrationDate).getFullYear().toString();
        if (taskYear !== selectedYear) return false;
      }
      // 팀 필터
      if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;
      // 상태 필터
      if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

      return true;
    });
  }, [data, selectedTeam, selectedStatus, selectedYear]);

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
      setSelectedItems(paginatedData.map((task) => task.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 개별 선택 처리
  const handleSelectItem = (taskId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, taskId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== taskId));
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

  // 상태 색상 (VOC관리와 동일한 스타일)
  const getStatusColor = (status: TaskStatus) => {
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

  // 팀 색상
  const getTeamColor = (team: TaskTeam) => {
    switch (team) {
      case '개발팀':
        return '#e3f2fd';
      case '디자인팀':
        return '#f3e5f5';
      case '기획팀':
        return '#e1f5fe';
      case '마케팅팀':
        return '#e8f5e8';
      default:
        return '#ffffff';
    }
  };

  // 첨부파일 다이얼로그 열기
  const handleAttachmentClick = (taskId: number) => {
    setCurrentTaskId(taskId);
    setAttachmentDialog(true);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentTaskId) return;

    const fileNames = Array.from(files).map((file) => file.name);

    setData((prevData) =>
      prevData.map((task) => {
        if (task.id === currentTaskId) {
          return {
            ...task,
            attachments: [...(task.attachments || []), ...fileNames]
          };
        }
        return task;
      })
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 첨부파일 삭제
  const handleAttachmentDelete = (fileName: string) => {
    if (!currentTaskId) return;

    setData((prevData) =>
      prevData.map((task) => {
        if (task.id === currentTaskId) {
          return {
            ...task,
            attachments: task.attachments?.filter((file) => file !== fileName) || []
          };
        }
        return task;
      })
    );
  };

  const currentTask = currentTaskId ? data.find((task) => task.id === currentTaskId) : null;

  return (
    <Box>
      {/* 상단 액션 바 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          총 {filteredData.length}건
        </Typography>
        <Stack direction="row" spacing={1}>
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
          <Button variant="outlined" startIcon={<Add />} size="small">
            추가
          </Button>
          <Button variant="outlined" color="error" startIcon={<Trash />} size="small" disabled={selectedItems.length === 0}>
            삭제({selectedItems.length})
          </Button>
        </Stack>
      </Box>

      {/* 테이블 */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflowX: 'auto',
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
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.department, fontWeight: 600 }}>파트</TableCell>
              <TableCell sx={{ width: columnWidths.workContent, fontWeight: 600 }}>업무내용</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.completedDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.attachment, fontWeight: 600 }}>첨부</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((task) => (
              <TableRow
                key={task.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedItems.includes(task.id)}
                    onChange={(e) => handleSelectItem(task.id, e.target.checked)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {task.no}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {task.registrationDate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {task.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.team}
                    size="small"
                    sx={{
                      backgroundColor: getTeamColor(task.team as TaskTeam),
                      fontWeight: 500,
                      fontSize: '12px'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.department}
                    size="small"
                    sx={{
                      backgroundColor: task.department === 'IT' ? '#e3f2fd' : '#f3e5f5',
                      fontWeight: 500,
                      fontSize: '12px'
                    }}
                  />
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
                      maxWidth: 230
                    }}
                  >
                    {task.workContent || '업무내용 없음'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    size="small"
                    sx={{
                      ...getStatusColor(task.status as TaskStatus),
                      fontWeight: 500,
                      fontSize: '13px'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      src={assigneeAvatars[task.assignee as keyof typeof assigneeAvatars]}
                      alt={task.assignee}
                      sx={{ width: 24, height: 24 }}
                    >
                      {task.assignee?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 80, fontSize: '12px' }}>
                      {task.assignee}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {task.completedDate || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      p: 0.5,
                      borderRadius: 1
                    }}
                    onClick={() => handleAttachmentClick(task.id)}
                  >
                    <FolderOpen size={20} color="#9e9e9e" />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                      ({task.attachments?.length || 0})
                    </Typography>
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
          mt: 2,
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
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
                    textAlign: 'center',
                    fontSize: '0.875rem'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e0e0e0'
                  }
                }
              }}
            />
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
          {currentTask && (
            <Typography variant="body2" color="text.secondary">
              업무: {currentTask.code} - {currentTask.workContent}
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
            {currentTask?.attachments && currentTask.attachments.length > 0 ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  첨부된 파일 ({currentTask.attachments.length}개)
                </Typography>
                <List>
                  {currentTask.attachments.map((fileName, index) => (
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
