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
import { useSupabaseUserManagement, UserProfile } from '../hooks/useSupabaseUserManagement';
import { useSupabaseSecurityCurriculum, SecurityCurriculumItem } from '../hooks/useSupabaseSecurityCurriculum';
import { useSupabaseSecurityAttendee, SecurityAttendeeItem } from '../hooks/useSupabaseSecurityAttendee';
import { useSupabaseSecurityEducation } from '../hooks/useSupabaseSecurityEducation';
import { useSupabaseDepartments } from '../hooks/useSupabaseDepartments';
import useIdGenerator from '../hooks/useIdGenerator';
import useUser from '../hooks/useUser';
import { supabase } from '../lib/supabase';

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
      return {
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
    case 'INIT_NEW_EDUCATION':
      return {
        educationName: '',
        description: '',
        educationType: '',
        assignee: action.assignee || assignees[0],
        executionDate: '',
        location: '',
        status: '대기',
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
        status: '대기',
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
                <Select value={educationState.educationType} onChange={handleFieldChange('educationType')} label=" " displayEmpty>
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
              <Select value={educationState.status} onChange={handleFieldChange('status')} label="상태">
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
                startAdornment: educationState.assignee && assigneeList ? (
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

// 참석자 탭 컴포넌트
const ParticipantsTab = memo(
  ({
    mode,
    educationId,
    onParticipantCountChange,
    attendanceTypes
  }: {
    mode: 'add' | 'edit';
    educationId?: number;
    onParticipantCountChange?: (count: number) => void;
    attendanceTypes: any[];
  }) => {
    // Supabase 참석자 관리 훅
    const { fetchAttendeesByEducationId, addMultipleAttendees, updateAttendee, deleteAttendee } = useSupabaseSecurityAttendee();

    // ID 생성기 훅 (data_relation.md 패턴 준수)
    const { generateNextId } = useIdGenerator();

    // SessionStorage 키 정의
    const STORAGE_KEY = 'security_education_temp_participants';

    // SessionStorage에서 데이터 복원
    const loadFromSessionStorage = useCallback(() => {
      try {
        const savedData = sessionStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('📦 SessionStorage에서 참석자 데이터 복원:', parsedData.length, '개');
          return parsedData;
        }
      } catch (error) {
        console.error('❌ SessionStorage 복원 실패:', error);
      }
      return [];
    }, [STORAGE_KEY]);

    // SessionStorage에 데이터 저장
    const saveToSessionStorage = useCallback(
      (data: SecurityAttendeeItem[]) => {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          console.log('💾 SessionStorage에 참석자 데이터 저장:', data.length, '개');
        } catch (error) {
          console.error('❌ SessionStorage 저장 실패:', error);
        }
      },
      [STORAGE_KEY]
    );

    // SessionStorage 데이터 삭제
    const clearSessionStorage = useCallback(() => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ SessionStorage 참석자 데이터 정리 완료');
      } catch (error) {
        console.error('❌ SessionStorage 정리 실패:', error);
      }
    }, [STORAGE_KEY]);

    // 출석점검 색상 정의
    const getAttendanceColor = (status: string) => {
      const colors = {
        예정: { backgroundColor: '#F5F5F5', color: '#757575' }, // 회색
        참석: { backgroundColor: '#E3F2FD', color: '#1976D2' }, // 파란색
        완료: { backgroundColor: '#E8F5E9', color: '#388E3C' }, // 녹색
        불참: { backgroundColor: '#FFF3E0', color: '#F57C00' }, // 주황색
        취소: { backgroundColor: '#FFEBEE', color: '#D32F2F' } // 빨간색
      };
      return colors[status as keyof typeof colors] || { backgroundColor: '#F5F5F5', color: '#757575' };
    };

    const [participantItems, setParticipantItems] = useState<SecurityAttendeeItem[]>(() => {
      // 초기값을 SessionStorage에서 복원
      if (mode === 'add') {
        return loadFromSessionStorage();
      }
      return [];
    });
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

    // mode와 educationId에 따라 초기 데이터 설정 (data_relation.md 패턴 준수)
    useEffect(() => {
      if (mode === 'add') {
        console.log('🟡 add 모드: 로컬 상태만 초기화');
        setParticipantItems([]);
        participantItemsRef.current = [];
      } else if (mode === 'edit' && educationId) {
        console.log('🟡 edit 모드: DB에서 참석자 데이터 로드', educationId);
        loadParticipantData(educationId);
      }
    }, [mode, educationId]);

    // DB에서 참석자 데이터 로드
    const loadParticipantData = useCallback(
      async (educationId: number) => {
        try {
          const dbItems = await fetchAttendeesByEducationId(educationId);
          console.log('🟢 DB에서 참석자 데이터 로드 성공:', dbItems);

          // 타입 변환: education_id는 항상 number로 처리
          const convertedItems = dbItems.map((item) => ({
            ...item,
            education_id: typeof item.education_id === 'string' ? parseInt(item.education_id) : item.education_id
          }));

          setParticipantItems(convertedItems);
          participantItemsRef.current = convertedItems;
        } catch (error) {
          console.error('❌ 참석자 데이터 로드 실패:', error);
        }
      },
      [fetchAttendeesByEducationId]
    );

    // 로컬 편집 함수 (항상 로컬 상태만 변경 - 커리큘럼탭과 동일한 패턴)
    const handleLocalEditItem = useCallback(
      (id: number, field: string, value: string) => {
        const updatedItems = participantItems.map((item) => (item.id === id ? { ...item, [field]: value } : item));
        setParticipantItems(updatedItems);
        participantItemsRef.current = updatedItems; // data_relation.md 패턴: ref 즉시 업데이트

        // add 모드에서만 SessionStorage에 저장
        if (mode === 'add') {
          saveToSessionStorage(updatedItems);
        }

        console.log('📝 참석자 로컬 상태만 변경:', field, '=', value);
        console.log('📝 ref 업데이트 확인:', participantItemsRef.current.length);
      },
      [participantItems, mode, saveToSessionStorage]
    );

    // edit 모드에서만 사용하는 DB 저장 함수 (더 이상 onChange에서 호출되지 않음)
    const handleEditItem = useCallback(
      async (id: number, field: string, value: string) => {
        // edit 모드에서만 동작
        if (mode !== 'edit') {
          console.log('⚠️ handleEditItem은 edit 모드에서만 동작합니다.');
          return;
        }

        console.log('🔵 edit 모드: 참석자 DB 업데이트 수행');

        try {
          const updateResult = await updateAttendee(id, { [field]: value });

          if (updateResult) {
            console.log('✅ 참석자 DB 업데이트 성공');
          }
        } catch (error) {
          console.error('❌ 참석자 DB 업데이트 실패:', error);
        }
      },
      [mode, updateAttendee]
    );

    // 외부 노출 함수 (체크리스트 방식 - data_relation.md 패턴)
    useEffect(() => {
      participantItemsRef.current = participantItems;
    }, [participantItems]);

    // 전역 함수로 최신 참석자 데이터 노출 (저장 시 사용)
    useEffect(() => {
      (window as any).getCurrentParticipantData = () => participantItemsRef.current;
    }, []);

    // 참석자 수 변경 시 콜백 호출
    useEffect(() => {
      if (onParticipantCountChange) {
        onParticipantCountChange(participantItems.length);
      }
    }, [participantItems.length, onParticipantCountChange]);

    const [selectedRows, setSelectedRows] = useState<number[]>([]);
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

    // 셀 편집 완료 시 호출 (커리큘럼탭과 동일한 패턴)
    const handleCellBlur = async () => {
      if (editingCell && mode === 'edit') {
        // edit 모드에서만 DB에 저장
        const currentValue = participantItems.find((item) => item.id === editingCell.id)?.[editingCell.field as keyof SecurityAttendeeItem];
        if (currentValue !== undefined) {
          await handleEditItem(editingCell.id, editingCell.field, String(currentValue));
        }
      }
      setEditingCell(null);
    };

    // 새 참석자 추가 (data_relation.md 패턴 준수)
    const handleAddItem = useCallback(() => {
      const newId = generateNextId(); // PostgreSQL 정수 범위 내 순차 ID 생성
      console.log('🆔 새 참석자 ID 생성:', newId);

      const newItem: SecurityAttendeeItem = {
        id: newId,
        education_id: educationId || 999999, // add 모드에서는 임시 ID, 저장 시 실제 education_id로 교체
        user_name: '',
        position: '',
        department: '',
        attendance_status: '예정',
        notes: '',
        is_active: true
      };

      const updatedItems = [newItem, ...participantItems];
      setParticipantItems(updatedItems);
      participantItemsRef.current = updatedItems;

      // add 모드에서만 SessionStorage에 저장
      if (mode === 'add') {
        saveToSessionStorage(updatedItems);
      }
    }, [educationId, participantItems, generateNextId, mode, saveToSessionStorage]);

    // 선택된 참석자 삭제
    const handleDeleteSelected = useCallback(async () => {
      if (mode === 'edit') {
        // edit 모드: DB에서도 삭제
        for (const id of selectedRows) {
          await deleteAttendee(id);
        }
      }

      // 로컬 상태에서 삭제
      const updatedItems = participantItems.filter((item) => !selectedRows.includes(item.id));
      setParticipantItems(updatedItems);
      participantItemsRef.current = updatedItems;

      // add 모드에서만 SessionStorage에 저장
      if (mode === 'add') {
        saveToSessionStorage(updatedItems);
      }

      setSelectedRows([]);
    }, [mode, selectedRows, participantItems, deleteAttendee, saveToSessionStorage]);

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
                    // 로컬 상태 업데이트
                    handleLocalEditItem(item.id, field, e.target.value);
                    // edit 모드일 때만 DB도 업데이트
                    if (mode === 'edit') {
                      handleEditItem(item.id, field, e.target.value);
                    }
                  }}
                  onBlur={handleCellBlur}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  renderValue={(selected) => (
                    <Chip
                      label={selected}
                      size="small"
                      sx={{
                        ...getAttendanceColor(selected as string),
                        fontSize: '12px',
                        height: 20
                      }}
                    />
                  )}
                >
                  {attendanceTypes.map((type) => (
                    <MenuItem key={type.subcode} value={type.subcode_name}>
                      <Chip
                        label={type.subcode_name}
                        size="small"
                        sx={{
                          ...getAttendanceColor(type.subcode_name),
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
              label={value || '-'}
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
            <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selectedRows.length === 0} size="small">
              삭제({selectedRows.length})
            </Button>
            <Button variant="contained" onClick={handleAddItem} size="small" sx={{ fontSize: '12px' }}>
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

// 커리큘럼 탭 컴포넌트 - 임시 데이터 저장 기능 추가
const CurriculumTab = memo(({ mode, educationId }: { mode: 'add' | 'edit'; educationId?: number }) => {
  // Supabase 커리큘럼 hook
  const {
    data: curriculumData,
    loading: curriculumLoading,
    addCurriculum,
    updateCurriculum,
    deleteCurriculum
  } = useSupabaseSecurityCurriculum();

  // SessionStorage 키 정의
  const STORAGE_KEY = 'security_education_temp_curriculum';

  // SessionStorage에서 데이터 복원
  const loadFromSessionStorage = useCallback(() => {
    try {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('📦 SessionStorage에서 커리큘럼 데이터 복원:', parsedData.length, '개');
        return parsedData;
      }
    } catch (error) {
      console.error('❌ SessionStorage 복원 실패:', error);
    }
    return [];
  }, [STORAGE_KEY]);

  // SessionStorage에 데이터 저장
  const saveToSessionStorage = useCallback(
    (data: SecurityCurriculumItem[]) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('💾 SessionStorage에 커리큘럼 데이터 저장:', data.length, '개');
      } catch (error) {
        console.error('❌ SessionStorage 저장 실패:', error);
      }
    },
    [STORAGE_KEY]
  );

  // SessionStorage 데이터 삭제
  const clearSessionStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ SessionStorage 커리큘럼 데이터 정리 완료');
    } catch (error) {
      console.error('❌ SessionStorage 정리 실패:', error);
    }
  }, [STORAGE_KEY]);

  const [curriculumItems, setCurriculumItems] = useState<SecurityCurriculumItem[]>([]);
  const curriculumItemsRef = useRef<SecurityCurriculumItem[]>([]);

  // curriculumItems가 변경될 때마다 ref도 업데이트
  useEffect(() => {
    curriculumItemsRef.current = curriculumItems;
  }, [curriculumItems]);

  // educationId에 해당하는 커리큘럼 데이터 필터링 및 설정
  useEffect(() => {
    console.log('🔍 CurriculumTab useEffect 실행:', { mode, educationId, curriculumDataLength: curriculumData?.length });

    if (mode === 'add') {
      // add 모드에서는 SessionStorage에서 복원
      const restoredData = loadFromSessionStorage();
      setCurriculumItems(restoredData);
    } else if (educationId && curriculumData) {
      // edit 모드에서는 DB 데이터 사용
      console.log('🔍 필터링 전 전체 커리큘럼 데이터:', curriculumData);
      const filteredData = curriculumData.filter((item) => {
        const itemEducationId = typeof item.education_id === 'string' ? parseInt(item.education_id) : item.education_id;
        const targetEducationId = typeof educationId === 'string' ? parseInt(educationId as string) : educationId;
        console.log(`🔍 비교: item.education_id(${itemEducationId}) === educationId(${targetEducationId})`);
        return itemEducationId === targetEducationId;
      });
      console.log('🔍 필터링 후 커리큘럼 데이터:', filteredData);
      setCurriculumItems(filteredData);
    }
  }, [mode, educationId, curriculumData]);

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

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // 페이지네이션 계산
  // session_order로 정렬 (오름차순 - 낮은 숫자가 위로)
  const sortedCurriculumItems = [...curriculumItems].sort((a, b) => a.session_order - b.session_order);

  const totalPages = Math.ceil(sortedCurriculumItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedCurriculumItems.slice(startIndex, endIndex);

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

  const handleAddItem = async () => {
    // 현재 교육의 최대 session_order 찾기
    const maxOrder = curriculumItems.reduce((max, item) => Math.max(max, item.session_order), 0);

    if (mode === 'add') {
      // add 모드에서는 임시 ID로 로컬 상태에만 추가 (DB 저장 안함)
      const tempId = Math.floor(Math.random() * 1000000) + 100000; // 6자리 임시 ID 생성 (100000-1099999)

      // 기존 항목들의 session_order를 1씩 증가
      const updatedExistingItems = curriculumItems.map((item) => ({
        ...item,
        session_order: item.session_order + 1
      }));

      const newItem: SecurityCurriculumItem = {
        id: tempId,
        education_id: educationId || 0, // 임시값
        session_order: 1, // 헤더 바로 아래
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

      const updatedItems = [newItem, ...updatedExistingItems];
      setCurriculumItems(updatedItems);
      curriculumItemsRef.current = updatedItems; // data_relation.md 패턴: ref 즉시 업데이트

      // add 모드에서만 SessionStorage에 저장
      saveToSessionStorage(updatedItems);

      console.log('📋 임시 커리큘럼 항목 추가 (로컬 상태만):', newItem.session_title || '빈 제목');
      console.log('📋 ref 업데이트 확인:', curriculumItemsRef.current.length);
    } else if (mode === 'edit' && educationId) {
      // edit 모드에서만 DB에 직접 추가
      // 1. 기존 항목들의 session_order를 1씩 증가
      for (const item of curriculumItems) {
        await updateCurriculum(item.id, { session_order: item.session_order + 1 });
      }

      // 2. 새 항목을 session_order 1로 추가 (헤더 바로 아래)
      const newItem = {
        education_id: educationId,
        session_order: 1,
        session_title: '',
        session_description: '',
        duration_minutes: 0,
        instructor: '',
        session_type: '강의' as const,
        materials: '',
        objectives: '',
        is_active: true
      };

      const result = await addCurriculum(newItem);
      if (result) {
        console.log('✅ 커리큘럼 항목 DB 추가 성공');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (mode === 'add') {
      // add 모드에서는 로컬 상태에서만 제거 (DB 삭제 안함)
      const idsToRemove = selectedRows.map((id) => parseInt(id));
      const updatedItems = curriculumItems.filter((item) => !idsToRemove.includes(item.id));
      setCurriculumItems(updatedItems);
      curriculumItemsRef.current = updatedItems; // data_relation.md 패턴: ref 즉시 업데이트

      // add 모드에서만 SessionStorage에 저장
      saveToSessionStorage(updatedItems);

      console.log('📋 임시 커리큘럼 항목들 제거 (로컬만):', idsToRemove.length, '개');
      console.log('📋 ref 업데이트 확인:', curriculumItemsRef.current.length);
    } else if (mode === 'edit') {
      // edit 모드에서만 DB에서 삭제
      const selectedIds = selectedRows.map((id) => parseInt(id)).filter((id) => !isNaN(id));

      for (const id of selectedIds) {
        await deleteCurriculum(id);
        console.log('🗑️ DB에서 커리큘럼 항목 삭제:', id);
      }
    }

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

    // 항상 로컬 상태만 업데이트 (mode 상관없이)
    const updatedItems = curriculumItems.map((item) => (item.id === numericId ? { ...item, [dbField]: processedValue } : item));

    setCurriculumItems(updatedItems);
    curriculumItemsRef.current = updatedItems; // data_relation.md 패턴: ref 즉시 업데이트

    // add 모드에서만 SessionStorage에 저장
    if (mode === 'add') {
      saveToSessionStorage(updatedItems);
    }

    console.log('📝 로컬 상태만 변경:', dbField, '=', processedValue);
    console.log(
      '📝 업데이트된 항목:',
      updatedItems.find((item) => item.id === numericId)
    );
    console.log('📝 전체 curriculumItems 수:', updatedItems.length);
    console.log('📝 ref 업데이트 확인:', curriculumItemsRef.current.length);
  };

  // edit 모드에서만 사용하는 DB 저장 함수 (더 이상 onChange에서 호출되지 않음)
  const handleEditItem = async (id: string, field: string, value: string | number) => {
    // edit 모드에서만 동작
    if (mode !== 'edit') {
      console.log('⚠️ handleEditItem은 edit 모드에서만 동작합니다.');
      return;
    }

    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.error('유효하지 않은 ID:', id);
      return;
    }

    console.log('🔵 DB 편집 시작:', { id, field, value, numericId });

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
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
      if (!isNaN(numericValue) && numericValue >= 0) {
        processedValue = numericValue;
      } else {
        processedValue = 0;
      }
    }

    // edit 모드에서만 DB 업데이트
    const updates: Partial<SecurityCurriculumItem> = {
      [dbField]: processedValue
    };

    console.log('🔵 DB 업데이트 데이터:', { dbField, processedValue, updates });

    try {
      const result = await updateCurriculum(numericId, updates);
      if (result) {
        console.log('🟢 DB 편집 성공');
      } else {
        console.error('🔴 DB 편집 실패: 결과가 null');
      }
    } catch (error) {
      console.error('🔴 DB 편집 중 오류:', error);
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
      setSelectedRows(curriculumItems.map((item) => item.id.toString()));
    } else {
      setSelectedRows([]);
    }
  };

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 50,
    no: 60,
    educationDate: 100,
    time: 100,
    instructor: 120,
    title: 150,
    content: 200,
    notes: 150
  };

  const cellHeight = 48; // 고정 셀 높이 (줄임)

  // 편집 가능한 셀 렌더링 (소프트웨어관리 구매/유지보수이력 탭 방식 적용)
  const renderEditableCell = (item: SecurityCurriculumItem, field: string, value: string | number) => {
    const isEditing = editingCell?.id === item.id.toString() && editingCell?.field === field;
    const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

    if (isEditing) {
      if (field === 'educationDate') {
        return (
          <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
            <TextField
              type="date"
              value={value || ''}
              onChange={(e) => handleLocalEditItem(item.id.toString(), field, e.target.value)}
              onBlur={handleCellBlur}
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
                  padding: '8px 32px 8px 12px',
                  height: 'calc(100% - 16px)',
                  boxSizing: 'border-box'
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }
              }}
              autoFocus
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );
      }

      return (
        <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
          <TextField
            type="text"
            value={value || ''}
            onChange={(e) => handleLocalEditItem(item.id.toString(), field, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            multiline={field === 'content' || field === 'notes'}
            rows={field === 'content' || field === 'notes' ? 2 : 1}
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
                height: field === 'content' || field === 'notes' ? 'calc(100% - 16px)' : 'calc(100% - 16px)',
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

    // 읽기 모드 - 완전히 고정된 높이
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
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            whiteSpace: field === 'content' || field === 'notes' ? 'pre-wrap' : 'nowrap',
            wordBreak: field === 'content' || field === 'notes' ? 'break-word' : 'normal',
            lineHeight: field === 'content' || field === 'notes' ? 1.4 : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: field === 'content' || field === 'notes' ? '-webkit-box' : 'block',
            WebkitLineClamp: field === 'content' || field === 'notes' ? 2 : undefined,
            WebkitBoxOrient: field === 'content' || field === 'notes' ? 'vertical' : undefined
          }}
        >
          {value || '-'}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
          커리큘럼 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selectedRows.length === 0} size="small">
            삭제({selectedRows.length})
          </Button>
          <Button variant="contained" onClick={handleAddItem} size="small" sx={{ fontSize: '12px' }}>
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
                  checked={selectedRows.length === curriculumItems.length && curriculumItems.length > 0}
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
              <TableCell sx={{ width: columnWidths.educationDate, fontWeight: 600 }}>교육일자</TableCell>
              <TableCell sx={{ width: columnWidths.time, fontWeight: 600 }}>시간</TableCell>
              <TableCell sx={{ width: columnWidths.instructor, fontWeight: 600 }}>강사</TableCell>
              <TableCell sx={{ width: columnWidths.title, fontWeight: 600 }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.content, fontWeight: 600 }}>교육내용</TableCell>
              <TableCell sx={{ width: columnWidths.notes, fontWeight: 600 }}>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((item, index) => (
              <TableRow
                key={`curriculum-${item.id}`}
                hover
                sx={{
                  minHeight: cellHeight,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell sx={{ width: columnWidths.checkbox, padding: 0, height: 48 }}>
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Checkbox
                      checked={selectedRows.includes(item.id.toString())}
                      onChange={() => handleSelectRow(item.id.toString())}
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
                    {curriculumItems.length - startIndex - index}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.educationDate, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id.toString(), 'educationDate')}
                >
                  {renderEditableCell(item, 'educationDate', item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0])}
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.time, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id.toString(), 'time')}
                >
                  {renderEditableCell(item, 'time', item.duration_minutes && item.duration_minutes > 0 ? `${item.duration_minutes}분` : '')}
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.instructor, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id.toString(), 'instructor')}
                >
                  {renderEditableCell(item, 'instructor', item.instructor || '')}
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.title, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id.toString(), 'title')}
                >
                  {renderEditableCell(item, 'title', item.session_title || '')}
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.content, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id.toString(), 'content')}
                >
                  {renderEditableCell(item, 'content', item.session_description || '')}
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.notes, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id.toString(), 'notes')}
                >
                  {renderEditableCell(item, 'notes', item.objectives || '')}
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

// 자료 탭 컴포넌트
interface Material {
  id: number;
  name: string;
  type: string;
  size: string;
  file?: File;
  uploadDate: string;
}

const MaterialTab = memo(({ recordId, currentUser }: { recordId?: number | string; currentUser?: UserProfile | null }) => {
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
        alert('파일을 업로드하려면 먼저 교육을 저장해주세요.');
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
          alert(`파일 업로드 실패: ${result.error}`);
        }
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [recordId, uploadFile, currentUser]
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
      const result = await updateFile(editingMaterialId, {
        file_name: editingMaterialText.trim()
      });

      if (result.success) {
        setEditingMaterialId(null);
        setEditingMaterialText('');
      } else {
        alert(`파일명 수정 실패: ${result.error}`);
      }
    }
  }, [editingMaterialId, editingMaterialText, updateFile]);

  const handleCancelEditMaterial = useCallback(() => {
    setEditingMaterialId(null);
    setEditingMaterialText('');
  }, []);

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      if (!confirm('파일을 삭제하시겠습니까?')) return;

      const result = await deleteFile(materialId);
      if (!result.success) {
        alert(`파일 삭제 실패: ${result.error}`);
      }
    },
    [deleteFile]
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
                        sx={{ p: 0.5 }}
                        title="수정"
                      >
                        <Typography fontSize="14px">✏️</Typography>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMaterial(fileData.id)}
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
}

export default function SecurityEducationDialog({ open, onClose, onSave, data, mode }: SecurityEducationDialogProps) {
  const [value, setValue] = useState(0);

  // 현재 로그인 사용자 정보
  const user = useUser();

  // 로그인한 사용자 정보 가져오기 (InspectionEditDialog 패턴)
  const { data: session } = useSession();

  // 마스터코드 훅 (GROUP008 서브코드 가져오기)
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // 사용자관리 훅 (담당자 목록용)
  const { users } = useSupabaseUserManagement();

  // 세션 email로 DB에서 사용자 찾기 (InspectionEditDialog 패턴)
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  // 보안교육 훅 (코드 생성용)
  const { securityEducations } = useSupabaseSecurityEducation();

  // ID 생성기 훅
  const { generateNextId } = useIdGenerator();

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

  // GROUP008 서브코드 목록 (교육유형용)
  const educationTypes = useMemo(() => {
    return getSubCodesByGroup('GROUP008');
  }, [getSubCodesByGroup]);

  // GROUP002 서브코드 목록 (상태용)
  const statusTypes = useMemo(() => {
    return getSubCodesByGroup('GROUP002');
  }, [getSubCodesByGroup]);

  // GROUP032 서브코드 목록 (출석점검용)
  const attendanceTypes = useMemo(() => {
    return getSubCodesByGroup('GROUP032');
  }, [getSubCodesByGroup]);

  // 활성 사용자 담당자 목록 생성
  const assigneeList = useMemo(() => {
    return users.filter((user) => user.status === 'active');
  }, [users]);

  // 교육 상태 관리
  const [educationState, dispatch] = useReducer(edsecurityEducationReducer, {
    educationName: '',
    description: '',
    educationType: '',
    assignee: user ? user.name : '',
    executionDate: '',
    location: '',
    status: '대기',
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
    isNew: boolean; // 새로 추가된 것인지 표시
  }>>([]);
  // 수정된 기록들 추적
  const [modifiedComments, setModifiedComments] = useState<{[key: string]: string}>({});
  // 삭제된 기록 ID들
  const [deletedCommentIds, setDeletedCommentIds] = useState<string[]>([]);
  // 유효성 검사 에러
  const [validationError, setValidationError] = useState<string>('');

  // Supabase feedbacks를 RecordTab 형식으로 변환하고 pendingComments와 합치기
  const comments = useMemo(() => {
    // 기존 DB의 feedbacks (삭제된 것 제외)
    const existingComments = feedbacks
      .filter(feedback => !deletedCommentIds.includes(String(feedback.id)))
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
    const newComments = pendingComments.map(comment => ({
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

  // 다이얼로그 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
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
        setNewComment('');
      } else {
        // 새 교육 추가 시 API에서 다음 코드 가져오기
        const initNewEducation = async () => {
          try {
            const response = await fetch('/api/security-education/next-code');
            const result = await response.json();

            if (response.ok && result.code) {
              const newCode = result.code;
              const newDate = new Date().toISOString().split('T')[0];
              const currentUserName = user ? user.name : assignees[0];
              const currentUserDepartment = user?.department || '';
              dispatch({ type: 'INIT_NEW_EDUCATION', code: newCode, registrationDate: newDate, assignee: currentUserName, team: currentUserDepartment });
            } else {
              console.error('❌ 코드 생성 API 오류:', result);
              // 실패 시 임시 코드 사용
              const tempCode = `SEC-EDU-TEMP-${Date.now()}`;
              const newDate = new Date().toISOString().split('T')[0];
              const currentUserName = user ? user.name : assignees[0];
              const currentUserDepartment = user?.department || '';
              dispatch({ type: 'INIT_NEW_EDUCATION', code: tempCode, registrationDate: newDate, assignee: currentUserName, team: currentUserDepartment });
            }
          } catch (error) {
            console.error('❌ 코드 생성 API 호출 실패:', error);
            // 실패 시 임시 코드 사용
            const tempCode = `SEC-EDU-TEMP-${Date.now()}`;
            const newDate = new Date().toISOString().split('T')[0];
            const currentUserName = user ? user.name : assignees[0];
            const currentUserDepartment = user?.department || '';
            dispatch({ type: 'INIT_NEW_EDUCATION', code: tempCode, registrationDate: newDate, assignee: currentUserName, team: currentUserDepartment });
          }
        };

        initNewEducation();
        setEducationReport({
          achievements: '',
          improvements: '',
          feedback: ''
        });
        setNewComment('');
      }
      setValue(0);
    }
  }, [open, mode, data]);

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

    setPendingComments(prev => [tempComment, ...prev]);
    setNewComment('');
  }, [newComment, currentUser, user]);

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

  const handleSave = useCallback(async () => {
    // 유효성 검사
    if (!educationState.educationType || !educationState.educationType.trim()) {
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
            record_id: String(educationIdToUse),  // 숫자를 문자열로 변환
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
            'record_id': feedbackInput.record_id,
            'record_id 타입': typeof feedbackInput.record_id,
            'description': comment.content.substring(0, 30) + '...'
          });

          await addFeedback(feedbackInput);
          console.log('✅ 기록 추가 완료:', comment.content.substring(0, 20) + '...');
        }
      } else if (pendingComments.length > 0 && !educationIdToUse) {
        console.error('❌ 기록을 저장할 수 없음: educationIdToUse가 없습니다', {
          'educationIdToUse': educationIdToUse,
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
    educationReport
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
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setValidationError('');
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
        {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button onClick={handleClose} variant="outlined" size="small" sx={{ minWidth: '60px' }}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            sx={{ minWidth: '60px' }}
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
          <CurriculumTab mode={mode} educationId={typeof data?.id === 'string' ? parseInt(data.id) : data?.id} />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <ParticipantsTab
            mode={mode}
            educationId={data?.id}
            onParticipantCountChange={handleParticipantCountChange}
            attendanceTypes={attendanceTypes}
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
          <MaterialTab recordId={data?.id} currentUser={currentUser} />
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
