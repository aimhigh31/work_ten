'use client';

import React, { useState, useMemo, useRef, Fragment } from 'react';

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
  Pagination
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Trash, DocumentDownload, AttachSquare, Profile2User, FolderOpen, CloseCircle, Edit } from '@wandersonalwes/iconsax-react';

// Project imports
import MainCard from 'components/MainCard';
import { ChecklistRecord, categoryOptions, statusOptions, departmentOptions, priorityOptions } from 'types/checklist';
import { sampleChecklistData } from 'data/checklist';
import ChecklistDialog from 'components/ChecklistDialog';
import { useCommonData } from 'contexts/CommonDataContext';

// ==============================|| 체크리스트 데이터 테이블 ||============================== //

interface ChecklistDataTableProps {
  selectedDepartment: string;
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

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 320,
  category: 100,
  title: 160,
  description: 160,
  status: 90,
  assignee: 120,
  action: 100
};

// 담당자 목록 (실제로는 API에서 가져와야 함)
const assigneeOptions = [
  { name: '김철수', avatar: '/assets/images/users/avatar-1.png' },
  { name: '이민수', avatar: '/assets/images/users/avatar-2.png' },
  { name: '송민호', avatar: '/assets/images/users/avatar-3.png' },
  { name: '박영희', avatar: '/assets/images/users/avatar-4.png' },
  { name: '최윤정', avatar: '/assets/images/users/avatar-5.png' }
];

export default function ChecklistDataTable({ selectedDepartment, selectedStatus, selectedYear }: ChecklistDataTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<ChecklistRecord[]>(sampleChecklistData);
  const [selected, setSelected] = useState<number[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [attachmentDialog, setAttachmentDialog] = useState<{ open: boolean; recordId: number | null }>({ open: false, recordId: null });
  const [checklistDialog, setChecklistDialog] = useState<{ open: boolean; checklist?: ChecklistRecord }>({ open: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // masterCodes 가져오기
  const { masterCodes } = useCommonData();

  // GROUP006 체크리스트분류 서브코드 목록
  const categoriesMap = useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP006' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // subcode → subcode_name 변환 함수 (체크리스트분류용)
  const getCategoryName = React.useCallback((subcode: string) => {
    if (!subcode) return '';
    const found = categoriesMap.find((item) => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [categoriesMap]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const departmentMatch = selectedDepartment === '전체' || record.assignee.includes(selectedDepartment);
      const statusMatch = selectedStatus === '전체' || record.status === selectedStatus;
      const yearMatch = selectedYear === '전체' || record.registrationDate.startsWith(selectedYear);

      return departmentMatch && statusMatch && yearMatch;
    });
  }, [data, selectedDepartment, selectedStatus, selectedYear]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 코드 생성 함수
  const generateCode = (records: ChecklistRecord[]) => {
    const year = new Date().getFullYear().toString().slice(-2);
    const existingCodes = records
      .filter((record) => record.code.startsWith(`ADMIN-CHECK-${year}-`))
      .map((record) => {
        const match = record.code.match(/ADMIN-CHECK-\d{2}-(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const newNumber = maxNumber + 1;

    return `ADMIN-CHECK-${year}-${newNumber.toString().padStart(3, '0')}`;
  };

  // 체크박스 관련 함수들
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((row) => row.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // 새 행 추가
  const handleAddRow = () => {
    setChecklistDialog({ open: true });
  };

  // 체크리스트 저장
  const handleSaveChecklist = (checklist: ChecklistRecord) => {
    if (checklist.id && data.find((r) => r.id === checklist.id)) {
      // 수정
      setData((prev) => prev.map((record) => (record.id === checklist.id ? { ...checklist, isNew: false } : record)));
    } else {
      // 추가
      const maxId = data.length > 0 ? Math.max(...data.map((r) => r.id)) : 0;
      const newChecklist = {
        ...checklist,
        id: maxId + 1,
        isNew: true
      };
      setData((prev) => [newChecklist, ...prev]);
    }
  };

  // 체크리스트 다이얼로그 닫기
  const handleCloseChecklistDialog = () => {
    setChecklistDialog({ open: false });
  };

  // 선택된 행 삭제
  const handleDeleteRows = () => {
    setData((prev) => prev.filter((record) => !selected.includes(record.id)));
    setSelected([]);
  };

  // 셀 편집 시작
  const handleCellClick = (id: number, field: string) => {
    if (field !== 'registrationDate' && field !== 'code') {
      setEditingCell({ id, field });
    }
  };

  // 셀 편집 저장
  const handleCellEdit = (recordId: number, field: string, value: any) => {
    setData((prev) =>
      prev.map((record) => {
        if (record.id === recordId) {
          const updatedRecord = { ...record, [field]: value };

          // 상태가 완료로 변경되면 완료일 자동 설정
          if (field === 'status' && value === '완료' && !record.completionDate) {
            updatedRecord.completionDate = new Date().toISOString().split('T')[0];
          }

          // 새로 추가된 행 표시 제거
          if (record.isNew) {
            updatedRecord.isNew = false;
          }

          return updatedRecord;
        }
        return record;
      })
    );
    setEditingCell(null);
  };

  // 행 클릭 체크박스 토글
  const handleRowClick = (id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
  };

  // 첨부파일 다이얼로그 열기
  const handleAttachmentClick = (recordId: number) => {
    setAttachmentDialog({ open: true, recordId });
  };

  // 첨부파일 다이얼로그 닫기
  const handleAttachmentDialogClose = () => {
    setAttachmentDialog({ open: false, recordId: null });
  };

  // 파일 업로드 처리
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !attachmentDialog.recordId) return;

    const recordId = attachmentDialog.recordId;
    const newFiles = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size),
      file: file,
      uploadDate: new Date().toISOString().split('T')[0]
    }));

    setData((prev) =>
      prev.map((record) => {
        if (record.id === recordId) {
          const updatedAttachments = [...record.attachments, ...newFiles];
          return {
            ...record,
            attachments: updatedAttachments,
            attachmentCount: updatedAttachments.length,
            attachment: updatedAttachments.length > 0
          };
        }
        return record;
      })
    );

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 삭제
  const handleFileDelete = (recordId: number, fileId: number) => {
    setData((prev) =>
      prev.map((record) => {
        if (record.id === recordId) {
          const updatedAttachments = record.attachments.filter((file) => file.id !== fileId);
          return {
            ...record,
            attachments: updatedAttachments,
            attachmentCount: updatedAttachments.length,
            attachment: updatedAttachments.length > 0
          };
        }
        return record;
      })
    );
  };

  // 파일 다운로드
  const handleFileDownload = (file: AttachmentFile) => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환
      const excelData = filteredData.map((record, index) => ({
        NO: filteredData.length - index,
        등록일: record.registrationDate,
        코드: record.code,
        업무분류: getCategoryName(record.category),
        제목: record.title,
        설명: record.description,
        상태: record.status,
        등록자: record.assignee,
        첨부파일: record.attachments.length + '개'
      }));

      // CSV 형식으로 변환
      const headers = Object.keys(excelData[0]).join(',');
      const rows = excelData.map((row) => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      // BOM 추가 (한글 깨짐 방지)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

      // 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `체크리스트_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Excel 다운로드 성공');
    } catch (error) {
      console.error('Excel 다운로드 실패:', error);
    }
  };

  // 페이지 변경
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📄';
    }
  };

  // 상태별 파스텔 색상 정의
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#FFF3E0', color: '#E65100' }; // 파스텔 오렌지
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' }; // 파스텔 블루
      case '완료':
        return { backgroundColor: '#E8F5E8', color: '#2E7D32' }; // 파스텔 그린
      case '취소':
        return { backgroundColor: '#FFEBEE', color: '#C62828' }; // 파스텔 레드
      default:
        return { backgroundColor: '#F5F5F5', color: '#616161' }; // 파스텔 그레이
    }
  };

  // 우선순위별 색상 정의
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음':
        return 'error';
      case '보통':
        return 'warning';
      case '낮음':
        return 'success';
      default:
        return 'default';
    }
  };

  // 현재 첨부파일 다이얼로그의 레코드 가져오기
  const currentRecord = data.find((record) => record.id === attachmentDialog.recordId);

  return (
    <>
      <MainCard content={false} border={false} boxShadow={false}>
        {/* 상단 정보 및 액션 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0, px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            총 {filteredData.length}건
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DocumentDownload size={16} />}
              size="small"
              onClick={handleExcelDownload}
              sx={{
                px: 2,
                borderColor: '#4CAF50',
                color: '#4CAF50',
                '&:hover': {
                  borderColor: '#4CAF50',
                  backgroundColor: '#4CAF50',
                  color: '#fff'
                }
              }}
            >
              Excel Down
            </Button>
            <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={handleAddRow} sx={{ px: 2 }}>
              추가
            </Button>
            <Button
              variant="outlined"
              startIcon={<Trash size={16} />}
              size="small"
              color="error"
              disabled={selected.length === 0}
              onClick={handleDeleteRows}
              sx={{
                px: 2,
                borderColor: selected.length > 0 ? 'error.main' : 'grey.300',
                color: selected.length > 0 ? 'error.main' : 'grey.500'
              }}
            >
              삭제 {selected.length > 0 && `(${selected.length})`}
            </Button>
          </Box>
        </Box>

        {/* 테이블 */}
        <TableContainer
          sx={{
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: 1360
            },
            maxHeight: 'calc(100vh - 200px)',
            mx: 2,
            mb: 2,
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            '&::-webkit-scrollbar': {
              width: 8,
              height: 8
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[200]
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: 4,
              '&:hover': {
                backgroundColor: theme.palette.grey[500]
              }
            }
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                borderBottom: '1px solid #e0e0e0',
                padding: '12px 16px',
                fontSize: '13px'
              }
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-head': {
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#000'
                  }
                }}
              >
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <Checkbox
                    checked={paginatedData.length > 0 && paginatedData.every((record) => selected.includes(record.id))}
                    indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ width: columnWidths.no }}>NO</TableCell>
                <TableCell sx={{ width: columnWidths.registrationDate }}>등록일</TableCell>
                <TableCell sx={{ width: columnWidths.code }}>코드</TableCell>
                <TableCell sx={{ width: columnWidths.category }}>업무분류</TableCell>
                <TableCell sx={{ width: columnWidths.title }}>제목</TableCell>
                <TableCell sx={{ width: columnWidths.description }}>설명</TableCell>
                <TableCell sx={{ width: columnWidths.status }}>상태</TableCell>
                <TableCell sx={{ width: columnWidths.assignee }}>등록자</TableCell>
                <TableCell sx={{ width: columnWidths.action }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <TableRow
                    key={record.id}
                    hover
                    selected={isSelected(record.id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      },
                      '&:last-child td': {
                        borderBottom: 0
                      },
                      cursor: 'pointer',
                      backgroundColor: record.isNew ? theme.palette.action.selected : 'inherit'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(record.id)}
                        onChange={(event) => {
                          const selectedIndex = selected.indexOf(record.id);
                          let newSelected: number[] = [];

                          if (selectedIndex === -1) {
                            newSelected = newSelected.concat(selected, record.id);
                          } else if (selectedIndex === 0) {
                            newSelected = newSelected.concat(selected.slice(1));
                          } else if (selectedIndex === selected.length - 1) {
                            newSelected = newSelected.concat(selected.slice(0, -1));
                          } else if (selectedIndex > 0) {
                            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
                          }
                          setSelected(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {filteredData.length - (page * rowsPerPage + index)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {record.registrationDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                        {record.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {getCategoryName(record.category)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '12px'
                        }}
                      >
                        {record.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        size="small"
                        sx={{
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: getStatusColor(record.status).backgroundColor,
                          color: '#000000' // 검정색으로 변경
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 0.5,
                          borderRadius: 1
                        }}
                      >
                        <Avatar sx={{ width: 24, height: 24 }} src={assigneeOptions.find((a) => a.name === record.assignee)?.avatar} />
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>
                          {record.assignee}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="편집">
                        <IconButton size="small" onClick={() => setChecklistDialog({ open: true, checklist: record })} color="primary">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      검색 결과가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
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
            mb: 1,
            px: 2,
            pt: 2,
            borderTop: '1px solid #e0e0e0',
            flexShrink: 0
          }}
        >
          {/* 왼쪽: 아이템 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
              {filteredData.length > 0
                ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredData.length)} of ${filteredData.length}`
                : '0-0 of 0'}
            </Typography>
          </Box>

          {/* 오른쪽: 페이지 네비게이션 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {totalPages > 0 && (
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={handlePageChange}
                color="primary"
                size="medium"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '14px',
                    minWidth: '32px',
                    height: '32px',
                    margin: '0 2px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    color: '#666'
                  },
                  '& .MuiPaginationItem-page.Mui-selected': {
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    border: '1px solid #1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  },
                  '& .MuiPaginationItem-page:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            )}
          </Box>
        </Box>
      </MainCard>
      {/* 첨부파일 다이얼로그 */}
      <Dialog open={attachmentDialog.open} onClose={handleAttachmentDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          첨부파일 관리
          {currentRecord && (
            <Typography variant="body2" color="text.secondary">
              {currentRecord.code} - {currentRecord.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple style={{ display: 'none' }} />

          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" startIcon={<Add />} onClick={() => fileInputRef.current?.click()}>
              파일 추가
            </Button>
          </Box>

          {currentRecord && currentRecord.attachments.length > 0 ? (
            <List>
              {currentRecord.attachments.map((file) => (
                <ListItem key={file.id} divider>
                  <ListItemIcon>
                    <Typography sx={{ fontSize: '24px' }}>{getFileIcon(file.name)}</Typography>
                  </ListItemIcon>
                  <ListItemText primary={file.name} secondary={`${file.size} • ${file.uploadDate}`} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleFileDownload(file)} color="primary">
                      <DocumentDownload />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleFileDelete(currentRecord.id, file.id)} color="error">
                      <CloseCircle />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              첨부된 파일이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAttachmentDialogClose}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 체크리스트 다이얼로그 */}
      <ChecklistDialog
        open={checklistDialog.open}
        onClose={handleCloseChecklistDialog}
        checklist={checklistDialog.checklist}
        onSave={handleSaveChecklist}
        generateCode={() => generateCode(data)}
      />
    </>
  );
}
