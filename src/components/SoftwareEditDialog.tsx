import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  Chip,
  Grid,
  Checkbox,
  Paper,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  SvgIcon,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination
} from '@mui/material';
import { TaskTableData, TaskStatus, SoftwareStatus } from '../types/software';
import { useOptimizedInput } from '../hooks/useDebounce';
// import { usePerformanceMonitor } from '../utils/performance';

// Supabase hook
import { useSupabaseSoftware, SoftwareData } from '../hooks/useSupabaseSoftware';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GROUP015 hook
import { useGroup015 } from '../hooks/useGroup015';

// GROUP017 hook
import { useGroup017 } from '../hooks/useGroup017';

// GROUP002 hook
import { useGroup002 } from '../hooks/useGroup002';

// GROUP016 hook
import { useGroup016 } from '../hooks/useGroup016';

// Users hook
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';

// Software User hook
import { useSupabaseSoftwareUser, UserHistory } from '../hooks/useSupabaseSoftwareUser';
// Software History hook
import { useSupabaseSoftwareHistory, PurchaseHistory } from '../hooks/useSupabaseSoftwareHistory';
// Feedback hook
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS } from '../types/feedback';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface EditSoftwareState {
  softwareName: string;
  description: string;
  softwareCategory: string;
  spec: string;
  status: TaskStatus;
  startDate: string;
  completedDate: string;
  currentUser: string;
  assignee: string;
  team: string;
  solutionProvider: string;
  userCount: number;
  licenseType: string;
  licenseKey: string;
  registrationDate: string;
  code: string;
}

type EditSoftwareAction =
  | { type: 'SET_FIELD'; field: keyof EditSoftwareState; value: string | number }
  | { type: 'SET_SOFTWARE'; software: TaskTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_SOFTWARE'; code: string; registrationDate: string };

const editSoftwareReducer = (state: EditSoftwareState, action: EditSoftwareAction): EditSoftwareState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_SOFTWARE':
      const result = {
        softwareName: (action.software as any).softwareName || action.software.workContent || '',
        description: (action.software as any).description || '',
        softwareCategory: (action.software as any).softwareCategory || '',
        spec: (action.software as any).spec || '',
        status: action.software.status as TaskStatus,
        startDate: action.software.startDate || '',
        completedDate: action.software.completedDate || '',
        currentUser: (action.software as any).currentUser || '',
        assignee: action.software.assignee,
        team: (action.software as any).team || '',
        solutionProvider: (action.software as any).solutionProvider || '',
        userCount: (action.software as any).userCount || 0,
        licenseType: (action.software as any).licenseType || '',
        licenseKey: (action.software as any).licenseKey || '',
        registrationDate: action.software.registrationDate || '',
        code: action.software.code
      };

      console.log('🔄 SET_SOFTWARE 액션 실행:', {
        taskId: action.software.id,
        softwareName: result.softwareName,
        code: result.code,
        status: result.status,
        assignee: result.assignee,
        currentUser: result.currentUser,
        rawData: action.software
      });

      return result;
    case 'INIT_NEW_SOFTWARE':
      return {
        softwareName: '',
        description: '',
        softwareCategory: '',
        spec: '',
        status: '대기',
        startDate: '',
        completedDate: '',
        currentUser: '',
        assignee: '',
        team: '',
        solutionProvider: '',
        userCount: 0,
        licenseType: '',
        licenseKey: '',
        registrationDate: action.registrationDate,
        code: action.code
      };
    case 'RESET':
      return {
        softwareName: '',
        description: '',
        softwareCategory: '',
        spec: '',
        status: '대기',
        startDate: '',
        completedDate: '',
        currentUser: '',
        assignee: '',
        team: '',
        solutionProvider: '',
        userCount: 0,
        licenseType: '',
        licenseKey: '',
        registrationDate: '',
        code: ''
      };
    default:
      return state;
  }
};

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
            pb: 3,
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

RecordTab.displayName = 'RecordTab';

// 개요 탭 컴포넌트
const OverviewTab = memo(
  ({
    softwareState,
    onFieldChange,
    users,
    usersLoading,
    usersError,
    statusOptions,
    statusColors,
    softwareCategories,
    licenseTypes,
    categoriesLoading,
    categoriesError,
    statusLoading,
    statusError,
    masterStatusOptions,
    licenseLoading,
    licenseError,
    masterLicenseTypes
  }: {
    softwareState: EditSoftwareState;
    onFieldChange: (field: keyof EditSoftwareState, value: string | number) => void;
    users: any[];
    usersLoading: boolean;
    usersError: string | null;
    statusOptions: SoftwareStatus[];
    statusColors: Record<SoftwareStatus, any>;
    softwareCategories: string[];
    licenseTypes: string[];
    categoriesLoading: boolean;
    categoriesError: string | null;
    statusLoading: boolean;
    statusError: string | null;
    masterStatusOptions: string[];
    licenseLoading: boolean;
    licenseError: string | null;
    masterLicenseTypes: string[];
  }) => {
    // TextField 직접 참조를 위한 ref
    const workContentRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // 텍스트 필드용 최적화된 입력 관리
    const softwareNameInput = useOptimizedInput(softwareState.softwareName, 150);
    const descriptionInput = useOptimizedInput(softwareState.description, 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림 (onFieldChange 의존성 제거로 최적화)
    useEffect(() => {
      if (!isUpdatingRef.current && softwareNameInput.debouncedValue !== softwareState.softwareName) {
        onFieldChange('softwareName', softwareNameInput.debouncedValue);
      }
    }, [softwareNameInput.debouncedValue, softwareState.softwareName]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && descriptionInput.debouncedValue !== softwareState.description) {
        onFieldChange('description', descriptionInput.debouncedValue);
      }
    }, [descriptionInput.debouncedValue, softwareState.description]); // onFieldChange 제거

    // 외부에서 상태가 변경될 때 입력 값 동기화 (reset 함수 의존성 제거로 최적화)
    useEffect(() => {
      if (softwareState.softwareName !== softwareNameInput.inputValue && softwareState.softwareName !== softwareNameInput.debouncedValue) {
        isUpdatingRef.current = true;
        softwareNameInput.reset(softwareState.softwareName);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [softwareState.softwareName, softwareNameInput.inputValue, softwareNameInput.debouncedValue]); // reset 제거

    useEffect(() => {
      if (softwareState.description !== descriptionInput.inputValue && softwareState.description !== descriptionInput.debouncedValue) {
        isUpdatingRef.current = true;
        descriptionInput.reset(softwareState.description);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [softwareState.description, descriptionInput.inputValue, descriptionInput.debouncedValue]); // reset 제거

    const handleFieldChange = useCallback(
      (field: keyof EditSoftwareState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string | number } }) => {
          const value = e.target.value;
          if (field === 'userCount') {
            onFieldChange(field, Number(value));
          } else {
            onFieldChange(field, String(value));
          }
        },
      [onFieldChange]
    );

    // 현재 입력 값들을 반환하는 함수 (의존성 배열 제거로 최적화)
    const getCurrentValues = useCallback(() => {
      return {
        softwareName: workContentRef.current?.value || softwareNameInput.inputValue,
        description: descriptionRef.current?.value || descriptionInput.inputValue
      };
    }, []); // 의존성 배열 제거 - ref를 통해 최신 값 접근

    // 컴포넌트가 마운트될 때 getCurrentValues 함수를 전역에서 접근 가능하도록 설정
    useEffect(() => {
      (window as any).getOverviewTabCurrentValues = getCurrentValues;
      return () => {
        delete (window as any).getOverviewTabCurrentValues;
      };
    }, []); // 의존성 배열에서 getCurrentValues 제거

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 소프트웨어명 - 전체 너비 */}
          <TextField
            fullWidth
            label={
              <span>
                소프트웨어명 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={softwareNameInput.inputValue}
            onChange={(e) => softwareNameInput.handleChange(e.target.value)}
            variant="outlined"
            inputRef={workContentRef}
            InputLabelProps={{ shrink: true }}
          />

          {/* 설명 - 전체 너비 */}
          <TextField
            fullWidth
            label="설명"
            multiline
            rows={4}
            value={descriptionInput.inputValue}
            onChange={(e) => descriptionInput.handleChange(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputRef={descriptionRef}
          />

          {/* 소프트웨어분류, 스펙, 상태 - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  소프트웨어분류 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={softwareState.softwareCategory}
                label="소프트웨어분류"
                onChange={handleFieldChange('softwareCategory')}
                disabled={categoriesLoading}
                displayEmpty
              >
                {categoriesLoading ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      로딩 중...
                    </Typography>
                  </MenuItem>
                ) : categoriesError ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                      데이터 로드 실패
                    </Typography>
                  </MenuItem>
                ) : (
                  [
                    <MenuItem key="empty" value="">
                      선택
                    </MenuItem>,
                    ...softwareCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))
                  ]
                )}
              </Select>
              {categoriesError && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                  GROUP015 마스터코드 로드에 실패했습니다.
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="스펙"
              value={softwareState.spec}
              onChange={handleFieldChange('spec')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={softwareState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      로딩 중...
                    </Typography>
                  </MenuItem>
                ) : statusError ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                      데이터 로드 실패
                    </Typography>
                  </MenuItem>
                ) : (
                  masterStatusOptions.map((status) => {
                    const getStatusColor = (statusName: string) => {
                      switch (statusName) {
                        case '대기':
                          return { bgcolor: '#F5F5F5', color: '#757575' };
                        case '진행':
                          return { bgcolor: '#E3F2FD', color: '#1976D2' };
                        case '사용중':
                        case '완료':
                          return { bgcolor: '#E8F5E9', color: '#388E3C' };
                        case '홀딩':
                        case '홀딩22':
                          return { bgcolor: '#FFEBEE', color: '#D32F2F' };
                        default:
                          return { bgcolor: '#F5F5F5', color: '#757575' };
                      }
                    };

                    return (
                      <MenuItem key={status} value={status}>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(status).bgcolor,
                            color: getStatusColor(status).color,
                            fontSize: '13px',
                            fontWeight: 400
                          }}
                        />
                      </MenuItem>
                    );
                  })
                )}
              </Select>
              {statusError && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                  GROUP002 마스터코드 로드에 실패했습니다.
                </Typography>
              )}
            </FormControl>
          </Stack>

          {/* 솔루션업체 - 사용자수 - 사용자 - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label={
                <span>
                  솔루션업체 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={softwareState.solutionProvider}
              onChange={handleFieldChange('solutionProvider')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="사용자수"
              type="number"
              value={softwareState.userCount}
              onChange={handleFieldChange('userCount')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 0 }}
            />

            <TextField
              fullWidth
              label="사용자"
              value={softwareState.currentUser}
              onChange={handleFieldChange('currentUser')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 라이센스유형과 라이센스키 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  라이센스유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={softwareState.licenseType}
                label="라이센스유형"
                onChange={handleFieldChange('licenseType')}
                disabled={licenseLoading}
                displayEmpty
              >
                {licenseLoading ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      로딩 중...
                    </Typography>
                  </MenuItem>
                ) : licenseError ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                      데이터 로드 실패
                    </Typography>
                  </MenuItem>
                ) : (
                  [
                    <MenuItem key="empty" value="">
                      선택
                    </MenuItem>,
                    ...masterLicenseTypes.map((licenseType) => (
                      <MenuItem key={licenseType} value={licenseType}>
                        {licenseType}
                      </MenuItem>
                    ))
                  ]
                )}
              </Select>
              {licenseError && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                  GROUP016 마스터코드 로드에 실패했습니다.
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="라이센스키"
              value={softwareState.licenseKey}
              onChange={handleFieldChange('licenseKey')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 팀과 담당자 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              value={softwareState.team || '팀 미지정'}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
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

            <TextField
              fullWidth
              label="담당자"
              value={softwareState.assignee || '담당자 미지정'}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment: softwareState.assignee ? (
                  <Avatar
                    src={(() => {
                      const user = users.find((u) => u.user_name === softwareState.assignee);
                      return user?.avatar_url || user?.profile_image_url;
                    })()}
                    alt={softwareState.assignee}
                    sx={{ width: 24, height: 24, mr: -0.5 }}
                  >
                    {softwareState.assignee?.charAt(0)}
                  </Avatar>
                ) : null
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
          </Stack>

          {/* 등록일과 코드 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={softwareState.registrationDate}
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

            <TextField
              fullWidth
              label="코드"
              value={softwareState.code}
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
          </Stack>
        </Stack>
      </Box>
    );
  }
);

OverviewTab.displayName = 'OverviewTab';

// 모던한 접기/펼치기 아이콘 컴포넌트
const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <SvgIcon
    sx={{
      transition: 'transform 0.2s ease-in-out, color 0.2s ease-in-out',
      transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
      fontSize: '14px',
      '&:hover': {
        transform: expanded ? 'rotate(0deg) scale(1.1)' : 'rotate(-90deg) scale(1.1)',
        color: 'primary.main'
      }
    }}
  >
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </SvgIcon>
);

// 자료 탭 컴포넌트
const MaterialTab = memo(
  ({
    materials,
    onAddMaterial,
    editingMaterialId,
    editingMaterialText,
    onEditMaterial,
    onSaveEditMaterial,
    onCancelEditMaterial,
    onDeleteMaterial,
    onEditMaterialTextChange,
    onDownloadMaterial
  }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
          const material = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: formatFileSize(file.size),
            file: file,
            uploadDate: new Date().toISOString().split('T')[0]
          };

          onAddMaterial(material);
        });

        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      [onAddMaterial]
    );

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string): string => {
      if (type.startsWith('image/')) return '🖼️';
      if (type.startsWith('video/')) return '🎥';
      if (type.startsWith('audio/')) return '🎵';
      if (type.includes('pdf')) return '📄';
      if (type.includes('word') || type.includes('document')) return '📝';
      if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
      if (type.includes('powerpoint') || type.includes('presentation')) return '📋';
      if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '📦';
      return '📄';
    };

    const handleUploadClick = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

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
                파일을 업로드하세요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                클릭하거나 파일을 여기로 드래그하세요
              </Typography>
              <Button variant="contained" size="small" startIcon={<Typography>📤</Typography>}>
                파일 선택
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* 자료 항목들 */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Stack spacing={2}>
            {materials.map((material: any, index: number) => (
              <Paper
                key={material.id}
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
                    <Typography fontSize="24px">{getFileIcon(material.type || '')}</Typography>
                  </Box>

                  {/* 파일 정보 영역 */}
                  <Box sx={{ flexGrow: 1 }}>
                    {editingMaterialId === material.id ? (
                      <TextField
                        fullWidth
                        value={editingMaterialText}
                        onChange={(e) => onEditMaterialTextChange(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') onSaveEditMaterial();
                          if (e.key === 'Escape') onCancelEditMaterial();
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
                        onClick={() => onEditMaterial(material.id, material.name)}
                      >
                        {material.name}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {material.type} • {material.size}
                      {material.uploadDate && ` • ${material.uploadDate}`}
                    </Typography>
                  </Box>

                  {/* 액션 버튼들 */}
                  <Stack direction="row" spacing={1}>
                    {editingMaterialId === material.id ? (
                      <>
                        <IconButton size="small" onClick={onSaveEditMaterial} color="success" sx={{ p: 0.5 }} title="저장">
                          <Typography fontSize="14px">✓</Typography>
                        </IconButton>
                        <IconButton size="small" onClick={onCancelEditMaterial} color="error" sx={{ p: 0.5 }} title="취소">
                          <Typography fontSize="14px">✕</Typography>
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => onDownloadMaterial(material)}
                          color="primary"
                          sx={{ p: 0.5 }}
                          title="다운로드"
                        >
                          <Typography fontSize="14px">⬇️</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onEditMaterial(material.id, material.name)}
                          color="primary"
                          sx={{ p: 0.5 }}
                          title="수정"
                        >
                          <Typography fontSize="14px">✏️</Typography>
                        </IconButton>
                        <IconButton size="small" onClick={() => onDeleteMaterial(material.id)} color="error" sx={{ p: 0.5 }} title="삭제">
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
          {materials.length === 0 && (
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
  }
);

MaterialTab.displayName = 'MaterialTab';

// 사용자 이력 인터페이스
interface UserHistory {
  id: string;
  registrationDate: string;
  userId?: string;
  userName: string;
  department: string;
  exclusiveId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string; // 'active' | 'inactive' | '사용중' | '중지' | '반납' 등
  team?: string; // department와 호환성을 위해 추가
}

// 사용자이력 탭 컴포넌트
const UserHistoryTab = memo(({
  softwareId,
  mode,
  userHistories: initialUserHistories,
  onUserHistoriesChange
}: {
  softwareId: number;
  mode: 'add' | 'edit';
  userHistories: UserHistory[];
  onUserHistoriesChange: (histories: UserHistory[]) => void;
}) => {
  const { getUserHistories, convertToUserHistory } = useSupabaseSoftwareUser();

  // 로컬 사용자이력 상태
  const [userHistories, setUserHistories] = useState<UserHistory[]>(initialUserHistories);

  // DB에서 사용자이력 로드 (편집 모드인 경우)
  useEffect(() => {
    const loadUserHistories = async () => {
      if (mode === 'edit' && softwareId) {
        try {
          const userData = await getUserHistories(softwareId);
          const convertedData = userData.map(convertToUserHistory);
          setUserHistories(convertedData);
          onUserHistoriesChange(convertedData);
        } catch (error) {
          console.warn('⚠️ 사용자이력 로드 중 오류:', error);
          // 에러가 발생해도 빈 배열로 초기화하여 UI가 정상 작동하도록 함
          setUserHistories([]);
          onUserHistoriesChange([]);
        }
      }
    };

    loadUserHistories();
  }, [mode, softwareId]);

  // 사용자이력 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onUserHistoriesChange(userHistories);
  }, [userHistories, onUserHistoriesChange]);

  // 더 많은 샘플 데이터로 페이지네이션 테스트 (add 모드일 때만 사용)
  const [sampleUserHistories] = useState<UserHistory[]>([
    {
      id: '1',
      registrationDate: '2024-01-15',
      userId: 'user1',
      userName: '김철수',
      department: 'IT팀',
      exclusiveId: 'SW001-KCS',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      reason: '부서 이동',
      status: 'inactive'
    },
    {
      id: '2',
      registrationDate: '2024-07-01',
      userId: 'user2',
      userName: '이영희',
      department: '개발팀',
      exclusiveId: 'SW001-LYH',
      startDate: '2024-07-01',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '3',
      registrationDate: '2024-08-01',
      userId: 'user3',
      userName: '박민수',
      department: '디자인팀',
      exclusiveId: 'SW001-PMS',
      startDate: '2024-08-01',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '4',
      registrationDate: '2024-08-05',
      userId: 'user4',
      userName: '최은지',
      department: '기획팀',
      exclusiveId: 'SW001-CEJ',
      startDate: '2024-08-05',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '5',
      registrationDate: '2024-08-10',
      userId: 'user5',
      userName: '정현우',
      department: '마케팅팀',
      exclusiveId: 'SW001-JHW',
      startDate: '2024-08-10',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '6',
      registrationDate: '2024-08-15',
      userId: 'user6',
      userName: '강예린',
      department: 'IT팀',
      exclusiveId: 'SW001-KYR',
      startDate: '2024-08-15',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '7',
      registrationDate: '2024-08-20',
      userId: 'user7',
      userName: '송지훈',
      department: '개발팀',
      exclusiveId: 'SW001-SJH',
      startDate: '2024-08-20',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '8',
      registrationDate: '2024-08-22',
      userId: 'user8',
      userName: '김소영',
      department: '디자인팀',
      exclusiveId: 'SW001-KSY',
      startDate: '2024-08-22',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    },
    {
      id: '9',
      registrationDate: '2024-08-24',
      userId: 'user9',
      userName: '이동현',
      department: '기획팀',
      exclusiveId: 'SW001-LDH',
      startDate: '2024-08-24',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    }
  ]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [statusWarning, setStatusWarning] = useState<string>('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // 페이지네이션 계산
  const totalPages = Math.ceil(userHistories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = userHistories.slice(startIndex, endIndex);

  // 페이지 변경 핸들러 (MUI Pagination 형식에 맞게 수정)
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleCellClick = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleAddHistory = () => {
    const newHistory: UserHistory = {
      id: Date.now().toString(),
      registrationDate: new Date().toISOString().split('T')[0],
      userId: '',
      userName: '',
      department: '',
      exclusiveId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      reason: '',
      status: 'active'
    };
    setUserHistories([newHistory, ...userHistories]);
  };

  const handleDeleteSelected = () => {
    setUserHistories(userHistories.filter((h) => !selectedRows.includes(h.id)));
    setSelectedRows([]);
  };

  const handleEditHistory = (id: string, field: keyof UserHistory, value: string) => {
    // 소프트웨어는 동시 사용이 가능하므로 상태 검증 제거
    setUserHistories(userHistories.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
    setStatusWarning('');
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(userHistories.map((h) => h.id));
    } else {
      setSelectedRows([]);
    }
  };

  const statusOptions = useMemo(() => ['사용중', '종료'], []);
  const statusColors: Record<string, string> = useMemo(() => ({
    사용중: 'success',
    종료: 'default'
  }), []);

  // 컬럼 너비 및 높이 정의 (편집/읽기 모드 공통)
  const columnWidths = useMemo(() => ({
    checkbox: 50,
    no: 60,
    registrationDate: 100,
    team: 100,
    userName: 120,
    exclusiveId: 120,
    reason: 150,
    status: 100,
    startDate: 100,
    endDate: 100
  }), []);

  const cellHeight = 56; // 고정 셀 높이

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (history: UserHistory, field: string, value: string, options?: string[]) => {
    const isEditing = editingCell?.id === history.id && editingCell?.field === field;
    const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

    if (isEditing) {
      if (options) {
        return (
          <Select
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              if (field === 'status') {
                const newStatus = newValue === '사용중' ? 'active' : 'inactive';
                handleEditHistory(history.id, 'status', newStatus);
              } else {
                handleEditHistory(history.id, field as keyof UserHistory, newValue);
              }
            }}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            sx={{
              width: fieldWidth - 16,
              minWidth: fieldWidth - 16,
              height: 40, // 고정 높이
              '& .MuiSelect-select': {
                padding: '8px 14px',
                fontSize: '12px',
                lineHeight: '1.4'
              }
            }}
          >
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {field === 'status' ? <Chip label={option} color={statusColors[option] as any} size="small" /> : option}
              </MenuItem>
            ))}
          </Select>
        );
      }

      if (field === 'startDate' || field === 'endDate') {
        return (
          <TextField
            type="date"
            value={value || ''}
            onChange={(e) => handleEditHistory(history.id, field as keyof UserHistory, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            InputLabelProps={{
              shrink: true
            }}
            sx={{
              width: fieldWidth - 16,
              height: 40, // 고정 높이
              '& .MuiInputBase-root': {
                height: 40
              },
              '& .MuiInputBase-input': {
                fontSize: '12px',
                padding: '8px 14px'
              }
            }}
          />
        );
      }

      return (
        <TextField
          value={value}
          onChange={(e) => handleEditHistory(history.id, field as keyof UserHistory, e.target.value)}
          onBlur={handleCellBlur}
          size="small"
          autoFocus
          InputLabelProps={{ shrink: true }}
          sx={{
            width: fieldWidth - 16,
            height: 40, // 고정 높이
            '& .MuiInputBase-root': {
              height: 40
            },
            '& .MuiInputBase-input': {
              fontSize: '12px',
              padding: '8px 14px'
            }
          }}
        />
      );
    }

    // 읽기 모드
    if (field === 'status') {
      return (
        <Box
          sx={{
            height: 40, // 고정 높이
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <Chip
            label={value}
            color={statusColors[value] as any}
            size="small"
            sx={{
              '&:hover': { opacity: 0.8 },
              fontSize: '12px'
            }}
          />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          height: 40, // 고정 높이
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.50' },
          p: 0.5,
          borderRadius: 1
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px'
          }}
        >
          {value || '-'}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
          사용자 이력 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selectedRows.length === 0} size="small">
            삭제({selectedRows.length})
          </Button>
          <Button variant="contained" onClick={handleAddHistory} size="small" sx={{ fontSize: '12px' }}>
            추가
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: 800
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <Checkbox
                  checked={selectedRows.length === userHistories.length && userHistories.length > 0}
                  onChange={handleSelectAll}
                  color="primary"
                  size="small"
                  sx={{
                    transform: 'scale(0.7)',
                    '&.Mui-checked': {
                      color: '#1976d2'
                    }
                  }}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
              <TableCell sx={{ width: columnWidths.userName, fontWeight: 600 }}>사용자</TableCell>
              <TableCell sx={{ width: columnWidths.exclusiveId, fontWeight: 600 }}>전용아이디</TableCell>
              <TableCell sx={{ width: columnWidths.reason, fontWeight: 600 }}>사유</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>사용상태</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.endDate, fontWeight: 600 }}>종료일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((history, index) => (
              <TableRow
                key={`history_${history.id}_${index}`}
                hover
                sx={{
                  height: cellHeight,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <Checkbox
                    checked={selectedRows.includes(history.id)}
                    onChange={() => handleSelectRow(history.id)}
                    color="primary"
                    size="small"
                    sx={{
                      transform: 'scale(0.7)',
                      '&.Mui-checked': {
                        color: '#1976d2'
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: columnWidths.no }}>{userHistories.length - startIndex - index}</TableCell>
                <TableCell sx={{ width: columnWidths.registrationDate }} onClick={() => handleCellClick(history.id, 'registrationDate')}>
                  {renderEditableCell(history, 'registrationDate', history.registrationDate)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.team }} onClick={() => handleCellClick(history.id, 'department')}>
                  {renderEditableCell(history, 'department', history.department)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.userName }} onClick={() => handleCellClick(history.id, 'userName')}>
                  {renderEditableCell(history, 'userName', history.userName)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.exclusiveId }} onClick={() => handleCellClick(history.id, 'exclusiveId')}>
                  {renderEditableCell(history, 'exclusiveId', history.exclusiveId)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.reason }} onClick={() => handleCellClick(history.id, 'reason')}>
                  {renderEditableCell(history, 'reason', history.reason)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.status }} onClick={() => handleCellClick(history.id, 'status')}>
                  {renderEditableCell(history, 'status', history.status === 'active' ? '사용중' : '종료', statusOptions)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.startDate }} onClick={() => handleCellClick(history.id, 'startDate')}>
                  {renderEditableCell(history, 'startDate', history.startDate)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.endDate }} onClick={() => handleCellClick(history.id, 'endDate')}>
                  {renderEditableCell(history, 'endDate', history.endDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 - 하단 고정 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 'auto',
          pt: 2,
          px: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          position: 'sticky',
          bottom: 0
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {userHistories.length > 0
            ? `${startIndex + 1}-${Math.min(endIndex, userHistories.length)} of ${userHistories.length}`
            : '0-0 of 0'}
        </Typography>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
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

      {/* 경고 메시지 */}
      {statusWarning && (
        <Alert
          severity="warning"
          sx={{
            mt: 2,
            mx: 3,
            mb: 2,
            animation: 'fadeIn 0.3s ease-in'
          }}
        >
          {statusWarning}
        </Alert>
      )}
    </Box>
  );
});

UserHistoryTab.displayName = 'UserHistoryTab';

// 구매/유지보수이력 인터페이스
interface MaintenanceHistory {
  id: string;
  registrationDate: string;
  type: 'purchase' | 'maintenance' | 'upgrade' | 'renewal';
  content: string;
  vendor: string;
  amount: number;
  registrant: string;
  status: string;
  startDate: string;
  completionDate: string;
}

// 구매/유지보수이력 탭 컴포넌트
const PurchaseMaintenanceTab = memo(({
  purchaseHistory,
  historyTypes,
  onAddPurchaseHistory,
  editingPurchaseHistoryId,
  editingPurchaseHistoryData,
  onEditPurchaseHistory,
  onSavePurchaseHistoryEdit,
  onCancelPurchaseHistoryEdit,
  onDeletePurchaseHistory,
  onEditPurchaseHistoryDataChange
}: {
  purchaseHistory: any[];
  historyTypes: string[];
  onAddPurchaseHistory: (item: any) => void;
  editingPurchaseHistoryId: number | null;
  editingPurchaseHistoryData: any;
  onEditPurchaseHistory: (id: number, data: any) => void;
  onSavePurchaseHistoryEdit: () => void;
  onCancelPurchaseHistoryEdit: () => void;
  onDeletePurchaseHistory: (id: number) => void;
  onEditPurchaseHistoryDataChange: (data: any) => void;
}) => {
  // 설명을 기반으로 이력 타입 결정
  const getHistoryType = (description: string): 'purchase' | 'maintenance' | 'upgrade' | 'renewal' => {
    if (description.includes('유지보수')) return 'maintenance';
    if (description.includes('업그레이드')) return 'upgrade';
    if (description.includes('갱신') || description.includes('연장')) return 'renewal';
    return 'purchase';
  };

  // memo에서 완료일 추출하는 함수
  const extractCompletionDate = (memo: string): string => {
    if (!memo) return '';
    const match = memo.match(/완료일:\s*([^\|]*)/);
    return match ? match[1].trim() : '';
  };

  // DB에서 로드된 구매이력을 MaintenanceHistory 형식으로 변환
  const dbHistories: MaintenanceHistory[] = purchaseHistory.map((item, index) => {
    const uniqueId = item.id ? item.id.toString() : `temp_${Date.now()}_${index}`;
    const completionDateFromMemo = extractCompletionDate(item.memo || '');

    return {
      id: uniqueId,
      registrationDate: item.registrationDate || item.purchaseDate || '',
      type: getHistoryType(item.description || ''),
      content: item.description || '',
      vendor: item.supplier || '',
      amount: parseFloat(item.price) || 0,
      registrant: '시스템',
      status: item.status || '진행중',
      startDate: item.purchaseDate || '',
      completionDate: completionDateFromMemo || (item.status === '완료' ? item.purchaseDate || '' : '')
    };
  });

  console.log('🔍 PurchaseMaintenanceTab - 데이터 확인:');
  console.log('  - purchaseHistory.length:', purchaseHistory.length);
  console.log('  - dbHistories.length:', dbHistories.length);
  console.log('  - purchaseHistory 데이터:', purchaseHistory);

  // 실제 데이터를 사용하되, DB 데이터가 없으면 빈 배열 사용
  const maintenanceHistories: MaintenanceHistory[] = dbHistories.length > 0 ? dbHistories : [];

  console.log('  - 최종 사용할 데이터:', maintenanceHistories.length + '개');

  // purchaseHistory 변경시 로그 출력
  React.useEffect(() => {
    console.log('🔄 PurchaseMaintenanceTab - purchaseHistory 변경됨:', purchaseHistory.length + '개');
    console.log('   변경된 데이터:', purchaseHistory);
    console.log('   변환된 maintenanceHistories:', dbHistories.length + '개');
    console.log('   maintenanceHistories 데이터:', dbHistories);
  }, [purchaseHistory]);

  // 더 많은 샘플 데이터로 페이지네이션 테스트 (참고용 - 더 이상 사용하지 않음)
  const [fallbackHistories] = useState<MaintenanceHistory[]>([
    {
      id: '1',
      registrationDate: '2024-01-15',
      type: 'purchase',
      content: 'Microsoft Office 365 Business Premium 라이선스',
      vendor: 'Microsoft',
      amount: 1200000,
      registrant: '김철수',
      status: '완료',
      startDate: '2024-01-10',
      completionDate: '2024-01-15'
    },
    {
      id: '2',
      registrationDate: '2024-06-20',
      type: 'maintenance',
      content: 'Adobe Creative Suite 유지보수 연장',
      vendor: 'Adobe',
      amount: 800000,
      registrant: '이영희',
      status: '완료',
      startDate: '2024-06-15',
      completionDate: '2024-06-20'
    },
    {
      id: '3',
      registrationDate: '2024-08-01',
      type: 'upgrade',
      content: 'Slack Business+ 플랜 업그레이드',
      vendor: 'Slack',
      amount: 500000,
      registrant: '박민수',
      status: '완료',
      startDate: '2024-08-01',
      completionDate: '2024-08-01'
    },
    {
      id: '4',
      registrationDate: '2024-08-05',
      type: 'renewal',
      content: 'Zoom Pro 라이선스 갱신',
      vendor: 'Zoom',
      amount: 300000,
      registrant: '최은지',
      status: '완료',
      startDate: '2024-08-03',
      completionDate: '2024-08-05'
    },
    {
      id: '5',
      registrationDate: '2024-08-10',
      type: 'purchase',
      content: 'Figma Professional 팀 라이선스',
      vendor: 'Figma',
      amount: 450000,
      registrant: '정현우',
      status: '완료',
      startDate: '2024-08-08',
      completionDate: '2024-08-10'
    },
    {
      id: '6',
      registrationDate: '2024-08-15',
      type: 'maintenance',
      content: 'Jira Software 유지보수',
      vendor: 'Atlassian',
      amount: 600000,
      registrant: '강예린',
      status: '진행중',
      startDate: '2024-08-14',
      completionDate: ''
    },
    {
      id: '7',
      registrationDate: '2024-08-20',
      type: 'upgrade',
      content: 'GitHub Enterprise 플랜 업그레이드',
      vendor: 'GitHub',
      amount: 900000,
      registrant: '송지훈',
      status: '완료',
      startDate: '2024-08-20',
      completionDate: '2024-08-20'
    },
    {
      id: '8',
      registrationDate: '2024-08-22',
      type: 'purchase',
      content: 'Notion Team 워크스페이스',
      vendor: 'Notion',
      amount: 200000,
      registrant: '김소영',
      status: '완료',
      startDate: '2024-08-20',
      completionDate: '2024-08-22'
    },
    {
      id: '9',
      registrationDate: '2024-08-24',
      type: 'renewal',
      content: 'Dropbox Business 라이선스 갱신',
      vendor: 'Dropbox',
      amount: 350000,
      registrant: '이동현',
      status: '진행중',
      startDate: '2024-08-23',
      completionDate: ''
    }
  ]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // 신규행(음수 ID)을 맨 위로, 기존 행(양수 ID)을 그 아래에 정렬
  const sortedMaintenanceHistories = [...maintenanceHistories].sort((a, b) => {
    // 신규행(음수 ID)을 맨 위에 배치
    if (a.id < 0 && b.id >= 0) return -1;
    if (a.id >= 0 && b.id < 0) return 1;
    // 둘 다 신규행이면 ID 역순 (가장 최근 추가된 것이 위)
    if (a.id < 0 && b.id < 0) return b.id - a.id;
    // 둘 다 기존 행이면 ID 역순 (최신이 위)
    return b.id - a.id;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedMaintenanceHistories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedMaintenanceHistories.slice(startIndex, endIndex);

  // 페이지 변경 핸들러 (MUI Pagination 형식에 맞게 수정)
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleCellClick = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleAddHistory = () => {
    // 안전한 고유 ID 생성 (기존 ID들과 중복되지 않도록)
    const existingIds = purchaseHistory.map(item => item.id || 0);
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = Math.max(maxId + 1, Date.now());

    const newPurchaseHistory = {
      id: newId,
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: '',
      price: '0',
      quantity: 1,
      contractNumber: '',
      description: '',
      status: '진행중',
      memo: '',
      registrationDate: new Date().toISOString().split('T')[0]
    };

    console.log('🔄 새 구매이력 추가:', newPurchaseHistory);
    console.log('   현재 이력 수:', purchaseHistory.length);

    onAddPurchaseHistory(newPurchaseHistory);

    // 새 항목 추가 후 첫 번째 페이지로 이동
    setCurrentPage(1);
  };

  const handleDeleteSelected = () => {
    selectedRows.forEach(id => {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        onDeletePurchaseHistory(numericId);
      }
    });
    setSelectedRows([]);
  };

  const handleEditHistory = (id: string, field: keyof MaintenanceHistory, value: string | number) => {
    // 편집된 내용을 purchaseHistory 형식으로 변환하여 부모 컴포넌트에 전달
    const purchaseHistoryItem = purchaseHistory.find(item => item.id?.toString() === id);
    if (purchaseHistoryItem) {
      const updatedItem = { ...purchaseHistoryItem };

      // MaintenanceHistory 필드를 PurchaseHistory 필드로 매핑
      switch (field) {
        case 'content':
          updatedItem.description = value as string;
          break;
        case 'vendor':
          updatedItem.supplier = value as string;
          break;
        case 'amount':
          updatedItem.price = value.toString();
          break;
        case 'startDate':
          updatedItem.purchaseDate = value as string;
          break;
        case 'status':
          updatedItem.status = value as string;
          break;
        case 'registrationDate':
          updatedItem.registrationDate = value as string;
          break;
        case 'completionDate':
          // completionDate는 memo 필드에 저장하거나 별도 처리
          updatedItem.memo = `완료일: ${value}${updatedItem.memo ? ' | ' + updatedItem.memo.replace(/완료일: [^\|]*(\|)?/g, '').trim() : ''}`;
          break;
      }

      // 부모 컴포넌트의 purchaseHistory 상태 업데이트
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        onEditPurchaseHistory(numericId, updatedItem);
      }
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(maintenanceHistories.map((h) => h.id));
    } else {
      setSelectedRows([]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return { backgroundColor: '#E3F2FD', color: '#000000' }; // 파스텔 블루
      case 'maintenance':
        return { backgroundColor: '#E8F5E8', color: '#000000' }; // 파스텔 그린
      case 'upgrade':
        return { backgroundColor: '#FFF3E0', color: '#000000' }; // 파스텔 오렌지
      case 'renewal':
        return { backgroundColor: '#F3E5F5', color: '#000000' }; // 파스텔 퍼플
      default:
        return { backgroundColor: '#F5F5F5', color: '#000000' }; // 연한 그레이
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return '구매';
      case 'maintenance':
        return '유지보수';
      case 'upgrade':
        return '업그레이드';
      case 'renewal':
        return '갱신';
      default:
        return '기타';
    }
  };

  // GROUP017 마스터코드에서 가져온 이력유형 사용 (fallback으로 기본값 제공)
  const typeOptions = useMemo(() =>
    historyTypes.length > 0 ? historyTypes : ['구매', '유지보수', '업그레이드', '갱신'],
    [historyTypes]
  );
  const statusOptions = useMemo(() => ['진행중', '완료', '만료', '해지'], []);
  const statusColors: Record<string, string> = useMemo(() => ({
    진행중: 'primary',
    완료: 'success',
    만료: 'warning',
    해지: 'error'
  }), []);

  // 컬럼 너비 및 높이 정의 (등록자, 상태 컬럼 제거)
  const columnWidths = useMemo(() => ({
    checkbox: 50,
    no: 60,
    type: 120,
    content: 300,
    vendor: 160,
    amount: 130,
    startDate: 110,
    completionDate: 110
  }), []);

  const cellHeight = 56;

  // 날짜 표시 형식 변환 (YYYY-MM-DD -> YYYY.MM.DD)
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    // YYYY-MM-DD 형식을 YYYY.MM.DD로 변환
    return dateStr.replace(/-/g, '.');
  };

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (history: MaintenanceHistory, field: string, value: string | number, options?: string[]) => {
    const isEditing = editingCell?.id === history.id && editingCell?.field === field;
    const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

    if (isEditing) {
      if (options) {
        return (
          <Select
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              if (field === 'type') {
                const typeMapping: Record<string, string> = {
                  구매: 'purchase',
                  유지보수: 'maintenance',
                  업그레이드: 'upgrade',
                  갱신: 'renewal'
                };
                handleEditHistory(history.id, 'type', typeMapping[newValue] || newValue);
              } else {
                handleEditHistory(history.id, field as keyof MaintenanceHistory, newValue);
              }
            }}
            onBlur={handleCellBlur}
            size="small"
            sx={{ width: '100%', minWidth: fieldWidth }}
            autoFocus
          >
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        );
      } else if (field === 'startDate' || field === 'completionDate') {
        // 날짜 필드는 date type input 사용
        return (
          <TextField
            type="date"
            value={value || ''}
            onChange={(e) => handleEditHistory(history.id, field as keyof MaintenanceHistory, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            sx={{
              width: '100%',
              minWidth: fieldWidth,
              '& input': {
                fontSize: '13px',
                padding: '8px 12px'
              }
            }}
            InputLabelProps={{
              shrink: true,
            }}
            autoFocus
          />
        );
      } else {
        return (
          <TextField
            value={value}
            onChange={(e) => handleEditHistory(history.id, field as keyof MaintenanceHistory, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            sx={{ width: '100%', minWidth: fieldWidth }}
            autoFocus
          />
        );
      }
    }

    return (
      <Box
        sx={{
          width: '100%',
          minWidth: fieldWidth,
          padding: '8px 12px',
          cursor: 'text',
          '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        {field === 'type' ? (
          <Chip
            label={getTypeLabel(value as string)}
            size="small"
            sx={{
              ...getTypeColor(value as string),
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '12px',
              height: '24px',
              minWidth: '60px'
            }}
          />
        ) : field === 'status' ? (
          <Chip
            label={value}
            size="small"
            color={statusColors[value as string] as any}
            sx={{
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '12px',
              height: '24px',
              minWidth: '60px'
            }}
          />
        ) : field === 'amount' ? (
          <Typography variant="body2" sx={{ fontSize: '13px' }}>
            {typeof value === 'number' ? `${value.toLocaleString()}원` : value || '-'}
          </Typography>
        ) : field === 'startDate' || field === 'completionDate' ? (
          <Typography variant="body2" sx={{ fontSize: '13px', color: value ? 'text.primary' : 'text.secondary' }}>
            {value ? formatDisplayDate(value as string) : '-'}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontSize: '13px' }}>
            {value || '-'}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
          구매/유지보수 이력
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selectedRows.length === 0} size="small">
            삭제({selectedRows.length})
          </Button>
          <Button variant="contained" onClick={handleAddHistory} size="small" sx={{ fontSize: '12px' }}>
            추가
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '& .MuiTable-root': {
            minWidth: 'auto'
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <Checkbox
                  checked={selectedRows.length === maintenanceHistories.length && maintenanceHistories.length > 0}
                  onChange={handleSelectAll}
                  color="primary"
                  size="small"
                  sx={{
                    transform: 'scale(0.7)',
                    '&.Mui-checked': {
                      color: '#1976d2'
                    }
                  }}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.type, fontWeight: 600 }}>유형</TableCell>
              <TableCell sx={{ width: columnWidths.content, fontWeight: 600 }}>내용</TableCell>
              <TableCell sx={{ width: columnWidths.vendor, fontWeight: 600 }}>업체</TableCell>
              <TableCell sx={{ width: columnWidths.amount, fontWeight: 600 }}>금액</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.completionDate, fontWeight: 600 }}>완료일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((history, index) => (
              <TableRow
                key={`history_${history.id}_${index}`}
                hover
                sx={{
                  height: cellHeight,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <Checkbox
                    checked={selectedRows.includes(history.id)}
                    onChange={() => handleSelectRow(history.id)}
                    color="primary"
                    size="small"
                    sx={{
                      transform: 'scale(0.7)',
                      '&.Mui-checked': {
                        color: '#1976d2'
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: columnWidths.no }}>{sortedMaintenanceHistories.length - startIndex - index}</TableCell>
                <TableCell sx={{ width: columnWidths.type }} onClick={() => handleCellClick(history.id, 'type')}>
                  {renderEditableCell(history, 'type', history.type, typeOptions)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.content }} onClick={() => handleCellClick(history.id, 'content')}>
                  {renderEditableCell(history, 'content', history.content)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.vendor }} onClick={() => handleCellClick(history.id, 'vendor')}>
                  {renderEditableCell(history, 'vendor', history.vendor)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.amount }} onClick={() => handleCellClick(history.id, 'amount')}>
                  {renderEditableCell(history, 'amount', history.amount)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.startDate }} onClick={() => handleCellClick(history.id, 'startDate')}>
                  {renderEditableCell(history, 'startDate', history.startDate)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.completionDate }} onClick={() => handleCellClick(history.id, 'completionDate')}>
                  {renderEditableCell(history, 'completionDate', history.completionDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 - 하단 고정 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 'auto',
          pt: 2,
          px: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          position: 'sticky',
          bottom: 0
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {maintenanceHistories.length > 0
            ? `${startIndex + 1}-${Math.min(endIndex, maintenanceHistories.length)} of ${maintenanceHistories.length}`
            : '0-0 of 0'}
        </Typography>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
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
});

PurchaseMaintenanceTab.displayName = 'PurchaseMaintenanceTab';

// 메인 SoftwareEditDialog 컴포넌트
interface SoftwareEditDialogProps {
  open: boolean;
  onClose: () => void;
  task: TaskTableData | null;
  onSave: (task: TaskTableData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: SoftwareStatus[];
  statusColors: Record<SoftwareStatus, any>;
}

const SoftwareEditDialog = memo(
  ({ open, onClose, task, onSave, assignees, assigneeAvatars, statusOptions, statusColors }: SoftwareEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('TaskEditDialog');

    // Supabase 훅 사용
    const { createSoftware, updateSoftware } = useSupabaseSoftware();

    // 세션 정보 가져오기
    const { data: session } = useSession();

    // GROUP015 소프트웨어분류 훅 사용
    const { softwareCategories, loading: categoriesLoading, error: categoriesError } = useGroup015();
    const { historyTypes, loading: historyTypesLoading, error: historyTypesError } = useGroup017();

    // Users 훅 사용
    const { users, loading: usersLoading, error: usersError } = useSupabaseUsers();

    // 현재 로그인한 사용자 정보
    const currentUser = React.useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      return users.find((u) => u.email === session.user.email);
    }, [session, users]);

    // GROUP002 상태 훅 사용
    const { statusOptions: masterStatusOptions, loading: statusLoading, error: statusError } = useGroup002();

    // GROUP016 라이센스 유형 훅 사용
    const { licenseTypes: masterLicenseTypes, loading: licenseLoading, error: licenseError } = useGroup016();

    // 소프트웨어 사용자이력 훅 사용
    const { saveUserHistories, getUserHistories } = useSupabaseSoftwareUser();
    // 소프트웨어 구매/유지보수이력 훅 사용
    const { savePurchaseHistories, getPurchaseHistories } = useSupabaseSoftwareHistory();

    // 피드백 훅
    const {
      feedbacks,
      loading: feedbackLoading,
      error: feedbackError,
      addFeedback,
      updateFeedback,
      deleteFeedback
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.SOFTWARE, task?.id?.toString());

    const [editTab, setEditTab] = useState(0);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [softwareState, dispatch] = useReducer(editSoftwareReducer, {
      softwareName: '',
      description: '',
      softwareCategory: '',
      spec: '',
      status: '대기',
      startDate: '',
      completedDate: '',
      currentUser: '',
      assignee: '',
      team: '',
      solutionProvider: '',
      userCount: 0,
      licenseType: '',
      licenseKey: '',
      registrationDate: '',
      code: ''
    });

    // 소프트웨어 분류 옵션 - GROUP015에서 동적으로 로드됨 (softwareCategories 변수는 useGroup015 훅에서 제공)

    // 라이센스 유형 옵션 (메모이제이션)
    const licenseTypes = useMemo(() => [
      '상용 라이센스', '오픈소스', '프리웨어', '셰어웨어',
      '사이트 라이센스', '볼륨 라이센스', '구독형', '임대형'
    ], []);

    // 코드 자동 생성 함수 (IT-SW-YY-NNN 형식)
    const generateSoftwareCode = useCallback(async () => {
      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2); // 연도 뒤 2자리

      try {
        // Supabase에서 현재 연도의 최대 일련번호 조회
        const { data, error } = await supabase
          .from('it_software_data')
          .select('code')
          .like('code', `IT-SW-${currentYearStr}-%`)
          .order('code', { ascending: false })
          .limit(1);

        let nextSequence = 1;

        if (data && data.length > 0 && data[0].code) {
          // 기존 코드에서 일련번호 추출 (IT-SW-25-001 -> 001)
          const lastCode = data[0].code;
          const sequencePart = lastCode.split('-')[3];
          if (sequencePart) {
            nextSequence = parseInt(sequencePart) + 1;
          }
        }

        // 일련번호를 3자리로 포맷 (001, 002, ...)
        const formattedSequence = nextSequence.toString().padStart(3, '0');

        return `IT-SW-${currentYearStr}-${formattedSequence}`;

      } catch (error) {
        console.error('❌ 코드 생성 중 오류:', error);
        // 오류 시 임시 코드 생성
        const sequence = String(Date.now()).slice(-3);
        return `IT-SW-${currentYearStr}-${sequence}`;
      }
    }, []);

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }, []);

    // Software 변경 시 상태 업데이트
    React.useEffect(() => {
      if (task) {
        dispatch({ type: 'SET_SOFTWARE', software: task });
      } else if (open) {
        // 새 Software 생성 시 자동으로 코드와 등록일 설정
        const initializeNewSoftware = async () => {
          try {
            console.log('🆕 새 소프트웨어 코드 생성 시작...');
            const newCode = await generateSoftwareCode();
            const newRegistrationDate = getCurrentDate();
            console.log('✅ 생성된 소프트웨어 코드:', newCode);
            dispatch({ type: 'INIT_NEW_SOFTWARE', code: newCode, registrationDate: newRegistrationDate });
          } catch (error) {
            console.error('❌ 소프트웨어 코드 생성 실패:', error);
            // 실패 시 임시 코드 사용
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const tempCode = `IT-SW-${currentYear}-TMP`;
            const newRegistrationDate = getCurrentDate();
            dispatch({ type: 'INIT_NEW_SOFTWARE', code: tempCode, registrationDate: newRegistrationDate });
          }
        };

        initializeNewSoftware();
      }
    }, [task, open]);

    // 새 소프트웨어 생성 시 팀과 담당자 자동 설정
    React.useEffect(() => {
      if (!task && open && currentUser) {
        // 팀과 담당자가 비어있을 때만 설정
        if (!softwareState.team && currentUser.department) {
          dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
        }
        if (!softwareState.assignee && currentUser.user_name) {
          dispatch({ type: 'SET_FIELD', field: 'assignee', value: currentUser.user_name });
        }
      }
    }, [task, open, currentUser, softwareState.team, softwareState.assignee]);

    // 성능 모니터링 로그 제거 (프로덕션 준비)
    // useEffect(() => {
    //   if (process.env.NODE_ENV === 'development' && renderCount > 1) {
    //     console.log(`🔄 TaskEditDialog 렌더링 횟수: ${renderCount}`);
    //     if (renderCount % 10 === 0) {
    //       const stats = logStats();
    //       console.log('📊 TaskEditDialog 성능 통계:', stats);
    //     }
    //   }
    // }, [renderCount, logStats]);

    // 체크리스트 상태 (계층 구조 지원)
    const [checklistItems, setChecklistItems] = useState<
      Array<{
        id: number;
        text: string;
        checked: boolean;
        parentId?: number;
        level: number;
        expanded: boolean;
        status?: string;
        dueDate?: string;
        progressRate?: number;
        assignee?: string;
      }>
    >([]);
    const [newChecklistText, setNewChecklistText] = useState('');
    const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
    const [editingChecklistText, setEditingChecklistText] = useState('');

    // 코멘트 상태 - feedbacks에서 변환
    const comments = useMemo(() => {
      return feedbacks.map((feedback) => {
        // user_name으로 사용자 찾기
        const feedbackUser = users.find((u) => u.user_name === feedback.user_name);

        return {
          id: feedback.id,
          author: feedback.user_name,
          content: feedback.description,
          timestamp: new Date(feedback.created_at).toLocaleString('ko-KR'),
          avatar: feedback.user_profile_image || feedbackUser?.profile_image_url || undefined,
          department: feedback.user_department || feedback.team || feedbackUser?.department || '',
          position: feedback.user_position || feedbackUser?.position || '',
          role: feedback.metadata?.role || feedbackUser?.role || ''
        };
      });
    }, [feedbacks, users]);

    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // 자료 상태
    const [materials, setMaterials] = useState<
      Array<{
        id: number;
        name: string;
        type: string;
        size: string;
        file?: File;
        uploadDate?: string;
      }>
    >([]);
    const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
    const [editingMaterialText, setEditingMaterialText] = useState('');

    // 사용자이력 상태 (DB 연동)
    const [currentUserHistories, setCurrentUserHistories] = useState<UserHistory[]>([]);

    // 기존 사용자이력 상태 (호환성 유지)
    const [userHistory, setUserHistory] = useState<
      Array<{
        id: number;
        userName: string;
        department: string;
        startDate: string;
        endDate: string;
        status: string;
        memo: string;
        registrationDate: string;
      }>
    >([]);
    const [editingUserHistoryId, setEditingUserHistoryId] = useState<number | null>(null);
    const [editingUserHistoryData, setEditingUserHistoryData] = useState<any>({});

    // 구매/유지보수이력 상태
    const [purchaseHistory, setPurchaseHistory] = useState<
      Array<{
        id: number;
        type: string;
        vendor: string;
        amount: string;
        contractDate: string;
        startDate: string;
        endDate: string;
        status: string;
        memo: string;
        registrationDate: string;
      }>
    >([]);
    const [editingPurchaseHistoryId, setEditingPurchaseHistoryId] = useState<number | null>(null);
    const [editingPurchaseHistoryData, setEditingPurchaseHistoryData] = useState<any>({});

    // 에러 상태
    const [validationError, setValidationError] = useState<string>('');

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditSoftwareState, value: string | number) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
      setEditTab(newValue);
    }, []);

    const handleSave = useCallback(async () => {
      // 저장 직전에 현재 입력 값들을 softwareState에 강제 반영
      const getCurrentInputValues = () => {
        if ((window as any).getOverviewTabCurrentValues) {
          return (window as any).getOverviewTabCurrentValues();
        }
        return { softwareName: softwareState.softwareName, description: softwareState.description };
      };

      const currentValues = getCurrentInputValues();

      // 필수 입력 검증
      if (!currentValues.softwareName.trim()) {
        setValidationError('소프트웨어명을 입력해주세요.');
        return;
      }

      if (!softwareState.assignee.trim()) {
        setValidationError('담당자를 선택해주세요.');
        return;
      }

      if (!softwareState.softwareCategory || !softwareState.softwareCategory.trim()) {
        setValidationError('소프트웨어분류를 선택해주세요.');
        return;
      }

      if (!softwareState.solutionProvider || !softwareState.solutionProvider.trim()) {
        setValidationError('솔루션업체를 입력해주세요.');
        return;
      }

      if (!softwareState.licenseType || !softwareState.licenseType.trim()) {
        setValidationError('라이센스유형을 선택해주세요.');
        return;
      }

      // 에러 초기화
      setValidationError('');

      try {
        console.log('💾 소프트웨어 데이터 저장 시작...');

        // Supabase에 저장할 데이터 준비
        const softwareData: Partial<SoftwareData> = {
          software_name: currentValues.softwareName?.trim() || '',
          work_content: currentValues.softwareName?.trim() || '',
          description: currentValues.description?.trim() || '',
          software_category: softwareState.softwareCategory?.trim() || '',
          spec: softwareState.spec?.trim() || '',
          status: softwareState.status || '대기',
          assignee: softwareState.assignee?.trim() || '',
          current_users: softwareState.currentUser?.trim() || '',
          solution_provider: softwareState.solutionProvider?.trim() || '',
          user_count: Number(softwareState.userCount) || 0,
          license_type: softwareState.licenseType?.trim() || '',
          license_key: softwareState.licenseKey?.trim() || '',
          start_date: softwareState.startDate ?
            (softwareState.startDate.includes('T') ? softwareState.startDate.split('T')[0] : softwareState.startDate) :
            new Date().toISOString().split('T')[0],
          completed_date: softwareState.completedDate ?
            (softwareState.completedDate.includes('T') ? softwareState.completedDate.split('T')[0] : softwareState.completedDate) :
            null,
          code: softwareState.code?.trim() || '',
          team: softwareState.team?.trim() || '',
          department: 'IT'
        };

        let savedData;

        if (!task || !task.id) {
          // 새 Software 생성
          console.log('🆕 새 소프트웨어 생성:', softwareData);
          savedData = await createSoftware(softwareData);
        } else {
          // 기존 Software 수정
          if (!task.id || task.id <= 0) {
            throw new Error('유효하지 않은 소프트웨어 ID입니다.');
          }

          console.log('🔄 소프트웨어 수정:', { id: task.id, data: softwareData });
          savedData = await updateSoftware(task.id, softwareData);
        }

        console.log('✅ Supabase 저장 성공:', savedData);

        // 사용자이력 저장 (data_relation.md 패턴 적용)
        console.log('🔍 사용자이력 저장 체크:');
        console.log('  - currentUserHistories.length:', currentUserHistories.length);
        console.log('  - currentUserHistories:', JSON.stringify(currentUserHistories, null, 2));
        console.log('  - savedData:', savedData);
        console.log('  - savedData?.id:', savedData?.id);
        console.log('  - typeof savedData?.id:', typeof savedData?.id);

        if (currentUserHistories.length > 0) {
          if (!savedData?.id) {
            console.error('❌ 소프트웨어 ID가 없어서 사용자이력을 저장할 수 없습니다.');
            console.error('  savedData 전체:', JSON.stringify(savedData, null, 2));
          } else {
            console.log('💾 사용자이력 저장 시작...', {
              softwareId: savedData.id,
              userCount: currentUserHistories.length,
              users: currentUserHistories
            });

            try {
              const userHistorySaveResult = await saveUserHistories(savedData.id, currentUserHistories);

              if (userHistorySaveResult) {
                console.log('✅ 사용자이력 저장 성공');
              } else {
                console.warn('⚠️ 사용자이력 저장 실패 - 소프트웨어 데이터는 저장됨');
              }
            } catch (saveError) {
              console.error('❌ 사용자이력 저장 중 예외 발생:', saveError);
            }
          }
        } else {
          console.log('ℹ️ 저장할 사용자이력이 없습니다.');
        }

        // 구매/유지보수이력 저장 (data_relation.md 패턴)
        console.log('🔍 구매/유지보수이력 저장 체크:');
        console.log('  - purchaseHistory.length:', purchaseHistory.length);
        console.log('  - savedData?.id:', savedData?.id);

        if (purchaseHistory.length > 0) {
          if (!savedData?.id) {
            console.error('❌ 소프트웨어 ID가 없어서 구매이력을 저장할 수 없습니다.');
          } else {
            console.log('💾 구매/유지보수이력 저장 시작...', {
              softwareId: savedData.id,
              historyCount: purchaseHistory.length,
              histories: purchaseHistory
            });

            try {
              const purchaseHistorySaveResult = await savePurchaseHistories(savedData.id, purchaseHistory);

              if (purchaseHistorySaveResult) {
                console.log('✅ 구매/유지보수이력 저장 성공');
              } else {
                console.warn('⚠️ 구매/유지보수이력 저장 실패 - 소프트웨어 데이터는 저장됨');
              }
            } catch (saveError) {
              console.error('❌ 구매/유지보수이력 저장 중 예외 발생:', saveError);
            }
          }
        } else {
          console.log('ℹ️ 저장할 구매/유지보수이력이 없습니다.');
        }

        // TaskTableData 형식으로 변환하여 부모 컴포넌트에 전달
        const resultTask: TaskTableData = {
          id: savedData.id || task?.id || Date.now(),
          no: savedData.no || Date.now(),
          workContent: currentValues.softwareName,
          assignee: softwareState.assignee,
          status: softwareState.status as any,
          code: softwareState.code,
          registrationDate: savedData.registration_date || softwareState.registrationDate,
          startDate: softwareState.startDate || new Date().toISOString().split('T')[0],
          completedDate: softwareState.completedDate,
          description: currentValues.description,
          softwareName: currentValues.softwareName,
          softwareCategory: softwareState.softwareCategory,
          spec: softwareState.spec,
          currentUser: softwareState.currentUser,
          solutionProvider: softwareState.solutionProvider,
          userCount: softwareState.userCount,
          licenseType: softwareState.licenseType,
          licenseKey: softwareState.licenseKey,
          attachments: [],
          team: '개발팀' as any,
          department: 'IT' as any
        };

        onSave(resultTask);
        onClose();

      } catch (error: any) {
        console.error('❌ 소프트웨어 저장 실패:', error);
        setValidationError(error.message || '저장 중 오류가 발생했습니다.');
      }
    }, [task, softwareState, onSave, onClose, createSoftware, updateSoftware]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setMaterials([]);
      setUserHistory([]);
      setPurchaseHistory([]);
      setPurchaseHistoryLoaded(false); // 구매이력 로드 상태 초기화
      setNewComment('');
      setNewChecklistText('');
      setValidationError(''); // 에러 상태 초기화
      onClose();
    }, [onClose]);

    // 체크리스트 핸들러들
    const handleAddChecklistItem = useCallback(() => {
      if (!newChecklistText.trim()) return;

      const newItem = {
        id: Date.now(),
        text: newChecklistText.trim(),
        checked: false,
        level: 0,
        expanded: true,
        status: '계획중',
        dueDate: '',
        progressRate: 0,
        assignee: '김철수' // 기본 담당자
      };

      setChecklistItems((prev) => [...prev, newItem]);
      setNewChecklistText('');
    }, [newChecklistText]);

    const handleEditChecklistItem = useCallback((id: number, text: string) => {
      setEditingChecklistId(id);
      setEditingChecklistText(text);
    }, []);

    const handleSaveEditChecklistItem = useCallback(() => {
      if (!editingChecklistText.trim() || editingChecklistId === null) return;

      setChecklistItems((prev) =>
        prev.map((item) => (item.id === editingChecklistId ? { ...item, text: editingChecklistText.trim() } : item))
      );

      setEditingChecklistId(null);
      setEditingChecklistText('');
    }, [editingChecklistText, editingChecklistId]);

    const handleCancelEditChecklistItem = useCallback(() => {
      setEditingChecklistId(null);
      setEditingChecklistText('');
    }, []);

    const handleDeleteChecklistItem = useCallback((id: number) => {
      setChecklistItems((prev) => {
        // 삭제할 항목과 그 하위 항목들을 모두 찾기
        const findAllChildren = (parentId: number): number[] => {
          const children = prev.filter((item) => item.parentId === parentId).map((item) => item.id);
          const allChildren = [...children];
          children.forEach((childId) => {
            allChildren.push(...findAllChildren(childId));
          });
          return allChildren;
        };

        const toDelete = [id, ...findAllChildren(id)];
        return prev.filter((item) => !toDelete.includes(item.id));
      });
    }, []);

    // 드래그 앤 드롭 핸들러들
    const handleDragStart = useCallback((e: React.DragEvent, itemId: number) => {
      e.dataTransfer.setData('text/plain', itemId.toString());
      e.dataTransfer.effectAllowed = 'move';
      setDraggedItemId(itemId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDragEnd = useCallback(() => {
      setDraggedItemId(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetId: number) => {
      e.preventDefault();
      const draggedId = parseInt(e.dataTransfer.getData('text/plain'));

      if (draggedId === targetId) return; // 자기 자신에게는 드롭 불가

      setChecklistItems((prev) => {
        // 순환 참조 방지: 드래그된 항목이 타겟의 상위인지 확인
        const isParentOf = (parentId: number, childId: number): boolean => {
          const child = prev.find((item) => item.id === childId);
          if (!child || !child.parentId) return false;
          if (child.parentId === parentId) return true;
          return isParentOf(parentId, child.parentId);
        };

        if (isParentOf(draggedId, targetId)) return prev; // 순환 참조 방지

        const target = prev.find((item) => item.id === targetId);
        if (!target) return prev;

        return prev.map((item) => {
          if (item.id === draggedId) {
            return {
              ...item,
              parentId: targetId,
              level: target.level + 1
            };
          }
          return item;
        });
      });

      // 타겟 항목을 자동으로 펼치기
      setChecklistItems((prev) => prev.map((item) => (item.id === targetId ? { ...item, expanded: true } : item)));

      // 드래그 완료 후 상태 초기화
      setDraggedItemId(null);
    }, []);

    // 접기/펼치기 핸들러
    const handleToggleExpanded = useCallback((id: number) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : item)));
    }, []);

    const handleToggleChecklistItem = useCallback((index: number) => {
      setChecklistItems((prev) => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
    }, []);

    // 체크리스트 상태 변경 핸들러
    const handleChecklistStatusChange = useCallback((id: number, status: string) => {
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                progressRate: status === '완료' ? 100 : status === '취소' ? 0 : item.progressRate
              }
            : item
        )
      );
    }, []);

    // 체크리스트 완료일 변경 핸들러
    const handleChecklistDueDateChange = useCallback((id: number, dueDate: string) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, dueDate } : item)));
    }, []);

    // 체크리스트 진척율 변경 핸들러
    const handleChecklistProgressRateChange = useCallback((id: number, progressRate: number) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, progressRate } : item)));
    }, []);

    // 코멘트 핸들러들
    const handleAddComment = useCallback(async () => {
      if (!newComment.trim() || !task?.id) return;

      const currentUserName = currentUser?.user_name || '현재 사용자';
      const currentTeam = currentUser?.department || '';
      const currentPosition = currentUser?.position || '';
      const currentProfileImage = currentUser?.profile_image_url || '';
      const currentRole = currentUser?.role || '';

      await addFeedback({
        page: PAGE_IDENTIFIERS.SOFTWARE,
        record_id: task.id.toString(),
        action_type: '기록',
        description: newComment,
        user_name: currentUserName,
        team: currentTeam,
        user_department: currentTeam,
        user_position: currentPosition,
        user_profile_image: currentProfileImage,
        metadata: { role: currentRole }
      });

      setNewComment('');
    }, [newComment, task?.id, addFeedback, currentUser]);

    const handleEditComment = useCallback((commentId: string, content: string) => {
      setEditingCommentId(commentId);
      setEditingCommentText(content);
    }, []);

    const handleSaveEditComment = useCallback(async () => {
      if (!editingCommentText.trim() || !editingCommentId) return;

      await updateFeedback(editingCommentId, {
        description: editingCommentText
      });

      setEditingCommentId(null);
      setEditingCommentText('');
    }, [editingCommentText, editingCommentId, updateFeedback]);

    const handleCancelEditComment = useCallback(() => {
      setEditingCommentId(null);
      setEditingCommentText('');
    }, []);

    const handleDeleteComment = useCallback(async (commentId: string) => {
      await deleteFeedback(commentId);
    }, [deleteFeedback]);

    // 자료 핸들러들
    const handleAddMaterial = useCallback((material: any) => {
      setMaterials((prev) => [...prev, material]);
    }, []);

    const handleEditMaterial = useCallback((materialId: number, name: string) => {
      setEditingMaterialId(materialId);
      setEditingMaterialText(name);
    }, []);

    const handleSaveEditMaterial = useCallback(() => {
      if (!editingMaterialText.trim() || !editingMaterialId) return;

      setMaterials((prev) =>
        prev.map((material) => (material.id === editingMaterialId ? { ...material, name: editingMaterialText.trim() } : material))
      );

      setEditingMaterialId(null);
      setEditingMaterialText('');
    }, [editingMaterialText, editingMaterialId]);

    const handleCancelEditMaterial = useCallback(() => {
      setEditingMaterialId(null);
      setEditingMaterialText('');
    }, []);

    const handleDeleteMaterial = useCallback((materialId: number) => {
      setMaterials((prev) => prev.filter((material) => material.id !== materialId));
    }, []);

    const handleDownloadMaterial = useCallback((material: any) => {
      if (material.file) {
        // 실제 파일 다운로드
        const url = URL.createObjectURL(material.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = material.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // 파일이 없는 경우 알림
        alert('다운로드할 파일이 없습니다.');
      }
    }, []);

    // 사용자이력 핸들러들
    const handleAddUserHistory = useCallback((userHistoryItem: any) => {
      setUserHistory((prev) => [...prev, userHistoryItem]);
    }, []);

    const handleEditUserHistory = useCallback((id: number, data: any) => {
      setEditingUserHistoryId(id);
      setEditingUserHistoryData(data);
    }, []);

    const handleSaveEditUserHistory = useCallback(() => {
      if (!editingUserHistoryData || editingUserHistoryId === null) return;

      setUserHistory((prev) => prev.map((item) => (item.id === editingUserHistoryId ? { ...item, ...editingUserHistoryData } : item)));

      setEditingUserHistoryId(null);
      setEditingUserHistoryData({});
    }, [editingUserHistoryData, editingUserHistoryId]);

    const handleCancelEditUserHistory = useCallback(() => {
      setEditingUserHistoryId(null);
      setEditingUserHistoryData({});
    }, []);

    const handleDeleteUserHistory = useCallback((id: number) => {
      setUserHistory((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const handleEditUserHistoryDataChange = useCallback((data: any) => {
      setEditingUserHistoryData(data);
    }, []);

    // 구매/유지보수이력 핸들러들
    const handleAddPurchaseHistory = useCallback((purchaseHistoryItem: any) => {
      console.log('📝 메인 컴포넌트 - 구매이력 추가:', purchaseHistoryItem);
      console.log('   추가하려는 아이템 ID:', purchaseHistoryItem.id);
      setPurchaseHistory((prev) => {
        console.log('   이전 이력:', prev.length + '개', prev);
        // ID 중복 체크
        const existingIds = prev.map(item => item.id);
        console.log('   기존 ID들:', existingIds);

        if (existingIds.includes(purchaseHistoryItem.id)) {
          console.warn('⚠️ 중복 ID 감지! ID:', purchaseHistoryItem.id);
          return prev; // 중복이면 추가하지 않음
        }

        const updated = [...prev, purchaseHistoryItem];
        console.log('   업데이트된 이력:', updated.length + '개', updated);
        return updated;
      });
    }, []);

    const handleEditPurchaseHistory = useCallback((id: number, data: any) => {
      // 직접 purchaseHistory 상태를 업데이트
      setPurchaseHistory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
    }, []);

    const handleSaveEditPurchaseHistory = useCallback(() => {
      if (!editingPurchaseHistoryData || editingPurchaseHistoryId === null) return;

      setPurchaseHistory((prev) =>
        prev.map((item) => (item.id === editingPurchaseHistoryId ? { ...item, ...editingPurchaseHistoryData } : item))
      );

      setEditingPurchaseHistoryId(null);
      setEditingPurchaseHistoryData({});
    }, [editingPurchaseHistoryData, editingPurchaseHistoryId]);

    const handleCancelEditPurchaseHistory = useCallback(() => {
      setEditingPurchaseHistoryId(null);
      setEditingPurchaseHistoryData({});
    }, []);

    const handleDeletePurchaseHistory = useCallback((id: number) => {
      setPurchaseHistory((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const handleEditPurchaseHistoryDataChange = useCallback((data: any) => {
      setEditingPurchaseHistoryData(data);
    }, []);

    // 사용자이력 변경 핸들러
    const handleUserHistoriesChange = useCallback((histories: UserHistory[]) => {
      setCurrentUserHistories(histories);
    }, []);

    // 편집 모드일 때 구매/유지보수이력 로드 (한 번만 실행)
    const [purchaseHistoryLoaded, setPurchaseHistoryLoaded] = useState(false);

    // task가 변경될 때마다 구매이력 로드 상태 초기화
    useEffect(() => {
      setPurchaseHistoryLoaded(false);
      setPurchaseHistory([]);
    }, [task?.id]);

    // 구매이력 로드
    useEffect(() => {
      if (task && task.id && task.id > 0 && !purchaseHistoryLoaded) {
        const loadPurchaseHistories = async () => {
          console.log('📖 편집 모드 - 구매/유지보수이력 로드 중...', task.id);
          setPurchaseHistoryLoaded(true);
          try {
            const histories = await getPurchaseHistories(task.id);
            if (histories && histories.length > 0) {
              console.log('✅ 구매/유지보수이력 로드 성공:', histories.length + '개');
              setPurchaseHistory(histories);
            } else {
              console.log('ℹ️ 저장된 구매/유지보수이력이 없습니다.');
              setPurchaseHistory([]);
            }
          } catch (error) {
            console.warn('⚠️ 구매/유지보수이력 로드 중 오류:', error);
            setPurchaseHistory([]);
          }
        };

        loadPurchaseHistories();
      }
    }, [task?.id, purchaseHistoryLoaded, getPurchaseHistories]);

    // 메모이제이션된 탭 컴포넌트 props
    const overviewTabProps = useMemo(
      () => ({
        softwareState,
        onFieldChange: handleFieldChange,
        users,
        usersLoading,
        usersError,
        softwareCategories,
        licenseTypes,
        statusOptions,
        statusColors,
        categoriesLoading,
        categoriesError,
        statusLoading,
        statusError,
        masterStatusOptions,
        licenseLoading,
        licenseError,
        masterLicenseTypes
      }),
      [softwareState, users, usersLoading, usersError, categoriesLoading, categoriesError, statusLoading, statusError, licenseLoading, licenseError]
    );

    const userHistoryTabProps = useMemo(
      () => ({
        softwareId: task?.id || 0,
        mode: task ? 'edit' as const : 'add' as const,
        userHistories: currentUserHistories,
        onUserHistoriesChange: handleUserHistoriesChange
      }),
      [task, currentUserHistories, handleUserHistoriesChange]
    );

    const recordTabProps = useMemo(
      () => ({
        comments,
        newComment,
        onNewCommentChange: setNewComment,
        onAddComment: handleAddComment,
        editingCommentId,
        editingCommentText,
        onEditComment: handleEditComment,
        onSaveEditComment: handleSaveEditComment,
        onCancelEditComment: handleCancelEditComment,
        onDeleteComment: handleDeleteComment,
        onEditCommentTextChange: setEditingCommentText,
        currentUserName: currentUser?.user_name,
        currentUserAvatar: currentUser?.profile_image_url,
        currentUserRole: currentUser?.role,
        currentUserDepartment: currentUser?.department
      }),
      [
        comments,
        newComment,
        editingCommentId,
        editingCommentText,
        handleAddComment,
        handleEditComment,
        handleSaveEditComment,
        handleCancelEditComment,
        handleDeleteComment,
        currentUser
      ]
    );

    const materialTabProps = useMemo(
      () => ({
        materials,
        onAddMaterial: handleAddMaterial,
        editingMaterialId,
        editingMaterialText,
        onEditMaterial: handleEditMaterial,
        onSaveEditMaterial: handleSaveEditMaterial,
        onCancelEditMaterial: handleCancelEditMaterial,
        onDeleteMaterial: handleDeleteMaterial,
        onEditMaterialTextChange: setEditingMaterialText,
        onDownloadMaterial: handleDownloadMaterial
      }),
      [
        materials,
        editingMaterialId,
        editingMaterialText,
        handleAddMaterial,
        handleEditMaterial,
        handleSaveEditMaterial,
        handleCancelEditMaterial,
        handleDeleteMaterial,
        handleDownloadMaterial
      ]
    );

    const purchaseMaintenanceTabProps = useMemo(
      () => ({
        purchaseHistory,
        historyTypes,
        onAddPurchaseHistory: handleAddPurchaseHistory,
        editingPurchaseHistoryId,
        editingPurchaseHistoryData,
        onEditPurchaseHistory: handleEditPurchaseHistory,
        onSaveEditPurchaseHistory: handleSaveEditPurchaseHistory,
        onCancelEditPurchaseHistory: handleCancelEditPurchaseHistory,
        onDeletePurchaseHistory: handleDeletePurchaseHistory,
        onEditPurchaseHistoryDataChange: handleEditPurchaseHistoryDataChange
      }),
      [
        purchaseHistory,
        historyTypes,
        editingPurchaseHistoryId,
        editingPurchaseHistoryData,
        handleAddPurchaseHistory,
        handleEditPurchaseHistory,
        handleSaveEditPurchaseHistory,
        handleCancelEditPurchaseHistory,
        handleDeletePurchaseHistory,
        handleEditPurchaseHistoryDataChange
      ]
    );

    return (
      <Dialog
        open={open}
        onClose={handleClose}
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
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 2, pt: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
              소프트웨어관리 편집
            </Typography>
            {task && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                {(task as any).softwareName || task.workContent} ({task.code})
              </Typography>
            )}
          </Box>

          {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button onClick={handleClose} variant="outlined" size="small" sx={{ minWidth: '60px' }}>
              취소
            </Button>
            <Button onClick={handleSave} variant="contained" size="small" sx={{ minWidth: '60px' }}>
              저장
            </Button>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, backgroundColor: 'background.paper' }}>
          <Tabs value={editTab} onChange={handleTabChange}>
            <Tab label="개요" />
            <Tab label="사용자이력" />
            <Tab label="구매/유지보수이력" />
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {editTab === 0 && <OverviewTab {...overviewTabProps} />}
          {editTab === 1 && <UserHistoryTab {...userHistoryTabProps} />}
          {editTab === 2 && <PurchaseMaintenanceTab {...purchaseMaintenanceTabProps} />}
          {editTab === 3 && <RecordTab {...recordTabProps} />}
          {editTab === 4 && <MaterialTab {...materialTabProps} />}
        </DialogContent>

        {/* 에러 메시지 표시 */}
        {validationError && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="error" sx={{ mt: 1 }}>
              {validationError}
            </Alert>
          </Box>
        )}
      </Dialog>
    );
  }
);

SoftwareEditDialog.displayName = 'SoftwareEditDialog';

export default SoftwareEditDialog;
