'use client';

import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useUser from '../hooks/useUser';
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
  Pagination,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ITEducationTableData,
  ITEducationStatus,
  ITEducationRecord,
  EducationReport,
  educationTypeOptions,
  statusOptions,
  assigneeOptions,
  attendanceOptions
} from '../types/it-education';
import { assignees, itEducationStatusOptions, assigneeAvatars } from '../data/it-education';
import { useSupabaseItEducation, ItEducationData } from '../hooks/useSupabaseItEducation';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseItEducationCurriculum, CurriculumItem } from '../hooks/useSupabaseItEducationCurriculum';
import { useSupabaseItEducationAttendee, ParticipantItem } from '../hooks/useSupabaseItEducationAttendee';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 데이터 변환 유틸리티 함수들
const convertTableDataToRecord = (tableData: ITEducationTableData): ITEducationRecord => {
  return {
    id: tableData.id,
    registrationDate: tableData.registrationDate,
    code: tableData.code,
    educationType: tableData.educationType,
    educationName: tableData.educationName,
    location: tableData.location,
    participantCount: tableData.attendeeCount,
    executionDate: tableData.executionDate,
    status: tableData.status,
    assignee: tableData.assignee,
    team: tableData.team, // 비용관리 패턴: 필수 필드 (누락 방지)
    attachment: Boolean(tableData.attachments?.length),
    attachmentCount: tableData.attachments?.length || 0,
    attachments: tableData.attachments || [],
    isNew: false
  };
};

const convertRecordToTableData = (record: ITEducationRecord): ITEducationTableData => {
  return {
    id: record.id,
    no: record.id, // 임시로 id 사용
    registrationDate: record.registrationDate,
    code: record.code,
    educationType: record.educationType,
    educationName: record.educationName,
    description: record.description, // 교육설명 필드 추가
    location: record.location,
    attendeeCount: record.participantCount,
    executionDate: record.executionDate,
    status: record.status,
    assignee: record.assignee,
    team: record.team, // 필수 필드 (비용관리 패턴)
    department: (record as any).department || undefined, // 옵셔널
    attachments: record.attachments,
    // 교육실적보고 필드들
    achievements: record.achievements,
    improvements: record.improvements,
    education_feedback: record.education_feedback,
    report_notes: record.report_notes
  };
};

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

RecordTab.displayName = 'RecordTab';

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
  team: string;
}

interface ITEducationEditAction {
  type: 'SET_FIELD' | 'SET_EDUCATION' | 'INIT_NEW_EDUCATION' | 'RESET';
  field?: keyof ITEducationEditState;
  value?: string | number;
  education?: ITEducationRecord;
  code?: string;
  registrationDate?: string;
  team?: string;
  assignee?: string;
}

const editEducationReducer = (state: ITEducationEditState, action: ITEducationEditAction): ITEducationEditState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field!]: action.value! };
    case 'SET_EDUCATION':
      return {
        educationName: action.education!.educationName,
        description: action.education!.description || '',
        educationType: action.education!.educationType || '',
        assignee: action.education!.assignee,
        executionDate: action.education!.executionDate,
        location: action.education!.location,
        status: action.education!.status,
        participantCount: action.education!.participantCount,
        registrationDate: action.education!.registrationDate,
        code: action.education!.code,
        team: (action.education as any).team || ''
      };
    case 'INIT_NEW_EDUCATION':
      return {
        educationName: '',
        description: '',
        educationType: '',
        assignee: action.assignee || '',
        executionDate: '',
        location: '',
        status: '대기',
        participantCount: 0,
        registrationDate: action.registrationDate || new Date().toISOString().split('T')[0],
        code: action.code || '',
        team: action.team || ''
      };
    case 'RESET':
      return {
        educationName: '',
        description: '',
        educationType: '',
        assignee: '',
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
    getSubCodesByGroup,
    users,
    mode
  }: {
    educationState: ITEducationEditState;
    mode: 'add' | 'edit';
    onFieldChange: (field: keyof ITEducationEditState, value: string | number) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusColors: Record<string, any>;
    getSubCodesByGroup: (groupCode: string) => any[];
    users: any[];
  }) => {
    // TextField 직접 참조를 위한 ref
    const educationNameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);

    // TODO: useOptimizedInput 후 구현 필요 - 임시로 일반 상태 사용
    const [educationName, setEducationName] = useState(educationState.educationName);
    const [description, setDescription] = useState(educationState.description);
    const [location, setLocation] = useState(educationState.location);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // Supabase 클라이언트 생성
    const supabaseClient = React.useMemo(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }, []);

    // DB에서 직접 가져온 마스터코드 목록 state
    const [educationTypesFromDB, setEducationTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog가 열릴 때 DB에서 직접 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        // GROUP008 교육유형 조회
        const { data: group008Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP008')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setEducationTypesFromDB(group008Data || []);

        // GROUP002 상태 조회
        const { data: group002Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP002')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setStatusTypesFromDB(group002Data || []);
      };

      fetchMasterCodeData();
    }, [supabaseClient]);

    // 외부 상태 변경시 로컬 상태 동기화
    useEffect(() => {
      setEducationName(educationState.educationName);
    }, [educationState.educationName]);

    useEffect(() => {
      setDescription(educationState.description);
    }, [educationState.description]);

    useEffect(() => {
      setLocation(educationState.location);
    }, [educationState.location]);

    const handleFieldChange = useCallback(
      (field: keyof ITEducationEditState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string | number } }) => {
          onFieldChange(field, e.target.value);
        },
      []
    );

    const getStatusColor = (status: string) => {
      const colors = {
        대기: { backgroundColor: '#F5F5F5', color: '#757575' },
        계획: { backgroundColor: '#E3F2FD', color: '#1976D2' },
        진행: { backgroundColor: '#E3F2FD', color: '#1976D2' },
        진행중: { backgroundColor: '#E3F2FD', color: '#1976D2' },
        완료: { backgroundColor: '#E8F5E9', color: '#388E3C' },
        취소: { backgroundColor: '#FFEBEE', color: '#D32F2F' },
        홀딩: { backgroundColor: '#FFEBEE', color: '#D32F2F' }
      };
      return colors[status as keyof typeof colors] || { backgroundColor: '#F5F5F5', color: '#757575' };
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
            <FormControl fullWidth sx={{ flex: 1 }}>
              <InputLabel shrink>
                <span>
                  교육유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select
                value={educationState.educationType}
                onChange={handleFieldChange('educationType')}
                label="교육유형"
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';
                  return selected;
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {educationTypesFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              sx={{
                flex: 1,
                '& .MuiInputBase-input': {
                  backgroundColor: 'grey.50',
                  cursor: 'default'
                }
              }}
              label="참석수"
              type="number"
              value={educationState.participantCount}
              variant="outlined"
              InputProps={{
                readOnly: true,
                inputProps: { min: 0, max: 200 },
                endAdornment: (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    명
                  </Typography>
                )
              }}
              InputLabelProps={{ shrink: true }}
              helperText="참석자 탭에서 참석자를 추가/삭제하여 조정하세요"
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
                notched
                renderValue={(selected) => {
                  return selected;
                }}
              >
                {statusTypesFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode_name}>
                    <Chip
                      label={option.subcode_name}
                      size="small"
                      sx={{
                        ...getStatusColor(option.subcode_name),
                        fontSize: '13px',
                        fontWeight: 400,
                        height: 20
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
              value={educationState.team || ''}
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

            <TextField
              fullWidth
              label={
                <span>
                  담당자 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={educationState.assignee || ''}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment: educationState.assignee
                  ? (() => {
                      // educationState.assignee에 해당하는 사용자 찾기
                      console.log('🔍 [담당자 프로필] assignee:', educationState.assignee);
                      console.log('🔍 [담당자 프로필] users 개수:', users?.length);
                      const assigneeUser = users.find((user) => user.user_name === educationState.assignee);
                      console.log('🔍 [담당자 프로필] 찾은 assigneeUser:', assigneeUser ? {
                        user_name: assigneeUser.user_name,
                        profile_image_url: assigneeUser.profile_image_url,
                        avatar_url: assigneeUser.avatar_url
                      } : '없음');
                      return (
                        <Avatar
                          src={assigneeUser?.profile_image_url || assigneeUser?.avatar_url}
                          alt={educationState.assignee}
                          sx={{ width: 24, height: 24, mr: 0.25 }}
                        >
                          {educationState.assignee.charAt(0)}
                        </Avatar>
                      );
                    })()
                  : null
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

// 전역 임시 저장소 초기화 (window 객체에 저장하여 컴포넌트 재렌더링에도 유지)
if (typeof window !== 'undefined' && !(window as any).educationTempStorage) {
  (window as any).educationTempStorage = {
    participants: new Map<string, ParticipantItem[]>(),
    curriculum: new Map<string, CurriculumItem[]>()
  };
}

// 참석자 탭 컴포넌트 (커리큘럼탭과 동일한 패턴: 부모 state 사용)
const ParticipantsTab = memo(
  ({
    mode,
    educationId,
    onParticipantCountChange,
    canEditOwn = true,
    canEditOthers = true,
    participantItems,
    setParticipantItems,
    selectedRows,
    setSelectedRows
  }: {
    mode: 'add' | 'edit';
    educationId?: number;
    onParticipantCountChange?: (count: number) => void;
    canEditOwn?: boolean;
    canEditOthers?: boolean;
    participantItems: ParticipantItem[];
    setParticipantItems: React.Dispatch<React.SetStateAction<ParticipantItem[]>>;
    selectedRows: string[];
    setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  }) => {
    // 참석자 관리 훅 사용
    const { getAttendeesByEducationId, convertSupabaseToParticipantItem, convertParticipantItemToSupabase } =
      useSupabaseItEducationAttendee();
    const mockData = [
      {
        id: '1',
        no: 1,
        participant: '김철수',
        position: '대리',
        department: 'IT팀',
        attendanceCheck: '참석',
        opinion: '매우 유익한 교육이었습니다.',
        notes: '적극적으로 참여함'
      },
      {
        id: '2',
        no: 2,
        participant: '이영희',
        position: '과장',
        department: '개발팀',
        attendanceCheck: '참석',
        opinion: '실무에 바로 적용할 수 있는 내용이었습니다.',
        notes: ''
      },
      {
        id: '3',
        no: 3,
        participant: '박민수',
        position: '사원',
        department: '기획팀',
        attendanceCheck: '참석',
        opinion: '새로운 지식을 배울 수 있어서 좋았습니다.',
        notes: '질문을 많이 함'
      },
      {
        id: '4',
        no: 4,
        participant: '정수연',
        position: '대리',
        department: '마케팅팀',
        attendanceCheck: '참석',
        opinion: '업무 효율성 향상에 도움이 될 것 같습니다.',
        notes: ''
      },
      {
        id: '5',
        no: 5,
        participant: '최동현',
        position: '과장',
        department: 'IT팀',
        attendanceCheck: '불참',
        opinion: '',
        notes: '업무상 불참'
      },
      {
        id: '6',
        no: 6,
        participant: '김소영',
        position: '사원',
        department: '인사팀',
        attendanceCheck: '참석',
        opinion: '실용적인 내용이 많아 유익했습니다.',
        notes: ''
      },
      {
        id: '7',
        no: 7,
        participant: '이준호',
        position: '차장',
        department: '개발팀',
        attendanceCheck: '참석',
        opinion: '팀원들과 공유하겠습니다.',
        notes: '교육 자료 요청함'
      },
      {
        id: '8',
        no: 8,
        participant: '황미정',
        position: '대리',
        department: '기획팀',
        attendanceCheck: '참석',
        opinion: '다음에도 이런 교육이 있었으면 좋겠습니다.',
        notes: ''
      },
      {
        id: '9',
        no: 9,
        participant: '강태웅',
        position: '사원',
        department: '마케팅팀',
        attendanceCheck: '예정',
        opinion: '',
        notes: '신입사원'
      },
      {
        id: '10',
        no: 10,
        participant: '서지현',
        position: '과장',
        department: '영업팀',
        attendanceCheck: '참석',
        opinion: '실무 적용 가능한 좋은 내용이었습니다.',
        notes: ''
      },
      {
        id: '11',
        no: 11,
        participant: '윤성민',
        position: '대리',
        department: '기술지원팀',
        attendanceCheck: '참석',
        opinion: '기술적인 부분이 도움이 되었습니다.',
        notes: '추가 자료 요청'
      }
    ];

    // 커리큘럼탭과 동일한 패턴: 부모 state 사용 (로컬 state 제거)
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

    // 커리큘럼탭과 동일한 패턴: 데이터 로드와 임시저장은 부모에서 관리
    // participantItems와 selectedRows는 props로 받아서 사용

    // 참석자 수가 변경될 때 개요탭에 알림 (커리큘럼탭과 동일한 패턴)
    useEffect(() => {
      if (onParticipantCountChange) {
        onParticipantCountChange(participantItems.length);
      }
    }, [participantItems, onParticipantCountChange]);

    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

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

    const handleCellClick = (id: string, field: string) => {
      setEditingCell({ id, field });
    };

    const handleCellBlur = () => {
      setEditingCell(null);
    };

    const handleAddItem = () => {
      // 기본 출석점검 값을 DB에서 조회한 첫 번째 값으로 설정
      const defaultStatus = statusFromDB.length > 0 ? statusFromDB[0].subcode : '';

      const newItem: ParticipantItem = {
        id: Date.now().toString(),
        no: 1,
        participant: '',
        position: '',
        department: '',
        attendanceCheck: defaultStatus,
        opinion: '',
        notes: ''
      };
      // 새 항목을 맨 위에 추가하고 기존 항목들의 no를 재정렬
      const updatedItems = [
        newItem,
        ...participantItems.map((item, index) => ({
          ...item,
          no: index + 2
        }))
      ];
      setParticipantItems(updatedItems);
    };

    const handleDeleteSelected = () => {
      setParticipantItems(participantItems.filter((item) => !selectedRows.includes(item.id)));
      setSelectedRows([]);
    };

    const handleEditItem = (id: string, field: keyof ParticipantItem, value: string | number) => {
      setParticipantItems(participantItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
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
      opinion: 200,
      notes: 150
    };

    // 출석점검 상태별 색상 매핑 (동적)
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

    // 편집 가능한 셀 렌더링
    const renderEditableCell = (item: ParticipantItem, field: string, value: string | number) => {
      const isEditing = editingCell?.id === item.id && editingCell?.field === field;
      const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

      if (isEditing) {
        if (field === 'attendanceCheck') {
          return (
            <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
              <TextField
                select
                value={value || ''}
                onChange={(e) => {
                  // subcode_name을 subcode로 변환하여 저장
                  const selectedName = e.target.value;
                  const selectedItem = statusFromDB.find((s) => s.subcode_name === selectedName);
                  const subcodeValue = selectedItem ? selectedItem.subcode : selectedName;
                  handleEditItem(item.id, field as keyof ParticipantItem, subcodeValue);
                }}
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
                    padding: '8px 12px',
                    height: 'calc(100% - 16px)',
                    boxSizing: 'border-box'
                  }
                }}
                autoFocus
                SelectProps={{
                  renderValue: (selected) => {
                    // subcode를 subcode_name으로 변환하여 표시
                    const statusItem = statusFromDB.find((s) => s.subcode === selected || s.subcode_name === selected);
                    return statusItem ? statusItem.subcode_name : selected;
                  }
                }}
              >
                {statusFromDB.map((status) => (
                  <MenuItem key={status.subcode} value={status.subcode_name}>
                    <Chip
                      label={status.subcode_name}
                      size="small"
                      sx={{
                        fontSize: '12px',
                        ...getAttendanceColor(status.subcode_name),
                        '& .MuiChip-label': {
                          color: getAttendanceColor(status.subcode_name).color
                        }
                      }}
                    />
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          );
        }

        if (field === 'opinion' || field === 'notes') {
          return (
            <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
              <TextField
                type="text"
                value={value || ''}
                onChange={(e) => handleEditItem(item.id, field as keyof ParticipantItem, e.target.value)}
                onBlur={handleCellBlur}
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
              onChange={(e) => handleEditItem(item.id, field as keyof ParticipantItem, e.target.value)}
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
          {field === 'attendanceCheck' ? (
            <Chip
              label={(() => {
                // subcode를 subcode_name으로 변환하여 표시
                const statusItem = statusFromDB.find((s) => s.subcode === value);
                return statusItem ? statusItem.subcode_name : value || '-';
              })()}
              size="small"
              sx={{
                fontSize: '12px',
                ...getAttendanceColor(value as string),
                '& .MuiChip-label': {
                  color: getAttendanceColor(value as string).color
                }
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                whiteSpace: field === 'opinion' || field === 'notes' ? 'pre-wrap' : 'nowrap',
                wordBreak: field === 'opinion' || field === 'notes' ? 'break-word' : 'normal',
                lineHeight: field === 'opinion' || field === 'notes' ? 1.4 : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: field === 'opinion' || field === 'notes' ? '-webkit-box' : 'block',
                WebkitLineClamp: field === 'opinion' || field === 'notes' ? 2 : undefined,
                WebkitBoxOrient: field === 'opinion' || field === 'notes' ? 'vertical' : undefined
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
              disabled={!(canEditOwn || canEditOthers)}
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
                <TableCell sx={{ width: columnWidths.opinion, fontWeight: 600 }}>참석의견</TableCell>
                <TableCell sx={{ width: columnWidths.notes, fontWeight: 600 }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow
                  key={item.id}
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
                    onClick={() => handleCellClick(item.id, 'participant')}
                  >
                    {renderEditableCell(item, 'participant', item.participant)}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.position, padding: 0, height: 48 }}
                    onClick={() => handleCellClick(item.id, 'position')}
                  >
                    {renderEditableCell(item, 'position', item.position)}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.department, padding: 0, height: 48 }}
                    onClick={() => handleCellClick(item.id, 'department')}
                  >
                    {renderEditableCell(item, 'department', item.department)}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.attendanceCheck, padding: 0, height: 48 }}
                    onClick={() => handleCellClick(item.id, 'attendanceCheck')}
                  >
                    {renderEditableCell(item, 'attendanceCheck', item.attendanceCheck)}
                  </TableCell>
                  <TableCell
                    sx={{ width: columnWidths.opinion, padding: 0, height: 48 }}
                    onClick={() => handleCellClick(item.id, 'opinion')}
                  >
                    {renderEditableCell(item, 'opinion', item.opinion)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.notes, padding: 0, height: 48 }} onClick={() => handleCellClick(item.id, 'notes')}>
                    {renderEditableCell(item, 'notes', item.notes)}
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

// 커리큘럼 탭 컴포넌트 (체크리스트탭과 동일한 패턴: 부모 state 사용)
const CurriculumTab = memo(({
  mode,
  educationId,
  canEditOwn = true,
  canEditOthers = true,
  curriculumItems,
  setCurriculumItems,
  selectedRows,
  setSelectedRows
}: {
  mode: 'add' | 'edit';
  educationId?: number;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  curriculumItems: CurriculumItem[];
  setCurriculumItems: React.Dispatch<React.SetStateAction<CurriculumItem[]>>;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  // Supabase 커리큘럼 훅 사용
  const {
    loading: curriculumLoading,
    error: curriculumError,
    getCurriculumByEducationId,
    saveCurriculumByEducationId,
    convertSupabaseToCurriculumItem,
    convertCurriculumItemToSupabase
  } = useSupabaseItEducationCurriculum();

  // 커리큘럼 샘플 데이터 (fallback용)
  const mockCurriculumData = [
    {
      id: '1',
      educationDate: '2024-01-15',
      duration_minutes: '09:00-10:00',
      instructor: '김철수',
      title: 'React 기초',
      content: 'React 컴포넌트 개념 및 State 관리',
      notes: '실습 위주 진행',
      attachments: 2
    },
    {
      id: '2',
      educationDate: '2024-01-16',
      duration_minutes: '10:00-12:00',
      instructor: '이영희',
      title: 'React Hooks',
      content: 'useState, useEffect, useContext 사용법',
      notes: '코드 예제 포함',
      attachments: 3
    },
    {
      id: '3',
      educationDate: '2024-01-17',
      duration_minutes: '14:00-16:00',
      instructor: '박민수',
      title: 'TypeScript 입문',
      content: '타입 정의와 인터페이스 활용',
      notes: '실습 과제 제공',
      attachments: 1
    },
    {
      id: '4',
      educationDate: '2024-01-18',
      duration_minutes: '09:00-11:00',
      instructor: '최은지',
      title: 'Next.js 기초',
      content: '라우팅과 SSR/SSG 개념',
      notes: '프로젝트 구조 설명',
      attachments: 0
    },
    {
      id: '5',
      educationDate: '2024-01-19',
      duration_minutes: '13:00-15:00',
      instructor: '정현우',
      title: 'API 통신',
      content: 'REST API와 axios 활용법',
      notes: '에러 처리 방법 포함',
      attachments: 2
    },
    {
      id: '6',
      educationDate: '2024-01-22',
      duration_minutes: '10:00-12:00',
      instructor: '강예린',
      title: '상태 관리',
      content: 'Redux와 Context API 비교',
      notes: '실전 예제 진행',
      attachments: 4
    },
    {
      id: '7',
      educationDate: '2024-01-23',
      duration_minutes: '14:00-17:00',
      instructor: '송지훈',
      title: '테스팅',
      content: 'Jest와 React Testing Library',
      notes: '단위 테스트 작성법',
      attachments: 1
    },
    {
      id: '8',
      educationDate: '2024-01-24',
      duration_minutes: '09:00-11:00',
      instructor: '김소영',
      title: 'UI/UX 디자인',
      content: 'Material-UI 컴포넌트 활용',
      notes: '반응형 디자인 적용',
      attachments: 3
    },
    {
      id: '9',
      educationDate: '2024-01-25',
      duration_minutes: '15:00-17:00',
      instructor: '이동현',
      title: '배포 및 운영',
      content: 'Vercel 배포 및 환경변수 관리',
      notes: 'CI/CD 파이프라인 구성',
      attachments: 2
    }
  ];

  // 체크리스트탭과 동일한 패턴: 데이터 로드와 임시저장은 부모에서 관리
  // curriculumItems와 selectedRows는 props로 받아서 사용

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // 페이지네이션 계산
  const totalPages = Math.ceil(curriculumItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = curriculumItems.slice(startIndex, endIndex);

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
    const newItem: CurriculumItem = {
      id: Date.now().toString(),
      educationDate: new Date().toISOString().split('T')[0],
      duration_minutes: '',
      instructor: '',
      title: '',
      content: '',
      notes: '',
      attachments: 0
    };
    setCurriculumItems([newItem, ...curriculumItems]);
  };

  const handleDeleteSelected = () => {
    setCurriculumItems(curriculumItems.filter((item) => !selectedRows.includes(item.id)));
    setSelectedRows([]);
  };

  const handleEditItem = (id: string, field: keyof CurriculumItem, value: string | number) => {
    setCurriculumItems(curriculumItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
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
      setSelectedRows(curriculumItems.map((item) => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 50,
    no: 60,
    educationDate: 100,
    duration_minutes: 100,
    instructor: 120,
    title: 150,
    content: 200,
    notes: 150
  };

  const cellHeight = 48; // 고정 셀 높이 (줄임)

  // 편집 가능한 셀 렌더링 (소프트웨어관리 구매/유지보수이력 탭 방식 적용)
  const renderEditableCell = (item: CurriculumItem, field: string, value: string | number) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

    if (isEditing) {
      if (field === 'educationDate') {
        return (
          <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
            <TextField
              type="date"
              value={value || ''}
              onChange={(e) => handleEditItem(item.id, field as keyof CurriculumItem, e.target.value)}
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
            value={field === 'duration_minutes' && value ? String(value).replace(/분$/, '').trim() : (value || '')}
            onChange={(e) => handleEditItem(item.id, field as keyof CurriculumItem, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            placeholder={field === 'duration_minutes' ? '예: 60, 09:00-10:00, 1시간' : ''}
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
          {field === 'duration_minutes' ? (value ? String(value).replace(/분$/, '').trim() : '-') : (value || '-')}
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
            disabled={!(canEditOwn || canEditOthers)}
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
              <TableCell sx={{ width: columnWidths.duration_minutes, fontWeight: 600 }}>시간</TableCell>
              <TableCell sx={{ width: columnWidths.instructor, fontWeight: 600 }}>강사</TableCell>
              <TableCell sx={{ width: columnWidths.title, fontWeight: 600 }}>제목</TableCell>
              <TableCell sx={{ width: columnWidths.content, fontWeight: 600 }}>교육내용</TableCell>
              <TableCell sx={{ width: columnWidths.notes, fontWeight: 600 }}>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((item, index) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  minHeight: cellHeight,
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
                    {curriculumItems.length - startIndex - index}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.educationDate, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id, 'educationDate')}
                >
                  {renderEditableCell(item, 'educationDate', item.educationDate)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.duration_minutes, padding: 0, height: 48 }} onClick={() => handleCellClick(item.id, 'duration_minutes')}>
                  {renderEditableCell(item, 'duration_minutes', item.duration_minutes)}
                </TableCell>
                <TableCell
                  sx={{ width: columnWidths.instructor, padding: 0, height: 48 }}
                  onClick={() => handleCellClick(item.id, 'instructor')}
                >
                  {renderEditableCell(item, 'instructor', item.instructor)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.title, padding: 0, height: 48 }} onClick={() => handleCellClick(item.id, 'title')}>
                  {renderEditableCell(item, 'title', item.title)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.content, padding: 0, height: 48 }} onClick={() => handleCellClick(item.id, 'content')}>
                  {renderEditableCell(item, 'content', item.content)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.notes, padding: 0, height: 48 }} onClick={() => handleCellClick(item.id, 'notes')}>
                  {renderEditableCell(item, 'notes', item.notes)}
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
          {curriculumItems.length > 0
            ? `${startIndex + 1}-${Math.min(endIndex, curriculumItems.length)} of ${curriculumItems.length}`
            : '0-0 of 0'}
        </Typography>
        {curriculumItems.length > 0 && (
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

// 자료 탭 컴포넌트 - DB 기반 (보안교육관리와 동일 패턴)
const MaterialTab = memo(({ recordId, currentUser, canEditOwn = true, canEditOthers = true }: { recordId?: number | string; currentUser?: any; canEditOwn?: boolean; canEditOthers?: boolean }) => {
  // 파일 관리 훅
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.IT_EDUCATION, recordId);

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
          page: PAGE_IDENTIFIERS.IT_EDUCATION,
          record_id: String(recordId),
          // user_id는 UUID 타입이므로 숫자형 ID는 전달하지 않음
          user_id: undefined,
          user_name: currentUser?.user_name || '알 수 없음',
          team: currentUser?.department
        });

        if (!result.success) {
          setValidationError(`파일 업로드 실패: ${result.error}`);
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
        setValidationError(`파일명 수정 실패: ${result.error}`);
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
        setValidationError(`파일 삭제 실패: ${result.error}`);
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
            <Typography variant="h6" color={(canEditOwn || canEditOthers) ? 'primary.main' : 'grey.500'}>
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
interface ITEducationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ITEducationRecord) => void;
  recordId?: number;
  tasks?: ITEducationRecord[]; // 전체 tasks 배열
  // 🔐 권한 관리
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  // 변경로그 추가 함수
  addChangeLog?: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string,
    location?: string
  ) => void;
}

export default function ITEducationDialog({
  open,
  onClose,
  onSave,
  recordId,
  tasks = [],
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  addChangeLog
}: ITEducationDialogProps) {
  // recordId 유무로 모드 판단
  const mode = recordId ? 'edit' : 'add';

  // recordId로 데이터 찾기
  const data = recordId ? tasks.find((task) => task.id === recordId) : null;
  const [value, setValue] = useState(0);

  // 유효성 검증 에러 상태
  const [validationError, setValidationError] = useState<string>('');

  // Supabase 훅 사용
  const { loading, error, getItEducationById, addItEducation, updateItEducation, generateItEducationCode } = useSupabaseItEducation();

  // ✅ 공용 창고에서 마스터코드 데이터 가져오기
  const { masterCodes, users: allUsers } = useCommonData();

  console.log('🔍 [ITEducationEditDialog] masterCodes 전체:', masterCodes?.length, '개');

  // 마스터코드에서 서브코드 가져오기 함수
  const safeGetSubCodesByGroup = useCallback(
    (groupCode: string) => {
      if (!masterCodes || masterCodes.length === 0) {
        console.log(`⚠️ [ITEducationEditDialog] masterCodes가 아직 로드되지 않음`);
        // fallback: 기본값 반환
        if (groupCode === 'GROUP008') {
          return [
            { subcode: 'EDU_ONLINE', subcode_name: '온라인' },
            { subcode: 'EDU_OFFLINE', subcode_name: '오프라인' },
            { subcode: 'EDU_HYBRID', subcode_name: '하이브리드' }
          ];
        }
        if (groupCode === 'GROUP002') {
          return [
            { subcode: 'STATUS_PLAN', subcode_name: '계획' },
            { subcode: 'STATUS_PROGRESS', subcode_name: '진행중' },
            { subcode: 'STATUS_COMPLETE', subcode_name: '완료' },
            { subcode: 'STATUS_CANCEL', subcode_name: '취소' }
          ];
        }
        return [];
      }
      const subCodes = masterCodes
        .filter(code => code.group_code === groupCode && code.is_active)
        .filter(code => code.subcode && code.subcode_name); // 빈 값 필터링
      console.log(`🔍 [ITEducationEditDialog] ${groupCode} 필터링 결과:`, subCodes.length, '개', subCodes);
      return subCodes;
    },
    [masterCodes]
  );

  // 현재 로그인 사용자 정보
  const user = useUser();

  // 세션 정보 가져오기
  const { data: session } = useSession();

  console.log('🔍 [ITEducationEditDialog] allUsers:', allUsers?.length, '명');

  // 세션 email로 DB에서 사용자 찾기
  const currentUser = useMemo(() => {
    if (!session?.user?.email || allUsers.length === 0) return null;
    const found = allUsers.find((u) => u.email === session.user.email);
    console.log('🔍 [ITEducationEditDialog] currentUser:', found ? found.user_name : '없음');
    return found;
  }, [session, allUsers]);

  // 🔐 권한 체크: 데이터 소유자 확인
  const isOwner = useMemo(() => {
    if (!data || !recordId) return true; // 신규 생성인 경우 true
    const currentUserName = currentUser?.user_name;
    const isOwnerResult =
      data.createdBy === currentUserName ||
      data.assignee === currentUserName;
    return isOwnerResult;
  }, [data, recordId, currentUser]);

  // 커리큘럼 관리 훅 사용 (체크리스트탭 패턴: 데이터 로드와 저장 모두 부모에서 처리)
  const {
    getCurriculumByEducationId,
    saveCurriculumByEducationId,
    convertSupabaseToCurriculumItem,
    convertCurriculumItemToSupabase
  } = useSupabaseItEducationCurriculum();

  // 참석자 관리 훅 사용 (커리큘럼탭 패턴: 데이터 로드와 저장 모두 부모에서 처리)
  const {
    getAttendeesByEducationId,
    saveAttendeesByEducationId,
    convertSupabaseToParticipantItem,
    convertParticipantItemToSupabase
  } = useSupabaseItEducationAttendee();

  // 피드백 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.IT_EDUCATION, recordId?.toString());

  // 🔄 임시 저장: 로컬 state로 기록 관리
  const [pendingFeedbacks, setPendingFeedbacks] = useState<FeedbackData[]>([]);
  const [initialFeedbacks, setInitialFeedbacks] = useState<FeedbackData[]>([]);

  // 초기화 여부를 추적 (무한 루프 방지)
  const feedbacksInitializedRef = useRef(false);
  const feedbacksRef = useRef<FeedbackData[]>([]);

  // 교육 상태 관리
  const [educationState, dispatch] = useReducer(editEducationReducer, {
    educationName: '',
    description: '',
    educationType: '',
    assignee: '',
    executionDate: '',
    location: '',
    status: '대기',
    participantCount: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    code: '',
    team: ''
  });

  // 사용자이력 상태는 UserHistoryTab 내부에서 관리

  // 교육실적보고 상태 관리
  const [educationReport, setEducationReport] = useState<EducationReport>({
    achievements: '',
    improvements: '',
    feedback: '',
    notes: ''
  });

  // 교육실적보고 초기값 저장 (변경로그 비교용)
  const [initialEducationReport, setInitialEducationReport] = useState<EducationReport>({
    achievements: '',
    improvements: '',
    feedback: '',
    notes: ''
  });

  // 커리큘럼 상태 관리 (체크리스트탭과 동일한 패턴)
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
  const [selectedCurriculumRows, setSelectedCurriculumRows] = useState<string[]>([]);

  // 참석자 상태 관리 (커리큘럼탭과 동일한 패턴)
  const [participantItems, setParticipantItems] = useState<ParticipantItem[]>([]);
  const [selectedParticipantRows, setSelectedParticipantRows] = useState<string[]>([]);

  // feedbacks를 ref에 저장 (dependency 문제 방지)
  useEffect(() => {
    feedbacksRef.current = feedbacks;
  }, [feedbacks]);

  // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
  useEffect(() => {
    if (open && recordId && !feedbacksInitializedRef.current) {
      // feedbacks 데이터가 로드될 때까지 기다렸다가 초기화
      if (feedbacks.length > 0) {
        setPendingFeedbacks(feedbacks);
        setInitialFeedbacks(feedbacks);
        feedbacksInitializedRef.current = true;
        console.log('✅ IT교육관리 기록 초기화:', feedbacks.length, '개');
      }
    }

    // 다이얼로그 닫힐 때 초기화 플래그 리셋
    if (!open) {
      feedbacksInitializedRef.current = false;
      setPendingFeedbacks([]);
      setInitialFeedbacks([]);
    }
  }, [open, recordId, feedbacks]);

  // 피드백을 comments로 변환 (pendingFeedbacks 사용)
  const comments = useMemo(() => {
    return pendingFeedbacks.map((feedback) => {
      // user_name으로 사용자 찾기
      const feedbackUser = allUsers.find((u) => u.user_name === feedback.user_name);

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
  }, [pendingFeedbacks, allUsers]);

  // 기록 상태 관리
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

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

  // 팀을 로그인한 사용자의 부서로 자동 설정
  useEffect(() => {
    if (user && typeof user !== 'boolean' && user.department && !educationState.team && !recordId && open) {
      dispatch({ type: 'SET_FIELD', field: 'team', value: user.department });
    }
  }, [user, educationState.team, recordId, open]);

  // 담당자를 로그인한 사용자로 자동 설정
  useEffect(() => {
    if (user && typeof user !== 'boolean' && user.name && !educationState.assignee && !recordId && open) {
      dispatch({ type: 'SET_FIELD', field: 'assignee', value: user.name });
    }
  }, [user, educationState.assignee, recordId, open]);

  // 다이얼로그 열릴 때 상태 초기화 및 Supabase 데이터 로드 (비용관리 방식)
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && recordId) {
        // 편집 모드: Supabase에서 데이터 로드
        const loadEducationData = async () => {
          try {
            const supabaseData = await getItEducationById(recordId);
            console.log('🔍 Supabase 로드 데이터:', supabaseData);
            console.log('🔍 Team 값:', supabaseData?.team);
            if (supabaseData) {
              dispatch({
                type: 'SET_EDUCATION',
                education: {
                  id: recordId,
                  educationName: supabaseData.education_name,
                  description: supabaseData.description || '',
                  participantCount: supabaseData.participant_count || 0,
                  executionDate: supabaseData.execution_date,
                  registrationDate: supabaseData.registration_date,
                  code: supabaseData.code,
                  educationType: supabaseData.education_type as any,
                  assignee: supabaseData.assignee,
                  location: supabaseData.location,
                  status: supabaseData.status as any,
                  team: supabaseData.team, // 비용관리 패턴: 직접 접근
                  attachments: []
                }
              });
              console.log('✅ educationState 초기화 완료, team:', supabaseData.team);

              // 교육실적보고 데이터 로드
              const tempKey = `it_education_report_temp_${recordId}`;
              const tempData = sessionStorage.getItem(tempKey);

              const reportData = {
                achievements: supabaseData.achievements || '',
                improvements: supabaseData.improvements || '',
                feedback: supabaseData.education_feedback || '',
                notes: supabaseData.report_notes || ''
              };

              // 초기값 저장 (변경로그 비교용)
              setInitialEducationReport(reportData);

              if (tempData) {
                const parsedTempData = JSON.parse(tempData);
                setEducationReport(parsedTempData);
              } else {
                setEducationReport(reportData);
              }

              // 커리큘럼 데이터 로드 (체크리스트탭 패턴)
              console.log('🔄 커리큘럼 데이터 로드 중:', { educationId: recordId });
              try {
                const curriculumData = await getCurriculumByEducationId(recordId);
                const items = curriculumData.map(convertSupabaseToCurriculumItem);
                setCurriculumItems(items);
                console.log('✅ 커리큘럼 데이터 로드 완료:', { count: items.length });
              } catch (error) {
                console.error('❌ 커리큘럼 데이터 로드 실패:', error);
                setCurriculumItems([]);
              }

              // 참석자 데이터 로드 (커리큘럼탭과 동일한 패턴)
              console.log('🔄 참석자 데이터 로드 중:', { educationId: recordId });
              try {
                const participantData = await getAttendeesByEducationId(recordId);
                const items = participantData.map(convertSupabaseToParticipantItem);
                setParticipantItems(items);
                console.log('✅ 참석자 데이터 로드 완료:', { count: items.length });
              } catch (error) {
                console.error('❌ 참석자 데이터 로드 실패:', error);
                setParticipantItems([]);
              }
            }
          } catch (error) {
            console.error('데이터 로드 실패:', error);
          }
        };
        loadEducationData();
        setNewComment('');
      } else if (!recordId) {
        // 추가 모드: 코드 생성
        const initializeNewEducation = async () => {
          try {
            const newCode = await generateItEducationCode();
            dispatch({ type: 'SET_FIELD', field: 'code', value: newCode });
          } catch (error) {
            console.error('코드 생성 실패:', error);
            const fallbackCode = `IT-EDU-24-${String(Date.now()).slice(-3)}`;
            dispatch({ type: 'SET_FIELD', field: 'code', value: fallbackCode });
          }
        };
        initializeNewEducation();

        // 교육실적보고 초기화
        setEducationReport({
          achievements: '',
          improvements: '',
          feedback: '',
          notes: ''
        });

        // 커리큘럼 초기화 (체크리스트탭 패턴)
        setCurriculumItems([]);
        setSelectedCurriculumRows([]);

        // 참석자 초기화 (커리큘럼탭과 동일한 패턴)
        setParticipantItems([]);
        setSelectedParticipantRows([]);

        setNewComment('');
      }
      setValue(0);
    }
  }, [open, recordId, getItEducationById, generateItEducationCode, mode, getCurriculumByEducationId, convertSupabaseToCurriculumItem, getAttendeesByEducationId, convertSupabaseToParticipantItem]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleFieldChange = useCallback((field: keyof ITEducationEditState, value: string | number) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // 교육실적보고 변경 핸들러
  const handleEducationReportChange = useCallback(
    (field: keyof EducationReport, value: string) => {
      console.log(`🔥 교육실적보고 입력 감지: field=${field}, value="${value}"`);

      // 로컬 상태 즉시 업데이트
      const updatedReport = {
        ...educationReport,
        [field]: value
      };
      setEducationReport(updatedReport);

      // sessionStorage에 임시 저장
      if (data?.id) {
        const tempKey = `it_education_report_temp_${data.id}`;
        sessionStorage.setItem(tempKey, JSON.stringify(updatedReport));
        console.log(`💾 교육실적보고 임시저장: ${tempKey}`, updatedReport);
      }
    },
    [educationReport, data]
  );

  // 참석자 수 변경 핸들러 (참석자 탭에서 호출됨)
  const handleParticipantCountChange = useCallback((count: number) => {
    dispatch({ type: 'SET_FIELD', field: 'participantCount', value: count });
  }, []);

  // 🔄 기록탭 핸들러 함수들 - 로컬 state만 변경 (임시 저장)
  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !recordId) return;

    const currentUserName = currentUser?.user_name || (user && typeof user !== 'boolean' ? user.name : null) || '현재 사용자';
    const currentTeam = currentUser?.department || (user && typeof user !== 'boolean' ? user.department : null) || '';
    const currentPosition = currentUser?.position || '';
    const currentProfileImage = currentUser?.profile_image_url || '';
    const currentRole = currentUser?.role || (user && typeof user !== 'boolean' ? user.role : null) || '';

    // 로컬 임시 ID 생성
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newFeedback: FeedbackData = {
      id: tempId,
      page: PAGE_IDENTIFIERS.IT_EDUCATION,
      record_id: recordId.toString(),
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
  }, [newComment, recordId, currentUser, user]);

  const handleEditComment = useCallback((id: string, content: string) => {
    setEditingCommentId(id);
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

  const handleDeleteComment = useCallback((id: string) => {
    // 로컬 state에서만 제거 (즉시 반응)
    setPendingFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    console.log('🟢 [ITEducationEditDialog] handleSave 시작');
    try {
      // 필수 입력 검증
      if (!educationState.educationName || !educationState.educationName.trim()) {
        setValidationError('교육명을 입력해주세요.');
        return;
      }

      if (!educationState.executionDate || !educationState.executionDate.trim()) {
        setValidationError('실시일을 선택해주세요.');
        return;
      }

      if (!educationState.location || !educationState.location.trim()) {
        setValidationError('실시장소를 입력해주세요.');
        return;
      }

      if (!educationState.educationType || !educationState.educationType.trim()) {
        setValidationError('교육유형을 선택해주세요.');
        return;
      }

      // 에러 초기화
      setValidationError('');

      // sessionStorage에서 최신 교육실적보고 데이터 확인
      let finalEducationReport = educationReport;
      if (data?.id) {
        const tempKey = `it_education_report_temp_${data.id}`;
        const tempData = sessionStorage.getItem(tempKey);
        console.log(`🔍 sessionStorage 임시 데이터 확인:`, tempData);
        if (tempData) {
          const parsedTempData = JSON.parse(tempData);
          console.log(`🔍 파싱된 임시 데이터:`, parsedTempData);
          finalEducationReport = parsedTempData;
          console.log(`🔄 최종 사용할 educationReport:`, finalEducationReport);
        }
      }

      console.log('💾 교육실적보고 데이터 저장 전 확인:', {
        achievements: finalEducationReport.achievements,
        improvements: finalEducationReport.improvements,
        feedback: finalEducationReport.feedback,
        notes: finalEducationReport.notes
      });

      console.log('🔍 교육실적보고 각 필드 상세 확인:');
      console.log('achievements:', `"${finalEducationReport.achievements}"`, 'length:', finalEducationReport.achievements?.length || 0);
      console.log('improvements:', `"${finalEducationReport.improvements}"`, 'length:', finalEducationReport.improvements?.length || 0);
      console.log('feedback:', `"${finalEducationReport.feedback}"`, 'length:', finalEducationReport.feedback?.length || 0);
      console.log('notes:', `"${finalEducationReport.notes}"`, 'length:', finalEducationReport.notes?.length || 0);

      console.log('💾 저장 전 educationState.team:', educationState.team);

      // 비용관리 패턴: 필수 필드는 항상 포함 (조건부 할당 금지)
      const supabaseData = {
        registration_date: educationState.registrationDate,
        code: educationState.code,
        education_type: educationState.educationType,
        education_name: educationState.educationName,
        description: educationState.description,
        location: educationState.location,
        participant_count: educationState.participantCount,
        execution_date: educationState.executionDate,
        status: educationState.status,
        assignee: educationState.assignee,
        team: educationState.team, // 비용관리 패턴: 항상 포함 (필수 필드)
        // 교육실적보고 필드들 (빈 문자열은 null로 변환)
        achievements: finalEducationReport.achievements?.trim() || null,
        improvements: finalEducationReport.improvements?.trim() || null,
        education_feedback: finalEducationReport.feedback?.trim() || null,
        report_notes: finalEducationReport.notes?.trim() || null
      };

      let result;
      if (recordId) {
        result = await updateItEducation(recordId, supabaseData);
      } else {
        result = await addItEducation(supabaseData);
      }

      if (result) {
        // 커리큘럼 데이터 저장 (체크리스트탭 패턴: 부모 state 직접 사용)
        try {
          console.log('💾 커리큘럼 데이터 저장 중...', { educationId: result.id, curriculumCount: curriculumItems.length });
          const curriculumData = curriculumItems.map((item, index) => convertCurriculumItemToSupabase(item, index + 1));
          const saveSuccess = await saveCurriculumByEducationId(result.id, curriculumData);

          if (saveSuccess) {
            console.log('✅ 커리큘럼 데이터 저장 완료');

            // 캐시 무효화 및 최신 데이터 다시 로드
            const { clearCache, createCacheKey } = await import('../utils/cacheUtils');
            const cacheKey = createCacheKey('it_education_curriculum', `edu_${result.id}`);
            clearCache(cacheKey);
            console.log('🗑️ 커리큘럼 캐시 무효화 완료');

            // 최신 데이터 다시 로드
            const freshData = await getCurriculumByEducationId(result.id);
            const freshItems = freshData.map(convertSupabaseToCurriculumItem);
            setCurriculumItems(freshItems);
            console.log('🔄 최신 커리큘럼 데이터 로드 완료:', { count: freshItems.length });
          }
        } catch (curriculumError) {
          console.error('❌ 커리큘럼 저장 실패:', curriculumError);
          // 커리큘럼 저장 실패해도 메인 교육 데이터는 저장 완료된 상태
        }

        // 참석자 데이터 저장 (커리큘럼탭 패턴: 부모 state 직접 사용)
        try {
          console.log('💾 참석자 데이터 저장 중...', { educationId: result.id, participantCount: participantItems.length });
          const participantData = participantItems.map(convertParticipantItemToSupabase);
          const saveSuccess = await saveAttendeesByEducationId(result.id, participantData);

          if (saveSuccess) {
            console.log('✅ 참석자 데이터 저장 완료');

            // 캐시 무효화 및 최신 데이터 다시 로드
            const { clearCache, createCacheKey } = await import('../utils/cacheUtils');
            const cacheKey = createCacheKey('it_education_attendee', `edu_${result.id}`);
            clearCache(cacheKey);
            console.log('🗑️ 참석자 캐시 무효화 완료');

            // 최신 데이터 다시 로드
            const freshData = await getAttendeesByEducationId(result.id);
            const freshItems = freshData.map(convertSupabaseToParticipantItem);
            setParticipantItems(freshItems);
            console.log('🔄 최신 참석자 데이터 로드 완료:', { count: freshItems.length });
          }
        } catch (attendeeError) {
          console.error('❌ 참석자 저장 실패:', attendeeError);
          // 참석자 저장 실패해도 메인 교육 데이터는 저장 완료된 상태
        }

        // 🔄 기록 탭 변경사항 DB 저장
        console.log('💾 기록 탭 변경사항 저장 시작');
        console.time('⏱️ 기록 저장 Total');

        if (result.id) {
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

        // 🔄 교육실적보고 변경로그 추가 (편집 모드일 때만)
        if (recordId && addChangeLog) {
          const taskCode = result.code || `IT-EDU-${result.id}`;
          const educationName = result.education_name || 'IT교육';

          // 성과 변경
          if (initialEducationReport.achievements !== finalEducationReport.achievements) {
            console.log('🔍 [ITEducationEditDialog] 성과 변경로그 생성 - location: 교육실적보고탭');
            addChangeLog(
              '수정',
              taskCode,
              `IT교육관리 ${educationName}(${taskCode}) 교육실적보고의 성과가 ${initialEducationReport.achievements || '(없음)'} → ${finalEducationReport.achievements || '(없음)'}로 수정 되었습니다.`,
              result.team || '미분류',
              initialEducationReport.achievements || '',
              finalEducationReport.achievements || '',
              '성과',
              educationName,
              '교육실적보고탭'
            );
          }

          // 개선사항 변경
          if (initialEducationReport.improvements !== finalEducationReport.improvements) {
            addChangeLog(
              '수정',
              taskCode,
              `IT교육관리 ${educationName}(${taskCode}) 교육실적보고의 개선사항이 ${initialEducationReport.improvements || '(없음)'} → ${finalEducationReport.improvements || '(없음)'}로 수정 되었습니다.`,
              result.team || '미분류',
              initialEducationReport.improvements || '',
              finalEducationReport.improvements || '',
              '개선사항',
              educationName,
              '교육실적보고탭'
            );
          }

          // 교육소감 변경
          if (initialEducationReport.feedback !== finalEducationReport.feedback) {
            addChangeLog(
              '수정',
              taskCode,
              `IT교육관리 ${educationName}(${taskCode}) 교육실적보고의 교육소감이 ${initialEducationReport.feedback || '(없음)'} → ${finalEducationReport.feedback || '(없음)'}로 수정 되었습니다.`,
              result.team || '미분류',
              initialEducationReport.feedback || '',
              finalEducationReport.feedback || '',
              '교육소감',
              educationName,
              '교육실적보고탭'
            );
          }

          // 비고 변경
          if (initialEducationReport.notes !== finalEducationReport.notes) {
            addChangeLog(
              '수정',
              taskCode,
              `IT교육관리 ${educationName}(${taskCode}) 교육실적보고의 비고가 ${initialEducationReport.notes || '(없음)'} → ${finalEducationReport.notes || '(없음)'}로 수정 되었습니다.`,
              result.team || '미분류',
              initialEducationReport.notes || '',
              finalEducationReport.notes || '',
              '비고',
              educationName,
              '교육실적보고탭'
            );
          }
        }

        // 기존 UI 업데이트를 위한 데이터 구조로 변환
        const educationData: ITEducationRecord = {
          id: result.id,
          registrationDate: result.registration_date,
          code: result.code,
          educationType: result.education_type as any,
          educationName: result.education_name,
          description: result.description || '',
          location: result.location,
          participantCount: result.participant_count || 0,
          executionDate: result.execution_date,
          status: result.status as any,
          assignee: result.assignee,
          team: result.team, // 비용관리 패턴: 필수 필드 (프론트 손실 방지)
          attachment: false,
          attachmentCount: 0,
          attachments: [],
          // 교육실적보고 필드들
          achievements: result.achievements,
          improvements: result.improvements,
          education_feedback: result.education_feedback,
          report_notes: result.report_notes,
          isNew: mode === 'add'
        };

        console.log('🔵 [ITEducationEditDialog] onSave 호출 직전 - educationData:', {
          id: educationData.id,
          achievements: educationData.achievements,
          improvements: educationData.improvements,
          education_feedback: educationData.education_feedback,
          report_notes: educationData.report_notes
        });

        onSave(educationData);

        console.log('🟣 [ITEducationEditDialog] onSave 호출 완료');

        // 저장 성공 시 임시 저장소 정리
        const tempKey = `${mode}_${result.id || 'new'}`;
        const tempStorage = (window as any).educationTempStorage;
        if (tempStorage) {
          tempStorage.participants?.delete(tempKey);
          tempStorage.curriculum?.delete(tempKey);
          console.log('🗑️ 임시 저장소 정리:', { key: tempKey });
        }

        // sessionStorage에서 교육실적보고 임시 데이터 삭제
        if (result.id) {
          const reportTempKey = `it_education_report_temp_${result.id}`;
          sessionStorage.removeItem(reportTempKey);
          console.log(`🗑️ 교육실적보고 임시저장 데이터 삭제: ${reportTempKey}`);
        }

        onClose();
      } else {
        console.error('데이터 저장 실패');
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
    }
  }, [
    educationState,
    data,
    mode,
    onSave,
    onClose,
    addItEducation,
    updateItEducation,
    saveCurriculumByEducationId,
    saveAttendeesByEducationId,
    pendingFeedbacks,
    initialFeedbacks,
    feedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    curriculumItems,
    convertCurriculumItemToSupabase,
    getCurriculumByEducationId,
    convertSupabaseToCurriculumItem,
    participantItems,
    convertParticipantItemToSupabase,
    getAttendeesByEducationId,
    convertSupabaseToParticipantItem,
    educationReport,
    initialEducationReport,
    addChangeLog,
    recordId
  ]);

  const handleClose = useCallback(() => {
    setValidationError(''); // 에러 상태 초기화
    onClose();
    dispatch({ type: 'RESET' });
    setEducationReport({
      achievements: '',
      improvements: '',
      feedback: '',
      notes: ''
    });
    setInitialEducationReport({
      achievements: '',
      improvements: '',
      feedback: '',
      notes: ''
    });
    // 커리큘럼 초기화 (체크리스트탭 패턴)
    setCurriculumItems([]);
    setSelectedCurriculumRows([]);
    // 참석자 초기화 (커리큘럼탭과 동일한 패턴)
    setParticipantItems([]);
    setSelectedParticipantRows([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    // 🔄 기록 탭 임시 데이터 초기화
    setPendingFeedbacks([]);
    setInitialFeedbacks([]);
  }, [onClose]);

  return (
    <Dialog
      key={open ? (recordId || 'new') : 'closed'}
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
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <Box>
          <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
            IT교육관리 편집
          </Typography>
          {mode === 'edit' && educationState.educationName && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
              {educationState.educationName} ({educationState.code})
            </Typography>
          )}
        </Box>
        {/* 🔐 권한 체크: 새 교육(recordId 없음)은 canCreateData 또는 canEditOwn, 기존 교육은 isOwner 확인 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={(!data || !recordId) ? !(canCreateData || canEditOwn) : !(canEditOthers || (canEditOwn && isOwner))}
            sx={{
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
            disabled={loading || ((!data || !recordId) ? !(canCreateData || canEditOwn) : !(canEditOthers || (canEditOwn && isOwner)))}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {mode === 'add' && !user ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              사용자 정보를 불러오는 중...
            </Typography>
          </Box>
        ) : (
          <>
            <Box>
              <Tabs value={value} onChange={handleChange} aria-label="교육관리 탭" sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
                getSubCodesByGroup={safeGetSubCodesByGroup}
                users={allUsers}
                mode={mode}
              />
            </TabPanel>

            <TabPanel value={value} index={1}>
              <CurriculumTab
                mode={mode}
                educationId={data?.id}
                canEditOwn={canEditOwn && isOwner}
                canEditOthers={canEditOthers}
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
                canEditOwn={canEditOwn && isOwner}
                canEditOthers={canEditOthers}
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
                currentUserName={currentUser?.user_name || (user && typeof user !== 'boolean' ? user.name : undefined)}
                currentUserAvatar={currentUser?.profile_image_url}
                currentUserRole={currentUser?.role || (user && typeof user !== 'boolean' ? user.role : undefined)}
                currentUserDepartment={currentUser?.department || (user && typeof user !== 'boolean' ? user.department : undefined)}
              />
            </TabPanel>

            <TabPanel value={value} index={5}>
              <MaterialTab recordId={recordId} currentUser={currentUser} canEditOwn={canEditOwn && isOwner} canEditOthers={canEditOthers} />
            </TabPanel>
          </>
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
