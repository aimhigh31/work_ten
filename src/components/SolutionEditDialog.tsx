import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef } from 'react';
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
  Pagination
} from '@mui/material';
import { SolutionTableData, SolutionStatus, DbSolutionData } from '../types/solution';
import { useOptimizedInput } from '../hooks/useDebounce';
import { useSupabaseSolution } from '../hooks/useSupabaseSolution';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';
// import { usePerformanceMonitor } from '../utils/performance';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface EditSolutionState {
  title: string;
  detailContent: string;
  assignee: string;
  status: SolutionStatus;
  code: string;
  registrationDate: string;
  startDate: string;
  completedDate: string;
  team: string;
  solutionType: string;
  developmentType: string;
  progress: number;
}

type EditSolutionAction =
  | { type: 'SET_FIELD'; field: keyof EditSolutionState; value: string }
  | { type: 'SET_TASK'; solution: SolutionTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; code: string; registrationDate: string };

const editSolutionReducer = (state: EditSolutionState, action: EditSolutionAction): EditSolutionState => {
  switch (action.type) {
    case 'SET_FIELD':
      // progress 필드는 숫자로 변환
      if (action.field === 'progress') {
        return { ...state, [action.field]: Number(action.value) || 0 };
      }
      return { ...state, [action.field]: action.value };
    case 'SET_TASK':
      return {
        title: action.solution.title || '',
        detailContent: action.solution.detailContent || '',
        assignee: action.solution.assignee,
        status: action.solution.status,
        code: action.solution.code,
        registrationDate: action.solution.registrationDate || '',
        startDate: action.solution.startDate || '',
        completedDate: action.solution.completedDate || '',
        team: action.solution.team || '',
        solutionType: action.solution.solutionType || '웹개발',
        developmentType: action.solution.developmentType || '신규개발',
        progress: action.solution.progress || 0
      };
    case 'INIT_NEW_TASK':
      return {
        title: '',
        detailContent: '',
        assignee: '',
        status: '대기',
        code: action.code,
        registrationDate: action.registrationDate,
        startDate: action.registrationDate,
        completedDate: '',
        team: '',
        solutionType: '',
        developmentType: '',
        progress: 0
      };
    case 'RESET':
      return {
        title: '',
        detailContent: '',
        progress: 0,
        assignee: '',
        status: '대기',
        code: '',
        registrationDate: '',
        startDate: '',
        completedDate: '',
        team: '',
        solutionType: '',
        developmentType: ''
      };
    default:
      return state;
  }
};

// 개요 탭 컴포넌트
const OverviewTab = memo(
  ({
    solutionState,
    onFieldChange,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors
  }: {
    solutionState: EditSolutionState;
    onFieldChange: (field: keyof EditSolutionState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: SolutionStatus[];
    statusColors: Record<SolutionStatus, any>;
  }) => {
    // TextField 직접 참조를 위한 ref
    const workContentRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // ✅ 공용 창고에서 마스터코드, 부서, 사용자 데이터 가져오기
    const { masterCodes, departments, users } = useCommonData();

    console.log('🔍 [SolutionEditDialog OverviewTab] masterCodes:', masterCodes?.length);
    console.log('🔍 [SolutionEditDialog OverviewTab] departments:', departments?.length);
    console.log('🔍 [SolutionEditDialog OverviewTab] users:', users?.length);

    // 마스터코드에서 서브코드 가져오기 함수
    const getSubCodesByGroup = React.useCallback((groupCode: string) => {
      if (!masterCodes || masterCodes.length === 0) {
        console.log(`⚠️ [SolutionEditDialog] masterCodes가 아직 로드되지 않음`);
        return [];
      }
      const subCodes = masterCodes
        .filter(code => code.group_code === groupCode && code.is_active)
        .filter(code => code.subcode && code.subcode_name); // 빈 값 필터링
      console.log(`🔍 [SolutionEditDialog] ${groupCode} 필터링 결과:`, subCodes.length, '개', subCodes);
      return subCodes;
    }, [masterCodes]);

    // GROUP021 솔루션유형, GROUP022 개발유형, GROUP002 상태 조회
    const solutionTypeOptions = getSubCodesByGroup('GROUP021');
    const developmentTypeOptions = getSubCodesByGroup('GROUP022');
    const masterCodeStatusOptions = getSubCodesByGroup('GROUP002');

    // 텍스트 필드용 최적화된 입력 관리
    const titleInput = useOptimizedInput(solutionState.title, 150);
    const detailContentInput = useOptimizedInput(solutionState.detailContent, 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림 (onFieldChange 의존성 제거로 최적화)
    useEffect(() => {
      if (!isUpdatingRef.current && titleInput.debouncedValue !== solutionState.title) {
        onFieldChange('title', titleInput.debouncedValue);
      }
    }, [titleInput.debouncedValue, solutionState.title]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && detailContentInput.debouncedValue !== solutionState.detailContent) {
        onFieldChange('detailContent', detailContentInput.debouncedValue);
      }
    }, [detailContentInput.debouncedValue, solutionState.detailContent]); // onFieldChange 제거

    // 외부에서 상태가 변경될 때 입력 값 동기화 (reset 함수 의존성 제거로 최적화)
    useEffect(() => {
      if (solutionState.title !== titleInput.inputValue && solutionState.title !== titleInput.debouncedValue) {
        isUpdatingRef.current = true;
        titleInput.reset(solutionState.title);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [solutionState.title, titleInput.inputValue, titleInput.debouncedValue]); // reset 제거

    useEffect(() => {
      if (
        solutionState.detailContent !== detailContentInput.inputValue &&
        solutionState.detailContent !== detailContentInput.debouncedValue
      ) {
        isUpdatingRef.current = true;
        detailContentInput.reset(solutionState.detailContent);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [solutionState.detailContent, detailContentInput.inputValue, detailContentInput.debouncedValue]); // reset 제거

    const handleFieldChange = useCallback(
      (field: keyof EditSolutionState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
          onFieldChange(field, e.target.value);
        },
      []
    ); // onFieldChange 의존성 제거로 최적화

    // 현재 입력 값들을 반환하는 함수 (의존성 배열 제거로 최적화)
    const getCurrentValues = useCallback(() => {
      return {
        title: workContentRef.current?.value || titleInput.inputValue,
        detailContent: descriptionRef.current?.value || detailContentInput.inputValue
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
          {/* 제목 - 전체 너비 */}
          <TextField
            fullWidth
            label={
              <span>
                제목 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={titleInput.inputValue}
            onChange={(e) => titleInput.handleChange(e.target.value)}
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
            value={detailContentInput.inputValue}
            onChange={(e) => detailContentInput.handleChange(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputRef={descriptionRef}
          />

          {/* 솔루션유형, 개발유형 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  솔루션유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select value={solutionState.solutionType} label="솔루션유형 *" onChange={handleFieldChange('solutionType')} displayEmpty>
                <MenuItem value="">선택</MenuItem>
                {solutionTypeOptions.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  개발유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select value={solutionState.developmentType} label="개발유형 *" onChange={handleFieldChange('developmentType')} displayEmpty>
                <MenuItem value="">선택</MenuItem>
                {developmentTypeOptions.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* 진행율, 상태 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="진행율 (%)"
              type="number"
              value={solutionState.progress || 0}
              onChange={(e) => onFieldChange('progress', String(Number(e.target.value) || 0))}
              InputProps={{
                inputProps: { min: 0, max: 100 }
              }}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={solutionState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                renderValue={(value) => {
                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case '대기':
                        return {
                          backgroundColor: '#F5F5F5 !important',
                          color: '#757575 !important',
                          '& .MuiChip-label': { color: '#757575' }
                        };
                      case '진행중':
                      case '진행':
                        return {
                          backgroundColor: '#E3F2FD !important',
                          color: '#1976D2 !important',
                          '& .MuiChip-label': { color: '#1976D2' }
                        };
                      case '완료':
                        return {
                          backgroundColor: '#E8F5E9 !important',
                          color: '#388E3C !important',
                          '& .MuiChip-label': { color: '#388E3C' }
                        };
                      case '보류':
                      case '홀딩':
                      case '취소':
                        return {
                          backgroundColor: '#FFEBEE !important',
                          color: '#D32F2F !important',
                          '& .MuiChip-label': { color: '#D32F2F' }
                        };
                      default:
                        return {
                          backgroundColor: '#F5F5F5 !important',
                          color: '#757575 !important',
                          '& .MuiChip-label': { color: '#757575' }
                        };
                    }
                  };
                  return (
                    <Chip
                      label={value}
                      size="small"
                      sx={{
                        ...getStatusStyle(value),
                        fontSize: '13px',
                        fontWeight: 400
                      }}
                    />
                  );
                }}
              >
                {masterCodeStatusOptions.map((option) => {
                  const getStatusColor = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                      case '진행중':
                      case '진행':
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
                      case '보류':
                      case '홀딩':
                      case '취소':
                        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
                      default:
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                    }
                  };
                  return (
                    <MenuItem key={option.subcode} value={option.subcode_name}>
                      <Chip
                        label={option.subcode_name}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(option.subcode_name).bgcolor,
                          color: getStatusColor(option.subcode_name).color,
                          fontSize: '13px',
                          fontWeight: 400
                        }}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          {/* 시작일과 완료일 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label={
                <span>
                  시작일 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="date"
              value={solutionState.startDate || solutionState.registrationDate}
              onChange={handleFieldChange('startDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label={
                <span>
                  완료일 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="date"
              value={solutionState.completedDate}
              onChange={handleFieldChange('completedDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Stack>

          {/* 팀과 담당자 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>팀</InputLabel>
              <Select
                value={solutionState.team}
                label="팀"
                onChange={handleFieldChange('team')}
                disabled={true}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0'
                  },
                  backgroundColor: '#f5f5f5',
                  '& .MuiSelect-select': {
                    color: '#666666',
                    WebkitTextFillColor: '#666666'
                  },
                  '&.Mui-disabled .MuiSelect-select': {
                    color: '#666666',
                    WebkitTextFillColor: '#666666'
                  }
                }}
              >
                {departments
                  .filter((dept) => dept.is_active) // 활성 부서만 표시
                  .map((dept) => (
                    <MenuItem key={dept.id} value={dept.department_name}>
                      {dept.department_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  담당자 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={solutionState.assignee}
                label="담당자 *"
                onChange={handleFieldChange('assignee')}
                disabled={true}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0'
                  },
                  backgroundColor: '#f5f5f5',
                  '& .MuiSelect-select': {
                    color: '#666666',
                    WebkitTextFillColor: '#666666'
                  },
                  '&.Mui-disabled .MuiSelect-select': {
                    color: '#666666',
                    WebkitTextFillColor: '#666666'
                  }
                }}
                renderValue={(value) => {
                  console.log('🔍 [솔루션 담당자 프로필] assignee:', value);
                  console.log('🔍 [솔루션 담당자 프로필] users 개수:', users?.length);
                  const user = users.find((u) => u.user_name === value);
                  console.log('🔍 [솔루션 담당자 프로필] 찾은 user:', user ? {
                    user_name: user.user_name,
                    profile_image_url: user.profile_image_url,
                    avatar_url: user.avatar_url
                  } : '없음');
                  if (!user) return value;
                  return (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={user.profile_image_url || user.avatar_url} alt={user.user_name} sx={{ width: 20, height: 20 }}>
                        {user.user_name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1" sx={{ color: '#666666' }}>
                        {user.user_name}
                      </Typography>
                    </Stack>
                  );
                }}
              >
                {users
                  .filter((user) => user.is_active && user.status === 'active') // 활성 사용자만 표시
                  .map((user) => (
                    <MenuItem key={user.id} value={user.user_name}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={user.profile_image_url || user.avatar_url} alt={user.user_name} sx={{ width: 20, height: 20 }}>
                          {user.user_name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{user.user_name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>

          {/* 등록일과 코드 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={solutionState.registrationDate}
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
              value={solutionState.code}
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
            {comments.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, comments.length)} of ${comments.length}` : '0-0 of 0'}
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
  } = useSupabaseFiles(PAGE_IDENTIFIERS.SOLUTION, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 솔루션을 저장해주세요.');
        return;
      }

      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const uploadPromises = Array.from(fileList).map(async (file) => {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.SOLUTION,
          record_id: String(recordId),
          // user_id는 UUID 타입이므로 숫자형 ID는 전달하지 않음
          user_id: undefined,
          user_name: currentUser?.user_name || '알 수 없음',
          team: currentUser?.department
        });

        if (!result.success) {
          alert(`파일 업로드 실패: ${result.error}`);
        }
      });

      await Promise.all(uploadPromises);

      // 파일 입력 초기화
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
      alert('파일을 업로드하려면 먼저 솔루션을 저장해주세요.');
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

// 메인 SolutionEditDialog 컴포넌트
interface SolutionEditDialogProps {
  open: boolean;
  onClose: () => void;
  solution: SolutionTableData | null;
  onSave: (solution: SolutionTableData) => Promise<void> | void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: SolutionStatus[];
  statusColors: Record<SolutionStatus, any>;
}

const SolutionEditDialog = memo(
  ({ open, onClose, solution, onSave, assignees, assigneeAvatars, statusOptions, statusColors }: SolutionEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('SolutionEditDialog');

    // 세션 정보
    const { data: session } = useSession();

    // ✅ 공용 창고에서 사용자 데이터 가져오기
    const { users } = useCommonData();

    console.log('🔍 [SolutionEditDialog] users:', users?.length);

    // 현재 로그인한 사용자 정보
    const currentUser = useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      const found = users.find((u) => u.email === session.user.email);
      console.log('🔍 [SolutionEditDialog] currentUser:', found ? found.user_name : '없음');
      return found;
    }, [session, users]);

    // DB 연동 훅
    const { getSolutionById, convertToSolutionData, convertToDbSolutionData } = useSupabaseSolution();

    // 피드백 훅
    const {
      feedbacks,
      loading: feedbackLoading,
      error: feedbackError,
      addFeedback,
      updateFeedback,
      deleteFeedback
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.SOLUTION, solution?.id?.toString());

    // 🔄 임시 저장: 로컬 state로 기록 관리
    const [pendingFeedbacks, setPendingFeedbacks] = useState<FeedbackData[]>([]);
    const [initialFeedbacks, setInitialFeedbacks] = useState<FeedbackData[]>([]);

    // 초기화 여부를 추적 (무한 루프 방지)
    const feedbacksInitializedRef = useRef(false);
    const feedbacksRef = useRef<FeedbackData[]>([]);

    const [editTab, setEditTab] = useState(0);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [solutionState, dispatch] = useReducer(editSolutionReducer, {
      title: '',
      detailContent: '',
      assignee: '',
      status: '대기',
      code: '',
      registrationDate: '',
      startDate: '',
      completedDate: '',
      team: '',
      solutionType: '',
      developmentType: '',
      progress: 0
    });

    // 코드 자동 생성 함수 - IT-SOL-25-001 형식
    const generateSolutionCode = useCallback(() => {
      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2); // 연도 뒤 2자리

      // 현재 연도의 Solution 개수를 기반으로 순번 생성 (실제 구현에서는 서버에서 처리)
      // 여기서는 간단히 현재 시간을 기반으로 순번 생성
      const sequence = String(Date.now()).slice(-3).padStart(3, '0');

      return `IT-SOL-${currentYearStr}-${sequence}`;
    }, []);

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }, []);

    // Solution 변경 시 상태 업데이트
    React.useEffect(() => {
      if (solution) {
        dispatch({ type: 'SET_TASK', solution });
      } else if (open) {
        // 새 Solution 생성 시 자동으로 코드와 등록일 설정
        const newCode = generateSolutionCode();
        const newRegistrationDate = getCurrentDate();
        dispatch({ type: 'INIT_NEW_TASK', code: newCode, registrationDate: newRegistrationDate });

        // 로그인한 사용자 정보로 팀과 담당자 자동 설정
        if (currentUser) {
          dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department || '' });
          dispatch({ type: 'SET_FIELD', field: 'assignee', value: currentUser.user_name || '' });
        }
      }
    }, [solution, open, generateSolutionCode, getCurrentDate, currentUser]);

    // 성능 모니터링 로그 제거 (프로덕션 준비)
    // useEffect(() => {
    //   if (process.env.NODE_ENV === 'development' && renderCount > 1) {
    //     console.log(`🔄 SolutionEditDialog 렌더링 횟수: ${renderCount}`);
    //     if (renderCount % 10 === 0) {
    //       const stats = logStats();
    //       console.log('📊 SolutionEditDialog 성능 통계:', stats);
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

    // feedbacks를 ref에 저장 (dependency 문제 방지)
    useEffect(() => {
      feedbacksRef.current = feedbacks;
    }, [feedbacks]);

    // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
    useEffect(() => {
      if (open && solution?.id && !feedbacksInitializedRef.current) {
        // feedbacks 데이터가 로드될 때까지 기다렸다가 초기화
        if (feedbacks.length > 0) {
          setPendingFeedbacks(feedbacks);
          setInitialFeedbacks(feedbacks);
          feedbacksInitializedRef.current = true;
          console.log('✅ 솔루션관리 기록 초기화:', feedbacks.length, '개');
        }
      }

      // 다이얼로그 닫힐 때 초기화 플래그 리셋
      if (!open) {
        feedbacksInitializedRef.current = false;
        setPendingFeedbacks([]);
        setInitialFeedbacks([]);
      }
    }, [open, solution?.id, feedbacks]);

    // 코멘트 상태 - pendingFeedbacks에서 변환
    const comments = useMemo(() => {
      return pendingFeedbacks.map((feedback) => {
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
    }, [pendingFeedbacks, users]);

    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // 에러 상태
    const [validationError, setValidationError] = useState<string>('');

    // Solution 변경 시 상태 업데이트
    React.useEffect(() => {
      if (solution) {
        dispatch({ type: 'SET_TASK', solution });
      }
    }, [solution]);

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditSolutionState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
      setEditTab(newValue);
    }, []);

    const handleSave = useCallback(async () => {
      // 필수 입력 검증
      if (!solutionState.title || !solutionState.title.trim()) {
        setValidationError('제목은 필수 입력 항목입니다.');
        return;
      }

      if (!solutionState.solutionType || !solutionState.solutionType.trim()) {
        setValidationError('솔루션유형을 선택해주세요.');
        return;
      }

      if (!solutionState.developmentType || !solutionState.developmentType.trim()) {
        setValidationError('개발유형을 선택해주세요.');
        return;
      }

      const startDate = (solutionState as any).startDate || solutionState.registrationDate;
      if (!startDate || !startDate.trim()) {
        setValidationError('시작일을 입력해주세요.');
        return;
      }

      if (!solutionState.completedDate || !solutionState.completedDate.trim()) {
        setValidationError('완료일을 입력해주세요.');
        return;
      }

      // 에러 초기화
      setValidationError('');

      // 🔄 기록 탭 변경사항 DB 저장
      console.log('💾 기록 탭 변경사항 저장 시작');
      console.time('⏱️ 기록 저장 Total');

      if (solution?.id) {
        // 추가된 기록 (temp- ID)
        const addedFeedbacks = pendingFeedbacks.filter(
          (fb) => fb.id.toString().startsWith('temp-') && !initialFeedbacks.find((initial) => initial.id === fb.id)
        );

        // 수정된 기록
        const updatedFeedbacks = pendingFeedbacks.filter((fb) => {
          if (fb.id.toString().startsWith('temp-')) return false;
          const initial = initialFeedbacks.find((initial) => initial.id === fb.id);
          return initial && initial.description !== fb.description;
        });

        // 삭제된 기록
        const deletedFeedbacks = initialFeedbacks.filter((initial) => !pendingFeedbacks.find((pending) => pending.id === initial.id));

        // 추가 (역순으로 저장)
        const reversedAddedFeedbacks = [...addedFeedbacks].reverse();
        for (const feedback of reversedAddedFeedbacks) {
          const { id, created_at, user_id, ...feedbackData } = feedback;
          await addFeedback(feedbackData);
        }

        // 수정
        for (const feedback of updatedFeedbacks) {
          await updateFeedback(String(feedback.id), {
            description: feedback.description
          });
        }

        // 삭제 - feedbacks 배열에 존재하는 항목만 삭제
        for (const feedback of deletedFeedbacks) {
          const existsInFeedbacks = feedbacks.some((fb) => String(fb.id) === String(feedback.id));
          if (existsInFeedbacks) {
            await deleteFeedback(String(feedback.id));
          } else {
            console.warn(`⚠️ 피드백 ${feedback.id}가 feedbacks 배열에 없어 삭제 건너뜀 (이미 삭제됨)`);
          }
        }

        console.timeEnd('⏱️ 기록 저장 Total');
        console.log('✅ 기록 탭 변경사항 저장 완료');
      }

      // 약간의 지연을 두고 저장 (상태 업데이트 완료 대기)
      setTimeout(async () => {
        if (!solution) {
          // 새 Solution 생성
          const newSolution: SolutionTableData = {
            id: Date.now(),
            no: 0, // createSolution에서 자동 생성
            title: solutionState.title,
            detailContent: solutionState.detailContent,
            assignee: solutionState.assignee,
            status: solutionState.status,
            code: solutionState.code,
            registrationDate: solutionState.registrationDate,
            startDate: solutionState.startDate || new Date().toISOString().split('T')[0], // 사용자가 입력한 시작일 또는 오늘 날짜
            completedDate: solutionState.completedDate,
            solutionType: solutionState.solutionType,
            developmentType: solutionState.developmentType,
            team: solutionState.team,
            progress: solutionState.progress,
            attachments: []
          } as any;

          console.log('🚀 새 Solution 생성 중:', newSolution);
          onSave(newSolution);
        } else {
          // 기존 Solution 수정
          const updatedSolution: SolutionTableData = {
            ...solution,
            title: solutionState.title,
            detailContent: solutionState.detailContent,
            assignee: solutionState.assignee,
            status: solutionState.status,
            startDate: solutionState.startDate || solution.startDate || new Date().toISOString().split('T')[0], // 수정된 시작일 사용
            completedDate: solutionState.completedDate,
            solutionType: solutionState.solutionType,
            developmentType: solutionState.developmentType,
            team: solutionState.team,
            code: solutionState.code,
            registrationDate: solutionState.registrationDate,
            progress: solutionState.progress
          } as any;

          console.log('📝 기존 Solution 수정 중:', updatedSolution);
          onSave(updatedSolution);
        }
        onClose();
      }, 50); // 50ms 지연
    }, [
      solution,
      solutionState,
      onSave,
      onClose,
      dispatch,
      pendingFeedbacks,
      initialFeedbacks,
      feedbacks,
      addFeedback,
      updateFeedback,
      deleteFeedback
    ]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setNewComment('');
      setNewChecklistText('');
      setValidationError(''); // 에러 상태 초기화
      // 🔄 기록 탭 임시 데이터 초기화
      setPendingFeedbacks([]);
      setInitialFeedbacks([]);
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
        status: '대기',
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

    // 🔄 기록탭 핸들러 함수들 - 로컬 state만 변경 (임시 저장)
    const handleAddComment = useCallback(() => {
      if (!newComment.trim() || !solution?.id) return;

      const currentUserName = currentUser?.user_name || '현재 사용자';
      const currentTeam = currentUser?.department || '';
      const currentPosition = currentUser?.position || '';
      const currentProfileImage = currentUser?.profile_image_url || '';
      const currentRole = currentUser?.role || '';

      // 로컬 임시 ID 생성
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newFeedback: FeedbackData = {
        id: tempId,
        page: PAGE_IDENTIFIERS.SOLUTION,
        record_id: solution.id.toString(),
        action_type: '기록',
        description: newComment,
        user_name: currentUserName,
        team: currentTeam,
        created_at: new Date().toISOString(),
        metadata: { role: currentRole },
        user_department: currentTeam,
        user_position: currentPosition,
        user_profile_image: currentProfileImage
      };

      // 로컬 state에만 추가 (즉시 반응)
      setPendingFeedbacks((prev) => [newFeedback, ...prev]);
      setNewComment('');
    }, [newComment, solution?.id, currentUser]);

    const handleEditComment = useCallback((commentId: string, content: string) => {
      setEditingCommentId(commentId);
      setEditingCommentText(content);
    }, []);

    const handleSaveEditComment = useCallback(() => {
      if (!editingCommentText.trim() || !editingCommentId) return;

      // 로컬 state만 업데이트 (즉시 반응)
      setPendingFeedbacks((prev) => prev.map((fb) => (fb.id === editingCommentId ? { ...fb, description: editingCommentText } : fb)));

      setEditingCommentId(null);
      setEditingCommentText('');
    }, [editingCommentText, editingCommentId]);

    const handleCancelEditComment = useCallback(() => {
      setEditingCommentId(null);
      setEditingCommentText('');
    }, []);

    const handleDeleteComment = useCallback((commentId: string) => {
      // 로컬 state에서만 제거 (즉시 반응)
      setPendingFeedbacks((prev) => prev.filter((fb) => fb.id !== commentId));
    }, []);

    // 메모이제이션된 탭 컴포넌트 props
    const overviewTabProps = useMemo(
      () => ({
        solutionState,
        onFieldChange: handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors
      }),
      [solutionState, handleFieldChange, assignees, assigneeAvatars, statusOptions, statusColors]
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
              솔루션관리 편집
            </Typography>
            {solution && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                {solution.title || solution.detailContent} ({solution.code})
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
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {editTab === 0 && <OverviewTab {...overviewTabProps} />}
          {editTab === 1 && <RecordTab {...recordTabProps} />}
          {editTab === 2 && <MaterialTab recordId={solution?.id} currentUser={currentUser} />}
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

SolutionEditDialog.displayName = 'SolutionEditDialog';

export default SolutionEditDialog;
