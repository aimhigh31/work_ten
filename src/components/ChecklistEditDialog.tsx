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
  Tooltip,
  Pagination
} from '@mui/material';
import { TaskTableData, TaskStatus } from '../types/task';
import { useSession } from 'next-auth/react';

// 체크리스트 에디터 아이템 타입 정의 (useSupabaseChecklistEditor와 일치)
interface ChecklistEditorItem {
  id: number;
  majorCategory: string;
  subCategory: string; // minorCategory -> subCategory로 변경
  title: string;
  description: string;
  selected?: boolean;
}
import { useOptimizedInput } from '../hooks/useDebounce';
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import useUser from '../hooks/useUser';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseChecklistEditor } from '../hooks/useSupabaseChecklistEditor';
import { useSupabaseDepartmentManagement } from '../hooks/useSupabaseDepartmentManagement';
import { useSupabaseChecklistManagement } from '../hooks/useSupabaseChecklistManagement';
// import { usePerformanceMonitor } from '../utils/performance';

// Icons
import { TableDocument, Category, Element, Add, Trash, AttachSquare } from '@wandersonalwes/iconsax-react';

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
}

type EditTaskAction =
  | { type: 'SET_FIELD'; field: keyof EditTaskState; value: string }
  | { type: 'SET_TASK'; task: TaskTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; code: string; registrationDate: string; assignee: string };

const editTaskReducer = (state: EditTaskState, action: EditTaskAction): EditTaskState => {
  switch (action.type) {
    case 'SET_FIELD':
      // progress 필드는 숫자로 변환
      if (action.field === 'progress') {
        return { ...state, [action.field]: Number(action.value) || 0 };
      }
      return { ...state, [action.field]: action.value };
    case 'SET_TASK':
      return {
        workContent: action.task.workContent,
        description: (action.task as any).description || '',
        assignee: action.task.assignee,
        status: action.task.status,
        code: action.task.code,
        registrationDate: action.task.registrationDate || '',
        completedDate: action.task.completedDate || '',
        team: (action.task as any).team || '',
        department: (action.task as any).department || '',
        progress: action.task.progress || 0
      };
    case 'INIT_NEW_TASK':
      return {
        workContent: '',
        description: '',
        assignee: action.assignee,
        status: '대기',
        code: action.code,
        registrationDate: action.registrationDate,
        completedDate: '',
        team: '',
        department: '',
        progress: 0
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
        department: ''
      };
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
    checklistCategories,
    masterCodeLoading,
    teamOptions,
    departmentLoading,
    assigneeOptions,
    currentUser,
    currentUserCode,
    users
  }: {
    taskState: EditTaskState;
    onFieldChange: (field: keyof EditTaskState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: TaskStatus[];
    statusColors: Record<TaskStatus, any>;
    checklistCategories: { value: string; label: string }[];
    masterCodeLoading: boolean;
    teamOptions: { value: string; label: string }[];
    departmentLoading: boolean;
    assigneeOptions: { value: string; label: string; email?: string; avatar?: string }[];
    currentUser: any;
    currentUserCode: string;
    users: any[];
  }) => {
    // users 배열 상태 로그
    console.log('👥 [체크리스트 OverviewTab] users 배열:', {
      count: users?.length || 0,
      loaded: !!users && users.length > 0,
      taskStateAssignee: taskState.assignee
    });

    // TextField 직접 참조를 위한 ref
    const workContentRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // 텍스트 필드용 최적화된 입력 관리
    const workContentInput = useOptimizedInput(taskState.workContent, 300);
    const descriptionInput = useOptimizedInput(taskState.description, 300);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림 (onFieldChange 의존성 제거로 최적화)
    useEffect(() => {
      if (!isUpdatingRef.current && workContentInput.debouncedValue !== taskState.workContent) {
        isUpdatingRef.current = true;
        onFieldChange('workContent', workContentInput.debouncedValue);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 350);
      }
    }, [workContentInput.debouncedValue, taskState.workContent]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && descriptionInput.debouncedValue !== taskState.description) {
        isUpdatingRef.current = true;
        onFieldChange('description', descriptionInput.debouncedValue);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 350);
      }
    }, [descriptionInput.debouncedValue, taskState.description]); // onFieldChange 제거

    // 외부에서 상태가 변경될 때 입력 값 동기화 (reset 함수 의존성 제거로 최적화)
    useEffect(() => {
      // isUpdatingRef가 true면 현재 동기화 중이므로 무시
      if (isUpdatingRef.current) return;

      // 외부에서 값이 변경되었고, 현재 입력값이나 디바운스 값과 다를 때만 동기화
      const isExternalChange =
        taskState.workContent !== workContentInput.inputValue && taskState.workContent !== workContentInput.debouncedValue;

      if (isExternalChange) {
        isUpdatingRef.current = true;
        workContentInput.reset(taskState.workContent);
        // 디바운스 시간보다 길게 유지하여 순환 참조 방지
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 350);
      }
    }, [taskState.workContent, workContentInput.inputValue, workContentInput.debouncedValue]); // reset 제거

    useEffect(() => {
      // isUpdatingRef가 true면 현재 동기화 중이므로 무시
      if (isUpdatingRef.current) return;

      // 외부에서 값이 변경되었고, 현재 입력값이나 디바운스 값과 다를 때만 동기화
      const isExternalChange =
        taskState.description !== descriptionInput.inputValue && taskState.description !== descriptionInput.debouncedValue;

      if (isExternalChange) {
        isUpdatingRef.current = true;
        descriptionInput.reset(taskState.description);
        // 디바운스 시간보다 길게 유지하여 순환 참조 방지
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 350);
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

          {/* 체크리스트분류, 상태 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>체크리스트분류</InputLabel>
              <Select
                value={taskState.department}
                label="체크리스트분류"
                onChange={handleFieldChange('department')}
                disabled={masterCodeLoading}
              >
                {masterCodeLoading ? (
                  <MenuItem value="">로딩 중...</MenuItem>
                ) : checklistCategories.length === 0 ? (
                  <MenuItem value="">옵션 없음</MenuItem>
                ) : (
                  checklistCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select value={taskState.status} label="상태" onChange={handleFieldChange('status')}>
                {statusOptions.map((status) => {
                  const getStatusStyle = (statusName: string) => {
                    switch (statusName) {
                      case '완료':
                        return { color: '#4CAF50', backgroundColor: '#E8F5E9' };
                      case '대기':
                        return { color: '#9E9E9E', backgroundColor: '#F5F5F5' };
                      case '진행':
                        return { color: '#2196F3', backgroundColor: '#E3F2FD' };
                      case '홀딩':
                        return { color: '#F44336', backgroundColor: '#FFEBEE' };
                      case '취소':
                        return { color: '#F44336', backgroundColor: '#FFEBEE' };
                      default:
                        return { color: '#000000', backgroundColor: '#F5F5F5' };
                    }
                  };

                  const statusStyle = getStatusStyle(status);

                  return (
                    <MenuItem key={status} value={status}>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          backgroundColor: statusStyle.backgroundColor,
                          color: statusStyle.color,
                          fontWeight: 500,
                          fontSize: '12px',
                          display: 'inline-block'
                        }}
                      >
                        {status}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          {/* 팀과 등록자 - 좌우 배치 */}
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
              label="등록자"
              required
              value={users.find((u) => u.user_code === taskState.assignee)?.user_name || ''}
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
                  const assigneeUser = users.find((u) => u.user_code === taskState.assignee);
                  const avatarUrl = assigneeUser ? (assigneeUser.profile_image_url || assigneeUser.avatar_url) : '';
                  console.log('👤 [체크리스트 등록자 필드] 프로필 이미지:', {
                    assignee: taskState.assignee,
                    found: !!assigneeUser,
                    user_name: assigneeUser?.user_name,
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
    draggedItemId
  }: any) => {
    // 필터 및 뷰 모드 상태 관리
    const [filter, setFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

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

    const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newViewMode: 'list' | 'kanban' | null) => {
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
                  item.status === '취소' ? 'error.50' : item.checked || item.status === '완료' ? 'success.50' : 'background.paper',
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

                {/* 진척율 입력 */}
                <Box sx={{ minWidth: '60px', mr: 1 }}>
                  <TextField
                    type="number"
                    value={item.progressRate || 0}
                    onChange={(e) => onProgressRateChange(item.id, Number(e.target.value))}
                    size="small"
                    variant="standard"
                    placeholder="0"
                    inputProps={{
                      min: 0,
                      max: 100,
                      style: { textAlign: 'center' }
                    }}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: <Typography sx={{ fontSize: '12px', color: '#606060' }}>%</Typography>
                    }}
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-input': {
                        fontSize: '12px',
                        py: 0.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        px: 0.5
                      }
                    }}
                  />
                </Box>

                {/* 완료일 선택 */}
                <Box sx={{ minWidth: '140px', mr: 1 }}>
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

                {/* 하위 항목 개수 표시 */}
                {hasChildren && (
                  <Chip
                    label={`${childrenCount}개`}
                    size="small"
                    sx={{
                      height: '18px',
                      fontSize: '9px',
                      backgroundColor: 'info.100',
                      color: 'info.dark'
                    }}
                  />
                )}

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
        return checklistItems.filter((item) => item.status === status);
      };

      return (
        <Box
          sx={{
            height: '500px',
            overflowY: 'auto',
            fontFamily: '"Inter", "Noto Sans KR", sans-serif'
          }}
        >
          <style>{`
          .kanban-board {
            display: flex;
            gap: 16px;
            padding: 0 8px;
            overflow-x: hidden;
            height: calc(100% - 20px);
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
    }, [checklistItems]);

    return (
      <Box sx={{ height: '650px', px: '2.5%', display: 'flex', flexDirection: 'column' }}>
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

        {/* 등록 버튼과 입력 필드를 좌우 배치 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="새 계획 항목을 입력하세요..."
            value={newChecklistText}
            onChange={(e) => onNewChecklistChange(e.target.value)}
            onKeyPress={handleChecklistKeyPress}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={onAddChecklistItem}
            disabled={!newChecklistText.trim()}
            sx={{ minWidth: '80px', height: '40px' }}
          >
            등록
          </Button>
        </Box>

        {/* 뷰 모드별 렌더링 */}
        {viewMode === 'list' && (
          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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

        {viewMode === 'kanban' && <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>{renderKanbanView()}</Box>}
      </Box>
    );
  }
);

PlanTab.displayName = 'PlanTab';

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
    onEditCommentTextChange
  }: any) => {
    const handleCommentKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onAddComment();
        }
      },
      [onAddComment]
    );

    return (
      <Box sx={{ height: '650px', px: '5%' }}>
        {/* 새 기록 등록 - 좌우 배치 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3, pt: 2 }}>
          <Avatar sx={{ width: 32, height: 32, mt: 0.5 }}>U</Avatar>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="새 기록을 입력하세요..."
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            onKeyPress={handleCommentKeyPress}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
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
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Stack spacing={2}>
            {comments.map((comment: any) => (
              <Paper
                key={comment.id}
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
                  <Avatar sx={{ width: 32, height: 32 }}>{comment.author.charAt(0)}</Avatar>

                  {/* 기록 내용 영역 */}
                  <Box sx={{ flexGrow: 1 }}>
                    {/* 사용자 정보 및 시간 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {comment.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
      </Box>
    );
  }
);

RecordTab.displayName = 'RecordTab';

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

// 메인 ChecklistEditDialog 컴포넌트
interface ChecklistEditDialogProps {
  open: boolean;
  onClose: () => void;
  task: TaskTableData | null;
  onSave: (task: TaskTableData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: TaskStatus[];
  statusColors: Record<TaskStatus, any>;
}

const ChecklistEditDialog = memo(
  ({ open, onClose, task, onSave, assignees, assigneeAvatars, statusOptions, statusColors }: ChecklistEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('ChecklistEditDialog');

    // 로그인한 사용자 정보 가져오기
    const { data: session } = useSession();
    const user = useUser();

    // 마스터코드 훅 사용
    const { getSubCodesByGroup, loading: masterCodeLoading, subCodes } = useSupabaseMasterCode3();

    // 부서관리 훅 사용
    const { departments, loading: departmentLoading } = useSupabaseDepartmentManagement();

    // CommonData 훅 사용 (캐싱된 사용자 데이터)
    const { users } = useCommonData();

    // 세션 email로 DB에서 사용자 찾기
    const currentUser = useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      const foundUser = users.find((u) => u.email === session.user.email);
      console.log('👤 [체크리스트 메인] 현재 로그인 사용자:', {
        email: session.user.email,
        user_name: foundUser?.user_name,
        user_code: foundUser?.user_code,
        profile_image_url: foundUser?.profile_image_url,
        avatar_url: foundUser?.avatar_url
      });
      return foundUser;
    }, [session, users]);

    const currentUserCode = currentUser?.user_code || '';

    // 체크리스트 관리 훅 사용 (코드 생성용)
    const { generateChecklistCode } = useSupabaseChecklistManagement();

    // 체크리스트 에디터 훅 사용
    const {
      editorItems,
      loading: editorLoading,
      error: editorError,
      fetchEditorItems,
      createEditorItem,
      updateEditorItem,
      deleteEditorItem,
      saveEditorItems
    } = useSupabaseChecklistEditor();

    // GROUP006 체크리스트분류 서브코드 조회
    const checklistCategories = useMemo(() => {
      console.log('🔍 GROUP006 서브코드 조회 시작');
      console.log('📊 마스터코드 로딩 상태:', masterCodeLoading);
      console.log('📋 전체 서브코드 수:', subCodes.length);

      if (masterCodeLoading) {
        console.log('⏳ 마스터코드 로딩 중...');
        return [];
      }

      const group006SubCodes = getSubCodesByGroup('GROUP006');
      console.log('📋 GROUP006 서브코드 결과:', group006SubCodes);

      if (!group006SubCodes || group006SubCodes.length === 0) {
        console.log('⚠️ GROUP006 서브코드가 없음, 기본값 사용');
        return [
          { value: 'GROUP006-SUB001', label: '보안' },
          { value: 'GROUP006-SUB002', label: '기획' },
          { value: 'GROUP006-SUB003', label: '품질' },
          { value: 'GROUP006-SUB004', label: 'IT' }
        ];
      }

      const categories = group006SubCodes.map((subCode) => ({
        value: subCode.subcode,
        label: subCode.subcode_name // subCodeName -> subcode_name으로 수정
      }));

      console.log('🎯 변환된 카테고리:', categories);
      return categories;
    }, [getSubCodesByGroup, masterCodeLoading, subCodes]);

    // 부서 목록을 팀 드롭다운 옵션으로 변환
    const teamOptions = useMemo(() => {
      console.log('🏢 부서 목록 조회 시작');
      console.log('📊 부서 로딩 상태:', departmentLoading);
      console.log('📋 전체 부서 수:', departments.length);

      if (departmentLoading) {
        console.log('⏳ 부서 데이터 로딩 중...');
        return [];
      }

      // 활성화된 부서만 필터링하고 팀 드롭다운 옵션으로 변환
      const activeTeams = departments
        .filter((dept) => dept.is_active)
        .map((dept) => ({
          value: dept.department_name,
          label: dept.department_name
        }));

      console.log('🎯 변환된 팀 옵션:', activeTeams);
      return activeTeams;
    }, [departments, departmentLoading]);

    // 사용자 목록을 담당자 드롭다운 옵션으로 변환
    const assigneeOptions = useMemo(() => {
      console.log('👤 [체크리스트] 사용자 목록 조회 시작');
      console.log('📋 [체크리스트] 전체 사용자 수:', users.length);

      // 활성화된 사용자만 필터링하고 담당자 드롭다운 옵션으로 변환
      // value는 user_code, label은 user_name으로 설정
      const activeUsers = users
        .filter((user) => user.is_active && user.status === 'active')
        .map((user) => ({
          value: user.user_code, // user_code를 value로 저장
          label: user.user_name, // user_name을 표시
          email: user.email, // 추가 정보로 이메일도 저장
          avatar: user.profile_image_url || user.avatar_url // 프로필 이미지 URL
        }));

      console.log('🎯 [체크리스트] 변환된 담당자 옵션:', activeUsers.length, '개');
      return activeUsers;
    }, [users]);

    // user_code로 user_name을 찾는 헬퍼 함수
    const getUserNameByCode = useCallback(
      (userCode: string) => {
        const user = users.find((u) => u.user_code === userCode);
        return user ? user.user_name : userCode; // user를 찾지 못하면 code 그대로 반환
      },
      [users]
    );

    const [editTab, setEditTab] = useState(0);
    // 에디터 탭 임시 데이터 저장용 State
    const [tempEditorData, setTempEditorData] = useState<ChecklistEditorItem[]>([]);
    const [hasUnsavedEditorData, setHasUnsavedEditorData] = useState(false);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

    // 체크리스트 에디터 상태 (Supabase 데이터 사용)
    // editorItems는 useSupabaseChecklistEditor 훅에서 관리
    const [checklistItems, setChecklistItems] = useState<ChecklistEditorItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [editingCell, setEditingCell] = useState<{ itemId: number; field: string } | null>(null);
    const [editorPage, setEditorPage] = useState(0);
    const [editorRowsPerPage, setEditorRowsPerPage] = useState(9);
    const [taskState, dispatch] = useReducer(editTaskReducer, {
      workContent: '',
      description: '',
      assignee: '',
      status: '대기',
      code: '',
      registrationDate: '',
      completedDate: '',
      team: '',
      department: ''
    });

    // 코드 자동 생성 함수
    const generateTaskCode = useCallback(async () => {
      return await generateChecklistCode();
    }, [generateChecklistCode]);

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }, []);

    // Task 변경 시 상태 업데이트
    React.useEffect(() => {
      const initTask = async () => {
        if (task) {
          dispatch({ type: 'SET_TASK', task });
        } else if (open) {
          // 새 Task 생성 시 자동으로 코드와 등록일, 담당자 설정
          const newCode = await generateTaskCode();
          const newRegistrationDate = getCurrentDate();
          dispatch({
            type: 'INIT_NEW_TASK',
            code: newCode,
            registrationDate: newRegistrationDate,
            assignee: currentUserCode
          });
        }
      };
      initTask();
    }, [task, open, generateTaskCode, getCurrentDate, currentUserCode]);

    // 팀을 로그인한 사용자의 부서로 자동 설정
    React.useEffect(() => {
      if (user && typeof user !== 'boolean' && user.department && !taskState.team && !task && open) {
        dispatch({ type: 'SET_FIELD', field: 'team', value: user.department });
      }
    }, [user, taskState.team, task, open]);

    // 담당자를 로그인한 사용자로 자동 설정
    React.useEffect(() => {
      if (open && currentUserCode && !taskState.assignee && assigneeOptions.length > 0) {
        // assigneeOptions에서 현재 로그인한 사용자 찾기
        const assigneeUser = assigneeOptions.find((opt) => opt.value === currentUserCode);

        if (assigneeUser) {
          dispatch({ type: 'SET_FIELD', field: 'assignee', value: currentUserCode });
        }
      }
    }, [open, currentUserCode, taskState.assignee, assigneeOptions]);

    // 성능 모니터링 로그 제거 (프로덕션 준비)
    // useEffect(() => {
    //   if (process.env.NODE_ENV === 'development' && renderCount > 1) {
    //     console.log(`🔄 ChecklistEditDialog 렌더링 횟수: ${renderCount}`);
    //     if (renderCount % 10 === 0) {
    //       const stats = logStats();
    //       console.log('📊 ChecklistEditDialog 성능 통계:', stats);
    //     }
    //   }
    // }, [renderCount, logStats]);

    const [newChecklistText, setNewChecklistText] = useState('');
    const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
    const [editingChecklistText, setEditingChecklistText] = useState('');

    // 코멘트 상태
    const [comments, setComments] = useState<Array<{ id: number; author: string; content: string; timestamp: string; avatar?: string }>>(
      []
    );
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
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

    // 에러 상태
    const [validationError, setValidationError] = useState<string>('');

    // Task 변경 시 상태 업데이트
    React.useEffect(() => {
      if (task) {
        dispatch({ type: 'SET_TASK', task });
      }
    }, [task]);

    // 체크리스트 에디터 데이터 로드
    React.useEffect(() => {
      if (task?.id && open && editTab === 1) {
        console.log('🔄 체크리스트 에디터 데이터 로드:', task.id);
        fetchEditorItems(task.id);
      }
    }, [task?.id, open, editTab, fetchEditorItems]);

    // Supabase 에디터 데이터를 로컬 상태와 동기화
    React.useEffect(() => {
      if (editorItems.length > 0) {
        console.log('📋 Supabase 에디터 데이터를 로컬 상태에 동기화:', editorItems.length, '개');
        setChecklistItems(editorItems);
      }
    }, [editorItems]);

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditTaskState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleTabChange = useCallback(
      (event: React.SyntheticEvent, newValue: number) => {
        // 에디터 탭에서 다른 탭으로 이동 시 현재 데이터를 임시 저장
        if (editTab === 1 && newValue !== 1) {
          if (checklistItems.length > 0) {
            setTempEditorData(checklistItems);
            setHasUnsavedEditorData(true);
            console.log('📦 에디터 데이터 임시 저장:', checklistItems.length, '개 항목');
          }
        }
        // 에디터 탭으로 이동 시
        else if (newValue === 1) {
          // 임시 데이터가 있으면 복원
          if (tempEditorData.length > 0) {
            setChecklistItems(tempEditorData);
            console.log('📂 임시 에디터 데이터 복원:', tempEditorData.length, '개 항목');
          }
          // 임시 데이터가 없으면 현재 checklistItems 유지
          console.log('📋 현재 에디터 데이터:', checklistItems.length, '개 항목');
        }
        setEditTab(newValue);
      },
      [editTab, checklistItems, tempEditorData]
    );

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

      // 에러 초기화
      setValidationError('');

      // 현재 입력 값들을 taskState에 즉시 반영
      if (currentValues.workContent !== taskState.workContent) {
        dispatch({ type: 'SET_FIELD', field: 'workContent', value: currentValues.workContent });
      }
      if (currentValues.description !== taskState.description) {
        dispatch({ type: 'SET_FIELD', field: 'description', value: currentValues.description });
      }

      try {
        let savedTask: any = null;

        // 1단계: 개요 저장
        if (!task) {
          // 새 Task 생성
          const newTask: TaskTableData = {
            id: Date.now(),
            no: 0,
            workContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status === '작성중' ? '대기' : taskState.status,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            startDate: new Date().toISOString().split('T')[0],
            completedDate: taskState.completedDate,
            description: currentValues.description,
            team: taskState.team,
            department: taskState.department,
            progress: taskState.progress,
            attachments: []
          } as any;

          console.log('🚀 새 Task 생성 중:', newTask);
          const savedId = await Promise.resolve(onSave(newTask));

          if (savedId && typeof savedId === 'number') {
            newTask.id = savedId;
            console.log('✅ 새 체크리스트 생성 완료, ID:', savedId);
          }
          savedTask = newTask;
        } else {
          // 기존 Task 수정
          const updatedTask: TaskTableData = {
            ...task,
            workContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status === '작성중' ? '대기' : taskState.status,
            startDate: task.startDate || new Date().toISOString().split('T')[0],
            completedDate: taskState.completedDate,
            description: currentValues.description,
            team: taskState.team,
            department: taskState.department,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            progress: taskState.progress
          } as any;

          console.log('📝 기존 Task 수정 중:', updatedTask);
          await Promise.resolve(onSave(updatedTask));
          savedTask = updatedTask;
        }

        // 2단계: 에디터 데이터 저장
        // 현재 에디터 탭에 있으면 checklistItems 사용,
        // 다른 탭에 있고 임시 데이터가 있으면 tempEditorData 사용
        let editorDataToSave = [];

        if (editTab === 1) {
          // 현재 에디터 탭에 있으면 현재 데이터 사용
          editorDataToSave = checklistItems;
          console.log('📋 현재 에디터 탭 데이터 사용:', checklistItems.length, '개');
        } else if (hasUnsavedEditorData && tempEditorData.length > 0) {
          // 다른 탭에 있고 임시 데이터가 있으면 임시 데이터 사용
          editorDataToSave = tempEditorData;
          console.log('📦 임시 저장된 에디터 데이터 사용:', tempEditorData.length, '개');
        } else {
          // 둘 다 없으면 빈 배열
          console.log('ℹ️ 저장할 에디터 데이터가 없습니다');
        }

        const checklistId = savedTask?.id || task?.id;

        if (checklistId) {
          console.log('💾 체크리스트 에디터 데이터 저장 중...', editorDataToSave.length, '개 항목');
          console.log('📋 저장할 에디터 데이터 상세:', editorDataToSave);

          const success = await saveEditorItems(checklistId, editorDataToSave);

          if (success) {
            console.log('✅ 체크리스트 에디터 데이터 저장 완료');
            // 저장 성공 시 임시 데이터 초기화
            setTempEditorData([]);
            setHasUnsavedEditorData(false);
            setChecklistItems([]); // 저장 후 로컬 상태도 초기화
          } else {
            console.error('❌ 체크리스트 에디터 데이터 저장 실패');
            // 실패 시 사용자에게 알림
            setValidationError('에디터 데이터 저장에 실패했습니다.');
            return;
          }
        } else {
          console.log('⚠️ 체크리스트 ID가 없어 에디터 데이터를 저장할 수 없습니다');
        }

        console.log('✅ 모든 데이터 저장 완료');
        onClose();
      } catch (error) {
        console.error('❌ 저장 중 오류 발생:', error);
        setValidationError('저장 중 오류가 발생했습니다.');
      }
    }, [task, taskState, onSave, onClose, dispatch, editTab, checklistItems, tempEditorData, hasUnsavedEditorData, saveEditorItems]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setTempEditorData([]); // 임시 데이터 초기화
      setHasUnsavedEditorData(false);
      setComments([]);
      setMaterials([]);
      setNewComment('');
      setNewChecklistText('');
      setValidationError('');
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
        assignee: '' // 기본 담당자는 빈 값으로 설정 (user_code가 들어갈 예정)
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

    const handleToggleChecklistItem = useCallback(
      (index: number) => {
        setChecklistItems((prev) => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
        // 에디터 탭에서 데이터 변경 시 플래그 설정
        if (editTab === 1) {
          setHasUnsavedEditorData(true);
        }
      },
      [editTab]
    );

    // 체크리스트 상태 변경 핸들러
    const handleChecklistStatusChange = useCallback(
      (id: number, status: string) => {
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
        // 에디터 탭에서 데이터 변경 시 플래그 설정
        if (editTab === 1) {
          setHasUnsavedEditorData(true);
        }
      },
      [editTab]
    );

    // 체크리스트 완료일 변경 핸들러
    const handleChecklistDueDateChange = useCallback(
      (id: number, dueDate: string) => {
        setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, dueDate } : item)));
        // 에디터 탭에서 데이터 변경 시 플래그 설정
        if (editTab === 1) {
          setHasUnsavedEditorData(true);
        }
      },
      [editTab]
    );

    // 체크리스트 진척율 변경 핸들러
    const handleChecklistProgressRateChange = useCallback(
      (id: number, progressRate: number) => {
        setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, progressRate } : item)));
        // 에디터 탭에서 데이터 변경 시 임시 저장 플래그 설정
        if (editTab === 1) {
          setHasUnsavedEditorData(true);
        }
      },
      [editTab]
    );

    // 코멘트 핸들러들
    const handleAddComment = useCallback(() => {
      if (!newComment.trim()) return;

      const comment = {
        id: Date.now(),
        author: '현재 사용자',
        content: newComment,
        timestamp: new Date().toLocaleString('ko-KR'),
        avatar: undefined
      };

      setComments((prev) => [...prev, comment]);
      setNewComment('');
    }, [newComment]);

    const handleEditComment = useCallback((commentId: number, content: string) => {
      setEditingCommentId(commentId);
      setEditingCommentText(content);
    }, []);

    const handleSaveEditComment = useCallback(() => {
      if (!editingCommentText.trim() || !editingCommentId) return;

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, content: editingCommentText, timestamp: new Date().toLocaleString('ko-KR') + ' (수정됨)' }
            : comment
        )
      );

      setEditingCommentId(null);
      setEditingCommentText('');
    }, [editingCommentText, editingCommentId]);

    const handleCancelEditComment = useCallback(() => {
      setEditingCommentId(null);
      setEditingCommentText('');
    }, []);

    const handleDeleteComment = useCallback((commentId: number) => {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }, []);

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

    // 에디터 테이블 페이지네이션 데이터
    const paginatedChecklistItems = useMemo(() => {
      const startIndex = editorPage * editorRowsPerPage;
      return checklistItems.slice(startIndex, startIndex + editorRowsPerPage);
    }, [checklistItems, editorPage, editorRowsPerPage]);

    // 에디터 테이블 총 페이지 수
    const editorTotalPages = Math.ceil(checklistItems.length / editorRowsPerPage);

    // 체크리스트 에디터 핸들러들
    const handleAddItem = useCallback(() => {
      // 빈 배열일 때 Math.max가 -Infinity를 반환하는 것을 방지
      const existingIds = checklistItems.map((item) => item.id).filter((id) => typeof id === 'number' && !isNaN(id));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      const newId = maxId + 1;

      const newItem: ChecklistEditorItem = {
        id: newId,
        majorCategory: '',
        subCategory: '',
        title: '',
        description: ''
      };

      // 로컬 상태 업데이트 (즉시 UI 반영) - 헤더 바로 아래에 추가
      setChecklistItems([newItem, ...checklistItems]);

      // 에디터 탭에서 데이터 변경 시 플래그 설정
      if (editTab === 1) {
        setHasUnsavedEditorData(true);
      }

      console.log('✅ 새 항목이 추가되었습니다. (저장 버튼 클릭 시 데이터베이스에 저장됩니다)');
    }, [checklistItems, editTab]);

    const handleDeleteSelectedItems = useCallback(() => {
      if (selectedItems.length === 0) {
        return;
      }

      console.log('🗑️ 선택한 항목들을 삭제 중...', selectedItems);

      // 로컬 상태 업데이트 (즉시 UI 반영)
      const remainingItems = checklistItems.filter((item) => !selectedItems.includes(item.id));
      setChecklistItems(remainingItems);
      setSelectedItems([]);

      // 에디터 탭에서 데이터 변경 시 플래그 설정
      if (editTab === 1) {
        setHasUnsavedEditorData(true);
      }

      console.log('✅ 선택된 항목들이 삭제되었습니다. (저장 버튼 클릭 시 데이터베이스에 반영됩니다)');
    }, [selectedItems, checklistItems, editTab]);

    const handleSelectAllItems = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
          setSelectedItems(paginatedChecklistItems.map((item) => item.id));
        } else {
          setSelectedItems([]);
        }
      },
      [paginatedChecklistItems]
    );

    const handleSelectItem = useCallback((itemId: number) => {
      setSelectedItems((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    }, []);

    const handleItemChange = useCallback(
      (itemId: number, field: string, value: string) => {
        // 먼저 로컬 상태 업데이트 (즉시 UI 반영) - 빈 값도 허용
        setChecklistItems((items) =>
          items.map((item) => {
            if (item.id === itemId) {
              return { ...item, [field]: value };
            }
            return item;
          })
        );

        // 에디터 탭에서 데이터 변경 시 플래그 설정
        if (editTab === 1) {
          setHasUnsavedEditorData(true);
        }

        console.log(`✅ 항목 ${itemId}의 ${field}가 수정되었습니다. (저장 버튼 클릭 시 데이터베이스에 반영됩니다)`);
      },
      [editTab]
    );

    // 메모이제이션된 탭 컴포넌트 props
    const overviewTabProps = useMemo(
      () => ({
        taskState,
        onFieldChange: handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors,
        checklistCategories,
        masterCodeLoading,
        teamOptions,
        departmentLoading,
        assigneeOptions,
        currentUser,
        currentUserCode,
        users
      }),
      [
        taskState,
        handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors,
        checklistCategories,
        masterCodeLoading,
        teamOptions,
        departmentLoading,
        assigneeOptions,
        currentUser,
        currentUserCode,
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
        draggedItemId
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
        draggedItemId
      ]
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
        onEditCommentTextChange: setEditingCommentText
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
        handleDeleteComment
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
              체크리스트관리 편집
            </Typography>
            {task && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                {task.workContent} ({task.code})
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
            <Tab label="에디터" disabled={false} />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 1, pt: 1 }}>
          {editTab === 0 && <OverviewTab {...overviewTabProps} />}
          {editTab === 1 && (
            <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden' }}>
              {/* 헤더 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                  체크리스트 항목 관리
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteSelectedItems}
                    disabled={selectedItems.length === 0}
                    size="small"
                  >
                    삭제({selectedItems.length})
                  </Button>
                  <Button variant="contained" onClick={handleAddItem} size="small" sx={{ fontSize: '12px' }}>
                    추가
                  </Button>
                </Box>
              </Box>

              {/* 에러 상태 표시 */}
              {editorError && editorError.includes('테이블이 아직 생성되지 않았습니다') && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">체크리스트 에디터 기능을 사용하려면 먼저 데이터베이스 테이블을 생성해주세요.</Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Supabase Dashboard → SQL Editor에서 admin_checklist_editor 테이블을 생성하세요.
                  </Typography>
                </Alert>
              )}

              {/* 테이블 */}
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
                      <TableCell padding="checkbox" sx={{ width: 50, minWidth: 50, maxWidth: 50 }}>
                        <Checkbox
                          checked={
                            paginatedChecklistItems.length > 0 && paginatedChecklistItems.every((item) => selectedItems.includes(item.id))
                          }
                          onChange={handleSelectAllItems}
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
                      <TableCell sx={{ width: 60, fontWeight: 600, minWidth: 60, maxWidth: 60 }}>NO</TableCell>
                      <TableCell sx={{ width: 120, fontWeight: 600, minWidth: 120, maxWidth: 120 }}>대분류</TableCell>
                      <TableCell sx={{ width: 120, fontWeight: 600, minWidth: 120, maxWidth: 120 }}>소분류</TableCell>
                      <TableCell sx={{ width: 200, fontWeight: 600, minWidth: 200, maxWidth: 200 }}>점검항목</TableCell>
                      <TableCell sx={{ width: 250, fontWeight: 600, minWidth: 250, maxWidth: 250 }}>세부설명</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedChecklistItems.map((item, index) => (
                      <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell sx={{ width: 50, padding: 0, height: 48, minWidth: 50, maxWidth: 50 }}>
                          <Box sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
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
                        <TableCell sx={{ width: 60, padding: 0, height: 48, minWidth: 60, maxWidth: 60 }}>
                          <Box sx={{ height: 48, display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                            {checklistItems.length - (editorPage * editorRowsPerPage + index)}
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{ width: 120, padding: 0, height: 48, minWidth: 120, maxWidth: 120 }}
                          onClick={() => setEditingCell({ itemId: item.id, field: 'majorCategory' })}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'majorCategory' ? (
                            <Box sx={{ width: '100%', height: '48px', position: 'relative', padding: '8px 12px' }}>
                              <TextField
                                value={item.majorCategory || ''}
                                onChange={(e) => handleItemChange(item.id, 'majorCategory', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                size="small"
                                fullWidth
                                autoFocus
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                padding: '8px 12px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'text',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {item.majorCategory || '-'}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ width: 120, padding: 0, height: 48, minWidth: 120, maxWidth: 120 }}
                          onClick={() => setEditingCell({ itemId: item.id, field: 'subCategory' })}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'subCategory' ? (
                            <Box sx={{ width: '100%', height: '48px', position: 'relative', padding: '8px 12px' }}>
                              <TextField
                                value={item.subCategory || ''}
                                onChange={(e) => handleItemChange(item.id, 'subCategory', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                size="small"
                                fullWidth
                                autoFocus
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                padding: '8px 12px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'text',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {item.subCategory || '-'}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ width: 200, padding: 0, height: 48, minWidth: 200, maxWidth: 200 }}
                          onClick={() => setEditingCell({ itemId: item.id, field: 'title' })}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'title' ? (
                            <Box sx={{ width: '100%', height: '48px', position: 'relative', padding: '8px 12px' }}>
                              <TextField
                                value={item.title || ''}
                                onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                size="small"
                                fullWidth
                                autoFocus
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                padding: '8px 12px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'text',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {item.title || '-'}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ width: 250, padding: 0, height: 48, minWidth: 250, maxWidth: 250 }}
                          onClick={() => setEditingCell({ itemId: item.id, field: 'description' })}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'description' ? (
                            <Box sx={{ width: '100%', height: '48px', position: 'relative', padding: '8px 12px' }}>
                              <TextField
                                value={item.description || ''}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                size="small"
                                fullWidth
                                autoFocus
                                multiline
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                padding: '8px 12px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'text',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {item.description || '-'}
                              </Typography>
                            </Box>
                          )}
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
                  {checklistItems.length > 0
                    ? `${editorPage * editorRowsPerPage + 1}-${Math.min((editorPage + 1) * editorRowsPerPage, checklistItems.length)} of ${checklistItems.length}`
                    : '0-0 of 0'}
                </Typography>
                {checklistItems.length > 0 && (
                  <Pagination
                    count={editorTotalPages}
                    page={editorPage + 1}
                    onChange={(event, newPage) => setEditorPage(newPage - 1)}
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
          )}
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

ChecklistEditDialog.displayName = 'ChecklistEditDialog';

export default ChecklistEditDialog;
