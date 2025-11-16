import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef } from 'react';
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
  Radio,
  Paper,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  SvgIcon,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemAvatar,
  LinearProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { TaskTableData, TaskStatus } from '../types/task';
import { useOptimizedInput } from '../hooks/useDebounce';
// import { usePerformanceMonitor } from '../utils/performance';
import supabase from '../lib/supabaseClient';
import { useSupabaseTaskManagement } from '../hooks/useSupabaseTaskManagement';
import { useSupabasePlanManagement, PlanItemInput } from '../hooks/useSupabasePlanManagement';
import useUser from '../hooks/useUser';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { useSession } from 'next-auth/react';
import { PAGE_IDENTIFIERS } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// KPI 목업 데이터 (fallback용)
import { taskData as mockKpiData } from '../data/kpi';

// 상태 관리를 위한 reducer
interface EditTaskState {
  workContent: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  code: string;
  registrationDate: string;
  completedDate: string;
  team: string;
  department: string;
  progress: number;
  taskType: '일반' | 'KPI';
  loadedKpiTitle: string; // 불러온 KPI 제목
  loadedKpiData: any | null; // 불러온 KPI 전체 데이터
}

type EditTaskAction =
  | { type: 'SET_FIELD'; field: keyof EditTaskState; value: string }
  | { type: 'SET_TASK'; task: TaskTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; code: string; registrationDate: string }
  | { type: 'SET_LOADED_KPI_DATA'; data: any | null };

const editTaskReducer = (state: EditTaskState, action: EditTaskAction): EditTaskState => {
  switch (action.type) {
    case 'SET_FIELD':
      // progress 필드는 숫자로 변환
      if (action.field === 'progress') {
        return { ...state, [action.field]: Number(action.value) || 0 };
      }
      return { ...state, [action.field]: action.value };
    case 'SET_TASK':
      // DB의 kpi_id와 kpi_work_content를 loadedKpiData로 재구성
      const taskAny = action.task as any;
      let reconstructedKpiData = null;
      if (taskAny.kpiId || taskAny.kpi_id) {
        reconstructedKpiData = {
          kpi_id: taskAny.kpiId || taskAny.kpi_id,
          kpi_work_content: taskAny.kpiWorkContent || taskAny.kpi_work_content
        };
      }

      return {
        workContent: action.task.workContent,
        description: taskAny.description || '',
        assignee: action.task.assignee,
        status: action.task.status,
        code: action.task.code,
        registrationDate: action.task.registrationDate || '',
        completedDate: action.task.completedDate || '',
        team: taskAny.team || '',
        department: taskAny.department || 'IT',
        progress: action.task.progress || 0,
        taskType: taskAny.taskType || '일반',
        loadedKpiTitle: taskAny.loadedKpiTitle || taskAny.kpi_work_content || '',
        loadedKpiData: taskAny.loadedKpiData || reconstructedKpiData
      };
    case 'INIT_NEW_TASK':
      return {
        workContent: '',
        description: '',
        assignee: '',
        status: '대기',
        code: action.code,
        registrationDate: action.registrationDate,
        completedDate: '',
        team: '',
        department: '',
        progress: 0,
        taskType: '',
        loadedKpiTitle: '',
        loadedKpiData: null
      };
    case 'RESET':
      return {
        workContent: '',
        description: '',
        progress: 0,
        assignee: '',
        status: '대기',
        code: '',
        registrationDate: '',
        completedDate: '',
        team: '',
        department: '',
        taskType: '',
        loadedKpiTitle: '',
        loadedKpiData: null
      };
    case 'SET_LOADED_KPI_DATA':
      return { ...state, loadedKpiData: action.data };
    default:
      return state;
  }
};

// 개요 탭 컴포넌트
const OverviewTab = memo(
  ({
    taskState,
    onFieldChange,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors,
    onOpenKpiDialog,
    taskTypeOptions,
    departmentOptions,
    statusOptionsFromDB,
    teamOptions,
    userOptions,
    users
  }: {
    taskState: EditTaskState;
    onFieldChange: (field: keyof EditTaskState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: TaskStatus[];
    statusColors: Record<TaskStatus, any>;
    onOpenKpiDialog?: () => void;
    taskTypeOptions: Array<{ code: string; name: string }>;
    departmentOptions: Array<{ code: string; name: string }>;
    statusOptionsFromDB: Array<{ code: string; name: string }>;
    teamOptions: Array<{ code: string; name: string }>;
    userOptions: Array<{ code: string; name: string; profileImage?: string }>;
    users: any[];
  }) => {
    // TextField 직접 참조를 위한 ref
    const workContentRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // DB에서 직접 조회한 마스터코드 데이터
    const [departmentsFromDB, setDepartmentsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog가 열릴 때마다 DB에서 최신 마스터코드 데이터 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        try {
          // GROUP031: 업무분류
          const { data: group031Data } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name, subcode_order')
            .eq('codetype', 'subcode')
            .eq('group_code', 'GROUP031')
            .eq('is_active', true)
            .order('subcode_order', { ascending: true });

          if (group031Data) {
            setDepartmentsFromDB(group031Data);
            console.log('✅ [TaskOverviewTab] GROUP031 업무분류 DB 조회 완료:', group031Data.length, '개');
          }

          // GROUP002: 상태
          const { data: group002Data } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name, subcode_order')
            .eq('codetype', 'subcode')
            .eq('group_code', 'GROUP002')
            .eq('is_active', true)
            .order('subcode_order', { ascending: true });

          if (group002Data) {
            setStatusTypesFromDB(group002Data);
            console.log('✅ [TaskOverviewTab] GROUP002 상태 DB 조회 완료:', group002Data.length, '개');
          }
        } catch (error) {
          console.error('❌ [TaskOverviewTab] 마스터코드 조회 실패:', error);
        }
      };

      fetchMasterCodeData();
    }, []);

    // 텍스트 필드용 최적화된 입력 관리
    const workContentInput = useOptimizedInput(taskState.workContent, 150);
    const descriptionInput = useOptimizedInput(taskState.description, 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림 (onFieldChange 의존성 제거로 최적화)
    useEffect(() => {
      if (!isUpdatingRef.current && workContentInput.debouncedValue !== taskState.workContent) {
        onFieldChange('workContent', workContentInput.debouncedValue);
      }
    }, [workContentInput.debouncedValue, taskState.workContent]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && descriptionInput.debouncedValue !== taskState.description) {
        onFieldChange('description', descriptionInput.debouncedValue);
      }
    }, [descriptionInput.debouncedValue, taskState.description]); // onFieldChange 제거

    // 외부에서 상태가 변경될 때 입력 값 동기화 (reset 함수 의존성 제거로 최적화)
    useEffect(() => {
      if (taskState.workContent !== workContentInput.inputValue && taskState.workContent !== workContentInput.debouncedValue) {
        isUpdatingRef.current = true;
        workContentInput.reset(taskState.workContent);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.workContent, workContentInput.inputValue, workContentInput.debouncedValue]); // reset 제거

    useEffect(() => {
      if (taskState.description !== descriptionInput.inputValue && taskState.description !== descriptionInput.debouncedValue) {
        isUpdatingRef.current = true;
        descriptionInput.reset(taskState.description);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.description, descriptionInput.inputValue, descriptionInput.debouncedValue]); // reset 제거

    const handleFieldChange = useCallback(
      (field: keyof EditTaskState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
        onFieldChange(field, e.target.value);
      },
      []
    ); // onFieldChange 의존성 제거로 최적화

    // 현재 입력 값들을 반환하는 함수 (의존성 배열 제거로 최적화)
    const getCurrentValues = useCallback(() => {
      return {
        workContent: workContentRef.current?.value || workContentInput.inputValue,
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
          {/* 제목 - 전체 너비 */}
          <TextField
            fullWidth
            label={
              <span>
                제목 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={workContentInput.inputValue}
            onChange={(e) => workContentInput.handleChange(e.target.value)}
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

          {/* 업무유형, 불러온 KPI 타이틀, KPI 불러오기 - 한 줄 배치 */}
          <Stack direction="row" spacing={2}>
            {/* 업무유형 - 업무분류와 정확히 동일한 1/3 크기 */}
            <FormControl sx={{ width: '30%' }} required>
              <InputLabel
                shrink
                required
                sx={{
                  '& .MuiInputLabel-asterisk': {
                    color: 'error.main'
                  }
                }}
              >
                업무유형
              </InputLabel>
              <Select
                value={taskState.taskType}
                label="업무유형"
                onChange={handleFieldChange('taskType')}
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';
                  return selected;
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {taskTypeOptions.map((option) => (
                  <MenuItem key={option.code} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 불러온 KPI 타이틀 표시 영역 */}
            <Box
              sx={{
                flex: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {taskState.loadedKpiData && (
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    overflow: 'hidden'
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 0.5, px: 1 }}>개요</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 0.5, px: 1 }}>Main</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 0.5, px: 1 }}>Sub</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 0.5, px: 1 }}>팀</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 0.5, px: 1 }}>담당자</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>{taskState.loadedKpiData.kpi_work_content || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>
                          {taskState.loadedKpiData.level === 0
                            ? taskState.loadedKpiData.text
                            : taskState.loadedKpiData.parent_task_text || '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>
                          {taskState.loadedKpiData.level === 1 ? taskState.loadedKpiData.text : '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>{taskState.loadedKpiData.team || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}>{taskState.loadedKpiData.assignee || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}

              {!taskState.loadedKpiData && (
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1.5,
                    py: 0.75
                  }}
                >
                  <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                    KPI를 불러와서 업무를 생성하세요
                  </Typography>
                </Box>
              )}
            </Box>

            {/* KPI 불러오기 버튼 */}
            <Button
              variant="text"
              onClick={() => onOpenKpiDialog && onOpenKpiDialog()}
              disabled={taskState.taskType === '일반'}
              sx={{
                height: '40px',
                minWidth: '90px',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: taskState.taskType === '일반' ? 'text.disabled' : 'primary.main',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease-in-out'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              불러오기
            </Button>
          </Stack>

          {/* 업무분류, 진행율, 상태 - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth required>
              <InputLabel
                shrink
                required
                sx={{
                  '& .MuiInputLabel-asterisk': {
                    color: 'error.main'
                  }
                }}
              >
                업무분류
              </InputLabel>
              <Select
                value={taskState.department}
                label="업무분류"
                onChange={handleFieldChange('department')}
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';
                  return selected;
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {departmentsFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="진행율 (%)"
              type="number"
              value={taskState.progress || 0}
              onChange={(e) => {
                const value = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                console.log('📊 [Task 진행율] 입력값:', e.target.value, '→ 제한된 값:', value);
                onFieldChange('progress', String(value));
              }}
              InputProps={{
                inputProps: { min: 0, max: 100, step: 1 }
              }}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={taskState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '';
                  const item = statusTypesFromDB.find((t) => t.subcode_name === selected);
                  const statusName = item ? item.subcode_name : selected;
                  const getStatusColor = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                      case '진행':
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
                      case '홀딩':
                        return { bgcolor: '#FFEBEE', color: '#D32F2F' };
                      default:
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                    }
                  };
                  return (
                    <Chip
                      label={statusName}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(statusName).bgcolor,
                        color: getStatusColor(statusName).color,
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
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
                      case '홀딩':
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
              value={(taskState as any).startDate || taskState.registrationDate}
              onChange={handleFieldChange('startDate' as any)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="완료일"
              type="date"
              value={taskState.completedDate}
              onChange={handleFieldChange('completedDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Stack>

          {/* 팀과 담당자 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              disabled
              label="팀"
              required
              value={taskState.team || ''}
              InputLabelProps={{
                shrink: true,
                sx: {
                  '& .MuiInputLabel-asterisk': {
                    color: 'red'
                  }
                }
              }}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            />

            <TextField
              fullWidth
              disabled
              label="담당자"
              required
              value={taskState.assignee || ''}
              InputLabelProps={{
                shrink: true,
                sx: {
                  '& .MuiInputLabel-asterisk': {
                    color: 'red'
                  }
                }
              }}
              InputProps={{
                startAdornment: (() => {
                  const assigneeUser = users.find((user) => user.user_name === taskState.assignee);
                  const avatarUrl = assigneeUser ? (assigneeUser.profile_image_url || assigneeUser.avatar_url) : '';
                  console.log('👤 [업무관리 담당자 필드] 프로필 이미지:', {
                    assignee: taskState.assignee,
                    found: !!assigneeUser,
                    profile_image_url: assigneeUser?.profile_image_url,
                    avatar_url: assigneeUser?.avatar_url,
                    selected: avatarUrl
                  });
                  return (
                    assigneeUser && (
                      <Avatar
                        src={avatarUrl}
                        alt={assigneeUser.user_name}
                        sx={{ width: 24, height: 24, mr: 0.25 }}
                      >
                        {assigneeUser.user_name?.charAt(0)}
                      </Avatar>
                    )
                  );
                })()
              }}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.7)'
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
              value={taskState.registrationDate}
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
              value={taskState.code}
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

// 계획 탭 컴포넌트
const PlanTab = memo(
  ({
    checklistItems,
    onChecklistChange,
    newChecklistText,
    onNewChecklistChange,
    onAddChecklistItem,
    editingChecklistId,
    editingChecklistText,
    onEditChecklistItem,
    onSaveEditChecklistItem,
    onCancelEditChecklistItem,
    onDeleteChecklistItem,
    onEditTextChange,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onToggleExpanded,
    onStatusChange,
    onDueDateChange,
    onProgressRateChange,
    onPriorityChange,
    onStartDateChange,
    draggedItemId,
    setEditingChecklistId,
    setEditingField,
    setEditingProgressValue,
    canEdit = true
  }: any) => {
    // 필터 및 뷰 모드 상태 관리
    const [filter, setFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('list');

    // 진척률 편집 상태 관리는 props로 받은 함수들 사용

    const handleChecklistKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onAddChecklistItem();
        }
      },
      [onAddChecklistItem]
    );

    const handleFilterChange = useCallback((event: React.MouseEvent<HTMLElement>, newFilter: string | null) => {
      if (newFilter !== null) {
        setFilter(newFilter);
      }
    }, []);

    const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newViewMode: 'list' | 'kanban' | 'gantt' | null) => {
      if (newViewMode !== null) {
        setViewMode(newViewMode);
      }
    }, []);

    // 계층 구조 구성
    const buildHierarchy = useCallback((items: any[]) => {
      const itemMap = new Map();
      const rootItems: any[] = [];

      // 모든 항목을 맵에 저장
      items.forEach((item) => {
        itemMap.set(item.id, { ...item, children: [] });
      });

      // 부모-자식 관계 구성
      items.forEach((item) => {
        const mappedItem = itemMap.get(item.id);
        if (item.parentId && itemMap.has(item.parentId)) {
          itemMap.get(item.parentId).children.push(mappedItem);
        } else {
          rootItems.push(mappedItem);
        }
      });

      return rootItems;
    }, []);

    // 필터링된 체크리스트 항목들
    const filteredChecklistItems = useMemo(() => {
      let filtered = checklistItems;
      if (filter === '대기') {
        filtered = checklistItems.filter((item: any) => item.status === '대기');
      } else if (filter === '진행') {
        filtered = checklistItems.filter((item: any) => item.status === '진행');
      } else if (filter === '완료') {
        filtered = checklistItems.filter((item: any) => item.status === '완료');
      } else if (filter === '취소') {
        filtered = checklistItems.filter((item: any) => item.status === '취소');
      }
      return buildHierarchy(filtered);
    }, [checklistItems, filter, buildHierarchy]);

    // 필터별 개수 계산
    const filterCounts = useMemo(() => {
      // 모든 뷰에서 전체 카운트
      const total = checklistItems.length;
      const waiting = checklistItems.filter((item: any) => item.status === '대기').length;
      const inProgress = checklistItems.filter((item: any) => item.status === '진행').length;
      const completed = checklistItems.filter((item: any) => item.status === '완료').length;
      const cancelled = checklistItems.filter((item: any) => item.status === '취소').length;
      return { total, waiting, inProgress, completed, cancelled };
    }, [checklistItems]);

    // 하위 항목 개수 계산
    const getChildrenCount = useCallback(
      (parentId: number) => {
        return checklistItems.filter((item: any) => item.parentId === parentId).length;
      },
      [checklistItems]
    );

    // 체크리스트 항목 렌더링 (재귀적)
    const renderChecklistItem = useCallback(
      (
        item: any,
        allItems: any[],
        editingId: number | null,
        editingText: string,
        onToggle: any,
        onEdit: any,
        onSave: any,
        onCancel: any,
        onDelete: any,
        onTextChange: any,
        onDragStart: any,
        onDragOver: any,
        onDrop: any,
        onDragEnd: any,
        onToggleExpanded: any,
        getChildrenCount: any,
        onStatusChange: any,
        onDueDateChange: any,
        onProgressRateChange: any,
        draggedItemId: number | null
      ): React.ReactNode => {
        const originalIndex = allItems.findIndex((originalItem: any) => originalItem.id === item.id);
        const childrenCount = getChildrenCount(item.id);
        const hasChildren = childrenCount > 0;

        return (
          <Box key={item.id} sx={{ mb: 1 }}>
            <Paper
              variant="outlined"
              draggable
              onDragStart={(e) => onDragStart(e, item.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, item.id)}
              onDragEnd={onDragEnd}
              sx={{
                p: 1.2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: item.status === '취소' ? 'error.light' : item.checked || item.status === '완료' ? 'success.light' : 'grey.300',
                backgroundColor:
                  item.status === '취소'
                    ? 'error.50'
                    : item.checked || item.status === '완료'
                      ? 'success.50'
                      : item.level === 0
                        ? '#fafafa'
                        : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                marginLeft: `${item.level * 20}px`,
                cursor: 'move',
                opacity: draggedItemId === item.id ? 0.5 : 1,
                '&:hover': {
                  borderColor:
                    item.status === '취소' ? 'error.main' : item.checked || item.status === '완료' ? 'success.main' : 'primary.light',
                  boxShadow: 1
                }
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                {/* 계층 레벨 표시 */}
                {item.level > 0 && (
                  <Chip
                    label={`L${item.level}`}
                    size="small"
                    sx={{
                      height: '18px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      backgroundColor: 'primary.100',
                      color: 'primary.dark'
                    }}
                  />
                )}

                {/* 접기/펼치기 버튼 */}
                {hasChildren && (
                  <IconButton size="small" onClick={() => onToggleExpanded(item.id)} sx={{ p: 0.4 }}>
                    <ExpandIcon expanded={item.expanded} />
                  </IconButton>
                )}

                {/* 체크박스 */}
                <Checkbox
                  checked={item.checked || item.status === '완료' || item.status === '취소'}
                  onChange={() => onToggle(originalIndex)}
                  color={item.status === '취소' ? 'error' : 'success'}
                  sx={{ p: 0 }}
                  size="small"
                />

                {/* 텍스트 영역 */}
                <Box sx={{ flexGrow: 1 }}>
                  {editingId === item.id ? (
                    <TextField
                      fullWidth
                      value={editingText}
                      onChange={(e) => onTextChange(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') onSave();
                        if (e.key === 'Escape') onCancel();
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
                        textDecoration: item.checked || item.status === '완료' || item.status === '취소' ? 'line-through' : 'none',
                        opacity: item.checked || item.status === '완료' || item.status === '취소' ? 0.7 : 1,
                        color: item.status === '취소' ? '#c62828' : item.checked || item.status === '완료' ? '#2e7d32' : 'text.primary',
                        fontWeight: item.checked || item.status === '완료' || item.status === '취소' ? 400 : 500,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderRadius: 1,
                          px: 1
                        }
                      }}
                      onClick={() => onEdit(item.id, item.text)}
                    >
                      {item.text}
                    </Typography>
                  )}
                </Box>

                {/* 상태 선택 */}
                <Box sx={{ minWidth: '80px', mr: 1 }}>
                  <Select
                    value={item.status || '대기'}
                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                    size="small"
                    displayEmpty
                    variant="standard"
                    disableUnderline
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      px: 1,
                      backgroundColor:
                        item.status === '완료'
                          ? '#c8e6c9'
                          : item.status === '취소'
                            ? '#ffcdd2'
                            : item.status === '진행'
                              ? '#e1f5fe'
                              : '#fff3cd',
                      '& .MuiSelect-select': {
                        fontSize: '12px',
                        py: 0.5,
                        border: 'none',
                        color:
                          item.status === '완료'
                            ? '#2e7d32'
                            : item.status === '취소'
                              ? '#c62828'
                              : item.status === '진행'
                                ? '#0c5460'
                                : '#663c00'
                      }
                    }}
                  >
                    <MenuItem value="대기" sx={{ fontSize: '12px' }}>
                      대기
                    </MenuItem>
                    <MenuItem value="진행" sx={{ fontSize: '12px' }}>
                      진행
                    </MenuItem>
                    <MenuItem value="완료" sx={{ fontSize: '12px' }}>
                      완료
                    </MenuItem>
                    <MenuItem value="취소" sx={{ fontSize: '12px' }}>
                      취소
                    </MenuItem>
                  </Select>
                </Box>

                {/* 진척율 표시 - 프로그레스 바 안에 텍스트 입력 (스크린샷과 동일) */}
                <Box sx={{ minWidth: '108px', mr: 1 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '19.44px'
                    }}
                  >
                    {/* 파란색 그래디언트 프로그레스 바 배경 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#f0f0f0',
                        borderRadius: '9.72px',
                        overflow: 'hidden',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      {/* 파란색 진행 바 */}
                      <Box
                        sx={{
                          width: `${item.progressRate || 0}%`,
                          height: '100%',
                          backgroundColor: '#2196f3',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </Box>

                    {/* 중앙 텍스트 입력 필드 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0px',
                        zIndex: 1
                      }}
                    >
                      <TextField
                        type="number"
                        value={item.progressRate || 0}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, Number(e.target.value)));
                          onProgressRateChange(item.id, value);
                        }}
                        size="small"
                        variant="standard"
                        inputProps={{
                          min: 0,
                          max: 100,
                          style: {
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: item.progressRate > 50 ? '#fff' : '#333',
                            padding: '0'
                          }
                        }}
                        sx={{
                          width: '25px',
                          '& .MuiInput-root': {
                            '&:before': {
                              borderBottom: 'none'
                            },
                            '&:after': {
                              borderBottom: 'none'
                            },
                            '&:hover:not(.Mui-disabled):before': {
                              borderBottom: 'none'
                            }
                          },
                          '& input': {
                            textShadow: item.progressRate > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                            '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0
                            },
                            MozAppearance: 'textfield'
                          }
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: item.progressRate > 50 ? '#fff' : '#666',
                          textShadow: item.progressRate > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        %
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 우선도 선택 */}
                <Box sx={{ minWidth: '80px', mr: 1 }}>
                  <Select
                    value={item.priority || 'Medium'}
                    onChange={(e) => onPriorityChange && onPriorityChange(item.id, e.target.value as 'High' | 'Medium' | 'Low')}
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{
                      width: '100%',
                      fontSize: '12px',
                      '& .MuiSelect-select': {
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      },
                      '& .MuiSelect-icon': {
                        fontSize: '14px'
                      }
                    }}
                    renderValue={(value) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Box
                          sx={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: value === 'High' ? '#ef4444' : value === 'Medium' ? '#f97316' : '#374151'
                          }}
                        />
                        <Typography sx={{ fontSize: '11px', color: '#666' }}>
                          {value === 'High' ? '중요' : value === 'Medium' ? '일반' : '낮음'}
                        </Typography>
                      </Box>
                    )}
                  >
                    <MenuItem value="High" sx={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      중요
                    </MenuItem>
                    <MenuItem value="Medium" sx={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }} />
                      일반
                    </MenuItem>
                    <MenuItem value="Low" sx={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#374151' }} />
                      낮음
                    </MenuItem>
                  </Select>
                </Box>

                {/* 시작일 선택 */}
                <Box sx={{ minWidth: '120px', mr: 1 }}>
                  <TextField
                    type="date"
                    value={item.startDate || ''}
                    onChange={(e) => onStartDateChange && onStartDateChange(item.id, e.target.value)}
                    size="small"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="시작일"
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      px: 1,
                      '& .MuiInputBase-input': {
                        fontSize: '12px',
                        py: 0.5,
                        border: 'none'
                      }
                    }}
                  />
                </Box>

                {/* 완료일 선택 */}
                <Box sx={{ minWidth: '120px', mr: 1 }}>
                  <TextField
                    type="date"
                    value={item.dueDate || ''}
                    onChange={(e) => onDueDateChange(item.id, e.target.value)}
                    size="small"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      px: 1,
                      '& .MuiInputBase-input': {
                        fontSize: '12px',
                        py: 0.5,
                        border: 'none'
                      }
                    }}
                  />
                </Box>

                {/* 액션 버튼들 */}
                <Stack direction="row" spacing={0.4}>
                  {editingId === item.id ? (
                    <>
                      <IconButton size="small" onClick={onSave} color="success" sx={{ p: 0.4 }}>
                        <Typography fontSize="10px">✓</Typography>
                      </IconButton>
                      <IconButton size="small" onClick={onCancel} color="error" sx={{ p: 0.4 }}>
                        <Typography fontSize="10px">✕</Typography>
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => onEdit(item.id, item.text)} color="primary" sx={{ p: 0.4 }} title="수정">
                        <Typography fontSize="10px">✏️</Typography>
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(item.id)} color="error" sx={{ p: 0.4 }} title="삭제">
                        <Typography fontSize="10px">🗑️</Typography>
                      </IconButton>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* 하위 항목들 렌더링 */}
            {hasChildren && item.expanded && (
              <Box sx={{ mt: 1 }}>
                {item.children.map((child: any) =>
                  renderChecklistItem(
                    child,
                    allItems,
                    editingId,
                    editingText,
                    onToggle,
                    onEdit,
                    onSave,
                    onCancel,
                    onDelete,
                    onTextChange,
                    onDragStart,
                    onDragOver,
                    onDrop,
                    onDragEnd,
                    onToggleExpanded,
                    getChildrenCount,
                    onStatusChange,
                    onDueDateChange,
                    onProgressRateChange,
                    draggedItemId
                  )
                )}
              </Box>
            )}
          </Box>
        );
      },
      []
    );

    // 칸반 뷰 렌더링
    const renderKanbanView = useCallback(() => {
      const statusColumns = [
        { key: '대기', title: '대기', pillColor: '#6E6E75', textColor: '#fff' },
        { key: '진행', title: '진행', pillColor: '#3DA9FF', textColor: '#fff' },
        { key: '완료', title: '완료', pillColor: '#D6F231', textColor: '#333' },
        { key: '취소', title: '취소', pillColor: '#F44336', textColor: '#fff' }
      ];

      const getItemsByStatus = (status: string) => {
        // 필터가 전체가 아니고 특정 상태를 선택했을 때
        if (filter !== 'all' && filter !== status) {
          return []; // 선택한 필터와 다른 상태 컬럼은 비어있게
        }

        return checklistItems.filter((item) => {
          // 해당 상태 컬럼에 맞는 항목만 표시 (레벨 0, 1 모두 포함)
          return item.status === status;
        });
      };

      return (
        <Box
          sx={{
            fontFamily: '"Inter", "Noto Sans KR", sans-serif'
          }}
        >
          <style>{`
          .kanban-board {
            display: flex;
            gap: 16px;
            padding: 0 8px;
            overflow-x: hidden;
            width: 100%;
          }
          .kanban-column {
            width: calc((100% - 64px) / 4);
            min-width: 200px;
            display: flex;
            flex-direction: column;
            row-gap: 16px;
            flex-shrink: 1;
          }
          .column-header {
            display: flex;
            align-items: center;
          }
          .pill {
            padding: 2px 12px;
            border-radius: 9999px;
            font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
          }
          .count {
            font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
            margin-left: 8px;
            color: #606060;
          }
          .kanban-card {
            background: #fff;
            border: 1px solid #E4E6EB;
            border-radius: 10px;
            padding: 12px 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,.05);
            display: flex;
            flex-direction: column;
            row-gap: 10px;
            transition: all 0.2s ease;
          }
          .kanban-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,.1);
            transform: translateY(-1px);
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .card-title {
            font: 400 14px/1.4 "Inter", "Noto Sans KR", sans-serif;
            color: #252525;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }
          .level-chip {
            height: 18px;
            padding: 2px 6px;
            border-radius: 9px;
            font: 400 9px/1 "Inter", "Noto Sans KR", sans-serif;
            background-color: #e3f2fd;
            color: #1565c0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 8px;
            flex-shrink: 0;
          }
          .assign-row {
            display: flex;
            align-items: center;
            column-gap: 6px;
            font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
            color: #8C8C8C;
          }
          .progress-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #8C8C8C;
          }
          .progress-bar {
            flex: 1;
            height: 8px;
            background: #E0E0E0;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: #21B530;
            transition: width 0.3s ease;
          }
          .percent {
            min-width: 32px;
            text-align: right;
            font-weight: 400;
            color: #606060;
          }
          
          @media (max-width: 768px) {
            .kanban-column {
              width: calc((100% - 64px) / 4);
              min-width: 160px;
            }
          }
        `}</style>

          <div className="kanban-board">
            {statusColumns.map((column) => {
              const items = getItemsByStatus(column.key);
              return (
                <section key={column.key} className="kanban-column">
                  <header className="column-header">
                    <span
                      className="pill"
                      style={{
                        background: column.pillColor,
                        color: column.textColor
                      }}
                    >
                      {column.title}
                    </span>
                    <span className="count">{items.length}</span>
                  </header>

                  {items.map((item) => (
                    <article key={item.id} className="kanban-card">
                      <div className="title-row">
                        <h3 className="card-title">{item.text}</h3>
                        <span className="level-chip">L{item.level || 0}</span>
                      </div>

                      <div className="assign-row">
                        <span>Deadline:</span>
                        <span
                          style={{
                            color: item.dueDate ? '#606060' : '#C0C0C0',
                            fontStyle: item.dueDate ? 'normal' : 'italic'
                          }}
                        >
                          {item.dueDate || '미정'}
                        </span>
                      </div>

                      {/* Progress 항상 표시 */}
                      <div className="progress-row">
                        <span>Progress:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${item.progressRate || 0}%` }} />
                        </div>
                        <span className="percent">{item.progressRate || 0}%</span>
                      </div>
                    </article>
                  ))}

                  {items.length === 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '32px 16px',
                        color: '#8C8C8C',
                        fontSize: '12px'
                      }}
                    >
                      {column.title} 상태인 항목이 없습니다
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </Box>
      );
    }, [checklistItems, filter]);

    // 간트차트 뷰 렌더링 (스크린샷과 완전히 동일)
    const renderGanttView = useCallback(() => {
      // 날짜가 설정된 항목들만 필터링
      const itemsWithDates = checklistItems.filter((item: any) => item.startDate && item.dueDate);

      if (itemsWithDates.length === 0) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              backgroundColor: '#fafafa',
              borderRadius: 1
            }}
          >
            <Typography variant="body2" color="text.secondary">
              시작일과 완료일이 모두 설정된 계획 항목이 없습니다.
            </Typography>
          </Box>
        );
      }

      // 날짜 범위 계산
      const allDates = itemsWithDates.flatMap((item: any) => [new Date(item.startDate), new Date(item.dueDate)]);
      const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

      // 월 단위로 확장
      const displayMinDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const displayMaxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      const totalDays = Math.ceil((displayMaxDate.getTime() - displayMinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // 월별 헤더 생성
      const months = [];
      const current = new Date(displayMinDate);
      while (current <= displayMaxDate) {
        const startDate = new Date(current.getFullYear(), current.getMonth(), 1);
        const endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        months.push({
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          label: `${current.getFullYear()}년 ${current.getMonth() + 1}월`,
          startDate,
          endDate
        });
        current.setMonth(current.getMonth() + 1);
      }

      // 간트 바 계산
      const calculateGanttBar = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const startOffset = Math.max(0, (start.getTime() - displayMinDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);

        const leftPercent = Math.min(100, Math.max(0, (startOffset / totalDays) * 100));
        const widthPercent = Math.min(100 - leftPercent, Math.max(1, (duration / totalDays) * 100));

        return {
          left: leftPercent,
          width: widthPercent,
          startDate: start,
          endDate: end
        };
      };

      // 상태에 따른 색상 결정
      const getBarColor = (progressRate: number, status: string) => {
        if (status === '완료') return '#4caf50'; // 녹색
        if (status === '진행') return '#2196f3'; // 파란색
        if (status === '대기') return '#9e9e9e'; // 회색
        return '#2196f3'; // 기본값 파란색
      };

      // 계층 구조 처리 (확장/축소) + 필터링
      const getVisibleItems = (items: any[]) => {
        const result = [];
        const collapsedParents = new Set();

        for (const item of items) {
          // 부모가 축소된 경우 건너뛰기
          if (item.parentId && collapsedParents.has(item.parentId)) {
            continue;
          }

          // 레벨 0 (최우선 리스트)는 항상 표시
          if (item.level === 0) {
            result.push(item);

            if (!item.expanded) {
              collapsedParents.add(item.id);
            }
          } else {
            // 하위 리스트는 필터 상태에 따라 표시
            if (filter === 'all' || item.status === filter) {
              result.push(item);
            }
          }
        }

        return result;
      };

      const visibleItems = getVisibleItems(itemsWithDates);

      return (
        <Box
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: 1
          }}
        >
          {/* 헤더 영역 */}
          <Box
            sx={{
              display: 'flex',
              borderBottom: '2px solid #e9ecef'
            }}
          >
            {/* 작업명 헤더 */}
            <Box
              sx={{
                width: '245px',
                minWidth: '245px',
                p: 2,
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#495057',
                borderRight: '1px solid #dee2e6',
                position: 'sticky',
                left: 0,
                backgroundColor: '#ffffff',
                zIndex: 2
              }}
            >
              작업명
            </Box>

            {/* 시작일/종료일 헤더 */}
            <Box
              sx={{
                width: '140px',
                minWidth: '140px',
                p: 2,
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#495057',
                borderRight: '1px solid #dee2e6',
                textAlign: 'center',
                position: 'sticky',
                left: '245px',
                backgroundColor: '#ffffff',
                zIndex: 2
              }}
            >
              시작일/종료일
            </Box>

            {/* 월별 헤더 */}
            <Box
              sx={{
                display: 'flex',
                flex: 1
              }}
            >
              {months.map((month, index) => (
                <Box
                  key={`${month.year}-${month.month}`}
                  sx={{
                    flex: 1,
                    minWidth: '120px',
                    p: 2,
                    textAlign: 'center',
                    borderRight: index < months.length - 1 ? '1px solid #dee2e6' : 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#495057'
                  }}
                >
                  {month.label}
                </Box>
              ))}
            </Box>
          </Box>

          {/* 간트차트 본문 */}
          <Box>
            {visibleItems.map((item: any, index: number) => {
              const barData = calculateGanttBar(item.startDate, item.dueDate);
              const hasChildren = checklistItems.some((child: any) => child.parentId === item.id);
              const barColor = getBarColor(item.progressRate || 0, item.status);
              const progressWidth = item.status === '완료' ? 100 : item.status === '대기' ? 0 : Math.min(100, item.progressRate || 0);

              return (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    backgroundColor: item.level === 0 ? '#fafafa' : '#ffffff',
                    borderBottom: '1px solid #f1f3f4',
                    borderTop: item.level === 0 ? '0.5px solid #dee2e6' : 'none',
                    minHeight: '48px',
                    width: '100%',
                    '&:hover': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  {/* 작업명 영역 */}
                  <Box
                    sx={{
                      width: '245px',
                      minWidth: '245px',
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRight: '1px solid #f1f3f4',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: item.level === 0 ? '#fafafa' : '#ffffff',
                      zIndex: 1
                    }}
                  >
                    {/* 작업명 */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        ml: item.level * 2
                      }}
                    >
                      {/* 확장/축소 아이콘 */}
                      {item.level === 0 && hasChildren && (
                        <IconButton
                          size="small"
                          onClick={() => onToggleExpanded(item.id)}
                          sx={{
                            p: 0.25,
                            mr: 0.5,
                            color: '#666',
                            '&:hover': { backgroundColor: '#f0f0f0' }
                          }}
                        >
                          <Typography fontSize="12px">{item.expanded ? '▼' : '▶'}</Typography>
                        </IconButton>
                      )}

                      {/* 하위 작업 연결선 */}
                      {item.level > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mr: 1
                          }}
                        >
                          <Box
                            sx={{
                              width: '12px',
                              height: '1px',
                              backgroundColor: '#ccc',
                              mr: 0.5
                            }}
                          />
                        </Box>
                      )}

                      <Typography
                        sx={{
                          fontSize: item.level === 0 ? '14px' : '13px',
                          fontWeight: item.level === 0 ? 'bold' : 'normal',
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>

                    {/* 상태와 진행률 */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        ml: item.level * 2 + (item.level === 0 && hasChildren ? 3.5 : item.level > 0 ? 2.5 : 0),
                        mt: 0.5
                      }}
                    >
                      {/* 상태 점 */}
                      <Box
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor:
                            item.priority === 'High'
                              ? '#f44336'
                              : item.priority === 'Medium'
                                ? '#ff9800'
                                : item.priority === 'Low'
                                  ? '#424242'
                                  : '#ff9800',
                          mr: 1,
                          flexShrink: 0
                        }}
                      />

                      {/* 상태와 진행률 텍스트 */}
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.priority === 'High'
                          ? '중요'
                          : item.priority === 'Medium'
                            ? '일반'
                            : item.priority === 'Low'
                              ? '낮음'
                              : '일반'}{' '}
                        • {item.status || '진행'} • {item.progressRate || 0}%
                      </Typography>
                    </Box>
                  </Box>

                  {/* 시작일/종료일 컬럼 */}
                  <Box
                    sx={{
                      width: '140px',
                      minWidth: '140px',
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRight: '1px solid #f1f3f4',
                      position: 'sticky',
                      left: '245px',
                      backgroundColor: item.level === 0 ? '#fafafa' : '#ffffff',
                      zIndex: 1
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#333',
                        lineHeight: 1.4
                      }}
                    >
                      {item.startDate || '미설정'}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#333',
                        lineHeight: 1.4
                      }}
                    >
                      {item.dueDate || '미설정'}
                    </Typography>
                  </Box>

                  {/* 간트바 영역 */}
                  <Box
                    sx={{
                      flex: 1,
                      position: 'relative',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {/* 월별 구분선 */}
                      {months.map((month, index) => (
                        <Box
                          key={`divider-${month.year}-${month.month}`}
                          sx={{
                            position: 'absolute',
                            left: `${(index / months.length) * 100}%`,
                            width: '1px',
                            height: '100%',
                            backgroundColor: '#e8e8e8',
                            zIndex: 0
                          }}
                        />
                      ))}
                      {barData && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${barData.left}%`,
                            width: `${barData.width}%`,
                            height: '24px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                        >
                          {/* 전체 기간 바 (연한 색상) */}
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: `${barColor}30`,
                              position: 'relative'
                            }}
                          >
                            {/* 진행률 바 (진한 색상) */}
                            <Box
                              sx={{
                                width: `${progressWidth}%`,
                                height: '100%',
                                backgroundColor: barColor
                              }}
                            />

                            {/* 진행률 텍스트 */}
                            <Typography
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                              }}
                            >
                              {barData.width > 20 && `${progressWidth}%`}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }, [checklistItems, filteredChecklistItems, onToggleExpanded]);

    return (
      <Box sx={{ height: '650px', px: '2.5%', pb: 3, display: 'flex', flexDirection: 'column' }}>
        {/* 상단 컨트롤 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 2 }}>
          {/* 왼쪽: 뷰 모드 버튼들 */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ backgroundColor: 'background.paper' }}
          >
            <ToggleButton value="list" sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableDocument size={16} />
              리스트 보기
            </ToggleButton>
            <ToggleButton value="kanban" sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Category size={16} />
              칸반 보기
            </ToggleButton>
            <ToggleButton value="gantt" sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Element size={16} />
              간트차트 보기
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 오른쪽: 상태 필터 버튼들 */}
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="small"
            sx={{ backgroundColor: 'background.paper' }}
          >
            <ToggleButton value="all" sx={{ px: 3 }}>
              전체 ({filterCounts.total})
            </ToggleButton>
            <ToggleButton value="대기" sx={{ px: 3 }}>
              대기 ({filterCounts.waiting})
            </ToggleButton>
            <ToggleButton value="진행" sx={{ px: 3 }}>
              진행 ({filterCounts.inProgress})
            </ToggleButton>
            <ToggleButton value="완료" sx={{ px: 3 }}>
              완료 ({filterCounts.completed})
            </ToggleButton>
            <ToggleButton value="취소" sx={{ px: 3 }}>
              취소 ({filterCounts.cancelled})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* 등록 버튼과 입력 필드를 좌우 배치 - 간트차트 보기에서는 비활성화 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={
              viewMode === 'gantt'
                ? '간트차트 보기에서는 등록할 수 없습니다'
                : viewMode === 'kanban'
                  ? '칸반 보기에서는 등록할 수 없습니다'
                  : '새 계획 항목을 입력하세요...'
            }
            value={newChecklistText}
            onChange={(e) => onNewChecklistChange(e.target.value)}
            onKeyPress={handleChecklistKeyPress}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            disabled={viewMode === 'gantt' || viewMode === 'kanban' || !canEdit}
          />
          <Button
            variant="contained"
            onClick={onAddChecklistItem}
            disabled={viewMode === 'gantt' || viewMode === 'kanban' || !newChecklistText.trim() || !canEdit}
            sx={{
              minWidth: '80px',
              height: '40px',
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            등록
          </Button>
        </Box>

        {/* 뷰 모드별 렌더링 */}
        {viewMode === 'list' && (
          <Box sx={{ flex: 1 }}>
            {filteredChecklistItems.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                {filteredChecklistItems.map((item: any) =>
                  renderChecklistItem(
                    item,
                    checklistItems,
                    editingChecklistId,
                    editingChecklistText,
                    onChecklistChange,
                    onEditChecklistItem,
                    onSaveEditChecklistItem,
                    onCancelEditChecklistItem,
                    onDeleteChecklistItem,
                    onEditTextChange,
                    onDragStart,
                    onDragOver,
                    onDrop,
                    onDragEnd,
                    onToggleExpanded,
                    getChildrenCount,
                    onStatusChange,
                    onDueDateChange,
                    onProgressRateChange,
                    draggedItemId
                  )
                )}
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
                  {filter === 'all' ? '📝 계획 항목이 없습니다. 새로운 항목을 추가해보세요!' : `${filter} 상태의 항목이 없습니다.`}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {viewMode === 'kanban' && <Box sx={{ flex: 1 }}>{renderKanbanView()}</Box>}
        {viewMode === 'gantt' && <Box sx={{ flex: 1 }}>{renderGanttView()}</Box>}
      </Box>
    );
  }
);

PlanTab.displayName = 'PlanTab';

// 자료 탭 컴포넌트
// 자료 탭 컴포넌트 (DB 기반)
const MaterialTab = memo(({ recordId, currentUser, canEdit = true }: { recordId?: number | string; currentUser?: any; canEdit?: boolean }) => {
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.TASK, recordId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 타입별 아이콘
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

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      // recordId가 없으면 저장 먼저 하라고 알림
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 업무를 저장해주세요.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // 각 파일을 업로드
      for (const file of Array.from(selectedFiles)) {
        const uploadInput = {
          page: PAGE_IDENTIFIERS.TASK,
          record_id: String(recordId),
          user_id: currentUser?.id,
          user_name: currentUser?.name || '알 수 없음',
          team: currentUser?.department,
          metadata: {
            original_name: file.name
          }
        };

        const result = await uploadFile(file, uploadInput);
        if (!result.success) {
          console.error('파일 업로드 실패:', result.error);
          alert(`파일 업로드 실패: ${result.error}`);
        }
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [recordId, currentUser, uploadFile]
  );

  // 파일명 수정 핸들러
  const handleEditMaterial = useCallback((fileId: string, fileName: string) => {
    setEditingMaterialId(fileId);
    setEditingMaterialText(fileName);
  }, []);

  const handleSaveEditMaterial = useCallback(async () => {
    if (!editingMaterialText.trim() || !editingMaterialId) return;

    const result = await updateFile(editingMaterialId, {
      file_name: editingMaterialText.trim()
    });

    if (result.success) {
      setEditingMaterialId(null);
      setEditingMaterialText('');
    } else {
      console.error('파일명 수정 실패:', result.error);
      alert(`파일명 수정 실패: ${result.error}`);
    }
  }, [editingMaterialText, editingMaterialId, updateFile]);

  const handleCancelEditMaterial = useCallback(() => {
    setEditingMaterialId(null);
    setEditingMaterialText('');
  }, []);

  // 파일 삭제 핸들러
  const handleDeleteMaterial = useCallback(
    async (fileId: string) => {
      if (!confirm('이 파일을 삭제하시겠습니까?')) return;

      const result = await deleteFile(fileId);
      if (!result.success) {
        console.error('파일 삭제 실패:', result.error);
        alert(`파일 삭제 실패: ${result.error}`);
      }
    },
    [deleteFile]
  );

  // 파일 다운로드 핸들러
  const handleDownloadMaterial = useCallback((file: FileData) => {
    if (file.file_url) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('다운로드할 파일이 없습니다.');
    }
  }, []);

  // 업로드 버튼 클릭
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
              파일을 업로드하세요
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
              {isUploading ? '업로드 중...' : '파일 선택'}
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* 자료 항목들 */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {filesLoading && files.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              파일 목록을 불러오는 중...
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {files.map((file) => (
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
                    <Typography fontSize="24px">{getFileIcon(file.file_type || '')}</Typography>
                  </Box>

                  {/* 파일 정보 영역 */}
                  <Box sx={{ flexGrow: 1 }}>
                    {editingMaterialId === String(file.id) ? (
                      <TextField
                        fullWidth
                        value={editingMaterialText}
                        onChange={(e) => setEditingMaterialText(e.target.value)}
                        onKeyDown={(e) => {
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
                        onClick={() => handleEditMaterial(String(file.id), file.file_name)}
                      >
                        {file.file_name}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {file.file_type} • {formatFileSize(file.file_size)}
                      {file.created_at && ` • ${new Date(file.created_at).toLocaleDateString('ko-KR')}`}
                    </Typography>
                  </Box>

                  {/* 액션 버튼들 */}
                  <Stack direction="row" spacing={1}>
                    {editingMaterialId === String(file.id) ? (
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
                          onClick={() => handleEditMaterial(String(file.id), file.file_name)}
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
                          onClick={() => handleDeleteMaterial(String(file.id))}
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

// 메인 TaskEditDialog 컴포넌트
interface TaskEditDialogProps {
  open: boolean;
  onClose: () => void;
  task: TaskTableData | null;
  onSave: (task: TaskTableData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: TaskStatus[];
  statusColors: Record<TaskStatus, any>;
  kpiData?: any[]; // KPI 데이터 배열 (옵션)
  tasks?: TaskTableData[]; // 전체 업무 목록 (이미 사용중인 KPI 확인용)
  // 🔐 권한 관리
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

const TaskEditDialog = memo(
  ({
    open,
    onClose,
    task,
    onSave,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors,
    kpiData = [],
    tasks = [],
    canCreateData = true,
    canEditOwn = true,
    canEditOthers = true
  }: TaskEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('TaskEditDialog');

    const [editTab, setEditTab] = useState(0);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [kpiPage, setKpiPage] = useState(1); // KPI 다이얼로그 페이지네이션
    const [taskState, dispatch] = useReducer(editTaskReducer, {
      workContent: '',
      description: '',
      assignee: '',
      status: '대기',
      code: '',
      registrationDate: '',
      completedDate: '',
      team: '',
      department: 'IT',
      progress: 0,
      taskType: '일반',
      loadedKpiTitle: '',
      loadedKpiData: null
    });

    // 현재 로그인한 사용자 정보
    const user = useUser();
    const { users, masterCodes } = useCommonData();
    const { data: session } = useSession();

    const currentUser = useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      const found = users.find((u: any) => u.email === session.user.email);
      return found;
    }, [session, users]);

    // 데이터 소유자 확인 함수
    const isOwner = useMemo(() => {
      if (!currentUser || !task) return false;
      // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자
      return task.createdBy === currentUser.user_name ||
             task.assignee === currentUser.user_name;
    }, [currentUser, task]);

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

    // 편집 가능 여부
    const canEdit = canEditOthers || (canEditOwn && isOwner);

    // 계획탭 Supabase 연동
    const { fetchPlanItems, savePlanItems } = useSupabasePlanManagement();

    // 업무 데이터 조회 (코드 생성용)
    const { getTasks } = useSupabaseTaskManagement();

    // 기록탭 Supabase 연동
    const {
      feedbacks,
      loading: feedbackLoading,
      error: feedbackError,
      fetchFeedbacks,
      addFeedback,
      updateFeedback,
      deleteFeedback
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.TASK, task?.id);

    // 업무유형 마스터코드 (GROUP030)
    const [taskTypeOptions, setTaskTypeOptions] = useState<Array<{ code: string; name: string }>>([]);
    // 업무분류 마스터코드 (GROUP031)
    const [departmentOptions, setDepartmentOptions] = useState<Array<{ code: string; name: string }>>([]);
    // 상태 마스터코드 (GROUP002)
    const [statusOptionsFromDB, setStatusOptionsFromDB] = useState<Array<{ code: string; name: string }>>([]);
    // 직책 마스터코드 (GROUP005)
    const [roleOptions, setRoleOptions] = useState<Array<{ code: string; name: string }>>([]);
    // 팀(부서) 데이터
    const [teamOptions, setTeamOptions] = useState<Array<{ code: string; name: string }>>([]);
    // 사용자 데이터
    const [userOptions, setUserOptions] = useState<Array<{ code: string; name: string; profileImage?: string }>>([]);

    // 기록탭 임시 상태 관리 (저장 전까지 메모리에만 보관)
    const [pendingComments, setPendingComments] = useState<
      Array<{
        id: string;
        content: string;
        timestamp: string;
        author: string;
        avatar?: string;
        department?: string;
        position?: string;
        role?: string;
        isNew: boolean;
      }>
    >([]);
    const [modifiedComments, setModifiedComments] = useState<{ [key: string]: string }>({});
    const [deletedCommentIds, setDeletedCommentIds] = useState<string[]>([]);

    // 마스터코드 및 부서 데이터 로드 (컴포넌트 마운트 시 한번만)
    useEffect(() => {
      const fetchMasterCodes = async () => {
        try {
          // GROUP030 (업무유형) 조회
          const { data: taskTypes, error: taskTypeError } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name')
            .eq('group_code', 'GROUP030')
            .eq('is_active', true)
            .order('subcode_order');

          if (taskTypeError) {
            console.error('업무유형 조회 실패:', taskTypeError);
          } else {
            const taskTypeOpts = taskTypes
              .filter((item) => item.subcode && item.subcode_name)
              .map((item) => ({
                code: item.subcode,
                name: item.subcode_name
              }));
            setTaskTypeOptions(taskTypeOpts);
          }

          // GROUP031 (업무분류) 조회
          const { data: departments, error: deptError } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name')
            .eq('group_code', 'GROUP031')
            .eq('is_active', true)
            .order('subcode_order');

          if (deptError) {
            console.error('업무분류 조회 실패:', deptError);
          } else {
            const deptOpts = departments
              .filter((item) => item.subcode && item.subcode_name)
              .map((item) => ({
                code: item.subcode,
                name: item.subcode_name
              }));
            setDepartmentOptions(deptOpts);
          }

          // GROUP002 (상태) 조회
          const { data: statuses, error: statusError } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name')
            .eq('group_code', 'GROUP002')
            .eq('is_active', true)
            .order('subcode_order');

          if (statusError) {
            console.error('상태 조회 실패:', statusError);
          } else {
            const statusOpts = statuses
              .filter((item) => item.subcode && item.subcode_name)
              .map((item) => ({
                code: item.subcode,
                name: item.subcode_name
              }));
            setStatusOptionsFromDB(statusOpts);
          }

          // GROUP004 (직급) 조회
          // GROUP005 (직책) 조회
          const { data: roles, error: roleError } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name')
            .eq('group_code', 'GROUP005')
            .eq('is_active', true)
            .order('subcode_order');

          if (roleError) {
            console.error('직책 조회 실패:', roleError);
          } else {
            const roleOpts = roles
              .filter((item) => item.subcode && item.subcode_name)
              .map((item) => ({
                code: item.subcode,
                name: item.subcode_name
              }));
            setRoleOptions(roleOpts);
          }

          // 부서(팀) 조회
          const { data: teams, error: teamError } = await supabase
            .from('admin_users_department')
            .select('department_code, department_name')
            .eq('is_active', true)
            .order('display_order');

          if (teamError) {
            console.error('팀 조회 실패:', teamError);
          } else {
            const teamOpts = teams.map((item) => ({
              code: item.department_code,
              name: item.department_name
            }));
            setTeamOptions(teamOpts);
          }

          // 사용자 조회
          const { data: users, error: userError } = await supabase
            .from('admin_users_userprofiles')
            .select('user_code, user_name, profile_image_url')
            .eq('is_active', true)
            .order('user_name');

          if (userError) {
            console.error('사용자 조회 실패:', userError);
          } else {
            const userOpts = users.map((item) => ({
              code: item.user_code,
              name: item.user_name,
              profileImage: item.profile_image_url
            }));
            setUserOptions(userOpts);
          }
        } catch (err) {
          console.error('데이터 조회 중 오류:', err);
        }
      };

      fetchMasterCodes();
    }, []); // 컴포넌트 마운트 시 한번만 실행

    // 코드 자동 생성 함수 - MAIN-TASK-25-001 형식 (년도별 일련번호)
    const generateTaskCode = useCallback(async (): Promise<string> => {
      try {
        const currentYear = new Date().getFullYear();
        const currentYearStr = currentYear.toString().slice(-2);

        // DB에서 모든 업무 조회
        const allTasks = await getTasks();

        // 현재 연도의 코드만 필터링 (MAIN-TASK-25-XXX 형식)
        const currentYearTasks = allTasks.filter((task) => {
          const codePattern = `MAIN-TASK-${currentYearStr}-`;
          return task.code && task.code.startsWith(codePattern);
        });

        // 정규식으로 올바른 형식(3자리 숫자)의 코드만 필터링
        const validCodePattern = new RegExp(`^MAIN-TASK-${currentYearStr}-(\\d{3})$`);
        let maxSequence = 0;

        currentYearTasks.forEach((task) => {
          const match = task.code.match(validCodePattern);
          if (match) {
            const sequence = parseInt(match[1], 10);
            if (sequence > maxSequence) {
              maxSequence = sequence;
            }
          }
        });

        // 다음 일련번호 생성 (최대값 + 1)
        const nextSequence = maxSequence + 1;
        const formattedSequence = nextSequence.toString().padStart(3, '0');
        const newCode = `MAIN-TASK-${currentYearStr}-${formattedSequence}`;

        console.log('🔄 [TaskEditDialog] 자동 생성된 코드:', newCode);
        console.log('📊 [TaskEditDialog] 현재 최대 일련번호:', maxSequence, '→ 다음:', nextSequence);
        return newCode;
      } catch (error) {
        console.error('❌ 업무 코드 생성 실패:', error);
        const year = new Date().getFullYear().toString().slice(-2);
        return `MAIN-TASK-${year}-001`; // 오류 시 001부터 시작
      }
    }, [getTasks]);

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }, []);

    // Task 변경 시 상태 업데이트
    React.useEffect(() => {
      const initializeTask = async () => {
        if (task) {
          // 기존 데이터 편집 시
          dispatch({ type: 'SET_TASK', task });
        } else if (open) {
          // 새 Task 생성 시 자동으로 코드와 등록일 설정
          const newCode = await generateTaskCode();
          const newRegistrationDate = getCurrentDate();
          dispatch({ type: 'INIT_NEW_TASK', code: newCode, registrationDate: newRegistrationDate });
        }
      };

      initializeTask();
    }, [task, open, generateTaskCode, getCurrentDate]);

    // 팀을 로그인한 사용자의 부서로 자동 설정
    useEffect(() => {
      if (user && typeof user !== 'boolean' && user.department && !taskState.team && !task && open) {
        dispatch({ type: 'SET_FIELD', field: 'team', value: user.department });
      }
    }, [user, taskState.team, task, open]);

    // 담당자를 로그인한 사용자로 자동 설정
    useEffect(() => {
      if (user && typeof user !== 'boolean' && user.name && !taskState.assignee && !task && open) {
        dispatch({ type: 'SET_FIELD', field: 'assignee', value: user.name });
      }
    }, [user, taskState.assignee, task, open]);

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
        priority?: 'High' | 'Medium' | 'Low';
        startDate?: string;
      }>
    >([]);
    const [newChecklistText, setNewChecklistText] = useState('');
    const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
    const [editingChecklistText, setEditingChecklistText] = useState('');

    // 진척률 편집 상태
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editingProgressValue, setEditingProgressValue] = useState<number>(0);

    // 코멘트 상태
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // 서브코드를 서브코드명으로 변환하는 헬퍼 함수
    const getSubcodeName = useCallback((subcode: string | undefined, options: Array<{ code: string; name: string }>) => {
      if (!subcode) return '';
      // 이미 서브코드명이면 그대로 반환
      if (!subcode.includes('GROUP')) return subcode;
      // 서브코드를 서브코드명으로 변환
      const found = options.find((opt) => opt.code === subcode);
      return found ? found.name : subcode;
    }, []);

    // DB 피드백과 임시 댓글을 병합하여 표시
    const comments = useMemo(() => {
      // DB에서 가져온 피드백 데이터를 댓글 형식으로 변환
      const dbComments = feedbacks
        .filter((fb) => !deletedCommentIds.includes(String(fb.id)))
        .map((fb) => {
          // user_name으로 사용자 찾기
          const feedbackUser = users.find((u) => u.user_name === fb.user_name);

          return {
            id: String(fb.id),
            author: fb.user_name,
            content: modifiedComments[String(fb.id)] !== undefined ? modifiedComments[String(fb.id)] : fb.description,
            timestamp: new Date(fb.created_at).toLocaleString('ko-KR'),
            avatar: fb.user_profile_image,
            department: fb.user_department,
            position: convertSubcodeName(feedbackUser?.role || '', positionOptions),
            role: ''
          };
        });

      // 임시로 추가된 댓글들 (temp_ prefix가 있는 것들)
      const tempComments = pendingComments.map((pc) => ({
        id: pc.id,
        author: pc.author,
        content: pc.content,
        timestamp: pc.timestamp,
        avatar: pc.avatar,
        department: pc.department,
        position: pc.position,
        role: '',
        isNew: true
      }));

      // 임시 댓글을 먼저, DB 댓글을 나중에 (최신순)
      return [...tempComments, ...dbComments];
    }, [feedbacks, pendingComments, modifiedComments, deletedCommentIds, users, positionOptions, convertSubcodeName]);

    // KPI 다이얼로그 상태
    const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
    const [selectedKpiData, setSelectedKpiData] = useState<any>(null);

    // 에러 상태
    const [validationError, setValidationError] = useState<string>('');

    // Task 변경 시 상태 업데이트
    React.useEffect(() => {
      if (task) {
        dispatch({ type: 'SET_TASK', task });

        // DB에서 로드한 kpi_id를 사용해서 실제 KPI 데이터 찾기
        const taskAny = task as any;
        const kpiId = taskAny.kpiId || taskAny.kpi_id;

        if (kpiId && kpiData && kpiData.length > 0) {
          console.log('🔍 DB에서 로드한 kpi_id:', kpiId);
          console.log('📊 사용 가능한 kpiData 개수:', kpiData.length);

          // kpiData에서 일치하는 KPI 찾기
          const matchedKpi = kpiData.find((kpi: any) => {
            // kpi_id 또는 id 필드로 비교 (타입 변환 포함)
            const kpiDataId = kpi.kpi_id || kpi.id;
            return kpiDataId === kpiId || String(kpiDataId) === String(kpiId);
          });

          if (matchedKpi) {
            console.log('✅ 일치하는 KPI 찾음:', matchedKpi);
            dispatch({ type: 'SET_LOADED_KPI_DATA', data: matchedKpi });
          } else {
            console.warn('⚠️ kpi_id와 일치하는 KPI를 찾을 수 없음:', kpiId);
          }
        }
      }
    }, [task, kpiData]);

    // 팝업 열릴 때 계획 항목 DB에서 조회
    useEffect(() => {
      const loadPlanItems = async () => {
        if (open && task?.code) {
          console.log('📥 계획 항목 조회:', task.code);
          const planItems = await fetchPlanItems(task.code);

          if (planItems.length > 0) {
            // DB 데이터를 프론트엔드 형식으로 변환
            const convertedItems = planItems.map((item) => ({
              id: item.item_id,
              text: item.text,
              checked: item.checked,
              parentId: item.parent_id || undefined,
              level: item.level,
              expanded: item.expanded,
              status: item.status,
              dueDate: item.due_date || undefined,
              progressRate: item.progress_rate,
              assignee: item.assignee || undefined,
              priority: item.priority,
              startDate: item.start_date || undefined
            }));
            setChecklistItems(convertedItems);
            console.log(`✅ 계획 항목 ${convertedItems.length}개 로드 완료`);
          } else {
            // 신규 업무인 경우 빈 배열로 초기화
            setChecklistItems([]);
          }
        } else if (open && !task) {
          // 신규 생성인 경우 빈 배열로 초기화
          setChecklistItems([]);
        }
      };

      loadPlanItems();
    }, [open, task, fetchPlanItems]);

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditTaskState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });

      // 업무유형이 "일반"으로 변경되면 불러온 KPI 데이터 초기화
      if (field === 'taskType' && value === '일반') {
        dispatch({ type: 'SET_FIELD', field: 'loadedKpiTitle', value: '' });
        dispatch({ type: 'SET_FIELD', field: 'loadedKpiId', value: '' });
        dispatch({ type: 'SET_LOADED_KPI_DATA', data: null });
      }
    }, []);

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
      setEditTab(newValue);
    }, []);

    // KPI 다이얼로그 열기
    const handleOpenKpiDialog = useCallback(() => {
      setKpiDialogOpen(true);
      setKpiPage(1); // 페이지를 1로 리셋
    }, []);

    // KPI 다이얼로그 닫기
    const handleCloseKpiDialog = useCallback(() => {
      setKpiDialogOpen(false);
      setSelectedKpiData(null); // 선택 초기화
    }, []);

    // KPI 데이터 선택 시 처리
    const handleSelectKpiData = useCallback((kpiData: any) => {
      // KPI 데이터로 폼 필드 채우기
      const workContent = kpiData.kpi_work_content || kpiData.work_content || kpiData.workContent || kpiData.title || '';
      dispatch({ type: 'SET_FIELD', field: 'workContent', value: workContent });
      dispatch({ type: 'SET_FIELD', field: 'description', value: kpiData.description || '' });
      dispatch({ type: 'SET_FIELD', field: 'assignee', value: kpiData.assignee || '' });
      dispatch({ type: 'SET_FIELD', field: 'team', value: kpiData.team || '개발팀' });
      dispatch({ type: 'SET_FIELD', field: 'department', value: kpiData.department || 'IT' });
      dispatch({ type: 'SET_FIELD', field: 'taskType', value: 'KPI' });
      dispatch({ type: 'SET_FIELD', field: 'loadedKpiTitle', value: workContent });
      dispatch({ type: 'SET_LOADED_KPI_DATA', data: kpiData }); // 전체 KPI 데이터 저장

      setKpiDialogOpen(false);
    }, []);

    // KPI 저장 버튼 클릭 핸들러
    const handleSaveKpiData = useCallback(() => {
      if (selectedKpiData) {
        handleSelectKpiData(selectedKpiData);
        setSelectedKpiData(null); // 선택 초기화
      }
    }, [selectedKpiData, handleSelectKpiData]);

    const handleSave = useCallback(async () => {
      // 저장 직전에 현재 입력 값들을 taskState에 강제 반영
      const getCurrentInputValues = () => {
        if ((window as any).getOverviewTabCurrentValues) {
          return (window as any).getOverviewTabCurrentValues();
        }
        return { workContent: taskState.workContent, description: taskState.description };
      };

      const currentValues = getCurrentInputValues();

      // 필수 입력 검증
      if (!currentValues.workContent.trim()) {
        setValidationError('제목을 입력해주세요.');
        return;
      }

      if (!taskState.assignee.trim()) {
        setValidationError('담당자를 선택해주세요.');
        return;
      }

      if (!taskState.taskType || !taskState.taskType.trim()) {
        setValidationError('업무유형을 선택해주세요.');
        return;
      }

      if (!taskState.department || !taskState.department.trim()) {
        setValidationError('업무분류를 선택해주세요.');
        return;
      }

      // 에러 초기화
      setValidationError('');

      // 현재 입력 값들을 taskState에 즉시 반영
      if (currentValues.workContent !== taskState.workContent) {
        dispatch({ type: 'SET_FIELD', field: 'workContent', value: currentValues.workContent });
      }
      if (currentValues.description !== taskState.description) {
        dispatch({ type: 'SET_FIELD', field: 'description', value: currentValues.description });
      }

      // 약간의 지연을 두고 저장 (상태 업데이트 완료 대기)
      setTimeout(async () => {
        if (!task) {
          // 새 Task 생성
          const newTask: TaskTableData = {
            id: Date.now(),
            no: Date.now(),
            workContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            startDate: new Date().toISOString().split('T')[0], // 오늘 날짜로 시작일 설정
            completedDate: taskState.completedDate,
            description: currentValues.description,
            team: taskState.team,
            department: taskState.department,
            progress: taskState.progress,
            attachments: [],
            taskType: taskState.taskType,
            loadedKpiTitle: taskState.loadedKpiTitle,
            kpiId: taskState.loadedKpiData?.kpi_id || null,
            kpiRecordId: taskState.loadedKpiData?.id || null,
            kpiWorkContent: taskState.loadedKpiData?.kpi_work_content || null
          } as any;

          console.log('🚀 새 Task 생성 중:', newTask);
          console.log('📋 KPI 필드 확인:', {
            taskType: taskState.taskType,
            loadedKpiTitle: taskState.loadedKpiTitle,
            kpiId: taskState.loadedKpiData?.kpi_id || null,
            kpiRecordId: taskState.loadedKpiData?.id || null,
            kpiWorkContent: taskState.loadedKpiData?.kpi_work_content || null,
            loadedKpiData: taskState.loadedKpiData
          });
          onSave(newTask);

          // 계획 항목 저장 (신규 생성)
          console.log('💾 계획 항목 저장 시작 (신규):', taskState.code, '항목 수:', checklistItems.length);
          if (checklistItems.length > 0) {
            const planItemsToSave: PlanItemInput[] = checklistItems.map((item) => ({
              task_id: taskState.code,
              item_id: item.id,
              text: item.text,
              checked: item.checked,
              parent_id: item.parentId || null,
              level: item.level,
              expanded: item.expanded,
              status: item.status || '대기',
              due_date: item.dueDate || null,
              progress_rate: item.progressRate || 0,
              assignee: item.assignee || null,
              priority: item.priority || 'Medium',
              start_date: item.startDate || null
            }));

            console.log('💾 변환된 계획 항목 (신규):', planItemsToSave);
            const saveResult = await savePlanItems(taskState.code, planItemsToSave);
            console.log('💾 계획 항목 저장 결과 (신규):', saveResult);
          } else {
            console.log('💾 저장할 계획 항목이 없음 (신규)');
          }
        } else {
          // 기존 Task 수정
          const updatedTask: TaskTableData = {
            ...task,
            workContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status,
            startDate: task.startDate || new Date().toISOString().split('T')[0], // 기존 시작일 유지 또는 오늘 날짜
            completedDate: taskState.completedDate,
            description: currentValues.description,
            team: taskState.team,
            department: taskState.department,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            progress: taskState.progress,
            taskType: taskState.taskType,
            loadedKpiTitle: taskState.loadedKpiTitle,
            kpiId: taskState.loadedKpiData?.kpi_id || null,
            kpiRecordId: taskState.loadedKpiData?.id || null,
            kpiWorkContent: taskState.loadedKpiData?.kpi_work_content || null
          } as any;

          console.log('📝 기존 Task 수정 중:', updatedTask);
          console.log('📋 KPI 필드 확인 (수정):', {
            taskType: taskState.taskType,
            loadedKpiTitle: taskState.loadedKpiTitle,
            kpiId: taskState.loadedKpiData?.kpi_id || null,
            kpiRecordId: taskState.loadedKpiData?.id || null,
            kpiWorkContent: taskState.loadedKpiData?.kpi_work_content || null,
            loadedKpiData: taskState.loadedKpiData
          });
          onSave(updatedTask);

          // 계획 항목 저장 (기존 수정)
          console.log('💾 계획 항목 저장 시작:', task.code, '항목 수:', checklistItems.length);
          const planItemsToSave: PlanItemInput[] = checklistItems.map((item) => ({
            task_id: task.code,
            item_id: item.id,
            text: item.text,
            checked: item.checked,
            parent_id: item.parentId || null,
            level: item.level,
            expanded: item.expanded,
            status: item.status || '대기',
            due_date: item.dueDate || null,
            progress_rate: item.progressRate || 0,
            assignee: item.assignee || null,
            priority: item.priority || 'Medium',
            start_date: item.startDate || null
          }));

          console.log('💾 변환된 계획 항목:', planItemsToSave);
          const saveResult = await savePlanItems(task.code, planItemsToSave);
          console.log('💾 계획 항목 저장 결과:', saveResult);
        }

        // 기록 데이터 저장 (신규/기존 모두)
        try {
          const recordId = task ? String(task.id) : taskState.code;
          console.log('📝 기록 데이터 저장 시작:', recordId);

          // 삭제된 기록들 처리 (기존 Task만)
          if (task && deletedCommentIds.length > 0) {
            console.log('🗑️ 삭제할 기록:', deletedCommentIds);
            for (const commentId of deletedCommentIds) {
              await deleteFeedback(Number(commentId));
            }
          }

          // 수정된 기록들 처리 (기존 Task만)
          if (task && Object.keys(modifiedComments).length > 0) {
            console.log('✏️ 수정할 기록:', modifiedComments);
            for (const [commentId, newContent] of Object.entries(modifiedComments)) {
              await updateFeedback(Number(commentId), { description: newContent });
            }
          }

          // 새로 추가된 기록들 처리 (신규/기존 모두)
          if (pendingComments.length > 0) {
            console.log('➕ 추가할 기록:', pendingComments);
            // pendingComments를 역순으로 저장 (가장 오래된 것부터 저장하여 DB에서 최신순으로 정렬되도록)
            const reversedComments = [...pendingComments].reverse();
            for (const comment of reversedComments) {
              const feedbackInput = {
                page: PAGE_IDENTIFIERS.TASK,
                record_id: recordId,
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
            }
          }

          console.log('✅ 기록 데이터 저장 완료');

          // 저장 후 임시 데이터 초기화
          setPendingComments([]);
          setModifiedComments({});
          setDeletedCommentIds([]);

          // DB에서 최신 데이터 가져오기
          await fetchFeedbacks();
        } catch (error) {
          console.error('❌ 기록 데이터 저장 중 오류:', error);
        }

        onClose();
      }, 50); // 50ms 지연
    }, [
      task,
      taskState,
      onSave,
      onClose,
      dispatch,
      checklistItems,
      savePlanItems,
      deletedCommentIds,
      modifiedComments,
      pendingComments,
      deleteFeedback,
      updateFeedback,
      addFeedback,
      fetchFeedbacks
    ]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setNewComment('');
      setNewChecklistText('');
      setValidationError(''); // 에러 상태 초기화
      // 피드백 관련 임시 상태 초기화
      setPendingComments([]);
      setModifiedComments({});
      setDeletedCommentIds([]);
      setEditingCommentId(null);
      setEditingCommentText('');
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
        assignee: '김철수', // 기본 담당자
        priority: 'Medium' as const,
        startDate: ''
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

        // 레벨 제한: 타겟이 이미 레벨 1이면 드롭 불가
        if (target.level >= 1) {
          return prev;
        }

        // 드래그된 항목의 하위 항목들이 있는지 확인
        const draggedItem = prev.find((item) => item.id === draggedId);
        const hasChildren = prev.some((item) => item.parentId === draggedId);

        // 드래그된 항목이 하위 항목을 가지고 있고, 타겟이 레벨 0이 아니면 드롭 불가
        if (hasChildren && target.level > 0) {
          return prev;
        }

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
    // 0레벨 TASK의 자동 계산 로직
    const calculateParentValues = useCallback((items: any[]) => {
      const itemMap = new Map(items.map((item) => [item.id, item]));
      const updatedItems = [...items];

      // 레벨 0 (최상위) 항목들을 찾아서 업데이트
      const topLevelItems = items.filter((item) => item.level === 0);

      topLevelItems.forEach((parentItem) => {
        const children = items.filter((item) => item.parentId === parentItem.id);

        if (children.length > 0) {
          // 하위 항목들의 상태 분석
          const completedCount = children.filter((child) => child.status === '완료' || child.status === '취소').length;
          const inProgressCount = children.filter(
            (child) => child.status === '진행' || child.status === '완료' || child.status === '취소'
          ).length;

          // 상태 계산
          let newStatus = '대기';
          if (completedCount === children.length && children.length > 0) {
            // 모든 하위 항목이 완료 또는 취소
            newStatus = '완료';
          } else if (inProgressCount > 0) {
            // 하나라도 진행, 완료, 취소가 있으면
            newStatus = '진행';
          }

          // 진행율 평균 계산 (취소된 항목 제외)
          const activeChildren = children.filter((child) => child.status !== '취소');
          const validProgressRates = activeChildren.map((child) => child.progressRate || 0).filter((rate) => !isNaN(rate));
          const avgProgressRate =
            validProgressRates.length > 0
              ? Math.round(validProgressRates.reduce((sum, rate) => sum + rate, 0) / validProgressRates.length)
              : 0;

          // 마지막 일자 계산 (가장 늦은 일자)
          const dueDates = children.map((child) => child.dueDate).filter((date) => date && date.trim() !== '');
          const latestDueDate = dueDates.length > 0 ? dueDates.sort().reverse()[0] : parentItem.dueDate;

          // 중요도 평균 계산
          const priorityValues = children
            .map((child) => (child.priority === 'High' ? 3 : child.priority === 'Medium' ? 2 : 1))
            .filter((value) => value);
          const avgPriorityValue =
            priorityValues.length > 0 ? Math.round(priorityValues.reduce((sum, value) => sum + value, 0) / priorityValues.length) : 2; // 기본값 Medium
          const avgPriority = avgPriorityValue >= 3 ? 'High' : avgPriorityValue >= 2 ? 'Medium' : 'Low';

          // 가장 빠른 시작일 계산
          const startDates = children.map((child) => child.startDate).filter((date) => date && date.trim() !== '');
          const earliestStartDate = startDates.length > 0 ? startDates.sort()[0] : parentItem.startDate;

          // 부모 항목 업데이트
          const parentIndex = updatedItems.findIndex((item) => item.id === parentItem.id);
          if (parentIndex !== -1) {
            updatedItems[parentIndex] = {
              ...updatedItems[parentIndex],
              status: newStatus,
              progressRate: avgProgressRate,
              dueDate: latestDueDate,
              priority: avgPriority,
              startDate: earliestStartDate
            };
          }
        }
      });

      return updatedItems;
    }, []);

    const handleToggleExpanded = useCallback((id: number) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : item)));
    }, []);

    const handleToggleChecklistItem = useCallback((index: number) => {
      setChecklistItems((prev) => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
    }, []);

    // 체크리스트 상태 변경 핸들러
    const handleChecklistStatusChange = useCallback(
      (id: number, status: string) => {
        setChecklistItems((prev) => {
          const updatedItems = prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  progressRate: status === '완료' ? 100 : status === '취소' ? 0 : item.progressRate
                }
              : item
          );

          // 0레벨 항목의 자동 계산 적용
          return calculateParentValues(updatedItems);
        });
      },
      [calculateParentValues]
    );

    // 체크리스트 완료일 변경 핸들러
    const handleChecklistDueDateChange = useCallback(
      (id: number, dueDate: string) => {
        setChecklistItems((prev) => {
          const updatedItems = prev.map((item) => (item.id === id ? { ...item, dueDate } : item));

          // 0레벨 항목의 자동 계산 적용
          return calculateParentValues(updatedItems);
        });
      },
      [calculateParentValues]
    );

    // 체크리스트 진척율 변경 핸들러
    const handleChecklistProgressRateChange = useCallback(
      (id: number, progressRate: number) => {
        setChecklistItems((prev) => {
          const updatedItems = prev.map((item) => {
            if (item.id === id) {
              let newStatus = item.status;
              // 1% 이상이면 대기 -> 진행으로 상태 자동 변경
              if (progressRate >= 1 && item.status === '대기') {
                newStatus = '진행';
              }
              return { ...item, progressRate, status: newStatus };
            }
            return item;
          });

          // 0레벨 항목의 자동 계산 적용
          return calculateParentValues(updatedItems);
        });
      },
      [calculateParentValues]
    );

    // 체크리스트 중요도 변경 핸들러
    const handleChecklistPriorityChange = useCallback(
      (id: number, priority: 'High' | 'Medium' | 'Low') => {
        setChecklistItems((prev) => {
          const updatedItems = prev.map((item) => (item.id === id ? { ...item, priority } : item));

          // 0레벨 항목의 자동 계산 적용
          return calculateParentValues(updatedItems);
        });
      },
      [calculateParentValues]
    );

    // 체크리스트 시작일 변경 핸들러
    const handleChecklistStartDateChange = useCallback(
      (id: number, startDate: string) => {
        setChecklistItems((prev) => {
          const updatedItems = prev.map((item) => (item.id === id ? { ...item, startDate } : item));

          // 0레벨 항목의 자동 계산 적용
          return calculateParentValues(updatedItems);
        });
      },
      [calculateParentValues]
    );

    // 코멘트 핸들러들 (Optimistic UI 패턴)
    const handleAddComment = useCallback(() => {
      if (!newComment.trim()) return;

      // 현재 사용자 정보 가져오기
      const feedbackUser = users.find((u) => u.user_name === user?.name);
      const currentUserName = feedbackUser?.user_name || user?.name || '현재 사용자';
      const currentTeam = feedbackUser?.department || user?.department || '';
      const currentPosition = convertSubcodeName(feedbackUser?.role || '', positionOptions);
      const currentProfileImage = feedbackUser?.profile_image_url || '';
      const currentRole = '';

      // 임시 ID로 새 댓글 추가 (temp_ prefix)
      const tempComment = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: newComment,
        timestamp: new Date().toLocaleString('ko-KR'),
        author: currentUserName,
        avatar: currentProfileImage || undefined,
        department: currentTeam,
        position: currentPosition,
        role: currentRole,
        isNew: true
      };

      setPendingComments((prev) => [tempComment, ...prev]);
      setNewComment('');
    }, [newComment, users, user, positionOptions, convertSubcodeName]);

    const handleEditComment = useCallback((commentId: string, content: string) => {
      setEditingCommentId(commentId);
      setEditingCommentText(content);
    }, []);

    const handleSaveEditComment = useCallback(() => {
      if (!editingCommentText.trim() || !editingCommentId) return;

      // temp_ ID인지 확인
      if (editingCommentId.startsWith('temp_')) {
        // 임시 댓글 수정
        setPendingComments((prev) =>
          prev.map((comment) => (comment.id === editingCommentId ? { ...comment, content: editingCommentText } : comment))
        );
      } else {
        // DB 댓글 수정 (modifiedComments에 저장)
        setModifiedComments((prev) => ({
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
      // temp_ ID인지 확인
      if (commentId.startsWith('temp_')) {
        // 임시 댓글 삭제
        setPendingComments((prev) => prev.filter((comment) => comment.id !== commentId));
      } else {
        // DB 댓글 삭제 예약
        setDeletedCommentIds((prev) => [...prev, commentId]);
      }
    }, []);

    // 메모이제이션된 탭 컴포넌트 props
    const overviewTabProps = useMemo(
      () => ({
        taskState,
        onFieldChange: handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors,
        onOpenKpiDialog: handleOpenKpiDialog,
        taskTypeOptions,
        departmentOptions,
        statusOptionsFromDB,
        teamOptions,
        userOptions,
        users
      }),
      [
        taskState,
        handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors,
        handleOpenKpiDialog,
        taskTypeOptions,
        departmentOptions,
        statusOptionsFromDB,
        teamOptions,
        userOptions,
        users
      ]
    );

    const planTabProps = useMemo(
      () => ({
        checklistItems,
        onChecklistChange: handleToggleChecklistItem,
        newChecklistText,
        onNewChecklistChange: setNewChecklistText,
        onAddChecklistItem: handleAddChecklistItem,
        editingChecklistId,
        editingChecklistText,
        onEditChecklistItem: handleEditChecklistItem,
        onSaveEditChecklistItem: handleSaveEditChecklistItem,
        onCancelEditChecklistItem: handleCancelEditChecklistItem,
        onDeleteChecklistItem: handleDeleteChecklistItem,
        onEditTextChange: setEditingChecklistText,
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
        onDragEnd: handleDragEnd,
        onToggleExpanded: handleToggleExpanded,
        onStatusChange: handleChecklistStatusChange,
        onDueDateChange: handleChecklistDueDateChange,
        onProgressRateChange: handleChecklistProgressRateChange,
        onPriorityChange: handleChecklistPriorityChange,
        onStartDateChange: handleChecklistStartDateChange,
        draggedItemId,
        setEditingChecklistId,
        setEditingField,
        setEditingProgressValue,
        canEdit
      }),
      [
        checklistItems,
        newChecklistText,
        editingChecklistId,
        editingChecklistText,
        handleAddChecklistItem,
        handleEditChecklistItem,
        handleSaveEditChecklistItem,
        handleCancelEditChecklistItem,
        handleDeleteChecklistItem,
        handleToggleChecklistItem,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleToggleExpanded,
        handleChecklistStatusChange,
        handleChecklistDueDateChange,
        handleChecklistProgressRateChange,
        handleChecklistPriorityChange,
        handleChecklistStartDateChange,
        draggedItemId,
        editingField,
        editingProgressValue,
        canEdit
      ]
    );

    const recordTabProps = useMemo(() => {
      // 현재 사용자 정보 가져오기
      const feedbackUser = users.find((u) => u.user_name === user?.name);
      const currentUserName = feedbackUser?.user_name || user?.name || '현재 사용자';
      const currentUserAvatar = feedbackUser?.profile_image_url || user?.avatar || '';
      const currentUserRole = convertSubcodeName(feedbackUser?.role || user?.role || '', positionOptions);
      const currentUserDepartment = feedbackUser?.department || user?.department || '';

      return {
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
        currentUserName,
        currentUserAvatar,
        currentUserRole,
        currentUserDepartment
      };
    }, [
      comments,
      newComment,
      editingCommentId,
      editingCommentText,
      handleAddComment,
      handleEditComment,
      handleSaveEditComment,
      handleCancelEditComment,
      handleDeleteComment,
      user,
      users,
      positionOptions,
      convertSubcodeName
    ]);

    return (
      <>
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              height: '840px',
              maxHeight: '840px',
              overflowY: 'auto'
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 2, pt: 2 }}>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
                업무관리 편집
              </Typography>
              {task && (
                <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                  {task.workContent} ({task.code})
                </Typography>
              )}
            </Box>

            {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
            {/* 🔐 권한 체크: 새 업무(task === null)는 canCreateData, 기존 업무는 canEdit */}
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Button
                onClick={handleClose}
                variant="outlined"
                size="small"
                disabled={!task ? !canCreateData : !canEdit}
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
                disabled={!task ? !canCreateData : !canEdit}
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
              <Tab label="계획" />
              <Tab label="기록" />
              <Tab label="자료" />
            </Tabs>
          </Box>

          <DialogContent sx={{ p: 1, pt: 1, overflow: 'hidden' }}>
            {editTab === 0 && <OverviewTab {...overviewTabProps} />}
            {editTab === 1 && <PlanTab {...planTabProps} />}
            {editTab === 2 && <RecordTab {...recordTabProps} />}
            {editTab === 3 && <MaterialTab recordId={task?.id} currentUser={user} canEdit={canEdit} />}
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

        {/* KPI 데이터 선택 다이얼로그 */}
        <Dialog
          open={kpiDialogOpen}
          onClose={handleCloseKpiDialog}
          maxWidth={false}
          PaperProps={{
            sx: {
              width: '1170px',
              height: '780px',
              maxWidth: '1170px',
              maxHeight: '780px',
              m: 2
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            KPI 데이터 불러오기
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleCloseKpiDialog}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: '60px',
                  fontSize: '12px'
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleSaveKpiData}
                variant="contained"
                size="small"
                disabled={!selectedKpiData}
                sx={{
                  minWidth: '60px',
                  fontSize: '12px'
                }}
              >
                저장
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', height: 'calc(780px - 64px - 60px)', p: 0 }}>
            {(() => {
              // KPI 데이터 선택: props로 받은 데이터가 없으면 목업 데이터 사용
              const actualKpiData = kpiData && kpiData.length > 0 ? kpiData : mockKpiData;
              const isUsingMockData = !kpiData || kpiData.length === 0;

              console.log('🔍 TaskEditDialog - kpiData prop:', kpiData);
              console.log('🔍 TaskEditDialog - kpiData 길이:', kpiData?.length);
              console.log('🔍 KPI 데이터 소스:', isUsingMockData ? '목업 데이터' : 'Supabase 데이터');
              console.log('📊 사용할 KPI 데이터 개수:', actualKpiData?.length);

              // 이미 사용중인 KPI record ID 목록 생성 (현재 편집중인 task 제외)
              const usedKpiRecordIds = new Set<number>();
              if (tasks && tasks.length > 0) {
                tasks.forEach((t: any) => {
                  // KPI record ID는 main_kpi_task 테이블의 id (41, 42 등)
                  const tKpiRecordId = t.kpiRecordId || (t.loadedKpiData?.id);
                  // 현재 편집중인 task가 아니고, kpi record id가 있으면 추가
                  if (tKpiRecordId && t.id !== task?.id) {
                    usedKpiRecordIds.add(Number(tKpiRecordId));
                  }
                });
                console.log('🚫 이미 사용중인 KPI Record ID 목록:', Array.from(usedKpiRecordIds));
                console.log('📝 현재 편집중인 task ID:', task?.id);
              }

              // 세 가지 조건으로 필터링:
              // 1. 현재 사용자의 KPI만
              // 2. 이미 사용중이지 않은 KPI (recordId 기준)
              // 3. 또는 현재 task가 사용 중인 KPI (재선택 가능)
              const userName = user?.korName || user?.name || '';
              const currentTaskKpiRecordId = Number((task as any)?.kpiRecordId || (task as any)?.loadedKpiData?.id);

              console.log('👤 현재 사용자:', userName);
              console.log('📝 현재 task의 KPI recordId:', currentTaskKpiRecordId || 'null');
              console.log('📊 필터링 전 KPI 데이터 개수:', actualKpiData.length);

              // 디버깅: 각 항목이 왜 필터링되는지 확인
              actualKpiData.forEach((item, idx) => {
                const itemAssignee = item?.assignee?.trim();
                const currentUser = userName?.trim();
                const kpiRecordId = item.id; // main_kpi_task 테이블의 id
                const userMatch = itemAssignee === currentUser;
                const isCurrentTaskKpi = currentTaskKpiRecordId && Number(kpiRecordId) === currentTaskKpiRecordId;
                const notUsed = !usedKpiRecordIds.has(Number(kpiRecordId));

                console.log(`KPI #${idx + 1}:`, JSON.stringify({
                  recordId: item.id,
                  kpi_id: item.kpi_id,
                  assignee: `"${itemAssignee}"`,
                  currentUser: `"${currentUser}"`,
                  userMatch,
                  isCurrentTaskKpi,
                  notUsed,
                  willShow: userMatch && (isCurrentTaskKpi || notUsed),
                  usedKpiRecordIds: Array.from(usedKpiRecordIds)
                }, null, 2));
              });

              // 1. 사용자 일치 && (2. 현재 task KPI이거나 3. 아직 사용되지 않은 KPI)
              const displayKpiData = actualKpiData.filter((item) => {
                const itemAssignee = item?.assignee?.trim();
                const currentUser = userName?.trim();
                const kpiRecordId = item.id;
                const isCurrentTaskKpi = currentTaskKpiRecordId && Number(kpiRecordId) === currentTaskKpiRecordId;

                return itemAssignee === currentUser && (isCurrentTaskKpi || !usedKpiRecordIds.has(Number(kpiRecordId)));
              });
              console.log('✅ 필터링된 KPI 데이터:', displayKpiData.length);

              if (displayKpiData.length === 0) {
                return (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      사용 가능한 KPI가 없습니다.
                    </Typography>
                  </Box>
                );
              }

              // 페이지네이션 계산
              const itemsPerPage = 11;
              const totalPages = Math.ceil(displayKpiData.length / itemsPerPage);
              const startIndex = (kpiPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedData = displayKpiData.slice(startIndex, endIndex);

              // 테이블 형태로 렌더링
              return (
                <>
                  <Box sx={{ flex: 1, overflow: 'auto', px: 3, pt: 2 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'grey.50' }}>
                            <TableCell
                              padding="checkbox"
                              sx={{ width: 50, fontSize: '12px', fontWeight: 600, px: 0.5, whiteSpace: 'nowrap', textAlign: 'center' }}
                            >
                              선택
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 60, textAlign: 'center', fontSize: '12px' }}>NO</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 150, fontSize: '12px' }}>개요</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 120, fontSize: '12px' }}>Main</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 150, fontSize: '12px' }}>Sub</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>팀</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 80, fontSize: '12px' }}>담당자</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>시작일</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>완료일</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedData.map((kpi, index) => {
                            // main_kpi_task 필드 매핑 (계층 구조)
                            const overview = (kpi as any).kpi_work_content || '-'; // KPI의 work_content (주요과제)
                            const main = (kpi as any).level === 0 ? (kpi as any).text : (kpi as any).parent_task_text || '-'; // 레벨 0 또는 부모 태스크
                            const sub = (kpi as any).level === 1 ? (kpi as any).text : '-'; // 레벨 1 태스크
                            const team = kpi.team || '-';
                            const assignee = kpi.assignee || '-';
                            const startDate = kpi.start_date || kpi.registration_date || kpi.registrationDate || '-';
                            const completedDate = (kpi as any).due_date || kpi.completed_date || kpi.completedDate || '-';

                            return (
                              <TableRow
                                key={kpi.id}
                                hover
                                sx={{
                                  '&:hover': { backgroundColor: 'action.hover' }
                                }}
                              >
                                <TableCell padding="checkbox" sx={{ width: 50, px: 0.5 }}>
                                  <Radio
                                    size="small"
                                    checked={selectedKpiData?.id === kpi.id}
                                    onChange={() => setSelectedKpiData(kpi)}
                                    sx={{
                                      padding: '0px',
                                      transform: 'scale(0.75)',
                                      '& .MuiSvgIcon-root': { fontSize: 14 }
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {startIndex + index + 1}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {overview}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {main}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {sub}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ width: 100 }}>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {team}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {assignee}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {startDate}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {completedDate}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* 페이지네이션 - 하단 고정 */}
                  {totalPages > 1 && (
                    <Box
                      sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        p: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Pagination
                        count={totalPages}
                        page={kpiPage}
                        onChange={(event, value) => setKpiPage(value)}
                        color="primary"
                        size="small"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontSize: '12px'
                          }
                        }}
                      />
                    </Box>
                  )}
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

TaskEditDialog.displayName = 'TaskEditDialog';

export default TaskEditDialog;
