'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';

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
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Avatar,
  ListItemAvatar,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Grid,
  Stack,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Minus, AttachSquare, DocumentUpload, DocumentDownload, Trash, Eye, CloseCircle, Edit } from '@wandersonalwes/iconsax-react';

// Project imports
import { CostRecord, AttachmentFile, costTypeOptions, statusOptions, teamOptions } from 'types/cost';
import { costData } from 'data/cost';
import { useSupabaseCostFinance } from '../../hooks/useSupabaseCostFinance';
import { useSupabaseMasterCode3 } from '../../hooks/useSupabaseMasterCode3';
import { useSupabaseDepartments } from '../../hooks/useSupabaseDepartments';
import { useSupabaseUserManagement } from '../../hooks/useSupabaseUserManagement';
import { useSupabaseFeedback } from '../../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS } from '../../types/feedback';
import useUser from '../../hooks/useUser';
import { useSupabaseFiles } from '../../hooks/useSupabaseFiles';
import { FileData } from '../../types/files';

// ==============================|| 비용관리 데이터 테이블 ||============================== //

// 기록 탭 컴포넌트
const RecordTab = memo(
  ({
    comments,
    newComment,
    onNewCommentChange,
    onAddComment,
    editingCommentId,
    editingCommentText,
    onEditComment,
    onSaveEditComment,
    onCancelEditComment,
    onDeleteComment,
    onEditCommentTextChange,
    currentUserName,
    currentUserAvatar,
    currentUserRole,
    currentUserDepartment
  }: {
    comments: Array<{
      id: string;
      author: string;
      content: string;
      timestamp: string;
      avatar?: string;
      department?: string;
      position?: string;
      role?: string;
    }>;
    newComment: string;
    onNewCommentChange: (value: string) => void;
    onAddComment: () => void;
    editingCommentId: string | null;
    editingCommentText: string;
    onEditComment: (id: string, content: string) => void;
    onSaveEditComment: () => void;
    onCancelEditComment: () => void;
    onDeleteComment: (id: string) => void;
    onEditCommentTextChange: (value: string) => void;
    currentUserName?: string;
    currentUserAvatar?: string;
    currentUserRole?: string;
    currentUserDepartment?: string;
  }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    const handleCommentKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onAddComment();
        }
      },
      [onAddComment]
    );

    const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
      setPage(value);
    }, []);

    // 페이지네이션 계산
    const totalPages = Math.ceil(comments.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedComments = comments.slice(startIndex, endIndex);

    return (
      <Box sx={{ height: '720px', display: 'flex', flexDirection: 'column', px: 5, pt: 3, position: 'relative', overflow: 'hidden' }}>
        {/* 새 기록 등록 - 좌우 배치 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Avatar src={currentUserAvatar} sx={{ width: 35, height: 35 }}>
              {currentUserName?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '11px' }}>
                {currentUserName || '사용자'}
              </Typography>
              {currentUserRole && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px' }}>
                  {currentUserRole}
                </Typography>
              )}
            </Box>
            {currentUserDepartment && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px' }}>
                {currentUserDepartment}
              </Typography>
            )}
          </Box>
          <TextField
            multiline
            rows={3}
            placeholder="새 기록을 입력하세요..."
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            onKeyPress={handleCommentKeyPress}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, maxWidth: '95%' }}
          />
          <Button
            variant="contained"
            onClick={onAddComment}
            disabled={!newComment.trim()}
            sx={{ minWidth: '80px', height: '40px', mt: 0.5 }}
          >
            등록
          </Button>
        </Box>

        {/* 기록 항목들 */}
        <Box
          sx={{
            flex: 1,
            maxHeight: '500px',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            pb: 0,
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                background: '#a8a8a8'
              }
            }
          }}
        >
          <Stack spacing={2} sx={{ px: 3 }}>
            {paginatedComments.map((comment) => (
              <Paper
                key={`comment-${comment.id}`}
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
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* 사용자 아바타 */}
                  <Avatar src={comment.avatar} sx={{ width: 30, height: 30 }}>
                    {comment.author.charAt(0)}
                  </Avatar>

                  {/* 기록 내용 영역 */}
                  <Box sx={{ flexGrow: 1 }}>
                    {/* 사용자 정보 및 시간 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                        {comment.author}
                      </Typography>
                      {comment.role && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          {comment.role}
                        </Typography>
                      )}
                      {comment.department && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          • {comment.department}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', ml: 'auto' }}>
                        {comment.timestamp}
                      </Typography>
                    </Box>

                    {/* 기록 내용 */}
                    {editingCommentId === comment.id ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={editingCommentText}
                        onChange={(e) => onEditCommentTextChange(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) onSaveEditComment();
                          if (e.key === 'Escape') onCancelEditComment();
                        }}
                        variant="outlined"
                        size="small"
                        autoFocus
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            borderRadius: 1,
                            px: 1
                          }
                        }}
                        onClick={() => onEditComment(comment.id, comment.content)}
                      >
                        {comment.content}
                      </Typography>
                    )}
                  </Box>

                  {/* 액션 버튼들 */}
                  <Stack direction="row" spacing={1}>
                    {editingCommentId === comment.id ? (
                      <>
                        <IconButton size="small" onClick={onSaveEditComment} color="success" sx={{ p: 0.5 }} title="저장 (Ctrl+Enter)">
                          <Typography fontSize="14px">✓</Typography>
                        </IconButton>
                        <IconButton size="small" onClick={onCancelEditComment} color="error" sx={{ p: 0.5 }} title="취소 (Escape)">
                          <Typography fontSize="14px">✕</Typography>
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => onEditComment(comment.id, comment.content)}
                          color="primary"
                          sx={{ p: 0.5 }}
                          title="수정"
                        >
                          <Typography fontSize="14px">✏️</Typography>
                        </IconButton>
                        <IconButton size="small" onClick={() => onDeleteComment(comment.id)} color="error" sx={{ p: 0.5 }} title="삭제">
                          <Typography fontSize="14px">🗑️</Typography>
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>

          {/* 빈 상태 메시지 */}
          {comments.length === 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderColor: 'grey.300',
                backgroundColor: 'grey.50',
                mt: 2
              }}
            >
              <Typography variant="body2" color="text.secondary">
                📝 아직 기록이 없습니다.
                <br />
                위의 입력 필드에서 새 기록을 등록해보세요.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* 페이지네이션 - 하단 고정 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
            pt: 3,
            pb: 4,
            px: 4,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'absolute',
            bottom: '0px',
            left: '40px',
            right: '40px'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {comments.length > 0
              ? `${startIndex + 1}-${Math.min(endIndex, comments.length)} of ${comments.length}`
              : '0-0 of 0'}
          </Typography>
          {comments.length > 0 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
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
    );
  }
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // 기록탭(index 2)은 padding 없음
  const padding = index === 2 ? { p: 0 } : { p: 2, px: 1.5 };

  return (
    <div role="tabpanel" hidden={value !== index} id={`cost-tabpanel-${index}`} aria-labelledby={`cost-tab-${index}`} {...other}>
      {value === index && <Box sx={padding}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cost-tab-${index}`,
    'aria-controls': `cost-tabpanel-${index}`
  };
}

// 담당자 목록 (실제로는 API에서 가져올 데이터)
const assigneeList = [
  { id: 1, name: '김철수', team: 'IT팀', avatarUrl: '/assets/images/users/avatar-1.png' },
  { id: 2, name: '박영희', team: '마케팅팀', avatarUrl: '/assets/images/users/avatar-2.png' },
  { id: 3, name: '이민수', team: 'IT팀', avatarUrl: '/assets/images/users/avatar-3.png' },
  { id: 4, name: '최윤정', team: '영업팀', avatarUrl: '/assets/images/users/avatar-4.png' },
  { id: 5, name: '정상현', team: '기획팀', avatarUrl: '/assets/images/users/avatar-5.png' },
  { id: 6, name: '김혜진', team: '마케팅팀', avatarUrl: '/assets/images/users/avatar-6.png' },
  { id: 7, name: '송민호', team: 'IT팀', avatarUrl: '/assets/images/users/avatar-7.png' },
  { id: 8, name: '노수진', team: '인사팀', avatarUrl: '/assets/images/users/avatar-8.png' }
];

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  costType: 100,
  title: 200,
  amount: 120,
  team: 80,
  assignee: 120,
  status: 90,
  startDate: 100,
  completionDate: 100,
  action: 60
};

interface CostDataTableProps {
  selectedTeam: string;
  selectedStatus: string;
  selectedYear: string;
  selectedAssignee: string;
  costs: CostRecord[];
  setCosts: React.Dispatch<React.SetStateAction<CostRecord[]>>;
  createCostRecord?: (record: Omit<CostRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<CostRecord>;
  updateCostRecord?: (id: string, updates: Partial<CostRecord>) => Promise<CostRecord>;
  deleteCostRecord?: (id: string) => Promise<void>;
  checkCodeExists?: (code: string) => Promise<boolean>;
  editRequest?: {
    recordId?: number;
    shouldEdit: boolean;
  };
  onEditComplete?: () => void;
  externalDialogControl?: {
    open: boolean;
    recordId?: number;
    onClose: () => void;
  };
}

export default function CostDataTable({
  selectedTeam,
  selectedStatus,
  selectedYear,
  selectedAssignee,
  costs,
  setCosts,
  createCostRecord,
  updateCostRecord,
  deleteCostRecord,
  checkCodeExists,
  editRequest,
  onEditComplete,
  externalDialogControl
}: CostDataTableProps) {
  const theme = useTheme();

  // Supabase 금액 데이터 연동
  const { getFinanceItems, saveFinanceItems, deleteFinanceItem } = useSupabaseCostFinance();

  // 마스터코드 연동 (GROUP027 비용유형)
  const { subCodes } = useSupabaseMasterCode3();

  // 부서 데이터 연동
  const { departments } = useSupabaseDepartments();

  // 사용자 데이터 연동
  const { users } = useSupabaseUserManagement();

  // 로그인된 사용자 정보
  const user = useUser();
  const currentUser = {
    name: user ? user.name : '사용자',
    department: user ? user.department || '부서' : '부서',
    profileImage: user ? user.avatar : '/assets/images/users/avatar-1.png',
    role: user ? user.role : ''
  };

  // 팝업창 상태 (useSupabaseFeedback 훅보다 먼저 선언)
  const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit' | 'view'; recordId?: number }>({
    open: false,
    mode: 'add'
  });

  // 피드백/기록 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.COST, dialog.recordId);

  // GROUP027 비용유형 목록
  const costTypes = useMemo(() => {
    const group027Codes = subCodes.filter(code => code.group_code === 'GROUP027');
    return group027Codes.map(code => code.subcode_name);
  }, [subCodes]);

  // GROUP028 비용세부유형 목록 (금액탭용)
  const costDetailTypes = useMemo(() => {
    const group028Codes = subCodes.filter(code => code.group_code === 'GROUP028');
    return group028Codes.map(code => code.subcode_name);
  }, [subCodes]);

  // GROUP002 상태 목록
  const statusList = useMemo(() => {
    const group002Codes = subCodes.filter(code => code.group_code === 'GROUP002');
    return group002Codes.map(code => code.subcode_name);
  }, [subCodes]);

  // 부서명 목록
  const teamList = useMemo(() => {
    return departments
      .filter(dept => dept.is_active)
      .map(dept => dept.department_name);
  }, [departments]);

  // 사용자 목록 (프로필 사진 포함)
  const assigneeList = useMemo(() => {
    return users
      .filter(user => user.is_active && user.status === 'active')
      .map(user => ({
        id: user.id,
        name: user.user_name,
        avatar: user.profile_image_url || user.avatar_url,
        department: user.department
      }));
  }, [users]);

  // 상태 관리
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [validationError, setValidationError] = useState<string>('');

  // 기록 탭을 위한 상태
  const [newComment, setNewComment] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');
  // 임시 저장된 기록들 (저장 버튼 클릭 시 DB에 저장)
  const [pendingComments, setPendingComments] = useState<Array<{
    id: string;
    content: string;
    timestamp: string;
    author: string;
    avatar?: string;
    department?: string;
    position?: string;
    role?: string;
    isNew: boolean;
  }>>([]);
  // 수정된 기록들 추적
  const [modifiedComments, setModifiedComments] = useState<{[key: string]: string}>({});
  // 삭제된 기록 ID들
  const [deletedCommentIds, setDeletedCommentIds] = useState<string[]>([]);

  // 금액 탭을 위한 상태
  const [amountItems, setAmountItems] = useState<
    {
      id: number;
      code: string;
      costType: string;
      content: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[]
  >([]);
  const [selectedAmountItems, setSelectedAmountItems] = useState<number[]>([]);

  // 개요 탭을 위한 상태
  const [overviewData, setOverviewData] = useState({
    code: '',
    title: '',
    content: '',
    costType: '',
    team: '',
    assignee: '',
    status: '대기',
    startDate: new Date().toISOString().split('T')[0], // 시작일 초기값을 오늘 날짜로 설정
    completionDate: '',
    registrationDate: new Date().toISOString().split('T')[0] // 등록일 초기값 설정
  });

  // 총금액 계산 (금액 탭과 연동)
  const totalAmount = useMemo(() => {
    return amountItems.reduce((sum, item) => sum + item.amount, 0);
  }, [amountItems]);

  // Supabase feedbacks를 RecordTab 형식으로 변환하고 pendingComments와 합치기
  const comments = useMemo(() => {
    // 기존 DB의 feedbacks (삭제된 것 제외)
    const existingComments = feedbacks
      .filter(feedback => !deletedCommentIds.includes(String(feedback.id)))
      .map((feedback) => {
        // user_name으로 사용자 찾기
        const feedbackUser = users.find((u) => u.user_name === feedback.user_name);

        // 수정된 내용이 있으면 사용 (feedback.id를 문자열로 변환)
        const feedbackIdStr = String(feedback.id);
        const content = modifiedComments[feedbackIdStr] || feedback.description;

        return {
          id: feedbackIdStr, // 문자열로 변환
          author: feedback.user_name,
          content: content,
          timestamp: new Date(feedback.created_at).toLocaleString('ko-KR'),
          avatar: feedback.user_profile_image || feedbackUser?.profile_image_url || undefined,
          department: feedback.user_department || feedback.team || feedbackUser?.department || '',
          position: feedback.user_position || feedbackUser?.position || '',
          role: feedback.metadata?.role || feedbackUser?.role || '',
          isNew: false
        };
      });

    // 임시 저장된 새 기록들
    const newComments = pendingComments.map(comment => ({
      ...comment,
      isNew: true
    }));

    // 합쳐서 반환 (최신 순으로 정렬 - 새 기록이 위로)
    return [...newComments, ...existingComments];
  }, [feedbacks, users, pendingComments, modifiedComments, deletedCommentIds]);

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // 첨부파일 다이얼로그 상태
  const [attachmentDialog, setAttachmentDialog] = useState<{
    open: boolean;
    recordId: number | null;
  }>({
    open: false,
    recordId: null
  });

  // 필터링된 레코드
  const filteredRecords = useMemo(() => {
    const filtered = costs.filter((record) => {
      if (selectedTeam !== '전체' && record.team !== selectedTeam) return false;
      if (selectedStatus !== '전체' && record.status !== selectedStatus) return false;
      if (selectedAssignee !== '전체' && record.assignee !== selectedAssignee) return false;
      if (selectedYear !== '전체') {
        const recordYear = new Date(record.registrationDate).getFullYear().toString();
        if (recordYear !== selectedYear) return false;
      }
      return true;
    });

    // NO 기준 역순 정렬 (VOC 관리와 동일한 패턴)
    return filtered.sort((a, b) => (b.no || 0) - (a.no || 0));
  }, [costs, selectedTeam, selectedStatus, selectedAssignee, selectedYear]);

  // 페이지네이션된 레코드
  const paginatedRecords = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRecords, page, rowsPerPage]);

  // 총 페이지 수
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  // 편집 요청 처리 (데이터 탭에서만)
  useEffect(() => {
    if (editRequest?.shouldEdit && editRequest.recordId && !externalDialogControl) {
      handleEditRecord(editRequest.recordId);
      if (onEditComplete) {
        onEditComplete();
      }
    }
  }, [editRequest]);

  // 외부 다이얼로그 제어 처리 (칸반에서)
  useEffect(() => {
    if (externalDialogControl?.open && externalDialogControl.recordId) {
      setDialog({ open: true, mode: 'edit', recordId: externalDialogControl.recordId });
      setTabValue(0);
    } else if (externalDialogControl && !externalDialogControl.open) {
      setDialog({ open: false, mode: 'add' });
      setTabValue(0);
    }
  }, [externalDialogControl]);

  // 편집 다이얼로그 열릴 때 기존 데이터 로드
  useEffect(() => {
    if (dialog.open && dialog.mode === 'edit' && dialog.recordId) {
      const existingRecord = costs.find((record) => record.id === dialog.recordId);
      if (existingRecord) {
        setOverviewData({
          code: existingRecord.code || '',
          title: existingRecord.title || '',
          content: existingRecord.content || '',
          costType: existingRecord.costType || '',
          team: existingRecord.team || '',
          assignee: existingRecord.assignee || '',
          status: existingRecord.status || '대기',
          startDate: existingRecord.startDate || '',
          completionDate: existingRecord.completionDate || '',
          registrationDate: existingRecord.registration_date || new Date().toISOString().split('T')[0]
        });

        // Supabase에서 금액 데이터 로드
        const loadFinanceData = async () => {
          console.log('📥 금액 데이터 로드 시작, cost_id:', dialog.recordId);
          const financeItems = await getFinanceItems(Number(dialog.recordId));
          console.log('✅ 금액 데이터 로드 완료:', financeItems.length, '개');

          if (financeItems.length > 0) {
            setAmountItems(financeItems);
          } else {
            // Supabase에 데이터가 없으면 기존 로컬 데이터 사용 (마이그레이션 대비)
            if (existingRecord.amountDetails && existingRecord.amountDetails.length > 0) {
              const safeAmountItems = existingRecord.amountDetails.map((item) => ({
                id: item.id || Date.now(),
                code: item.code || '',
                costType: item.costType || '솔루션',
                content: item.content || '',
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                amount: item.amount || 0
              }));
              setAmountItems(safeAmountItems);
            } else {
              setAmountItems([]);
            }
          }
        };
        loadFinanceData();
        setSelectedAmountItems([]);
      }
    } else if (dialog.open && dialog.mode === 'add') {
      // 추가 모드일 때는 모든 데이터 초기화 및 코드 생성
      const initializeAddMode = async () => {
        const today = new Date().toISOString().split('T')[0];
        const newCode = await generateCode();
        setOverviewData({
          code: newCode,
          title: '',
          content: '',
          costType: '',
          team: currentUser.department,
          assignee: currentUser.name,
          status: '대기',
          startDate: today,
          completionDate: '',
          registrationDate: today // 새 등록일 생성
        });
      };
      initializeAddMode();
      setAmountItems([]);
      setPendingComments([]);
      setModifiedComments({});
      setDeletedCommentIds([]);
      setSelectedAmountItems([]);
    }
  }, [dialog, costs, getFinanceItems]);

  // 상태별 색상 (업무관리 페이지와 동일한 파스텔 톤)
  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      대기: { bgcolor: '#F5F5F5', color: '#757575' },
      진행: { bgcolor: '#E3F2FD', color: '#1976D2' },
      완료: { bgcolor: '#E8F5E9', color: '#388E3C' },
      취소: { bgcolor: '#FFEBEE', color: '#D32F2F' },
      홀딩: { bgcolor: '#FFEBEE', color: '#D32F2F' }
    };
    return colors[status] || { bgcolor: '#F5F5F5', color: '#757575' };
  };

  // 코드 생성 함수
  const generateCode = async () => {
    const year = new Date().getFullYear().toString().slice(-2);

    // 기존 코드에서 같은 연도의 마지막 번호를 찾아서 +1
    const currentYearCodes = costs
      .filter((r) => r.code.startsWith(`MAIN-COST-${year}-`))
      .map((r) => {
        const codeParts = r.code.split('-');
        return parseInt(codeParts[3]) || 0;
      });

    let maxNumber = currentYearCodes.length > 0 ? Math.max(...currentYearCodes) : 0;
    let code = `MAIN-COST-${year}-${(maxNumber + 1).toString().padStart(3, '0')}`;

    // DB에 코드가 이미 존재하는지 확인 (비활성화된 레코드 포함)
    if (checkCodeExists) {
      while (await checkCodeExists(code)) {
        maxNumber++;
        code = `MAIN-COST-${year}-${(maxNumber + 1).toString().padStart(3, '0')}`;
      }
    }

    return code;
  };

  // 금액 상세 코드 생성 함수
  const generateAmountCode = () => {
    // 개요 탭의 코드를 기반으로 금액 상세 코드 생성
    const baseCode = overviewData.code || '';

    // 기존 코드들에서 가장 큰 시퀀스 번호 찾기
    const existingSequences = amountItems.map((item) => {
      const parts = item.code.split('-');
      return parts.length > 4 ? parseInt(parts[4]) || 0 : 0;
    });

    const maxSequence = existingSequences.length > 0 ? Math.max(...existingSequences) : 0;
    const sequenceNumber = (maxSequence + 1).toString().padStart(2, '0');
    return `${baseCode}-${sequenceNumber}`;
  };

  const generateRegistrationDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 필수 필드 검증
  const validateRequiredFields = (record: CostRecord): boolean => {
    return !!(record.assignee && record.content && record.costType && record.quantity && record.unitPrice);
  };

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환
      const excelData = filteredRecords.map((record, index) => ({
        NO: index + 1,
        등록일: record.registrationDate,
        코드: record.code,
        비용유형: record.costType,
        비용내용: record.content,
        수량: record.quantity,
        단가: record.unitPrice.toLocaleString('ko-KR'),
        금액: record.amount.toLocaleString('ko-KR'),
        팀: record.team,
        담당자: record.assignee,
        상태: record.status,
        완료일: record.completionDate || '미정',
        첨부파일: record.attachment ? '있음' : '없음'
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
      link.setAttribute('download', `비용관리_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel 다운로드 중 오류 발생:', error);
      setValidationError('Excel 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 새 행 추가 - 팝업창 열기
  const handleAddRecord = () => {
    setDialog({ open: true, mode: 'add' });
    setTabValue(0);
  };

  // 레코드 편집 - 팝업창 열기
  const handleEditRecord = (recordId: number) => {
    setDialog({ open: true, mode: 'edit', recordId });
    setTabValue(0);
  };

  // 팝업창 닫기
  const handleCloseDialog = () => {
    setDialog({ open: false, mode: 'add' });
    setTabValue(0);
    // 모든 상태 초기화
    setOverviewData({
      code: '',
      title: '',
      content: '',
      costType: '',
      team: '',
      assignee: '',
      status: '대기',
      startDate: new Date().toISOString().split('T')[0], // 시작일을 오늘 날짜로 초기화
      completionDate: '',
      registrationDate: new Date().toISOString().split('T')[0]
    });
    setAmountItems([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setPendingComments([]);
    setModifiedComments({});
    setDeletedCommentIds([]);
    setValidationError('');
    setSelectedAmountItems([]);
    // 외부 다이얼로그 제어인 경우 외부 onClose 호출
    if (externalDialogControl?.onClose) {
      externalDialogControl.onClose();
    }
  };

  // 실제 레코드 추가
  const createNewRecord = (): CostRecord => {
    return {
      id: Date.now(),
      registrationDate: generateRegistrationDate(),
      code: generateCode(),
      team: '',
      assignee: '',
      costType: '솔루션',
      content: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      status: '대기',
      completionDate: '',
      attachment: false,
      attachmentCount: 0,
      attachments: [],
      isNew: true
    };
  };

  // 레코드 저장
  const handleSaveRecord = async () => {
    // 필수값 검증
    if (!overviewData.title?.trim()) {
      setValidationError('제목을 입력해주세요.');
      return;
    }
    if (!overviewData.costType) {
      setValidationError('비용유형을 선택해주세요.');
      return;
    }
    if (!overviewData.startDate) {
      setValidationError('시작일을 선택해주세요.');
      return;
    }
    if (!overviewData.completionDate) {
      setValidationError('완료일을 선택해주세요.');
      return;
    }

    try {
      if (dialog.mode === 'add') {
        // 새 레코드 추가 (이미 생성된 코드 사용)
        const newRecordData = {
          registration_date: overviewData.registrationDate,
          registrationDate: overviewData.registrationDate, // 테이블 표시용 필드
          start_date: overviewData.startDate || overviewData.registrationDate,
          startDate: overviewData.startDate || overviewData.registrationDate, // 월간일정용 필드
          code: overviewData.code,
          title: overviewData.title,
          team: overviewData.team,
          assignee_id: null,
          assignee: overviewData.assignee,
          costType: overviewData.costType || (amountItems.length > 0 ? amountItems[0].costType : '솔루션'),
          content: overviewData.content,
          quantity: amountItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
          unitPrice: amountItems.length > 0 ? amountItems[0].unitPrice : 0,
          amount: totalAmount,
          status: overviewData.status,
          completion_date: overviewData.completionDate || null,
          completionDate: overviewData.completionDate || null, // 테이블 표시용 필드
          attachment: false,
          attachmentCount: 0,
          attachments: [],
          amountDetails: [...amountItems], // 금액 상세 정보 저장
          comments: [...comments], // 기록(코멘트) 정보 저장
          isNew: true // 신규행 표시
        };

        if (createCostRecord) {
          const savedCost = await createCostRecord(newRecordData);
          console.log('새 레코드가 추가되었습니다.');

          // Supabase에 금액 데이터 저장 (data_relation.md 패턴)
          if (savedCost && amountItems.length > 0) {
            console.log('💾 금액 데이터 저장 시작, cost_id:', savedCost.id);
            const success = await saveFinanceItems(Number(savedCost.id), amountItems);
            if (success) {
              console.log('✅ 금액 데이터 저장 완료');
            } else {
              console.error('❌ 금액 데이터 저장 실패');
            }
          }

          // 기록(피드백) 데이터 저장
          if (savedCost && pendingComments.length > 0) {
            console.log('📝 기록 추가 시작:', {
              '기록 개수': pendingComments.length,
              '비용 ID': savedCost.id
            });

            for (const comment of pendingComments) {
              const feedbackInput = {
                page: PAGE_IDENTIFIERS.COST,
                record_id: String(savedCost.id),
                action_type: '기록',
                description: comment.content,
                user_name: comment.author,
                team: comment.department || '',
                user_department: comment.department || '',
                user_position: comment.position || '',
                user_profile_image: comment.avatar || '',
                metadata: { role: comment.role || '' }
              };

              await addFeedback(feedbackInput);
              console.log('✅ 기록 추가 완료:', comment.content.substring(0, 20) + '...');
            }
          }
        } else {
          // Fallback: 직접 상태 업데이트
          const newRecord: CostRecord = {
            ...newRecordData,
            id: Date.now().toString()
          };
          setCosts((prev) => [newRecord, ...prev]);
        }
      } else if (dialog.mode === 'edit' && dialog.recordId) {
        // 기존 레코드 수정
        const updates = {
          title: overviewData.title,
          content: overviewData.content,
          costType: overviewData.costType,
          team: overviewData.team,
          assignee: overviewData.assignee,
          status: overviewData.status,
          start_date: overviewData.startDate || null,
          startDate: overviewData.startDate || null,
          completion_date: overviewData.completionDate || null,
          completionDate: overviewData.completionDate || null,
          amount: totalAmount,
          amountDetails: [...amountItems], // 금액 상세 정보 저장
          comments: [...comments] // 기록(코멘트) 정보 저장
        };

        if (updateCostRecord) {
          await updateCostRecord(dialog.recordId.toString(), updates);
          console.log('레코드가 수정되었습니다.');

          // Supabase에 금액 데이터 저장 (data_relation.md 패턴 - 삭제 후 재저장)
          console.log('💾 금액 데이터 저장 시작, cost_id:', dialog.recordId);
          const success = await saveFinanceItems(Number(dialog.recordId), amountItems);
          if (success) {
            console.log('✅ 금액 데이터 저장 완료');
          } else {
            console.error('❌ 금액 데이터 저장 실패');
          }

          // 기록(피드백) 데이터 저장
          console.log('📝 기록 데이터 저장 시작');
          console.log('📝 삭제할 기록:', deletedCommentIds.length, '개');
          console.log('📝 수정할 기록:', Object.keys(modifiedComments).length, '개');
          console.log('📝 추가할 기록:', pendingComments.length, '개');

          try {
            // 삭제된 기록들 처리
            if (deletedCommentIds.length > 0) {
              for (const commentId of deletedCommentIds) {
                await deleteFeedback(Number(commentId));
                console.log('✅ 기록 삭제 완료:', commentId);
              }
            }

            // 수정된 기록들 처리
            if (Object.keys(modifiedComments).length > 0) {
              for (const [commentId, newContent] of Object.entries(modifiedComments)) {
                await updateFeedback(Number(commentId), { description: newContent });
                console.log('✅ 기록 수정 완료:', commentId);
              }
            }

            // 새로 추가된 기록들 처리
            if (pendingComments.length > 0) {
              for (const comment of pendingComments) {
                const feedbackInput = {
                  page: PAGE_IDENTIFIERS.COST,
                  record_id: String(dialog.recordId),
                  action_type: '기록',
                  description: comment.content,
                  user_name: comment.author,
                  team: comment.department || '',
                  user_department: comment.department || '',
                  user_position: comment.position || '',
                  user_profile_image: comment.avatar || '',
                  metadata: { role: comment.role || '' }
                };

                await addFeedback(feedbackInput);
                console.log('✅ 기록 추가 완료:', comment.content.substring(0, 20) + '...');
              }
            }

            console.log('✅ 기록 데이터 저장 완료');

            // 저장 후 임시 데이터 초기화
            setPendingComments([]);
            setModifiedComments({});
            setDeletedCommentIds([]);
          } catch (error) {
            console.error('❌ 기록 데이터 저장 중 오류:', error);
            console.warn('⚠️ 기록 저장에 실패했지만 비용 데이터는 저장되었습니다.');
          }
        } else {
          // Fallback: 직접 상태 업데이트
          setCosts((prev) =>
            prev.map((cost) => {
              if (cost.id === dialog.recordId?.toString()) {
                return { ...cost, ...updates };
              }
              return cost;
            })
          );
        }
      }

      // 신규 레코드 추가 후 첫 페이지로 이동
      if (dialog.mode === 'add') {
        setPage(0);
      }

      setValidationError('');
      handleCloseDialog();
    } catch (error) {
      console.error('레코드 저장 중 오류 발생:', error);
      setValidationError('레코드 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 선택된 행 삭제
  const handleDeleteRecords = async () => {
    try {
      if (deleteCostRecord) {
        // Supabase API를 통해 삭제
        for (const recordId of selectedRecords) {
          await deleteCostRecord(recordId.toString());
        }
        console.log(`${selectedRecords.length}개 레코드가 삭제되었습니다.`);
      } else {
        // Fallback: 직접 상태 업데이트
        setCosts((prev) => prev.filter((record) => !selectedRecords.includes(Number(record.id))));
      }

      setSelectedRecords([]);
    } catch (error) {
      console.error('레코드 삭제 중 오류 발생:', error);
    }
  };

  // 전체 선택
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRecords(paginatedRecords.map((record) => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // 개별 선택
  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords((prev) => (prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]));
  };

  // 페이지 변경
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // Go to 페이지
  const handleGoToPage = () => {
    const targetPage = parseInt(goToPage) - 1;
    if (targetPage >= 0 && targetPage < totalPages) {
      setPage(targetPage);
    }
    setGoToPage('');
  };

  // 첨부파일 열기
  const handleOpenAttachment = (recordId: number) => {
    setAttachmentDialog({ open: true, recordId });
  };

  // 첨부파일 닫기
  const handleCloseAttachment = () => {
    setAttachmentDialog({ open: false, recordId: null });
  };

  // 파일 업로드 (첨부파일 다이얼로그용)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !attachmentDialog.recordId) return;

    const newAttachments = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: formatFileSize(file.size),
      file: file,
      uploadDate: new Date().toISOString().split('T')[0]
    }));

    setCosts((prev) =>
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
  };

  // 파일 삭제
  const handleDeleteAttachment = (attachmentId: number) => {
    if (!attachmentDialog.recordId) return;

    setCosts((prev) =>
      prev.map((record) => {
        if (record.id === attachmentDialog.recordId) {
          const updatedAttachments = record.attachments.filter((att) => att.id !== attachmentId);
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

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 아이콘
  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  // 기록 탭 핸들러들
  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    // 현재 사용자 정보 가져오기
    const feedbackUser = users.find((u) => u.user_name === user?.name);
    const currentUserName = feedbackUser?.user_name || user?.name || '현재 사용자';
    const currentTeam = feedbackUser?.department || user?.department || '';
    const currentPosition = feedbackUser?.position || '';
    const currentProfileImage = feedbackUser?.profile_image_url || '';
    const currentRole = feedbackUser?.role || '';

    // DB에 바로 저장하지 않고 임시 저장 (저장 버튼 클릭 시 DB 저장)
    const tempComment = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 임시 ID
      content: newComment,
      timestamp: new Date().toLocaleString('ko-KR'),
      author: currentUserName,
      avatar: currentProfileImage || undefined,
      department: currentTeam,
      position: currentPosition,
      role: currentRole,
      isNew: true
    };

    setPendingComments(prev => [tempComment, ...prev]);
    setNewComment('');
  }, [newComment, users, user]);

  const handleEditComment = useCallback((commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  }, []);

  const handleSaveEditComment = useCallback(() => {
    if (!editingCommentText.trim() || !editingCommentId) return;

    // 임시 저장된 기록인지 확인 (ID가 temp_로 시작)
    if (editingCommentId.startsWith('temp_')) {
      // pendingComments에서 직접 수정
      setPendingComments(prev =>
        prev.map(comment =>
          comment.id === editingCommentId
            ? { ...comment, content: editingCommentText }
            : comment
        )
      );
    } else {
      // 기존 DB 데이터는 수정 목록에 추가 (저장 시 DB 업데이트)
      setModifiedComments(prev => ({
        ...prev,
        [editingCommentId]: editingCommentText
      }));
    }

    setEditingCommentId(null);
    setEditingCommentText('');
  }, [editingCommentText, editingCommentId]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    // 임시 저장된 기록인지 확인 (ID가 temp_로 시작)
    if (commentId.startsWith('temp_')) {
      // pendingComments에서 직접 삭제
      setPendingComments(prev => prev.filter(comment => comment.id !== commentId));
    } else {
      // 기존 DB 데이터는 삭제 목록에 추가 (저장 시 DB에서 삭제)
      setDeletedCommentIds(prev => [...prev, commentId]);
    }
  }, []);

  // 자료 탭 컴포넌트 - DB 기반 파일 관리
  const MaterialTab = memo(({ recordId, currentUser }: { recordId?: number | string; currentUser?: any }) => {
    const {
      files,
      loading: filesLoading,
      uploadFile,
      updateFile,
      deleteFile,
      isUploading,
      isDeleting
    } = useSupabaseFiles(PAGE_IDENTIFIERS.COST, recordId);

    const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
    const [editingMaterialText, setEditingMaterialText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!recordId) {
          alert('파일을 업로드하려면 먼저 비용을 저장해주세요.');
          return;
        }

        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;

        const uploadPromises = Array.from(fileList).map(async (file) => {
          const result = await uploadFile(file, {
            page: PAGE_IDENTIFIERS.COST,
            record_id: String(recordId),
            user_id: undefined,
            user_name: currentUser?.name || '알 수 없음',
            team: currentUser?.department
          });

          if (!result.success) {
            alert(`파일 업로드 실패: ${result.error}`);
          }
        });

        await Promise.all(uploadPromises);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      [recordId, uploadFile, currentUser]
    );

    const handleEditMaterial = useCallback((fileId: string, fileName: string) => {
      setEditingMaterialId(fileId);
      setEditingMaterialText(fileName);
    }, []);

    const handleSaveEditMaterial = useCallback(async () => {
      if (!editingMaterialText.trim() || !editingMaterialId) return;

      try {
        await updateFile(editingMaterialId, {
          file_name: editingMaterialText.trim()
        });
        setEditingMaterialId(null);
        setEditingMaterialText('');
      } catch (error) {
        console.error('파일명 수정 실패:', error);
        alert('파일명 수정에 실패했습니다.');
      }
    }, [editingMaterialText, editingMaterialId, updateFile]);

    const handleCancelEditMaterial = useCallback(() => {
      setEditingMaterialId(null);
      setEditingMaterialText('');
    }, []);

    const handleDeleteMaterial = useCallback(
      async (fileId: string) => {
        if (!confirm('파일을 삭제하시겠습니까?')) return;

        try {
          await deleteFile(fileId);
        } catch (error) {
          console.error('파일 삭제 실패:', error);
          alert('파일 삭제에 실패했습니다.');
        }
      },
      [deleteFile]
    );

    const handleDownloadMaterial = useCallback(async (file: FileData) => {
      try {
        const response = await fetch(file.file_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('파일 다운로드 실패:', error);
        alert('파일 다운로드에 실패했습니다.');
      }
    }, []);

    const handleUploadClick = useCallback(() => {
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 비용을 저장해주세요.');
        return;
      }
      fileInputRef.current?.click();
    }, [recordId]);

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string): string => {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return '🖼️';
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) return '🎥';
      if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return '🎵';
      if (ext === 'pdf') return '📄';
      if (['doc', 'docx', 'txt'].includes(ext)) return '📝';
      if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
      if (['ppt', 'pptx'].includes(ext)) return '📋';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦';
      return '📄';
    };

    return (
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
            onClick={handleUploadClick}
          >
            <Stack spacing={2} alignItems="center">
              <Typography fontSize="48px">📁</Typography>
              <Typography variant="h6" color="primary.main">
                {isUploading ? '파일 업로드 중...' : '파일을 업로드하세요'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                클릭하거나 파일을 여기로 드래그하세요
              </Typography>
              <Button variant="contained" size="small" startIcon={<Typography>📤</Typography>} disabled={isUploading || !recordId}>
                파일 선택
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* 자료 항목들 */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {filesLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                파일 목록 로딩 중...
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {files.map((file: FileData) => (
                <Paper
                  key={file.id}
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
                      <Typography fontSize="24px">{getFileIcon(file.file_name)}</Typography>
                    </Box>

                    {/* 파일 정보 영역 */}
                    <Box sx={{ flexGrow: 1 }}>
                      {editingMaterialId === file.id ? (
                        <TextField
                          fullWidth
                          value={editingMaterialText}
                          onChange={(e) => setEditingMaterialText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEditMaterial();
                            if (e.key === 'Escape') handleCancelEditMaterial();
                          }}
                          variant="outlined"
                          size="small"
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                        />
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderRadius: 1,
                              px: 1
                            }
                          }}
                          onClick={() => handleEditMaterial(file.id, file.file_name)}
                        >
                          {file.file_name}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('ko-KR')}
                        {file.uploaded_by && ` • ${file.uploaded_by}`}
                      </Typography>
                    </Box>

                    {/* 액션 버튼들 */}
                    <Stack direction="row" spacing={1}>
                      {editingMaterialId === file.id ? (
                        <>
                          <IconButton size="small" onClick={handleSaveEditMaterial} color="success" sx={{ p: 0.5 }} title="저장">
                            <Typography fontSize="14px">✓</Typography>
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEditMaterial} color="error" sx={{ p: 0.5 }} title="취소">
                            <Typography fontSize="14px">✕</Typography>
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadMaterial(file)}
                            color="primary"
                            sx={{ p: 0.5 }}
                            title="다운로드"
                          >
                            <Typography fontSize="14px">⬇️</Typography>
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditMaterial(file.id, file.file_name)}
                            color="primary"
                            sx={{ p: 0.5 }}
                            title="수정"
                          >
                            <Typography fontSize="14px">✏️</Typography>
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMaterial(file.id)}
                            color="error"
                            sx={{ p: 0.5 }}
                            title="삭제"
                            disabled={isDeleting}
                          >
                            <Typography fontSize="14px">🗑️</Typography>
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {/* 빈 상태 메시지 */}
          {!filesLoading && files.length === 0 && (
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
                📁 아직 업로드된 파일이 없습니다.
                <br />
                위의 업로드 영역을 클릭하여 파일을 업로드해보세요.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  });

  MaterialTab.displayName = 'MaterialTab';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredRecords.length}건
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
                borderColor: '#4CAF50',
                backgroundColor: '#4CAF50',
                color: '#fff'
              }
            }}
          >
            Excel Down
          </Button>
          <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={handleAddRecord} sx={{ px: 2 }}>
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Minus size={16} />}
            size="small"
            color="error"
            disabled={selectedRecords.length === 0}
            onClick={handleDeleteRecords}
            sx={{
              px: 2,
              borderColor: selectedRecords.length > 0 ? 'error.main' : 'grey.300',
              color: selectedRecords.length > 0 ? 'error.main' : 'grey.500'
            }}
          >
            삭제 {selectedRecords.length > 0 && `(${selectedRecords.length})`}
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
                  indeterminate={selectedRecords.length > 0 && selectedRecords.length < paginatedRecords.length}
                  checked={paginatedRecords.length > 0 && selectedRecords.length === paginatedRecords.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.costType, fontWeight: 600 }}>비용유형</TableCell>
              <TableCell sx={{ width: columnWidths.title, fontWeight: 600 }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.amount, fontWeight: 600 }}>합계금액</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completionDate, fontWeight: 600 }}>완료일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRecords.map((record, index) => (
              <TableRow
                key={record.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedRecords.includes(record.id)} onChange={() => handleSelectRecord(record.id)} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {filteredRecords.length - (page * rowsPerPage + index)}
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
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.costType}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.title || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: '#2196F3', fontWeight: 500 }}>
                    {record.amount.toLocaleString()}원
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.team || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {record.assignee ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={assigneeList.find((a) => a.name === record.assignee)?.avatar} sx={{ width: 24, height: 24 }}>
                        {record.assignee.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                        {record.assignee}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.status}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(record.status).bgcolor,
                      color: getStatusColor(record.status).color,
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.startDate || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.completionDate || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="팝업편집">
                    <IconButton size="small" onClick={() => handleEditRecord(record.id)} sx={{ color: 'primary.main' }}>
                      <Edit size={16} />
                    </IconButton>
                  </Tooltip>
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
            {filteredRecords.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredRecords.length)} of ${filteredRecords.length}`
              : '0-0 of 0'}
          </Typography>
          {totalPages > 0 && (
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handlePageChange}
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

      {/* 첨부파일 다이얼로그 */}
      <Dialog open={attachmentDialog.open} onClose={handleCloseAttachment} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            첨부파일 관리
            <IconButton onClick={handleCloseAttachment} size="small">
              <CloseCircle size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {attachmentDialog.recordId && (
            <>
              {/* 파일 업로드 영역 */}
              <Box sx={{ mb: 3, p: 2, border: `2px dashed ${theme.palette.grey[300]}`, borderRadius: 1 }}>
                <input accept="*/*" style={{ display: 'none' }} id="file-upload" multiple type="file" onChange={handleFileUpload} />
                <label htmlFor="file-upload">
                  <Button variant="outlined" component="span" startIcon={<DocumentUpload size={20} />} fullWidth sx={{ py: 1.5 }}>
                    파일 업로드 (다중 선택 가능)
                  </Button>
                </label>
              </Box>

              {/* 첨부파일 목록 */}
              <List>
                {(() => {
                  const currentRecord = costs.find((r) => r.id === attachmentDialog.recordId);
                  return currentRecord?.attachments.map((attachment) => (
                    <ListItem key={attachment.id} divider>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography sx={{ mr: 1, fontSize: '1.2rem' }}>{getFileIcon(attachment.type)}</Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {attachment.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {attachment.size} • {attachment.uploadDate}
                          </Typography>
                        </Box>
                        <IconButton edge="end" onClick={() => handleDeleteAttachment(attachment.id)} size="small" color="error">
                          <Trash size={16} />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ));
                })()}
                {(() => {
                  const currentRecord = costs.find((r) => r.id === attachmentDialog.recordId);
                  return (
                    currentRecord?.attachments.length === 0 && (
                      <ListItem>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
                          첨부된 파일이 없습니다.
                        </Typography>
                      </ListItem>
                    )
                  );
                })()}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAttachment}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 데이터 편집 팝업창 */}
      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '840px',
            maxHeight: '840px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500, mb: 0.5 }}>
                비용관리 편집
              </Typography>
              {dialog.mode === 'edit' && (
                <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                  {overviewData.title} ({overviewData.code})
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={handleCloseDialog}>
                취소
              </Button>
              <Button variant="contained" size="small" onClick={handleSaveRecord}>
                저장
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            pb: 1,
            height: 'calc(840px - 80px - 60px)',
            maxHeight: 'calc(840px - 80px - 60px)',
            overflow: 'auto'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="개요" />
              <Tab label="금액" />
              <Tab label="기록" />
              <Tab label="자료" />
            </Tabs>
          </Box>

          {/* 개요 탭 */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* 제목 */}
                <Grid item xs={12}>
                  <TextField
                    label="제목"
                    fullWidth
                    required
                    placeholder="비용 제목을 입력하세요"
                    value={overviewData.title || ''}
                    onChange={(e) => setOverviewData((prev) => ({ ...prev, title: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        '& .MuiInputLabel-asterisk': {
                          color: 'red'
                        }
                      }
                    }}
                  />
                </Grid>

                {/* 세부내용 */}
                <Grid item xs={12}>
                  <TextField
                    label="세부내용"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="비용 관련 상세 내용을 입력하세요"
                    value={overviewData.content || ''}
                    onChange={(e) => setOverviewData((prev) => ({ ...prev, content: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* 비용유형 - 총금액 - 상태 행 */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel
                      shrink
                      sx={{
                        '& .MuiInputLabel-asterisk': {
                          color: 'red'
                        }
                      }}
                    >
                      비용유형
                    </InputLabel>
                    <Select
                      label="비용유형"
                      value={overviewData.costType || ''}
                      onChange={(e) => setOverviewData((prev) => ({ ...prev, costType: e.target.value }))}
                      displayEmpty
                    >
                      <MenuItem value="">선택</MenuItem>
                      {costTypes.length > 0 ? (
                        costTypes.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))
                      ) : (
                        costTypeOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="총금액"
                    fullWidth
                    value={`${totalAmount.toLocaleString()}원`}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    InputProps={{
                      readOnly: true
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#e0e0e0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#666666'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>상태</InputLabel>
                    <Select
                      label="상태"
                      value={overviewData.status || '대기'}
                      onChange={(e) => setOverviewData((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      {(statusList.length > 0 ? statusList : statusOptions).map((option) => (
                        <MenuItem key={option} value={option}>
                          <Chip
                            label={option}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(option).bgcolor,
                              color: getStatusColor(option).color,
                              fontSize: '13px',
                              fontWeight: 400
                            }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* 시작일 - 완료일 행 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="시작일"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        '& .MuiInputLabel-asterisk': {
                          color: 'red'
                        }
                      }
                    }}
                    variant="outlined"
                    value={overviewData.startDate || ''}
                    onChange={(e) => setOverviewData((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="완료일"
                    type="date"
                    variant="outlined"
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        '& .MuiInputLabel-asterisk': {
                          color: 'red'
                        }
                      }
                    }}
                    value={overviewData.completionDate || ''}
                    onChange={(e) => setOverviewData((prev) => ({ ...prev, completionDate: e.target.value }))}
                  />
                </Grid>

                {/* 팀 - 담당자 행 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="팀"
                    value={overviewData.team || ''}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    InputProps={{
                      readOnly: true
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#e0e0e0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#666666'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="담당자"
                    value={overviewData.assignee || ''}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <Avatar
                          src={currentUser.profileImage}
                          sx={{ width: 24, height: 24, mr: 0 }}
                        >
                          {currentUser.name[0]}
                        </Avatar>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#e0e0e0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#666666'
                      }
                    }}
                  />
                </Grid>

                {/* 등록일 - 코드 행 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="등록일"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    value={overviewData.registrationDate}
                    InputProps={{
                      readOnly: true
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#e0e0e0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#666666'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="코드"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    value={overviewData.code}
                    InputProps={{
                      readOnly: true
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f5f5f5',
                        '& fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover fieldset': {
                          borderColor: '#e0e0e0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#e0e0e0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#666666'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 금액 탭 */}
          {tabValue === 1 && (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              {/* 추가/삭제 버튼 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  금액 상세 (합계금액: <span style={{ color: '#2196F3' }}>{totalAmount.toLocaleString()}원</span>)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      const newItem = {
                        id: Date.now(),
                        code: generateAmountCode(),
                        costType: '솔루션',
                        content: '',
                        quantity: 0,
                        unitPrice: 0,
                        amount: 0
                      };
                      setAmountItems((prev) => [newItem, ...prev]);
                    }}
                  >
                    추가
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={selectedAmountItems.length === 0}
                    onClick={() => {
                      setAmountItems((prev) => prev.filter((item) => !selectedAmountItems.includes(item.id)));
                      setSelectedAmountItems([]);
                    }}
                  >
                    삭제
                  </Button>
                </Box>
              </Box>

              {/* 테이블 */}
              <TableContainer
                sx={{
                  mb: 2,
                  boxShadow: 'none',
                  border: '1px solid #f0f0f0',
                  borderRadius: 2
                }}
              >
                <Table
                  size="small"
                  sx={{
                    minWidth: 810,
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                      border: 'none',
                      padding: '12px 8px'
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      backgroundColor: '#fafafa',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: 'text.primary',
                      borderBottom: '2px solid #f0f0f0'
                    },
                    '& .MuiTableBody-root .MuiTableRow-root': {
                      '&:hover': {
                        backgroundColor: '#f8f9fa'
                      },
                      '&:not(:last-child)': {
                        borderBottom: '1px solid #f5f5f5'
                      }
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: 35 }}>
                        <Checkbox
                          indeterminate={selectedAmountItems.length > 0 && selectedAmountItems.length < amountItems.length}
                          checked={amountItems.length > 0 && selectedAmountItems.length === amountItems.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAmountItems(amountItems.map((item) => item.id));
                            } else {
                              setSelectedAmountItems([]);
                            }
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ width: 35 }}>NO</TableCell>
                      <TableCell sx={{ width: 144 }}>코드</TableCell>
                      <TableCell sx={{ width: 95 }}>비용세부유형</TableCell>
                      <TableCell sx={{ width: 236 }}>내용</TableCell>
                      <TableCell sx={{ width: 60 }}>수량</TableCell>
                      <TableCell sx={{ width: 100 }}>단가</TableCell>
                      <TableCell sx={{ width: 105 }}>금액</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {amountItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                          추가 버튼을 눌러 금액 항목을 추가해보세요.
                        </TableCell>
                      </TableRow>
                    ) : (
                      amountItems.map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedAmountItems.includes(item.id)}
                              onChange={() => {
                                setSelectedAmountItems((prev) =>
                                  prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                );
                              }}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', fontWeight: 500 }}>
                              {amountItems.length - index}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '12px',
                                color: 'text.primary',
                                fontWeight: 500,
                                padding: '8px 4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={item.costType || '솔루션'}
                              onChange={(e) => {
                                setAmountItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, costType: e.target.value } : i)));
                              }}
                              variant="standard"
                              disableUnderline
                              sx={{
                                width: '100%',
                                fontSize: '13px',
                                '& .MuiSelect-select': {
                                  padding: '8px 4px',
                                  fontSize: '12px',
                                  border: 'none',
                                  outline: 'none'
                                },
                                '& .MuiInput-root': {
                                  border: 'none',
                                  '&:before': { display: 'none' },
                                  '&:after': { display: 'none' }
                                },
                                '&:hover': {
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '4px'
                                },
                                '& .MuiSelect-icon': {
                                  right: '4px'
                                }
                              }}
                            >
                              {(costDetailTypes.length > 0 ? costDetailTypes : costTypeOptions).map((option) => (
                                <MenuItem key={option} value={option} sx={{ fontSize: '12px' }}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.content || ''}
                              onChange={(e) => {
                                setAmountItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, content: e.target.value } : i)));
                              }}
                              placeholder="내용 입력"
                              variant="standard"
                              sx={{
                                width: '100%',
                                '& .MuiInput-underline': {
                                  '&:before': {
                                    display: 'none'
                                  },
                                  '&:after': {
                                    display: 'none'
                                  },
                                  '&:hover:not(.Mui-disabled):before': {
                                    display: 'none'
                                  }
                                },
                                '& .MuiInputBase-input': {
                                  fontSize: '12px',
                                  backgroundColor: 'transparent',
                                  padding: '8px 4px',
                                  '&:focus': {
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px'
                                  }
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const quantity = Number(e.target.value) || 0;
                                const amount = quantity * (item.unitPrice || 0);
                                setAmountItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity, amount } : i)));
                              }}
                              InputProps={{
                                inputProps: { min: 0 },
                                disableUnderline: true
                              }}
                              variant="standard"
                              sx={{
                                width: '100%',
                                '& .MuiInput-underline': {
                                  '&:before': {
                                    display: 'none'
                                  },
                                  '&:after': {
                                    display: 'none'
                                  },
                                  '&:hover:not(.Mui-disabled):before': {
                                    display: 'none'
                                  }
                                },
                                '& .MuiInputBase-input': {
                                  fontSize: '12px',
                                  backgroundColor: 'transparent',
                                  padding: '8px 4px',
                                  textAlign: 'center',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'textfield',
                                  '&::-webkit-outer-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0
                                  },
                                  '&::-webkit-inner-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0
                                  },
                                  '&:focus': {
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px'
                                  }
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={(item.unitPrice || 0) === 0 ? '' : (item.unitPrice || 0).toLocaleString() + '원'}
                              onChange={(e) => {
                                // 숫자가 아닌 문자 제거 (쉼표, 원 등)
                                const cleanValue = e.target.value.replace(/[^0-9]/g, '');
                                const unitPrice = Number(cleanValue) || 0;
                                const amount = (item.quantity || 0) * unitPrice;
                                setAmountItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, unitPrice, amount } : i)));
                              }}
                              onFocus={(e) => {
                                // 포커스 시 숫자만 표시
                                if (item.unitPrice > 0) {
                                  e.target.value = item.unitPrice.toString();
                                }
                              }}
                              onBlur={(e) => {
                                // 포커스 아웃 시 포맷팅
                                if (item.unitPrice > 0) {
                                  e.target.value = item.unitPrice.toLocaleString() + '원';
                                }
                              }}
                              InputProps={{
                                disableUnderline: true
                              }}
                              variant="standard"
                              sx={{
                                width: '100%',
                                '& .MuiInput-underline': {
                                  '&:before': {
                                    display: 'none'
                                  },
                                  '&:after': {
                                    display: 'none'
                                  },
                                  '&:hover:not(.Mui-disabled):before': {
                                    display: 'none'
                                  }
                                },
                                '& .MuiInputBase-input': {
                                  fontSize: '12px',
                                  backgroundColor: 'transparent',
                                  padding: '8px 4px',
                                  textAlign: 'right',
                                  wordBreak: 'break-all',
                                  whiteSpace: 'normal',
                                  lineHeight: 1.4,
                                  maxWidth: '100px',
                                  overflow: 'hidden',
                                  '&:focus': {
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                  }
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                minHeight: '32px'
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#2196F3',
                                  fontWeight: 600,
                                  fontSize: '12px'
                                }}
                              >
                                {item.amount.toLocaleString()}원
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* 기록 탭 */}
          {tabValue === 2 && (
            <TabPanel value={tabValue} index={2}>
              <RecordTab
                comments={comments}
                newComment={newComment}
                onNewCommentChange={setNewComment}
                onAddComment={handleAddComment}
                editingCommentId={editingCommentId}
                editingCommentText={editingCommentText}
                onEditComment={handleEditComment}
                onSaveEditComment={handleSaveEditComment}
                onCancelEditComment={handleCancelEditComment}
                onDeleteComment={handleDeleteComment}
                onEditCommentTextChange={setEditingCommentText}
                currentUserName={currentUser.name}
                currentUserAvatar={currentUser.profileImage}
                currentUserRole={currentUser.role}
                currentUserDepartment={currentUser.department}
              />
            </TabPanel>
          )}

          {/* 자료 탭 */}
          {tabValue === 3 && (
            <MaterialTab recordId={dialog.recordId} currentUser={currentUser} />
          )}
        </DialogContent>
        {validationError && (
          <Box sx={{ px: 3, pb: 2, pt: 0 }}>
            <Alert severity="error">
              {validationError}
            </Alert>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
