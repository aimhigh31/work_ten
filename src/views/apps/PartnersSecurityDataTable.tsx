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
import { Add, Trash, DocumentDownload, AttachSquare, Profile2User, FolderOpen, CloseCircle } from '@wandersonalwes/iconsax-react';

// Project imports
import { PartnersSecurityRecord, requestTypeOptions, statusOptions, departmentOptions } from 'types/partners-security';
import { partnersSecurityData } from 'data/partners-security';

// ==============================|| 협력사보안 데이터 테이블 ||============================== //

interface PartnersSecurityDataTableProps {
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
  code: 120,
  requestType: 100,
  requestDepartment: 100,
  requester: 100,
  requestContent: 250,
  actionContent: 250,
  status: 90,
  assignee: 120,
  completionDate: 100,
  attachment: 80
};

// 담당자 목록 (실제로는 API에서 가져와야 함)
const assigneeOptions = [
  { name: '김철수', avatar: '/assets/images/users/avatar-1.png' },
  { name: '이민수', avatar: '/assets/images/users/avatar-2.png' },
  { name: '송민호', avatar: '/assets/images/users/avatar-3.png' },
  { name: '박영희', avatar: '/assets/images/users/avatar-4.png' },
  { name: '최윤정', avatar: '/assets/images/users/avatar-5.png' }
];

export default function PartnersSecurityDataTable({ selectedDepartment, selectedStatus, selectedYear }: PartnersSecurityDataTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<PartnersSecurityRecord[]>(partnersSecurityData);
  const [selected, setSelected] = useState<number[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [attachmentDialog, setAttachmentDialog] = useState<{ open: boolean; recordId: number | null }>({ open: false, recordId: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState<string>('');

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const departmentMatch = selectedDepartment === '전체' || record.requestDepartment === selectedDepartment;
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
  const generateCode = (records: PartnersSecurityRecord[]) => {
    const year = new Date().getFullYear().toString().slice(-2);
    const existingCodes = records
      .filter((record) => record.code.startsWith(`PRT-${year}-`))
      .map((record) => {
        const match = record.code.match(/PRT-\d{2}-(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const newNumber = maxNumber + 1;

    return `PRT-${year}-${newNumber.toString().padStart(3, '0')}`;
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
    const newRecord: PartnersSecurityRecord = {
      id: Math.max(...data.map((r) => r.id)) + 1,
      registrationDate: new Date().toISOString().split('T')[0],
      code: generateCode(data),
      requestType: '하드웨어',
      requestDepartment: 'IT팀',
      requester: '',
      requestContent: '',
      actionContent: '',
      status: '대기',
      assignee: '김철수',
      completionDate: '',
      attachment: false,
      attachmentCount: 0,
      attachments: [],
      isNew: true
    };

    setData((prev) => [newRecord, ...prev]);
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

          // 새 행인 경우 완성도 확인
          if (record.isNew) {
            updatedRecord.isNew = false;
          }

          return updatedRecord;
        }
        return record;
      })
    );
  };

  // 셀 편집 종료
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // 첨부파일 관련 함수들
  const handleAttachmentClick = (recordId: number) => {
    setAttachmentDialog({ open: true, recordId });
  };

  const handleAttachmentClose = () => {
    setAttachmentDialog({ open: false, recordId: null });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('word')) return '📝';
    if (type.includes('excel')) return '📊';
    if (type.includes('powerpoint')) return '📋';
    return '📁';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && attachmentDialog.recordId) {
      const newAttachments: AttachmentFile[] = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        type: file.type,
        size: formatFileSize(file.size),
        file: file,
        uploadDate: new Date().toISOString().split('T')[0]
      }));

      setData((prev) =>
        prev.map((record) => {
          if (record.id === attachmentDialog.recordId) {
            const updatedAttachments = [...record.attachments, ...newAttachments];
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
    }
  };

  const handleAttachmentDelete = (fileName: string) => {
    if (attachmentDialog.recordId) {
      setData((prev) =>
        prev.map((record) => {
          if (record.id === attachmentDialog.recordId) {
            const updatedAttachments = record.attachments.filter((att) => att.name !== fileName);
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
    }
  };

  const handleAttachmentDownload = (attachment: AttachmentFile) => {
    if (attachment.file) {
      // 실제 파일 다운로드
      const url = URL.createObjectURL(attachment.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // 파일이 없는 경우 시뮬레이션
      alert(`"${attachment.name}" 파일을 다운로드합니다.`);
    }
  };

  // 상태별 색상 설정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#fff3e0', color: '#e65100' };
      case '진행':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case '완료':
        return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case '취소':
        return { backgroundColor: '#ffebee', color: '#c62828' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#616161' };
    }
  };

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (record: PartnersSecurityRecord, field: string, value: string, options?: readonly string[]) => {
    const isEditing = editingCell?.id === record.id && editingCell?.field === field;

    if (isEditing) {
      if (options) {
        return (
          <Select
            value={value}
            onChange={(e) => handleCellEdit(record.id, field, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            sx={{ minWidth: 120 }}
          >
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        );
      } else if (field === 'requestContent' || field === 'actionContent') {
        return (
          <TextField
            value={value}
            onChange={(e) => handleCellEdit(record.id, field, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            multiline
            rows={2}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '12px'
              }
            }}
          />
        );
      } else if (field === 'completionDate') {
        return (
          <TextField
            type="date"
            value={value || ''}
            onChange={(e) => handleCellEdit(record.id, field, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            InputLabelProps={{
              shrink: true
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '12px'
              }
            }}
          />
        );
      } else {
        return (
          <TextField
            value={value}
            onChange={(e) => handleCellEdit(record.id, field, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '12px'
              }
            }}
          />
        );
      }
    }

    // 읽기 모드
    if (field === 'status') {
      const statusColor = getStatusColor(value);
      return (
        <Chip
          label={value}
          size="small"
          sx={{
            ...statusColor,
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
            fontSize: '12px'
          }}
          onClick={() => handleCellClick(record.id, field)}
        />
      );
    }

    if (field === 'requestType') {
      return (
        <Box
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'grey.50' }
          }}
          onClick={() => handleCellClick(record.id, field)}
        >
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            {value}
          </Typography>
        </Box>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.50' },
          p: 0.5,
          borderRadius: 1,
          fontSize: '12px'
        }}
        onClick={() => handleCellClick(record.id, field)}
      >
        {value}
      </Typography>
    );
  };

  // 담당자 셀 렌더링
  const renderAssigneeCell = (record: PartnersSecurityRecord) => {
    const isEditing = editingCell?.id === record.id && editingCell?.field === 'assignee';

    if (isEditing) {
      return (
        <Select
          value={record.assignee}
          onChange={(e) => handleCellEdit(record.id, 'assignee', e.target.value)}
          onBlur={handleCellBlur}
          size="small"
          autoFocus
          sx={{ minWidth: 150 }}
          renderValue={(selected) => {
            const assignee = assigneeOptions.find((a) => a.name === selected);
            return assignee ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24 }} src={assignee.avatar} />
                <Typography variant="body2">{assignee.name}</Typography>
              </Box>
            ) : (
              selected
            );
          }}
        >
          {assigneeOptions.map((assignee) => (
            <MenuItem key={assignee.name} value={assignee.name}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }} src={assignee.avatar} />
                <Typography variant="body2">{assignee.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      );
    }

    const assignee = assigneeOptions.find((a) => a.name === record.assignee);
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.50' },
          p: 0.5,
          borderRadius: 1
        }}
        onClick={() => handleCellClick(record.id, 'assignee')}
      >
        <Avatar sx={{ width: 24, height: 24 }} src={assignee?.avatar} />
        <Typography variant="body2" sx={{ fontSize: '12px' }}>
          {record.assignee}
        </Typography>
      </Box>
    );
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber - 1);
    }
    setGoToPage('');
  };

  return (
    <Box>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredData.length}건
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: 1500
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
                  checked={paginatedData.length > 0 && paginatedData.every((record) => selected.includes(record.id))}
                  indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.requestType, fontWeight: 600 }}>요청유형</TableCell>
              <TableCell sx={{ width: columnWidths.requestDepartment, fontWeight: 600 }}>요청부서</TableCell>
              <TableCell sx={{ width: columnWidths.requester, fontWeight: 600 }}>요청자</TableCell>
              <TableCell sx={{ width: columnWidths.requestContent, fontWeight: 600 }}>요청내용</TableCell>
              <TableCell sx={{ width: columnWidths.actionContent, fontWeight: 600 }}>조치내용</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.completionDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.attachment, fontWeight: 600 }}>첨부</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((record, index) => (
                <TableRow
                  key={record.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    backgroundColor: record.isNew ? 'action.selected' : 'inherit'
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
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      {record.code}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'requestType')}>
                    {renderEditableCell(record, 'requestType', record.requestType, requestTypeOptions)}
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'requestDepartment')}>
                    {renderEditableCell(record, 'requestDepartment', record.requestDepartment, departmentOptions)}
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'requester')}>
                    {renderEditableCell(record, 'requester', record.requester)}
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'requestContent')}>
                    {renderEditableCell(record, 'requestContent', record.requestContent)}
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'actionContent')}>
                    {renderEditableCell(record, 'actionContent', record.actionContent)}
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'status')}>
                    {renderEditableCell(record, 'status', record.status, statusOptions)}
                  </TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'assignee')}>{renderAssigneeCell(record)}</TableCell>
                  <TableCell onClick={() => handleCellClick(record.id, 'completionDate')}>
                    {renderEditableCell(record, 'completionDate', record.completionDate)}
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
                      onClick={() => handleAttachmentClick(record.id)}
                    >
                      <FolderOpen size={20} color="#9e9e9e" />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        ({record.attachmentCount})
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
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
              InputLabelProps={{ shrink: true }}
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

      {/* 첨부 파일 다이얼로그 */}
      <Dialog open={attachmentDialog.open} onClose={handleAttachmentClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 2, pt: 2 }}>
          <Box>
            <Typography variant="h6" component="div">
              첨부파일 관리
            </Typography>
            {attachmentDialog.recordId && (
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  const record = data.find((r) => r.id === attachmentDialog.recordId);
                  return record ? `${record.code} - ${record.requestContent}` : '';
                })()}
              </Typography>
            )}
          </Box>

          {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button onClick={handleAttachmentClose} variant="outlined" size="small" sx={{ minWidth: '60px' }}>
              취소
            </Button>
            <Button onClick={handleAttachmentClose} variant="contained" size="small" sx={{ minWidth: '60px' }}>
              저장
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ height: '650px', px: '5%' }}>
          {/* 파일 업로드 영역 */}
          <Box sx={{ mb: 3, pt: 2 }}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple style={{ display: 'none' }} accept="*/*" />

            {/* 업로드 버튼과 드래그 앤 드롭 영역 */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.100'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Stack spacing={2} alignItems="center">
                <Typography fontSize="48px">📁</Typography>
                <Typography variant="h6" color="primary.main">
                  파일을 업로드하세요
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  클릭하거나 파일을 여기로 드래그하세요
                </Typography>
                <Button variant="contained" size="small" startIcon={<Add size={16} />}>
                  파일 선택
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* 첨부파일 목록 */}
          {attachmentDialog.recordId &&
            (() => {
              const currentRecord = data.find((r) => r.id === attachmentDialog.recordId);
              return currentRecord && currentRecord.attachments.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    첨부된 파일 ({currentRecord.attachments.length}개)
                  </Typography>
                  <Stack spacing={2}>
                    {currentRecord.attachments.map((attachment, index) => (
                      <Paper
                        key={attachment.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'grey.300',
                          backgroundColor: 'background.paper',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.light',
                            boxShadow: 1
                          }
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          {/* 파일 아이콘 */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              backgroundColor: 'primary.50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography fontSize="24px">{getFileIcon(attachment.type)}</Typography>
                          </Box>

                          {/* 파일 정보 영역 */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 500,
                                mb: 0.5
                              }}
                            >
                              {attachment.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attachment.type} • {attachment.size}
                              {attachment.uploadDate && ` • ${attachment.uploadDate}`}
                            </Typography>
                          </Box>

                          {/* 액션 버튼들 */}
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="다운로드">
                              <IconButton size="small" onClick={() => handleAttachmentDownload(attachment)} color="primary" sx={{ p: 0.5 }}>
                                <DocumentDownload size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="삭제">
                              <IconButton
                                size="small"
                                onClick={() => handleAttachmentDelete(attachment.name)}
                                color="error"
                                sx={{ p: 0.5 }}
                              >
                                <CloseCircle size={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2.5,
                    mt: 2,
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6c757d',
                      lineHeight: 1.6,
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  >
                    첨부된 파일이 없습니다.
                  </Typography>
                </Box>
              );
            })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
