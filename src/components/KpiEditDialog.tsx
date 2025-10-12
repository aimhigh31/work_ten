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
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination
} from '@mui/material';
import { TaskTableData, TaskStatus, ChecklistItem } from '../types/kpi';
import { useOptimizedInput } from '../hooks/useDebounce';
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import { useSupabaseUserManagement } from '../hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement } from '../hooks/useSupabaseDepartmentManagement';
import { useSupabaseKpiTask } from '../hooks/useSupabaseKpiTask';
import { useSupabaseKpiRecord } from '../hooks/useSupabaseKpiRecord';
import { useSession } from 'next-auth/react';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';
import useUser from '../hooks/useUser';
// import { usePerformanceMonitor } from '../utils/performance';

// Icons
import { TableDocument, Element, AttachSquare, Trash } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface EditTaskState {
  workContent: string;
  selectionBackground: string;
  impact: string;
  evaluationCriteria: {
    S: string;
    A: string;
    B: string;
    C: string;
    D: string;
  };
  assignee: string;
  status: TaskStatus;
  code: string;
  registrationDate: string;
  startDate: string;
  completedDate: string;
  team: string;
  department: string;
  progress: number;
  managementCategory: string;
  targetKpi: string;
  currentKpi: string;
}

type EditTaskAction =
  | { type: 'SET_FIELD'; field: keyof EditTaskState; value: any }
  | { type: 'SET_TASK'; task: TaskTableData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; code: string; registrationDate: string };

const editTaskReducer = (state: EditTaskState, action: EditTaskAction): EditTaskState => {
  switch (action.type) {
    case 'SET_FIELD':
      // progress 필드는 숫자로 변환하고 0-100 범위로 제한
      if (action.field === 'progress') {
        const numValue = Number(action.value) || 0;
        const limitedValue = Math.min(Math.max(numValue, 0), 100);
        return { ...state, [action.field]: limitedValue };
      }
      return { ...state, [action.field]: action.value };
    case 'SET_TASK':
      return {
        workContent: action.task.workContent,
        selectionBackground: (action.task as any).selectionBackground || '',
        impact: (action.task as any).impact || '',
        evaluationCriteria: (action.task as any).evaluationCriteria || { S: '', A: '', B: '', C: '', D: '' },
        assignee: action.task.assignee,
        status: action.task.status,
        code: action.task.code,
        registrationDate: action.task.registrationDate || '',
        startDate: action.task.startDate || '',
        completedDate: action.task.completedDate || '',
        team: (action.task as any).team || '',
        department: (action.task as any).department || '',
        progress: action.task.progress || 0,
        managementCategory: (action.task as any).managementCategory || '',
        targetKpi: (action.task as any).targetKpi || '',
        currentKpi: (action.task as any).currentKpi || ''
      };
    case 'INIT_NEW_TASK':
      return {
        workContent: '',
        selectionBackground: '',
        impact: '',
        evaluationCriteria: { S: '', A: '', B: '', C: '', D: '' },
        assignee: '',
        status: '대기',
        code: action.code,
        registrationDate: action.registrationDate,
        startDate: '',
        completedDate: '',
        team: '',
        department: '',
        progress: 0,
        managementCategory: '',
        targetKpi: '',
        currentKpi: ''
      };
    case 'RESET':
      return {
        workContent: '',
        selectionBackground: '',
        impact: '',
        evaluationCriteria: { S: '', A: '', B: '', C: '', D: '' },
        progress: 0,
        assignee: '',
        status: '대기',
        code: '',
        registrationDate: '',
        startDate: '',
        completedDate: '',
        team: '',
        department: '',
        managementCategory: '',
        targetKpi: '',
        currentKpi: ''
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
    managementCategoryOptions,
    departmentOptions,
    users
  }: {
    taskState: EditTaskState;
    onFieldChange: (field: keyof EditTaskState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: TaskStatus[];
    statusColors: Record<TaskStatus, any>;
    managementCategoryOptions: Array<{ subcode: string; subcode_name: string }>;
    departmentOptions: Array<{ subcode: string; subcode_name: string }>;
    users: any[];
  }) => {
    // TextField 직접 참조를 위한 ref
    const workContentRef = useRef<HTMLInputElement>(null);
    const selectionBackgroundRef = useRef<HTMLTextAreaElement>(null);
    const impactRef = useRef<HTMLTextAreaElement>(null);
    const evaluationCriteriaSRef = useRef<HTMLTextAreaElement>(null);
    const evaluationCriteriaARef = useRef<HTMLTextAreaElement>(null);
    const evaluationCriteriaBRef = useRef<HTMLTextAreaElement>(null);
    const evaluationCriteriaCRef = useRef<HTMLTextAreaElement>(null);
    const evaluationCriteriaDRef = useRef<HTMLTextAreaElement>(null);

    // 텍스트 필드용 최적화된 입력 관리
    const workContentInput = useOptimizedInput(taskState.workContent, 150);
    const selectionBackgroundInput = useOptimizedInput(taskState.selectionBackground, 200);
    const impactInput = useOptimizedInput(taskState.impact, 200);
    const evaluationCriteriaSInput = useOptimizedInput(taskState.evaluationCriteria.S, 200);
    const evaluationCriteriaAInput = useOptimizedInput(taskState.evaluationCriteria.A, 200);
    const evaluationCriteriaBInput = useOptimizedInput(taskState.evaluationCriteria.B, 200);
    const evaluationCriteriaCInput = useOptimizedInput(taskState.evaluationCriteria.C, 200);
    const evaluationCriteriaDInput = useOptimizedInput(taskState.evaluationCriteria.D, 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림 (onFieldChange 의존성 제거로 최적화)
    useEffect(() => {
      if (!isUpdatingRef.current && workContentInput.debouncedValue !== taskState.workContent) {
        onFieldChange('workContent', workContentInput.debouncedValue);
      }
    }, [workContentInput.debouncedValue, taskState.workContent]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && selectionBackgroundInput.debouncedValue !== taskState.selectionBackground) {
        onFieldChange('selectionBackground', selectionBackgroundInput.debouncedValue);
      }
    }, [selectionBackgroundInput.debouncedValue, taskState.selectionBackground]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && impactInput.debouncedValue !== taskState.impact) {
        onFieldChange('impact', impactInput.debouncedValue);
      }
    }, [impactInput.debouncedValue, taskState.impact]); // onFieldChange 제거

    useEffect(() => {
      if (!isUpdatingRef.current && evaluationCriteriaSInput.debouncedValue !== taskState.evaluationCriteria.S) {
        onFieldChange('evaluationCriteria', { ...taskState.evaluationCriteria, S: evaluationCriteriaSInput.debouncedValue });
      }
    }, [evaluationCriteriaSInput.debouncedValue, taskState.evaluationCriteria.S]);

    useEffect(() => {
      if (!isUpdatingRef.current && evaluationCriteriaAInput.debouncedValue !== taskState.evaluationCriteria.A) {
        onFieldChange('evaluationCriteria', { ...taskState.evaluationCriteria, A: evaluationCriteriaAInput.debouncedValue });
      }
    }, [evaluationCriteriaAInput.debouncedValue, taskState.evaluationCriteria.A]);

    useEffect(() => {
      if (!isUpdatingRef.current && evaluationCriteriaBInput.debouncedValue !== taskState.evaluationCriteria.B) {
        onFieldChange('evaluationCriteria', { ...taskState.evaluationCriteria, B: evaluationCriteriaBInput.debouncedValue });
      }
    }, [evaluationCriteriaBInput.debouncedValue, taskState.evaluationCriteria.B]);

    useEffect(() => {
      if (!isUpdatingRef.current && evaluationCriteriaCInput.debouncedValue !== taskState.evaluationCriteria.C) {
        onFieldChange('evaluationCriteria', { ...taskState.evaluationCriteria, C: evaluationCriteriaCInput.debouncedValue });
      }
    }, [evaluationCriteriaCInput.debouncedValue, taskState.evaluationCriteria.C]);

    useEffect(() => {
      if (!isUpdatingRef.current && evaluationCriteriaDInput.debouncedValue !== taskState.evaluationCriteria.D) {
        onFieldChange('evaluationCriteria', { ...taskState.evaluationCriteria, D: evaluationCriteriaDInput.debouncedValue });
      }
    }, [evaluationCriteriaDInput.debouncedValue, taskState.evaluationCriteria.D]);

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
      if (taskState.selectionBackground !== selectionBackgroundInput.inputValue && taskState.selectionBackground !== selectionBackgroundInput.debouncedValue) {
        isUpdatingRef.current = true;
        selectionBackgroundInput.reset(taskState.selectionBackground);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.selectionBackground, selectionBackgroundInput.inputValue, selectionBackgroundInput.debouncedValue]); // reset 제거

    useEffect(() => {
      if (taskState.impact !== impactInput.inputValue && taskState.impact !== impactInput.debouncedValue) {
        isUpdatingRef.current = true;
        impactInput.reset(taskState.impact);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.impact, impactInput.inputValue, impactInput.debouncedValue]); // reset 제거

    useEffect(() => {
      if (taskState.evaluationCriteria.S !== evaluationCriteriaSInput.inputValue && taskState.evaluationCriteria.S !== evaluationCriteriaSInput.debouncedValue) {
        isUpdatingRef.current = true;
        evaluationCriteriaSInput.reset(taskState.evaluationCriteria.S);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.evaluationCriteria.S, evaluationCriteriaSInput.inputValue, evaluationCriteriaSInput.debouncedValue]);

    useEffect(() => {
      if (taskState.evaluationCriteria.A !== evaluationCriteriaAInput.inputValue && taskState.evaluationCriteria.A !== evaluationCriteriaAInput.debouncedValue) {
        isUpdatingRef.current = true;
        evaluationCriteriaAInput.reset(taskState.evaluationCriteria.A);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.evaluationCriteria.A, evaluationCriteriaAInput.inputValue, evaluationCriteriaAInput.debouncedValue]);

    useEffect(() => {
      if (taskState.evaluationCriteria.B !== evaluationCriteriaBInput.inputValue && taskState.evaluationCriteria.B !== evaluationCriteriaBInput.debouncedValue) {
        isUpdatingRef.current = true;
        evaluationCriteriaBInput.reset(taskState.evaluationCriteria.B);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.evaluationCriteria.B, evaluationCriteriaBInput.inputValue, evaluationCriteriaBInput.debouncedValue]);

    useEffect(() => {
      if (taskState.evaluationCriteria.C !== evaluationCriteriaCInput.inputValue && taskState.evaluationCriteria.C !== evaluationCriteriaCInput.debouncedValue) {
        isUpdatingRef.current = true;
        evaluationCriteriaCInput.reset(taskState.evaluationCriteria.C);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.evaluationCriteria.C, evaluationCriteriaCInput.inputValue, evaluationCriteriaCInput.debouncedValue]);

    useEffect(() => {
      if (taskState.evaluationCriteria.D !== evaluationCriteriaDInput.inputValue && taskState.evaluationCriteria.D !== evaluationCriteriaDInput.debouncedValue) {
        isUpdatingRef.current = true;
        evaluationCriteriaDInput.reset(taskState.evaluationCriteria.D);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.evaluationCriteria.D, evaluationCriteriaDInput.inputValue, evaluationCriteriaDInput.debouncedValue]);

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
        selectionBackground: selectionBackgroundRef.current?.value || selectionBackgroundInput.inputValue,
        impact: impactRef.current?.value || impactInput.inputValue,
        evaluationCriteria: {
          S: evaluationCriteriaSRef.current?.value || evaluationCriteriaSInput.inputValue,
          A: evaluationCriteriaARef.current?.value || evaluationCriteriaAInput.inputValue,
          B: evaluationCriteriaBRef.current?.value || evaluationCriteriaBInput.inputValue,
          C: evaluationCriteriaCRef.current?.value || evaluationCriteriaCInput.inputValue,
          D: evaluationCriteriaDRef.current?.value || evaluationCriteriaDInput.inputValue
        },
        managementCategory: taskState.managementCategory,
        targetKpi: taskState.targetKpi,
        currentKpi: taskState.currentKpi
      };
    }, [
      taskState.managementCategory,
      taskState.targetKpi,
      taskState.currentKpi,
      workContentInput.inputValue,
      selectionBackgroundInput.inputValue,
      impactInput.inputValue,
      evaluationCriteriaSInput.inputValue,
      evaluationCriteriaAInput.inputValue,
      evaluationCriteriaBInput.inputValue,
      evaluationCriteriaCInput.inputValue,
      evaluationCriteriaDInput.inputValue
    ]); // taskState의 필수 필드들 추가

    // 컴포넌트가 마운트될 때 getCurrentValues 함수를 전역에서 접근 가능하도록 설정
    useEffect(() => {
      (window as any).getOverviewTabCurrentValues = getCurrentValues;
      return () => {
        delete (window as any).getOverviewTabCurrentValues;
      };
    }, [getCurrentValues]); // getCurrentValues가 변경될 때마다 window에 다시 등록

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 주요과제 - 전체 너비 */}
          <TextField
            fullWidth
            label={
              <span>
                주요과제 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={workContentInput.inputValue}
            onChange={(e) => workContentInput.handleChange(e.target.value)}
            variant="outlined"
            inputRef={workContentRef}
            InputLabelProps={{ shrink: true }}
          />

          {/* 선정배경 - 전체 너비 */}
          <TextField
            fullWidth
            label="선정배경"
            multiline
            rows={2}
            value={selectionBackgroundInput.inputValue}
            onChange={(e) => selectionBackgroundInput.handleChange(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputRef={selectionBackgroundRef}
          />

          {/* 파급효과 - 전체 너비 */}
          <TextField
            fullWidth
            label="파급효과"
            multiline
            rows={2}
            value={impactInput.inputValue}
            onChange={(e) => impactInput.handleChange(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputRef={impactRef}
            sx={{ mb: 5 }}
          />

          {/* 평가기준표 - 표 형식 */}
          <Box sx={{ position: 'relative', pt: 1.5, mt: 10 }}>
            <InputLabel
              shrink
              sx={{
                position: 'absolute',
                top: -3,
                left: 10,
                backgroundColor: 'white',
                px: 0.5,
                fontSize: '0.9375rem',
                color: 'rgba(0, 0, 0, 0.6)',
                fontWeight: 400,
                zIndex: 1
              }}
            >
              평가기준표
            </InputLabel>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 0
              }}
            >
              {[
                { grade: 'S', label: '120% (성과초과)', input: evaluationCriteriaSInput, ref: evaluationCriteriaSRef },
                { grade: 'A', label: '100% (성과충족)', input: evaluationCriteriaAInput, ref: evaluationCriteriaARef },
                { grade: 'B', label: '80% (성과)', input: evaluationCriteriaBInput, ref: evaluationCriteriaBRef },
                { grade: 'C', label: '60% (성과)', input: evaluationCriteriaCInput, ref: evaluationCriteriaCRef },
                { grade: 'D', label: '40% (성과)', input: evaluationCriteriaDInput, ref: evaluationCriteriaDRef }
              ].map((item, index) => (
                <Box key={item.grade}>
                  <Box
                    sx={{
                      py: 1,
                      px: 0.5,
                      textAlign: 'center',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRight: index < 4 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: index === 0 ? '4px 0 0 0' : index === 4 ? '0 4px 0 0' : '0',
                      backgroundColor: '#f9f9f9'
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.7)' }}>
                      {item.grade} - {item.label}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    value={item.input.inputValue}
                    onChange={(e) => item.input.handleChange(e.target.value)}
                    variant="outlined"
                    inputRef={item.ref}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: index === 0 ? '0 0 0 4px' : index === 4 ? '0 0 4px 0' : '0',
                        borderRight: index < 4 ? 'none' : undefined,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.12)'
                        }
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* 관리분류, 목표KPI, 현재KPI - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                관리분류 <span style={{ color: 'red' }}>*</span>
              </InputLabel>
              <Select
                value={taskState.managementCategory || ''}
                label="관리분류 *"
                onChange={(e) => onFieldChange('managementCategory', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">선택</MenuItem>
                {managementCategoryOptions.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={
                <span>
                  목표KPI <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={taskState.targetKpi || ''}
              onChange={(e) => onFieldChange('targetKpi', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label={
                <span>
                  현재KPI <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={taskState.currentKpi || ''}
              onChange={(e) => onFieldChange('currentKpi', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 업무분류, 진행율, 상태 - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                업무분류 <span style={{ color: 'red' }}>*</span>
              </InputLabel>
              <Select value={taskState.department} label="업무분류 *" onChange={handleFieldChange('department')} displayEmpty>
                <MenuItem value="">선택</MenuItem>
                {departmentOptions.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={
                <span>
                  진행율 (%) <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="number"
              value={taskState.progress || 0}
              onChange={(e) => {
                const numValue = Number(e.target.value) || 0;
                const limitedValue = Math.min(Math.max(numValue, 0), 100);
                onFieldChange('progress', String(limitedValue));
              }}
              InputProps={{
                inputProps: { min: 0, max: 100 }
              }}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select value={taskState.status} label="상태" onChange={handleFieldChange('status')}>
                {statusOptions.map((status) => {
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
              value={taskState.startDate || taskState.registrationDate}
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
              value={taskState.team || ''}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)'
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
              value={taskState.assignee || ''}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (() => {
                  const assigneeUser = users.find((user) => user.user_name === taskState.assignee);
                  return (
                    assigneeUser && (
                      <Avatar
                        src={assigneeUser.profile_image_url || assigneeUser.avatar_url}
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
              disabled
              label="등록일"
              value={taskState.registrationDate}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            />

            <TextField
              fullWidth
              disabled
              label="코드"
              value={taskState.code}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  backgroundColor: '#f5f5f5'
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.7)'
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

RecordTab.displayName = 'RecordTab';

// 실적 아이템 인터페이스
interface PerformanceItem {
  id: number;
  month: string; // "YYYY년 MM월" 형식
  targetKpi: string;
  actualKpi: string;
  trafficLight: 'red' | 'yellow' | 'green';
  overallProgress: string;
  planPerformance: string;
  achievementReflection: string;
  attachments?: string[];
}

// 실적 탭 컴포넌트
const PerformanceTab = memo(
  ({
    performanceItems,
    onEditPerformance,
    startDate,
    completedDate
  }: {
    performanceItems: PerformanceItem[];
    onEditPerformance: (id: number, item: PerformanceItem) => void;
    startDate: string;
    completedDate: string;
  }) => {
    // 편집 중인 셀 상태
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
    // 편집 중인 값 상태
    const [editingValue, setEditingValue] = useState<any>('');

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // 첨부파일 다이얼로그 상태
    const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [tempAttachments, setTempAttachments] = useState<Array<{ name: string; url: string; size: number }>>([]);

    // 열 너비 정의
    const columnWidths = {
      no: '60px',
      month: '100px',
      targetKpi: '120px',
      actualKpi: '120px',
      trafficLight: '80px',
      overallProgress: '120px',
      planPerformance: '220px',
      achievementReflection: '220px',
      attachment: '60px'
    };

    const cellHeight = 96;

    // 시작일과 종료일 사이의 월 목록 생성
    const generateMonthList = useCallback((start: string, end: string): string[] => {
      if (!start || !end) return [];

      const startDate = new Date(start);
      const endDate = new Date(end);
      const months: string[] = [];

      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (current <= lastMonth) {
        const year = current.getFullYear().toString().slice(2); // 25년
        const month = (current.getMonth() + 1).toString().padStart(2, '0'); // 01, 02, ...
        months.push(`${year}년 ${month}월`);
        current.setMonth(current.getMonth() + 1);
      }

      return months;
    }, []);

    // 월 목록
    const monthList = useMemo(() => generateMonthList(startDate, completedDate), [startDate, completedDate, generateMonthList]);

    // 월별 실적 데이터 매핑 (기존 데이터와 병합)
    const monthlyPerformanceItems = useMemo(() => {
      return monthList.map((month, index) => {
        const existingItem = performanceItems.find((item) => item.month === month);
        return (
          existingItem || {
            id: index + 1,
            month,
            targetKpi: '',
            actualKpi: '',
            trafficLight: 'green' as const,
            overallProgress: '',
            planPerformance: '',
            achievementReflection: '',
            attachments: []
          }
        );
      });
    }, [monthList, performanceItems]);

    // 페이지네이션 계산
    const totalPages = Math.ceil(monthlyPerformanceItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = monthlyPerformanceItems.slice(startIndex, endIndex);

    // 페이지 변경 핸들러
    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
    };

    // 셀 클릭 핸들러 (편집 모드 시작)
    const handleCellClick = (month: string, field: string) => {
      const item = monthlyPerformanceItems.find((i) => i.month === month);
      if (!item) return;

      setEditingCell({ id: item.id, field });
      setEditingValue((item as any)[field] || '');
    };

    // 셀 편집 완료 핸들러
    const handleCellBlur = () => {
      if (editingCell) {
        const item = monthlyPerformanceItems.find((i) => i.id === editingCell.id);
        if (item) {
          const updatedItem = { ...item, [editingCell.field]: editingValue };
          onEditPerformance(editingCell.id, updatedItem);
        }
      }
      setEditingCell(null);
      setEditingValue('');
    };

    // 첨부파일 다이얼로그 핸들러
    const handleOpenAttachmentDialog = useCallback(
      (month: string) => {
        setSelectedMonth(month);
        const currentItem = monthlyPerformanceItems.find((item) => item.month === month);

        // 기존 첨부파일 정보를 임시 상태로 복사
        if (currentItem?.attachments && currentItem.attachments.length > 0) {
          setTempAttachments(
            currentItem.attachments.map((url) => ({
              name: url.split('/').pop() || 'file',
              url: url,
              size: 0
            }))
          );
        } else {
          setTempAttachments([]);
        }

        setAttachmentDialogOpen(true);
      },
      [monthlyPerformanceItems]
    );

    const handleCloseAttachmentDialog = useCallback(() => {
      setAttachmentDialogOpen(false);
      setSelectedMonth('');
      setTempAttachments([]);
    }, []);

    // 첨부파일 추가 (다이얼로그 내)
    const handleAddAttachment = useCallback(
      (files: FileList) => {
        // 최대 5개 제한 체크
        const currentCount = tempAttachments.length;
        const remainingSlots = 5 - currentCount;

        if (remainingSlots <= 0) {
          alert('첨부파일은 최대 5개까지만 업로드 가능합니다.');
          return;
        }

        const filesToAdd = Array.from(files).slice(0, remainingSlots);

        if (files.length > remainingSlots) {
          alert(`첨부파일은 최대 5개까지만 업로드 가능합니다.\n선택한 ${files.length}개 중 ${filesToAdd.length}개만 추가됩니다.`);
        }

        const newAttachments = filesToAdd.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size
        }));

        setTempAttachments((prev) => [...prev, ...newAttachments]);
      },
      [tempAttachments]
    );

    // 첨부파일 삭제 (다이얼로그 내)
    const handleDeleteAttachment = useCallback((index: number) => {
      setTempAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // 첨부파일 저장
    const handleSaveAttachments = useCallback(() => {
      if (selectedMonth) {
        const item = monthlyPerformanceItems.find((i) => i.month === selectedMonth);
        if (item) {
          const updatedItem = {
            ...item,
            attachments: tempAttachments.map((a) => a.url)
          };
          onEditPerformance(item.id, updatedItem);
        }
      }
      handleCloseAttachmentDialog();
    }, [selectedMonth, monthlyPerformanceItems, tempAttachments, onEditPerformance, handleCloseAttachmentDialog]);

    // 편집 가능한 셀 렌더링
    const renderEditableCell = (item: PerformanceItem, field: string, value: any) => {
      const isEditing = editingCell?.id === item.id && editingCell?.field === field;
      const isOverallProgress = field === 'overallProgress';
      const isMultilineField = field === 'planPerformance' || field === 'achievementReflection' || field === 'targetKpi' || field === 'actualKpi';

      return (
        <Box
          sx={{
            height: cellHeight,
            display: 'flex',
            alignItems: isOverallProgress ? 'center' : 'flex-start',
            justifyContent: isOverallProgress ? 'center' : 'flex-start',
            padding: '8px 12px',
            overflow: 'auto',
            maxHeight: cellHeight
          }}
        >
          {isEditing ? (
            <TextField
              fullWidth
              size="small"
              type={isOverallProgress ? 'number' : 'text'}
              value={editingValue}
              onChange={(e) => {
                if (isOverallProgress) {
                  const numValue = Number(e.target.value);
                  if (numValue >= 0 && numValue <= 100) {
                    setEditingValue(e.target.value);
                  } else if (e.target.value === '') {
                    setEditingValue('');
                  }
                } else {
                  setEditingValue(e.target.value);
                }
              }}
              onBlur={handleCellBlur}
              autoFocus
              multiline={isMultilineField}
              maxRows={isMultilineField ? 4 : 1}
              InputProps={
                isOverallProgress
                  ? {
                      inputProps: { min: 0, max: 100 },
                      endAdornment: <span style={{ fontSize: '0.875rem', marginLeft: '4px' }}>%</span>
                    }
                  : undefined
              }
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.875rem',
                  maxHeight: cellHeight - 16
                },
                '& .MuiInputBase-input': {
                  overflow: 'auto !important'
                }
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                width: '100%',
                maxHeight: cellHeight - 16,
                overflow: 'auto',
                textAlign: isOverallProgress ? 'center' : 'left'
              }}
            >
              {isOverallProgress && value ? `${value}%` : value || '-'}
            </Typography>
          )}
        </Box>
      );
    };

    // 신호등 셀 렌더링
    const renderTrafficLightCell = (item: PerformanceItem) => {
      const isEditing = editingCell?.id === item.id && editingCell?.field === 'trafficLight';

      const getTrafficLightColor = (light: string) => {
        switch (light) {
          case 'red':
            return '#f44336';
          case 'yellow':
            return '#ff9800';
          case 'green':
            return '#4caf50';
          default:
            return '#9e9e9e';
        }
      };

      const getTrafficLightLabel = (light: string) => {
        switch (light) {
          case 'red':
            return '미흡';
          case 'yellow':
            return '보통';
          case 'green':
            return '양호';
          default:
            return '';
        }
      };

      return (
        <Box
          sx={{
            height: cellHeight,
            maxHeight: cellHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            overflow: 'hidden'
          }}
        >
          {isEditing ? (
            <Select
              value={editingValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingValue(newValue);
                // Select는 즉시 값을 저장
                const updatedItem = { ...item, trafficLight: newValue };
                onEditPerformance(item.id, updatedItem);
                setEditingCell(null);
              }}
              size="small"
              autoFocus
              sx={{ minWidth: '90px', '& .MuiSelect-select': { fontSize: '0.875rem', padding: '6px' } }}
            >
              <MenuItem value="green">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>양호</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="yellow">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>보통</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="red">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#f44336' }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>미흡</Typography>
                </Box>
              </MenuItem>
            </Select>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: getTrafficLightColor(item.trafficLight)
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                {getTrafficLightLabel(item.trafficLight)}
              </Typography>
            </Box>
          )}
        </Box>
      );
    };

    // 첨부파일 셀 렌더링
    const renderAttachmentCell = (item: PerformanceItem) => {
      return (
        <Box
          sx={{
            height: cellHeight,
            maxHeight: cellHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={() => handleOpenAttachmentDialog(item.month)}>
              <AttachSquare size={16} />
            </IconButton>
            {item.attachments && item.attachments.length > 0 && (
              <Chip size="small" label={`${item.attachments.length}개`} variant="outlined" color="primary" />
            )}
          </Box>
        </Box>
      );
    };


    return (
      <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', pt: 2, px: 3, pb: 0, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            실적 관리
          </Typography>
        </Box>

        <TableContainer
          sx={{
            overflowY: 'auto',
            overflowX: 'auto',
            maxHeight: '545px',
            '& .MuiTable-root': {
              minWidth: 1100,
              tableLayout: 'fixed'
            }
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell
                  sx={{
                    width: columnWidths.no,
                    minWidth: columnWidths.no,
                    maxWidth: columnWidths.no,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  NO
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.month,
                    minWidth: columnWidths.month,
                    maxWidth: columnWidths.month,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  월
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.targetKpi,
                    minWidth: columnWidths.targetKpi,
                    maxWidth: columnWidths.targetKpi,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  목표KPI
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.actualKpi,
                    minWidth: columnWidths.actualKpi,
                    maxWidth: columnWidths.actualKpi,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  실적KPI
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.trafficLight,
                    minWidth: columnWidths.trafficLight,
                    maxWidth: columnWidths.trafficLight,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  신호등
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.overallProgress,
                    minWidth: columnWidths.overallProgress,
                    maxWidth: columnWidths.overallProgress,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  종합진척율
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.planPerformance,
                    minWidth: columnWidths.planPerformance,
                    maxWidth: columnWidths.planPerformance,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  계획 및 실적
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.achievementReflection,
                    minWidth: columnWidths.achievementReflection,
                    maxWidth: columnWidths.achievementReflection,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  성과 및 반성
                </TableCell>
                <TableCell
                  sx={{
                    width: columnWidths.attachment,
                    minWidth: columnWidths.attachment,
                    maxWidth: columnWidths.attachment,
                    fontWeight: 600,
                    padding: '8px 12px',
                    backgroundColor: 'grey.50'
                  }}
                >
                  첨부
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow
                  key={`performance-${item.month}`}
                  hover
                  sx={{
                    minHeight: cellHeight,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell
                    sx={{
                      width: columnWidths.no,
                      minWidth: columnWidths.no,
                      maxWidth: columnWidths.no,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                  >
                    <Box sx={{ height: cellHeight, maxHeight: cellHeight, display: 'flex', alignItems: 'center', padding: '8px 12px', overflow: 'hidden' }}>
                      {startIndex + index + 1}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.month,
                      minWidth: columnWidths.month,
                      maxWidth: columnWidths.month,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                  >
                    <Box sx={{ height: cellHeight, maxHeight: cellHeight, display: 'flex', alignItems: 'center', padding: '8px 12px', overflow: 'hidden' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.month}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.targetKpi,
                      minWidth: columnWidths.targetKpi,
                      maxWidth: columnWidths.targetKpi,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                    onClick={() => handleCellClick(item.month, 'targetKpi')}
                  >
                    {renderEditableCell(item, 'targetKpi', item.targetKpi)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.actualKpi,
                      minWidth: columnWidths.actualKpi,
                      maxWidth: columnWidths.actualKpi,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                    onClick={() => handleCellClick(item.month, 'actualKpi')}
                  >
                    {renderEditableCell(item, 'actualKpi', item.actualKpi)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.trafficLight,
                      minWidth: columnWidths.trafficLight,
                      maxWidth: columnWidths.trafficLight,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                    onClick={() => handleCellClick(item.month, 'trafficLight')}
                  >
                    {renderTrafficLightCell(item)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.overallProgress,
                      minWidth: columnWidths.overallProgress,
                      maxWidth: columnWidths.overallProgress,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                    onClick={() => handleCellClick(item.month, 'overallProgress')}
                  >
                    {renderEditableCell(item, 'overallProgress', item.overallProgress)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.planPerformance,
                      minWidth: columnWidths.planPerformance,
                      maxWidth: columnWidths.planPerformance,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                    onClick={() => handleCellClick(item.month, 'planPerformance')}
                  >
                    {renderEditableCell(item, 'planPerformance', item.planPerformance)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.achievementReflection,
                      minWidth: columnWidths.achievementReflection,
                      maxWidth: columnWidths.achievementReflection,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                    onClick={() => handleCellClick(item.month, 'achievementReflection')}
                  >
                    {renderEditableCell(item, 'achievementReflection', item.achievementReflection)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columnWidths.attachment,
                      minWidth: columnWidths.attachment,
                      maxWidth: columnWidths.attachment,
                      padding: 0,
                      height: cellHeight,
                      maxHeight: cellHeight
                    }}
                  >
                    {renderAttachmentCell(item)}
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
            mt: 'auto',
            py: 0,
            px: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {monthlyPerformanceItems.length > 0
              ? `${startIndex + 1}-${Math.min(endIndex, monthlyPerformanceItems.length)} of ${monthlyPerformanceItems.length}`
              : '0-0 of 0'}
          </Typography>
          {monthlyPerformanceItems.length > 0 && (
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

        {/* 첨부파일 관리 다이얼로그 */}
        <Dialog open={attachmentDialogOpen} onClose={handleCloseAttachmentDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">첨부파일 관리</Typography>
                <Typography variant="caption" color="text.secondary">
                  최대 5개까지 업로드 가능 ({tempAttachments.length}/5)
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleCloseAttachmentDialog}>
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {/* 파일 업로드 영역 */}
            <Box sx={{ mb: 3 }}>
              <Paper
                variant="outlined"
                sx={{
                  px: 3,
                  py: 1.5,
                  textAlign: 'center',
                  borderStyle: 'dashed',
                  borderColor: tempAttachments.length >= 5 ? 'grey.400' : 'primary.main',
                  backgroundColor: tempAttachments.length >= 5 ? 'grey.100' : 'primary.50',
                  cursor: tempAttachments.length >= 5 ? 'not-allowed' : 'pointer',
                  opacity: tempAttachments.length >= 5 ? 0.6 : 1
                }}
              >
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  id="attachment-upload"
                  disabled={tempAttachments.length >= 5}
                  onChange={(e) => {
                    if (e.target.files) {
                      handleAddAttachment(e.target.files);
                    }
                  }}
                />
                <label
                  htmlFor="attachment-upload"
                  style={{
                    cursor: tempAttachments.length >= 5 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Stack spacing={1} alignItems="center">
                    <Typography fontSize="36px">📁</Typography>
                    <Typography variant="subtitle1" color={tempAttachments.length >= 5 ? 'text.disabled' : 'primary.main'}>
                      {tempAttachments.length >= 5 ? '업로드 제한 도달' : '파일을 업로드하세요'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tempAttachments.length >= 5
                        ? '최대 5개의 파일을 업로드했습니다'
                        : `클릭하거나 파일을 여기로 드래그하세요 (${5 - tempAttachments.length}개 추가 가능)`}
                    </Typography>
                    <Button variant="contained" size="small" component="span" disabled={tempAttachments.length >= 5}>
                      파일 선택
                    </Button>
                  </Stack>
                </label>
              </Paper>
            </Box>

            {/* 첨부파일 목록 */}
            {tempAttachments.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  첨부파일 목록 ({tempAttachments.length}개)
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell width={50}>NO</TableCell>
                        <TableCell>파일명</TableCell>
                        <TableCell width={100}>크기</TableCell>
                        <TableCell width={80}>삭제</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tempAttachments.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                              {file.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : '-'}</TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleDeleteAttachment(index)}>
                              <Trash size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tempAttachments.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  첨부된 파일이 없습니다.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={handleCloseAttachmentDialog}>
              취소
            </Button>
            <Button variant="contained" onClick={handleSaveAttachments}>
              저장
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);

PerformanceTab.displayName = 'PerformanceTab';

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
    onTeamChange,
    onAssigneeChange,
    onWeightChange,
    onStartDateChange,
    draggedItemId,
    setEditingChecklistId,
    setEditingField,
    setEditingProgressValue,
    departments = [],
    users = [],
    priorityOptions = []
  }: any) => {
    // 필터 및 뷰 모드 상태 관리
    const [filter, setFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');

    // 최상위 레벨의 날짜를 하위 항목들로 동기화
    const syncedChecklistItems = useMemo(() => {
      return checklistItems.map((item: any) => {
        if (item.level === 0) {
          // 하위 항목들 찾기
          const children = checklistItems.filter((child: any) => child.parentId === item.id);

          if (children.length > 0) {
            // 하위 항목들 중 날짜가 설정된 항목들
            const childrenWithDates = children.filter((child: any) => child.startDate && child.dueDate);

            if (childrenWithDates.length > 0) {
              // 가장 빠른 시작일
              const earliestStart = childrenWithDates.reduce((earliest: string, child: any) => {
                return !earliest || child.startDate < earliest ? child.startDate : earliest;
              }, '');

              // 가장 늦은 종료일
              const latestEnd = childrenWithDates.reduce((latest: string, child: any) => {
                return !latest || child.dueDate > latest ? child.dueDate : latest;
              }, '');

              return {
                ...item,
                startDate: earliestStart,
                dueDate: latestEnd
              };
            }
          }
        }
        return item;
      });
    }, [checklistItems]);

    // 영향도를 숫자로 변환
    const priorityToNumber = useCallback((priority: string): number => {
      const mapping: Record<string, number> = {
        없음: 1,
        낮음: 2,
        보통: 3,
        높음: 4,
        심각: 5
      };
      return mapping[priority] || 0;
    }, []);

    // 숫자를 영향도로 변환
    const numberToPriority = useCallback((num: number): string => {
      if (num < 1.5) return '없음';
      if (num < 2.5) return '낮음';
      if (num < 3.5) return '보통';
      if (num < 4.5) return '높음';
      return '심각';
    }, []);

    // 하위 항목들의 평균 영향도 계산
    const calculateAveragePriority = useCallback(
      (item: any): string => {
        if (!item.children || item.children.length === 0) {
          return item.priority || '';
        }

        const childPriorities = item.children
          .map((child: any) => {
            // 재귀적으로 하위 항목의 영향도를 가져옴
            const childPriority = child.children && child.children.length > 0 ? calculateAveragePriority(child) : child.priority;
            return priorityToNumber(childPriority);
          })
          .filter((num: number) => num > 0);

        if (childPriorities.length === 0) {
          return '';
        }

        const average = childPriorities.reduce((sum: number, num: number) => sum + num, 0) / childPriorities.length;
        return numberToPriority(average);
      },
      [priorityToNumber, numberToPriority]
    );

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

    const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newViewMode: 'list' | 'gantt' | null) => {
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
      let filtered = syncedChecklistItems;
      if (filter === '대기') {
        filtered = syncedChecklistItems.filter((item: any) => item.status === '대기');
      } else if (filter === '진행') {
        filtered = syncedChecklistItems.filter((item: any) => item.status === '진행');
      } else if (filter === '완료') {
        filtered = syncedChecklistItems.filter((item: any) => item.status === '완료');
      } else if (filter === '취소') {
        filtered = syncedChecklistItems.filter((item: any) => item.status === '취소');
      }
      return buildHierarchy(filtered);
    }, [syncedChecklistItems, filter, buildHierarchy]);

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
        onPriorityChange: any,
        onTeamChange: any,
        onAssigneeChange: any,
        onWeightChange: any,
        onStartDateChange: any,
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
                borderColor: 'grey.300',
                backgroundColor:
                  item.level === 0
                    ? '#fafafa'
                    : item.status === '취소'
                      ? 'error.50'
                      : item.checked || item.status === '완료'
                        ? 'success.50'
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
                  onChange={() => {
                    onToggle(originalIndex);
                    // 체크박스 상태에 따라 상태를 완료 또는 대기로 변경
                    const newStatus = (item.checked || item.status === '완료') ? '대기' : '완료';
                    onStatusChange(item.id, newStatus);
                  }}
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

                {/* 팀 선택 */}
                <Box sx={{ minWidth: '80px', mr: 1 }}>
                  {!item.parentId ? (
                    // Level 0 (최상위 레벨)일 때는 빈 공간
                    <Box sx={{ height: '24px' }} />
                  ) : (
                    <Select
                      value={item.team || ''}
                      onChange={(e) => onTeamChange && onTeamChange(item.id, e.target.value)}
                      disabled={false}
                      size="small"
                      variant="standard"
                      disableUnderline
                      displayEmpty
                      sx={{
                        width: '100%',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        '& .MuiSelect-select': {
                          padding: '2px 8px',
                          fontSize: '12px',
                          color: 'inherit'
                        },
                        '& .MuiSelect-icon': {
                          fontSize: '14px',
                          color: 'inherit'
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '12px', color: '#999' }}>
                        선택
                      </MenuItem>
                      {departments.map((dept: any) => (
                        <MenuItem key={dept.id} value={dept.department_name} sx={{ fontSize: '12px' }}>
                          {dept.department_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </Box>

                {/* 담당자 선택 */}
                <Box sx={{ minWidth: '80px', mr: 1 }}>
                  {!item.parentId ? (
                    // Level 0 (최상위 레벨)일 때는 빈 공간
                    <Box sx={{ height: '24px' }} />
                  ) : (
                    <Select
                      value={item.assignee || ''}
                      onChange={(e) => onAssigneeChange && onAssigneeChange(item.id, e.target.value)}
                      disabled={false}
                      size="small"
                      variant="standard"
                      disableUnderline
                      displayEmpty
                      sx={{
                        width: '100%',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        '& .MuiSelect-select': {
                          padding: '2px 8px',
                          fontSize: '12px',
                          color: 'inherit'
                        },
                        '& .MuiSelect-icon': {
                          fontSize: '14px',
                          color: 'inherit'
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '12px', color: '#999' }}>
                        선택
                      </MenuItem>
                      {users.map((user: any) => (
                        <MenuItem key={user.id} value={user.user_name} sx={{ fontSize: '12px' }}>
                          {user.user_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </Box>

                {/* 영향도 선택 */}
                <Box sx={{ minWidth: '70px', mr: 1 }}>
                  {!item.parentId ? (
                    // Level 0 (최상위 레벨)일 때는 평균값 표시
                    <Typography
                      sx={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        color: '#666'
                      }}
                    >
                      {calculateAveragePriority(item)}
                    </Typography>
                  ) : (
                    <Select
                      value={item.priority || ''}
                      onChange={(e) => onPriorityChange && onPriorityChange(item.id, e.target.value)}
                      disabled={false}
                      size="small"
                      variant="standard"
                      disableUnderline
                      displayEmpty
                      sx={{
                        width: '100%',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        '& .MuiSelect-select': {
                          padding: '2px 8px',
                          fontSize: '12px',
                          color: 'inherit'
                        },
                        '& .MuiSelect-icon': {
                          fontSize: '14px',
                          color: 'inherit'
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '12px', color: '#999' }}>
                        선택
                      </MenuItem>
                      {priorityOptions.map((option: any) => (
                        <MenuItem key={option.subcode} value={option.subcode_name} sx={{ fontSize: '12px' }}>
                          {option.subcode_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </Box>

                {/* 비중도 입력 */}
                <Box sx={{ minWidth: '70px', mr: 1, display: 'flex', alignItems: 'center' }}>
                  <TextField
                    type="number"
                    value={item.weight || 0}
                    onChange={(e) => {
                      const inputValue = parseInt(e.target.value) || 0;
                      onWeightChange && onWeightChange(item.id, inputValue);
                    }}
                    disabled={false}
                    size="small"
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      inputProps: {
                        min: 0,
                        max: 100,
                        style: {
                          fontSize: '12px',
                          textAlign: 'center',
                          padding: '2px 4px'
                        }
                      }
                    }}
                    sx={{
                      width: '50px',
                      '& .MuiInputBase-input': {
                        border: 'none'
                      }
                    }}
                    placeholder="비중"
                    title={
                      item.level === 0
                        ? '최우선 리스트들의 비중도 합은 최대 100%입니다'
                        : '하위 리스트들의 비중도 합은 상위 리스트 비중도를 넘을 수 없습니다'
                    }
                  />
                  <Typography sx={{ fontSize: '12px', color: '#666', ml: 0.5 }}>%</Typography>
                </Box>

                {/* 상태 선택 */}
                <Box sx={{ minWidth: '80px', mr: 1 }}>
                  <Select
                    value={item.status || '대기'}
                    onChange={(e) => onStatusChange && onStatusChange(item.id, e.target.value)}
                    disabled={false}
                    size="small"
                    variant="standard"
                    disableUnderline
                    displayEmpty
                    sx={{
                      width: '100%',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      borderRadius: 0,
                      '& .MuiSelect-select': {
                        padding: '2px 8px',
                        fontSize: '12px',
                        color: 'inherit'
                      },
                      '& .MuiSelect-icon': {
                        fontSize: '14px',
                        color: 'inherit'
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

                {/* 시작일 선택 */}
                <Box sx={{ minWidth: '120px', mr: 1 }}>
                  <TextField
                    type="date"
                    value={item.startDate || ''}
                    onChange={(e) => onStartDateChange && onStartDateChange(item.id, e.target.value)}
                    disabled={false}
                    size="small"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="시작일"
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      px: 1,
                      backgroundColor: 'transparent',
                      '& .MuiInputBase-input': {
                        fontSize: '12px',
                        py: 0.5,
                        border: 'none',
                        color: 'inherit'
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
                    disabled={false}
                    size="small"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      px: 1,
                      backgroundColor: 'transparent',
                      '& .MuiInputBase-input': {
                        fontSize: '12px',
                        py: 0.5,
                        border: 'none',
                        color: 'inherit'
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
                    onPriorityChange,
                    onTeamChange,
                    onAssigneeChange,
                    onWeightChange,
                    onStartDateChange,
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

    // 간트차트 뷰 렌더링 (스크린샷과 완전히 동일)
    const renderGanttView = useCallback(() => {
      // 날짜가 설정된 항목들만 필터링
      const itemsWithDates = syncedChecklistItems.filter((item: any) => item.startDate && item.dueDate);

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
        if (status === '완료') return '#a5d6a7'; // 파스텔 그린
        if (status === '진행') return '#90caf9'; // 파스텔 블루
        if (status === '취소') return '#ef9a9a'; // 파스텔 레드
        if (status === '대기') return '#bdbdbd'; // 파스텔 그레이
        return '#90caf9'; // 기본값 파스텔 블루
      };

      // 영향도 계산 함수
      const getItemPriority = (item: any): string => {
        // 하위 항목들 찾기
        const children = syncedChecklistItems.filter((child: any) => child.parentId === item.id);

        if (children.length === 0) {
          return item.priority || '-';
        }

        // 하위 항목들의 영향도 수집 (재귀적으로)
        const childPriorities = children
          .map((child: any) => {
            const childPriority = getItemPriority(child);
            return priorityToNumber(childPriority);
          })
          .filter((num: number) => num > 0);

        if (childPriorities.length === 0) {
          return item.priority || '-';
        }

        const average = childPriorities.reduce((sum: number, num: number) => sum + num, 0) / childPriorities.length;
        return numberToPriority(average);
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

            {/* 영향도 헤더 */}
            <Box
              sx={{
                width: '64px',
                minWidth: '64px',
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
              영향
            </Box>

            {/* 비중 헤더 */}
            <Box
              sx={{
                width: '64px',
                minWidth: '64px',
                p: 2,
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#495057',
                borderRight: '1px solid #dee2e6',
                textAlign: 'center',
                position: 'sticky',
                left: '309px',
                backgroundColor: '#ffffff',
                zIndex: 2
              }}
            >
              비중
            </Box>

            {/* 상태 헤더 */}
            <Box
              sx={{
                width: '64px',
                minWidth: '64px',
                p: 2,
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#495057',
                borderRight: '1px solid #dee2e6',
                textAlign: 'center',
                position: 'sticky',
                left: '373px',
                backgroundColor: '#ffffff',
                zIndex: 2
              }}
            >
              상태
            </Box>

            {/* 시작일/종료일 헤더 */}
            <Box
              sx={{
                width: '112px',
                minWidth: '112px',
                p: 2,
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#495057',
                borderRight: '1px solid #dee2e6',
                textAlign: 'center',
                position: 'sticky',
                left: '437px',
                backgroundColor: '#ffffff',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.4
              }}
            >
              <Box>시작일</Box>
              <Box>종료일</Box>
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
              const hasChildren = syncedChecklistItems.some((child: any) => child.parentId === item.id);
              const barColor = getBarColor(0, item.status || '대기');

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
                          <Typography fontSize="9px">{item.expanded ? '▼' : '▶'}</Typography>
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
                          fontSize: false ? '14px' : '13px',
                          fontWeight: false ? 'bold' : 'normal',
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
                      {/* 상태와 진행률 텍스트 */}
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.team || ''} {item.assignee || ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 영향도 컬럼 */}
                  <Box
                    sx={{
                      width: '64px',
                      minWidth: '64px',
                      p: 1.5,
                      display: 'flex',
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
                        color: '#333'
                      }}
                    >
                      {getItemPriority(item)}
                    </Typography>
                  </Box>

                  {/* 비중 컬럼 */}
                  <Box
                    sx={{
                      width: '64px',
                      minWidth: '64px',
                      p: 1.5,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRight: '1px solid #f1f3f4',
                      position: 'sticky',
                      left: '309px',
                      backgroundColor: item.level === 0 ? '#fafafa' : '#ffffff',
                      zIndex: 1
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#333'
                      }}
                    >
                      {item.weight || 0}%
                    </Typography>
                  </Box>

                  {/* 상태 컬럼 */}
                  <Box
                    sx={{
                      width: '64px',
                      minWidth: '64px',
                      p: 1.5,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRight: '1px solid #f1f3f4',
                      position: 'sticky',
                      left: '373px',
                      backgroundColor: item.level === 0 ? '#fafafa' : '#ffffff',
                      zIndex: 1
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#333'
                      }}
                    >
                      {item.status || '-'}
                    </Typography>
                  </Box>

                  {/* 시작일/종료일 컬럼 */}
                  <Box
                    sx={{
                      width: '112px',
                      minWidth: '112px',
                      p: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRight: '1px solid #f1f3f4',
                      position: 'sticky',
                      left: '437px',
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
                            backgroundColor: barColor,
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }, [syncedChecklistItems, filteredChecklistItems, onToggleExpanded, priorityToNumber, numberToPriority]);

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
            placeholder={viewMode === 'gantt' ? '간트차트 보기에서는 등록할 수 없습니다' : '새 계획 항목을 입력하세요...'}
            value={newChecklistText}
            onChange={(e) => onNewChecklistChange(e.target.value)}
            onKeyPress={handleChecklistKeyPress}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            disabled={viewMode === 'gantt'}
          />
          <Button
            variant="contained"
            onClick={onAddChecklistItem}
            disabled={viewMode === 'gantt' || !newChecklistText.trim()}
            sx={{ minWidth: '80px', height: '40px' }}
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
                    syncedChecklistItems,
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
                    onPriorityChange,
                    onTeamChange,
                    onAssigneeChange,
                    onWeightChange,
                    onStartDateChange,
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

        {viewMode === 'gantt' && <Box sx={{ flex: 1 }}>{renderGanttView()}</Box>}
      </Box>
    );
  }
);

PlanTab.displayName = 'PlanTab';
// 자료 탭 컴포넌트 (DB 기반)
const MaterialTab = memo(({ recordId, currentUser }: { recordId?: number | string; currentUser?: any }) => {
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.KPI, recordId);

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
        alert('파일을 업로드하려면 먼저 KPI를 저장해주세요.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // 각 파일을 업로드
      for (const file of Array.from(selectedFiles)) {
        const uploadInput = {
          page: PAGE_IDENTIFIERS.KPI,
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
            <Button variant="contained" size="small" startIcon={<Typography>📤</Typography>} disabled={isUploading}>
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
                          sx={{ p: 0.5 }}
                          title="수정"
                        >
                          <Typography fontSize="14px">✏️</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMaterial(String(file.id))}
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
  tasks: TaskTableData[];
  teams: string[];
}

const TaskEditDialog = memo(
  ({ open, onClose, task, onSave, assignees, assigneeAvatars, statusOptions, statusColors, tasks, teams }: TaskEditDialogProps) => {
    // 성능 모니터링
    // const { renderCount, logStats } = usePerformanceMonitor('TaskEditDialog');

    // 마스터코드 훅 - GROUP040, GROUP041 서브코드 가져오기
    const { getSubCodesByGroup, subCodes } = useSupabaseMasterCode3();

    // 사용자 정보 가져오기
    const { data: session } = useSession();
    const { users } = useSupabaseUserManagement();
    const user = useUser(); // MaterialTab에서 사용할 사용자 정보

    // 부서 정보 가져오기
    const { departments } = useSupabaseDepartmentManagement();

    // KPI Task 데이터 관리
    const {
      tasks: dbTasks,
      loading: tasksLoading,
      fetchTasks,
      addTask,
      updateTask,
      deleteTask,
      deleteTasks
    } = useSupabaseKpiTask(task?.id);

    // KPI Record 데이터 관리
    const {
      records: dbRecords,
      loading: recordsLoading,
      fetchRecords,
      addRecord,
      updateRecord,
      deleteRecord
    } = useSupabaseKpiRecord(task?.id);

    // 피드백/기록 훅
    const {
      feedbacks,
      loading: feedbackLoading,
      error: feedbackError,
      fetchFeedbacks,
      addFeedback,
      updateFeedback,
      deleteFeedback
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.KPI, task?.id);

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
      team: '',
      department: '',
      progress: 0,
      managementCategory: '',
      targetKpi: '',
      currentKpi: ''
    });

    // GROUP040의 서브코드들 가져오기 (관리분류)
    const managementCategoryOptions = useMemo(() => {
      const group040SubCodes = getSubCodesByGroup('GROUP040');
      return group040SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup, subCodes]);

    // GROUP041의 서브코드들 가져오기 (업무분류)
    const departmentOptions = useMemo(() => {
      const group041SubCodes = getSubCodesByGroup('GROUP041');
      return group041SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup, subCodes]);

    // GROUP012의 서브코드들 가져오기 (영향도)
    const priorityOptions = useMemo(() => {
      const group012SubCodes = getSubCodesByGroup('GROUP012');
      return group012SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup, subCodes]);

    // 코드 자동 생성 함수
    const generateTaskCode = useCallback(() => {
      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString().slice(-2); // 연도 뒤 2자리
      const codePrefix = `MAIN-KPI-${currentYearStr}-`;

      console.log('🔢 코드 생성 시작:', {
        tasksLength: tasks?.length,
        tasks: tasks,
        codePrefix
      });

      // 현재 연도의 기존 코드들에서 가장 큰 일련번호 찾기
      const currentYearCodes = (tasks || [])
        .filter((t) => t.code && t.code.startsWith(codePrefix))
        .map((t) => {
          const match = t.code.match(/MAIN-KPI-\d{2}-(\d{3})/);
          return match ? parseInt(match[1], 10) : 0;
        });

      console.log('🔍 현재 연도 코드들:', currentYearCodes);

      // 가장 큰 번호 + 1로 새 일련번호 생성 (없으면 001부터 시작)
      const maxNumber = currentYearCodes.length > 0 ? Math.max(...currentYearCodes) : 0;
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

      const generatedCode = `${codePrefix}${nextNumber}`;
      console.log('✅ 생성된 코드:', generatedCode, { maxNumber, nextNumber });

      return generatedCode;
    }, [tasks]);

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

    // KPI Task 데이터 로드
    React.useEffect(() => {
      if (task?.id && open) {
        fetchTasks(task.id);
      }
    }, [task?.id, open, fetchTasks]);

    // DB Tasks를 로컬 상태와 동기화
    React.useEffect(() => {
      if (dbTasks && dbTasks.length > 0) {
        const transformedTasks = dbTasks.map((dbTask) => ({
          id: dbTask.id,
          text: dbTask.text,
          checked: dbTask.checked,
          parentId: dbTask.parent_id || undefined,
          level: dbTask.level,
          expanded: dbTask.expanded,
          status: dbTask.status || '대기',
          dueDate: dbTask.due_date || '',
          startDate: dbTask.start_date || '',
          progressRate: dbTask.progress_rate || 0,
          assignee: dbTask.assignee || '',
          team: dbTask.team || '',
          priority: dbTask.priority || '',
          weight: dbTask.weight || 0
        }));
        setChecklistItems(transformedTasks);
      } else if (dbTasks && dbTasks.length === 0 && open && task?.id) {
        // DB에 데이터가 없으면 로컬 상태도 비움
        setChecklistItems([]);
      }
    }, [dbTasks, open, task?.id]);

    // KPI Record 데이터 로드
    React.useEffect(() => {
      if (task?.id && open) {
        fetchRecords(task.id);
      }
    }, [task?.id, open, fetchRecords]);

    // DB Records를 로컬 상태와 동기화
    React.useEffect(() => {
      if (dbRecords && dbRecords.length > 0) {
        const transformedRecords = dbRecords.map((dbRecord) => ({
          id: dbRecord.id,
          month: dbRecord.month,
          targetKpi: dbRecord.target_kpi || '',
          actualKpi: dbRecord.actual_kpi || '',
          trafficLight: (dbRecord.traffic_light || 'green') as 'red' | 'yellow' | 'green',
          overallProgress: dbRecord.overall_progress || '0',
          planPerformance: dbRecord.plan_performance || '',
          achievementReflection: dbRecord.achievement_reflection || '',
          attachments: dbRecord.attachments || []
        }));
        setPerformanceItems(transformedRecords);
      } else if (dbRecords && dbRecords.length === 0 && open && task?.id) {
        // DB에 데이터가 없으면 로컬 상태도 비움
        setPerformanceItems([]);
      }
    }, [dbRecords, open, task?.id]);

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

    // 기록 상태 관리
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');
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

    // Supabase feedbacks를 RecordTab 형식으로 변환
    const comments = useMemo(() => {
      const existingComments = feedbacks
        .filter(feedback => !deletedCommentIds.includes(String(feedback.id)))
        .map((feedback) => {
          const feedbackUser = users.find((u) => u.user_name === feedback.user_name);
          const feedbackIdStr = String(feedback.id);
          const content = modifiedComments[feedbackIdStr] || feedback.description;
          return {
            id: feedbackIdStr,
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

      const newComments = pendingComments.map(comment => ({
        ...comment,
        isNew: true
      }));

      return [...newComments, ...existingComments];
    }, [feedbacks, users, pendingComments, modifiedComments, deletedCommentIds]);

    // 진척률 편집 상태
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editingProgressValue, setEditingProgressValue] = useState<number>(0);

    // 실적 상태
    const [performanceItems, setPerformanceItems] = useState<PerformanceItem[]>([]);

    // 에러 상태
    const [validationError, setValidationError] = useState<string>('');

    // Task 변경 시 상태 업데이트
    React.useEffect(() => {
      if (task) {
        dispatch({ type: 'SET_TASK', task });
      }
    }, [task]);

    // 로그인한 사용자 정보
    const currentUser = useMemo(() => {
      if (!session?.user?.email) return null;
      return users.find((user) => user.email === session.user.email);
    }, [session, users]);

    // 팀을 로그인한 사용자의 부서로 자동 설정
    useEffect(() => {
      if (currentUser?.department && !taskState.team && !task && open) {
        dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
      }
    }, [currentUser, taskState.team, task, open]);

    // 담당자를 로그인한 사용자로 자동 설정
    useEffect(() => {
      if (currentUser?.user_name && !taskState.assignee && !task && open) {
        dispatch({ type: 'SET_FIELD', field: 'assignee', value: currentUser.user_name });
      }
    }, [currentUser, taskState.assignee, task, open]);

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
        return {
          workContent: taskState.workContent,
          selectionBackground: taskState.selectionBackground,
          impact: taskState.impact,
          evaluationCriteria: taskState.evaluationCriteria,
          managementCategory: taskState.managementCategory,
          targetKpi: taskState.targetKpi,
          currentKpi: taskState.currentKpi
        };
      };

      const currentValues = getCurrentInputValues();

      console.log('🔍 getCurrentInputValues 결과:', currentValues);
      console.log('🔍 taskState 상태:', {
        managementCategory: taskState.managementCategory,
        targetKpi: taskState.targetKpi,
        currentKpi: taskState.currentKpi
      });

      // 필수 입력 검증
      if (!currentValues.workContent.trim()) {
        setValidationError('주요과제를 입력해주세요.');
        return;
      }

      if (!currentValues.managementCategory || !currentValues.managementCategory.trim()) {
        setValidationError('관리분류를 선택해주세요.');
        return;
      }

      if (!currentValues.targetKpi || !currentValues.targetKpi.trim()) {
        setValidationError('목표KPI를 입력해주세요.');
        return;
      }

      if (!currentValues.currentKpi || !currentValues.currentKpi.trim()) {
        setValidationError('현재KPI를 입력해주세요.');
        return;
      }

      if (!taskState.department || !taskState.department.trim()) {
        setValidationError('업무분류를 선택해주세요.');
        return;
      }

      if (taskState.progress === undefined || taskState.progress === null || taskState.progress === '') {
        setValidationError('진행율을 입력해주세요.');
        return;
      }

      const startDateValue = taskState.startDate || taskState.registrationDate;
      if (!startDateValue || !startDateValue.trim()) {
        setValidationError('시작일을 선택해주세요.');
        return;
      }

      if (!taskState.completedDate || !taskState.completedDate.trim()) {
        setValidationError('완료일을 선택해주세요.');
        return;
      }

      // 에러 초기화
      setValidationError('');

      // 현재 입력 값들을 taskState에 즉시 반영
      if (currentValues.workContent !== taskState.workContent) {
        dispatch({ type: 'SET_FIELD', field: 'workContent', value: currentValues.workContent });
      }
      if (currentValues.selectionBackground !== taskState.selectionBackground) {
        dispatch({ type: 'SET_FIELD', field: 'selectionBackground', value: currentValues.selectionBackground });
      }
      if (currentValues.impact !== taskState.impact) {
        dispatch({ type: 'SET_FIELD', field: 'impact', value: currentValues.impact });
      }

      // 약간의 지연을 두고 저장 (상태 업데이트 완료 대기)
      setTimeout(async () => {
        let taskId: number;

        if (!task) {
          // 새 Task 생성
          const newTask: TaskTableData = {
            id: Date.now(),
            no: Date.now(),
            workContent: currentValues.workContent,
            selectionBackground: currentValues.selectionBackground,
            impact: currentValues.impact,
            evaluationCriteria: currentValues.evaluationCriteria,
            assignee: taskState.assignee,
            status: taskState.status,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            startDate: taskState.startDate || new Date().toISOString().split('T')[0], // 시작일 설정
            completedDate: taskState.completedDate,
            team: taskState.team,
            department: taskState.department,
            progress: taskState.progress,
            managementCategory: currentValues.managementCategory,
            targetKpi: currentValues.targetKpi,
            currentKpi: currentValues.currentKpi,
            attachments: []
          } as any;

          console.log('🚀 새 Task 생성 중:', newTask);
          taskId = newTask.id;
          onSave(newTask);
        } else {
          // 기존 Task 수정
          const updatedTask: TaskTableData = {
            ...task,
            workContent: currentValues.workContent,
            selectionBackground: currentValues.selectionBackground,
            impact: currentValues.impact,
            evaluationCriteria: currentValues.evaluationCriteria,
            assignee: taskState.assignee,
            status: taskState.status,
            startDate: taskState.startDate || task.startDate || new Date().toISOString().split('T')[0], // 시작일 설정
            completedDate: taskState.completedDate,
            team: taskState.team,
            department: taskState.department,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            progress: taskState.progress,
            managementCategory: currentValues.managementCategory,
            targetKpi: currentValues.targetKpi,
            currentKpi: currentValues.currentKpi
          } as any;

          console.log('📝 기존 Task 수정 중:', updatedTask);
          taskId = updatedTask.id;
          onSave(updatedTask);
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
                page: PAGE_IDENTIFIERS.KPI,
                record_id: String(taskId),
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
          console.warn('⚠️ 기록 저장에 실패했지만 KPI 데이터는 저장되었습니다.');
        }

        onClose();
      }, 50); // 50ms 지연
    }, [task, taskState, onSave, onClose, dispatch, deletedCommentIds, modifiedComments, pendingComments, deleteFeedback, updateFeedback, addFeedback]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setPendingComments([]);
      setModifiedComments({});
      setDeletedCommentIds([]);
      setPerformanceItems([]);
      setNewComment('');
      setEditingCommentId(null);
      setEditingCommentText('');
      setNewChecklistText('');
      setValidationError(''); // 에러 상태 초기화
      onClose();
    }, [onClose]);

    // 체크리스트 핸들러들
    const handleAddChecklistItem = useCallback(async () => {
      if (!newChecklistText.trim() || !task?.id) return;

      try {
        const newTaskData = {
          kpi_id: task.id,
          text: newChecklistText.trim(),
          checked: false,
          level: 0,
          expanded: true,
          status: '대기',
          due_date: null,
          start_date: null,
          progress_rate: 0,
          assignee: null,
          team: null,
          priority: null,
          weight: 0
        };

        await addTask(newTaskData);
        setNewChecklistText('');
      } catch (error) {
        console.error('❌ Task 추가 실패:', error);
      }
    }, [newChecklistText, task?.id, addTask]);

    const handleEditChecklistItem = useCallback((id: number, text: string) => {
      setEditingChecklistId(id);
      setEditingChecklistText(text);
    }, []);

    const handleSaveEditChecklistItem = useCallback(async () => {
      if (!editingChecklistText.trim() || editingChecklistId === null) return;

      try {
        await updateTask(editingChecklistId, { text: editingChecklistText.trim() });
        setEditingChecklistId(null);
        setEditingChecklistText('');
      } catch (error) {
        console.error('❌ Task 텍스트 수정 실패:', error);
      }
    }, [editingChecklistText, editingChecklistId, updateTask]);

    const handleCancelEditChecklistItem = useCallback(() => {
      setEditingChecklistId(null);
      setEditingChecklistText('');
    }, []);

    const handleDeleteChecklistItem = useCallback(async (id: number) => {
      try {
        // 삭제할 항목과 그 하위 항목들을 모두 찾기
        const findAllChildren = (parentId: number): number[] => {
          const children = checklistItems.filter((item) => item.parentId === parentId).map((item) => item.id);
          const allChildren = [...children];
          children.forEach((childId) => {
            allChildren.push(...findAllChildren(childId));
          });
          return allChildren;
        };

        const toDelete = [id, ...findAllChildren(id)];
        await deleteTasks(toDelete);
      } catch (error) {
        console.error('❌ Task 삭제 실패:', error);
      }
    }, [checklistItems, deleteTasks]);

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

    const handleDrop = useCallback(async (e: React.DragEvent, targetId: number) => {
      e.preventDefault();
      const draggedId = parseInt(e.dataTransfer.getData('text/plain'));

      if (draggedId === targetId) return; // 자기 자신에게는 드롭 불가

      // 순환 참조 방지: 드래그된 항목이 타겟의 상위인지 확인
      const isParentOf = (parentId: number, childId: number): boolean => {
        const child = checklistItems.find((item) => item.id === childId);
        if (!child || !child.parentId) return false;
        if (child.parentId === parentId) return true;
        return isParentOf(parentId, child.parentId);
      };

      if (isParentOf(draggedId, targetId)) return; // 순환 참조 방지

      const target = checklistItems.find((item) => item.id === targetId);
      if (!target) return;

      // 레벨 1까지만 허용: 타겟이 레벨 0일 때만 드롭 가능
      if (target.level !== 0) return;

      try {
        // 드래그된 항목의 parentId와 level 업데이트
        await updateTask(draggedId, {
          parent_id: targetId,
          level: target.level + 1
        });

        // 타겟 항목을 자동으로 펼치기
        await updateTask(targetId, { expanded: true });

        // 드래그 완료 후 상태 초기화
        setDraggedItemId(null);
      } catch (error) {
        console.error('❌ Task 드롭 실패:', error);
      }
    }, [checklistItems, updateTask]);

    // 접기/펼치기 핸들러
    const handleToggleExpanded = useCallback(async (id: number) => {
      const item = checklistItems.find((item) => item.id === id);
      if (!item) return;

      try {
        await updateTask(id, { expanded: !item.expanded });
      } catch (error) {
        console.error('❌ Task 펼침/접힘 상태 변경 실패:', error);
      }
    }, [checklistItems, updateTask]);

    // 부모 항목(레벨 0)의 값 자동 계산
    const calculateParentValues = useCallback((items: any[]) => {
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
          const cancelledCount = children.filter((child) => child.status === '취소').length;

          if (cancelledCount === children.length && children.length > 0) {
            // 모든 하위 항목이 취소
            newStatus = '취소';
          } else if (completedCount === children.length && children.length > 0) {
            // 모든 하위 항목이 완료 또는 취소 (전부 취소는 위에서 처리됨)
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

          // 시작일 계산 (가장 빠른 일자)
          const startDates = children.map((child) => child.startDate).filter((date) => date && date.trim() !== '');
          const earliestStartDate = startDates.length > 0 ? startDates.sort()[0] : parentItem.startDate;

          // 중요도 평균 계산
          const priorityValues = children
            .map((child) => (child.priority === 'High' ? 3 : child.priority === 'Medium' ? 2 : 1))
            .filter((value) => value);
          const avgPriorityValue =
            priorityValues.length > 0 ? Math.round(priorityValues.reduce((sum, val) => sum + val, 0) / priorityValues.length) : 2;
          const avgPriority = avgPriorityValue >= 2.5 ? 'High' : avgPriorityValue >= 1.5 ? 'Medium' : 'Low';

          // 부모 항목 업데이트
          const parentIndex = updatedItems.findIndex((item) => item.id === parentItem.id);
          if (parentIndex !== -1) {
            updatedItems[parentIndex] = {
              ...updatedItems[parentIndex],
              status: newStatus,
              progressRate: avgProgressRate,
              dueDate: latestDueDate,
              startDate: earliestStartDate,
              priority: avgPriority
            };
          }
        }
      });

      return updatedItems;
    }, []);

    const handleToggleChecklistItem = useCallback(async (index: number) => {
      const item = checklistItems[index];
      if (!item) return;

      try {
        await updateTask(item.id, { checked: !item.checked });
      } catch (error) {
        console.error('❌ Task 체크 상태 변경 실패:', error);
      }
    }, [checklistItems, updateTask]);

    // 체크리스트 상태 변경 핸들러
    const handleChecklistStatusChange = useCallback(
      async (id: number, status: string) => {
        try {
          const progressRate = status === '완료' ? 100 : status === '취소' ? 0 : undefined;
          const updates: any = { status };
          if (progressRate !== undefined) {
            updates.progress_rate = progressRate;
          }
          await updateTask(id, updates);
        } catch (error) {
          console.error('❌ Task 상태 변경 실패:', error);
        }
      },
      [updateTask]
    );

    // 체크리스트 완료일 변경 핸들러
    const handleChecklistDueDateChange = useCallback(
      async (id: number, dueDate: string) => {
        try {
          await updateTask(id, { due_date: dueDate || null });
        } catch (error) {
          console.error('❌ Task 완료일 변경 실패:', error);
        }
      },
      [updateTask]
    );

    // 체크리스트 진척율 변경 핸들러
    const handleChecklistProgressRateChange = useCallback(
      async (id: number, progressRate: number) => {
        try {
          const item = checklistItems.find((item) => item.id === id);
          const updates: any = { progress_rate: progressRate };

          // 1% 이상이면 대기 -> 진행으로 상태 자동 변경 (레벨 0이 아닌 경우만)
          if (item && item.level !== 0 && progressRate >= 1 && item.status === '대기') {
            updates.status = '진행';
          }

          await updateTask(id, updates);
        } catch (error) {
          console.error('❌ Task 진척율 변경 실패:', error);
        }
      },
      [checklistItems, updateTask]
    );

    // 체크리스트 우선순위 변경 핸들러
    const handleChecklistPriorityChange = useCallback(
      async (id: number, priority: 'High' | 'Medium' | 'Low') => {
        try {
          await updateTask(id, { priority });
        } catch (error) {
          console.error('❌ Task 우선순위 변경 실패:', error);
        }
      },
      [updateTask]
    );

    // 체크리스트 팀 변경 핸들러
    const handleChecklistTeamChange = useCallback(
      async (id: number, team: string) => {
        try {
          await updateTask(id, { team });
        } catch (error) {
          console.error('❌ Task 팀 변경 실패:', error);
        }
      },
      [updateTask]
    );

    // 체크리스트 담당자 변경 핸들러
    const handleChecklistAssigneeChange = useCallback(
      async (id: number, assignee: string) => {
        try {
          await updateTask(id, { assignee });
        } catch (error) {
          console.error('❌ Task 담당자 변경 실패:', error);
        }
      },
      [updateTask]
    );

    // 체크리스트 비중도 변경 핸들러
    const handleChecklistWeightChange = useCallback(
      async (id: number, weight: number) => {
        try {
          const targetItem = checklistItems.find((item) => item.id === id);
          if (!targetItem) return;

          // 비중도 검증 로직
          if (targetItem.level === 0) {
            // 최우선 리스트(레벨0)인 경우: 전체 합이 100을 넘지 않도록 검증
            const otherLevel0Items = checklistItems.filter((item) => item.level === 0 && item.id !== id);
            const otherLevel0Sum = otherLevel0Items.reduce((sum, item) => sum + (item.weight || 0), 0);

            if (otherLevel0Sum + weight > 100) {
              // 100을 넘으면 최대값으로 제한
              weight = Math.max(0, 100 - otherLevel0Sum);
            }
          } else {
            // 하위 리스트인 경우: 같은 부모 아래 하위 리스트들의 합이 부모 비중도를 넘지 않도록 검증
            const parentItem = checklistItems.find((item) => item.id === targetItem.parentId);
            if (parentItem) {
              const siblingItems = checklistItems.filter((item) => item.parentId === targetItem.parentId && item.id !== id);
              const siblingSum = siblingItems.reduce((sum, item) => sum + (item.weight || 0), 0);

              if (siblingSum + weight > (parentItem.weight || 0)) {
                // 부모 비중도를 넘으면 최대값으로 제한
                weight = Math.max(0, (parentItem.weight || 0) - siblingSum);
              }
            }
          }

          await updateTask(id, { weight });
        } catch (error) {
          console.error('❌ Task 비중도 변경 실패:', error);
        }
      },
      [checklistItems, updateTask]
    );

    // 체크리스트 시작일 변경 핸들러
    const handleChecklistStartDateChange = useCallback(
      async (id: number, startDate: string) => {
        try {
          await updateTask(id, { start_date: startDate || null });
        } catch (error) {
          console.error('❌ Task 시작일 변경 실패:', error);
        }
      },
      [updateTask]
    );

    const handleChecklistEndDateChange = useCallback((id: number, endDate: string) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, endDate } : item)));
    }, []);

    // 코멘트 핸들러들
    // 기록 핸들러들
    const handleAddComment = useCallback(() => {
      if (!newComment.trim()) return;

      // 현재 사용자 정보 가져오기
      const feedbackUser = users.find((u) => u.user_name === currentUser?.user_name);
      const currentUserName = feedbackUser?.user_name || currentUser?.user_name || '현재 사용자';
      const currentTeam = feedbackUser?.department || currentUser?.department || '';
      const currentPosition = feedbackUser?.position || '';
      const currentProfileImage = feedbackUser?.profile_image_url || '';
      const currentRole = feedbackUser?.role || '';

      // DB에 바로 저장하지 않고 임시 저장 (저장 버튼 클릭 시 DB 저장)
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

      setPendingComments(prev => [tempComment, ...prev]);
      setNewComment('');
    }, [newComment, users, currentUser]);

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

    // 실적 핸들러
    const handleEditPerformance = useCallback(
      async (id: number, item: PerformanceItem) => {
        if (!task?.id) return;

        try {
          const recordData = {
            kpi_id: task.id,
            month: item.month,
            target_kpi: item.targetKpi,
            actual_kpi: item.actualKpi,
            traffic_light: item.trafficLight,
            overall_progress: item.overallProgress,
            plan_performance: item.planPerformance,
            achievement_reflection: item.achievementReflection,
            attachments: item.attachments || []
          };

          // month를 기준으로 기존 항목 찾기
          const existing = performanceItems.find((p) => p.month === item.month);
          if (existing) {
            // 기존 항목 업데이트
            await updateRecord(existing.id, recordData);
          } else {
            // 새 항목 추가
            await addRecord(recordData);
          }
        } catch (error) {
          console.error('❌ 실적 저장 실패:', error);
        }
      },
      [task?.id, performanceItems, updateRecord, addRecord]
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
        managementCategoryOptions,
        departmentOptions,
        users
      }),
      [taskState, handleFieldChange, assignees, assigneeAvatars, statusOptions, statusColors, managementCategoryOptions, departmentOptions, users]
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
        onTeamChange: handleChecklistTeamChange,
        onAssigneeChange: handleChecklistAssigneeChange,
        onWeightChange: handleChecklistWeightChange,
        onStartDateChange: handleChecklistStartDateChange,
        draggedItemId,
        setEditingChecklistId,
        setEditingField,
        setEditingProgressValue,
        departments,
        users,
        priorityOptions
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
        handleChecklistTeamChange,
        handleChecklistAssigneeChange,
        handleChecklistWeightChange,
        handleChecklistStartDateChange,
        draggedItemId,
        editingField,
        editingProgressValue,
        departments,
        users,
        priorityOptions
      ]
    );

    const recordTabProps = useMemo(
      () => {
        // 현재 사용자 정보 가져오기
        const feedbackUser = users.find((u) => u.user_name === currentUser?.user_name);
        const currentUserName = feedbackUser?.user_name || currentUser?.user_name || '현재 사용자';
        const currentUserAvatar = feedbackUser?.profile_image_url || currentUser?.profile_image_url || '';
        const currentUserRole = feedbackUser?.role || currentUser?.role || '';
        const currentUserDepartment = feedbackUser?.department || currentUser?.department || '';

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
      },
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
        users,
        currentUser
      ]
    );

    const performanceTabProps = useMemo(
      () => ({
        performanceItems,
        onEditPerformance: handleEditPerformance,
        startDate: taskState.startDate,
        completedDate: taskState.completedDate
      }),
      [performanceItems, handleEditPerformance, taskState.startDate, taskState.completedDate]
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
              KPI관리 편집
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
            <Tab label="계획" />
            <Tab label="실적" />
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 1, pt: 1, overflow: 'hidden' }}>
          {editTab === 0 && <OverviewTab {...overviewTabProps} />}
          {editTab === 1 && <PlanTab {...planTabProps} />}
          {editTab === 2 && <PerformanceTab {...performanceTabProps} />}
          {editTab === 3 && <RecordTab {...recordTabProps} />}
          {editTab === 4 && <MaterialTab recordId={task?.id} currentUser={user} />}
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

TaskEditDialog.displayName = 'TaskEditDialog';

export default TaskEditDialog;
