'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Backdrop,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Code, Add, Edit, Trash, Eye, Setting2, TableDocument, DocumentText } from '@wandersonalwes/iconsax-react';

// Supabase 타입 import - 마스터코드3 플랫 구조 사용
import { useSupabaseMasterCode3, GroupInfo, SubCodeInfo, MasterCodeFlat } from '../../hooks/useSupabaseMasterCode3';

// 플랫 구조에 맞춘 타입 별칭
type MasterCodeData2 = GroupInfo;
type SubCodeData2 = SubCodeInfo;

// 변경로그 타입 정의
interface ChangeLog {
  id: number;
  dateTime: string;
  team: string;
  user: string;
  action: string;
  target: string;
  description: string;
}

// 다이얼로그 상태 타입
interface MasterCodeDialogState {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  data: MasterCodeData2 | null;
}

interface SubCodeDialogState {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  mastercode_id: number | null;
  data: SubCodeData2 | null;
}

// ==============================|| 마스터코드관리3 메인 페이지 ||============================== //

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
      id={`mastercode-tabpanel-${index}`}
      aria-labelledby={`mastercode-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 3, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `mastercode-tab-${index}`,
    'aria-controls': `mastercode-tabpanel-${index}`
  };
}

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  masterCodes: MasterCodeData2[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function ChangeLogView({
  changeLogs,
  masterCodes,
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
          '& .MuiTable-root': {},
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
              <TableCell sx={{ fontWeight: 600, width: 130 }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>코드명</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 280 }}>변경 세부내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>담당자</TableCell>
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
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {log.target}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    {(() => {
                      const masterCode = masterCodes.find((mc) => mc.code_group === log.target);
                      return masterCode?.code_group_name || log.description.split(' - ')[0] || '코드명 없음';
                    })()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    {log.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '13px',
                      color: 'text.secondary',
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
                  <Chip
                    label={log.team}
                    variant="outlined"
                    sx={{
                      height: 22,
                      fontSize: '13px',
                      color: '#333333',
                      fontWeight: 500
                    }}
                  />
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
              <MenuItem key={5} value={5}>
                5
              </MenuItem>
              <MenuItem key={10} value={10}>
                10
              </MenuItem>
              <MenuItem key={25} value={25}>
                25
              </MenuItem>
              <MenuItem key={50} value={50}>
                50
              </MenuItem>
            </Select>
          </FormControl>

          {/* Go to */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Go to
            </Typography>
            <TextField
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

// ==============================|| 마스터코드 다이얼로그 ||============================== //
interface MasterCodeDialogProps {
  dialogState: MasterCodeDialogState;
  onClose: () => void;
  onSave: (data: any) => void;
}

function MasterCodeDialog({ dialogState, onClose, onSave }: MasterCodeDialogProps) {
  const [formData, setFormData] = useState({
    code_group: '',
    code_group_name: '',
    code_group_description: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    if (dialogState.open) {
      if (dialogState.data) {
        setFormData({
          code_group: dialogState.data.code_group,
          code_group_name: dialogState.data.code_group_name,
          code_group_description: dialogState.data.code_group_description || '',
          display_order: dialogState.data.display_order,
          is_active: dialogState.data.is_active
        });
      } else {
        // 새로 생성하는 경우 자동 생성될 것임을 표시
        setFormData({
          code_group: '자동 생성됩니다 (GROUP001 형식)',
          code_group_name: '',
          code_group_description: '',
          display_order: 0,
          is_active: true
        });
      }
    }
  }, [dialogState.open, dialogState.data]);

  const handleSave = () => {
    if (dialogState.mode === 'edit' && dialogState.data) {
      onSave({ ...formData, id: dialogState.data.id });
    } else {
      // 새 그룹 생성 시 code_group 필드를 제거하여 자동 생성되도록 함
      const { code_group, ...dataWithoutCodeGroup } = formData;
      onSave(dataWithoutCodeGroup);
    }
  };

  return (
    <Dialog open={dialogState.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {dialogState.mode === 'create' ? '마스터코드 추가' : dialogState.mode === 'edit' ? '마스터코드 수정' : '마스터코드 상세'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="코드 그룹"
            value={formData.code_group}
            onChange={(e) => setFormData({ ...formData, code_group: e.target.value })}
            fullWidth
            required
            disabled={true}
            helperText={dialogState.mode === 'create' ? 'GROUP001 형식으로 자동 생성됩니다' : ''}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.875rem' },
              '& .MuiInputBase-input': { fontSize: '0.875rem' }
            }}
          />
          <TextField
            label="코드 그룹명"
            value={formData.code_group_name}
            onChange={(e) => setFormData({ ...formData, code_group_name: e.target.value })}
            fullWidth
            required
            disabled={dialogState.mode === 'view'}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.875rem' },
              '& .MuiInputBase-input': { fontSize: '0.875rem' }
            }}
          />
          <TextField
            label="설명"
            value={formData.code_group_description}
            onChange={(e) => setFormData({ ...formData, code_group_description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            disabled={dialogState.mode === 'view'}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.875rem' },
              '& .MuiInputBase-input': { fontSize: '0.875rem' }
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                disabled={dialogState.mode === 'view'}
              />
            }
            label="활성화"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        {dialogState.mode !== 'view' && (
          <Button onClick={handleSave} variant="contained">
            {dialogState.mode === 'create' ? '추가' : '수정'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ==============================|| 서브코드 다이얼로그 ||============================== //
interface SubCodeDialogProps {
  dialogState: SubCodeDialogState;
  onClose: () => void;
  onSave: (data: any) => void;
}

function SubCodeDialog({ dialogState, onClose, onSave }: SubCodeDialogProps) {
  const [formData, setFormData] = useState({
    sub_code: '',
    sub_code_name: '',
    sub_code_description: '',
    code_value1: '',
    code_value2: '',
    code_value3: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    if (dialogState.data) {
      setFormData({
        sub_code: dialogState.data.sub_code,
        sub_code_name: dialogState.data.sub_code_name,
        sub_code_description: dialogState.data.sub_code_description || '',
        code_value1: dialogState.data.code_value1 || '',
        code_value2: dialogState.data.code_value2 || '',
        code_value3: dialogState.data.code_value3 || '',
        display_order: dialogState.data.display_order,
        is_active: dialogState.data.is_active
      });
    } else {
      setFormData({
        sub_code: '',
        sub_code_name: '',
        sub_code_description: '',
        code_value1: '',
        code_value2: '',
        code_value3: '',
        display_order: 0,
        is_active: true
      });
    }
  }, [dialogState.data]);

  const handleSave = () => {
    if (dialogState.mode === 'edit' && dialogState.data) {
      onSave({ ...formData, id: dialogState.data.id });
    } else if (dialogState.mastercode_id) {
      onSave({ ...formData, mastercode_id: dialogState.mastercode_id });
    }
  };

  return (
    <Dialog open={dialogState.open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {dialogState.mode === 'create' ? '서브코드 추가' : dialogState.mode === 'edit' ? '서브코드 수정' : '서브코드 상세'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="서브코드"
                value={formData.sub_code}
                onChange={(e) => setFormData({ ...formData, sub_code: e.target.value })}
                fullWidth
                required
                disabled={dialogState.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="서브코드명"
                value={formData.sub_code_name}
                onChange={(e) => setFormData({ ...formData, sub_code_name: e.target.value })}
                fullWidth
                required
                disabled={dialogState.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="설명"
                value={formData.sub_code_description}
                onChange={(e) => setFormData({ ...formData, sub_code_description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                disabled={dialogState.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="추가값1 (색상 등)"
                value={formData.code_value1}
                onChange={(e) => setFormData({ ...formData, code_value1: e.target.value })}
                fullWidth
                disabled={dialogState.mode === 'view'}
                placeholder="#ff0000"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="추가값2"
                value={formData.code_value2}
                onChange={(e) => setFormData({ ...formData, code_value2: e.target.value })}
                fullWidth
                disabled={dialogState.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="추가값3"
                value={formData.code_value3}
                onChange={(e) => setFormData({ ...formData, code_value3: e.target.value })}
                fullWidth
                disabled={dialogState.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="표시 순서"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                fullWidth
                disabled={dialogState.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={dialogState.mode === 'view'}
                  />
                }
                label="활성화"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        {dialogState.mode !== 'view' && (
          <Button onClick={handleSave} variant="contained">
            {dialogState.mode === 'create' ? '추가' : '수정'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function MasterCodeManagement() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // 메인 탭 상태 (데이터, 변경로그)
  const [mainTabValue, setMainTabValue] = useState(0);

  // 선택된 마스터코드
  const [selectedMasterCode, setSelectedMasterCode] = useState<number | null>(null);

  // 클릭 디바운싱을 위한 타임아웃 상태
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  // 체크박스 선택 상태
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedSubItems, setSelectedSubItems] = useState<Set<number>>(new Set());

  // 편집 상태 관리
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: any }>({});

  // 새 행 추가 상태
  const [newRowData, setNewRowData] = useState<any>(null);

  // 새 마스터코드 행 추가 상태

  // 다이얼로그 상태
  const [masterCodeDialog, setMasterCodeDialog] = useState<MasterCodeDialogState>({
    open: false,
    mode: 'create',
    data: null
  });

  const [subCodeDialog, setSubCodeDialog] = useState<SubCodeDialogState>({
    open: false,
    mode: 'create',
    mastercode_id: null,
    data: null
  });

  // 스낵바 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // Supabase 플랫 구조 훅 사용
  const {
    groups,
    subCodes: allSubCodes,
    loading,
    error,
    getAllMasterCodes,
    processAllData,
    refreshData,
    createGroup,
    updateGroup,
    createSubCode,
    updateSubCode,
    deleteSubCode,
    deleteGroup,
    getSubCodesByGroup
  } = useSupabaseMasterCode3();

  // 기존 컴포넌트와 호환성을 위한 데이터 변환
  const masterCodes: MasterCodeData2[] = groups
    .sort((a, b) => a.group_code.localeCompare(b.group_code)) // 그룹 코드 순서로 정렬
    .map((group, index) => ({
      ...group,
      id: index + 1, // 임시 ID 추가
      code_group: group.group_code,
      code_group_name: group.group_code_name,
      code_group_description: group.group_code_description,
      display_order: group.group_code_order,
      is_active: group.group_code_status === 'active'
    }))
    .reverse(); // NO 역순으로 표시 (최신 그룹이 위로)
  const subCodes: SubCodeData2[] = allSubCodes.map((subCode) => ({
    ...subCode,
    sub_code: subCode.subcode,
    sub_code_name: subCode.subcode_name,
    sub_code_description: subCode.subcode_description,
    display_order: subCode.subcode_order,
    mastercode_id: masterCodes.find((mc) => mc.code_group === subCode.group_code)?.id || 0
  }));

  // 디버깅 로그
  console.log('🔄 데이터 상태:', {
    groups: groups.length,
    allSubCodes: allSubCodes.length,
    subCodes: subCodes.length,
    masterCodes: masterCodes.length,
    selectedMasterCode,
    loading,
    error
  });

  // 변경로그 상태 - 초기 데이터는 샘플 데이터 사용
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([
    {
      id: 1,
      dateTime: '2024-01-15 14:30',
      team: 'IT팀',
      user: '김개발',
      action: '마스터코드 생성',
      target: 'TASK_STATUS',
      description: '업무 상태 코드 그룹 생성 - 계획, 진행중, 완료, 취소 서브코드 포함'
    },
    {
      id: 2,
      dateTime: '2024-01-15 15:45',
      team: 'IT팀',
      user: '이관리',
      action: '서브코드 수정',
      target: 'TASK_STATUS',
      description: '진행중 서브코드 설명 변경 - "작업 진행 중" → "업무 진행 중"'
    },
    {
      id: 3,
      dateTime: '2024-01-16 09:20',
      team: 'IT팀',
      user: '박시스템',
      action: '마스터코드 수정',
      target: 'USER_ROLE',
      description: '사용자 역할 코드 그룹 설명 업데이트'
    },
    {
      id: 4,
      dateTime: '2024-01-16 11:15',
      team: '기획팀',
      user: '최기획',
      action: '서브코드 생성',
      target: 'PRIORITY_LEVEL',
      description: '우선순위 레벨에 "긴급" 서브코드 추가'
    }
  ]);

  // 선택된 마스터코드에 따른 서브코드 필터링 및 정렬순서로 정렬
  const filteredSubCodes = selectedMasterCode
    ? (() => {
        const selectedMasterCodeInfo = masterCodes.find((mc) => mc.id === selectedMasterCode);
        const groupCode = selectedMasterCodeInfo?.code_group;
        console.log('🔍 filteredSubCodes 계산:', {
          selectedMasterCode,
          selectedMasterCodeInfo,
          groupCode,
          allSubCodes: subCodes.length,
          allSubCodesFromHook: allSubCodes.length
        });

        // getSubCodesByGroup은 SubCodeInfo 타입을 반환하므로, SubCodeData2 타입으로 변환
        const rawResult = groupCode ? getSubCodesByGroup(groupCode) : [];
        const result = rawResult.map((subCode) => ({
          ...subCode,
          sub_code: subCode.subcode,
          sub_code_name: subCode.subcode_name,
          sub_code_description: subCode.subcode_description,
          display_order: subCode.subcode_order,
          mastercode_id: selectedMasterCodeInfo?.id || 0
        }));

        console.log('🔍 getSubCodesByGroup 결과:', {
          groupCode,
          rawResultCount: rawResult.length,
          rawResult: rawResult.map((s) => ({ id: s.id, subcode: s.subcode, subcode_name: s.subcode_name })),
          finalResultCount: result.length,
          finalResult: result.map((s) => ({ id: s.id, sub_code: s.sub_code, sub_code_name: s.sub_code_name }))
        });
        return result;
      })()
    : [];

  // 변경로그 추가 함수
  const addChangeLog = (action: string, target: string, description: string) => {
    const newLog: ChangeLog = {
      id: changeLogs.length + 1,
      dateTime: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      team: 'IT팀',
      user: '사용자',
      action,
      target,
      description
    };
    setChangeLogs((prev) => [newLog, ...prev]);
  };

  // 마스터코드 선택 핸들러 (디바운싱 적용)
  const handleMasterCodeSelect = useCallback(
    (masterCodeId: number) => {
      // 이전 타임아웃이 있으면 취소
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      // 50ms 디바운싱으로 빠른 연속 클릭 방지
      const timeout = setTimeout(() => {
        setSelectedMasterCode(masterCodeId);
        setClickTimeout(null);
      }, 50);

      setClickTimeout(timeout);
    },
    [clickTimeout]
  );

  // ========================================
  // 이벤트 핸들러
  // ========================================

  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
  };

  // 마스터코드 관리
  const handleCreateMasterCode = () => {
    setMasterCodeDialog({
      open: true,
      mode: 'create',
      data: null
    });
  };

  const handleEditMasterCode = (data: MasterCodeData2) => {
    setMasterCodeDialog({
      open: true,
      mode: 'edit',
      data
    });
  };

  const handleDeleteMasterCode = async (id: number) => {
    try {
      const deletedGroup = groups.find((g) => g.group_code === masterCodes.find((mc) => mc.id === id)?.code_group);
      const groupCode = deletedGroup?.group_code;

      if (groupCode) {
        await deleteGroup(groupCode);

        setSnackbar({
          open: true,
          message: '마스터코드 그룹이 삭제되었습니다.',
          severity: 'success'
        });

        // 변경로그 추가
        if (deletedGroup) {
          addChangeLog('마스터코드 삭제', deletedGroup.group_code, `삭제: ${deletedGroup.group_code_name}`);
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '마스터코드 삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleSaveMasterCode = async (data: any) => {
    try {
      console.log('🔧 handleSaveMasterCode 시작:', data);

      if (data.id) {
        // 수정
        console.log('📝 그룹 수정 시도:', {
          groupCode: data.code_group,
          updateData: {
            group_code_name: data.code_group_name,
            group_code_description: data.code_group_description || '',
            group_code_status: data.is_active ? 'active' : 'inactive'
          }
        });

        await updateGroup(data.code_group, {
          group_code_name: data.code_group_name,
          group_code_description: data.code_group_description || '',
          group_code_status: data.is_active ? 'active' : 'inactive'
        });

        console.log('✅ 그룹 수정 성공');

        setSnackbar({
          open: true,
          message: '마스터코드 그룹이 수정되었습니다.',
          severity: 'success'
        });

        // 변경로그 추가
        addChangeLog('마스터코드 수정', data.code_group, `수정: ${data.code_group_name}`);
      } else {
        // 새 그룹 생성 (그룹만 생성)
        await createGroup({
          group_code: data.code_group,
          group_code_name: data.code_group_name,
          group_code_description: data.code_group_description || '',
          group_code_status: data.is_active ? 'active' : 'inactive',
          group_code_order: data.display_order
        });

        setSnackbar({
          open: true,
          message: '마스터코드 그룹이 생성되었습니다.',
          severity: 'success'
        });
        addChangeLog('마스터코드 생성', data.code_group, `생성: ${data.code_group_name} - ${data.code_group_description || '설명 없음'}`);
      }
      setMasterCodeDialog({ open: false, mode: 'create', data: null });
    } catch (error) {
      console.error('❌ handleSaveMasterCode 오류:', error);
      setSnackbar({
        open: true,
        message: data.id
          ? `마스터코드 수정 중 오류가 발생했습니다: ${error.message || error}`
          : `마스터코드 생성 중 오류가 발생했습니다: ${error.message || error}`,
        severity: 'error'
      });
    }
  };

  // 서브코드 관리
  const handleCreateSubCode = () => {
    if (!selectedMasterCode) {
      setSnackbar({
        open: true,
        message: '마스터코드를 먼저 선택해주세요.',
        severity: 'warning'
      });
      return;
    }

    // 새로운 빈 행을 테이블에 추가
    const newRow = {
      id: Date.now(), // 임시 ID
      sub_code: '',
      sub_code_name: '',
      sub_code_description: '',
      display_order: filteredSubCodes.length + 1,
      is_active: true,
      mastercode_id: selectedMasterCode,
      isNew: true
    };

    setNewRowData(newRow);
    setEditingCell({ id: newRow.id, field: 'sub_code_name' });
  };

  const handleEditSubCode = (data: SubCodeData2) => {
    setSubCodeDialog({
      open: true,
      mode: 'edit',
      mastercode_id: data.mastercode_id,
      data
    });
  };

  const handleDeleteSubCode = async (id: number) => {
    try {
      const subCodeToDelete = filteredSubCodes.find((sc) => sc.id === id);
      await deleteSubCode(id);

      setSnackbar({
        open: true,
        message: '서브코드가 삭제되었습니다.',
        severity: 'success'
      });

      // 변경로그 추가
      if (subCodeToDelete) {
        addChangeLog('서브코드 삭제', subCodeToDelete.group_code, `삭제: ${subCodeToDelete.subcode} (${subCodeToDelete.subcode_name})`);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '서브코드 삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleSaveSubCode = async (data: any) => {
    try {
      if (data.id) {
        // 수정
        await updateSubCode(data.id, {
          subcode: data.sub_code,
          subcode_name: data.sub_code_name,
          subcode_description: data.sub_code_description,
          subcode_status: data.is_active ? 'active' : 'inactive',
          subcode_order: data.display_order,
          is_active: data.is_active
        });

        setSnackbar({
          open: true,
          message: '서브코드가 수정되었습니다.',
          severity: 'success'
        });
      } else {
        // 생성
        const selectedGroup = groups.find((g) => g.group_code === masterCodes.find((mc) => mc.id === data.mastercode_id)?.code_group);
        if (selectedGroup) {
          await createSubCode({
            group_code: selectedGroup.group_code,
            subcode: data.sub_code,
            subcode_name: data.sub_code_name,
            subcode_description: data.sub_code_description || '',
            subcode_status: data.is_active ? 'active' : 'inactive',
            subcode_order: data.display_order
          });

          setSnackbar({
            open: true,
            message: '서브코드가 생성되었습니다.',
            severity: 'success'
          });
        }
      }

      // 변경로그 추가
      const masterCode = masterCodes.find((mc) => mc.id === data.mastercode_id);
      addChangeLog(
        data.id ? '서브코드 수정' : '서브코드 생성',
        masterCode?.code_group || 'UNKNOWN',
        `${data.id ? '수정' : '생성'}: ${data.sub_code} (${data.sub_code_name}) - ${data.sub_code_description || '설명 없음'}`
      );

      setSubCodeDialog({ open: false, mode: 'create', mastercode_id: null, data: null });
    } catch (error) {
      setSnackbar({
        open: true,
        message: data.id ? '서브코드 수정 중 오류가 발생했습니다.' : '서브코드 생성 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  // 새 행 저장 함수 - 개선된 버전
  const saveNewRow = async () => {
    if (!newRowData || !selectedMasterCode) {
      return;
    }

    const subCodeNameValue = editValues[`${newRowData.id}_sub_code_name`];

    if (!subCodeNameValue?.trim()) {
      setSnackbar({
        open: true,
        message: '서브코드명을 입력해주세요.',
        severity: 'warning'
      });
      return;
    }

    // 선택된 마스터코드의 그룹 정보 찾기
    const selectedMasterCodeInfo = masterCodes.find((mc) => mc.id === selectedMasterCode);
    const selectedGroup = groups.find((g) => g.group_code === selectedMasterCodeInfo?.code_group);

    if (!selectedGroup) {
      setSnackbar({
        open: true,
        message: '선택된 그룹 정보를 찾을 수 없습니다.',
        severity: 'error'
      });
      return;
    }

    // 서브코드 데이터 생성 (subcode 필드 제거하여 자동 생성되도록 함)
    const newSubCodeData = {
      group_code: selectedGroup.group_code,
      subcode_name: subCodeNameValue,
      subcode_description: editValues[`${newRowData.id}_sub_code_description`] || '',
      subcode_status: 'active' as const,
      subcode_remark: '',
      subcode_order: 0 // createSubCode에서 자동으로 계산됨
    };

    try {
      await createSubCode(newSubCodeData);

      setSnackbar({
        open: true,
        message: '서브코드가 생성되었습니다.',
        severity: 'success'
      });

      // 변경로그 추가
      addChangeLog(
        '서브코드 생성',
        selectedGroup.group_code,
        `생성: 자동생성 (${subCodeNameValue}) - ${editValues[`${newRowData.id}_sub_code_description`] || '설명 없음'}`
      );

      // 상태 초기화
      setNewRowData(null);
      setEditingCell(null);
      setEditValues({});
    } catch (error) {
      setSnackbar({
        open: true,
        message: `서브코드 생성 중 오류가 발생했습니다: ${error.message || error}`,
        severity: 'error'
      });
    }
  };

  // 서브코드 업데이트 함수 (인라인 편집용)
  const handleUpdateSubCode = async (updateData: any) => {
    try {
      await updateSubCode(updateData.id, {
        subcode_order: updateData.display_order
      });

      setSnackbar({
        open: true,
        message: '서브코드가 수정되었습니다.',
        severity: 'success'
      });

      // 변경로그 추가
      const subCode = filteredSubCodes.find((sc) => sc.id === updateData.id);
      addChangeLog('서브코드 수정', subCode?.group_code || 'UNKNOWN', `수정: ${subCode?.subcode} (${subCode?.subcode_name})`);
    } catch (error) {
      setSnackbar({
        open: true,
        message: '서브코드 수정 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getAllMasterCodes();
        processAllData(data);
      } catch (err) {
        console.error('마스터코드 데이터 로드 실패:', err);
      }
    };

    loadInitialData();
  }, [getAllMasterCodes, processAllData]);

  // ========================================
  // 렌더링
  // ========================================

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 로딩 백드롭 */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* 메인 카드 */}
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
            overflow: 'hidden'
          }}
        >
          {/* 페이지 타이틀 및 브레드크럼 */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                마스터코드관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                관리자메뉴 &gt; 마스터코드관리
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
              value={mainTabValue}
              onChange={handleMainTabChange}
              aria-label="마스터코드관리3 탭"
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
                icon={<DocumentText size={19} />}
                iconPosition="start"
                label="변경로그"
                {...a11yProps(1)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            <TabPanel value={mainTabValue} index={0}>
              {/* 데이터 탭 - 테이블 */}
              <Box
                sx={{
                  p: 0.5,
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, height: '100%', flexGrow: 1 }}>
                  {/* 왼쪽 마스터코드 목록 */}
                  <Paper
                    variant="outlined"
                    sx={{
                      width: '40%',
                      p: 2,
                      overflow: 'auto',
                      bgcolor: 'background.default',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* 마스터코드 그룹 헤더와 버튼 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        마스터코드 그룹
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Add size={16} />}
                          onClick={handleCreateMasterCode}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
                        >
                          그룹 추가
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={selectedItems.size === 0}
                          color={selectedItems.size > 0 ? 'error' : 'inherit'}
                          startIcon={<Trash size={16} />}
                          onClick={() => {
                            selectedItems.forEach((id) => handleDeleteMasterCode(id));
                            setSelectedItems(new Set());
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
                        >
                          삭제 {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
                        </Button>
                      </Box>
                    </Box>
                    <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                            <TableCell padding="checkbox" sx={{ width: 50, backgroundColor: theme.palette.grey[50] }}>
                              <Checkbox
                                indeterminate={selectedItems.size > 0 && selectedItems.size < masterCodes.length}
                                checked={selectedItems.size === masterCodes.length && masterCodes.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(new Set(masterCodes.map((mc) => mc.id)));
                                  } else {
                                    setSelectedItems(new Set());
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ width: 50, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>NO</TableCell>
                            <TableCell sx={{ width: 120, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>코드그룹</TableCell>
                            <TableCell sx={{ width: 120, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>코드그룹명</TableCell>
                            <TableCell align="center" sx={{ width: 80, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
                              상태
                            </TableCell>
                            <TableCell align="center" sx={{ width: 90, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
                              서브코드수
                            </TableCell>
                            <TableCell align="center" sx={{ width: 80, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {masterCodes.map((masterCode, index) => (
                            <TableRow
                              key={masterCode.id}
                              hover
                              selected={selectedMasterCode === masterCode.id}
                              onClick={() => handleMasterCodeSelect(masterCode.id)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedItems.has(masterCode.id)}
                                  onChange={(e) => {
                                    const newSelectedItems = new Set(selectedItems);
                                    if (e.target.checked) {
                                      newSelectedItems.add(masterCode.id);
                                    } else {
                                      newSelectedItems.delete(masterCode.id);
                                    }
                                    setSelectedItems(newSelectedItems);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{masterCodes.length - index}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{masterCode.code_group}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{masterCode.code_group_name}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={masterCode.is_active ? '활성' : '비활성'}
                                  sx={{
                                    backgroundColor: masterCode.is_active ? '#e8f5e9' : '#f5f5f5',
                                    color: masterCode.is_active ? '#2e7d32' : '#757575',
                                    fontWeight: 500
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">{getSubCodesByGroup(masterCode.code_group).length}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="편집">
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditMasterCode(masterCode);
                                    }}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <Edit size={16} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* 오른쪽 서브코드 목록 */}
                  <Box sx={{ width: '60%' }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        height: '100%',
                        p: 2,
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* 서브코드 목록 헤더와 버튼 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            서브코드 목록
                          </Typography>
                          {selectedMasterCode && (
                            <Chip label={masterCodes.find((mc) => mc.id === selectedMasterCode)?.code_group_name || ''} color="primary" />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant={newRowData ? 'outlined' : 'contained'}
                            color={newRowData ? 'inherit' : 'primary'}
                            startIcon={<Add size={16} />}
                            onClick={handleCreateSubCode}
                            disabled={!selectedMasterCode || newRowData}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              px: 2,
                              fontWeight: newRowData ? 400 : 600,
                              boxShadow: newRowData ? 'none' : undefined
                            }}
                          >
                            {newRowData ? '입력 중...' : '서브코드 추가'}
                          </Button>
                          <Button
                            variant="outlined"
                            disabled={selectedSubItems.size === 0}
                            color={selectedSubItems.size > 0 ? 'error' : 'inherit'}
                            startIcon={<Trash size={16} />}
                            onClick={() => {
                              selectedSubItems.forEach((id) => handleDeleteSubCode(id));
                              setSelectedSubItems(new Set());
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
                          >
                            삭제 {selectedSubItems.size > 0 ? `(${selectedSubItems.size})` : ''}
                          </Button>
                        </Box>
                      </Box>
                      {!selectedMasterCode ? (
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.secondary'
                          }}
                        >
                          <Typography>마스터코드를 선택해주세요</Typography>
                        </Box>
                      ) : (
                        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                          <Table
                            stickyHeader
                            size="small"
                            sx={{
                              tableLayout: 'fixed',
                              width: '100%',
                              '& .MuiTableCell-root': {
                                paddingTop: '12px',
                                paddingBottom: '12px'
                              }
                            }}
                          >
                            <TableHead>
                              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                                <TableCell padding="checkbox" sx={{ width: 40, backgroundColor: theme.palette.grey[50] }}>
                                  <Checkbox
                                    indeterminate={selectedSubItems.size > 0 && selectedSubItems.size < filteredSubCodes.length}
                                    checked={selectedSubItems.size === filteredSubCodes.length && filteredSubCodes.length > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSubItems(new Set(filteredSubCodes.map((sc) => sc.id)));
                                      } else {
                                        setSelectedSubItems(new Set());
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ width: 50, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>NO</TableCell>
                                <TableCell sx={{ width: 130, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
                                  서브코드
                                </TableCell>
                                <TableCell sx={{ width: 150, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
                                  서브코드명
                                </TableCell>
                                <TableCell align="center" sx={{ width: 90, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
                                  정렬순서
                                </TableCell>
                                <TableCell sx={{ width: 160, fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>비고</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {[
                                // 새 행이 있으면 먼저 표시
                                ...(newRowData
                                  ? [
                                      <TableRow
                                        key={`new-${newRowData.id}`}
                                        hover
                                        sx={{
                                          backgroundColor: '#e3f2fd',
                                          border: '2px solid #1976d2',
                                          '& .MuiTableCell-root': {
                                            borderBottom: '2px solid #1976d2'
                                          }
                                        }}
                                      >
                                        <TableCell padding="checkbox">
                                          <Checkbox size="small" disabled />
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" color="text.secondary">
                                            -
                                          </Typography>
                                        </TableCell>
                                        {/* 서브코드 자동 생성 표시 */}
                                        <TableCell>
                                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            자동 생성됩니다
                                          </Typography>
                                        </TableCell>
                                        {/* 서브코드명 입력 */}
                                        <TableCell>
                                          {editingCell?.id === newRowData.id && editingCell?.field === 'sub_code_name' ? (
                                            <TextField
                                              value={editValues[`${newRowData.id}_sub_code_name`] || ''}
                                              onChange={(e) =>
                                                setEditValues({ ...editValues, [`${newRowData.id}_sub_code_name`]: e.target.value })
                                              }
                                              placeholder="서브코드명 입력 (예: 사원, 높음)"
                                              autoFocus
                                              variant="standard"
                                              sx={{
                                                '& .MuiInput-underline:before': {
                                                  borderBottomColor: '#1976d2'
                                                },
                                                '& .MuiInput-underline:after': {
                                                  borderBottomColor: '#1976d2'
                                                }
                                              }}
                                              onBlur={() => {
                                                const subCodeNameValue = editValues[`${newRowData.id}_sub_code_name`];
                                                if (subCodeNameValue?.trim()) {
                                                  // 데이터 저장
                                                  saveNewRow();
                                                }
                                                setEditingCell(null);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const subCodeNameValue = editValues[`${newRowData.id}_sub_code_name`];
                                                  if (subCodeNameValue?.trim()) {
                                                    saveNewRow();
                                                  }
                                                  setEditingCell(null);
                                                } else if (e.key === 'Escape') {
                                                  setEditingCell({ id: newRowData.id, field: 'sub_code' });
                                                }
                                              }}
                                              autoFocus
                                              fullWidth
                                              placeholder="서브코드명 입력"
                                              size="small"
                                            />
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">
                                              {editValues[`${newRowData.id}_sub_code_name`] || '서브코드명 입력'}
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell align="center">
                                          <Typography variant="body2" color="text.secondary">
                                            {newRowData.display_order}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" color="text.secondary">
                                            -
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ]
                                  : []),
                                // 기존 서브코드들
                                ...filteredSubCodes.map((subCode, index) => (
                                  <TableRow key={subCode.id} hover>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedSubItems.has(subCode.id)}
                                        onChange={(e) => {
                                          const newSelectedSubItems = new Set(selectedSubItems);
                                          if (e.target.checked) {
                                            newSelectedSubItems.add(subCode.id);
                                          } else {
                                            newSelectedSubItems.delete(subCode.id);
                                          }
                                          setSelectedSubItems(newSelectedSubItems);
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">{filteredSubCodes.length - index}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {subCode.sub_code}
                                      </Typography>
                                    </TableCell>
                                    <TableCell
                                      onClick={() => setEditingCell({ id: subCode.id, field: 'sub_code_name' })}
                                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                                    >
                                      {editingCell?.id === subCode.id && editingCell?.field === 'sub_code_name' ? (
                                        <TextField
                                          value={editValues[`${subCode.id}_sub_code_name`] ?? subCode.sub_code_name}
                                          onChange={(e) =>
                                            setEditValues({ ...editValues, [`${subCode.id}_sub_code_name`]: e.target.value })
                                          }
                                          onBlur={async () => {
                                            const newValue = editValues[`${subCode.id}_sub_code_name`];
                                            if (newValue && newValue !== subCode.sub_code_name) {
                                              try {
                                                await updateSubCode(subCode.id, { subcode_name: newValue });
                                                setSnackbar({
                                                  open: true,
                                                  message: '서브코드명이 수정되었습니다.',
                                                  severity: 'success'
                                                });
                                              } catch (error) {
                                                setSnackbar({
                                                  open: true,
                                                  message: '서브코드명 수정 중 오류가 발생했습니다.',
                                                  severity: 'error'
                                                });
                                              }
                                            }
                                            setEditingCell(null);
                                          }}
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                              const newValue = editValues[`${subCode.id}_sub_code_name`];
                                              if (newValue && newValue !== subCode.sub_code_name) {
                                                try {
                                                  await updateSubCode(subCode.id, { subcode_name: newValue });
                                                  setSnackbar({
                                                    open: true,
                                                    message: '서브코드명이 수정되었습니다.',
                                                    severity: 'success'
                                                  });
                                                } catch (error) {
                                                  setSnackbar({
                                                    open: true,
                                                    message: '서브코드명 수정 중 오류가 발생했습니다.',
                                                    severity: 'error'
                                                  });
                                                }
                                              }
                                              setEditingCell(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingCell(null);
                                              setEditValues({ ...editValues, [`${subCode.id}_sub_code_name`]: subCode.sub_code_name });
                                            }
                                          }}
                                          autoFocus
                                          fullWidth
                                          size="small"
                                        />
                                      ) : (
                                        <Typography variant="body2">{subCode.sub_code_name}</Typography>
                                      )}
                                    </TableCell>
                                    <TableCell
                                      align="center"
                                      onClick={() => setEditingCell({ id: subCode.id, field: 'display_order' })}
                                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                                    >
                                      {editingCell?.id === subCode.id && editingCell?.field === 'display_order' ? (
                                        <TextField
                                          type="number"
                                          value={editValues[`${subCode.id}_display_order`] ?? subCode.display_order}
                                          onChange={(e) =>
                                            setEditValues({ ...editValues, [`${subCode.id}_display_order`]: e.target.value })
                                          }
                                          onBlur={async () => {
                                            const newValue = parseInt(editValues[`${subCode.id}_display_order`]);
                                            if (!isNaN(newValue) && newValue !== subCode.display_order) {
                                              try {
                                                await updateSubCode(subCode.id, { subcode_order: newValue });
                                                setSnackbar({
                                                  open: true,
                                                  message: '정렬순서가 수정되었습니다.',
                                                  severity: 'success'
                                                });
                                              } catch (error) {
                                                setSnackbar({
                                                  open: true,
                                                  message: '정렬순서 수정 중 오류가 발생했습니다.',
                                                  severity: 'error'
                                                });
                                              }
                                            }
                                            setEditingCell(null);
                                          }}
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                              const newValue = parseInt(editValues[`${subCode.id}_display_order`]);
                                              if (!isNaN(newValue) && newValue !== subCode.display_order) {
                                                try {
                                                  await updateSubCode(subCode.id, { subcode_order: newValue });
                                                  setSnackbar({
                                                    open: true,
                                                    message: '정렬순서가 수정되었습니다.',
                                                    severity: 'success'
                                                  });
                                                } catch (error) {
                                                  setSnackbar({
                                                    open: true,
                                                    message: '정렬순서 수정 중 오류가 발생했습니다.',
                                                    severity: 'error'
                                                  });
                                                }
                                              }
                                              setEditingCell(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingCell(null);
                                              setEditValues({ ...editValues, [`${subCode.id}_display_order`]: subCode.display_order });
                                            }
                                          }}
                                          autoFocus
                                          fullWidth
                                          size="small"
                                          sx={{ '& input': { textAlign: 'center' } }}
                                        />
                                      ) : (
                                        <Typography variant="body2">{subCode.display_order}</Typography>
                                      )}
                                    </TableCell>
                                    <TableCell
                                      onClick={() => setEditingCell({ id: subCode.id, field: 'sub_code_description' })}
                                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                                    >
                                      {editingCell?.id === subCode.id && editingCell?.field === 'sub_code_description' ? (
                                        <TextField
                                          value={editValues[`${subCode.id}_sub_code_description`] ?? (subCode.sub_code_description || '')}
                                          onChange={(e) =>
                                            setEditValues({ ...editValues, [`${subCode.id}_sub_code_description`]: e.target.value })
                                          }
                                          onBlur={async () => {
                                            const newValue = editValues[`${subCode.id}_sub_code_description`];
                                            if (newValue !== subCode.sub_code_description) {
                                              try {
                                                await updateSubCode(subCode.id, { subcode_description: newValue || '' });
                                                setSnackbar({
                                                  open: true,
                                                  message: '비고가 수정되었습니다.',
                                                  severity: 'success'
                                                });
                                              } catch (error) {
                                                setSnackbar({
                                                  open: true,
                                                  message: '비고 수정 중 오류가 발생했습니다.',
                                                  severity: 'error'
                                                });
                                              }
                                            }
                                            setEditingCell(null);
                                          }}
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                              const newValue = editValues[`${subCode.id}_sub_code_description`];
                                              if (newValue !== subCode.sub_code_description) {
                                                try {
                                                  await updateSubCode(subCode.id, { subcode_description: newValue || '' });
                                                  setSnackbar({
                                                    open: true,
                                                    message: '비고가 수정되었습니다.',
                                                    severity: 'success'
                                                  });
                                                } catch (error) {
                                                  setSnackbar({
                                                    open: true,
                                                    message: '비고 수정 중 오류가 발생했습니다.',
                                                    severity: 'error'
                                                  });
                                                }
                                              }
                                              setEditingCell(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingCell(null);
                                              setEditValues({
                                                ...editValues,
                                                [`${subCode.id}_sub_code_description`]: subCode.sub_code_description || ''
                                              });
                                            }
                                          }}
                                          autoFocus
                                          fullWidth
                                          size="small"
                                          placeholder="비고를 입력하세요"
                                        />
                                      ) : (
                                        <Typography variant="body2">{subCode.sub_code_description || '-'}</Typography>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ]}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={mainTabValue} index={1}>
              {/* 변경로그 탭 */}
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 0.5
                }}
              >
                <ChangeLogView
                  changeLogs={changeLogs}
                  masterCodes={masterCodes}
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
        </CardContent>
      </Card>

      {/* 다이얼로그들 */}
      <MasterCodeDialog
        dialogState={masterCodeDialog}
        onClose={() => setMasterCodeDialog({ open: false, mode: 'create', data: null })}
        onSave={handleSaveMasterCode}
      />

      <SubCodeDialog
        dialogState={subCodeDialog}
        onClose={() => setSubCodeDialog({ open: false, mode: 'create', mastercode_id: null, data: null })}
        onSave={handleSaveSubCode}
      />

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
