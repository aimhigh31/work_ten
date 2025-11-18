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
import { InvestmentTableData, InvestmentStatus } from '../types/investment';
import { useOptimizedInput } from '../hooks/useDebounce';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

// Hooks
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseDepartments } from '../hooks/useSupabaseDepartments';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';
import { useSupabaseInvestment } from '../hooks/useSupabaseInvestment';
import { useSupabaseInvestmentFinance } from '../hooks/useSupabaseInvestmentFinance';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface EditInvestmentState {
  investmentName: string;
  description: string;
  assignee: string;
  status: InvestmentStatus;
  code: string;
  registrationDate: string;
  completedDate: string;
  startDate: string;
  team: string;
  investmentType: string;
  investmentAmount: string;
  progress: number;
}

type EditInvestmentAction =
  | { type: 'SET_FIELD'; field: keyof EditInvestmentState; value: string }
  | { type: 'SET_INVESTMENT'; investment: InvestmentTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_INVESTMENT'; code: string; registrationDate: string };

const editInvestmentReducer = (state: EditInvestmentState, action: EditInvestmentAction): EditInvestmentState => {
  switch (action.type) {
    case 'SET_FIELD':
      // progress 필드는 숫자로 변환
      if (action.field === 'progress') {
        return { ...state, [action.field]: Number(action.value) || 0 };
      }
      return { ...state, [action.field]: action.value };
    case 'SET_INVESTMENT':
      return {
        investmentName: action.investment.investmentName || '',
        description: action.investment.description || '',
        assignee: action.investment.assignee || '',
        status: action.investment.status,
        code: action.investment.code || '',
        registrationDate: action.investment.registrationDate || '',
        completedDate: action.investment.completedDate || '',
        startDate: action.investment.startDate || action.investment.registrationDate || '',
        team: action.investment.team || '투자팀',
        investmentType: action.investment.investmentType || 'IT투자',
        investmentAmount: (action.investment as any).investmentAmount || '',
        progress: action.investment.progress || 0
      };
    case 'INIT_NEW_INVESTMENT':
      return {
        investmentName: '',
        description: '',
        assignee: '',
        status: '검토중',
        code: action.code,
        registrationDate: action.registrationDate,
        completedDate: '',
        startDate: action.registrationDate,
        team: '투자팀',
        investmentType: 'IT투자',
        investmentAmount: '',
        progress: 0
      };
    case 'RESET':
      return {
        investmentName: '',
        description: '',
        progress: 0,
        assignee: '',
        status: '검토중',
        code: '',
        registrationDate: '',
        completedDate: '',
        startDate: '',
        team: '투자팀',
        investmentType: 'IT투자',
        investmentAmount: ''
      };
    default:
      return state;
  }
};

// 개요 탭 컴포넌트
const InvestmentOverviewTab = memo(
  ({
    investmentState,
    onFieldChange,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors,
    investmentTypes,
    teams,
    totalInvestmentAmount
  }: {
    investmentState: any;
    onFieldChange: (field: string, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: InvestmentStatus[];
    statusColors: Record<InvestmentStatus, any>;
    investmentTypes: string[];
    teams: string[];
    totalInvestmentAmount: number;
  }) => {
    // ✅ 공용 창고에서 마스터코드, 부서, 사용자 데이터 가져오기
    const { masterCodes, departments, users } = useCommonData();

    console.log('🔍 [InvestmentEditDialog OverviewTab] masterCodes:', masterCodes?.length);
    console.log('🔍 [InvestmentEditDialog OverviewTab] departments:', departments?.length);
    console.log('🔍 [InvestmentEditDialog OverviewTab] users:', users?.length);

    // Supabase 클라이언트 생성 (DB 직접 조회용)
    const supabaseClient = React.useMemo(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }, []);

    // DB 직접 조회 상태
    const [investmentTypesFromDB, setInvestmentTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog 열릴 때마다 DB에서 직접 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        // GROUP025: 투자유형
        const { data: group025Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP025')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group025Data) {
          setInvestmentTypesFromDB(group025Data);
          console.log('✅ [InvestmentOverviewTab] GROUP025 투자유형 DB 조회 완료:', group025Data.length, '개');
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
          console.log('✅ [InvestmentOverviewTab] GROUP002 상태 DB 조회 완료:', group002Data.length, '개');
        }
      };

      fetchMasterCodeData();
    }, [supabaseClient]);

    // 세션 정보 가져오기
    const { data: session } = useSession();

    // 현재 로그인한 사용자 정보 찾기
    const currentUser = useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      return users.find((u) => u.email === session.user.email);
    }, [session, users]);

    // 부서 목록
    const departmentNames = React.useMemo(() => {
      if (departments && departments.length > 0) {
        const names = departments.map((dept) => dept.department_name);
        console.log('✅ 부서명 목록:', names);
        return names;
      }
      return [];
    }, [departments]);

    // 활성 사용자 목록
    const userNames = React.useMemo(() => {
      const activeUsers = users.filter((user) => user.is_active && user.status === 'active');
      if (activeUsers.length > 0) {
        return activeUsers.map((user) => user.user_name);
      }
      return [];
    }, [users]);

    // 사용자 아바타 매핑
    const userAvatars = React.useMemo(() => {
      const avatarMap: Record<string, string> = {};
      users.forEach((user) => {
        if (user.profile_image_url || user.avatar_url) {
          avatarMap[user.user_name] = user.profile_image_url || user.avatar_url || '';
        }
      });
      return avatarMap;
    }, [users]);

    // 최종 사용할 옵션들
    const finalTeams = departmentNames.length > 0 ? departmentNames : teams;
    const finalAssignees = userNames.length > 0 ? userNames : assignees;
    const finalAssigneeAvatars = Object.keys(userAvatars).length > 0 ? userAvatars : assigneeAvatars;

    // TextField 직접 참조를 위한 ref
    const investmentNameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // 텍스트 필드용 최적화된 입력 관리
    const investmentNameInput = useOptimizedInput(investmentState.investmentName || '', 150);
    const descriptionInput = useOptimizedInput(investmentState.description || '', 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림
    useEffect(() => {
      if (!isUpdatingRef.current && investmentNameInput.debouncedValue !== investmentState.investmentName) {
        onFieldChange('investmentName', investmentNameInput.debouncedValue);
      }
    }, [investmentNameInput.debouncedValue, investmentState.investmentName, onFieldChange]);

    useEffect(() => {
      if (!isUpdatingRef.current && descriptionInput.debouncedValue !== investmentState.description) {
        onFieldChange('description', descriptionInput.debouncedValue);
      }
    }, [descriptionInput.debouncedValue, investmentState.description, onFieldChange]);

    // 외부에서 상태가 변경될 때 입력 값 동기화
    useEffect(() => {
      if (
        investmentState.investmentName !== investmentNameInput.inputValue &&
        investmentState.investmentName !== investmentNameInput.debouncedValue
      ) {
        isUpdatingRef.current = true;
        investmentNameInput.reset(investmentState.investmentName);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [investmentState.investmentName, investmentNameInput.inputValue, investmentNameInput.debouncedValue]);

    useEffect(() => {
      if (investmentState.description !== descriptionInput.inputValue && investmentState.description !== descriptionInput.debouncedValue) {
        isUpdatingRef.current = true;
        descriptionInput.reset(investmentState.description);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [investmentState.description, descriptionInput.inputValue, descriptionInput.debouncedValue]);

    // 신규 투자 생성시 로그인 사용자 정보로 자동 입력
    useEffect(() => {
      if (currentUser && (!investmentState.team || !investmentState.assignee)) {
        if (currentUser.department) {
          onFieldChange('team', currentUser.department);
        }
        if (currentUser.user_name) {
          onFieldChange('assignee', currentUser.user_name);
        }
      }
    }, [currentUser, investmentState.team, investmentState.assignee, onFieldChange]);

    const handleFieldChange = useCallback(
      (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
        onFieldChange(field, e.target.value);
      },
      [onFieldChange]
    );

    // 현재 입력 값들을 반환하는 함수
    const getCurrentValues = useCallback(() => {
      return {
        investmentName: investmentNameRef.current?.value || investmentNameInput.inputValue,
        description: descriptionRef.current?.value || descriptionInput.inputValue
      };
    }, [investmentNameInput.inputValue, descriptionInput.inputValue]);

    // 컴포넌트가 마운트될 때 getCurrentValues 함수를 전역에서 접근 가능하도록 설정
    useEffect(() => {
      (window as any).getInvestmentOverviewTabCurrentValues = getCurrentValues;
      return () => {
        delete (window as any).getInvestmentOverviewTabCurrentValues;
      };
    }, [getCurrentValues]);

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 투자명 - 1줄로 변경 */}
          <TextField
            fullWidth
            label={
              <span>
                투자명 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={investmentNameInput.inputValue}
            onChange={(e) => investmentNameInput.handleChange(e.target.value)}
            variant="outlined"
            inputRef={investmentNameRef}
            InputLabelProps={{ shrink: true }}
            placeholder="투자 프로젝트명을 입력하세요..."
          />

          {/* 설명 - 전체 너비 */}
          <TextField
            fullWidth
            label="설명"
            multiline
            rows={3}
            value={descriptionInput.inputValue}
            onChange={(e) => descriptionInput.handleChange(e.target.value)}
            variant="outlined"
            inputRef={descriptionRef}
            InputLabelProps={{ shrink: true }}
            placeholder="투자 프로젝트에 대한 상세 설명을 입력하세요..."
          />

          {/* 투자유형 - 투자금액 - 상태 - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  투자유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={investmentState.investmentType}
                label="투자유형 *"
                onChange={handleFieldChange('investmentType')}
                displayEmpty
                notched
                renderValue={(selected) => selected || '선택'}
              >
                <MenuItem value="">선택</MenuItem>
                {investmentTypesFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="투자금액"
              value={`${totalInvestmentAmount.toLocaleString()}원`}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                style: { backgroundColor: '#f5f5f5' }
              }}
              helperText="투자금액탭에서 자동 계산됨"
            />

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={investmentState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';

                  const getStatusColor = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                      case '진행':
                      case '진행중':
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
                      case '홀딩':
                      case '취소':
                        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
                      default:
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                    }
                  };

                  return (
                    <Chip
                      label={selected}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(selected).bgcolor,
                        color: getStatusColor(selected).color,
                        fontSize: '13px',
                        fontWeight: 400
                      }}
                    />
                  );
                }}
              >
                {statusTypesFromDB.map((option) => {
                  const getStatusColor = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                      case '진행':
                      case '진행중':
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
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
              label="시작일"
              type="date"
              value={investmentState.startDate}
              onChange={handleFieldChange('startDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="완료일"
              type="date"
              value={investmentState.completedDate}
              onChange={handleFieldChange('completedDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Stack>

          {/* 팀과 담당자 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              value={investmentState.team}
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
              <InputLabel shrink>
                <span>
                  담당자 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={investmentState.assignee}
                label="담당자 *"
                onChange={handleFieldChange('assignee')}
                disabled={true}
                sx={{
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
                  const user = users.find((u) => u.user_name === value);
                  if (!user) return value;
                  return (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={user.profile_image_url || user.avatar_url} sx={{ width: 20, height: 20 }}>
                        {value?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1" sx={{ color: '#000000' }}>
                        {value}
                      </Typography>
                    </Stack>
                  );
                }}
              >
                {finalAssignees?.map((assignee) => (
                  <MenuItem key={assignee} value={assignee}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={finalAssigneeAvatars?.[assignee as keyof typeof finalAssigneeAvatars]}
                        alt={assignee}
                        sx={{ width: 24, height: 24 }}
                      >
                        {assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{assignee}</Typography>
                    </Stack>
                  </MenuItem>
                )) || []}
              </Select>
            </FormControl>
          </Stack>

          {/* 등록일과 코드 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={investmentState.registrationDate}
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
              value={investmentState.code}
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

InvestmentOverviewTab.displayName = 'InvestmentOverviewTab';

interface InvestmentEditDialogProps {
  open: boolean;
  onClose: () => void;
  investment?: InvestmentTableData | null;
  onSave: (investment: InvestmentTableData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: InvestmentStatus[];
  statusColors: Record<InvestmentStatus, any>;
  investmentTypes: string[];
  teams: string[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  users?: any[];
  generateInvestmentCode?: () => Promise<string>;
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

// 기록 탭 컴포넌트 (보안교육관리와 동일)
const InvestmentRecordTab = memo(
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
                      {comment.position && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          {comment.position}
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

InvestmentRecordTab.displayName = 'InvestmentRecordTab';

// 자료 탭 컴포넌트 - DB 기반 파일 관리
const InvestmentMaterialTab = memo(({ recordId, currentUser, canEdit = true }: { recordId?: number | string; currentUser?: any; canEdit?: boolean }) => {
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.INVESTMENT, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!recordId) {
        setValidationError('파일을 업로드하려면 먼저 투자를 저장해주세요.');
        return;
      }

      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const uploadPromises = Array.from(fileList).map(async (file) => {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.INVESTMENT,
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
      setValidationError('파일을 업로드하려면 먼저 투자를 저장해주세요.');
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
            '&:hover': {
              borderColor: canEdit ? 'primary.dark' : 'grey.300',
              backgroundColor: canEdit ? 'primary.100' : 'grey.100'
            }
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
                          sx={{
                            p: 0.5,
                            '&.Mui-disabled': {
                              color: 'grey.500'
                            }
                          }}
                          title="수정"
                          disabled={!canEdit}
                        >
                          <Typography fontSize="14px">✏️</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMaterial(file.id)}
                          color="error"
                          sx={{
                            p: 0.5,
                            '&.Mui-disabled': {
                              color: 'grey.500'
                            }
                          }}
                          title="삭제"
                          disabled={isDeleting || !canEdit}
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

InvestmentMaterialTab.displayName = 'InvestmentMaterialTab';

// 투자금액 탭 컴포넌트 - SecurityEducation ParticipantsTab에서 복사하여 수정
interface AmountItem {
  id: string;
  no: number;
  investmentCategory: string;
  itemName: string;
  budgetAmount: number;
  executionAmount: number;
  remarks: string;
}

// 데이터 관리 클래스
class InvestmentAmountDataManager {
  private static instance: InvestmentAmountDataManager;
  private data: Map<number, { amounts: AmountItem[] }> = new Map();

  static getInstance(): InvestmentAmountDataManager {
    if (!InvestmentAmountDataManager.instance) {
      InvestmentAmountDataManager.instance = new InvestmentAmountDataManager();
    }
    return InvestmentAmountDataManager.instance;
  }

  // 투자금액 데이터 불러오기
  getData(investmentId: number): { amounts: AmountItem[] } {
    if (!this.data.has(investmentId)) {
      this.data.set(investmentId, { amounts: [] });
    }
    return this.data.get(investmentId)!;
  }

  // 투자금액 데이터 저장
  saveAmounts(investmentId: number, amounts: AmountItem[]) {
    if (!this.data.has(investmentId)) {
      this.data.set(investmentId, { amounts: [] });
    }
    const data = this.data.get(investmentId)!;
    data.amounts = amounts;
  }
}

// 투자금액 탭 인터페이스 (하드웨어 관리 패턴)
interface InvestmentAmountTabProps {
  mode: 'add' | 'edit';
  investmentId?: number;
  amountItems: any[];
  setAmountItems: React.Dispatch<React.SetStateAction<any[]>>;
  investmentDetailTypesFromDB: Array<{ subcode: string; subcode_name: string }>;
  canEdit?: boolean;
}

const InvestmentAmountTab = memo(({ mode, investmentId, amountItems, setAmountItems, investmentDetailTypesFromDB, canEdit = true }: InvestmentAmountTabProps) => {
  // ✅ 공용 창고에서 마스터코드 데이터 가져오기
  const { masterCodes } = useCommonData();

  console.log('🔍 [InvestmentAmountTab] masterCodes:', masterCodes?.length);

  // 투자금액 샘플 데이터
  const mockAmountData = [
    {
      id: '1',
      facilityCode: 'FAC-001',
      investmentType: '서버',
      investmentDescription: 'Dell PowerEdge R740 서버',
      quantity: 3,
      unitPrice: 28000000,
      amount: 84000000,
      notes: '3년 보증'
    },
    {
      id: '2',
      facilityCode: 'FAC-002',
      investmentType: '소프트웨어',
      investmentDescription: 'SAP S/4HANA ERP 시스템',
      quantity: 1,
      unitPrice: 150000000,
      amount: 150000000,
      notes: '라이선스 포함'
    },
    {
      id: '3',
      facilityCode: 'FAC-003',
      investmentType: '네트워크장비',
      investmentDescription: 'Cisco Catalyst 9300 스위치',
      quantity: 5,
      unitPrice: 12000000,
      amount: 60000000,
      notes: '24포트'
    },
    {
      id: '4',
      facilityCode: 'FAC-004',
      investmentType: '보안장비',
      investmentDescription: 'FortiGate 방화벽',
      quantity: 2,
      unitPrice: 45000000,
      amount: 90000000,
      notes: 'IPS 포함'
    },
    {
      id: '5',
      facilityCode: 'FAC-005',
      investmentType: '개발도구',
      investmentDescription: 'IDE 라이선스 패키지',
      quantity: 10,
      unitPrice: 3000000,
      amount: 30000000,
      notes: 'Visual Studio Enterprise'
    },
    {
      id: '6',
      facilityCode: 'FAC-006',
      investmentType: '클라우드',
      investmentDescription: 'AWS 클라우드 인프라',
      quantity: 1,
      unitPrice: 80000000,
      amount: 80000000,
      notes: '3년 계약'
    },
    {
      id: '7',
      facilityCode: 'FAC-007',
      investmentType: '백업장비',
      investmentDescription: 'NetApp FAS2720 백업 스토리지',
      quantity: 2,
      unitPrice: 35000000,
      amount: 70000000,
      notes: '10TB 용량'
    },
    {
      id: '8',
      facilityCode: 'FAC-008',
      investmentType: '모니터링',
      investmentDescription: 'DataDog APM 모니터링',
      quantity: 1,
      unitPrice: 25000000,
      amount: 25000000,
      notes: '실시간 모니터링'
    },
    {
      id: '9',
      facilityCode: 'FAC-009',
      investmentType: '서버',
      investmentDescription: 'HPE ProLiant DL380 서버',
      quantity: 2,
      unitPrice: 32000000,
      amount: 64000000,
      notes: '고성능 CPU'
    },
    {
      id: '10',
      facilityCode: 'FAC-010',
      investmentType: '네트워크장비',
      investmentDescription: 'Juniper EX4300 스위치',
      quantity: 3,
      unitPrice: 18000000,
      amount: 54000000,
      notes: '48포트 관리형'
    },
    {
      id: '11',
      facilityCode: 'FAC-011',
      investmentType: '보안장비',
      investmentDescription: 'Palo Alto PA-3220 방화벽',
      quantity: 1,
      unitPrice: 55000000,
      amount: 55000000,
      notes: 'HA 구성'
    },
    {
      id: '12',
      facilityCode: 'FAC-012',
      investmentType: '소프트웨어',
      investmentDescription: 'Oracle Database Enterprise',
      quantity: 2,
      unitPrice: 75000000,
      amount: 150000000,
      notes: 'RAC 라이선스'
    },
    {
      id: '13',
      facilityCode: 'FAC-013',
      investmentType: '개발도구',
      investmentDescription: 'JetBrains 통합 개발 환경',
      quantity: 50,
      unitPrice: 500000,
      amount: 25000000,
      notes: '개발자 라이선스'
    },
    {
      id: '14',
      facilityCode: 'FAC-014',
      investmentType: '클라우드',
      investmentDescription: 'Microsoft Azure 서비스',
      quantity: 1,
      unitPrice: 60000000,
      amount: 60000000,
      notes: '하이브리드 클라우드'
    },
    {
      id: '15',
      facilityCode: 'FAC-015',
      investmentType: '백업장비',
      investmentDescription: 'Veeam Backup & Replication',
      quantity: 1,
      unitPrice: 40000000,
      amount: 40000000,
      notes: '전체 백업 솔루션'
    },
    {
      id: '16',
      facilityCode: 'FAC-016',
      investmentType: '모니터링',
      investmentDescription: 'Zabbix 엔터프라이즈 모니터링',
      quantity: 1,
      unitPrice: 20000000,
      amount: 20000000,
      notes: '통합 모니터링'
    },
    {
      id: '17',
      facilityCode: 'FAC-017',
      investmentType: '서버',
      investmentDescription: 'IBM Power9 서버',
      quantity: 1,
      unitPrice: 120000000,
      amount: 120000000,
      notes: 'AIX 운영체제'
    }
  ];

  // 부모 컴포넌트에서 amountItems와 setAmountItems를 props로 받아 사용 (하드웨어 관리 패턴)

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // 페이지네이션 계산
  const totalPages = Math.ceil(amountItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = amountItems.slice(startIndex, endIndex);

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

  const handleAddItem = () => {
    const newItem: any = {
      id: Date.now().toString(),
      no: amountItems.length + 1,
      investmentCategory: '', // investment_category
      itemName: '', // item_name
      budgetAmount: 0, // budget_amount
      executionAmount: 0, // execution_amount
      remarks: '' // remarks
    };
    setAmountItems([newItem, ...amountItems]);
  };

  const handleDeleteSelected = async () => {
    // 삭제할 항목들 처리
    const itemsToDelete = amountItems.filter((item) => selectedRows.includes(item.id));

    // DB에 존재하는 항목들(숫자 ID)은 is_active를 false로 변경
    for (const item of itemsToDelete) {
      // Date.now()로 생성된 ID는 문자열, DB ID는 숫자로 변환 가능
      const numericId = Number(item.id);

      // 숫자 ID이고 타임스탬프가 아닌 경우(DB에 저장된 항목)
      if (!isNaN(numericId) && numericId < 1000000000000) {
        console.log('🗑️ DB 항목 삭제:', numericId);
        await deleteFinanceItem(numericId);
      } else {
        console.log('🗑️ 로컬 항목 삭제:', item.id);
      }
    }

    // 로컬 상태에서 삭제
    setAmountItems(amountItems.filter((item) => !selectedRows.includes(item.id)));
    setSelectedRows([]);
  };

  const handleEditItem = (id: string, field: string, value: string | number) => {
    setAmountItems(
      amountItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    );
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
      setSelectedRows(amountItems.map((item) => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 50,
    no: 60,
    investmentCategory: 120,
    itemName: 200,
    budgetAmount: 120,
    executionAmount: 120,
    remarks: 150
  };

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (item: any, field: string, value: string | number) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;

    if (isEditing) {
      if (field === 'investmentCategory') {
        return (
          <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
            <Select
              value={value as string}
              onChange={(e) => {
                handleEditItem(item.id, field, e.target.value);
                // 선택 후 자동으로 편집 모드 종료
                setTimeout(() => handleCellBlur(), 0);
              }}
              size="small"
              fullWidth
              autoFocus
              onClose={handleCellBlur}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return '선택';
                const found = investmentDetailTypesFromDB.find(t => t.subcode_name === selected);
                return found ? found.subcode_name : selected;
              }}
            >
              <MenuItem value="">선택</MenuItem>
              {investmentDetailTypesFromDB.map((option) => (
                <MenuItem key={option.subcode} value={option.subcode_name}>
                  {option.subcode_name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        );
      }

      if (field === 'budgetAmount' || field === 'executionAmount') {
        return (
          <TextField
            type="number"
            value={value || 0}
            onChange={(e) => handleEditItem(item.id, field, Number(e.target.value) || 0)}
            onBlur={handleCellBlur}
            size="small"
            fullWidth
            autoFocus
            sx={{ '& input': { textAlign: 'right' } }}
            inputProps={{ min: 0, step: 1000 }}
          />
        );
      }

      return (
        <TextField
          value={value || ''}
          onChange={(e) => handleEditItem(item.id, field, e.target.value)}
          onBlur={handleCellBlur}
          size="small"
          fullWidth
          autoFocus
          multiline={field === 'itemName' || field === 'remarks'}
          sx={field === 'remarks' ? {
            '& .MuiInputBase-root': {
              height: '48px',
              alignItems: 'flex-start',
              overflowY: 'auto',
              padding: '8px 12px'
            },
            '& .MuiInputBase-input': {
              height: 'auto !important',
              overflow: 'auto !important'
            }
          } : undefined}
        />
      );
    }

    return (
      <Box
        onClick={() => field !== 'amount' && handleCellClick(item.id, field)}
        sx={{
          width: '100%',
          padding: '8px 12px',
          height: '48px',
          display: 'flex',
          alignItems: field === 'remarks' ? 'flex-start' : 'center',
          cursor: field === 'amount' ? 'default' : 'text',
          '&:hover': { backgroundColor: field === 'amount' ? 'transparent' : 'action.hover' },
          overflow: field === 'remarks' ? 'auto' : 'hidden',
          '&::-webkit-scrollbar': field === 'remarks' ? {
            width: '6px',
            height: '6px'
          } : undefined,
          '&::-webkit-scrollbar-track': field === 'remarks' ? {
            backgroundColor: '#f1f1f1',
            borderRadius: '3px'
          } : undefined,
          '&::-webkit-scrollbar-thumb': field === 'remarks' ? {
            backgroundColor: '#888',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#555'
            }
          } : undefined
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            textAlign: field === 'budgetAmount' || field === 'executionAmount' ? 'right' : 'left',
            whiteSpace: field === 'remarks' ? 'pre-wrap' : 'nowrap',
            wordBreak: field === 'remarks' ? 'break-word' : 'normal',
            overflow: field === 'remarks' ? 'visible' : 'hidden',
            textOverflow: field === 'remarks' ? 'clip' : 'ellipsis',
            width: '100%',
            lineHeight: field === 'remarks' ? '1.5' : 'normal'
          }}
        >
          {field === 'budgetAmount' || field === 'executionAmount'
            ? `${(value != null ? Number(value) : 0).toLocaleString()}원`
            : field === 'investmentCategory'
              ? (() => {
                  if (!value) return '선택';
                  const found = investmentDetailTypesFromDB.find(t => t.subcode === value);
                  return found ? found.subcode_name : value;
                })()
              : value || '-'}
        </Typography>
      </Box>
    );
  };

  // 총 투자금액 계산 (부모에서 관리하므로 로컬 표시용으로만 사용)
  const totalAmount = amountItems.reduce((sum, item) => sum + (item.budgetAmount || 0) + (item.executionAmount || 0), 0);

  return (
    <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            투자금액관리 -
          </Typography>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: 'primary.main' }}>
            총 투자금액 {totalAmount.toLocaleString()}원
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteSelected}
            disabled={selectedRows.length === 0 || !canEdit}
            size="small"
            sx={{
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            삭제({selectedRows.length})
          </Button>
          <Button
            variant="contained"
            onClick={handleAddItem}
            disabled={!canEdit}
            size="small"
            sx={{
              fontSize: '12px',
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            추가
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          maxHeight: '510px',
          '& .MuiTable-root': {
            minWidth: 800
          }
        }}
      >
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell
                padding="checkbox"
                sx={{ width: columnWidths.checkbox, minWidth: columnWidths.checkbox, maxWidth: columnWidths.checkbox }}
              >
                <Checkbox
                  checked={selectedRows.length === amountItems.length && amountItems.length > 0}
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
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600, minWidth: columnWidths.no, maxWidth: columnWidths.no }}>
                NO
              </TableCell>
              <TableCell
                sx={{
                  width: columnWidths.investmentCategory,
                  fontWeight: 600,
                  minWidth: columnWidths.investmentCategory,
                  maxWidth: columnWidths.investmentCategory
                }}
              >
                투자세부유형
              </TableCell>
              <TableCell
                sx={{
                  width: columnWidths.itemName,
                  fontWeight: 600,
                  minWidth: columnWidths.itemName,
                  maxWidth: columnWidths.itemName
                }}
              >
                항목명
              </TableCell>
              <TableCell
                sx={{
                  width: columnWidths.budgetAmount,
                  fontWeight: 600,
                  minWidth: columnWidths.budgetAmount,
                  maxWidth: columnWidths.budgetAmount
                }}
              >
                예산금액
              </TableCell>
              <TableCell
                sx={{
                  width: columnWidths.executionAmount,
                  fontWeight: 600,
                  minWidth: columnWidths.executionAmount,
                  maxWidth: columnWidths.executionAmount
                }}
              >
                집행금액
              </TableCell>
              <TableCell
                sx={{ width: columnWidths.remarks, fontWeight: 600, minWidth: columnWidths.remarks, maxWidth: columnWidths.remarks }}
              >
                비고
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((item, index) => (
              <TableRow
                key={item.id}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell
                  sx={{
                    width: columnWidths.checkbox,
                    padding: 0,
                    height: 48,
                    minWidth: columnWidths.checkbox,
                    maxWidth: columnWidths.checkbox
                  }}
                >
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Checkbox
                      checked={selectedRows.includes(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      color="primary"
                      size="small"
                      sx={{
                        transform: 'scale(0.7)',
                        '&.Mui-checked': {
                          color: '#1976d2'
                        }
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ width: columnWidths.no, padding: 0, height: 48, minWidth: columnWidths.no, maxWidth: columnWidths.no }}>
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                    {amountItems.length - startIndex - index}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.investmentCategory,
                    padding: 0,
                    height: 48,
                    minWidth: columnWidths.investmentCategory,
                    maxWidth: columnWidths.investmentCategory
                  }}
                  onClick={() => handleCellClick(item.id, 'investmentCategory')}
                >
                  {renderEditableCell(item, 'investmentCategory', item.investmentCategory)}
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.itemName,
                    padding: 0,
                    height: 48,
                    minWidth: columnWidths.itemName,
                    maxWidth: columnWidths.itemName
                  }}
                  onClick={() => handleCellClick(item.id, 'itemName')}
                >
                  {renderEditableCell(item, 'itemName', item.itemName)}
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.budgetAmount,
                    padding: 0,
                    height: 48,
                    minWidth: columnWidths.budgetAmount,
                    maxWidth: columnWidths.budgetAmount
                  }}
                  onClick={() => handleCellClick(item.id, 'budgetAmount')}
                >
                  {renderEditableCell(item, 'budgetAmount', item.budgetAmount)}
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.executionAmount,
                    padding: 0,
                    height: 48,
                    minWidth: columnWidths.executionAmount,
                    maxWidth: columnWidths.executionAmount
                  }}
                  onClick={() => handleCellClick(item.id, 'executionAmount')}
                >
                  {renderEditableCell(item, 'executionAmount', item.executionAmount)}
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.remarks,
                    padding: 0,
                    height: 48,
                    minWidth: columnWidths.remarks,
                    maxWidth: columnWidths.remarks,
                    verticalAlign: 'top'
                  }}
                  onClick={() => handleCellClick(item.id, 'remarks')}
                >
                  {renderEditableCell(item, 'remarks', item.remarks)}
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
          mt: 1,
          pt: 1.5,
          px: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          flexShrink: 0
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {amountItems.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, amountItems.length)} of ${amountItems.length}` : '0-0 of 0'}
        </Typography>
        {amountItems.length > 0 && (
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

InvestmentAmountTab.displayName = 'InvestmentAmountTab';

function InvestmentEditDialog({
  open,
  onClose,
  investment,
  onSave,
  assignees,
  assigneeAvatars,
  statusOptions,
  statusColors,
  investmentTypes,
  teams,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  users: propsUsers = [],
  generateInvestmentCode,
  setSnackbar
}: InvestmentEditDialogProps) {
  // 세션 정보
  const { data: session } = useSession();

  // ✅ 공용 창고에서 사용자 데이터 가져오기 (fallback)
  const { users: contextUsers, masterCodes } = useCommonData();
  const users = propsUsers.length > 0 ? propsUsers : contextUsers;

  console.log('🔍 [InvestmentEditDialog] users:', users?.length);

  // 현재 로그인한 사용자 정보
  const currentUser = useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    console.log('🔍 [InvestmentEditDialog] currentUser:', found ? found.user_name : '없음');
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 (createdBy 또는 assignee)
  const isDataOwner = useMemo(() => {
    if (!investment || !currentUser) return false;
    const isCreator = investment.createdBy === currentUser.user_name;
    const isAssignee = investment.assignee === currentUser.user_name;
    return isCreator || isAssignee;
  }, [investment, currentUser]);

  // 편집 가능 여부 확인
  const canEdit = useMemo(() => {
    // 신규 추가인 경우
    if (!investment) return canCreateData;
    // 편집인 경우
    return canEditOthers || (canEditOwn && isDataOwner);
  }, [investment, canCreateData, canEditOwn, canEditOthers, isDataOwner]);

  // GROUP004 직급 서브코드 옵션 (서브코드명 변환용)
  const positionOptions = useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP004' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order)
      .map((item) => ({
        code: item.subcode,
        name: item.subcode_name
      }));
  }, [masterCodes]);

  // 서브코드를 서브코드명으로 변환하는 함수
  const convertSubcodeName = useCallback((subcode: string | undefined, options: Array<{ code: string; name: string }>) => {
    if (!subcode) return '';
    if (!subcode.includes('GROUP')) return subcode;
    const found = options.find((opt) => opt.code === subcode);
    return found ? found.name : subcode;
  }, []);

  // 피드백 훅 사용 (DB 연동)
  const {
    feedbacks,
    loading: feedbackLoading,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.INVESTMENT, investment?.id);

  // Supabase 훅 (소프트웨어/하드웨어관리 패턴)
  const { createInvestment, updateInvestment } = useSupabaseInvestment();

  // 투자금액 훅 사용 (하드웨어 관리 패턴)
  const { getFinanceItems, saveFinanceItems, deleteFinanceItem } = useSupabaseInvestmentFinance();

  const [tabValue, setTabValue] = useState(0);

  // feedbacks를 comments 형식으로 변환
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
        department: feedback.user_department || feedbackUser?.department || '',
        position: convertSubcodeName(feedbackUser?.role || '', positionOptions),
        role: ''
      };
    });
  }, [feedbacks, users, positionOptions, convertSubcodeName]);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // 유효성 검증 에러 상태
  const [validationError, setValidationError] = useState<string>('');

  // 투자금액 상태 관리 (하드웨어 관리 패턴)
  const [amountItems, setAmountItems] = useState<any[]>([]);

  // Supabase 클라이언트 생성 (DB 직접 조회용)
  const supabaseClient = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // DB 직접 조회 상태 (투자세부유형)
  const [investmentDetailTypesFromDB, setInvestmentDetailTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

  // Dialog 열릴 때마다 DB에서 투자세부유형 직접 조회
  useEffect(() => {
    const fetchMasterCodeData = async () => {
      // GROUP026: 투자세부유형
      const { data: group026Data } = await supabaseClient
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('codetype', 'subcode')
        .eq('group_code', 'GROUP026')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (group026Data) {
        setInvestmentDetailTypesFromDB(group026Data);
        console.log('✅ [InvestmentEditDialog] GROUP026 투자세부유형 DB 조회 완료:', group026Data.length, '개');
      }
    };

    if (open) {
      fetchMasterCodeData();
    }
  }, [open, supabaseClient]);

  // 투자금액 데이터 로드 (하드웨어 관리 패턴)
  useEffect(() => {
    const loadAmountItems = async () => {
      if (open && investment?.id) {
        console.log('🔄 투자금액 데이터 로드 중:', { investmentId: investment.id });
        try {
          const dbData = await getFinanceItems(investment.id);

          if (dbData && dbData.length > 0) {
            // DB 데이터를 UI 형식으로 변환
            const uiData = dbData.map((item) => {
              // subcode_name을 subcode로 역변환 (DB: "서버" → UI: "GROUP026-SUB001")
              const categorySubcode = investmentDetailTypesFromDB.find(
                t => t.subcode_name === item.investment_category
              )?.subcode || item.investment_category;

              return {
                id: item.id.toString(),
                no: item.item_order,
                investmentCategory: categorySubcode,
                itemName: item.item_name,
                budgetAmount: item.budget_amount,
                executionAmount: item.execution_amount,
                remarks: item.remarks || ''
              };
            });
            setAmountItems(uiData);
            console.log('✅ 투자금액 데이터 로드 완료:', { count: uiData.length });
          } else {
            setAmountItems([]);
          }
        } catch (error) {
          console.error('❌ 투자금액 데이터 로드 실패:', error);
          setAmountItems([]);
        }
      } else if (open && !investment) {
        setAmountItems([]);
      }
    };

    loadAmountItems();
  }, [open, investment?.id, getFinanceItems, investmentDetailTypesFromDB]);

  // 투자금액탭의 총합 계산 (amountItems 기반)
  const totalInvestmentAmount = useMemo(() => {
    return amountItems.reduce((sum, item) => sum + (item.budgetAmount || 0) + (item.executionAmount || 0), 0);
  }, [amountItems]);

  const [investmentState, setInvestmentState] = useReducer(
    (state: any, action: { type: string; payload?: any }) => {
      switch (action.type) {
        case 'SET_FIELD':
          return { ...state, [action.payload.field]: action.payload.value };
        case 'RESET':
          return action.payload || {};
        default:
          return state;
      }
    },
    {
      investmentName: '',
      description: '',
      investmentType: '',
      amount: 0,
      status: '대기',
      team: '',
      assignee: '',
      startDate: '',
      completedDate: '',
      registrationDate: new Date().toISOString().split('T')[0],
      code: '',
      expectedReturn: 0,
      riskLevel: '보통'
    }
  );

  // 투자 데이터 초기화
  useEffect(() => {
    if (investment && open) {
      const today = new Date().toISOString().split('T')[0];
      const regDate = investment.registrationDate || today;
      setInvestmentState({
        type: 'RESET',
        payload: {
          investmentName: investment.investmentName || '',
          description: investment.description || '',
          investmentType: investment.investmentType || '',
          amount: investment.amount || 0,
          status: investment.status || '대기',
          team: investment.team || '',
          assignee: investment.assignee || '',
          startDate: investment.startDate || regDate,
          completedDate: investment.completedDate || '',
          registrationDate: regDate,
          code: investment.code || '',
          expectedReturn: investment.expectedReturn || 0,
          riskLevel: investment.riskLevel || '보통'
        }
      });
    } else if (open) {
      const today = new Date().toISOString().split('T')[0];
      setInvestmentState({
        type: 'RESET',
        payload: {
          investmentName: '',
          description: '',
          investmentType: '',
          amount: 0,
          status: '대기',
          team: '',
          assignee: '',
          startDate: today,
          completedDate: '',
          registrationDate: today,
          code: '',
          expectedReturn: 0,
          riskLevel: '보통'
        }
      });
    }
  }, [investment, open]);

  // 투자 코드 자동 생성 (신규 생성 시에만)
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const initializeNewInvestmentCode = async () => {
      // 다이얼로그가 새로 열렸고, 기존 투자가 없으며, generateInvestmentCode 함수가 있을 때
      if (open && !prevOpenRef.current && !investment && generateInvestmentCode) {
        try {
          const newCode = await generateInvestmentCode();
          console.log('🔄 [InvestmentEditDialog] 자동 생성된 코드:', newCode);
          setInvestmentState({
            type: 'SET_FIELD',
            payload: { field: 'code', value: newCode }
          });
        } catch (error) {
          console.error('❌ [InvestmentEditDialog] 코드 생성 실패:', error);
        }
      }
    };

    initializeNewInvestmentCode();
    prevOpenRef.current = open;
  }, [open, investment, generateInvestmentCode]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleClose = useCallback(() => {
    setTabValue(0);
    setValidationError(''); // 에러 상태 초기화
    onClose();
  }, [onClose]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setInvestmentState({ type: 'SET_FIELD', payload: { field, value } });
  }, []);

  // 기록 관련 핸들러들 (DB 연동)
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !investment?.id || !currentUser) return;

    const result = await addFeedback({
      page: PAGE_IDENTIFIERS.INVESTMENT,
      record_id: String(investment.id),
      action_type: '기록 추가',
      description: newComment,
      user_name: currentUser.user_name,
      team: currentUser.department || '',
      user_department: currentUser.department,
      user_position: convertSubcodeName(currentUser.role || '', positionOptions),
      user_profile_image: currentUser.profile_image_url || currentUser.avatar_url,
      metadata: {
        role: ''
      }
    });

    if (result.success) {
      setNewComment('');
    }
  }, [newComment, investment, currentUser, addFeedback, positionOptions, convertSubcodeName]);

  const handleEditComment = useCallback((commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  }, []);

  const handleSaveEditComment = useCallback(async () => {
    if (!editingCommentText.trim() || !editingCommentId) return;

    const result = await updateFeedback(editingCommentId, {
      description: editingCommentText
    });

    if (result.success) {
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  }, [editingCommentText, editingCommentId, updateFeedback]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      await deleteFeedback(commentId);
    },
    [deleteFeedback]
  );

  const handleSave = useCallback(async () => {
    // 개요탭의 현재 입력 값 가져오기
    const getCurrentInputValues = () => {
      if ((window as any).getInvestmentOverviewTabCurrentValues) {
        return (window as any).getInvestmentOverviewTabCurrentValues();
      }
      return { investmentName: investmentState.investmentName, description: investmentState.description };
    };

    const currentValues = getCurrentInputValues();

    // 필수 입력 검증
    if (!currentValues.investmentName.trim()) {
      setValidationError('투자명을 입력해주세요.');
      return;
    }

    if (!investmentState.assignee.trim()) {
      setValidationError('담당자를 선택해주세요.');
      return;
    }

    if (!investmentState.investmentType.trim()) {
      setValidationError('투자유형을 선택해주세요.');
      return;
    }

    // 에러 초기화
    setValidationError('');

    try {
      console.log('💾 투자 데이터 저장 시작...');

      // progress는 DB에 저장하지 않으므로 제외
      const { progress, ...stateWithoutProgress } = investmentState;

      // 신규 생성 시 코드 자동 생성
      let investmentCode = investment?.code || '';
      if (!investment || !investment.id) {
        // 코드 자동 생성 (DB에서 직접 조회 - 캐시 무시)
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: latestInvestments } = await supabase
          .from('plan_investment_data')
          .select('code')
          .like('code', `PLAN-INV-${currentYear}-%`)
          .order('code', { ascending: false })
          .limit(1);

        let maxNumber = 0;
        if (latestInvestments && latestInvestments.length > 0) {
          const match = latestInvestments[0].code?.match(/PLAN-INV-\d{2}-(\d{3})$/);
          maxNumber = match ? parseInt(match[1], 10) : 0;
        }

        investmentCode = `PLAN-INV-${currentYear}-${String(maxNumber + 1).padStart(3, '0')}`;
        console.log('🆕 신규 투자 코드 생성:', investmentCode);
      }

      // Supabase DB 형식으로 변환
      const investmentData: any = {
        no: null, // DB에서 자동 관리
        registration_date: stateWithoutProgress.registrationDate || new Date().toISOString().split('T')[0],
        code: investmentCode,
        investment_type: stateWithoutProgress.investmentType || '',
        investment_name: currentValues.investmentName.trim(),
        amount: totalInvestmentAmount, // 투자금액탭의 총합
        team: stateWithoutProgress.team || '투자팀',
        assignee: stateWithoutProgress.assignee || null,
        status: stateWithoutProgress.status || '대기',
        start_date: stateWithoutProgress.startDate || null,
        completed_date: stateWithoutProgress.completedDate || null,
        expected_return: stateWithoutProgress.expectedReturn || 0,
        actual_return: stateWithoutProgress.actualReturn || null,
        risk_level: stateWithoutProgress.riskLevel || '보통',
        attachments: {
          description: currentValues.description?.trim() || '',
          files: stateWithoutProgress.attachments || []
        },
        created_by: 'system',
        updated_by: 'system',
        is_active: true
      };

      let savedData;

      // 1. DB에 투자 데이터 먼저 저장하고 ID 받기
      if (!investment || !investment.id) {
        // 신규 생성
        savedData = await createInvestment(investmentData);
        console.log('✅ 투자 생성 성공:', savedData);
      } else {
        // 기존 데이터 업데이트
        savedData = await updateInvestment(Number(investment.id), investmentData);
        console.log('✅ 투자 업데이트 성공:', savedData);
      }

      if (!savedData || !savedData.id) {
        throw new Error('투자 데이터 저장 실패: ID를 받지 못했습니다.');
      }

      // 2. 투자금액 데이터 저장 (savedData.id 사용)
      if (amountItems && amountItems.length > 0) {
        console.log('💾 투자금액 데이터 저장 중...', { investmentId: savedData.id, count: amountItems.length });

        const financeItems = amountItems.map((item: any, index: number) => {
          // subcode를 subcode_name으로 변환 (UI: "GROUP026-SUB001" → DB: "서버")
          const categoryName = investmentDetailTypesFromDB.find(
            t => t.subcode === item.investmentCategory
          )?.subcode_name || item.investmentCategory;

          return {
            investment_id: savedData.id,
            item_order: index + 1,
            investment_category: categoryName,
            item_name: item.itemName || '',
            budget_amount: parseFloat(item.budgetAmount) || 0,
            execution_amount: parseFloat(item.executionAmount) || 0,
            remarks: item.remarks || ''
          };
        });

        await saveFinanceItems(savedData.id, financeItems);
        console.log('✅ 투자금액 데이터 저장 완료');
      }

      // 3. 부모 컴포넌트에 알림 (UI 업데이트용)
      const resultInvestment = {
        ...investment,
        ...stateWithoutProgress,
        investmentName: currentValues.investmentName,
        description: currentValues.description,
        id: savedData.id,
        no: savedData.no || investment?.no || 0,
        code: savedData.code || investment?.code || '',
        registrationDate: savedData.registration_date || stateWithoutProgress.registrationDate,
        amount: totalInvestmentAmount
      };

      onSave(resultInvestment);

      // 토스트 알림
      if (setSnackbar) {
        const isNewInvestment = !investment;
        const investmentName = currentValues.investmentName || '투자';
        const lastChar = investmentName.charAt(investmentName.length - 1);
        const code = lastChar.charCodeAt(0);
        const hasJongseong = (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
        const josa = hasJongseong ? '이' : '가';

        setSnackbar({
          open: true,
          message: isNewInvestment
            ? `${investmentName}${josa} 등록되었습니다.`
            : `${investmentName}${josa} 수정되었습니다.`,
          severity: 'success'
        });
      }

      handleClose();
    } catch (error: any) {
      console.error('❌ 투자 저장 중 오류:', error);
      setValidationError(error.message || '저장 중 오류가 발생했습니다.');
    }
  }, [investment, investmentState, totalInvestmentAmount, amountItems, investmentDetailTypesFromDB, createInvestment, updateInvestment, saveFinanceItems, onSave, handleClose, setSnackbar]);

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
            투자관리 편집
          </Typography>
          {investment && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
              {investment.investmentName} ({investment.code})
            </Typography>
          )}
        </Box>

        {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={!canEdit}
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
            disabled={!canEdit}
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
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="개요" />
          <Tab label="투자금액" />
          <Tab label="기록" />
          <Tab label="자료" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            height: 'calc(840px - 100px)',
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
            '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '4px' }
          }}
        >
          {tabValue === 0 && (
            <InvestmentOverviewTab
              investmentState={investmentState}
              onFieldChange={handleFieldChange}
              assignees={assignees}
              assigneeAvatars={assigneeAvatars}
              statusOptions={statusOptions}
              statusColors={statusColors}
              investmentTypes={investmentTypes}
              teams={teams}
              totalInvestmentAmount={totalInvestmentAmount}
            />
          )}
          {tabValue === 1 && <InvestmentAmountTab mode={investment ? 'edit' : 'add'} investmentId={investment?.id} amountItems={amountItems} setAmountItems={setAmountItems} investmentDetailTypesFromDB={investmentDetailTypesFromDB} canEdit={canEdit} />}
          {tabValue === 2 && (
            <InvestmentRecordTab
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
              currentUserName={currentUser?.user_name || '현재 사용자'}
              currentUserAvatar={currentUser?.profile_image_url || currentUser?.avatar_url || ''}
              currentUserRole={convertSubcodeName(currentUser?.role || '', positionOptions)}
              currentUserDepartment={currentUser?.department || ''}
            />
          )}
          {tabValue === 3 && <InvestmentMaterialTab recordId={investment?.id} currentUser={currentUser} canEdit={canEdit} />}
        </Box>
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

export default InvestmentEditDialog;
