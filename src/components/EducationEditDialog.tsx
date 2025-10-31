import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
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
import { EducationData, Education_STATUS, Education_TYPES, Education_CHANNELS, Education_PRIORITIES } from '../types/education';
import { useOptimizedInput } from '../hooks/useDebounce';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';
// import { usePerformanceMonitor } from '../utils/performance';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface EditEducationState {
  customerName: string;
  companyName: string;
  educationType: string;
  channel: string;
  title: string;
  content: string;
  responseContent: string;
  assignee: string;
  status: string;
  priority: string;
  registrationDate: string;
  receptionDate: string;
  resolutionDate: string;
  team: string;
}

type EditEducationAction =
  | { type: 'SET_FIELD'; field: keyof EditEducationState; value: string }
  | { type: 'SET_TASK'; education: EducationData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; registrationDate: string };

const editEducationReducer = (state: EditEducationState, action: EditEducationAction): EditEducationState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_TASK':
      return {
        customerName: action.education.customerName || '',
        companyName: action.education.companyName || '',
        educationType: action.education.educationType || '문의',
        channel: action.education.channel || '전화',
        title: action.education.title || '',
        content: action.education.content || '',
        responseContent: action.education.responseContent || '',
        assignee: action.education.assignee || '',
        status: action.education.status || '접수',
        priority: action.education.priority || '보통',
        registrationDate: action.education.registrationDate || '',
        receptionDate: action.education.receptionDate || '',
        resolutionDate: action.education.resolutionDate || '',
        team: action.education.team || ''
      };
    case 'INIT_NEW_TASK':
      return {
        customerName: '',
        companyName: '',
        educationType: '',
        channel: '전화',
        title: '',
        content: '',
        responseContent: '',
        assignee: '',
        status: '진행',
        priority: '',
        registrationDate: action.registrationDate,
        receptionDate: action.registrationDate,
        resolutionDate: '',
        team: ''
      };
    case 'RESET':
      return {
        customerName: '',
        companyName: '',
        educationType: '',
        channel: '전화',
        title: '',
        content: '',
        responseContent: '',
        assignee: '',
        status: '진행',
        priority: '',
        registrationDate: '',
        receptionDate: '',
        resolutionDate: '',
        team: ''
      };
    default:
      return state;
  }
};

// 개요 탭 컴포넌트
const OverviewTab = memo(
  ({
    educationState,
    onFieldChange,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors,
    education
  }: {
    educationState: EditEducationState;
    onFieldChange: (field: keyof EditEducationState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: string[];
    statusColors: Record<string, any>;
    education: EducationData | null;
  }) => {
    // TextField 직접 참조를 위한 ref
    const requestContentRef = useRef<HTMLInputElement>(null);
    const actionContentRef = useRef<HTMLTextAreaElement>(null);

    // CommonData 훅 사용 (캐싱된 데이터)
    const { masterCodes, users } = useCommonData();

    // Supabase 클라이언트 생성 (DB 직접 조회용)
    const supabaseClient = React.useMemo(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }, []);

    // DB 직접 조회 상태
    const [educationFieldsFromDB, setEducationFieldsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [educationTypesFromDB, setEducationTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog 열릴 때마다 DB에서 직접 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        // GROUP029: 교육분야
        const { data: group029Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP029')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group029Data) {
          setEducationFieldsFromDB(group029Data);
          console.log('✅ [EducationOverviewTab] GROUP029 교육분야 DB 조회 완료:', group029Data.length, '개');
        }

        // GROUP008: 교육유형
        const { data: group008Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP008')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group008Data) {
          setEducationTypesFromDB(group008Data);
          console.log('✅ [EducationOverviewTab] GROUP008 교육유형 DB 조회 완료:', group008Data.length, '개');
        }

        // GROUP002: 상태
        const { data: group002Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP002')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group002Data) {
          setStatusTypesFromDB(group002Data);
          console.log('✅ [EducationOverviewTab] GROUP002 상태 DB 조회 완료:', group002Data.length, '개');
        }
      };

      fetchMasterCodeData();
    }, [supabaseClient]);

    // 커스텀 getSubCodesByGroup 함수 (빈 값 필터링 포함) - 우선순위용으로 유지
    const getSubCodesByGroup = useCallback((groupCode: string) => {
      if (!masterCodes || masterCodes.length === 0) {
        console.log(`⚠️ [개인교육관리 OverviewTab] masterCodes가 아직 로드되지 않음`);
        return [];
      }
      const subCodes = masterCodes
        .filter(code => code.group_code === groupCode && code.is_active)
        .filter(code => code.subcode && code.subcode_name); // 빈 값 필터링
      console.log(`✅ [개인교육관리 OverviewTab] ${groupCode} 서브코드:`, subCodes.length, '개');
      return subCodes;
    }, [masterCodes]);

    // GROUP024의 서브코드 목록 가져오기 (우선순위)
    const priorityOptions = getSubCodesByGroup('GROUP024').map((subCode) => ({
      value: subCode.subcode_name,
      label: subCode.subcode_name,
      description: subCode.subcode_description
    }));

    // 사용자 목록 옵션 생성 (담당자)
    const userOptions = users
      .filter((user) => user.is_active && user.status === 'active')
      .map((user) => {
        const avatarUrl = user.profile_image_url || user.avatar_url || '';
        console.log(`👤 [개인교육관리 OverviewTab] 사용자 ${user.user_name} 프로필 이미지:`, {
          profile_image_url: user.profile_image_url,
          avatar_url: user.avatar_url,
          selected: avatarUrl
        });
        return {
          value: user.user_name,
          label: user.user_name,
          department: user.department || '',
          avatar: avatarUrl
        };
      });

    // 텍스트 필드용 최적화된 입력 관리
    const contentInput = useOptimizedInput(educationState.content, 150);
    const responseContentInput = useOptimizedInput(educationState.responseContent, 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림 (onFieldChange 의존성 제거로 최적화)
    useEffect(() => {
      if (!isUpdatingRef.current && contentInput.debouncedValue !== educationState.content) {
        onFieldChange('content', contentInput.debouncedValue);
      }
    }, [contentInput.debouncedValue, educationState.content]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && responseContentInput.debouncedValue !== educationState.responseContent) {
        onFieldChange('responseContent', responseContentInput.debouncedValue);
      }
    }, [responseContentInput.debouncedValue, educationState.responseContent]); // onFieldChange 제거

    // 외부에서 상태가 변경될 때 입력 값 동기화 (reset 함수 의존성 제거로 최적화)
    useEffect(() => {
      if (educationState.content !== contentInput.inputValue && educationState.content !== contentInput.debouncedValue) {
        isUpdatingRef.current = true;
        contentInput.reset(educationState.content);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [educationState.content, contentInput.inputValue, contentInput.debouncedValue]); // reset 제거

    useEffect(() => {
      if (
        educationState.responseContent !== responseContentInput.inputValue &&
        educationState.responseContent !== responseContentInput.debouncedValue
      ) {
        isUpdatingRef.current = true;
        responseContentInput.reset(educationState.responseContent);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [educationState.responseContent, responseContentInput.inputValue, responseContentInput.debouncedValue]); // reset 제거

    const handleFieldChange = useCallback(
      (field: keyof EditEducationState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
          onFieldChange(field, e.target.value);
        },
      []
    ); // onFieldChange 의존성 제거로 최적화

    // 현재 입력 값들을 반환하는 함수 (의존성 배열 제거로 최적화)
    const getCurrentValues = useCallback(() => {
      return {
        content: requestContentRef.current?.value || contentInput.inputValue,
        responseContent: actionContentRef.current?.value || responseContentInput.inputValue
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
          {/* 첫 번째 섹션: 제목 */}
          <TextField
            fullWidth
            label={
              <span>
                제목 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={educationState.title}
            onChange={handleFieldChange('title')}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          {/* 두 번째 섹션: 설명 */}
          <TextField
            fullWidth
            label="설명"
            multiline
            rows={4}
            value={contentInput.inputValue}
            onChange={(e) => contentInput.handleChange(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputRef={requestContentRef}
          />

          {/* 세 번째 줄: 교육분야 - 교육유형 - 상태 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  교육분야 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={educationState.customerName}
                label="교육분야 *"
                onChange={handleFieldChange('customerName')}
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';
                  const item = educationFieldsFromDB.find(f => f.subcode === selected);
                  return item ? item.subcode_name : selected;
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {educationFieldsFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  교육유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={educationState.educationType}
                label="교육유형 *"
                onChange={handleFieldChange('educationType')}
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';
                  const item = educationTypesFromDB.find(t => t.subcode === selected);
                  return item ? item.subcode_name : selected;
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {educationTypesFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={educationState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                notched
                renderValue={(selected) => {
                  if (!selected) return '';
                  const item = statusTypesFromDB.find(s => s.subcode === selected);
                  const displayName = item ? item.subcode_name : selected;

                  let chipColors = { bgcolor: '#F5F5F5', color: '#757575' };
                  if (displayName === '대기') {
                    chipColors = { bgcolor: '#F5F5F5', color: '#757575' };
                  } else if (displayName === '진행' || displayName === '진행중') {
                    chipColors = { bgcolor: '#E3F2FD', color: '#1976D2' };
                  } else if (displayName === '완료') {
                    chipColors = { bgcolor: '#E8F5E9', color: '#388E3C' };
                  } else if (displayName === '홀딩' || displayName === '취소') {
                    chipColors = { bgcolor: '#FFEBEE', color: '#D32F2F' };
                  }

                  return (
                    <Chip
                      label={displayName}
                      size="small"
                      sx={{
                        backgroundColor: chipColors.bgcolor,
                        color: chipColors.color,
                        fontSize: '13px',
                        fontWeight: 400
                      }}
                    />
                  );
                }}
              >
                {statusTypesFromDB.map((option) => {
                  let chipColors = { bgcolor: '#F5F5F5', color: '#757575' };
                  if (option.subcode_name === '대기') {
                    chipColors = { bgcolor: '#F5F5F5', color: '#757575' };
                  } else if (option.subcode_name === '진행' || option.subcode_name === '진행중') {
                    chipColors = { bgcolor: '#E3F2FD', color: '#1976D2' };
                  } else if (option.subcode_name === '완료') {
                    chipColors = { bgcolor: '#E8F5E9', color: '#388E3C' };
                  } else if (option.subcode_name === '홀딩' || option.subcode_name === '취소') {
                    chipColors = { bgcolor: '#FFEBEE', color: '#D32F2F' };
                  }

                  return (
                    <MenuItem key={option.subcode} value={option.subcode}>
                      <Chip
                        label={option.subcode_name}
                        size="small"
                        sx={{
                          backgroundColor: chipColors.bgcolor,
                          color: chipColors.color,
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

          {/* 네 번째 줄: 시작일 - 종료일 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label={
                <span>
                  시작일 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="date"
              value={educationState.receptionDate}
              onChange={handleFieldChange('receptionDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label={
                <span>
                  종료일 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="date"
              value={educationState.resolutionDate}
              onChange={handleFieldChange('resolutionDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Stack>

          {/* 다섯 번째 줄: 팀 - 담당자 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              value={educationState.team}
              onChange={handleFieldChange('team')}
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

            <FormControl fullWidth>
              <InputLabel shrink>담당자</InputLabel>
              <Select
                value={educationState.assignee}
                label="담당자"
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
                  const user = userOptions.find((u) => u.value === value);
                  console.log('🎨 [개인교육관리 담당자 renderValue] 렌더링:', {
                    value,
                    found: !!user,
                    avatar: user?.avatar,
                    label: user?.label
                  });
                  if (!user) return value;
                  return (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={user.avatar} alt={user.label} sx={{ width: 20, height: 20 }}>
                        {user.label?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1" sx={{ color: '#666666' }}>
                        {user.label}
                      </Typography>
                    </Stack>
                  );
                }}
              >
                {userOptions.length > 0 ? (
                  userOptions.map((user) => (
                    <MenuItem key={user.value} value={user.value} title={user.department}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={user.avatar} sx={{ width: 20, height: 20, fontSize: '12px' }}>
                          {user.label.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{user.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">사용자 목록 로딩중...</MenuItem>
                )}
              </Select>
            </FormControl>
          </Stack>

          {/* 여섯 번째 줄: 등록일 - 코드 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={educationState.registrationDate}
              onChange={handleFieldChange('registrationDate')}
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
                  }
                }
              }}
            />

            <TextField
              fullWidth
              label="코드"
              value={
                education
                  ? `MAIN-EDU-${new Date(education.registrationDate).getFullYear().toString().slice(-2)}-${String(education.no).padStart(3, '0')}`
                  : `MAIN-EDU-${new Date().getFullYear().toString().slice(-2)}-XXX`
              }
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              InputProps={{
                readOnly: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5'
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

// 기록 탭 컴포넌트 (보안교육관리와 동일)
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

RecordTab.displayName = 'RecordTab';

// 자료 탭 컴포넌트 - DB 기반 파일 관리
const MaterialTab = memo(({ recordId, currentUser, canEditOwn = true, canEditOthers = true, canEdit = true }: { recordId?: number | string; currentUser?: any; canEditOwn?: boolean; canEditOthers?: boolean; canEdit?: boolean }) => {
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.IT_Education, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!recordId) {
        setValidationError('파일을 업로드하려면 먼저 Education를 저장해주세요.');
        return;
      }

      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const uploadPromises = Array.from(fileList).map(async (file) => {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.IT_Education,
          record_id: String(recordId),
          user_id: undefined,
          user_name: currentUser?.user_name || '알 수 없음',
          team: currentUser?.department
        });

        if (!result.success) {
          setValidationError(`파일 업로드 실패: ${result.error}`);
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
      setValidationError('파일명 수정에 실패했습니다.');
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
        setValidationError('파일 삭제에 실패했습니다.');
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
      setValidationError('파일 다운로드에 실패했습니다.');
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    if (!recordId) {
      setValidationError('파일을 업로드하려면 먼저 Education를 저장해주세요.');
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
            borderColor: canEdit ? 'primary.main' : 'grey.300',
            backgroundColor: canEdit ? 'primary.50' : 'grey.100',
            cursor: canEdit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease-in-out',
            '&:hover': canEdit ? {
              borderColor: 'primary.dark',
              backgroundColor: 'primary.100'
            } : {}
          }}
          onClick={canEdit ? handleUploadClick : undefined}
        >
          <Stack spacing={2} alignItems="center">
            <Typography fontSize="48px">📁</Typography>
            <Typography variant="h6" color={canEdit ? 'primary.main' : 'grey.500'}>
              {isUploading ? '파일 업로드 중...' : '파일을 업로드하세요'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              클릭하거나 파일을 여기로 드래그하세요
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Typography>📤</Typography>}
              disabled={isUploading || !recordId || !canEdit}
              sx={{
                '&.Mui-disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500'
                }
              }}
            >
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
                          disabled={!canEdit}
                          sx={{
                            p: 0.5,
                            '&.Mui-disabled': {
                              color: 'grey.400'
                            }
                          }}
                          title="수정"
                        >
                          <Typography fontSize="14px">✏️</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMaterial(file.id)}
                          color="error"
                          disabled={isDeleting || !canEdit}
                          sx={{
                            p: 0.5,
                            '&.Mui-disabled': {
                              color: 'grey.400'
                            }
                          }}
                          title="삭제"
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

// 메인 EducationEditDialog 컴포넌트
interface EducationEditDialogProps {
  open: boolean;
  onClose: () => void;
  education: EducationData | null;
  onSave: (education: EducationData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: string[];
  statusColors: Record<string, any>;
  teams?: string[];
  // 🔐 권한 관리
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

const EducationEditDialog = memo(
  ({
    open,
    onClose,
    education,
    onSave,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors,
    teams,
    canCreateData = true,
    canEditOwn = true,
    canEditOthers = true
  }: EducationEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('EducationEditDialog');

    // 세션 정보
    const { data: session } = useSession();

    // CommonData 훅 사용 (캐싱된 데이터)
    const { users } = useCommonData();

    // 현재 로그인한 사용자 정보
    const currentUser = useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      const foundUser = users.find((u) => u.email === session.user.email);
      console.log('👤 [개인교육관리 메인] 현재 로그인 사용자:', {
        email: session.user.email,
        user_name: foundUser?.user_name,
        profile_image_url: foundUser?.profile_image_url,
        avatar_url: foundUser?.avatar_url
      });
      return foundUser;
    }, [session, users]);

    // 데이터 소유자 확인 함수
    const isOwner = useMemo(() => {
      if (!currentUser || !education) return false;
      // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자
      return education.createdBy === currentUser.user_name ||
             education.assignee === currentUser.user_name;
    }, [currentUser, education]);

    // 편집 가능 여부
    const canEdit = canEditOthers || (canEditOwn && isOwner);

    // 피드백 훅 사용 (DB 연동)
    const {
      feedbacks,
      loading: feedbackLoading,
      addFeedback,
      updateFeedback,
      deleteFeedback
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.IT_Education, education?.id?.toString());

    // 🔄 임시 저장: 로컬 state로 기록 관리
    const [pendingFeedbacks, setPendingFeedbacks] = useState<FeedbackData[]>([]);
    const [initialFeedbacks, setInitialFeedbacks] = useState<FeedbackData[]>([]);

    // 초기화 여부를 추적 (무한 루프 방지)
    const feedbacksInitializedRef = useRef(false);
    const feedbacksRef = useRef<FeedbackData[]>([]);

    const [editTab, setEditTab] = useState(0);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [validationError, setValidationError] = useState<string>('');
    const [educationState, dispatch] = useReducer(editEducationReducer, {
      customerName: '',
      companyName: '',
      educationType: '',
      channel: '전화',
      title: '',
      content: '',
      responseContent: '',
      assignee: '',
      status: '접수',
      priority: '',
      registrationDate: new Date().toISOString().split('T')[0],
      receptionDate: new Date().toISOString().split('T')[0],
      resolutionDate: '',
      team: ''
    });

    // 코드 자동 생성 함수
    const generateEducationCode = useCallback(() => {
      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2); // 연도 뒤 2자리

      // 현재 연도의 Education 개수를 기반으로 순번 생성 (실제 구현에서는 서버에서 처리)
      // 여기서는 간단히 현재 시간을 기반으로 순번 생성
      const sequence = String(Date.now()).slice(-3).padStart(3, '0');

      return `Education-${currentYearStr}-${sequence}`;
    }, []);

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }, []);

    // Education 변경 시 상태 업데이트
    React.useEffect(() => {
      if (education) {
        dispatch({ type: 'SET_TASK', education });
      } else if (open) {
        // 새 Education 생성 시 자동으로 등록일 설정
        const newRegistrationDate = getCurrentDate();
        dispatch({ type: 'INIT_NEW_TASK', registrationDate: newRegistrationDate });

        // 로그인한 사용자 정보로 팀과 담당자 자동 설정
        if (currentUser) {
          dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department || '' });
          dispatch({ type: 'SET_FIELD', field: 'assignee', value: currentUser.user_name || '' });
        }
      }
    }, [education, open, getCurrentDate, currentUser]);

    // 성능 모니터링 로그 제거 (프로덕션 준비)
    // useEffect(() => {
    //   if (process.env.NODE_ENV === 'development' && renderCount > 1) {
    //     console.log(`🔄 EducationEditDialog 렌더링 횟수: ${renderCount}`);
    //     if (renderCount % 10 === 0) {
    //       const stats = logStats();
    //       console.log('📊 EducationEditDialog 성능 통계:', stats);
    //     }
    //   }
    // }, [renderCount, logStats]);

    // feedbacks를 ref에 저장 (dependency 문제 방지)
    useEffect(() => {
      feedbacksRef.current = feedbacks;
    }, [feedbacks]);

    // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
    useEffect(() => {
      if (open && education?.id && !feedbacksInitializedRef.current) {
        // feedbacks 데이터가 로드될 때까지 기다렸다가 초기화
        if (feedbacks.length > 0) {
          setPendingFeedbacks(feedbacks);
          setInitialFeedbacks(feedbacks);
          feedbacksInitializedRef.current = true;
          console.log('✅ Education관리 기록 초기화:', feedbacks.length, '개');
        }
      }

      // 다이얼로그 닫힐 때 초기화 플래그 리셋
      if (!open) {
        feedbacksInitializedRef.current = false;
        setPendingFeedbacks([]);
        setInitialFeedbacks([]);
      }
    }, [open, education?.id, feedbacks]);

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

    // Education 변경 시 상태 업데이트
    React.useEffect(() => {
      if (education) {
        dispatch({ type: 'SET_TASK', education });
      }
    }, [education]);

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditEducationState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
      setEditTab(newValue);
    }, []);

    const handleSave = useCallback(async () => {
      // OverviewTab의 현재 입력값 가져오기
      const currentValues = (window as any).getOverviewTabCurrentValues?.() || {
        content: educationState.content,
        responseContent: educationState.responseContent
      };

      // 필수 입력 검증
      if (!educationState.title || !educationState.title.trim()) {
        setValidationError('제목을 입력해주세요.');
        return;
      }

      if (!educationState.customerName || !educationState.customerName.trim()) {
        setValidationError('교육분야를 선택해주세요.');
        return;
      }

      if (!educationState.educationType || !educationState.educationType.trim()) {
        setValidationError('교육유형을 선택해주세요.');
        return;
      }

      if (!educationState.receptionDate || !educationState.receptionDate.trim()) {
        setValidationError('시작일을 선택해주세요.');
        return;
      }

      if (!educationState.resolutionDate || !educationState.resolutionDate.trim()) {
        setValidationError('종료일을 선택해주세요.');
        return;
      }

      // 에러 초기화
      setValidationError('');

      // 🔄 기록 탭 변경사항 DB 저장
      console.log('💾 기록 탭 변경사항 저장 시작');
      console.time('⏱️ 기록 저장 Total');

      if (education?.id) {
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
        if (!education) {
          // 새 Education 생성
          const newEducation: EducationData = {
            id: Date.now(),
            no: Date.now(),
            registrationDate: educationState.registrationDate || new Date().toISOString().split('T')[0],
            receptionDate: new Date().toISOString().split('T')[0],
            customerName: educationState.customerName,
            companyName: '',
            educationType: educationState.educationType,
            channel: '전화',
            title: educationState.title,
            content: currentValues.content,
            team: currentUser?.department || '',
            assignee: currentUser?.user_name || '',
            status: educationState.status,
            priority: educationState.priority,
            responseContent: currentValues.responseContent,
            resolutionDate: educationState.resolutionDate,
            satisfactionScore: null,
            attachments: [],
            createdBy: currentUser?.user_name || '',
            updatedBy: currentUser?.user_name || ''
          };

          console.log('🚀 새 Education 생성 중:', newEducation);
          console.log('👤 현재 사용자 정보:', { department: currentUser?.department, name: currentUser?.user_name });
          onSave(newEducation);
        } else {
          // 기존 Education 수정
          const updatedEducation: EducationData = {
            ...education,
            customerName: educationState.customerName,
            educationType: educationState.educationType,
            title: educationState.title,
            content: currentValues.content,
            assignee: educationState.assignee,
            status: educationState.status,
            priority: educationState.priority,
            responseContent: currentValues.responseContent,
            resolutionDate: educationState.resolutionDate,
            updatedBy: currentUser?.user_name || ''
          };

          console.log('📝 기존 Education 수정 중:', updatedEducation);
          onSave(updatedEducation);
        }
        onClose();
      }, 50); // 50ms 지연
    }, [
      education,
      educationState,
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
      setNewComment('');
      setEditingCommentId(null);
      setEditingCommentText('');
      setValidationError(''); // 에러 상태 초기화
      // 🔄 기록 탭 임시 데이터 초기화
      setPendingFeedbacks([]);
      setInitialFeedbacks([]);
      onClose();
    }, [onClose]);

    // 🔄 기록탭 핸들러 함수들 - 로컬 state만 변경 (임시 저장)
    const handleAddComment = useCallback(() => {
      if (!newComment.trim() || !education?.id) return;

      const currentUserName = currentUser?.user_name || '현재 사용자';
      const currentTeam = currentUser?.department || '';
      const currentPosition = currentUser?.position || '';
      const currentProfileImage = currentUser?.profile_image_url || '';
      const currentRole = currentUser?.role || '';

      // 로컬 임시 ID 생성
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newFeedback: FeedbackData = {
        id: tempId,
        page: PAGE_IDENTIFIERS.IT_Education,
        record_id: education.id.toString(),
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
    }, [newComment, education?.id, currentUser]);

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
        educationState,
        onFieldChange: handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors,
        education
      }),
      [educationState, handleFieldChange, assignees, assigneeAvatars, statusOptions, statusColors, education]
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
        currentUserName: currentUser?.user_name || '현재 사용자',
        currentUserAvatar: currentUser?.profile_image_url || '',
        currentUserRole: currentUser?.role || '',
        currentUserDepartment: currentUser?.department || ''
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
              개인교육관리 편집
            </Typography>
            {education && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                {education.title} (MAIN-EDU-{new Date(education.registrationDate).getFullYear().toString().slice(-2)}-
                {String(education.no).padStart(3, '0')})
              </Typography>
            )}
          </Box>

          {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
          {/* 🔐 권한 체크: 새 개인교육관리(education === null)는 canCreateData, 기존 개인교육관리는 canEdit */}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              size="small"
              disabled={!education ? !canCreateData : !canEdit}
              sx={{
                minWidth: '60px',
                '&.Mui-disabled': {
                  borderColor: 'grey.300',
                  color: 'grey.500'
                }
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              size="small"
              disabled={!education ? !canCreateData : !canEdit}
              sx={{
                minWidth: '60px',
                '&.Mui-disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500'
                }
              }}
            >
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

        <DialogContent
          sx={{
            p: 1,
            pt: 1,
            pb: 1,
            height: 'calc(840px - 80px - 60px)',
            maxHeight: 'calc(840px - 80px - 60px)',
            overflow: 'auto'
          }}
        >
          {editTab === 0 && <OverviewTab {...overviewTabProps} />}
          {editTab === 1 && <RecordTab {...recordTabProps} />}
          {editTab === 2 && <MaterialTab recordId={education?.id} currentUser={currentUser} canEditOwn={canEditOwn} canEditOthers={canEditOthers} canEdit={canEdit} />}
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

EducationEditDialog.displayName = 'EducationEditDialog';

export default EducationEditDialog;
