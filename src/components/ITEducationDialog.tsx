'use client';

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
  Checkbox,
  Paper,
  IconButton,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardContent,
  CardHeader,
  SvgIcon,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ITEducationRecord,
  ITEducationDetail,
  educationTypeOptions,
  statusOptions,
  assigneeOptions,
  CurriculumItem,
  ParticipantItem,
  attendanceOptions,
  positionOptions,
  departmentOptions,
  EducationReport
} from '../types/it-education';
import { useOptimizedInput } from '../hooks/useDebounce';

// assets
import { Add, Edit, Trash, DocumentDownload, CloseCircle, Calendar, Edit2, AttachSquare } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface ITEducationEditState {
  educationName: string;
  description: string;
  educationType: string;
  assignee: string;
  executionDate: string;
  location: string;
  status: string;
  participantCount: number;
  registrationDate: string;
  code: string;
}

interface ITEducationEditAction {
  type: 'SET_FIELD' | 'SET_EDUCATION' | 'INIT_NEW_EDUCATION' | 'RESET';
  field?: keyof ITEducationEditState;
  value?: string | number;
  education?: ITEducationRecord;
  code?: string;
  registrationDate?: string;
}

const editEducationReducer = (state: ITEducationEditState, action: ITEducationEditAction): ITEducationEditState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field!]: action.value! };
    case 'SET_EDUCATION':
      return {
        educationName: action.education!.educationName,
        description: '',
        educationType: action.education!.educationType,
        assignee: action.education!.assignee,
        executionDate: action.education!.executionDate,
        location: action.education!.location,
        status: action.education!.status,
        participantCount: action.education!.participantCount,
        registrationDate: action.education!.registrationDate,
        code: action.education!.code
      };
    case 'INIT_NEW_EDUCATION':
      return {
        educationName: '',
        description: '',
        educationType: '신입교육',
        assignee: assigneeOptions[0].name,
        executionDate: '',
        location: '',
        status: '예정',
        participantCount: 0,
        registrationDate: action.registrationDate!,
        code: action.code!
      };
    case 'RESET':
      return {
        educationName: '',
        description: '',
        educationType: '신입교육',
        assignee: assigneeOptions[0].name,
        executionDate: '',
        location: '',
        status: '예정',
        participantCount: 0,
        registrationDate: '',
        code: ''
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
    statusOptions: statusOpts,
    statusColors,
    educationTypes
  }: {
    educationState: ITEducationEditState;
    onFieldChange: (field: keyof ITEducationEditState, value: string | number) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: string[];
    statusColors: Record<string, any>;
    educationTypes: string[];
  }) => {
    // TextField 직접 참조를 위한 ref
    const educationNameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);

    // 텍스트 필드용 최적화된 입력 관리
    const educationNameInput = useOptimizedInput(educationState.educationName, 150);
    const descriptionInput = useOptimizedInput(educationState.description, 200);
    const locationInput = useOptimizedInput(educationState.location, 150);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림
    useEffect(() => {
      if (!isUpdatingRef.current && educationNameInput.debouncedValue !== educationState.educationName) {
        onFieldChange('educationName', educationNameInput.debouncedValue);
      }
    }, [educationNameInput.debouncedValue, educationState.educationName]);

    useEffect(() => {
      if (!isUpdatingRef.current && descriptionInput.debouncedValue !== educationState.description) {
        onFieldChange('description', descriptionInput.debouncedValue);
      }
    }, [descriptionInput.debouncedValue, educationState.description]);

    useEffect(() => {
      if (!isUpdatingRef.current && locationInput.debouncedValue !== educationState.location) {
        onFieldChange('location', locationInput.debouncedValue);
      }
    }, [locationInput.debouncedValue, educationState.location]);

    // 외부에서 상태가 변경될 때 입력 값 동기화
    useEffect(() => {
      if (
        educationState.educationName !== educationNameInput.inputValue &&
        educationState.educationName !== educationNameInput.debouncedValue
      ) {
        isUpdatingRef.current = true;
        educationNameInput.reset(educationState.educationName);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [educationState.educationName, educationNameInput.inputValue, educationNameInput.debouncedValue]);

    useEffect(() => {
      if (educationState.description !== descriptionInput.inputValue && educationState.description !== descriptionInput.debouncedValue) {
        isUpdatingRef.current = true;
        descriptionInput.reset(educationState.description);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [educationState.description, descriptionInput.inputValue, descriptionInput.debouncedValue]);

    useEffect(() => {
      if (educationState.location !== locationInput.inputValue && educationState.location !== locationInput.debouncedValue) {
        isUpdatingRef.current = true;
        locationInput.reset(educationState.location);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [educationState.location, locationInput.inputValue, locationInput.debouncedValue]);

    const handleFieldChange = useCallback(
      (field: keyof ITEducationEditState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string | number } }) => {
          onFieldChange(field, e.target.value);
        },
      []
    );

    const getStatusColor = (status: string) => {
      const colors = {
        예정: { backgroundColor: '#e3f2fd', color: '#1565c0' },
        진행: { backgroundColor: '#fff3e0', color: '#ef6c00' },
        완료: { backgroundColor: '#e8f5e8', color: '#2e7d2e' },
        취소: { backgroundColor: '#ffebee', color: '#c62828' }
      };
      return colors[status as keyof typeof colors] || { backgroundColor: '#e9ecef', color: '#495057' };
    };

    const getEducationTypeColor = (type: string) => {
      const colors = {
        신입교육: { backgroundColor: '#e8f5e8', color: '#2e7d2e' },
        담당자교육: { backgroundColor: '#e3f2fd', color: '#1565c0' },
        관리자교육: { backgroundColor: '#fff3e0', color: '#ef6c00' },
        수시교육: { backgroundColor: '#f3e5f5', color: '#7b1fa2' }
      };
      return colors[type as keyof typeof colors] || { backgroundColor: '#e9ecef', color: '#495057' };
    };

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 교육명 - 전체 너비 */}
          <TextField
            ref={educationNameRef}
            fullWidth
            label={
              <span>
                교육명 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={educationNameInput.inputValue}
            onChange={(e) => educationNameInput.handleChange(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          {/* 교육 설명 - 전체 너비 */}
          <TextField
            fullWidth
            label="교육 설명"
            multiline
            rows={4}
            value={descriptionInput.inputValue}
            onChange={(e) => descriptionInput.handleChange(e.target.value)}
            variant="outlined"
            placeholder="교육 내용, 목표, 대상 등을 상세히 입력해주세요."
            InputLabelProps={{ shrink: true }}
            inputRef={descriptionRef}
          />

          {/* 교육유형 - 담당자 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth required>
              <InputLabel shrink>
                <span>
                  교육유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select value={educationState.educationType} onChange={handleFieldChange('educationType')} label="교육유형 *">
                {educationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={type}
                        size="small"
                        sx={{
                          ...getEducationTypeColor(type),
                          fontSize: '12px',
                          height: 20
                        }}
                      />
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel shrink>
                <span>
                  담당자 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select value={educationState.assignee} onChange={handleFieldChange('assignee')} label="담당자 *">
                {assignees.map((assignee) => (
                  <MenuItem key={assignee} value={assignee}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={assigneeAvatars[assignee]} sx={{ width: 24, height: 24 }}>
                        {assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{assignee}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* 실행일 - 장소 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label={
                <span>
                  실행일 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="date"
              value={educationState.executionDate}
              onChange={handleFieldChange('executionDate')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              ref={locationRef}
              fullWidth
              label={
                <span>
                  장소 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={locationInput.inputValue}
              onChange={(e) => locationInput.handleChange(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 상태 - 참석수 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select value={educationState.status} onChange={handleFieldChange('status')} label="상태">
                {statusOpts.map((status) => (
                  <MenuItem key={status} value={status}>
                    <Chip
                      label={status}
                      size="small"
                      sx={{
                        ...getStatusColor(status),
                        fontSize: '12px',
                        height: 20
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="참석수"
              type="number"
              value={educationState.participantCount}
              onChange={handleFieldChange('participantCount')}
              variant="outlined"
              InputProps={{
                inputProps: { min: 0, max: 200 },
                endAdornment: (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    명
                  </Typography>
                )
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 등록일 - 코드 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={educationState.registrationDate}
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
              value={educationState.code}
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
          </Stack>
        </Stack>
      </Box>
    );
  }
);

// 첨부파일 관리 다이얼로그 컴포넌트
const AttachmentDialog = memo(
  ({
    open,
    onClose,
    attachments,
    onAttachmentsChange
  }: {
    open: boolean;
    onClose: () => void;
    attachments: File[];
    onAttachmentsChange: (files: File[]) => void;
  }) => {
    const [localAttachments, setLocalAttachments] = useState<File[]>(attachments);

    useEffect(() => {
      if (open) {
        setLocalAttachments(attachments);
      }
    }, [open, attachments]);

    const handleFileUpload = useCallback((files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files);
      setLocalAttachments((prev) => [...prev, ...newFiles]);
    }, []);

    const handleFileDelete = useCallback((index: number) => {
      setLocalAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(() => {
      onAttachmentsChange(localAttachments);
      onClose();
    }, [localAttachments, onAttachmentsChange, onClose]);

    const handleCancel = useCallback(() => {
      setLocalAttachments(attachments);
      onClose();
    }, [attachments, onClose]);

    return (
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>첨부파일 관리</DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* 파일 업로드 영역 */}
          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              mb: 3,
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: '#f5f5f5'
              }
            }}
            onClick={() => document.getElementById('attachment-upload')?.click()}
          >
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              style={{ display: 'none' }}
              id="attachment-upload"
            />
            <Box sx={{ mb: 1 }}>
              <Add size={48} color="#bdbdbd" />
            </Box>
            <Typography variant="body1" sx={{ color: '#666', mb: 0.5 }}>
              파일을 클릭하여 업로드하거나 여기에 드래그하세요
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              여러 파일을 동시에 선택할 수 있습니다
            </Typography>
          </Box>

          {/* 첨부된 파일 목록 */}
          {localAttachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                첨부된 파일 ({localAttachments.length}개)
              </Typography>
              <List dense>
                {localAttachments.map((file, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      primaryTypographyProps={{ fontSize: '14px' }}
                      secondaryTypographyProps={{ fontSize: '12px' }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" size="small" onClick={() => handleFileDelete(index)} color="error">
                        <CloseCircle size={16} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={handleCancel} variant="outlined" size="small">
            취소
          </Button>
          <Button onClick={handleSave} variant="contained" size="small">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

// 커리큘럼 탭 컴포넌트
const CurriculumTab = memo(
  ({
    curriculumItems,
    onCurriculumChange
  }: {
    curriculumItems: CurriculumItem[];
    onCurriculumChange: (items: CurriculumItem[]) => void;
  }) => {
    const [allSelected, setAllSelected] = useState(false);
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
    const [attachmentDialog, setAttachmentDialog] = useState<{ open: boolean; itemId: number | null }>({
      open: false,
      itemId: null
    });

    // 새 커리큘럼 아이템 추가 (헤더 바로 아래에 추가)
    const handleAddItem = useCallback(() => {
      const newItem: CurriculumItem = {
        id: Date.now(),
        no: 1, // 새 항목은 항상 1번
        date: '',
        time: '',
        instructor: '',
        title: '',
        content: '',
        notes: '',
        attachments: [],
        selected: false
      };
      // 새 항목을 맨 앞에 추가하고 NO를 역순으로 재계산 (최신 항목이 1번)
      const updatedItems = [newItem, ...curriculumItems];
      const reorderedItems = updatedItems.map((item, index) => ({
        ...item,
        no: updatedItems.length - index
      }));
      onCurriculumChange(reorderedItems);
    }, [curriculumItems, onCurriculumChange]);

    // 커리큘럼 아이템 삭제
    const handleDeleteItem = useCallback(
      (id: number) => {
        const updatedItems = curriculumItems.filter((item) => item.id !== id);
        // NO를 역순으로 재계산 (최신 항목이 1번)
        const reorderedItems = updatedItems.map((item, index) => ({
          ...item,
          no: updatedItems.length - index
        }));
        onCurriculumChange(reorderedItems);
        setEditingCell(null);
      },
      [curriculumItems, onCurriculumChange]
    );

    // 선택된 항목들 삭제
    const handleDeleteSelected = useCallback(() => {
      const updatedItems = curriculumItems.filter((item) => !item.selected);
      // NO를 역순으로 재계산 (최신 항목이 1번)
      const reorderedItems = updatedItems.map((item, index) => ({
        ...item,
        no: updatedItems.length - index,
        selected: false
      }));
      onCurriculumChange(reorderedItems);
      setAllSelected(false);
      setEditingCell(null);
    }, [curriculumItems, onCurriculumChange]);

    // 필드 값 변경
    const handleFieldChange = useCallback(
      (id: number, field: keyof CurriculumItem, value: string | boolean) => {
        const updatedItems = curriculumItems.map((item) => (item.id === id ? { ...item, [field]: value } : item));
        onCurriculumChange(updatedItems);
      },
      [curriculumItems, onCurriculumChange]
    );

    // 개별 체크박스 변경
    const handleItemSelect = useCallback(
      (id: number, selected: boolean) => {
        const updatedItems = curriculumItems.map((item) => (item.id === id ? { ...item, selected } : item));
        onCurriculumChange(updatedItems);

        // 전체 선택 상태 업데이트
        const allChecked = updatedItems.every((item) => item.selected);
        setAllSelected(allChecked);
      },
      [curriculumItems, onCurriculumChange]
    );

    // 전체 선택/해제
    const handleSelectAll = useCallback(
      (checked: boolean) => {
        const updatedItems = curriculumItems.map((item) => ({
          ...item,
          selected: checked
        }));
        onCurriculumChange(updatedItems);
        setAllSelected(checked);
      },
      [curriculumItems, onCurriculumChange]
    );

    // 셀 편집 시작
    const handleCellClick = useCallback((id: number, field: string) => {
      setEditingCell({ id, field });
    }, []);

    // 셀 편집 종료
    const handleCellBlur = useCallback(() => {
      setEditingCell(null);
    }, []);

    // 첨부파일 다이얼로그 열기
    const handleAttachmentClick = useCallback((id: number) => {
      setAttachmentDialog({ open: true, itemId: id });
    }, []);

    // 첨부파일 다이얼로그 닫기
    const handleAttachmentClose = useCallback(() => {
      setAttachmentDialog({ open: false, itemId: null });
    }, []);

    // 첨부파일 변경
    const handleAttachmentChange = useCallback(
      (files: File[]) => {
        if (attachmentDialog.itemId === null) return;

        const updatedItems = curriculumItems.map((item) => (item.id === attachmentDialog.itemId ? { ...item, attachments: files } : item));
        onCurriculumChange(updatedItems);
      },
      [curriculumItems, onCurriculumChange, attachmentDialog.itemId]
    );

    // 선택된 항목 개수
    const selectedCount = curriculumItems.filter((item) => item.selected).length;

    // 편집 중인지 확인
    const isEditing = (id: number, field: string) => {
      return editingCell?.id === id && editingCell?.field === field;
    };

    return (
      <Box sx={{ p: 3 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            커리큘럼 관리
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddItem} size="small" sx={{ fontSize: '12px' }}>
              추가
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Trash />}
              onClick={handleDeleteSelected}
              size="small"
              sx={{ fontSize: '12px' }}
              disabled={selectedCount === 0}
            >
              삭제 ({selectedCount})
            </Button>
          </Box>
        </Box>

        {/* 테이블 */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: 60, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                  <Checkbox checked={allSelected} onChange={(e) => handleSelectAll(e.target.checked)} size="small" />
                </TableCell>
                <TableCell sx={{ width: 60, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>NO</TableCell>
                <TableCell sx={{ width: 120, fontSize: '12px', fontWeight: 600 }}>일자</TableCell>
                <TableCell sx={{ width: 100, fontSize: '12px', fontWeight: 600 }}>시간</TableCell>
                <TableCell sx={{ width: 120, fontSize: '12px', fontWeight: 600 }}>강사</TableCell>
                <TableCell sx={{ width: 200, fontSize: '12px', fontWeight: 600 }}>제목</TableCell>
                <TableCell sx={{ minWidth: 200, fontSize: '12px', fontWeight: 600 }}>교육내용</TableCell>
                <TableCell sx={{ width: 150, fontSize: '12px', fontWeight: 600 }}>비고</TableCell>
                <TableCell sx={{ width: 120, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>첨부</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {curriculumItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      등록된 커리큘럼이 없습니다. "추가" 버튼을 클릭하여 새 커리큘럼을 추가하세요.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                curriculumItems.map((item) => (
                  <TableRow key={item.id} hover>
                    {/* 선택 */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Checkbox checked={item.selected} onChange={(e) => handleItemSelect(item.id, e.target.checked)} size="small" />
                    </TableCell>

                    {/* NO */}
                    <TableCell sx={{ textAlign: 'center', fontSize: '12px' }}>
                      <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500 }}>
                        {item.no}
                      </Typography>
                    </TableCell>

                    {/* 일자 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'date')}>
                      {isEditing(item.id, 'date') ? (
                        <TextField
                          type="date"
                          value={item.date}
                          onChange={(e) => handleFieldChange(item.id, 'date', e.target.value)}
                          onBlur={handleCellBlur}
                          variant="outlined"
                          size="small"
                          fullWidth
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px', py: 1 },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.date || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 시간 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'time')}>
                      {isEditing(item.id, 'time') ? (
                        <TextField
                          value={item.time}
                          onChange={(e) => handleFieldChange(item.id, 'time', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="09:00-10:00"
                          variant="outlined"
                          size="small"
                          fullWidth
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px', py: 1 },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.time || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 강사 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'instructor')}>
                      {isEditing(item.id, 'instructor') ? (
                        <TextField
                          value={item.instructor}
                          onChange={(e) => handleFieldChange(item.id, 'instructor', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="강사명"
                          variant="outlined"
                          size="small"
                          fullWidth
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px', py: 1 },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.instructor || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 제목 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'title')}>
                      {isEditing(item.id, 'title') ? (
                        <TextField
                          value={item.title}
                          onChange={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="교육 제목"
                          variant="outlined"
                          size="small"
                          fullWidth
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px', py: 1 },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.title || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 교육내용 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'content')}>
                      {isEditing(item.id, 'content') ? (
                        <TextField
                          value={item.content}
                          onChange={(e) => handleFieldChange(item.id, 'content', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="교육 내용"
                          variant="outlined"
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px' },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.content || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 비고 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'notes')}>
                      {isEditing(item.id, 'notes') ? (
                        <TextField
                          value={item.notes}
                          onChange={(e) => handleFieldChange(item.id, 'notes', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="비고"
                          variant="outlined"
                          size="small"
                          fullWidth
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px', py: 1 },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.notes || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 첨부 */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box
                        onClick={() => handleAttachmentClick(item.id)}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'grey.100',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'grey.200'
                          }
                        }}
                      >
                        <DocumentDownload size={16} />
                        {item.attachments.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '10px',
                              ml: 0.3,
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          >
                            ({item.attachments.length})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 첨부파일 관리 다이얼로그 */}
        <AttachmentDialog
          open={attachmentDialog.open}
          onClose={handleAttachmentClose}
          attachments={
            attachmentDialog.itemId !== null ? curriculumItems.find((item) => item.id === attachmentDialog.itemId)?.attachments || [] : []
          }
          onAttachmentsChange={handleAttachmentChange}
        />
      </Box>
    );
  }
);

// 참석자 탭 컴포넌트
const ParticipantsTab = memo(
  ({
    participantItems,
    onParticipantChange,
    assignees,
    assigneeAvatars
  }: {
    participantItems: ParticipantItem[];
    onParticipantChange: (items: ParticipantItem[]) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
  }) => {
    const [allSelected, setAllSelected] = useState(false);
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);

    // 새 참석자 추가
    const handleAddItem = useCallback(() => {
      const newItem: ParticipantItem = {
        id: Date.now(),
        no: 1,
        assignee: assignees[0] || '',
        position: '대리',
        department: 'IT팀',
        attendance: '예정',
        report: '',
        notes: '',
        selected: false
      };
      // 새 항목을 맨 앞에 추가하고 NO를 역순으로 재계산 (최신 항목이 1번)
      const updatedItems = [newItem, ...participantItems];
      const reorderedItems = updatedItems.map((item, index) => ({
        ...item,
        no: updatedItems.length - index
      }));
      onParticipantChange(reorderedItems);
    }, [participantItems, onParticipantChange, assignees]);

    // 참석자 삭제
    const handleDeleteItem = useCallback(
      (id: number) => {
        const updatedItems = participantItems.filter((item) => item.id !== id);
        // NO를 역순으로 재계산 (최신 항목이 1번)
        const reorderedItems = updatedItems.map((item, index) => ({
          ...item,
          no: updatedItems.length - index
        }));
        onParticipantChange(reorderedItems);
      },
      [participantItems, onParticipantChange]
    );

    // 선택된 항목들 삭제
    const handleDeleteSelected = useCallback(() => {
      const updatedItems = participantItems.filter((item) => !item.selected);
      // NO를 역순으로 재계산 (최신 항목이 1번)
      const reorderedItems = updatedItems.map((item, index) => ({
        ...item,
        no: updatedItems.length - index,
        selected: false
      }));
      onParticipantChange(reorderedItems);
      setAllSelected(false);
    }, [participantItems, onParticipantChange]);

    // 필드 값 변경
    const handleFieldChange = useCallback(
      (id: number, field: keyof ParticipantItem, value: string | boolean) => {
        const updatedItems = participantItems.map((item) => (item.id === id ? { ...item, [field]: value } : item));
        onParticipantChange(updatedItems);
      },
      [participantItems, onParticipantChange]
    );

    // 개별 체크박스 변경
    const handleItemSelect = useCallback(
      (id: number, selected: boolean) => {
        const updatedItems = participantItems.map((item) => (item.id === id ? { ...item, selected } : item));
        onParticipantChange(updatedItems);

        // 전체 선택 상태 업데이트
        const allChecked = updatedItems.every((item) => item.selected);
        setAllSelected(allChecked);
      },
      [participantItems, onParticipantChange]
    );

    // 전체 선택/해제
    const handleSelectAll = useCallback(
      (checked: boolean) => {
        const updatedItems = participantItems.map((item) => ({
          ...item,
          selected: checked
        }));
        onParticipantChange(updatedItems);
        setAllSelected(checked);
      },
      [participantItems, onParticipantChange]
    );

    // 출석 상태별 색상
    const getAttendanceColor = (attendance: string) => {
      switch (attendance) {
        case '예정':
          return { backgroundColor: '#e3f2fd', color: '#1565c0' };
        case '참석':
          return { backgroundColor: '#e8f5e8', color: '#2e7d2e' };
        case '불참':
          return { backgroundColor: '#ffebee', color: '#c62828' };
        default:
          return { backgroundColor: '#f5f5f5', color: '#666666' };
      }
    };

    // 편집 관련 함수들
    const isEditing = (id: number, field: string) => {
      return editingCell?.id === id && editingCell?.field === field;
    };

    const handleCellClick = (id: number, field: string) => {
      setEditingCell({ id, field });
    };

    const handleCellBlur = () => {
      setEditingCell(null);
    };

    // 선택된 항목 개수
    const selectedCount = participantItems.filter((item) => item.selected).length;

    return (
      <Box sx={{ p: 3 }}>
        {/* 헤더 - 참석자 현황과 버튼을 같은 줄에 배치 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          {/* 참석자 현황 - 회색 배경 제거 */}
          {participantItems.length > 0 ? (
            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
              참석자 현황: 총 {participantItems.length}명 (예정: {participantItems.filter((item) => item.attendance === '예정').length}명,
              참석: {participantItems.filter((item) => item.attendance === '참석').length}명, 불참:{' '}
              {participantItems.filter((item) => item.attendance === '불참').length}명)
            </Typography>
          ) : (
            <Box />
          )}

          {/* 버튼 그룹 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddItem} size="small" sx={{ fontSize: '12px' }}>
              추가
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Trash />}
              onClick={handleDeleteSelected}
              size="small"
              sx={{ fontSize: '12px' }}
              disabled={selectedCount === 0}
            >
              삭제 ({selectedCount})
            </Button>
          </Box>
        </Box>

        {/* 테이블 */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: 60, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                  <Checkbox checked={allSelected} onChange={(e) => handleSelectAll(e.target.checked)} size="small" />
                </TableCell>
                <TableCell sx={{ width: 60, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>NO</TableCell>
                <TableCell sx={{ width: 150, fontSize: '12px', fontWeight: 600 }}>담당자</TableCell>
                <TableCell sx={{ width: 120, fontSize: '12px', fontWeight: 600 }}>직책</TableCell>
                <TableCell sx={{ width: 120, fontSize: '12px', fontWeight: 600 }}>부서</TableCell>
                <TableCell sx={{ width: 100, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>출석</TableCell>
                <TableCell sx={{ minWidth: 200, fontSize: '12px', fontWeight: 600 }}>Report</TableCell>
                <TableCell sx={{ width: 150, fontSize: '12px', fontWeight: 600 }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participantItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      등록된 참석자가 없습니다. "추가" 버튼을 클릭하여 새 참석자를 추가하세요.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                participantItems.map((item) => (
                  <TableRow key={item.id} hover>
                    {/* 선택 */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Checkbox checked={item.selected} onChange={(e) => handleItemSelect(item.id, e.target.checked)} size="small" />
                    </TableCell>

                    {/* NO */}
                    <TableCell sx={{ textAlign: 'center', fontSize: '12px' }}>
                      <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500 }}>
                        {item.no}
                      </Typography>
                    </TableCell>

                    {/* 담당자 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'assignee')}>
                      {isEditing(item.id, 'assignee') ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.assignee}
                            onChange={(e) => handleFieldChange(item.id, 'assignee', e.target.value)}
                            onBlur={handleCellBlur}
                            autoFocus
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '12px',
                                py: 1
                              }
                            }}
                          >
                            {assignees.map((assignee) => (
                              <MenuItem key={assignee} value={assignee}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar src={assigneeAvatars[assignee]} sx={{ width: 20, height: 20 }}>
                                    {assignee?.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {assignee}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 1 }}>
                          <Avatar src={assigneeAvatars[item.assignee]} sx={{ width: 20, height: 20 }}>
                            {item.assignee?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {item.assignee}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>

                    {/* 직책 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'position')}>
                      {isEditing(item.id, 'position') ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.position}
                            onChange={(e) => handleFieldChange(item.id, 'position', e.target.value)}
                            onBlur={handleCellBlur}
                            autoFocus
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '12px',
                                py: 1
                              }
                            }}
                          >
                            {positionOptions.map((position) => (
                              <MenuItem key={position} value={position}>
                                <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                  {position}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            cursor: 'pointer',
                            py: 1,
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.position}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 부서 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'department')}>
                      {isEditing(item.id, 'department') ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.department}
                            onChange={(e) => handleFieldChange(item.id, 'department', e.target.value)}
                            onBlur={handleCellBlur}
                            autoFocus
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '12px',
                                py: 1
                              }
                            }}
                          >
                            {departmentOptions.map((dept) => (
                              <MenuItem key={dept} value={dept}>
                                <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                  {dept}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            cursor: 'pointer',
                            py: 1,
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.department}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 출석 */}
                    <TableCell sx={{ textAlign: 'center' }} onClick={() => handleCellClick(item.id, 'attendance')}>
                      {isEditing(item.id, 'attendance') ? (
                        <FormControl size="small">
                          <Select
                            value={item.attendance}
                            onChange={(e) => handleFieldChange(item.id, 'attendance', e.target.value)}
                            onBlur={handleCellBlur}
                            autoFocus
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '12px',
                                py: 0.5
                              }
                            }}
                          >
                            {attendanceOptions.map((status) => (
                              <MenuItem key={status} value={status}>
                                <Chip
                                  label={status}
                                  size="small"
                                  sx={{
                                    ...getAttendanceColor(status),
                                    fontSize: '11px',
                                    height: 18
                                  }}
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={item.attendance}
                          size="small"
                          sx={{
                            ...getAttendanceColor(item.attendance),
                            fontSize: '11px',
                            height: 18,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Report */}
                    <TableCell onClick={() => handleCellClick(item.id, 'report')}>
                      {isEditing(item.id, 'report') ? (
                        <TextField
                          value={item.report}
                          onChange={(e) => handleFieldChange(item.id, 'report', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="보고서 또는 특이사항"
                          variant="outlined"
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px' },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.report || ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 비고 */}
                    <TableCell onClick={() => handleCellClick(item.id, 'notes')}>
                      {isEditing(item.id, 'notes') ? (
                        <TextField
                          value={item.notes}
                          onChange={(e) => handleFieldChange(item.id, 'notes', e.target.value)}
                          onBlur={handleCellBlur}
                          placeholder="비고"
                          variant="outlined"
                          size="small"
                          fullWidth
                          autoFocus
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { fontSize: '12px', py: 1 },
                            '& .MuiOutlinedInput-root': { minHeight: 'auto' }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '12px',
                            py: 1,
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                        >
                          {item.notes || ''}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
);

// 교육실적보고 탭 컴포넌트
const ReportsTab = memo(
  ({
    educationReport,
    onEducationReportChange
  }: {
    educationReport: EducationReport;
    onEducationReportChange: (field: keyof EducationReport, value: string) => void;
  }) => {
    return (
      <Box sx={{ p: 3 }}>
        {/* 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, mb: 1 }}>
            교육실적보고
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
            교육 완료 후 성과와 개선사항, 참석자 소감을 종합하여 보고서를 작성하세요.
          </Typography>
        </Box>

        {/* 컨텐츠 영역 */}
        <Box>
          {/* 성과 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                mb: 1,
                color: 'primary.main'
              }}
            >
              📈 성과
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                color: 'text.secondary',
                mb: 2
              }}
            >
              교육을 통해 달성한 구체적인 성과나 결과를 기록하세요.
            </Typography>
            <TextField
              value={educationReport.achievements}
              onChange={(e) => onEducationReportChange('achievements', e.target.value)}
              placeholder="예시: 참석자들의 보안 의식 향상, 새로운 기술 역량 습득, 업무 효율성 개선 등"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '12px' },
                '& .MuiOutlinedInput-root': {
                  minHeight: 'auto',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#c0c0c0' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                }
              }}
            />
          </Box>

          {/* 개선 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                mb: 1,
                color: 'warning.main'
              }}
            >
              🔧 개선사항
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                color: 'text.secondary',
                mb: 2
              }}
            >
              향후 교육에서 개선이 필요한 사항이나 보완점을 기록하세요.
            </Typography>
            <TextField
              value={educationReport.improvements}
              onChange={(e) => onEducationReportChange('improvements', e.target.value)}
              placeholder="예시: 교육 시간 조정 필요, 실습 비중 확대, 교육 자료 보완, 강사진 전문성 강화 등"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '12px' },
                '& .MuiOutlinedInput-root': {
                  minHeight: 'auto',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#c0c0c0' },
                  '&.Mui-focused fieldset': { borderColor: 'warning.main' }
                }
              }}
            />
          </Box>

          {/* 교육소감 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                mb: 1,
                color: 'success.main'
              }}
            >
              💭 교육소감
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                color: 'text.secondary',
                mb: 2
              }}
            >
              참석자들의 전반적인 교육 소감과 피드백을 종합하여 작성하세요.
            </Typography>
            <TextField
              value={educationReport.feedback}
              onChange={(e) => onEducationReportChange('feedback', e.target.value)}
              placeholder="예시: 교육 내용에 대한 만족도, 실무 적용 가능성, 추가 학습 의지, 전반적인 교육 평가 등"
              variant="outlined"
              fullWidth
              multiline
              rows={5}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '12px' },
                '& .MuiOutlinedInput-root': {
                  minHeight: 'auto',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#c0c0c0' },
                  '&.Mui-focused fieldset': { borderColor: 'success.main' }
                }
              }}
            />
          </Box>

          {/* 비고 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                mb: 1,
                color: 'text.primary'
              }}
            >
              📝 비고
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                color: 'text.secondary',
                mb: 2
              }}
            >
              기타 특이사항이나 추가로 기록할 내용을 작성하세요.
            </Typography>
            <TextField
              value={educationReport.notes}
              onChange={(e) => onEducationReportChange('notes', e.target.value)}
              placeholder="예시: 교육 중 발생한 특이사항, 추가 조치사항, 후속 교육 계획 등"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '12px' },
                '& .MuiOutlinedInput-root': {
                  minHeight: 'auto',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#c0c0c0' },
                  '&.Mui-focused fieldset': { borderColor: 'text.primary' }
                }
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  }
);

// 자료 탭 컴포넌트
interface Material {
  id: number;
  name: string;
  type: string;
  size: string;
  file?: File;
  uploadDate: string;
}

const MaterialTab = memo(() => {
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: 'KPI_분석_보고서.pdf', type: 'application/pdf', size: '2.1 MB', uploadDate: '2025-01-10' },
    {
      id: 2,
      name: '성과_데이터.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: '1.5 MB',
      uploadDate: '2025-01-15'
    }
  ]);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const material: Material = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: formatFileSize(file.size),
        file: file,
        uploadDate: new Date().toISOString().split('T')[0]
      };

      setMaterials((prev) => [material, ...prev]);
    });

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

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

  const handleEditMaterial = useCallback((materialId: number, currentName: string) => {
    setEditingMaterialId(materialId);
    setEditingMaterialText(currentName);
  }, []);

  const handleSaveEditMaterial = useCallback(() => {
    if (editingMaterialId && editingMaterialText.trim()) {
      setMaterials((prev) =>
        prev.map((material) => (material.id === editingMaterialId ? { ...material, name: editingMaterialText.trim() } : material))
      );
      setEditingMaterialId(null);
      setEditingMaterialText('');
    }
  }, [editingMaterialId, editingMaterialText]);

  const handleCancelEditMaterial = useCallback(() => {
    setEditingMaterialId(null);
    setEditingMaterialText('');
  }, []);

  const handleDeleteMaterial = useCallback((materialId: number) => {
    setMaterials((prev) => prev.filter((material) => material.id !== materialId));
  }, []);

  const handleDownloadMaterial = useCallback((material: Material) => {
    // 실제 파일 다운로드 로직
    if (material.file) {
      const url = URL.createObjectURL(material.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.name;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // 시뮬레이션: 서버에서 파일 다운로드
      alert(`"${material.name}" 파일을 다운로드합니다.`);
    }
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
          {materials.map((material) => (
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
                      onClick={() => handleEditMaterial(material.id, material.name)}
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
                        onClick={() => handleDownloadMaterial(material)}
                        color="primary"
                        sx={{ p: 0.5 }}
                        title="다운로드"
                      >
                        <Typography fontSize="14px">⬇️</Typography>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditMaterial(material.id, material.name)}
                        color="primary"
                        sx={{ p: 0.5 }}
                        title="수정"
                      >
                        <Typography fontSize="14px">✏️</Typography>
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteMaterial(material.id)} color="error" sx={{ p: 0.5 }} title="삭제">
                        <Typography fontSize="14px">🗑️</Typography>
                      </IconButton>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}

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
        </Stack>
      </Box>
    </Box>
  );
});

// 탭패널 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`education-tabpanel-${index}`} aria-labelledby={`education-tab-${index}`} {...other}>
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `education-tab-${index}`,
    'aria-controls': `education-tabpanel-${index}`
  };
}

// 메인 다이얼로그 컴포넌트
interface ITEducationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ITEducationRecord) => void;
  data?: ITEducationRecord | null;
  mode: 'add' | 'edit';
}

export default function ITEducationDialog({ open, onClose, onSave, data, mode }: ITEducationDialogProps) {
  const [value, setValue] = useState(0);

  // 교육 상태 관리
  const [educationState, dispatch] = useReducer(editEducationReducer, {
    educationName: '',
    description: '',
    educationType: '신입교육',
    assignee: assigneeOptions[0].name,
    executionDate: '',
    location: '',
    status: '예정',
    participantCount: 0,
    registrationDate: '',
    code: ''
  });

  // 커리큘럼 상태 관리
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);

  // 참석자 상태 관리
  const [participantItems, setParticipantItems] = useState<ParticipantItem[]>([]);

  // 교육실적보고 상태 관리
  const [educationReport, setEducationReport] = useState<EducationReport>({
    achievements: '',
    improvements: '',
    feedback: '',
    notes: ''
  });

  // 옵션들
  const assignees = useMemo(() => assigneeOptions.map((a) => a.name), []);
  const assigneeAvatars = useMemo(() => assigneeOptions.reduce((acc, a) => ({ ...acc, [a.name]: a.avatar }), {}), []);
  const statusColors = useMemo(
    () => ({
      예정: { backgroundColor: '#e3f2fd', color: '#1565c0' },
      진행: { backgroundColor: '#fff3e0', color: '#ef6c00' },
      완료: { backgroundColor: '#e8f5e8', color: '#2e7d2e' },
      취소: { backgroundColor: '#ffebee', color: '#c62828' }
    }),
    []
  );

  // 다이얼로그 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        dispatch({ type: 'SET_EDUCATION', education: data });
        // TODO: 편집 모드에서는 기존 커리큘럼/참석자/보고서 데이터 로드
        setCurriculumItems([]);
        setParticipantItems([]);
        setEducationReport({
          achievements: '',
          improvements: '',
          feedback: '',
          notes: ''
        });
      } else {
        const newCode = `IT-EDU-24-${String(Date.now()).slice(-3)}`;
        const newDate = new Date().toISOString().split('T')[0];
        dispatch({ type: 'INIT_NEW_EDUCATION', code: newCode, registrationDate: newDate });
        setCurriculumItems([]);
        setParticipantItems([]);
        setEducationReport({
          achievements: '',
          improvements: '',
          feedback: '',
          notes: ''
        });
      }
      setValue(0);
    }
  }, [open, mode, data]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleFieldChange = useCallback((field: keyof ITEducationEditState, value: string | number) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // 커리큘럼 변경 핸들러
  const handleCurriculumChange = useCallback((items: CurriculumItem[]) => {
    setCurriculumItems(items);
  }, []);

  // 참석자 변경 핸들러
  const handleParticipantChange = useCallback((items: ParticipantItem[]) => {
    setParticipantItems(items);
  }, []);

  // 교육실적보고 변경 핸들러
  const handleEducationReportChange = useCallback((field: keyof EducationReport, value: string) => {
    setEducationReport((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(() => {
    const educationData: ITEducationRecord = {
      id: data?.id || Date.now(),
      registrationDate: educationState.registrationDate,
      code: educationState.code,
      educationType: educationState.educationType as any,
      educationName: educationState.educationName,
      location: educationState.location,
      participantCount: educationState.participantCount,
      executionDate: educationState.executionDate,
      status: educationState.status as any,
      assignee: educationState.assignee,
      attachment: false,
      attachmentCount: 0,
      attachments: [],
      isNew: mode === 'add'
    };

    onSave(educationData);
    onClose();
  }, [educationState, data, mode, onSave, onClose]);

  const handleClose = useCallback(() => {
    onClose();
    dispatch({ type: 'RESET' });
    setCurriculumItems([]);
    setParticipantItems([]);
    setEducationReport({
      achievements: '',
      improvements: '',
      feedback: '',
      notes: ''
    });
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontSize: '18px', fontWeight: 600 }}>
          {mode === 'add' ? 'IT교육과정 추가' : 'IT교육과정 수정'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} variant="outlined" size="small">
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={!educationState.educationName || !educationState.executionDate || !educationState.location}
          >
            저장
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="교육관리 탭">
            <Tab label="개요" {...a11yProps(0)} />
            <Tab label="커리큘럼" {...a11yProps(1)} />
            <Tab label="참석자" {...a11yProps(2)} />
            <Tab label="교육실적보고" {...a11yProps(3)} />
            <Tab label="자료" {...a11yProps(4)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <OverviewTab
            educationState={educationState}
            onFieldChange={handleFieldChange}
            assignees={assignees}
            assigneeAvatars={assigneeAvatars}
            statusOptions={statusOptions}
            statusColors={statusColors}
            educationTypes={educationTypeOptions}
          />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <CurriculumTab curriculumItems={curriculumItems} onCurriculumChange={handleCurriculumChange} />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <ParticipantsTab
            participantItems={participantItems}
            onParticipantChange={handleParticipantChange}
            assignees={assignees}
            assigneeAvatars={assigneeAvatars}
          />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <ReportsTab educationReport={educationReport} onEducationReportChange={handleEducationReportChange} />
        </TabPanel>

        <TabPanel value={value} index={4}>
          <MaterialTab />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
}
