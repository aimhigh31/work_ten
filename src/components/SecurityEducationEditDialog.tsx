'use client';

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
  TableRow,
  Pagination
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  SecurityEducationTableData,
  SecurityEducationStatus,
  SecurityEducationRecord,
  CurriculumItem,
  ParticipantItem,
  EducationReport,
  educationTypeOptions,
  statusOptions,
  assigneeOptions,
  attendanceOptions,
  positionOptions,
  departmentOptions
} from '../types/security-education';
import { assignees, securityEducationStatusOptions, assigneeAvatars } from '../data/security-education';
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';
import { UserProfile } from '../hooks/useSupabaseUserManagement';
import { useSupabaseSecurityCurriculum, SecurityCurriculumItem } from '../hooks/useSupabaseSecurityCurriculum';
import { useSupabaseSecurityAttendee, SecurityAttendeeItem } from '../hooks/useSupabaseSecurityAttendee';
import { useSupabaseSecurityEducation } from '../hooks/useSupabaseSecurityEducation';
import { useSupabaseDepartments } from '../hooks/useSupabaseDepartments';
import useIdGenerator from '../hooks/useIdGenerator';
import useUser from '../hooks/useUser';
import { useCommonData } from '../contexts/CommonDataContext'; // ✅ 공용 창고
import { supabase } from '../lib/supabase';
import { useSupabaseChangeLog } from '../hooks/useSupabaseChangeLog';
import { CreateChangeLogInput, CHANGE_LOG_ACTIONS, ChangeLogMetadata } from '../types/changelog';
import { generateChangeDescription, safeJsonStringify } from '../utils/changeLogHelper';

// 데이터 변환 유틸리티 함수들
const convertTableDataToRecord = (tableData: SecurityEducationTableData): SecurityEducationRecord => {
  return {
    id: tableData.id,
    registrationDate: tableData.registrationDate,
    code: tableData.code,
    educationType: tableData.educationType,
    educationName: tableData.educationName,
    description: tableData.description,
    location: tableData.location,
    participantCount: tableData.attendeeCount,
    executionDate: tableData.executionDate,
    status: tableData.status,
    assignee: tableData.assignee,
    attachment: Boolean(tableData.attachments?.length),
    attachmentCount: tableData.attachments?.length || 0,
    attachments: tableData.attachments || [],
    isNew: false
  };
};

const convertRecordToTableData = (record: SecurityEducationRecord): SecurityEducationTableData => {
  return {
    id: record.id,
    no: record.id, // 임시로 id 사용
    registrationDate: record.registrationDate,
    code: record.code,
    educationType: record.educationType,
    educationName: record.educationName,
    location: record.location,
    attendeeCount: record.participantCount,
    executionDate: record.executionDate,
    status: record.status,
    assignee: record.assignee,
    team: undefined, // 옵셔널
    department: undefined, // 옵셔널
    attachments: record.attachments
  };
};

// 상태 색상 정의
const statusColors = {
  계획: 'info',
  진행중: 'warning',
  완료: 'success',
  취소: 'error'
} as const;

// 각 교육과정별 독립적인 데이터 저장소
interface EducationDataStorage {
  curriculum: CurriculumItem[];
  participants: ParticipantItem[];
  report: EducationReport;
  comments: Array<{ id: number; author: string; content: string; timestamp: string; avatar?: string }>;
}

class EducationDataManager {
  private static instance: EducationDataManager;
  private storage: Map<number, EducationDataStorage> = new Map();

  static getInstance(): EducationDataManager {
    if (!EducationDataManager.instance) {
      EducationDataManager.instance = new EducationDataManager();
    }
    return EducationDataManager.instance;
  }

  // 교육과정별 데이터 가져오기
  getData(educationId: number): EducationDataStorage {
    if (!this.storage.has(educationId)) {
      this.storage.set(educationId, {
        curriculum: [],
        participants: [],
        report: { achievements: '', improvements: '', nextSteps: '', feedback: '' },
        comments: []
      });
    }
    return this.storage.get(educationId)!;
  }

  // 커리큘럼 데이터 저장
  saveCurriculum(educationId: number, curriculum: CurriculumItem[]) {
    const data = this.getData(educationId);
    data.curriculum = curriculum;
    this.storage.set(educationId, data);
  }

  // 참석자 데이터 저장
  saveParticipants(educationId: number, participants: ParticipantItem[]) {
    const data = this.getData(educationId);
    data.participants = participants;
    this.storage.set(educationId, data);
  }

  // 보고서 데이터 저장
  saveReport(educationId: number, report: EducationReport) {
    const data = this.getData(educationId);
    data.report = report;
    this.storage.set(educationId, data);
  }

  // 댓글 데이터 저장
  saveComments(educationId: number, comments: Array<{ id: number; author: string; content: string; timestamp: string; avatar?: string }>) {
    const data = this.getData(educationId);
    data.comments = comments;
    this.storage.set(educationId, data);
  }
}
const positionOptions = ['사원', '주임', '대리', '과장', '차장', '부장'];
const departmentOptions = ['IT팀', '개발팀', '디자인팀', '기획팀', '마케팅팀'];
// import { useOptimizedInput } from '../hooks/useDebounce'; // TODO: 후 구현 필요

// assets
import { Add, Edit, Trash, DocumentDownload, CloseCircle, Calendar, Edit2, AttachSquare } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface SecurityEducationEditState {
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
  team: string;
}

interface SecurityEducationEditAction {
  type: 'SET_FIELD' | 'SET_EDUCATION' | 'INIT_NEW_EDUCATION' | 'RESET';
  field?: keyof SecurityEducationEditState;
  value?: string | number;
  education?: SecurityEducationRecord;
  code?: string;
  registrationDate?: string;
  assignee?: string;
  team?: string;
}

const edsecurityEducationReducer = (state: SecurityEducationEditState, action: SecurityEducationEditAction): SecurityEducationEditState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field!]: action.value! };
    case 'SET_EDUCATION':
      console.log('🔍 [Reducer] SET_EDUCATION 실행');
      console.log('🔍 action.education.educationType:', action.education!.educationType);
      console.log('🔍 action.education.status:', action.education!.status);
      const newState = {
        educationName: action.education!.educationName || '',
        description: action.education!.description || '',
        educationType: action.education!.educationType || '',
        assignee: action.education!.assignee || '',
        executionDate: action.education!.executionDate || '',
        location: action.education!.location || '',
        status: action.education!.status || '대기',
        participantCount: action.education!.participantCount || 0,
        registrationDate: action.education!.registrationDate || '',
        code: action.education!.code || '',
        team: action.education!.team || ''
      };
      console.log('🔍 [Reducer] 새 상태:', newState);
      return newState;
    case 'INIT_NEW_EDUCATION':
      return {
        educationName: '',
        description: '',
        educationType: '',
        assignee: action.assignee || assignees[0],
        executionDate: '',
        location: '',
        status: '', // useEffect에서 "대기" subcode로 설정됨
        participantCount: 0,
        registrationDate: action.registrationDate!,
        code: action.code!,
        team: action.team || ''
      };
    case 'RESET':
      return {
        educationName: '',
        description: '',
        educationType: '',
        assignee: action.assignee || assignees[0],
        executionDate: '',
        location: '',
        status: '', // useEffect에서 "대기" subcode로 설정됨
        participantCount: 0,
        registrationDate: '',
        code: '',
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
    statusColors,
    educationTypes,
    statusTypes,
    assigneeList
  }: {
    educationState: SecurityEducationEditState;
    onFieldChange: (field: keyof SecurityEducationEditState, value: string | number) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusColors: Record<string, any>;
    educationTypes: any[];
    statusTypes: any[];
    assigneeList: UserProfile[];
  }) => {
    // 부서 목록 가져오기
    const { departments } = useSupabaseDepartments();
    const activeDepartments = useMemo(() => {
      return departments.filter((dept) => dept.is_active);
    }, [departments]);

    // TextField 직접 참조를 위한 ref
    const educationNameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);

    // TODO: useOptimizedInput 후 구현 필요 - 임시로 일반 상태 사용
    const [educationName, setEducationName] = useState(educationState.educationName || '');
    const [description, setDescription] = useState(educationState.description || '');
    const [location, setLocation] = useState(educationState.location || '');

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // 외부 상태 변경시 로컬 상태 동기화
    useEffect(() => {
      setEducationName(educationState.educationName || '');
    }, [educationState.educationName]);

    useEffect(() => {
      setDescription(educationState.description || '');
    }, [educationState.description]);

    useEffect(() => {
      setLocation(educationState.location || '');
    }, [educationState.location]);

    const handleFieldChange = useCallback(
      (field: keyof SecurityEducationEditState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string | number } }) => {
          onFieldChange(field, e.target.value);
        },
      [onFieldChange]
    );

    const getStatusColor = (status: string) => {
      const colors = {
        계획: { backgroundColor: '#F5F5F5', color: '#757575' }, // 회색
        대기: { backgroundColor: '#F5F5F5', color: '#757575' }, // 회색
        진행중: { backgroundColor: '#E3F2FD', color: '#1976D2' }, // 파란색
        진행: { backgroundColor: '#E3F2FD', color: '#1976D2' }, // 파란색
        완료: { backgroundColor: '#E8F5E9', color: '#388E3C' }, // 녹색
        취소: { backgroundColor: '#FFEBEE', color: '#D32F2F' }, // 빨간색
        홀딩: { backgroundColor: '#FFEBEE', color: '#D32F2F' } // 빨간색
      };
      return colors[status as keyof typeof colors] || { backgroundColor: '#e9ecef', color: '#495057' };
    };

    const getEducationTypeColor = (type: string) => {
      const colors = {
        온라인: { backgroundColor: '#e8f5e8', color: '#2e7d2e' },
        오프라인: { backgroundColor: '#e3f2fd', color: '#1565c0' },
        혼합: { backgroundColor: '#fff3e0', color: '#ef6c00' },
        세미나: { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
        워크샵: { backgroundColor: '#e0f2f1', color: '#004d40' }
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
            value={educationName}
            onChange={(e) => {
              setEducationName(e.target.value);
              onFieldChange('educationName', e.target.value);
            }}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          {/* 교육 설명 - 전체 너비 */}
          <TextField
            fullWidth
            label="교육 설명"
            multiline
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onFieldChange('description', e.target.value);
            }}
            variant="outlined"
            placeholder="교육 내용, 목표, 대상 등을 상세히 입력해주세요."
            InputLabelProps={{ shrink: true }}
            inputRef={descriptionRef}
          />

          {/* 교육유형 - 참석수 - 장소 */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel shrink>
                  <span>
                    교육유형 <span style={{ color: 'red' }}>*</span>
                  </span>
                </InputLabel>
                <Select
                  value={educationState.educationType}
                  onChange={handleFieldChange('educationType')}
                  label=" "
                  displayEmpty
                  onOpen={() => {
                    console.log('🔍 [교육유형 Select] 열림');
                    console.log('🔍 현재 value:', educationState.educationType);
                    console.log('🔍 educationTypes 개수:', educationTypes?.length);
                    console.log('🔍 educationTypes:', educationTypes);
                  }}
                >
                  <MenuItem value="">선택</MenuItem>
                  {educationTypes && educationTypes.length > 0
                    ? educationTypes.map((type) => (
                        <MenuItem key={type.subcode} value={type.subcode_name}>
                          {type.subcode_name}
                        </MenuItem>
                      ))
                    : educationTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              sx={{ flex: 1 }}
              label="참석수 (참석자탭에서 자동 계산)"
              type="number"
              value={educationState.participantCount}
              variant="outlined"
              disabled
              InputProps={{
                endAdornment: (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    명
                  </Typography>
                )
              }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              ref={locationRef}
              sx={{ flex: 1 }}
              label={
                <span>
                  장소 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                onFieldChange('location', e.target.value);
              }}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 실행일 - 상태 */}
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

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={educationState.status}
                onChange={handleFieldChange('status')}
                label="상태"
                onOpen={() => {
                  console.log('🔍 [상태 Select] 열림');
                  console.log('🔍 현재 value:', educationState.status);
                  console.log('🔍 statusTypes 개수:', statusTypes?.length);
                  console.log('🔍 statusTypes:', statusTypes);
                }}
              >
                {statusTypes && statusTypes.length > 0
                  ? statusTypes.map((type) => (
                      <MenuItem key={type.subcode} value={type.subcode_name}>
                        <Chip
                          label={type.subcode_name}
                          size="small"
                          sx={{
                            ...getStatusColor(type.subcode_name),
                            fontSize: '13px',
                            fontWeight: 400,
                            height: 24
                          }}
                        />
                      </MenuItem>
                    ))
                  : securityEducationStatusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            ...getStatusColor(status),
                            fontSize: '13px',
                            fontWeight: 400,
                            height: 24
                          }}
                        />
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          </Stack>

          {/* 팀 - 담당자 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment: educationState.team ? (
                  <Typography variant="body1" sx={{ ml: -0.5 }}>
                    {educationState.team}
                  </Typography>
                ) : (
                  <Typography variant="body1" sx={{ color: 'text.disabled', ml: -0.5 }}>
                    팀 미지정
                  </Typography>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5',
                  paddingTop: '12px',
                  paddingBottom: '12px'
                },
                '& .MuiInputBase-input': { display: 'none' }
              }}
            />

            <TextField
              fullWidth
              label={
                <span>
                  담당자 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment:
                  educationState.assignee && assigneeList ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -0.5 }}>
                      <Avatar
                        src={
                          assigneeList.find((u) => u.user_name === educationState.assignee)?.profile_image_url ||
                          assigneeList.find((u) => u.user_name === educationState.assignee)?.avatar_url ||
                          '/assets/images/users/avatar-1.png'
                        }
                        alt={educationState.assignee}
                        sx={{ width: 24, height: 24 }}
                      >
                        {educationState.assignee?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1">{educationState.assignee}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.disabled', ml: -0.5 }}>
                      담당자 미지정
                    </Typography>
                  )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5',
                  paddingTop: '12px',
                  paddingBottom: '12px'
                },
                '& .MuiInputBase-input': { display: 'none' }
              }}
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
                  color: 'rgba(0, 0, 0, 0.7)'
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

// 참석자 탭 Props 타입
interface ParticipantsTabProps {
  mode: 'add' | 'edit';
  educationId?: number;
  onParticipantCountChange?: (count: number) => void;
  attendanceTypes: any[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  // 커리큘럼탭과 동일한 패턴: 부모 state
  participantItems: SecurityAttendeeItem[];
  setParticipantItems: React.Dispatch<React.SetStateAction<SecurityAttendeeItem[]>>;
  selectedRows: number[];
  setSelectedRows: React.Dispatch<React.SetStateAction<number[]>>;
}

// 참석자 탭 컴포넌트
const ParticipantsTab = memo(
  ({
    mode,
    educationId,
    onParticipantCountChange,
    attendanceTypes,
    canCreateData = true,
    canEditOwn = true,
    canEditOthers = true,
    // 부모로부터 받은 state
    participantItems,
    setParticipantItems,
    selectedRows,
    setSelectedRows
  }: ParticipantsTabProps) => {
    // Supabase 참석자 관리 훅
    const { fetchAttendeesByEducationId, addMultipleAttendees, updateAttendee, deleteAttendee } = useSupabaseSecurityAttendee();

    // ID 생성기 훅 (data_relation.md 패턴 준수)
    const { generateNextId } = useIdGenerator();

    const [statusFromDB, setStatusFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // GROUP045 출석점검 데이터 조회 (Dialog가 열릴 때마다)
    useEffect(() => {
      const fetchStatusData = async () => {
        try {
          const { data: group045Data } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name, subcode_order')
            .eq('codetype', 'subcode')
            .eq('group_code', 'GROUP045')
            .eq('is_active', true)
            .order('subcode_order', { ascending: true });

          if (group045Data) {
            setStatusFromDB(group045Data);
            console.log('✅ [ParticipantsTab] GROUP045 출석점검 DB 조회 완료:', group045Data.length, '개');
          }
        } catch (error) {
          console.error('❌ [ParticipantsTab] GROUP045 조회 실패:', error);
        }
      };

      fetchStatusData();
    }, []);

    // 출석점검 색상 정의 (동적)
    const getAttendanceColor = useCallback(
      (status: string) => {
        // subcode 또는 subcode_name으로 조회
        const statusItem = statusFromDB.find((s) => s.subcode === status || s.subcode_name === status);
        const statusName = statusItem ? statusItem.subcode_name : status;

        switch (statusName) {
          case '예정':
          case '대기':
            return { backgroundColor: '#F5F5F5', color: '#757575' };
          case '참석':
          case '출석':
            return { backgroundColor: '#E3F2FD', color: '#1976D2' };
          case '불참':
          case '결석':
          case '미참석':
            return { backgroundColor: '#fff8e1', color: '#f57c00' };
          case '취소':
            return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
          default:
            return { backgroundColor: '#F5F5F5', color: '#757575' };
        }
      },
      [statusFromDB]
    );

    // 커리큘럼탭과 동일한 패턴: ref로 최신 상태 추적
    const participantItemsRef = useRef<SecurityAttendeeItem[]>([]);

    // 참석자 데이터 변환 함수 (DB ↔ UI)
    const convertDbToUi = useCallback((dbItem: SecurityAttendeeItem) => {
      return {
        id: dbItem.id.toString(),
        no: dbItem.id,
        participant: dbItem.user_name,
        position: dbItem.position || '',
        department: dbItem.department || '',
        attendanceCheck: dbItem.attendance_status || '예정',
        opinion: dbItem.notes || '',
        notes: dbItem.notes || ''
      };
    }, []);

    const convertUiToDb = useCallback((uiItem: any, educationId: number) => {
      return {
        education_id: educationId,
        user_name: uiItem.participant || '',
        position: uiItem.position || '',
        department: uiItem.department || '',
        attendance_status: uiItem.attendanceCheck || '예정',
        notes: uiItem.opinion || uiItem.notes || '',
        is_active: true
      };
    }, []);

    // curriculumItems가 변경될 때마다 ref도 업데이트 (커리큘럼탭과 동일한 패턴)
    useEffect(() => {
      participantItemsRef.current = participantItems;
    }, [participantItems]);

    // 커리큘럼 데이터를 외부에 노출하는 함수 (커리큘럼탭과 동일한 패턴)
    useEffect(() => {
      // window 객체에 참석자 데이터 접근 함수 등록
      (window as any).getCurrentParticipantData = () => {
        // ref를 통해 항상 최신 상태를 가져옴
        const currentData = participantItemsRef.current;
        console.log('👥 저장 시점 - 현재 참석자 데이터 수집:', currentData.length, '개 항목');
        return currentData || [];
      };

      return () => {
        // cleanup
        if ((window as any).getCurrentParticipantData) {
          delete (window as any).getCurrentParticipantData;
        }
      };
    }, []);

    // 로컬 편집 함수 (커리큘럼탭과 동일한 패턴)
    const handleLocalEditItem = useCallback(
      (id: number, field: string, value: string) => {
        setParticipantItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
      },
      [setParticipantItems]
    );

    // 참석자 수 변경 시 콜백 호출
    useEffect(() => {
      if (onParticipantCountChange) {
        onParticipantCountChange(participantItems.length);
      }
    }, [participantItems.length, onParticipantCountChange]);

    // selectedRows는 props로 받음 (커리큘럼탭과 동일한 패턴)
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);

    // 페이지네이션 계산
    const totalPages = Math.ceil(participantItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = participantItems.slice(startIndex, endIndex);

    // 페이지 변경 핸들러
    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
    };

    const handleCellClick = (id: number, field: string) => {
      setEditingCell({ id, field });
    };

    // 셀 편집 완료 시 호출 (커리큘럼탭과 동일한 패턴 - DB 저장 없음)
    const handleCellBlur = () => {
      setEditingCell(null);
    };

    // 새 참석자 추가 (커리큘럼탭과 동일한 패턴)
    const handleAddItem = useCallback(() => {
      const newId = generateNextId(); // PostgreSQL 정수 범위 내 순차 ID 생성
      console.log('🆔 새 참석자 ID 생성:', newId);

      // 기본 출석점검 값을 DB에서 조회한 첫 번째 값으로 설정
      const defaultStatus = statusFromDB.length > 0 ? statusFromDB[0].subcode : '예정';

      const newItem: SecurityAttendeeItem = {
        id: newId,
        education_id: educationId || 999999, // add 모드에서는 임시 ID, 저장 시 실제 education_id로 교체
        user_name: '',
        position: '',
        department: '',
        attendance_status: defaultStatus,
        notes: '',
        is_active: true
      };

      setParticipantItems((prev) => [newItem, ...prev]);
    }, [educationId, generateNextId, statusFromDB, setParticipantItems]);

    // 선택된 참석자 삭제 (커리큘럼탭과 동일한 패턴)
    const handleDeleteSelected = useCallback(() => {
      // 커리큘럼탭처럼 로컬 상태에서만 제거 (DB는 저장 시 처리)
      console.log('🗑️ [삭제] selectedRows:', selectedRows);

      setParticipantItems((prev) => {
        const filtered = prev.filter((item) => !selectedRows.includes(item.id));
        console.log('🗑️ [삭제] 필터링 후 개수:', filtered.length);
        return filtered;
      });

      setSelectedRows([]);
    }, [selectedRows, setParticipantItems, setSelectedRows]);

    const handleSelectRow = (id: number) => {
      if (selectedRows.includes(id)) {
        setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      } else {
        setSelectedRows([...selectedRows, id]);
      }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        setSelectedRows(participantItems.map((item) => item.id));
      } else {
        setSelectedRows([]);
      }
    };

    // 컬럼 너비 정의 (참석자 탭용)
    const columnWidths = {
      checkbox: 50,
      no: 60,
      participant: 120,
      position: 100,
      department: 120,
      attendanceCheck: 100,
      notes: 200
    };

    // 편집 가능한 셀 렌더링
    const renderEditableCell = (item: SecurityAttendeeItem, field: string, value: string | number) => {
      const isEditing = editingCell?.id === item.id && editingCell?.field === field;
      const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

      if (isEditing) {
        if (field === 'attendance_status') {
          return (
            <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    width: '100%'
                  },
                  '& .MuiSelect-select': {
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center'
                  }
                }}
              >
                <Select
                  value={value || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    // subcode_name을 subcode로 변환하여 저장
                    const selectedName = e.target.value;
                    const selectedItem = statusFromDB.find((s) => s.subcode_name === selectedName);
                    const subcodeValue = selectedItem ? selectedItem.subcode : selectedName;

                    // 로컬 상태만 업데이트 (DB는 저장 버튼 클릭 시 저장)
                    handleLocalEditItem(item.id, field, subcodeValue);
                  }}
                  onBlur={handleCellBlur}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  renderValue={(selected) => {
                    // subcode를 subcode_name으로 변환하여 표시
                    const statusItem = statusFromDB.find((s) => s.subcode === selected);
                    const statusName = statusItem ? statusItem.subcode_name : selected;
                    return (
                      <Chip
                        label={statusName}
                        size="small"
                        sx={{
                          ...getAttendanceColor(selected as string),
                          fontSize: '12px',
                          height: 20
                        }}
                      />
                    );
                  }}
                >
                  {statusFromDB.map((status) => (
                    <MenuItem key={status.subcode} value={status.subcode_name}>
                      <Chip
                        label={status.subcode_name}
                        size="small"
                        sx={{
                          ...getAttendanceColor(status.subcode_name),
                          fontSize: '12px',
                          height: 20
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          );
        }

        if (field === 'notes') {
          return (
            <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
              <TextField
                type="text"
                value={value || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  handleLocalEditItem(item.id, field, e.target.value);
                }}
                onBlur={handleCellBlur}
                onClick={(e) => e.stopPropagation()}
                size="small"
                multiline
                rows={2}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%',
                    width: '100%'
                  },
                  '& .MuiInputBase-input': {
                    padding: '8px 12px',
                    height: 'calc(100% - 16px)',
                    boxSizing: 'border-box'
                  },
                  '& .MuiInputBase-multiline': {
                    padding: '8px 12px',
                    height: '100%'
                  }
                }}
                autoFocus
              />
            </Box>
          );
        }

        return (
          <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
            <TextField
              type="text"
              value={value || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleLocalEditItem(item.id, field, e.target.value);
              }}
              onBlur={handleCellBlur}
              onClick={(e) => e.stopPropagation()}
              size="small"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                '& .MuiInputBase-root': {
                  height: '100%',
                  width: '100%'
                },
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                  height: 'calc(100% - 16px)',
                  boxSizing: 'border-box'
                }
              }}
              autoFocus
            />
          </Box>
        );
      }

      // 읽기 모드
      return (
        <Box
          sx={{
            width: '100%',
            minWidth: fieldWidth,
            padding: '8px 12px',
            cursor: 'text',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          {field === 'attendance_status' ? (
            <Chip
              label={(() => {
                // subcode를 subcode_name으로 변환하여 표시
                const statusItem = statusFromDB.find((s) => s.subcode === value);
                return statusItem ? statusItem.subcode_name : value || '-';
              })()}
              size="small"
              sx={{
                ...getAttendanceColor(value as string),
                fontSize: '12px',
                height: 20
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                whiteSpace: field === 'notes' ? 'pre-wrap' : 'nowrap',
                wordBreak: field === 'notes' ? 'break-word' : 'normal',
                lineHeight: field === 'notes' ? 1.4 : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: field === 'notes' ? '-webkit-box' : 'block',
                WebkitLineClamp: field === 'notes' ? 2 : undefined,
                WebkitBoxOrient: field === 'notes' ? 'vertical' : undefined
              }}
            >
              {value || '-'}
            </Typography>
          )}
        </Box>
      );
    };

    return (
      <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            참석자 관리
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteSelected}
              disabled={selectedRows.length === 0 || !(canEditOwn || canEditOthers)}
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
              disabled={mode === 'add' ? !canCreateData : !(canEditOwn || canEditOthers)}
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
            maxHeight: '500px',
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
                    checked={selectedRows.length === participantItems.length && participantItems.length > 0}
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
                <TableCell sx={{ width: columnWidths.participant, fontWeight: 600 }}>참석자</TableCell>
                <TableCell sx={{ width: columnWidths.position, fontWeight: 600 }}>직책</TableCell>
                <TableCell sx={{ width: columnWidths.department, fontWeight: 600 }}>부서</TableCell>
                <TableCell sx={{ width: columnWidths.attendanceCheck, fontWeight: 600 }}>출석점검</TableCell>
                <TableCell sx={{ width: columnWidths.notes, fontWeight: 600 }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow
                  key={`participant-${item.id}`}
                  hover
                  sx={{
                    minHeight: 48,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell sx={{ width: columnWidths.checkbox, padding: 0, height: 48 }}>
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
                  <TableCell sx={{ width: columnWidths.no, padding: 0, height: 48 }}>
                    <Box sx={{ height: 48, display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                      {participantItems.length - startIndex - index}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.participant, padding: 0, height: 48 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(item.id, 'user_name');
                    }}
                  >
                    {renderEditableCell(item, 'user_name', item.user_name)}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.position, padding: 0, height: 48 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(item.id, 'position');
                    }}
                  >
                    {renderEditableCell(item, 'position', item.position || '')}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.department, padding: 0, height: 48 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(item.id, 'department');
                    }}
                  >
                    {renderEditableCell(item, 'department', item.department || '')}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.attendanceCheck, padding: 0, height: 48 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(item.id, 'attendance_status');
                    }}
                  >
                    {renderEditableCell(item, 'attendance_status', item.attendance_status || '예정')}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.notes, padding: 0, height: 48 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(item.id, 'notes');
                    }}
                  >
                    {renderEditableCell(item, 'notes', item.notes || '')}
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
            px: 4,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'absolute',
            bottom: '0px',
            left: '24px',
            right: '24px'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {participantItems.length > 0
              ? `${startIndex + 1}-${Math.min(endIndex, participantItems.length)} of ${participantItems.length}`
              : '0-0 of 0'}
          </Typography>
          {participantItems.length > 0 && (
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
  }
);

// 커리큘럼 탭 컴포넌트 props interface
interface CurriculumTabProps {
  mode: 'add' | 'edit';
  educationId?: number;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  // 비용관리 금액탭 패턴: 부모에서 state 관리
  curriculumItems: SecurityCurriculumItem[];
  setCurriculumItems: React.Dispatch<React.SetStateAction<SecurityCurriculumItem[]>>;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
}

// 커리큘럼 탭 컴포넌트 - 비용관리 금액탭 패턴
const CurriculumTab = memo(({
  mode,
  educationId,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  // 부모로부터 받은 state
  curriculumItems,
  setCurriculumItems,
  selectedRows,
  setSelectedRows
}: CurriculumTabProps) => {
  console.log('🔵 CurriculumTab 렌더링:', { mode, educationId, curriculumItemsLength: curriculumItems.length });

  const curriculumItemsRef = useRef<SecurityCurriculumItem[]>([]);

  // curriculumItems가 변경될 때마다 ref도 업데이트
  useEffect(() => {
    curriculumItemsRef.current = curriculumItems;
  }, [curriculumItems]);

  // 커리큘럼 데이터를 외부에 노출하는 함수 (data_relation.md 패턴 준수)
  useEffect(() => {
    // window 객체에 커리큘럼 데이터 접근 함수 등록 (모든 모드에서)
    (window as any).getCurrentCurriculumData = () => {
      // ref를 통해 항상 최신 상태를 가져옴
      const currentData = curriculumItemsRef.current;
      console.log('📦 저장 시점 - 현재 커리큘럼 데이터 수집:', currentData.length, '개 항목');
      console.log('📦 실제 curriculumItems 내용:', JSON.stringify(currentData, null, 2));

      if (currentData && currentData.length > 0) {
        currentData.forEach((item, index) => {
          console.log(`📦 항목 ${index + 1} 세부내용:`, {
            id: item.id,
            session_title: item.session_title,
            session_description: item.session_description,
            duration_minutes: item.duration_minutes,
            instructor: item.instructor,
            session_type: item.session_type,
            materials: item.materials,
            objectives: item.objectives
          });
        });
      } else {
        console.log('⚠️ 커리큘럼 데이터가 비어있거나 없습니다');
      }

      return currentData || [];
    };

    return () => {
      // cleanup
      if ((window as any).getCurrentCurriculumData) {
        delete (window as any).getCurrentCurriculumData;
      }
    };
  }, []); // 의존성 배열을 빈 배열로 변경 (data_relation.md 패턴)

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // 페이지네이션 계산
  // session_order로 정렬 (오름차순 - 낮은 숫자가 위로)
  const sortedCurriculumItems = [...curriculumItems].sort((a, b) => a.session_order - b.session_order);

  const totalPages = Math.ceil(sortedCurriculumItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedCurriculumItems.slice(startIndex, endIndex);

  console.log('🎨 렌더링:', {
    curriculumItemsLength: curriculumItems.length,
    sortedLength: sortedCurriculumItems.length,
    currentItemsLength: currentItems.length,
    currentPage,
    totalPages
  });

  // 페이지 변경 핸들러 (MUI Pagination 형식에 맞게 수정)
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };


  const handleAddItem = () => {
    // 비용관리 금액탭 패턴: 로컬 state에만 추가
    const newItem: SecurityCurriculumItem = {
      id: Date.now(),
      education_id: educationId || 0,
      session_order: 1, // 신규 행은 항상 1번으로 설정 (헤더 바로 아래)
      session_title: '',
      session_description: '',
      duration_minutes: 0,
      instructor: '',
      session_type: '강의',
      materials: '',
      objectives: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user',
      updated_by: 'user'
    };

    // 기존 항목들의 session_order를 +1 증가시켜서 새 항목이 맨 위로 오도록 함
    setCurriculumItems((prev) => [
      newItem,
      ...prev.map((item) => ({
        ...item,
        session_order: item.session_order + 1
      }))
    ]);
  };

  const handleDeleteSelected = () => {
    // 비용관리 금액탭 패턴: 로컬 state에서만 제거
    console.log('🗑️ [삭제] selectedRows:', selectedRows);
    console.log('🗑️ [삭제] curriculumItems 개수:', curriculumItems.length);

    setCurriculumItems((prev) => {
      const filtered = prev.filter((item) => {
        const itemIdStr = item.id.toString();
        const shouldKeep = !selectedRows.includes(itemIdStr);
        console.log(`🗑️ [삭제] item.id: ${itemIdStr}, 유지: ${shouldKeep}`);
        return shouldKeep;
      });
      console.log('🗑️ [삭제] 필터링 후 개수:', filtered.length);
      return filtered;
    });
    setSelectedRows([]);
  };

  // 로컬 상태만 변경하는 함수 (체크리스트 방식)
  const handleLocalEditItem = (id: string, field: string, value: string | number) => {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.error('유효하지 않은 ID:', id);
      return;
    }

    // 필드명을 DB 스키마에 맞게 매핑
    const fieldMapping: { [key: string]: string } = {
      title: 'session_title',
      content: 'session_description',
      instructor: 'instructor',
      time: 'duration_minutes',
      educationDate: 'session_order',
      notes: 'objectives'
    };

    const dbField = fieldMapping[field] || field;
    let processedValue = value;

    // 시간 형식 처리 (숫자만 허용)
    if (field === 'time' && typeof value === 'string') {
      // 숫자만 추출
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
      if (!isNaN(numericValue) && numericValue >= 0) {
        processedValue = numericValue;
      } else {
        processedValue = 0; // 유효하지 않은 입력의 경우 0
      }
    }

    // 비용관리 금액탭 패턴: 로컬 state만 업데이트
    setCurriculumItems((prev) =>
      prev.map((item) => (item.id === numericId ? { ...item, [dbField]: processedValue } : item))
    );
    console.log('📝 ref 업데이트 확인:', curriculumItemsRef.current.length);
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
      setSelectedRows(curriculumItems.map((item) => item.id.toString()));
    } else {
      setSelectedRows([]);
    }
  };

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 470,
    no: 30,
    educationDate: 100,
    time: 80,
    instructor: 100,
    title: 100,
    content: 170,
    notes: 101
  };

  const cellHeight = 48; // 고정 셀 높이 (줄임)

  // 편집 가능한 셀 렌더링 (비용관리 금액 탭 방식)
  const renderEditableCell = (item: SecurityCurriculumItem, field: string, value: string | number, canEdit: boolean) => {
    // 교육일자 필드
    if (field === 'educationDate') {
      return (
        <TextField
          type="date"
          value={value || ''}
          onChange={(e) => handleLocalEditItem(item.id.toString(), field, e.target.value)}
          disabled={!canEdit}
          variant="standard"
          size="small"
          InputProps={{
            disableUnderline: true
          }}
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              padding: '8px 4px',
              fontSize: '12px',
              border: 'none',
              outline: 'none'
            },
            '&:hover': !canEdit ? {} : {
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }
          }}
        />
      );
    }

    // 시간 필드
    if (field === 'time') {
      return (
        <TextField
          type="number"
          value={typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value || ''}
          onChange={(e) => handleLocalEditItem(item.id.toString(), field, e.target.value)}
          disabled={!canEdit}
          variant="standard"
          size="small"
          placeholder="분"
          InputProps={{
            disableUnderline: true
          }}
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              padding: '8px 4px',
              fontSize: '12px',
              border: 'none',
              outline: 'none'
            },
            '&:hover': !canEdit ? {} : {
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }
          }}
        />
      );
    }

    // 나머지 텍스트 필드 (강사, 제목, 교육내용, 비고)
    return (
      <TextField
        value={value || ''}
        onChange={(e) => handleLocalEditItem(item.id.toString(), field, e.target.value)}
        disabled={!canEdit}
        variant="standard"
        size="small"
        multiline={field === 'content' || field === 'notes'}
        rows={field === 'content' || field === 'notes' ? 2 : 1}
        InputProps={{
          disableUnderline: true
        }}
        sx={{
          width: '100%',
          '& .MuiInputBase-input': {
            padding: '8px 4px',
            fontSize: '12px',
            border: 'none',
            outline: 'none'
          },
          '& .MuiInputBase-inputMultiline': {
            padding: '8px 4px'
          },
          '&:hover': !canEdit ? {} : {
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ height: '740px', display: 'flex', flexDirection: 'column', pt: 3, px: 3, pb: 0, mb: '-18px', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">커리큘럼 관리</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            disabled={mode === 'add' ? !canCreateData : !(canEditOwn || canEditOthers)}
            onClick={handleAddItem}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            추가
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            disabled={selectedRows.length === 0 || !(canEditOwn || canEditOthers)}
            onClick={handleDeleteSelected}
            sx={{
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            삭제
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          mb: 0,
          boxShadow: 'none',
          border: '1px solid #f0f0f0',
          borderRadius: 2,
          maxHeight: '650px',
          overflowY: 'auto',
          overflowX: 'auto'
        }}
      >
        <Table
          size="small"
          sx={{
            width: '100%',
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              border: 'none',
              padding: '12px 8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
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
            <TableRow sx={{ '& .MuiTableCell-root': { py: 1.5 } }}>
              <TableCell
                padding="checkbox"
                sx={{
                  width: columnWidths.checkbox,
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  '& .MuiCheckbox-root': {
                    display: 'block',
                    margin: '0 auto'
                  }
                }}
              >
                <Checkbox
                  indeterminate={selectedRows.length > 0 && selectedRows.length < curriculumItems.length}
                  checked={curriculumItems.length > 0 && selectedRows.length === curriculumItems.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(curriculumItems.map((item) => item.id.toString()));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                  disabled={!(canEditOwn || canEditOthers)}
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
              <TableCell sx={{ width: columnWidths.no }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.educationDate }}>교육일자</TableCell>
              <TableCell sx={{ width: columnWidths.time }}>시간</TableCell>
              <TableCell sx={{ width: columnWidths.instructor }}>강사</TableCell>
              <TableCell sx={{ width: columnWidths.title }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.content }}>교육내용</TableCell>
              <TableCell sx={{ width: columnWidths.notes }}>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  추가 버튼을 눌러 커리큘럼 항목을 추가해보세요.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((item, index) => (
                <TableRow
                  key={`curriculum-${item.id}`}
                  hover
                  sx={{ '& .MuiTableCell-root': { py: 1.5 } }}
                >
                  <TableCell
                    padding="checkbox"
                    sx={{
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      '& .MuiCheckbox-root': {
                        display: 'block',
                        margin: '0 auto'
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedRows.includes(item.id.toString())}
                      onChange={() => {
                        setSelectedRows((prev) =>
                          prev.includes(item.id.toString()) ? prev.filter((id) => id !== item.id.toString()) : [...prev, item.id.toString()]
                        );
                      }}
                      disabled={!(canEditOwn || canEditOthers)}
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
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', fontWeight: 500 }}>
                      {curriculumItems.length - startIndex - index}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(item, 'educationDate', item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0], canEditOwn || canEditOthers)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(item, 'time', item.duration_minutes || '', canEditOwn || canEditOthers)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(item, 'instructor', item.instructor || '', canEditOwn || canEditOthers)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(item, 'title', item.session_title || '', canEditOwn || canEditOthers)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(item, 'content', item.session_description || '', canEditOwn || canEditOthers)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(item, 'notes', item.objectives || '', canEditOwn || canEditOthers)}
                  </TableCell>
                </TableRow>
              ))
            )}
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
          pt: 0.5,
          pb: 0.5,
          mb: 0,
          px: 4,
          height: '36px',
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          position: 'absolute',
          bottom: '0px',
          left: '24px',
          right: '24px'
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
          {sortedCurriculumItems.length > 0
            ? `${startIndex + 1}-${Math.min(endIndex, sortedCurriculumItems.length)} of ${sortedCurriculumItems.length}`
            : '0-0 of 0'}
        </Typography>
        {sortedCurriculumItems.length > 0 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
            sx={{
              m: 0,
              p: 0,
              height: '20px',
              '& .MuiPagination-ul': {
                m: 0,
                p: 0
              },
              '& .MuiPaginationItem-root': {
                fontSize: '0.75rem',
                minWidth: '28px',
                height: '28px',
                borderRadius: '4px',
                m: 0,
                p: 0
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
            교육 완료 후 성과와 개선사항을 종합하여 보고서를 작성하세요.
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
              onChange={(e) => {
                console.log('🔥 성과 입력 감지:', e.target.value);
                onEducationReportChange('achievements', e.target.value);
              }}
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
              onChange={(e) => {
                console.log('🔥 개선사항 입력 감지:', e.target.value);
                onEducationReportChange('improvements', e.target.value);
              }}
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
              onChange={(e) => {
                console.log('🔥 교육소감 입력 감지:', e.target.value);
                onEducationReportChange('feedback', e.target.value);
              }}
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
        </Box>
      </Box>
    );
  }
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

// 자료 탭 컴포넌트
interface Material {
  id: number;
  name: string;
  type: string;
  size: string;
  file?: File;
  uploadDate: string;
}

interface MaterialTabProps {
  recordId?: number | string;
  currentUser?: UserProfile | null;
  onFileChange?: (action: string, fileName: string, fileData?: any) => void;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

const MaterialTab = memo(({ recordId, currentUser, onFileChange, canEditOwn = true, canEditOthers = true }: MaterialTabProps) => {
  // 파일 관리 훅
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.SECURITY_EDUCATION, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = event.target.files;
      if (!uploadedFiles || uploadedFiles.length === 0) return;

      // recordId가 없으면 업로드 불가
      if (!recordId) {
        setValidationError('파일을 업로드하려면 먼저 교육을 저장해주세요.');
        return;
      }

      // 각 파일을 순차적으로 업로드
      for (const file of Array.from(uploadedFiles)) {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.SECURITY_EDUCATION,
          record_id: String(recordId),
          // user_id는 UUID 타입이므로 숫자형 ID는 전달하지 않음
          user_id: undefined,
          user_name: currentUser?.name || '알 수 없음',
          team: currentUser?.department
        });

        if (!result.success) {
          setValidationError(`파일 업로드 실패: ${result.error}`);
        } else {
          // 파일 업로드 성공 시 로깅
          onFileChange?.('FILE_UPLOAD', file.name, { fileType: file.type, fileSize: file.size });
        }
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [recordId, uploadFile, currentUser, onFileChange]
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

  const handleEditMaterial = useCallback((materialId: string, currentName: string) => {
    setEditingMaterialId(materialId);
    setEditingMaterialText(currentName);
  }, []);

  const handleSaveEditMaterial = useCallback(async () => {
    if (editingMaterialId && editingMaterialText.trim()) {
      // 기존 파일명 찾기
      const originalFile = files.find((f) => f.id === editingMaterialId);
      const originalFileName = originalFile?.file_name || '';

      const result = await updateFile(editingMaterialId, {
        file_name: editingMaterialText.trim()
      });

      if (result.success) {
        // 파일명 수정 성공 시 로깅
        onFileChange?.('FILE_UPDATE', editingMaterialText.trim(), { oldFileName: originalFileName });
        setEditingMaterialId(null);
        setEditingMaterialText('');
      } else {
        setValidationError(`파일명 수정 실패: ${result.error}`);
      }
    }
  }, [editingMaterialId, editingMaterialText, updateFile, files, onFileChange]);

  const handleCancelEditMaterial = useCallback(() => {
    setEditingMaterialId(null);
    setEditingMaterialText('');
  }, []);

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      if (!confirm('파일을 삭제하시겠습니까?')) return;

      // 삭제할 파일 정보 찾기
      const fileToDelete = files.find((f) => f.id === materialId);
      const fileName = fileToDelete?.file_name || '';

      const result = await deleteFile(materialId);
      if (!result.success) {
        setValidationError(`파일 삭제 실패: ${result.error}`);
      } else {
        // 파일 삭제 성공 시 로깅
        onFileChange?.('FILE_DELETE', fileName);
      }
    },
    [deleteFile, files, onFileChange]
  );

  const handleDownloadMaterial = useCallback((fileData: FileData) => {
    // file_url로 다운로드
    const link = document.createElement('a');
    link.href = fileData.file_url;
    link.download = fileData.file_name;
    link.target = '_blank';
    link.click();
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
            borderColor: (canEditOwn || canEditOthers) ? 'primary.main' : 'grey.300',
            backgroundColor: (canEditOwn || canEditOthers) ? 'primary.50' : 'grey.100',
            cursor: (canEditOwn || canEditOthers) ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease-in-out',
            '&:hover': (canEditOwn || canEditOthers) ? {
              borderColor: 'primary.dark',
              backgroundColor: 'primary.100'
            } : {}
          }}
          onClick={(canEditOwn || canEditOthers) ? handleUploadClick : undefined}
        >
          <Stack spacing={2} alignItems="center">
            <Typography fontSize="48px">📁</Typography>
            <Typography variant="h6" color="primary.main">
              파일을 업로드하세요
            </Typography>
            <Typography variant="body2" color="text.secondary">
              클릭하거나 파일을 여기로 드래그하세요
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Typography>📤</Typography>}
              disabled={!(canEditOwn || canEditOthers)}
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
        {filesLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>파일 목록을 불러오는 중...</Typography>
          </Box>
        )}
        <Stack spacing={2}>
          {files.map((fileData) => (
            <Paper
              key={`material-${fileData.id}`}
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
                  <Typography fontSize="24px">{getFileIcon(fileData.file_type || '')}</Typography>
                </Box>

                {/* 파일 정보 영역 */}
                <Box sx={{ flexGrow: 1 }}>
                  {editingMaterialId === fileData.id ? (
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
                      onClick={() => handleEditMaterial(fileData.id, fileData.file_name)}
                    >
                      {fileData.file_name}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {fileData.file_type} • {fileData.file_size ? formatFileSize(fileData.file_size) : '알 수 없음'}
                    {fileData.created_at && ` • ${new Date(fileData.created_at).toLocaleDateString()}`}
                  </Typography>
                </Box>

                {/* 액션 버튼들 */}
                <Stack direction="row" spacing={1}>
                  {editingMaterialId === fileData.id ? (
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
                        onClick={() => handleDownloadMaterial(fileData)}
                        color="primary"
                        sx={{ p: 0.5 }}
                        title="다운로드"
                      >
                        <Typography fontSize="14px">⬇️</Typography>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditMaterial(fileData.id, fileData.file_name)}
                        color="primary"
                        sx={{
                          p: 0.5,
                          '&.Mui-disabled': {
                            color: 'grey.300'
                          }
                        }}
                        title="수정"
                        disabled={!(canEditOwn || canEditOthers)}
                      >
                        <Typography fontSize="14px">✏️</Typography>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMaterial(fileData.id)}
                        color="error"
                        sx={{
                          p: 0.5,
                          '&.Mui-disabled': {
                            color: 'grey.300'
                          }
                        }}
                        title="삭제"
                        disabled={isDeleting || !(canEditOwn || canEditOthers)}
                      >
                        <Typography fontSize="14px">🗑️</Typography>
                      </IconButton>
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}

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
interface SecurityEducationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SecurityEducationRecord) => void;
  data?: SecurityEducationRecord | null;
  mode: 'add' | 'edit';
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  generateEducationCode?: () => Promise<string>;
  // 커리큘럼 관련 props (비용관리 금액탭 패턴)
  curriculumData?: SecurityCurriculumItem[];
  curriculumLoading?: boolean;
  fetchCurriculum?: () => Promise<void>;
  // 참석자 관련 props (커리큘럼탭과 동일한 패턴)
  attendeeData?: SecurityAttendeeItem[];
  attendeeLoading?: boolean;
  fetchAttendee?: () => Promise<void>;
}

export default function SecurityEducationDialog({
  open,
  onClose,
  onSave,
  data,
  mode,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  generateEducationCode,
  // 커리큘럼 props (비용관리 금액탭 패턴)
  curriculumData,
  curriculumLoading,
  fetchCurriculum,
  // 참석자 props (커리큘럼탭과 동일한 패턴)
  attendeeData,
  attendeeLoading,
  fetchAttendee
}: SecurityEducationDialogProps) {
  const [value, setValue] = useState(0);

  // 현재 로그인 사용자 정보
  const user = useUser();

  // 로그인한 사용자 정보 가져오기 (InspectionEditDialog 패턴)
  const { data: session } = useSession();

  // 마스터코드 훅 (GROUP008 서브코드 가져오기)
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // ✅ 공용 창고에서 사용자 데이터 가져오기 (캐싱된 데이터 사용)
  const { users, masterCodes } = useCommonData();

  console.log('🔍 [SecurityEducationEditDialog] CommonData users 개수:', users?.length);

  // 서브코드명 변환 함수 (상태)
  const getStatusName = React.useCallback((subcode: string) => {
    if (!subcode) return '';
    const found = masterCodes.find(item => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [masterCodes]);

  // 서브코드명 변환 함수 (교육유형)
  const getEducationTypeName = React.useCallback((subcode: string) => {
    if (!subcode) return '';
    const found = masterCodes.find(item => item.codetype === 'subcode' && item.group_code === 'GROUP008' && item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [masterCodes]);

  // 세션 email로 DB에서 사용자 찾기 (InspectionEditDialog 패턴)
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) {
      console.log('⚠️ [SecurityEducationEditDialog] currentUser 찾기 실패:', {
        hasEmail: !!session?.user?.email,
        usersLength: users.length
      });
      return null;
    }
    const found = users.find((u) => u.email === session.user.email);
    console.log('✅ [SecurityEducationEditDialog] currentUser 찾음:', found ? {
      user_name: found.user_name,
      email: found.email,
      profile_image_url: found.profile_image_url
    } : '없음');
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 로직
  const isOwner = React.useMemo(() => {
    if (!data) return true; // 신규 생성인 경우 true

    const currentUserName = currentUser?.user_name;

    // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자로 판단
    const isOwnerResult =
      data.createdBy === currentUserName ||
      data.assignee === currentUserName;

    console.log('🔍 [SecurityEducationEditDialog] 소유자 확인 상세:', {
      data_id: data.id,
      data_createdBy: data.createdBy,
      data_assignee: data.assignee,
      currentUser_email: currentUser?.email,
      currentUser_user_code: currentUser?.user_code,
      currentUser_user_name: currentUserName,
      isOwner: isOwnerResult
    });

    return isOwnerResult;
  }, [data, currentUser]);

  // 편집 가능 여부 결정
  const canEdit = React.useMemo(() => {
    const result = canEditOthers || (canEditOwn && isOwner);
    console.log('🔍 [SecurityEducationEditDialog] 편집 가능 여부:', {
      canEditOthers,
      canEditOwn,
      isOwner,
      canEdit: result
    });
    return result;
  }, [canEditOthers, canEditOwn, isOwner]);

  // 보안교육 훅 (코드 생성용)
  const { securityEducations } = useSupabaseSecurityEducation();

  // ID 생성기 훅
  const { generateNextId } = useIdGenerator();

  // DB에서 직접 가져온 교육유형 및 상태 목록 state
  const [educationTypesFromDB, setEducationTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
  const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

  // Dialog가 열릴 때 DB에서 교육유형(GROUP008)과 상태(GROUP002) 직접 조회
  useEffect(() => {
    if (!open) return;

    const fetchMasterCodeData = async () => {
      try {
        console.log('🔄 [SecurityEducationEditDialog] DB에서 교육유형/상태 직접 조회 시작');

        // GROUP008 교육유형 조회
        const { data: group008Data, error: group008Error } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP008')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group008Error) {
          console.error('❌ GROUP008 조회 오류:', group008Error);
        } else {
          console.log('✅ GROUP008 교육유형:', group008Data);
          setEducationTypesFromDB(group008Data || []);
        }

        // GROUP002 상태 조회
        const { data: group002Data, error: group002Error } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP002')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group002Error) {
          console.error('❌ GROUP002 조회 오류:', group002Error);
        } else {
          console.log('✅ GROUP002 상태:', group002Data);
          setStatusTypesFromDB(group002Data || []);
        }
      } catch (error) {
        console.error('❌ 마스터코드 조회 중 오류:', error);
      }
    };

    fetchMasterCodeData();
  }, [open]);

  // 피드백/기록 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.SECURITY_EDUCATION, data?.id);

  // SWR의 revalidateOnMount: true가 자동으로 데이터를 fetch합니다

  // GROUP008 서브코드 목록 (교육유형용) - DB에서 직접 가져온 데이터 사용
  const educationTypes = educationTypesFromDB;

  // GROUP002 서브코드 목록 (상태용) - DB에서 직접 가져온 데이터 사용
  const statusTypes = statusTypesFromDB;

  // GROUP032 서브코드 목록 (출석점검용)
  const attendanceTypes = useMemo(() => {
    return getSubCodesByGroup('GROUP032');
  }, [getSubCodesByGroup]);

  // 활성 사용자 담당자 목록 생성
  const assigneeList = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === 'active');
    console.log('🔍 [SecurityEducationEditDialog] 활성 담당자 목록:', activeUsers.length, '명');
    console.log('🔍 [SecurityEducationEditDialog] 첫 번째 담당자:', activeUsers[0] ? {
      user_name: activeUsers[0].user_name,
      profile_image_url: activeUsers[0].profile_image_url,
      avatar_url: activeUsers[0].avatar_url
    } : '없음');
    return activeUsers;
  }, [users]);

  // 교육 상태 관리
  const [educationState, dispatch] = useReducer(edsecurityEducationReducer, {
    educationName: '',
    description: '',
    educationType: '',
    assignee: user ? user.name : '',
    executionDate: '',
    location: '',
    status: '', // 초기값 빈 문자열 (useEffect에서 "대기" subcode로 설정됨)
    participantCount: 0,
    registrationDate: '',
    code: ''
  });

  // 사용자이력 상태는 UserHistoryTab 내부에서 관리

  // 교육실적보고 상태 관리
  const [educationReport, setEducationReport] = useState<EducationReport>({
    achievements: '',
    improvements: '',
    feedback: ''
  });

  // 커리큘럼 상태 관리 (비용관리 금액탭 패턴)
  const [curriculumItems, setCurriculumItems] = useState<SecurityCurriculumItem[]>([]);
  const [selectedCurriculumRows, setSelectedCurriculumRows] = useState<string[]>([]);

  // 참석자 상태 관리 (커리큘럼탭과 동일한 패턴)
  const [participantItems, setParticipantItems] = useState<SecurityAttendeeItem[]>([]);
  const [selectedParticipantRows, setSelectedParticipantRows] = useState<number[]>([]);

  // 기록 상태 관리
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  // 임시 저장된 기록들 (저장 버튼 클릭 시 DB에 저장)
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
      isNew: boolean; // 새로 추가된 것인지 표시
    }>
  >([]);
  // 수정된 기록들 추적
  const [modifiedComments, setModifiedComments] = useState<{ [key: string]: string }>({});
  // 삭제된 기록 ID들
  const [deletedCommentIds, setDeletedCommentIds] = useState<string[]>([]);
  // 유효성 검사 에러
  const [validationError, setValidationError] = useState<string>('');

  // 변경로그 관련 state (지연 저장 방식)
  const [pendingChangeLogs, setPendingChangeLogs] = useState<CreateChangeLogInput[]>([]);

  // 초기 데이터 스냅샷 (변경 감지용) - 다이얼로그를 열 때 저장
  const [initialDataSnapshot, setInitialDataSnapshot] = useState<SecurityEducationRecord | null>(null);

  // 다이얼로그를 열 때 초기 데이터 스냅샷 저장
  useEffect(() => {
    if (open && data && mode === 'edit') {
      console.log('📸 초기 데이터 스냅샷 저장:', data);
      setInitialDataSnapshot({ ...data });
    } else if (open && mode === 'add') {
      console.log('📸 신규 모드: 스냅샷 없음');
      setInitialDataSnapshot(null);
    }
  }, [open, data, mode]);

  // 변경로그 Hook
  const { addChangeLog } = useSupabaseChangeLog('security_education', data?.id);

  // Supabase feedbacks를 RecordTab 형식으로 변환하고 pendingComments와 합치기
  const comments = useMemo(() => {
    // 기존 DB의 feedbacks (삭제된 것 제외)
    const existingComments = feedbacks
      .filter((feedback) => !deletedCommentIds.includes(String(feedback.id)))
      .map((feedback) => {
        // user_name으로 사용자 찾기
        const feedbackUser = users.find((u) => u.user_name === feedback.user_name);

        // 수정된 내용이 있으면 사용
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

    // 임시 저장된 새 기록들
    const newComments = pendingComments.map((comment) => ({
      ...comment,
      isNew: true
    }));

    // 합쳐서 반환 (최신 순으로 정렬 - 새 기록이 위로)
    return [...newComments, ...existingComments];
  }, [feedbacks, users, pendingComments, modifiedComments, deletedCommentIds]);

  // 옵션들은 이미 import된 상태
  const statusColors = useMemo(
    () => ({
      계획: { backgroundColor: '#e3f2fd', color: '#1565c0' },
      진행중: { backgroundColor: '#fff3e0', color: '#ef6c00' },
      완료: { backgroundColor: '#e8f5e8', color: '#2e7d2e' },
      취소: { backgroundColor: '#ffebee', color: '#c62828' }
    }),
    []
  );

  // 팀을 로그인한 사용자의 부서로 자동 설정 (InspectionEditDialog 패턴)
  React.useEffect(() => {
    if (currentUser?.department && !educationState.team && !data && mode === 'add') {
      dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
    }
  }, [currentUser, educationState.team, data, mode]);

  // 상태 초기값을 "대기" subcode로 설정 (add 모드일 때만)
  React.useEffect(() => {
    if (open && mode === 'add' && statusTypesFromDB.length > 0 && !educationState.status) {
      // "대기"에 해당하는 subcode 찾기
      const defaultStatus = statusTypesFromDB.find(item => item.subcode_name === '대기');
      if (defaultStatus) {
        console.log('✅ 상태 초기값 설정:', defaultStatus.subcode, '-', defaultStatus.subcode_name);
        dispatch({ type: 'SET_FIELD', field: 'status', value: defaultStatus.subcode });
      }
    }
  }, [open, mode, statusTypesFromDB, educationState.status]);

  // 다이얼로그 열릴 때 상태 초기화
  useEffect(() => {
    const initializeDialog = async () => {
      if (!open) return;

      // 다이얼로그 열릴 때 최신 커리큘럼 데이터 가져오기
      if (fetchCurriculum) {
        console.log('🔄 [다이얼로그 열림] 커리큘럼 데이터 새로고침 시작');
        await fetchCurriculum();
        console.log('✅ [다이얼로그 열림] 커리큘럼 데이터 새로고침 완료');
      }

      // 다이얼로그 열릴 때 최신 참석자 데이터 가져오기 (커리큘럼탭과 동일한 패턴)
      if (fetchAttendee) {
        console.log('🔄 [다이얼로그 열림] 참석자 데이터 새로고침 시작');
        await fetchAttendee();
        console.log('✅ [다이얼로그 열림] 참석자 데이터 새로고침 완료');
      }

      if (mode === 'edit' && data) {
        console.log('🔍 [팝업열림] SET_EDUCATION 실행');
        console.log('🔍 data.educationType:', data.educationType, '(타입:', typeof data.educationType, ')');
        console.log('🔍 data.status:', data.status, '(타입:', typeof data.status, ')');
        console.log('🔍 data 전체:', data);

        // DB에 서브코드명이 저장되어 있으므로 변환 없이 그대로 사용
        dispatch({ type: 'SET_EDUCATION', education: data });
        // 편집 모드에서 기존 교육실적보고 데이터 로드
        // 임시 저장된 데이터 확인
        const tempKey = `education_report_temp_${data.id}`;
        const tempData = sessionStorage.getItem(tempKey);

        if (tempData) {
          console.log(`🔄 임시 저장 데이터 복원: ${tempKey}`);
          const parsedTempData = JSON.parse(tempData);
          setEducationReport(parsedTempData);
        } else {
          console.log(`📋 DB에서 교육실적보고 데이터 로드`);
          console.log(`📋 data 전체:`, data);
          console.log(`📋 achievements:`, data.achievements);
          console.log(`📋 improvement_points:`, data.improvement_points);
          console.log(`📋 feedback:`, data.feedback);

          const loadedReport = {
            achievements: data.achievements || '', // 성과
            improvements: data.improvement_points || '', // improvement_points에서 개선사항 로드
            feedback: data.feedback || '' // 교육소감
          };

          console.log(`📋 설정할 educationReport:`, loadedReport);

          // 개선사항 필드 특별 확인
          console.log(`🔧 편집 모드 개선사항 로드: DB "${data.improvement_points}" → UI "${loadedReport.improvements}"`);

          setEducationReport(loadedReport);
        }

        // 커리큘럼 데이터는 별도 useEffect에서 curriculumData 변경 시 자동 로드됨

        setNewComment('');
      } else {
        // 새 교육 추가 시 자동으로 코드 생성
        const initNewEducation = async () => {
          try {
            let newCode = '';

            // generateEducationCode prop이 있으면 사용, 없으면 API 호출
            if (generateEducationCode) {
              newCode = await generateEducationCode();
              console.log('🔄 [SecurityEducationEditDialog] 자동 생성된 코드:', newCode);
            } else {
              // 기존 API 방식 (하위 호환성)
              const response = await fetch('/api/security-education/next-code');
              const result = await response.json();

              if (response.ok && result.code) {
                newCode = result.code;
              } else {
                console.error('❌ 코드 생성 API 오류:', result);
                newCode = `SEC-EDU-TEMP-${Date.now()}`;
              }
            }

            const newDate = new Date().toISOString().split('T')[0];
            const currentUserName = user ? user.name : assignees[0];
            const currentUserDepartment = user?.department || '';

            dispatch({
              type: 'INIT_NEW_EDUCATION',
              code: newCode,
              registrationDate: newDate,
              assignee: currentUserName,
              team: currentUserDepartment
            });
          } catch (error) {
            console.error('❌ 코드 생성 실패:', error);
            // 실패 시 임시 코드 사용
            const tempCode = `SEC-EDU-TEMP-${Date.now()}`;
            const newDate = new Date().toISOString().split('T')[0];
            const currentUserName = user ? user.name : assignees[0];
            const currentUserDepartment = user?.department || '';
            dispatch({
              type: 'INIT_NEW_EDUCATION',
              code: tempCode,
              registrationDate: newDate,
              assignee: currentUserName,
              team: currentUserDepartment
            });
          }
        };

        initNewEducation();
        setEducationReport({
          achievements: '',
          improvements: '',
          feedback: ''
        });
        setCurriculumItems([]); // add 모드: 빈 배열로 초기화
        setParticipantItems([]); // add 모드: 빈 배열로 초기화
        setNewComment('');
      }
      setValue(0);
    };

    initializeDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, data?.id ?? null]); // data.id를 null로 기본값 설정하여 배열 크기 일정하게 유지

  // curriculumData가 업데이트될 때마다 자동으로 필터링 (fetchCurriculum 완료 후)
  useEffect(() => {
    if (open && mode === 'edit' && data?.id && curriculumData) {
      console.log('🔄 [curriculumData 변경 감지] 데이터 필터링 시작');
      const filteredCurriculum = curriculumData.filter((item) => {
        const itemEducationId = typeof item.education_id === 'string' ? parseInt(item.education_id) : item.education_id;
        const targetEducationId = typeof data.id === 'string' ? parseInt(data.id) : data.id;
        return itemEducationId === targetEducationId;
      });
      console.log('✅ [curriculumData 변경 감지] 필터링 완료:', filteredCurriculum.length, '개');
      setCurriculumItems(filteredCurriculum);
    }
  }, [curriculumData, open, mode, data?.id]);

  // attendeeData가 업데이트될 때마다 자동으로 필터링 (커리큘럼탭과 동일한 패턴)
  useEffect(() => {
    console.log('👥 [attendeeData useEffect] 실행됨', {
      open,
      mode,
      dataId: data?.id,
      attendeeDataLength: attendeeData?.length,
      attendeeData: attendeeData
    });

    if (open && mode === 'edit' && data?.id && attendeeData) {
      console.log('🔄 [attendeeData 변경 감지] 데이터 필터링 시작');
      console.log('👥 전체 attendeeData:', attendeeData);

      const filteredAttendee = attendeeData.filter((item) => {
        const itemEducationId = typeof item.education_id === 'string' ? parseInt(item.education_id) : item.education_id;
        const targetEducationId = typeof data.id === 'string' ? parseInt(data.id) : data.id;
        console.log('👥 필터링 체크:', { itemEducationId, targetEducationId, match: itemEducationId === targetEducationId });
        return itemEducationId === targetEducationId;
      });

      console.log('✅ [attendeeData 변경 감지] 필터링 완료:', filteredAttendee.length, '개');
      console.log('👥 필터링된 참석자:', filteredAttendee);
      setParticipantItems(filteredAttendee);
    }
  }, [attendeeData, open, mode, data?.id]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // 참석자 수 변경 핸들러
  const handleParticipantCountChange = useCallback((count: number) => {
    dispatch({ type: 'SET_FIELD', field: 'participantCount', value: count });
  }, []);

  const handleFieldChange = useCallback((field: keyof SecurityEducationEditState, value: string | number) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // 디바운싱을 위한 타이머 ref
  const reportSaveTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(reportSaveTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // 교육실적보고 변경 핸들러
  const handleEducationReportChange = useCallback(
    (field: keyof EducationReport, value: string) => {
      console.log(`🟡 교육실적보고 임시 저장: field=${field}, value="${value}"`);

      // 개선사항 필드 특별 로그
      if (field === 'improvements') {
        console.log(`🔧 개선사항 필드 업데이트: "${value}"`);
      }

      // 로컬 상태 즉시 업데이트
      const updatedReport = {
        ...educationReport,
        [field]: value
      };
      setEducationReport(updatedReport);

      // 임시 저장 (sessionStorage에 저장)
      if (data?.id) {
        const tempKey = `education_report_temp_${data.id}`;
        sessionStorage.setItem(tempKey, JSON.stringify(updatedReport));
        console.log(`💾 임시 저장 완료: ${tempKey}`);

        // 개선사항 필드 저장 확인
        if (field === 'improvements') {
          console.log(`🔧 개선사항 sessionStorage 저장 확인:`, JSON.parse(sessionStorage.getItem(tempKey) || '{}').improvements);
        }
      }
    },
    [educationReport, data?.id]
  );

  // 변경로그 큐에 추가하는 헬퍼 함수
  const queueChangeLog = useCallback(
    (action: string, beforeValue?: any, afterValue?: any, metadata?: ChangeLogMetadata) => {
      const userName = currentUser?.user_name || user?.name || '알 수 없음';

      const description = generateChangeDescription(action, metadata || {}, userName);

      const logInput: CreateChangeLogInput = {
        page: 'security_education',
        record_id: String(data?.id || ''),
        action_type: action,
        description: description,
        before_value: beforeValue ? safeJsonStringify(beforeValue) : undefined,
        after_value: afterValue ? safeJsonStringify(afterValue) : undefined,
        user_id: currentUser?.id,
        user_name: userName,
        team: currentUser?.department || user?.department,
        user_department: currentUser?.department || user?.department,
        user_position: currentUser?.position,
        user_profile_image: currentUser?.profile_image_url,
        metadata: metadata
      };

      setPendingChangeLogs((prev) => [...prev, logInput]);
      console.log('📝 변경로그 큐에 추가:', logInput);
    },
    [data?.id, currentUser, user]
  );

  // 기록 탭 핸들러들
  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    const currentUserName = currentUser?.user_name || user?.name || '현재 사용자';
    const currentTeam = currentUser?.department || user?.department || '';
    const currentPosition = currentUser?.position || '';
    const currentProfileImage = currentUser?.profile_image_url || '';
    const currentRole = currentUser?.role || '';

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

    setPendingComments((prev) => [tempComment, ...prev]);
    setNewComment('');

    // 변경로그 추가
    queueChangeLog(CHANGE_LOG_ACTIONS.COMMENT_ADD, null, newComment, { changeType: 'create' });
  }, [newComment, currentUser, user, queueChangeLog]);

  const handleEditComment = useCallback((commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  }, []);

  const handleSaveEditComment = useCallback(() => {
    if (!editingCommentText.trim() || !editingCommentId) return;

    // 기존 내용 찾기 (변경로그용)
    let beforeContent = '';
    if (editingCommentId.startsWith('temp_')) {
      const tempComment = pendingComments.find((c) => c.id === editingCommentId);
      beforeContent = tempComment?.content || '';
    } else {
      const existingComment = comments.find((c) => c.id === editingCommentId && !c.isNew);
      beforeContent = existingComment?.content || '';
    }

    // 임시 저장된 기록인지 확인 (ID가 temp_로 시작)
    if (editingCommentId.startsWith('temp_')) {
      // pendingComments에서 직접 수정
      setPendingComments((prev) =>
        prev.map((comment) => (comment.id === editingCommentId ? { ...comment, content: editingCommentText } : comment))
      );
    } else {
      // 기존 DB 데이터는 수정 목록에 추가 (저장 시 DB 업데이트)
      setModifiedComments((prev) => ({
        ...prev,
        [editingCommentId]: editingCommentText
      }));
    }

    // 변경로그 추가
    queueChangeLog(CHANGE_LOG_ACTIONS.COMMENT_UPDATE, beforeContent, editingCommentText, { changeType: 'update' });

    setEditingCommentId(null);
    setEditingCommentText('');
  }, [editingCommentText, editingCommentId, pendingComments, comments, queueChangeLog]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      // 삭제할 내용 찾기 (변경로그용)
      let deletedContent = '';
      if (commentId.startsWith('temp_')) {
        const tempComment = pendingComments.find((c) => c.id === commentId);
        deletedContent = tempComment?.content || '';
      } else {
        const existingComment = comments.find((c) => c.id === commentId && !c.isNew);
        deletedContent = existingComment?.content || '';
      }

      // 임시 저장된 기록인지 확인 (ID가 temp_로 시작)
      if (commentId.startsWith('temp_')) {
        // pendingComments에서 직접 삭제
        setPendingComments((prev) => prev.filter((comment) => comment.id !== commentId));
      } else {
        // 기존 DB 데이터는 삭제 목록에 추가 (저장 시 DB에서 삭제)
        setDeletedCommentIds((prev) => [...prev, commentId]);
      }

      // 변경로그 추가
      queueChangeLog(CHANGE_LOG_ACTIONS.COMMENT_DELETE, deletedContent, null, { changeType: 'delete' });
    },
    [pendingComments, comments, queueChangeLog]
  );

  // 파일 변경 핸들러
  const handleFileChange = useCallback(
    (action: string, fileName: string, fileData?: any) => {
      if (action === 'FILE_UPLOAD') {
        queueChangeLog(CHANGE_LOG_ACTIONS.FILE_UPLOAD, null, fileName, { targetName: fileName, changeType: 'create', ...fileData });
      } else if (action === 'FILE_UPDATE') {
        queueChangeLog(CHANGE_LOG_ACTIONS.FILE_UPDATE, fileData?.oldFileName || '', fileName, {
          targetName: fileName,
          changeType: 'update'
        });
      } else if (action === 'FILE_DELETE') {
        queueChangeLog(CHANGE_LOG_ACTIONS.FILE_DELETE, fileName, null, { targetName: fileName, changeType: 'delete' });
      }
    },
    [queueChangeLog]
  );

  const handleSave = useCallback(async () => {
    console.log('🚀🚀🚀 handleSave 함수 시작! 🚀🚀🚀');
    console.log('📊 mode:', mode);
    console.log('📊 data:', data);
    console.log('📊 educationState:', educationState);
    console.log('📊 pendingChangeLogs 현재 상태:', pendingChangeLogs);

    // 유효성 검사
    if (!educationState.educationType || !educationState.educationType.trim()) {
      console.log('❌ 유효성 검사 실패: 교육유형 없음');
      setValidationError('교육유형을 선택해주세요.');
      return;
    }

    if (!educationState.educationName || !educationState.educationName.trim()) {
      setValidationError('교육명은 필수 입력 항목입니다.');
      return;
    }

    if (!educationState.location || !educationState.location.trim()) {
      setValidationError('장소는 필수 입력 항목입니다.');
      return;
    }

    console.log(`🟡 handleSave - educationReport 상태:`, educationReport);

    // sessionStorage에서 임시 저장된 데이터 확인하고 최신 데이터 결정
    let finalEducationReport = educationReport;
    if (data?.id) {
      const tempKey = `education_report_temp_${data.id}`;
      const tempData = sessionStorage.getItem(tempKey);
      console.log(`🔍 sessionStorage 임시 데이터 확인:`, tempData);
      if (tempData) {
        const parsedTempData = JSON.parse(tempData);
        console.log(`🔍 파싱된 임시 데이터:`, parsedTempData);
        // 임시 저장된 데이터를 우선 사용
        finalEducationReport = parsedTempData;
        console.log(`🔄 최종 사용할 educationReport:`, finalEducationReport);
      }
    }

    // 개요탭 필드 변경 로깅 (edit 모드일 때만)
    if (mode === 'edit' && initialDataSnapshot) {
      console.log('🔍 개요탭 변경 감지 시작');
      console.log('🔍 초기 스냅샷:', initialDataSnapshot);
      console.log('🔍 현재 educationState:', educationState);

      // 변경된 필드들을 감지
      const fieldsToCheck = [
        { field: 'educationName', action: CHANGE_LOG_ACTIONS.EDUCATION_NAME_CHANGE },
        { field: 'educationType', action: CHANGE_LOG_ACTIONS.EDUCATION_TYPE_CHANGE },
        { field: 'status', action: CHANGE_LOG_ACTIONS.STATUS_CHANGE },
        { field: 'assignee', action: CHANGE_LOG_ACTIONS.ASSIGNEE_CHANGE },
        { field: 'team', action: CHANGE_LOG_ACTIONS.TEAM_CHANGE },
        { field: 'location', action: CHANGE_LOG_ACTIONS.LOCATION_CHANGE },
        { field: 'description', action: CHANGE_LOG_ACTIONS.DESCRIPTION_CHANGE },
        { field: 'executionDate', action: CHANGE_LOG_ACTIONS.DATE_CHANGE },
        { field: 'participantCount', action: CHANGE_LOG_ACTIONS.PARTICIPANT_COUNT_CHANGE }
      ];

      fieldsToCheck.forEach(({ field, action }) => {
        const oldValue = initialDataSnapshot[field];
        const newValue = educationState[field];
        console.log(`🔍 필드 체크 [${field}]: "${oldValue}" vs "${newValue}" | 변경됨: ${oldValue !== newValue}`);

        if (oldValue !== newValue) {
          console.log(`✅ 변경 감지! 필드: ${field}, 이전값: ${oldValue}, 새값: ${newValue}`);

          // 상태와 교육유형은 이미 서브코드명으로 저장되므로 그대로 사용
          let oldValueDisplay = oldValue;
          let newValueDisplay = newValue;

          queueChangeLog(action, oldValueDisplay, newValueDisplay, {
            changeType: 'update',
            fieldName: field
          });
        }
      });

      // 교육실적보고 변경 로깅
      if (initialDataSnapshot.achievements !== finalEducationReport.achievements) {
        queueChangeLog(CHANGE_LOG_ACTIONS.ACHIEVEMENT_UPDATE, initialDataSnapshot.achievements, finalEducationReport.achievements, {
          changeType: 'update',
          fieldName: 'achievements'
        });
      }

      if (
        initialDataSnapshot.improvements !== finalEducationReport.improvements ||
        initialDataSnapshot.improvement_points !== finalEducationReport.improvements
      ) {
        queueChangeLog(
          CHANGE_LOG_ACTIONS.IMPROVEMENT_UPDATE,
          initialDataSnapshot.improvements || initialDataSnapshot.improvement_points,
          finalEducationReport.improvements,
          {
            changeType: 'update',
            fieldName: 'improvements'
          }
        );
      }

      if (initialDataSnapshot.feedback !== finalEducationReport.feedback) {
        queueChangeLog(CHANGE_LOG_ACTIONS.FEEDBACK_UPDATE, initialDataSnapshot.feedback, finalEducationReport.feedback, {
          changeType: 'update',
          fieldName: 'feedback'
        });
      }
    } else if (mode === 'add') {
      // 신규 교육 생성 로그
      queueChangeLog(CHANGE_LOG_ACTIONS.EDUCATION_CREATE, null, educationState.educationName, {
        changeType: 'create'
      });
    }

    const educationData: SecurityEducationRecord = {
      id: data?.id || generateNextId(),
      registrationDate: educationState.registrationDate,
      code: educationState.code,
      educationType: educationState.educationType as any,
      educationName: educationState.educationName,
      description: educationState.description,
      location: educationState.location,
      participantCount: educationState.participantCount,
      executionDate: educationState.executionDate,
      status: educationState.status as any,
      assignee: educationState.assignee,
      team: educationState.team,
      attachment: false,
      attachmentCount: 0,
      attachments: [],
      isNew: mode === 'add',
      // 교육실적보고 데이터 포함 (sessionStorage 우선 사용)
      achievements: finalEducationReport.achievements, // 성과 -> achievements
      improvements: finalEducationReport.improvements, // 개선사항 -> improvements (UI용)
      improvement_points: finalEducationReport.improvements, // 개선사항 -> improvement_points (DB용)
      feedback: finalEducationReport.feedback // 교육소감 -> feedback
      // notes 필드는 DB에 없으므로 제거
    };

    console.log(`🟡 handleSave - 생성된 educationData:`, {
      achievements: educationData.achievements,
      improvements: educationData.improvements,
      improvement_points: educationData.improvement_points,
      feedback: educationData.feedback
    });

    // 개선사항 필드 특별 확인
    console.log(`🔧 개선사항 최종 저장 값 (UI용): "${educationData.improvements}"`);
    console.log(`🔧 개선사항 최종 저장 값 (DB용): "${educationData.improvement_points}"`);
    console.log(`🔧 finalEducationReport.improvements: "${finalEducationReport.improvements}"`);

    // 메인 교육 데이터 저장
    let savedEducation;
    try {
      // onSave가 Promise를 반환하는지 확인
      const saveResult = onSave(educationData);
      if (saveResult && typeof saveResult.then === 'function') {
        savedEducation = await saveResult;
      } else {
        savedEducation = saveResult;
      }
      console.log('✅ 메인 교육 데이터 저장 결과:', savedEducation);
      console.log('✅ 저장된 교육 ID:', savedEducation?.id);
      console.log('✅ savedEducation 전체 객체:', JSON.stringify(savedEducation, null, 2));

      // ID가 유효한지 확인
      if (mode === 'add' && (!savedEducation?.id || isNaN(savedEducation.id))) {
        console.error('❌ 저장된 교육 ID가 유효하지 않음:', savedEducation?.id);
        setValidationError('교육 데이터 저장에 실패했습니다. ID가 생성되지 않았습니다.');
        return;
      }
    } catch (error) {
      console.error('❌ 메인 교육 데이터 저장 실패:', error);
      if (mode === 'add') {
        setValidationError('교육 데이터 저장에 실패했습니다.');
        return;
      }
      savedEducation = educationData; // edit 모드에서는 fallback 사용
    }

    // education_id 결정 (커리큘럼과 참석자 저장에서 공통 사용)
    const educationIdToUse = savedEducation?.id || educationData.id;
    console.log('🔍 사용할 education_id:', educationIdToUse);
    console.log('🔍 savedEducation:', savedEducation);
    console.log('🔍 educationData.id:', educationData.id);

    // add 모드에서 커리큘럼 데이터 저장 (체크리스트 방식)
    const currentCurriculumData = (window as any).getCurrentCurriculumData?.() || [];
    console.log('📦 커리큘럼 데이터 수집 결과:', currentCurriculumData.length, '개 항목');
    console.log('📦 수집된 커리큘럼 데이터 상세:', JSON.stringify(currentCurriculumData, null, 2));

    // 각 항목의 내용 확인
    currentCurriculumData.forEach((item: any, index: number) => {
      console.log(`📦 수집된 항목 ${index + 1}:`, {
        session_title: item.session_title,
        session_description: item.session_description,
        duration_minutes: item.duration_minutes,
        instructor: item.instructor,
        session_type: item.session_type,
        materials: item.materials,
        objectives: item.objectives
      });
    });

    if (currentCurriculumData.length > 0) {
      console.log('📦 커리큘럼 데이터 DB 저장 시작:', currentCurriculumData.length, '개 항목');
      console.log('📦 현재 모드:', mode);

      try {
        // 중앙화된 Supabase 클라이언트를 사용하여 커리큘럼 데이터 저장

        // education_id 유효성 검사
        if (!educationIdToUse) {
          console.error('❌ education_id가 유효하지 않음');
          throw new Error('education_id가 설정되지 않았습니다.');
        }

        // 편집 모드에서는 기존 커리큘럼 데이터 삭제
        if (mode === 'edit') {
          console.log('📦 편집 모드: 기존 커리큘럼 데이터 삭제');
          const { error: deleteError } = await supabase.from('security_education_curriculum').delete().eq('education_id', educationIdToUse);

          if (deleteError) {
            console.error('❌ 기존 커리큘럼 데이터 삭제 실패:', deleteError);
            throw deleteError;
          }
          console.log('✅ 기존 커리큘럼 데이터 삭제 완료');
        }

        const curriculumDataToSave = currentCurriculumData
          .filter((item) => item && typeof item === 'object') // 유효한 객체만 필터링
          .map((item, index) => {
            const mappedItem = {
              // id 제거 - DB에서 자동 생성
              education_id: Number(educationIdToUse), // 정수형으로 변환
              session_order: Number(item.session_order) || index + 1,
              session_title: String(item.session_title || '').trim(),
              session_description: String(item.session_description || '').trim(),
              duration_minutes: Number(item.duration_minutes) || 0,
              instructor: String(item.instructor || '').trim(),
              session_type: String(item.session_type || '강의').trim(),
              materials: String(item.materials || '').trim(),
              objectives: String(item.objectives || '').trim(),
              is_active: Boolean(item.is_active ?? true),
              created_by: 'user',
              updated_by: 'user'
            };
            console.log(`📦 매핑된 항목 ${index + 1}:`, mappedItem);
            return mappedItem;
          });

        // 빈 데이터 체크
        if (curriculumDataToSave.length === 0) {
          console.log('⚠️ 저장할 유효한 커리큘럼 데이터가 없습니다.');
          return; // 저장 중단
        }

        const { error } = await supabase.from('security_education_curriculum').insert(curriculumDataToSave);

        if (error) {
          console.error('❌ 커리큘럼 데이터 저장 실패:');
          console.error('에러 메시지:', error.message || '메시지 없음');
          console.error('에러 세부사항:', error.details || '세부사항 없음');
          console.error('에러 힌트:', error.hint || '힌트 없음');
          console.error('에러 코드:', error.code || '코드 없음');
          console.error('전체 에러 객체:', JSON.stringify(error, null, 2));
          console.error('저장하려던 데이터:', JSON.stringify(curriculumDataToSave, null, 2));

          // throw하지 않고 로그만 남김 (계속 진행하도록)
          console.warn('⚠️ 커리큘럼 저장에 실패했지만 다른 데이터 저장은 계속 진행합니다.');
        } else {
          console.log('✅ 커리큘럼 데이터 저장 성공:', curriculumDataToSave.length, '개 항목');

          // 커리큘럼 추가 로깅
          curriculumDataToSave.forEach((item) => {
            queueChangeLog(CHANGE_LOG_ACTIONS.CURRICULUM_ADD, null, item, {
              targetName: item.session_title,
              changeType: 'create'
            });
          });
        }
      } catch (error) {
        console.error('❌ 커리큘럼 데이터 저장 중 오류:', error);
        console.warn('⚠️ 커리큘럼 저장에 실패했지만 다른 데이터 저장은 계속 진행합니다.');
      }
    }

    // 5. 참석자 데이터 저장 (data_relation.md 패턴 준수)
    console.log('🔍 getCurrentParticipantData 함수 확인:', typeof (window as any).getCurrentParticipantData);

    const currentParticipantData = (window as any).getCurrentParticipantData?.() || [];
    console.log('👥 참석자 데이터 수집 결과:', currentParticipantData.length, '개 항목');
    console.log('👥 수집된 참석자 데이터 상세:', JSON.stringify(currentParticipantData, null, 2));
    console.log('👥 현재 모드:', mode);
    console.log('👥 education_id 사용할 값:', educationIdToUse);

    // 각 항목의 내용 확인
    currentParticipantData.forEach((item: any, index: number) => {
      console.log(`👥 수집된 참석자 ${index + 1}:`, {
        user_name: item.user_name,
        position: item.position,
        department: item.department,
        attendance_status: item.attendance_status,
        notes: item.notes
      });
    });

    if (currentParticipantData.length > 0) {
      console.log('👥 참석자 데이터 DB 저장 시작:', currentParticipantData.length, '개 항목');

      try {
        // 중앙화된 Supabase 클라이언트를 사용하여 참석자 데이터 저장

        // 편집 모드에서는 기존 참석자 데이터 삭제
        if (mode === 'edit') {
          console.log('👥 편집 모드: 기존 참석자 데이터 삭제');
          const { error: deleteError } = await supabase.from('security_education_attendee').delete().eq('education_id', educationIdToUse);

          if (deleteError) {
            console.error('❌ 기존 참석자 데이터 삭제 실패:', deleteError);
            throw deleteError;
          }
          console.log('✅ 기존 참석자 데이터 삭제 완료');
        }

        // education_id 유효성 검사
        if (!educationIdToUse) {
          console.error('❌ education_id가 유효하지 않음');
          throw new Error('education_id가 설정되지 않았습니다.');
        }

        console.log('👥 사용할 education_id:', educationIdToUse);

        const participantDataToSave = currentParticipantData
          .filter((item: any) => item && typeof item === 'object' && item.user_name?.trim()) // 참석자명이 있는 항목만
          .map((item: any) => {
            const cleanData = {
              education_id: Number(educationIdToUse),
              user_name: String(item.user_name || '').trim(),
              position: String(item.position || '').trim(),
              department: String(item.department || '').trim(),
              attendance_status: String(item.attendance_status || '예정').trim(),
              notes: String(item.notes || '').trim(),
              is_active: Boolean(item.is_active ?? true),
              created_by: 'user',
              updated_by: 'user'
            };

            console.log('👥 변환된 참석자 데이터:', cleanData);
            return cleanData;
          });

        console.log('👥 최종 저장할 참석자 데이터:', participantDataToSave.length, '개');

        if (participantDataToSave.length > 0) {
          const { data: insertedData, error } = await supabase.from('security_education_attendee').insert(participantDataToSave).select();

          if (error) {
            console.error('❌ 참석자 데이터 저장 실패:', error);
            console.error('참석자 에러 메시지:', error.message || '메시지 없음');
            console.error('참석자 에러 세부사항:', error.details || '세부사항 없음');
            console.error('참석자 저장 데이터:', JSON.stringify(participantDataToSave, null, 2));
            console.warn('⚠️ 참석자 저장에 실패했지만 교육 데이터는 저장되었습니다.');
          } else {
            console.log('✅ 참석자 데이터 저장 성공:', insertedData?.length || 0, '개 항목');
            console.log('✅ 저장된 참석자 데이터:', insertedData);

            // 참석자 추가 및 출석 로깅
            participantDataToSave.forEach((item) => {
              // 참석자 추가 로그
              queueChangeLog(CHANGE_LOG_ACTIONS.ATTENDEE_ADD, null, item, {
                targetName: item.user_name,
                changeType: 'create'
              });

              // 출석 상태가 '출석'이면 출석 확인 로그도 추가
              if (item.attendance_status === '출석') {
                queueChangeLog(CHANGE_LOG_ACTIONS.ATTENDANCE_CHECK, null, item.attendance_status, {
                  targetName: item.user_name,
                  changeType: 'update'
                });
              }
            });
          }
        } else {
          console.log('⚠️ 저장할 유효한 참석자 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('❌ 참석자 데이터 저장 중 오류:', error);
        console.warn('⚠️ 참석자 저장에 실패했지만 교육 데이터는 저장되었습니다.');
      }
    } else if (mode === 'add') {
      console.log('⚠️ add 모드이지만 저장할 참석자 데이터가 없습니다.');
    }

    // 6. 기록(피드백) 데이터 저장
    console.log('📝 기록 데이터 저장 시작');
    console.log('📝 삭제할 기록:', deletedCommentIds.length, '개');
    console.log('📝 수정할 기록:', Object.keys(modifiedComments).length, '개');
    console.log('📝 추가할 기록:', pendingComments.length, '개');

    try {
      // 6-1. 삭제된 기록들 처리
      if (deletedCommentIds.length > 0) {
        for (const commentId of deletedCommentIds) {
          await deleteFeedback(commentId);
          console.log('✅ 기록 삭제 완료:', commentId);
        }
      }

      // 6-2. 수정된 기록들 처리
      if (Object.keys(modifiedComments).length > 0) {
        for (const [commentId, newContent] of Object.entries(modifiedComments)) {
          await updateFeedback(commentId, { description: newContent });
          console.log('✅ 기록 수정 완료:', commentId);
        }
      }

      // 6-3. 새로 추가된 기록들 처리
      if (pendingComments.length > 0 && educationIdToUse) {
        console.log('📝 기록 추가 시작:', {
          '기록 개수': pendingComments.length,
          '교육 ID (원본)': educationIdToUse,
          '교육 ID (타입)': typeof educationIdToUse,
          '교육 ID (문자열 변환)': String(educationIdToUse)
        });

        // pendingComments를 역순으로 저장 (가장 오래된 것부터 저장하여 DB에서 최신순으로 정렬되도록)
        const reversedComments = [...pendingComments].reverse();
        for (const comment of reversedComments) {
          const feedbackInput = {
            page: PAGE_IDENTIFIERS.SECURITY_EDUCATION,
            record_id: String(educationIdToUse), // 숫자를 문자열로 변환
            action_type: '기록',
            description: comment.content,
            user_name: comment.author,
            team: comment.department || '',
            user_department: comment.department || '',
            user_position: comment.position || '',
            user_profile_image: comment.avatar || '',
            metadata: { role: comment.role || '' }
          };

          console.log('📝 기록 추가 상세:', {
            record_id: feedbackInput.record_id,
            'record_id 타입': typeof feedbackInput.record_id,
            description: comment.content.substring(0, 30) + '...'
          });

          await addFeedback(feedbackInput);
          console.log('✅ 기록 추가 완료:', comment.content.substring(0, 20) + '...');
        }
      } else if (pendingComments.length > 0 && !educationIdToUse) {
        console.error('❌ 기록을 저장할 수 없음: educationIdToUse가 없습니다', {
          educationIdToUse: educationIdToUse,
          'pendingComments 개수': pendingComments.length
        });
      }

      console.log('✅ 기록 데이터 저장 완료');

      // 저장 후 임시 데이터 초기화
      setPendingComments([]);
      setModifiedComments({});
      setDeletedCommentIds([]);
    } catch (error) {
      console.error('❌ 기록 데이터 저장 중 오류:', error);
      console.warn('⚠️ 기록 저장에 실패했지만 교육 데이터는 저장되었습니다.');
    }

    // 7. 변경로그 일괄 저장
    try {
      if (pendingChangeLogs.length > 0) {
        console.log('📝 변경로그 저장 시작:', pendingChangeLogs.length, '개 항목');

        for (const logInput of pendingChangeLogs) {
          // record_id가 없는 경우 (신규 생성) educationIdToUse 사용
          const finalLogInput = {
            ...logInput,
            record_id: logInput.record_id || String(educationIdToUse)
          };

          await addChangeLog(finalLogInput);
          console.log('✅ 변경로그 저장 완료:', logInput.description);
        }

        console.log('✅ 모든 변경로그 저장 완료');

        // 저장 후 초기화
        setPendingChangeLogs([]);
      }
    } catch (error) {
      console.error('❌ 변경로그 저장 중 오류:', error);
      console.warn('⚠️ 변경로그 저장에 실패했지만 교육 데이터는 저장되었습니다.');
    }

    // 성공적으로 저장된 후 SessionStorage 정리 (add 모드에서만)
    if (mode === 'add') {
      try {
        sessionStorage.removeItem('security_education_temp_curriculum');
        sessionStorage.removeItem('security_education_temp_participants');
        console.log('🗑️ 저장 완료 후 SessionStorage 데이터 정리 완료');
      } catch (error) {
        console.error('❌ SessionStorage 정리 실패:', error);
      }
    }

    // 저장 성공 시 교육실적보고 임시 저장 데이터 삭제
    if (data?.id) {
      const tempKey = `education_report_temp_${data.id}`;
      sessionStorage.removeItem(tempKey);
      console.log(`🗑️ 교육실적보고 임시 저장 데이터 삭제: ${tempKey}`);
    }

    onClose();
  }, [
    educationState,
    data,
    mode,
    onSave,
    onClose,
    pendingComments,
    modifiedComments,
    deletedCommentIds,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    educationReport,
    initialDataSnapshot,
    queueChangeLog,
    addChangeLog,
    pendingChangeLogs,
    getStatusName,
    getEducationTypeName
  ]);

  const handleClose = useCallback(() => {
    // SessionStorage 정리
    try {
      // add 모드일 때는 커리큘럼과 참석자 데이터 정리
      if (mode === 'add') {
        sessionStorage.removeItem('security_education_temp_curriculum');
        sessionStorage.removeItem('security_education_temp_participants');
      }

      // edit 모드일 때는 교육실적보고 임시 저장 데이터 정리
      if (mode === 'edit' && data?.id) {
        const tempKey = `education_report_temp_${data.id}`;
        sessionStorage.removeItem(tempKey);
        console.log(`🗑️ 교육실적보고 임시 저장 데이터 정리: ${tempKey}`);
      }

      console.log('🗑️ 팝업 닫기 시 SessionStorage 데이터 정리 완료');
    } catch (error) {
      console.error('❌ SessionStorage 정리 실패:', error);
    }

    onClose();
    dispatch({ type: 'RESET' });
    setEducationReport({
      achievements: '',
      improvements: '',
      feedback: ''
    });
    setCurriculumItems([]); // 커리큘럼 초기화
    setSelectedCurriculumRows([]); // 선택된 커리큘럼 초기화
    setParticipantItems([]); // 참석자 초기화
    setSelectedParticipantRows([]); // 선택된 참석자 초기화
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setValidationError('');
    setInitialDataSnapshot(null); // 초기 데이터 스냅샷 초기화
    setPendingChangeLogs([]); // 변경로그 초기화
  }, [onClose, mode]);

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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 2, pt: 2 }}>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
            보안교육관리 편집
          </Typography>
          {((mode === 'edit' && educationState.code && educationState.educationName) ||
            (mode === 'add' && educationState.educationName)) && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
              {educationState.educationName}
              {educationState.code ? ` (${educationState.code})` : ''}
            </Typography>
          )}
        </Box>
        {/* 🔐 권한 체크: 새 교육(mode='add')은 canCreateData, 기존 교육(mode='edit')은 canEdit */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={mode === 'add' ? !canCreateData : !canEdit}
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
            disabled={mode === 'add' ? !canCreateData : !canEdit}
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

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="교육관리 탭">
            <Tab label="개요" {...a11yProps(0)} />
            <Tab label="커리큘럼" {...a11yProps(1)} />
            <Tab label="참석자" {...a11yProps(2)} />
            <Tab label="교육실적보고" {...a11yProps(3)} />
            <Tab label="기록" {...a11yProps(4)} />
            <Tab label="자료" {...a11yProps(5)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <OverviewTab
            educationState={educationState}
            onFieldChange={handleFieldChange}
            assignees={assignees}
            assigneeAvatars={assigneeAvatars}
            statusColors={statusColors}
            educationTypes={educationTypes}
            statusTypes={statusTypes}
            assigneeList={assigneeList}
          />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <CurriculumTab
            mode={mode}
            educationId={typeof data?.id === 'string' ? parseInt(data.id) : data?.id}
            canCreateData={canCreateData}
            canEditOwn={canEdit}
            canEditOthers={canEdit}
            // 비용관리 금액탭 패턴: 부모 state 전달
            curriculumItems={curriculumItems}
            setCurriculumItems={setCurriculumItems}
            selectedRows={selectedCurriculumRows}
            setSelectedRows={setSelectedCurriculumRows}
          />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <ParticipantsTab
            mode={mode}
            educationId={data?.id}
            onParticipantCountChange={handleParticipantCountChange}
            attendanceTypes={attendanceTypes}
            canCreateData={canCreateData}
            canEditOwn={canEdit}
            canEditOthers={canEdit}
            // 커리큘럼탭과 동일한 패턴: 부모 state 전달
            participantItems={participantItems}
            setParticipantItems={setParticipantItems}
            selectedRows={selectedParticipantRows}
            setSelectedRows={setSelectedParticipantRows}
          />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <ReportsTab educationReport={educationReport} onEducationReportChange={handleEducationReportChange} />
        </TabPanel>

        <TabPanel value={value} index={4}>
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
            currentUserName={currentUser?.user_name || user?.name || '현재 사용자'}
            currentUserAvatar={currentUser?.profile_image_url || ''}
            currentUserRole={currentUser?.role || ''}
            currentUserDepartment={currentUser?.department || user?.department || ''}
          />
        </TabPanel>

        <TabPanel value={value} index={5}>
          <MaterialTab
            recordId={data?.id}
            currentUser={currentUser}
            onFileChange={handleFileChange}
            canEditOwn={canEdit}
            canEditOthers={canEdit}
          />
        </TabPanel>
      </DialogContent>

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
