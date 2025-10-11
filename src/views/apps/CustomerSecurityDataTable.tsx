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
  Stack,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Trash, DocumentDownload, AttachSquare, Profile2User, FolderOpen, CloseCircle, Edit } from '@wandersonalwes/iconsax-react';

// Project imports
import {
  CustomerSecurityRecord,
  ChecklistEditorItem,
  OPLItem,
  inspectionTypeOptions,
  statusOptions,
  departmentOptions,
  customerOptions
} from 'types/customer-security';
import { customerSecurityData } from 'data/customer-security';
import { ChecklistRecord } from 'types/checklist';
import { sampleChecklistData } from 'data/checklist';

// ==============================|| 고객보안 데이터 테이블 ||============================== //

interface CustomerSecurityDataTableProps {
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
  checkbox: 40,
  no: 50,
  registrationDate: 85,
  code: 100,
  inspectionType: 75,
  customerName: 100, // 고객사 컬럼 추가
  inspectionTitle: 180,
  inspectionDate: 85,
  status: 70,
  assignee: 100,
  action: 70
};

// 담당자 목록 (실제로는 API에서 가져와야 함)
const assigneeOptions = [
  { name: '김철수', avatar: '/assets/images/users/avatar-1.png' },
  { name: '이민수', avatar: '/assets/images/users/avatar-2.png' },
  { name: '송민호', avatar: '/assets/images/users/avatar-3.png' },
  { name: '박영희', avatar: '/assets/images/users/avatar-4.png' },
  { name: '최윤정', avatar: '/assets/images/users/avatar-5.png' }
];

export default function CustomerSecurityDataTable({ selectedDepartment, selectedStatus, selectedYear }: CustomerSecurityDataTableProps) {
  const theme = useTheme();
  const [data, setData] = useState<CustomerSecurityRecord[]>(customerSecurityData);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [goToPage, setGoToPage] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 행 추가/수정 관련 상태
  const [actionDialog, setActionDialog] = useState({ open: false, recordId: null as number | null, isNew: false });
  const [activeTab, setActiveTab] = useState(0);
  const [tempRecord, setTempRecord] = useState<Partial<CustomerSecurityRecord>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 점검탭 관련 상태
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [checklistEditorData, setChecklistEditorData] = useState<ChecklistEditorItem[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // OPL 관련 상태
  const [selectedOplItems, setSelectedOplItems] = useState<number[]>([]);
  const [oplData, setOplData] = useState<OPLItem[]>([]);

  // 커스텀 알림창 상태
  const [customAlert, setCustomAlert] = useState({ open: false, message: '' });
  const [showOverviewValidationErrors, setShowOverviewValidationErrors] = useState(false);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter((inspection) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const inspectionYear = new Date(inspection.registrationDate).getFullYear().toString();
        if (inspectionYear !== selectedYear) return false;
      }
      // 부서 필터
      if (filterDepartment !== '전체') {
        // 담당자를 통한 부서 필터링 로직 필요
      }
      // 상태 필터
      if (filterStatus !== '전체' && inspection.status !== filterStatus) return false;
      // 검색어 필터
      if (
        searchKeyword &&
        !inspection.inspectionTitle.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !inspection.code.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !inspection.customerName.toLowerCase().includes(searchKeyword.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [data, filterDepartment, filterStatus, selectedYear, searchKeyword]);

  // 역순 정렬 및 NO 할당
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => b.id - a.id);
  }, [filteredData]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // 전체 선택 처리
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map((inspection) => inspection.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 개별 선택 처리
  const handleSelectItem = (inspectionId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, inspectionId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== inspectionId));
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

  // 점검 유형 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case '정기점검':
        return '#e3f2fd';
      case '비정기점검':
        return '#f3e5f5';
      case '특별점검':
        return '#fff3e0';
      case '긴급점검':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  // 고객사 색상 (새로 추가)
  const getCustomerColor = (customer: string) => {
    const colorMap: Record<string, string> = {
      삼성전자: '#e3f2fd',
      LG전자: '#f3e5f5',
      SK하이닉스: '#e1f5fe',
      현대자동차: '#e8f5e8',
      네이버: '#fff3e0',
      카카오: '#fce4ec',
      쿠팡: '#e8eaf6',
      배달의민족: '#f1f8e9',
      KT: '#e0f2f1',
      SKT: '#fce4ec'
    };
    return colorMap[customer] || '#f5f5f5';
  };

  // Action 다이얼로그 열기
  const handleActionClick = (recordId: number | null, isNew: boolean = false) => {
    if (isNew) {
      const newRecord: Partial<CustomerSecurityRecord> = {
        registrationDate: new Date().toISOString().split('T')[0],
        code: `CSI-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, '0')}`,
        inspectionType: '정기점검',
        customerName: '삼성전자',
        inspectionTitle: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        status: '대기',
        assignee: '김철수',
        attachment: false,
        attachmentCount: 0,
        attachments: [],
        isNew: true
      };
      setTempRecord(newRecord);
      setChecklistEditorData([]);
      setSelectedChecklistId(null);
      setOplData([]);
    } else {
      const record = data.find((item) => item.id === recordId);
      if (record) {
        setTempRecord({ ...record });
        // 저장된 체크리스트 에디터 데이터가 있으면 로드
        if (record.checklistEditorData && record.checklistEditorData.length > 0) {
          setChecklistEditorData(record.checklistEditorData);
          setSelectedChecklistId(record.selectedChecklistId || null);
        } else {
          setSelectedChecklistId(null);
          setChecklistEditorData([]);
        }
        // 저장된 OPL 데이터가 있으면 로드
        if (record.oplData && record.oplData.length > 0) {
          setOplData(record.oplData);
        } else {
          setOplData([]);
        }
      }
    }
    setActionDialog({ open: true, recordId, isNew });
    setActiveTab(0);
    setShowValidationErrors(false);
    setShowOverviewValidationErrors(false);
  };

  // 저장 처리
  const handleSave = () => {
    // 개요탭 필수 입력 검증
    if (!tempRecord.inspectionTitle?.trim() || !tempRecord.inspectionDate) {
      setShowOverviewValidationErrors(true);
      setCustomAlert({ open: true, message: '점검 제목과 점검일은 필수 입력해주세요.' });
      return;
    }

    // 점검탭이 활성화되어 있고 체크리스트 데이터가 있는 경우 유효성 검사
    if (activeTab === 1 && checklistEditorData.length > 0) {
      // 평가내용과 평가 각각 미완료 항목 확인
      const incompleteEvaluationContent = checklistEditorData.filter((item) => !item.evaluationContent?.trim());
      const incompleteEvaluation = checklistEditorData.filter((item) => item.evaluation === '대기');

      const totalIncompleteItems = incompleteEvaluationContent.length + incompleteEvaluation.length;

      if (totalIncompleteItems > 0) {
        setShowValidationErrors(true); // 유효성 검사 에러 표시 활성화

        // 커스텀 알림창으로 표시
        const alertMessage = `평가내용, 평가를 모두 입력해야 합니다.\n평가내용: ${incompleteEvaluationContent.length}개\n평가: ${incompleteEvaluation.length}개\n미완료 항목 총 ${totalIncompleteItems}개`;
        setCustomAlert({ open: true, message: alertMessage });

        return;
      }
    }

    if (actionDialog.isNew) {
      // 새 레코드 추가
      const newRecord = {
        ...tempRecord,
        id: Math.max(...data.map((d) => d.id)) + 1,
        isNew: false,
        checklistEditorData: checklistEditorData,
        selectedChecklistId: selectedChecklistId,
        oplData: oplData
      } as CustomerSecurityRecord;

      setData([newRecord, ...data]);
    } else {
      // 기존 레코드 수정
      setData(
        data.map((item) =>
          item.id === actionDialog.recordId
            ? {
                ...item,
                ...tempRecord,
                checklistEditorData: checklistEditorData,
                selectedChecklistId: selectedChecklistId,
                oplData: oplData
              }
            : item
        )
      );
    }

    setActionDialog({ open: false, recordId: null, isNew: false });
    setTempRecord({});
    setChecklistEditorData([]);
    setSelectedChecklistId(null);
    setOplData([]);
    setShowValidationErrors(false);
    setShowOverviewValidationErrors(false);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadDate: new Date().toISOString().split('T')[0],
      file: file
    }));

    setTempRecord((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
      attachmentCount: (prev.attachmentCount || 0) + newAttachments.length,
      attachment: true
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 첨부파일 삭제
  const handleAttachmentDelete = (attachmentId: number) => {
    setTempRecord((prev) => {
      const updatedAttachments = (prev.attachments || []).filter((att) => att.id !== attachmentId);
      return {
        ...prev,
        attachments: updatedAttachments,
        attachmentCount: updatedAttachments.length,
        attachment: updatedAttachments.length > 0
      };
    });
  };

  // 선택 항목 삭제
  const handleDelete = () => {
    if (selectedItems.length > 0) {
      if (window.confirm(`선택한 ${selectedItems.length}개 항목을 삭제하시겠습니까?`)) {
        setData(data.filter((item) => !selectedItems.includes(item.id)));
        setSelectedItems([]);
      }
    }
  };

  // 체크리스트 선택 시 에디터 데이터 로드
  const handleChecklistSelect = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setShowValidationErrors(false);

    // 샘플 에디터 데이터
    const sampleEditorData = [
      {
        id: 1,
        majorCategory: '시스템 보안',
        minorCategory: '서버 보안',
        item: '서버 보안 설정 확인',
        evaluationContent: '',
        evaluation: '대기',
        score: 0,
        attachments: []
      },
      {
        id: 2,
        majorCategory: '네트워크 보안',
        minorCategory: '방화벽',
        item: '네트워크 방화벽 규칙 점검',
        evaluationContent: '',
        evaluation: '대기',
        score: 0,
        attachments: []
      },
      {
        id: 3,
        majorCategory: '접근 통제',
        minorCategory: '사용자 권한',
        item: '접근 권한 검토',
        evaluationContent: '',
        evaluation: '대기',
        score: 0,
        attachments: []
      },
      {
        id: 4,
        majorCategory: '시스템 보안',
        minorCategory: '패치 관리',
        item: '보안 패치 적용 현황',
        evaluationContent: '',
        evaluation: '대기',
        score: 0,
        attachments: []
      },
      {
        id: 5,
        majorCategory: '모니터링',
        minorCategory: '로그 관리',
        item: '로그 모니터링 설정',
        evaluationContent: '',
        evaluation: '대기',
        score: 0,
        attachments: []
      }
    ];

    setChecklistEditorData(sampleEditorData);
  };

  // 점수 계산 함수
  const calculateTotalScore = () => {
    return checklistEditorData.reduce((total, item) => total + item.score, 0);
  };

  // 체크리스트 에디터 첨부파일 업로드 함수
  const handleChecklistFileUpload = (event: React.ChangeEvent<HTMLInputElement>, itemId: number) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: AttachmentFile[] = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        file: file,
        uploadDate: new Date().toISOString().split('T')[0]
      }));

      setChecklistEditorData((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              attachments: [...item.attachments, ...newAttachments]
            };
          }
          return item;
        })
      );
    }
  };

  // OPL 핸들러 함수들
  const handleOplAdd = () => {
    const newOplItem: OPLItem = {
      id: Date.now(),
      registrationDate: new Date().toISOString().split('T')[0],
      code: `OPL-${new Date().getFullYear()}-${String(oplData.length + 1).padStart(3, '0')}`,
      oplType: 'Middle',
      issuePhoto: '',
      issueDetail: '',
      improvementPhoto: '',
      improvementAction: '',
      assignee: '김철수',
      status: '대기',
      completionDate: '',
      attachments: []
    };
    setOplData((prev) => [newOplItem, ...prev]);
  };

  const handleOplDelete = () => {
    if (selectedOplItems.length > 0) {
      if (window.confirm(`선택한 ${selectedOplItems.length}개 OPL 항목을 삭제하시겠습니까?`)) {
        setOplData((prev) => prev.filter((item) => !selectedOplItems.includes(item.id)));
        setSelectedOplItems([]);
      }
    }
  };

  const handleOplSelect = (id: number) => {
    setSelectedOplItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleOplSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedOplItems(oplData.map((item) => item.id));
    } else {
      setSelectedOplItems([]);
    }
  };

  const handleOplAttachmentClick = (oplItemId: number) => {
    // OPL 첨부파일 관리 다이얼로그 열기 (향후 구현)
    alert(`OPL ID ${oplItemId}의 첨부파일 관리`);
  };

  return (
    <Box>
      {/* 상단 액션 바 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          총 {sortedData.length}건
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Add />} size="small" onClick={() => handleActionClick(null, true)}>
            추가
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Trash />}
            size="small"
            disabled={selectedItems.length === 0}
            onClick={handleDelete}
          >
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
              <TableCell sx={{ width: columnWidths.inspectionType, fontWeight: 600 }}>점검유형</TableCell>
              <TableCell sx={{ width: columnWidths.customerName, fontWeight: 600 }}>고객사</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionTitle, fontWeight: 600 }}>점검제목</TableCell>
              <TableCell sx={{ width: columnWidths.inspectionDate, fontWeight: 600 }}>점검일</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((inspection, index) => {
              const rowNo = sortedData.length - (page * rowsPerPage + index);

              return (
                <TableRow
                  key={inspection.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    backgroundColor: inspection.isNew ? 'success.lighter' : 'inherit'
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedItems.includes(inspection.id)}
                      onChange={(e) => handleSelectItem(inspection.id, e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      {rowNo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      {inspection.registrationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500 }}>
                      {inspection.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inspection.inspectionType}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        backgroundColor: getTypeColor(inspection.inspectionType),
                        color: '#333'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inspection.customerName}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        backgroundColor: getCustomerColor(inspection.customerName),
                        color: '#333',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 160
                      }}
                      title={inspection.inspectionTitle}
                    >
                      {inspection.inspectionTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      {inspection.inspectionDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inspection.status}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        backgroundColor: getStatusColor(inspection.status),
                        color: getStatusTextColor(inspection.status),
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '11px' }}>{inspection.assignee?.charAt(0)}</Avatar>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 60, fontSize: '12px' }}>
                        {inspection.assignee}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Tooltip title="팝업편집">
                        <IconButton size="small" color="primary" onClick={() => handleActionClick(inspection.id)}>
                          <Edit size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
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
                  }
                }
              }}
            />
          </Box>
        </Box>

        {/* 오른쪽: 페이지 네비게이션 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {sortedData.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, sortedData.length)} of ${sortedData.length}`
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

      {/* Action 다이얼로그 - 완전한 점검 편집 팝업 */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, recordId: null, isNew: false })}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '80vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" component="div">
                {actionDialog.isNew ? '새 고객보안점검 등록' : '고객보안점검 정보 수정'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tempRecord.code} - {new Date().toLocaleDateString('ko-KR')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setActionDialog({ open: false, recordId: null, isNew: false })} variant="outlined" size="small">
                취소
              </Button>
              <Button onClick={handleSave} variant="contained" size="small">
                저장
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="개요" />
            <Tab label="점검" />
            <Tab label="OPL" />
            <Tab label="점검성과보고" />
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3, overflow: 'auto' }}>
          {/* 개요 탭 */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              {/* 점검제목 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="점검제목"
                  value={tempRecord.inspectionTitle || ''}
                  onChange={(e) => setTempRecord((prev) => ({ ...prev, inspectionTitle: e.target.value }))}
                  size="small"
                  required
                  error={showOverviewValidationErrors && !tempRecord.inspectionTitle?.trim()}
                  helperText={showOverviewValidationErrors && !tempRecord.inspectionTitle?.trim() ? '점검제목을 입력해주세요' : ''}
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              {/* 점검유형 - 담당자 */}
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <TextField
                    select
                    label="점검유형"
                    value={tempRecord.inspectionType || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, inspectionType: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        position: 'absolute',
                        top: '-8px',
                        left: '8px',
                        backgroundColor: 'background.paper',
                        px: 0.5,
                        fontSize: '0.875rem'
                      }
                    }}
                    inputProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                    SelectProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    {inspectionTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <TextField
                    select
                    label="담당자"
                    value={tempRecord.assignee || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, assignee: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        position: 'absolute',
                        top: '-8px',
                        left: '8px',
                        backgroundColor: 'background.paper',
                        px: 0.5,
                        fontSize: '0.875rem'
                      }
                    }}
                    inputProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                    SelectProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    {assigneeOptions.map((option) => (
                      <MenuItem key={option.name} value={option.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }} src={option.avatar} />
                          <Typography variant="body2">{option.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              {/* 고객사 - 상태 */}
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <TextField
                    select
                    label="고객사"
                    value={tempRecord.customerName || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, customerName: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        position: 'absolute',
                        top: '-8px',
                        left: '8px',
                        backgroundColor: 'background.paper',
                        px: 0.5,
                        fontSize: '0.875rem'
                      }
                    }}
                    inputProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                    SelectProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    {customerOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <TextField
                    select
                    label="상태"
                    value={tempRecord.status || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, status: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        position: 'absolute',
                        top: '-8px',
                        left: '8px',
                        backgroundColor: 'background.paper',
                        px: 0.5,
                        fontSize: '0.875rem'
                      }
                    }}
                    inputProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                    SelectProps={{
                      sx: {
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              {/* 점검일 - 등록일 */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="점검일"
                  type="date"
                  value={tempRecord.inspectionDate || ''}
                  onChange={(e) => setTempRecord((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                  required
                  error={showOverviewValidationErrors && !tempRecord.inspectionDate}
                  helperText={showOverviewValidationErrors && !tempRecord.inspectionDate ? '점검일을 선택해주세요' : ''}
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="등록일"
                  value={tempRecord.registrationDate || ''}
                  disabled
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              {/* 점검코드 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="점검코드"
                  value={tempRecord.code || ''}
                  disabled
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              {/* 점검목적 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="점검목적"
                  multiline
                  rows={2}
                  value={tempRecord.purpose || ''}
                  onChange={(e) => setTempRecord((prev) => ({ ...prev, purpose: e.target.value }))}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              {/* 점검범위 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="점검범위"
                  multiline
                  rows={2}
                  value={tempRecord.scope || ''}
                  onChange={(e) => setTempRecord((prev) => ({ ...prev, scope: e.target.value }))}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              {/* 점검 세부내용 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="점검 세부내용"
                  multiline
                  rows={3}
                  value={tempRecord.content || ''}
                  onChange={(e) => setTempRecord((prev) => ({ ...prev, content: e.target.value }))}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'absolute',
                      top: '-8px',
                      left: '8px',
                      backgroundColor: 'background.paper',
                      px: 0.5,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* 점검 탭 */}
          {activeTab === 1 && (
            <Box>
              {/* 체크리스트 선택 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  체크리스트 선택
                </Typography>
                <FormControl fullWidth size="small">
                  <TextField
                    select
                    label="체크리스트를 선택하세요"
                    value={selectedChecklistId || ''}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setSelectedChecklistId(null);
                        setChecklistEditorData([]);
                      } else {
                        const checklistId = Number(e.target.value);
                        handleChecklistSelect(checklistId);
                      }
                    }}
                  >
                    <MenuItem value="">선택하세요</MenuItem>
                    {sampleChecklistData.map((checklist) => (
                      <MenuItem key={checklist.id} value={checklist.id}>
                        {checklist.code} | {checklist.title}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Box>

              {/* 선택된 체크리스트의 에디터 테이블 */}
              {selectedChecklistId && checklistEditorData.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      점검 항목 ({checklistEditorData.length}개)
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      총 점수: {calculateTotalScore()}점
                    </Typography>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                          <TableCell width={50} sx={{ fontWeight: 600 }}>
                            NO
                          </TableCell>
                          <TableCell width={120} sx={{ fontWeight: 600 }}>
                            대분류
                          </TableCell>
                          <TableCell width={120} sx={{ fontWeight: 600 }}>
                            소분류
                          </TableCell>
                          <TableCell width={180} sx={{ fontWeight: 600 }}>
                            점검항목
                          </TableCell>
                          <TableCell width={200} sx={{ fontWeight: 600 }}>
                            평가내용
                          </TableCell>
                          <TableCell width={100} sx={{ fontWeight: 600 }}>
                            평가
                          </TableCell>
                          <TableCell width={80} sx={{ fontWeight: 600 }}>
                            점수
                          </TableCell>
                          <TableCell width={100} sx={{ fontWeight: 600 }}>
                            첨부
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {checklistEditorData.map((item, index) => (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ verticalAlign: 'top' }}>{index + 1}</TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <TextField
                                fullWidth
                                value={item.majorCategory}
                                onChange={(e) => {
                                  const updatedData = [...checklistEditorData];
                                  updatedData[index].majorCategory = e.target.value;
                                  setChecklistEditorData(updatedData);
                                }}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '12px',
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                      border: 'none'
                                    },
                                    '&:hover fieldset': {
                                      border: '1px solid #e0e0e0'
                                    },
                                    '&.Mui-focused fieldset': {
                                      border: '1px solid #1976d2'
                                    }
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <TextField
                                fullWidth
                                value={item.minorCategory}
                                onChange={(e) => {
                                  const updatedData = [...checklistEditorData];
                                  updatedData[index].minorCategory = e.target.value;
                                  setChecklistEditorData(updatedData);
                                }}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '12px',
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                      border: 'none'
                                    },
                                    '&:hover fieldset': {
                                      border: '1px solid #e0e0e0'
                                    },
                                    '&.Mui-focused fieldset': {
                                      border: '1px solid #1976d2'
                                    }
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <TextField
                                fullWidth
                                value={item.item}
                                onChange={(e) => {
                                  const updatedData = [...checklistEditorData];
                                  updatedData[index].item = e.target.value;
                                  setChecklistEditorData(updatedData);
                                }}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '12px',
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                      border: 'none'
                                    },
                                    '&:hover fieldset': {
                                      border: '1px solid #e0e0e0'
                                    },
                                    '&.Mui-focused fieldset': {
                                      border: '1px solid #1976d2'
                                    }
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={item.evaluationContent}
                                onChange={(e) => {
                                  const updatedData = [...checklistEditorData];
                                  updatedData[index].evaluationContent = e.target.value;
                                  setChecklistEditorData(updatedData);
                                }}
                                size="small"
                                variant="outlined"
                                placeholder="평가 내용 입력 (필수)"
                                required
                                error={showValidationErrors && !item.evaluationContent?.trim()}
                                sx={{
                                  fontSize: '12px',
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                      border: showValidationErrors && !item.evaluationContent?.trim() ? '1px solid #f44336' : 'none'
                                    },
                                    '&:hover fieldset': {
                                      border:
                                        showValidationErrors && !item.evaluationContent?.trim() ? '1px solid #f44336' : '1px solid #e0e0e0'
                                    },
                                    '&.Mui-focused fieldset': {
                                      border:
                                        showValidationErrors && !item.evaluationContent?.trim() ? '1px solid #f44336' : '1px solid #1976d2'
                                    }
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <FormControl fullWidth size="small" error={showValidationErrors && item.evaluation === '대기'}>
                                <Select
                                  value={item.evaluation}
                                  onChange={(e) => {
                                    const updatedData = [...checklistEditorData];
                                    updatedData[index].evaluation = e.target.value;

                                    // 점수 자동 계산
                                    let score = 0;
                                    switch (e.target.value) {
                                      case '양호':
                                        score = 3;
                                        break;
                                      case '보통':
                                        score = 2;
                                        break;
                                      case '미흡':
                                        score = 1;
                                        break;
                                      case '대기':
                                        score = 0;
                                        break;
                                    }
                                    updatedData[index].score = score;
                                    setChecklistEditorData(updatedData);
                                  }}
                                  variant="outlined"
                                  displayEmpty
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: showValidationErrors && item.evaluation === '대기' ? '#f44336' : undefined
                                      }
                                    }
                                  }}
                                >
                                  <MenuItem value="대기">대기</MenuItem>
                                  <MenuItem value="양호">양호</MenuItem>
                                  <MenuItem value="보통">보통</MenuItem>
                                  <MenuItem value="미흡">미흡</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Typography variant="body2" color="primary" sx={{ fontWeight: 600, fontSize: '12px' }}>
                                {item.score}점
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    // 해당 행의 첨부파일 업로드를 위한 파일 입력 생성
                                    const fileInput = document.createElement('input');
                                    fileInput.type = 'file';
                                    fileInput.multiple = true;
                                    fileInput.accept = '*/*';
                                    fileInput.onchange = (e) => {
                                      const target = e.target as HTMLInputElement;
                                      if (target.files) {
                                        handleChecklistFileUpload(e as any, item.id);
                                      }
                                    };
                                    fileInput.click();
                                  }}
                                  sx={{ p: 0.5 }}
                                >
                                  <AttachSquare size={16} />
                                </IconButton>
                                <Typography variant="caption" sx={{ fontSize: '11px' }}>
                                  ({item.attachments?.length || 0})
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* 합계 행 */}
                        <TableRow sx={{ backgroundColor: 'primary.50' }}>
                          <TableCell colSpan={6} sx={{ fontWeight: 600, textAlign: 'right' }}>
                            합계
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{calculateTotalScore()}점</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* 체크리스트 미선택 시 안내 메시지 */}
              {!selectedChecklistId && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    체크리스트를 선택하세요
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    상단에서 체크리스트를 선택하면 저장된 에디터 테이블이 로드됩니다.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* OPL 탭 */}
          {activeTab === 2 && (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Trash size={16} />}
                  onClick={handleOplDelete}
                  color="error"
                  disabled={selectedOplItems.length === 0}
                >
                  삭제 ({selectedOplItems.length})
                </Button>
                <Button variant="contained" size="small" startIcon={<Add size={16} />} onClick={handleOplAdd}>
                  추가
                </Button>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                  OPL (One Point Lesson)
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell padding="checkbox" width={35}>
                        <Checkbox
                          size="small"
                          checked={selectedOplItems.length === oplData.length && oplData.length > 0}
                          indeterminate={selectedOplItems.length > 0 && selectedOplItems.length < oplData.length}
                          onChange={handleOplSelectAll}
                        />
                      </TableCell>
                      <TableCell align="center" width={35} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        NO
                      </TableCell>
                      <TableCell align="center" width={95} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        등록일
                      </TableCell>
                      <TableCell align="center" width={100} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        코드/OPL유형
                      </TableCell>
                      <TableCell align="center" width={280} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        이슈 사진/내용
                      </TableCell>
                      <TableCell align="center" width={280} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        개선 사진/조치
                      </TableCell>
                      <TableCell align="center" width={100} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        담당자/상태
                      </TableCell>
                      <TableCell align="center" width={70} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        완료일
                      </TableCell>
                      <TableCell align="center" width={70} sx={{ fontWeight: 600, fontSize: '11px' }}>
                        첨부
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* OPL 데이터 */}
                    {oplData
                      .slice()
                      .reverse()
                      .map((row, index) => (
                        <TableRow key={row.id} hover sx={{ height: '180px' }}>
                          <TableCell padding="checkbox">
                            <Checkbox size="small" checked={selectedOplItems.includes(row.id)} onChange={() => handleOplSelect(row.id)} />
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '11px' }}>
                            {oplData.length - index}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '11px' }}>
                            {row.registrationDate}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 500 }}>{row.code}</Typography>
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                  value={row.oplType}
                                  onChange={(e) => {
                                    setOplData((prev) =>
                                      prev.map((item) => (item.id === row.id ? { ...item, oplType: e.target.value } : item))
                                    );
                                  }}
                                  size="small"
                                  sx={{
                                    fontSize: '10px',
                                    '& .MuiSelect-select': {
                                      py: 0.3,
                                      px: 0.5,
                                      backgroundColor:
                                        row.oplType === 'High' ? '#ffebee' : row.oplType === 'Middle' ? '#fff3e0' : '#e8f5e8',
                                      color: row.oplType === 'High' ? '#d32f2f' : row.oplType === 'Middle' ? '#f57c00' : '#388e3c',
                                      border: `1px solid ${row.oplType === 'High' ? '#ffcdd2' : row.oplType === 'Middle' ? '#ffcc02' : '#c8e6c9'}`
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none'
                                    }
                                  }}
                                >
                                  <MenuItem value="High" sx={{ fontSize: '10px' }}>
                                    High
                                  </MenuItem>
                                  <MenuItem value="Middle" sx={{ fontSize: '10px' }}>
                                    Middle
                                  </MenuItem>
                                  <MenuItem value="Low" sx={{ fontSize: '10px' }}>
                                    Low
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'center' }}>
                              {/* 이슈사진 */}
                              <Box>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  id={`issue-photo-${row.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const imageDataUrl = event.target?.result as string;
                                        setOplData((prev) =>
                                          prev.map((item) => (item.id === row.id ? { ...item, issuePhoto: imageDataUrl } : item))
                                        );
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <label htmlFor={`issue-photo-${row.id}`}>
                                  {row.issuePhoto ? (
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                      <img
                                        src={row.issuePhoto}
                                        alt="이슈사진"
                                        style={{
                                          width: '254px',
                                          height: '170px',
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          border: '1px solid #e0e0e0'
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: -8,
                                          right: -8,
                                          backgroundColor: '#2196f3',
                                          borderRadius: '50%',
                                          width: 16,
                                          height: 16,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <Typography sx={{ fontSize: '10px', color: 'white' }}>+</Typography>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <IconButton size="small" color="info" component="span">
                                      <Typography fontSize="16px">🖼️</Typography>
                                    </IconButton>
                                  )}
                                </label>
                              </Box>

                              {/* 이슈내용 */}
                              <Box sx={{ width: '254px' }}>
                                <TextField
                                  value={row.issueDetail}
                                  onChange={(e) => {
                                    setOplData((prev) =>
                                      prev.map((item) => (item.id === row.id ? { ...item, issueDetail: e.target.value } : item))
                                    );
                                  }}
                                  size="small"
                                  multiline
                                  rows={2}
                                  sx={{
                                    fontSize: '11px',
                                    width: '254px',
                                    '& .MuiInputBase-input': {
                                      fontSize: '11px',
                                      padding: '8px'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: '#e0e0e0'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#ccc'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#1976d2'
                                      }
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'center' }}>
                              {/* 개선사진 */}
                              <Box>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  id={`improvement-photo-${row.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const imageDataUrl = event.target?.result as string;
                                        setOplData((prev) =>
                                          prev.map((item) => (item.id === row.id ? { ...item, improvementPhoto: imageDataUrl } : item))
                                        );
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <label htmlFor={`improvement-photo-${row.id}`}>
                                  {row.improvementPhoto ? (
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                      <img
                                        src={row.improvementPhoto}
                                        alt="개선사진"
                                        style={{
                                          width: '254px',
                                          height: '170px',
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          border: '1px solid #e0e0e0'
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: -8,
                                          right: -8,
                                          backgroundColor: '#4caf50',
                                          borderRadius: '50%',
                                          width: 16,
                                          height: 16,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <Typography sx={{ fontSize: '10px', color: 'white' }}>+</Typography>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <IconButton size="small" color="success" component="span">
                                      <Typography fontSize="16px">🖼️</Typography>
                                    </IconButton>
                                  )}
                                </label>
                              </Box>

                              {/* 개선조치 */}
                              <Box sx={{ width: '254px' }}>
                                <TextField
                                  value={row.improvementAction}
                                  onChange={(e) => {
                                    setOplData((prev) =>
                                      prev.map((item) => (item.id === row.id ? { ...item, improvementAction: e.target.value } : item))
                                    );
                                  }}
                                  size="small"
                                  multiline
                                  rows={2}
                                  sx={{
                                    fontSize: '11px',
                                    width: '254px',
                                    '& .MuiInputBase-input': {
                                      fontSize: '11px',
                                      padding: '8px'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: '#e0e0e0'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#ccc'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#1976d2'
                                      }
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                  value={row.assignee}
                                  onChange={(e) => {
                                    setOplData((prev) =>
                                      prev.map((item) => (item.id === row.id ? { ...item, assignee: e.target.value } : item))
                                    );
                                  }}
                                  size="small"
                                  sx={{
                                    fontSize: '11px',
                                    '& .MuiSelect-select': {
                                      py: 0.3,
                                      px: 0.5,
                                      backgroundColor: '#f8f9fa',
                                      color: '#495057',
                                      border: '1px solid #dee2e6'
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none'
                                    }
                                  }}
                                >
                                  <MenuItem value="김철수" sx={{ fontSize: '11px' }}>
                                    김철수
                                  </MenuItem>
                                  <MenuItem value="이영희" sx={{ fontSize: '11px' }}>
                                    이영희
                                  </MenuItem>
                                  <MenuItem value="박민수" sx={{ fontSize: '11px' }}>
                                    박민수
                                  </MenuItem>
                                  <MenuItem value="정지원" sx={{ fontSize: '11px' }}>
                                    정지원
                                  </MenuItem>
                                  <MenuItem value="최은정" sx={{ fontSize: '11px' }}>
                                    최은정
                                  </MenuItem>
                                  <MenuItem value="임도현" sx={{ fontSize: '11px' }}>
                                    임도현
                                  </MenuItem>
                                  <MenuItem value="한수진" sx={{ fontSize: '11px' }}>
                                    한수진
                                  </MenuItem>
                                  <MenuItem value="조성민" sx={{ fontSize: '11px' }}>
                                    조성민
                                  </MenuItem>
                                </Select>
                              </FormControl>
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                  value={row.status}
                                  onChange={(e) => {
                                    setOplData((prev) =>
                                      prev.map((item) =>
                                        item.id === row.id ? { ...item, status: e.target.value as '대기' | '진행' | '완료' | '취소' } : item
                                      )
                                    );
                                  }}
                                  size="small"
                                  sx={{
                                    fontSize: '10px',
                                    '& .MuiSelect-select': {
                                      py: 0.3,
                                      px: 0.5,
                                      backgroundColor: row.status === '완료' ? '#e8f5e8' : row.status === '진행' ? '#fff3e0' : '#f5f5f5',
                                      color: row.status === '완료' ? '#388e3c' : row.status === '진행' ? '#f57c00' : '#757575',
                                      border: `1px solid ${row.status === '완료' ? '#c8e6c9' : row.status === '진행' ? '#ffcc02' : '#e0e0e0'}`
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none'
                                    }
                                  }}
                                >
                                  <MenuItem value="대기" sx={{ fontSize: '10px' }}>
                                    대기
                                  </MenuItem>
                                  <MenuItem value="진행" sx={{ fontSize: '10px' }}>
                                    진행
                                  </MenuItem>
                                  <MenuItem value="완료" sx={{ fontSize: '10px' }}>
                                    완료
                                  </MenuItem>
                                  <MenuItem value="취소" sx={{ fontSize: '10px' }}>
                                    취소
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '11px' }}>
                            <TextField
                              value={row.completionDate}
                              onChange={(e) => {
                                setOplData((prev) =>
                                  prev.map((item) => (item.id === row.id ? { ...item, completionDate: e.target.value } : item))
                                );
                              }}
                              type="date"
                              size="small"
                              sx={{
                                width: '110px',
                                '& .MuiInputBase-input': {
                                  fontSize: '11px',
                                  padding: '6px 8px'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleOplAttachmentClick(row.id)}>
                                <AttachSquare size={14} />
                              </IconButton>
                              {row.attachments && row.attachments.length > 0 && (
                                <Typography sx={{ fontSize: '11px' }}>({row.attachments.length})</Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}

                    {/* 데이터가 없을 때 */}
                    {oplData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            등록된 OPL이 없습니다.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* 점검성과보고 탭 */}
          {activeTab === 3 && (
            <Box sx={{ p: 3 }}>
              {/* 헤더 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, mb: 1 }}>
                  점검성과보고
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                  점검 완료 후 성과와 개선사항, 점검 소감을 종합하여 보고서를 작성하세요.
                </Typography>
              </Box>

              {/* 컨텐츠 영역 */}
              <Box>
                {/* 성과 섹션 */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      mb: 1,
                      color: 'primary.main'
                    }}
                  >
                    📈 성과
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.secondary',
                      mb: 2
                    }}
                  >
                    점검을 통해 달성한 구체적인 성과나 결과를 기록하세요.
                  </Typography>
                  <TextField
                    value={tempRecord.achievements || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, achievements: e.target.value }))}
                    placeholder="예시: 보안 취약점 발견 및 해결, 컴플라이언스 준수 확인, 프로세스 개선 등"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '12px' },
                      '& .MuiOutlinedInput-root': {
                        minHeight: 'auto',
                        '& fieldset': { borderColor: '#e0e0e0' },
                        '&:hover fieldset': { borderColor: '#c0c0c0' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                      }
                    }}
                  />
                </Box>

                {/* 개선사항 섹션 */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      mb: 1,
                      color: 'warning.main'
                    }}
                  >
                    🔧 개선사항
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.secondary',
                      mb: 2
                    }}
                  >
                    향후 점검에서 개선이 필요한 사항이나 보완점을 기록하세요.
                  </Typography>
                  <TextField
                    value={tempRecord.improvements || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, improvements: e.target.value }))}
                    placeholder="예시: 점검 주기 조정 필요, 점검 항목 추가, 점검 방법 개선, 담당자 교육 강화 등"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '12px' },
                      '& .MuiOutlinedInput-root': {
                        minHeight: 'auto',
                        '& fieldset': { borderColor: '#e0e0e0' },
                        '&:hover fieldset': { borderColor: '#c0c0c0' },
                        '&.Mui-focused fieldset': { borderColor: 'warning.main' }
                      }
                    }}
                  />
                </Box>

                {/* 점검소감 섹션 */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      mb: 1,
                      color: 'success.main'
                    }}
                  >
                    💭 점검소감
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.secondary',
                      mb: 2
                    }}
                  >
                    점검 과정에서의 전반적인 소감과 피드백을 종합하여 작성하세요.
                  </Typography>
                  <TextField
                    value={tempRecord.feedback || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, feedback: e.target.value }))}
                    placeholder="예시: 점검 과정의 어려움, 협조 사항, 개선된 점, 전반적인 점검 평가 등"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={5}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '12px' },
                      '& .MuiOutlinedInput-root': {
                        minHeight: 'auto',
                        '& fieldset': { borderColor: '#e0e0e0' },
                        '&:hover fieldset': { borderColor: '#c0c0c0' },
                        '&.Mui-focused fieldset': { borderColor: 'success.main' }
                      }
                    }}
                  />
                </Box>

                {/* 비고 섹션 */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    📝 비고
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.secondary',
                      mb: 2
                    }}
                  >
                    기타 특이사항이나 추가로 기록할 내용을 작성하세요.
                  </Typography>
                  <TextField
                    value={tempRecord.remarks || ''}
                    onChange={(e) => setTempRecord((prev) => ({ ...prev, remarks: e.target.value }))}
                    placeholder="예시: 점검 중 발생한 특이사항, 추가 조치사항, 후속 점검 계획 등"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '12px' },
                      '& .MuiOutlinedInput-root': {
                        minHeight: 'auto',
                        '& fieldset': { borderColor: '#e0e0e0' },
                        '&:hover fieldset': { borderColor: '#c0c0c0' },
                        '&.Mui-focused fieldset': { borderColor: 'text.primary' }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* 기록 탭 */}
          {activeTab === 4 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                기록 기능
              </Typography>
              <Typography variant="body2" color="text.secondary">
                기록 관련 기능이 추가될 예정입니다.
              </Typography>
            </Box>
          )}

          {/* 자료 탭 */}
          {activeTab === 5 && (
            <Box sx={{ height: '650px', px: '5%' }}>
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
              {tempRecord.attachments && tempRecord.attachments.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    첨부된 파일 ({tempRecord.attachments.length}개)
                  </Typography>
                  <Stack spacing={2}>
                    {tempRecord.attachments.map((attachment, index) => (
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
                            <Typography fontSize="24px">📄</Typography>
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
                              <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                                <DocumentDownload size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="삭제">
                              <IconButton size="small" onClick={() => handleAttachmentDelete(attachment.id)} color="error" sx={{ p: 0.5 }}>
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
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 커스텀 알림창 */}
      <Dialog
        open={customAlert.open}
        onClose={() => setCustomAlert({ open: false, message: '' })}
        PaperProps={{
          sx: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            m: 0,
            minWidth: 300,
            borderRadius: 2,
            boxShadow: 3
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
      >
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              minHeight: 24,
              whiteSpace: 'pre-line'
            }}
          >
            {customAlert.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setCustomAlert({ open: false, message: '' })} variant="contained" size="small" sx={{ minWidth: 60 }}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
