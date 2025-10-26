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
  Alert
} from '@mui/material';
import { RegulationTableData, RegulationStatus } from '../types/regulation';
import { useOptimizedInput } from '../hooks/useDebounce';
import { useSupabaseUserManagement } from '../hooks/useSupabaseUserManagement';
import { useSupabaseSecurityRevision } from '../hooks/useSupabaseSecurityRevision';
import { useSupabaseSecurityRegulation } from '../hooks/useSupabaseSecurityRegulation';
// import { usePerformanceMonitor } from '../utils/performance';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface EditTaskState {
  workContent: string;
  description: string;
  assignee: string;
  status: RegulationStatus;
  code: string;
  registrationDate: string;
  completedDate: string;
  team: string;
  department: string;
  type: string;
  progress: number;
}

type EditTaskAction =
  | { type: 'SET_FIELD'; field: keyof EditTaskState; value: string }
  | { type: 'SET_TASK'; task: RegulationTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; code: string; registrationDate: string };

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
        type: action.task.type || '',
        progress: action.task.progress || 0
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
        type: '',
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
        department: '',
        type: ''
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
    getLatestRevision,
    getLatestRevisionDate
  }: {
    taskState: EditTaskState;
    onFieldChange: (field: keyof EditTaskState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: RegulationStatus[];
    statusColors: Record<RegulationStatus, any>;
    getLatestRevision: () => string;
    getLatestRevisionDate: () => string;
  }) => {
    // TextField 직접 참조를 위한 ref
    const workContentRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

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

          {/* 보안문서유형, 상태 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              required
              select
              label={
                <span>
                  보안문서유형 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={taskState.type}
              onChange={handleFieldChange('type')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">선택</MenuItem>
              <MenuItem value="보안규정">보안규정</MenuItem>
              <MenuItem value="보안지침">보안지침</MenuItem>
              <MenuItem value="보안절차">보안절차</MenuItem>
              <MenuItem value="보안매뉴얼">보안매뉴얼</MenuItem>
              <MenuItem value="보안정책">보안정책</MenuItem>
            </TextField>

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={taskState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                renderValue={(selected) => {
                  const getStatusColor = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                      case '진행':
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '승인':
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
                      case '취소':
                      case '홀딩':
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
                        backgroundColor: getStatusColor(selected as string).bgcolor,
                        color: getStatusColor(selected as string).color,
                        fontSize: '13px',
                        fontWeight: 400
                      }}
                    />
                  );
                }}
              >
                {statusOptions.map((status) => {
                  const getStatusColor = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { bgcolor: '#F5F5F5', color: '#757575' };
                      case '진행':
                        return { bgcolor: '#E3F2FD', color: '#1976D2' };
                      case '승인':
                      case '완료':
                        return { bgcolor: '#E8F5E9', color: '#388E3C' };
                      case '취소':
                      case '홀딩':
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
                })}
              </Select>
            </FormControl>
          </Stack>

          {/* 최종리비전, 리비전수정일 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="최종리비전"
              value={getLatestRevision()}
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
              label="리비전수정일"
              type="date"
              value={getLatestRevisionDate()}
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

          {/* 팀과 담당자 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              disabled
              label="팀"
              value={taskState.team || ''}
              InputLabelProps={{
                shrink: true
              }}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#000000'
                }
              }}
            />

            <TextField
              fullWidth
              disabled
              label="담당자"
              value={taskState.assignee || ''}
              InputLabelProps={{
                shrink: true
              }}
              InputProps={{
                startAdornment:
                  taskState.assignee && assigneeAvatars[taskState.assignee as keyof typeof assigneeAvatars] ? (
                    <Avatar
                      src={assigneeAvatars[taskState.assignee as keyof typeof assigneeAvatars]}
                      alt={taskState.assignee}
                      sx={{ width: 24, height: 24, mr: 0.25 }}
                    >
                      {taskState.assignee?.charAt(0)}
                    </Avatar>
                  ) : null
              }}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#000000'
                }
              }}
            />
          </Stack>

          {/* 최초등록일과 코드 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="최초등록일"
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

// 폴더 구조 컴포넌트 데이터
const folderData = [
  {
    id: '1',
    name: '정책서',
    type: 'folder',
    children: [
      { id: '1-1', name: '보안정책서.pdf', type: 'file', size: '2.3MB' },
      { id: '1-2', name: '개인정보보호정책.pdf', type: 'file', size: '1.8MB' }
    ]
  },
  {
    id: '2',
    name: '매뉴얼',
    type: 'folder',
    children: [
      { id: '2-1', name: '보안매뉴얼.pdf', type: 'file', size: '3.1MB' },
      { id: '2-2', name: '운영매뉴얼.pdf', type: 'file', size: '2.7MB' }
    ]
  },
  {
    id: '3',
    name: '서식',
    type: 'folder',
    children: [
      { id: '3-1', name: '보안점검표.xlsx', type: 'file', size: '245KB' },
      { id: '3-2', name: '사고보고서.docx', type: 'file', size: '187KB' }
    ]
  }
];

// 폴더 트리 컴포넌트
const FolderTree = memo(({ data, level = 0, expandedFolders, toggleFolder }: any) => {
  return (
    <Box>
      {data.map((item: any) => (
        <Box key={item.id} sx={{ ml: level * 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 0.5,
              px: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              borderRadius: 1
            }}
            onClick={() => item.type === 'folder' && toggleFolder(item.id)}
          >
            <SvgIcon sx={{ mr: 1, fontSize: 16 }}>
              {item.type === 'folder' ? (
                expandedFolders.has(item.id) ? (
                  <path
                    d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                    fill="currentColor"
                  />
                ) : (
                  <path
                    d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                    fill="currentColor"
                  />
                )
              ) : (
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor" />
              )}
            </SvgIcon>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {item.name}
            </Typography>
            {item.type === 'file' && (
              <Typography variant="caption" color="text.secondary">
                {item.size}
              </Typography>
            )}
          </Box>
          {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
            <FolderTree data={item.children} level={level + 1} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
          )}
        </Box>
      ))}
    </Box>
  );
});

FolderTree.displayName = 'FolderTree';

// 폴더 탭 컴포넌트
const FolderTab = memo(() => {
  // 모든 폴더를 펼친 상태로 초기화
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2', '3']));

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  return (
    <Box sx={{ height: '650px', px: '5%' }}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height: 400,
          overflow: 'auto',
          bgcolor: 'background.default',
          mt: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          보안규정 자료실
        </Typography>
        <FolderTree data={folderData} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
      </Paper>
    </Box>
  );
});

FolderTab.displayName = 'FolderTab';

// 메인 RegulationEditDialog 컴포넌트
interface RegulationEditDialogProps {
  open: boolean;
  onClose: () => void;
  task: RegulationTableData | null;
  onSave: (task: RegulationTableData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: RegulationStatus[];
  statusColors: Record<RegulationStatus, any>;
  teams?: string[];
}

const RegulationEditDialog = memo(
  ({ open, onClose, task, onSave, assignees, assigneeAvatars, statusOptions, statusColors, teams }: RegulationEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('RegulationEditDialog');

    const { data: session } = useSession();

    // 사용자관리 훅
    const { users } = useSupabaseUserManagement();

    // 보안규정 훅 (code로 regulation_id 찾기 위함)
    const { items: regulationItems } = useSupabaseSecurityRegulation();

    // 리비전 훅
    const { revisions, fetchRevisions } = useSupabaseSecurityRevision();

    // 로그인한 사용자 정보 가져오기
    const currentUser = useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      return users.find((u) => u.email === session.user.email);
    }, [session, users]);

    // task.code로 regulation_id 찾기
    const regulationId = useMemo(() => {
      if (!task || !task.code || !regulationItems || regulationItems.length === 0) {
        console.log('🔍 regulationId 찾기 실패:', { task: task?.code, itemsLength: regulationItems?.length });
        return null;
      }

      // 모든 파일 찾기 (재귀적으로)
      const findFileByCode = (items: any[]): any => {
        for (const item of items) {
          if (item.type === 'file' && item.code === task.code) {
            console.log('✅ regulation_id 찾음:', { code: task.code, id: item.id });
            return item.id;
          }
          if (item.children) {
            const found = findFileByCode(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const result = findFileByCode(regulationItems);
      if (!result) {
        console.log('❌ regulation_id 못찾음:', { code: task.code });
      }
      return result;
    }, [task, regulationItems]);

    // regulation_id가 있을 때 리비전 데이터 가져오기
    React.useEffect(() => {
      if (regulationId && open) {
        console.log('🔄 리비전 데이터 가져오기 시작:', { regulationId });
        fetchRevisions(regulationId);
      }
    }, [regulationId, open, fetchRevisions]);

    // DB에서 가져온 리비전을 attachedFiles 형태로 변환
    const attachedFiles = useMemo(() => {
      if (!revisions || revisions.length === 0) {
        console.log('📋 attachedFiles 변환: 리비전 없음', { revisionsLength: revisions?.length });
        return [];
      }

      const converted = revisions.map((rev, index) => ({
        id: rev.id.toString(),
        name: rev.file_name,
        size: rev.file_size || '',
        fileDescription: rev.file_description || '',
        createdDate: rev.upload_date,
        revision: rev.revision,
        no: revisions.length - index
      }));

      console.log('📋 attachedFiles 변환 완료:', converted);
      return converted;
    }, [revisions]);

    // 최종 리비전 계산 - R 형식과 v 형식 모두 지원
    const getLatestRevision = useCallback(() => {
      if (attachedFiles.length === 0) {
        console.log('📊 최종리비전: 파일 없음');
        return '';
      }

      // R형식 (R1, R2, R3 등)과 v형식 (v1.0, v1.1, v2.0 등) 모두 처리
      const sortedFiles = [...attachedFiles].sort((a, b) => {
        const getRevisionNumber = (revision: string) => {
          // R형식 처리
          const rMatch = revision.match(/R(\d+)/);
          if (rMatch) return parseInt(rMatch[1]);

          // v형식 처리
          const vMatch = revision.match(/v?(\d+)\.(\d+)/);
          if (vMatch) return parseFloat(`${vMatch[1]}.${vMatch[2]}`);

          return 0;
        };
        return getRevisionNumber(b.revision) - getRevisionNumber(a.revision);
      });

      const result = sortedFiles[0]?.revision || '';
      console.log('📊 최종리비전:', result);
      return result;
    }, [attachedFiles]);

    // 최종 리비전의 등록일 가져오기
    const getLatestRevisionDate = useCallback(() => {
      if (attachedFiles.length === 0) {
        console.log('📅 리비전수정일: 파일 없음');
        return '';
      }

      const latestRevision = getLatestRevision();
      const latestFile = attachedFiles.find((file) => file.revision === latestRevision);
      const result = latestFile?.createdDate || '';

      console.log('📅 리비전수정일:', result);
      return result;
    }, [attachedFiles, getLatestRevision]);

    const [editTab, setEditTab] = useState(0);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [taskState, dispatch] = useReducer(editTaskReducer, {
      workContent: '',
      description: '',
      assignee: '',
      status: '대기',
      code: '',
      registrationDate: '',
      completedDate: '',
      team: '개발팀',
      department: '',
      type: ''
    });

    // 코드 자동 생성 함수
    const generateTaskCode = useCallback(() => {
      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2); // 연도 뒤 2자리

      // 현재 연도의 Task 개수를 기반으로 순번 생성 (실제 구현에서는 서버에서 처리)
      // 여기서는 간단히 현재 시간을 기반으로 순번 생성
      const sequence = String(Date.now()).slice(-3).padStart(3, '0');

      return `TASK-${currentYearStr}-${sequence}`;
    }, []);

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }, []);

    // Task 변경 시 상태 업데이트
    React.useEffect(() => {
      if (task) {
        dispatch({ type: 'SET_TASK', task });
      } else if (open) {
        // 새 Task 생성 시 자동으로 코드와 등록일 설정
        const newCode = generateTaskCode();
        const newRegistrationDate = getCurrentDate();
        dispatch({ type: 'INIT_NEW_TASK', code: newCode, registrationDate: newRegistrationDate });
      }
    }, [task, open, generateTaskCode, getCurrentDate]);

    // 팀을 로그인한 사용자의 부서로 자동 설정
    React.useEffect(() => {
      if (currentUser?.department && !taskState.team && !task) {
        dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
      }
    }, [currentUser, taskState.team, task]);

    // 담당자를 로그인한 사용자로 자동 설정
    React.useEffect(() => {
      if (currentUser?.user_name && !taskState.assignee && !task) {
        dispatch({ type: 'SET_FIELD', field: 'assignee', value: currentUser.user_name });
      }
    }, [currentUser, taskState.assignee, task]);

    // 성능 모니터링 로그 제거 (프로덕션 준비)
    // useEffect(() => {
    //   if (process.env.NODE_ENV === 'development' && renderCount > 1) {
    //     console.log(`🔄 RegulationEditDialog 렌더링 횟수: ${renderCount}`);
    //     if (renderCount % 10 === 0) {
    //       const stats = logStats();
    //       console.log('📊 RegulationEditDialog 성능 통계:', stats);
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

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditTaskState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
      setEditTab(newValue);
    }, []);

    const handleSave = useCallback(() => {
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

      if (!taskState.type.trim()) {
        setValidationError('보안문서유형을 선택해주세요.');
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

      // 약간의 지연을 두고 저장 (상태 업데이트 완료 대기)
      setTimeout(() => {
        if (!task) {
          // 새 Task 생성
          const newTask: RegulationTableData = {
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
            type: taskState.type,
            progress: taskState.progress,
            attachments: []
          } as any;

          console.log('🚀 새 Task 생성 중:', newTask);
          onSave(newTask);
        } else {
          // 기존 Task 수정
          const updatedTask: RegulationTableData = {
            ...task,
            workContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status,
            startDate: task.startDate || new Date().toISOString().split('T')[0], // 기존 시작일 유지 또는 오늘 날짜
            completedDate: taskState.completedDate,
            description: currentValues.description,
            team: taskState.team,
            type: taskState.type,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            progress: taskState.progress
          } as any;

          console.log('📝 기존 Task 수정 중:', updatedTask);
          onSave(updatedTask);
        }
        onClose();
      }, 50); // 50ms 지연
    }, [task, taskState, onSave, onClose, dispatch]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setComments([]);
      setMaterials([]);
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

    // 메모이제이션된 탭 컴포넌트 props
    const overviewTabProps = useMemo(
      () => ({
        taskState,
        onFieldChange: handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors,
        getLatestRevision,
        getLatestRevisionDate
      }),
      [taskState, handleFieldChange, assignees, assigneeAvatars, statusOptions, statusColors, getLatestRevision, getLatestRevisionDate]
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
            <Typography variant="h6" component="div" sx={{ fontSize: '20px', color: '#000000', fontWeight: 500 }}>
              보안규정관리 편집
            </Typography>
            {task && (
              <Typography variant="body2" sx={{ fontSize: '14px', color: '#666666', fontWeight: 500 }}>
                {taskState.workContent} ({taskState.code})
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
            <Tab label="계획" />
            <Tab label="기록" />
            <Tab label="자료" />
            <Tab label="폴더" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 1, pt: 1 }}>
          {editTab === 0 && <OverviewTab {...overviewTabProps} />}
          {editTab === 1 && <PlanTab {...planTabProps} />}
          {editTab === 2 && <RecordTab {...recordTabProps} />}
          {editTab === 3 && <MaterialTab {...materialTabProps} />}
          {editTab === 4 && <FolderTab />}
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

RegulationEditDialog.displayName = 'RegulationEditDialog';

export default RegulationEditDialog;
