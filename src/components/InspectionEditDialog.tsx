'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  TextField,
  FormControl,
  MenuItem,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Select,
  Stack,
  Chip,
  InputLabel,
  Checkbox,
  Pagination
} from '@mui/material';
import { Add, Trash, AttachSquare } from '@wandersonalwes/iconsax-react';
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import { useSupabaseSecurityInspectionOpl, OPLItem } from '../hooks/useSupabaseSecurityInspectionOpl';
import { useDepartmentNames } from '../hooks/useDepartmentNames';
import { useSupabaseUserManagement } from '../hooks/useSupabaseUserManagement';
import { useSupabaseChecklistManagement } from '../hooks/useSupabaseChecklistManagement';
import { useSupabaseChecklistEditor } from '../hooks/useSupabaseChecklistEditor';
import { useSupabaseSecurityInspectionChecksheet } from '../hooks/useSupabaseSecurityInspectionChecksheet';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { InspectionTableData, InspectionStatus } from '../types/inspection';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { assignees, assigneeAvatars, inspectionStatusColors, inspectionTypeOptions, inspectionTargetOptions } from '../data/inspection';
import { ChecklistRecord, ChecklistEditorItem } from '../types/checklist';
import { sampleChecklistData, checklistItemTemplates } from '../data/checklist';
import { useSession } from 'next-auth/react';

interface InspectionEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (inspection: InspectionTableData) => void;
  inspection?: InspectionTableData | null;
  generateInspectionCode?: () => Promise<string>;
  inspectionTypes?: string[];
}

// 더 이상 사용하지 않음 - 실제 DB 데이터 사용
// const inspectionChecklistData: ChecklistRecord[] = sampleChecklistData.map((item) => ({
//   ...item,
//   editorData:
//     item.editorData && item.editorData.length > 0
//       ? item.editorData
//       : checklistItemTemplates[item.title] || []
// }));

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

    const totalPages = Math.ceil(comments.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedComments = comments.slice(startIndex, endIndex);

    return (
      <Box sx={{ height: '720px', display: 'flex', flexDirection: 'column', px: 5, pt: 3, position: 'relative', overflow: 'hidden' }}>
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
                  <Avatar src={comment.avatar} sx={{ width: 30, height: 30 }}>
                    {comment.author.charAt(0)}
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
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

RecordTab.displayName = 'RecordTab';

export default function InspectionEditDialog({
  open,
  onClose,
  onSave,
  inspection,
  generateInspectionCode,
  inspectionTypes = []
}: InspectionEditDialogProps) {
  const [activeTab, setActiveTab] = useState(0);

  // 체크리스트 상태 관리
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | string>('');
  const [checklistItems, setChecklistItems] = useState<ChecklistEditorItem[]>([]);
  const [checklistEvaluationType, setChecklistEvaluationType] = useState<EvaluationType>('3단계');

  // 첨부파일 다이얼로그 상태
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [tempAttachments, setTempAttachments] = useState<Array<{ name: string; url: string; size: number }>>([]);

  // 기록탭 상태 관리
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // 🔄 임시 저장: 로컬 state로 기록 관리
  const [pendingFeedbacks, setPendingFeedbacks] = useState<FeedbackData[]>([]);
  const [initialFeedbacks, setInitialFeedbacks] = useState<FeedbackData[]>([]);

  // 초기화 여부를 추적 (무한 루프 방지)
  const feedbacksInitializedRef = useRef(false);
  const feedbacksRef = useRef<FeedbackData[]>([]);

  // 자료탭 상태 관리
  const [materials, setMaterials] = useState<Array<{ id: number; name: string; type: string; size: string; uploadDate: string }>>([]);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  // OPL 관련 상태
  const [oplItems, setOplItems] = useState<OPLItem[]>([]);
  const [editingOplId, setEditingOplId] = useState<number | null>(null);
  const [editingOplField, setEditingOplField] = useState<string | null>(null);
  const [editingOplText, setEditingOplText] = useState('');
  const [selectedOplItems, setSelectedOplItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase OPL 훅
  const {
    loading: oplLoading,
    error: oplError,
    getOplItemsByInspectionId,
    addOplItem,
    updateOplItem,
    deleteOplItem,
    deleteOplItems,
    generateOplCode,
    uploadOplImage
  } = useSupabaseSecurityInspectionOpl();

  // 피드백 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.SECURITY_INSPECTION, inspection?.id?.toString());

  // 마스터코드 훅 - GROUP002, GROUP033, GROUP034 서브코드 가져오기
  const { getSubCodesByGroup, subCodes } = useSupabaseMasterCode3();
  const [statusOptions, setStatusOptions] = useState<Array<{ code: string; name: string }>>([]);

  // 부서명 훅
  const { departmentOptions } = useDepartmentNames();

  // 사용자관리 훅
  const { users } = useSupabaseUserManagement();

  // 로그인한 사용자 정보 가져오기
  const { data: session } = useSession();

  // 세션 email로 DB에서 사용자 찾기
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  const currentUserCode = currentUser?.user_code || '';

  // feedbacks를 ref에 저장 (dependency 문제 방지)
  useEffect(() => {
    feedbacksRef.current = feedbacks;
  }, [feedbacks]);

  // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
  useEffect(() => {
    if (open && inspection?.id && !feedbacksInitializedRef.current) {
      // feedbacks 데이터가 로드될 때까지 기다렸다가 초기화
      if (feedbacks.length > 0) {
        setPendingFeedbacks(feedbacks);
        setInitialFeedbacks(feedbacks);
        feedbacksInitializedRef.current = true;
        console.log('✅ 보안점검관리 기록 초기화:', feedbacks.length, '개');
      }
    }

    // 다이얼로그 닫힐 때 초기화 플래그 리셋
    if (!open) {
      feedbacksInitializedRef.current = false;
      setPendingFeedbacks([]);
      setInitialFeedbacks([]);
    }
  }, [open, inspection?.id, feedbacks]);

  // Supabase feedbacks를 RecordTab 형식으로 변환 (pendingFeedbacks 사용)
  const comments = React.useMemo(() => {
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

  // 체크리스트관리 훅
  const { checklists, loading: checklistsLoading } = useSupabaseChecklistManagement();

  // 체크리스트 에디터 훅
  const { fetchEditorItems, loading: editorLoading } = useSupabaseChecklistEditor();

  // 체크시트 훅
  const {
    checksheetItems,
    loading: checksheetLoading,
    fetchChecksheetItems,
    fetchChecksheetItemsByChecklist,
    createChecksheetItems,
    updateChecksheetItem,
    deleteChecksheetItem,
    deleteAllChecksheetItems
  } = useSupabaseSecurityInspectionChecksheet();

  // GROUP033의 서브코드들 가져오기 (점검유형)
  const inspectionTypeOptionsFromMasterCode = React.useMemo(() => {
    const group033SubCodes = getSubCodesByGroup('GROUP033');
    console.log('🔍 InspectionEditDialog - GROUP033 서브코드:', group033SubCodes);
    return group033SubCodes.filter((subCode) => subCode.subcode_status === 'active');
  }, [getSubCodesByGroup, subCodes]);

  // GROUP034의 서브코드들 가져오기 (점검대상)
  const inspectionTargetOptionsFromMasterCode = React.useMemo(() => {
    const group034SubCodes = getSubCodesByGroup('GROUP034');
    console.log('🔍 InspectionEditDialog - GROUP034 서브코드:', group034SubCodes);
    return group034SubCodes.filter((subCode) => subCode.subcode_status === 'active');
  }, [getSubCodesByGroup, subCodes]);

  // 활성화된 사용자 목록 (담당자용)
  const activeUsers = React.useMemo(() => {
    return users.filter((user) => user.is_active && user.status === 'active');
  }, [users]);

  // 평가 유형 정의
  type EvaluationType = '3단계' | '5단계';

  // 평가 옵션 정의
  const evaluationOptions = {
    '3단계': ['미흡', '보통', '우수'],
    '5단계': ['매우 부족', '미흡', '보통', '양호', '매우 우수']
  };

  // OPL 구버전 상태 관리 (제거됨 - 새버전은 100번째 줄에 있음)

  // 폼 상태 관리
  const [formData, setFormData] = useState({
    inspectionContent: inspection?.inspectionContent || '',
    inspectionType: inspection?.inspectionType || '', // 마스터코드에서 로드될 때까지 빈 문자열
    inspectionTarget: inspection?.inspectionTarget || '', // 마스터코드에서 로드될 때까지 빈 문자열
    assignee: inspection?.assignee || '',
    inspectionDate: inspection?.inspectionDate || new Date().toISOString().split('T')[0],
    status: inspection?.status || '', // 마스터코드에서 로드될 때까지 빈 문자열
    code: inspection?.code || '',
    registrationDate: inspection?.registrationDate || new Date().toISOString().split('T')[0],
    team: inspection?.team || '', // 부서 옵션에서 로드될 때까지 빈 문자열
    details: inspection?.details || '',
    performance: inspection?.performance || '',
    improvements: inspection?.improvements || '',
    thoughts: inspection?.thoughts || '',
    notes: inspection?.notes || ''
  });

  // 점검유형과 점검대상은 사용자가 직접 선택하도록 자동 설정 제거

  // 마스터코드가 로드되고 상태가 없을 때 첫 번째 값으로 설정
  React.useEffect(() => {
    if (statusOptions.length > 0 && !formData.status && !inspection) {
      setFormData((prev) => ({
        ...prev,
        status: statusOptions[0].name
      }));
    }
  }, [statusOptions, formData.status, inspection]);

  // 팀을 로그인한 사용자의 부서로 자동 설정
  React.useEffect(() => {
    if (currentUser?.department && !formData.team && !inspection) {
      setFormData((prev) => ({
        ...prev,
        team: currentUser.department
      }));
    }
  }, [currentUser, formData.team, inspection]);

  // 담당자를 로그인한 사용자로 자동 설정
  React.useEffect(() => {
    if (currentUser && !formData.assignee && !inspection && activeUsers.length > 0) {
      // activeUsers에서 현재 로그인한 사용자 찾기
      const currentActiveUser = activeUsers.find((user) => user.user_code === currentUserCode);

      if (currentActiveUser) {
        setFormData((prev) => ({
          ...prev,
          assignee: currentActiveUser.user_name
        }));
      }
    }
  }, [currentUser, currentUserCode, formData.assignee, inspection, activeUsers]);

  // GROUP002 상태 옵션 로드
  useEffect(() => {
    try {
      const subcodes = getSubCodesByGroup('GROUP002');
      const options = subcodes.map((item) => ({
        code: item.subcode,
        name: item.subcode_name
      }));
      setStatusOptions(options);
    } catch (error) {
      console.error('상태 옵션 로드 실패:', error);
      // 기본값 설정
      setStatusOptions([
        { code: 'WAIT', name: '대기' },
        { code: 'PROGRESS', name: '진행' },
        { code: 'COMPLETE', name: '완료' }
      ]);
    }
  }, [getSubCodesByGroup]);

  // inspection prop 변경시 formData 업데이트
  useEffect(() => {
    if (inspection) {
      setFormData({
        inspectionContent: inspection.inspectionContent || '',
        inspectionType: inspection.inspectionType || '', // 마스터코드에서 로드됨
        inspectionTarget: inspection.inspectionTarget || '', // 마스터코드에서 로드됨
        assignee: inspection.assignee || '',
        inspectionDate: inspection.inspectionDate || new Date().toISOString().split('T')[0],
        status: inspection.status || '', // 마스터코드에서 로드됨
        code: inspection.code || '',
        registrationDate: inspection.registrationDate || new Date().toISOString().split('T')[0],
        team: inspection.team || '개발팀',
        details: inspection.details || '',
        performance: inspection.performance || '',
        improvements: inspection.improvements || '',
        thoughts: inspection.thoughts || '',
        notes: inspection.notes || ''
      });

      // OPL 데이터 로드
      if (inspection.id) {
        loadOplItems(inspection.id);
      }

      // 체크시트 데이터 로드
      if (inspection.id) {
        // API를 직접 호출하여 checklist_id 정보 포함된 원본 데이터 가져오기
        fetch(`/api/security-inspection-checksheet?inspection_id=${inspection.id}`)
          .then((res) => res.json())
          .then((result) => {
            if (result.success && result.data && result.data.length > 0) {
              const checksheetData = result.data;

              // 첫 번째 항목의 checklist_id를 추출하여 selectedChecklistId 설정
              if (checksheetData[0].checklist_id) {
                setSelectedChecklistId(checksheetData[0].checklist_id);
                console.log('✅ 저장된 체크리스트 ID 복원:', checksheetData[0].checklist_id);
              }

              // ChecklistEditorItem으로 변환
              const items = checksheetData.map((data: any) => ({
                id: data.id,
                majorCategory: data.major_category,
                minorCategory: data.minor_category,
                title: data.title,
                description: data.description || '',
                evaluation: data.evaluation || '',
                score: data.score || 0,
                attachments: data.attachments || []
              }));

              setChecklistItems(items);
            }
          })
          .catch((err) => {
            console.error('❌ 체크시트 데이터 로드 실패:', err);
          });
      }
    } else {
      // 새로운 점검의 경우 OPL 초기화
      setOplItems([]);
    }
  }, [inspection]);

  // OPL 항목 로드 함수
  const loadOplItems = async (inspectionId: number) => {
    try {
      const items = await getOplItemsByInspectionId(inspectionId);
      setOplItems(items);
    } catch (error) {
      console.error('OPL 항목 로드 실패:', error);
    }
  };

  // 폼 필드 변경 핸들러
  const handleFieldChange = useCallback(
    (field: string) => (event: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    },
    []
  );

  // 체크리스트 선택 핸들러
  const handleChecklistChange = useCallback(
    async (checklistId: number | string) => {
      console.log('🔍 체크리스트 선택:', checklistId);

      // 다른 체크리스트로 변경하려는 경우 경고
      if (selectedChecklistId && selectedChecklistId !== checklistId && checklistItems.length > 0) {
        const confirmed = window.confirm('다른 체크리스트를 선택하면 현재 작성 중인 내용이 초기화됩니다. 계속하시겠습니까?');
        if (!confirmed) {
          return;
        }
      }

      setSelectedChecklistId(checklistId);

      if (checklistId) {
        try {
          // 다른 체크리스트로 변경하는 경우 기존 데이터 삭제
          if (selectedChecklistId && selectedChecklistId !== checklistId && inspection?.id) {
            console.log('🗑️ 기존 체크리스트 데이터 삭제 중...', {
              inspectionId: inspection.id,
              oldChecklistId: selectedChecklistId,
              newChecklistId: checklistId
            });
            await deleteAllChecksheetItems(inspection.id);
            console.log('✅ 기존 체크리스트 데이터 삭제 완료');
          }

          // 먼저 DB에 저장된 체크시트 데이터가 있는지 확인
          if (inspection?.id) {
            console.log('🔍 DB에 저장된 체크시트 데이터 확인 중...', {
              inspectionId: inspection.id,
              checklistId: Number(checklistId)
            });
            const savedItems = await fetchChecksheetItemsByChecklist(inspection.id, Number(checklistId));

            if (savedItems && savedItems.length > 0) {
              console.log('✅ 기존 저장된 데이터 로드:', savedItems.length, '개');
              setChecklistItems(savedItems);
              return;
            } else {
              console.log('ℹ️ 저장된 데이터 없음 - 템플릿으로 새로 생성');
            }
          }

          // 저장된 데이터가 없으면 템플릿으로 생성
          console.log('📡 에디터 템플릿 데이터 요청:', Number(checklistId));
          const editorItems = await fetchEditorItems(Number(checklistId));
          console.log('📦 에디터 템플릿 데이터 수신:', editorItems);

          if (editorItems && editorItems.length > 0) {
            // 에디터 항목을 점검 항목 형식으로 변환 (ID는 임시값)
            const checklistItemsData: ChecklistEditorItem[] = editorItems.map((item, index) => ({
              id: -(index + 1), // 임시 ID (음수로 DB ID와 구분)
              majorCategory: item.majorCategory,
              minorCategory: item.subCategory, // subCategory를 minorCategory로 매핑
              title: item.title,
              description: item.description,
              evaluation: '', // 초기값
              score: 0, // 초기값
              attachments: [] // 초기값
            }));
            console.log('✅ 변환된 체크리스트 항목:', checklistItemsData);
            setChecklistItems(checklistItemsData);

            // 기존 점검이 있으면 DB에 즉시 저장
            if (inspection?.id) {
              console.log('📝 새 체크시트 데이터 저장 중...', inspection.id);
              await createChecksheetItems(inspection.id, checklistItemsData, Number(checklistId));

              // DB에서 실제 ID를 가진 항목들을 다시 가져옴
              console.log('🔄 저장된 체크시트 항목 다시 로드 중...');
              const savedItems = await fetchChecksheetItems(inspection.id);
              if (savedItems && savedItems.length > 0) {
                setChecklistItems(savedItems);
                console.log('✅ 실제 DB ID로 상태 업데이트 완료:', savedItems.length, '개');
              }
            }
          } else {
            console.log('⚠️ 에디터 데이터가 없음');
            setChecklistItems([]);
          }
        } catch (error) {
          console.error('❌ 체크리스트 에디터 데이터 로드 실패:', error);
          setChecklistItems([]);
        }
      } else {
        setChecklistItems([]);
      }
    },
    [
      selectedChecklistId,
      checklistItems,
      inspection,
      fetchChecksheetItemsByChecklist,
      fetchEditorItems,
      createChecksheetItems,
      fetchChecksheetItems,
      deleteAllChecksheetItems
    ]
  );

  // 체크리스트 아이템 업데이트 핸들러
  const handleChecklistItemChange = useCallback(
    (itemIndex: number, field: string, value: any) => {
      setChecklistItems((prev) => {
        const updated = prev.map((item, index) => {
          if (index === itemIndex) {
            const updatedItem = { ...item, [field]: value };

            // DB에 저장 (ID가 양수인 경우만 - 이미 DB에 저장된 항목)
            if (inspection?.id && updatedItem.id > 0) {
              updateChecksheetItem(inspection.id, updatedItem);
            }

            return updatedItem;
          }
          return item;
        });
        return updated;
      });
    },
    [inspection, updateChecksheetItem]
  );

  // 첨부파일 다이얼로그 열기
  const handleOpenAttachmentDialog = useCallback(
    (itemIndex: number) => {
      setSelectedItemIndex(itemIndex);
      const currentItem = checklistItems[itemIndex];

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
    [checklistItems]
  );

  // 첨부파일 다이얼로그 닫기
  const handleCloseAttachmentDialog = useCallback(() => {
    setAttachmentDialogOpen(false);
    setSelectedItemIndex(-1);
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
    if (selectedItemIndex >= 0) {
      setChecklistItems((prev) =>
        prev.map((item, index) =>
          index === selectedItemIndex
            ? {
                ...item,
                attachments: tempAttachments.map((a) => a.url)
              }
            : item
        )
      );
    }
    handleCloseAttachmentDialog();
  }, [selectedItemIndex, tempAttachments, handleCloseAttachmentDialog]);

  // 🔄 기록탭 핸들러 함수들 - 로컬 state만 변경 (임시 저장)
  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !inspection?.id) return;

    const currentUserName = currentUser?.user_name || '현재 사용자';
    const currentTeam = currentUser?.department || '';
    const currentPosition = currentUser?.position || '';
    const currentProfileImage = currentUser?.profile_image_url || '';
    const currentRole = currentUser?.role || '';

    // 로컬 임시 ID 생성
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newFeedback: FeedbackData = {
      id: tempId,
      page: PAGE_IDENTIFIERS.SECURITY_INSPECTION,
      record_id: inspection.id.toString(),
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
    setPendingFeedbacks(prev => [newFeedback, ...prev]);
    setNewComment('');
  }, [newComment, inspection, currentUser]);

  const handleEditComment = useCallback((id: string, content: string) => {
    setEditingCommentId(id);
    setEditingCommentText(content);
  }, []);

  const handleSaveEditComment = useCallback(() => {
    if (!editingCommentText.trim() || !editingCommentId) return;

    // 로컬 state만 업데이트 (즉시 반응)
    setPendingFeedbacks(prev =>
      prev.map(fb =>
        fb.id === editingCommentId
          ? { ...fb, description: editingCommentText }
          : fb
      )
    );

    setEditingCommentId(null);
    setEditingCommentText('');
  }, [editingCommentText, editingCommentId]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleDeleteComment = useCallback((id: string) => {
    // 로컬 state에서만 제거 (즉시 반응)
    setPendingFeedbacks(prev => prev.filter(fb => fb.id !== id));
  }, []);

  // 자료탭 핸들러 함수들
  const handleAddMaterial = useCallback((material: any) => {
    setMaterials((prev) => [...prev, material]);
  }, []);

  const handleEditMaterial = useCallback((id: number, name: string) => {
    setEditingMaterialId(id);
    setEditingMaterialText(name);
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

  // OPL 관련 핸들러 함수들 (Supabase 연동)
  const handleAddOplItem = useCallback(async () => {
    if (!inspection?.id) {
      alert('점검을 먼저 저장한 후 OPL을 추가해주세요.');
      return;
    }

    try {
      const newCode = await generateOplCode();
      const newOplItem: Omit<OPLItem, 'id' | 'created_at' | 'updated_at'> = {
        inspection_id: inspection.id,
        registration_date: new Date().toISOString().split('T')[0],
        code: newCode,
        before: '',
        before_image: null,
        after: '',
        after_image: null,
        completion_date: null,
        assignee: '',
        status: statusOptions.length > 0 ? statusOptions[0].name : '대기'
      };

      const addedItem = await addOplItem(newOplItem);
      if (addedItem) {
        setOplItems((prev) => [...prev, addedItem]);
      }
    } catch (error) {
      console.error('OPL 항목 추가 실패:', error);
      alert('OPL 항목 추가에 실패했습니다.');
    }
  }, [inspection?.id, generateOplCode, addOplItem, statusOptions]);

  const handleDeleteOplItem = useCallback(
    async (itemId: number) => {
      try {
        const success = await deleteOplItem(itemId);
        if (success) {
          setOplItems((prev) => prev.filter((item) => item.id !== itemId));
        }
      } catch (error) {
        console.error('OPL 항목 삭제 실패:', error);
        alert('OPL 항목 삭제에 실패했습니다.');
      }
    },
    [deleteOplItem]
  );

  const handleEditOplField = useCallback(
    async (itemId: number, field: keyof OPLItem, value: any) => {
      try {
        const updatedItem = await updateOplItem(itemId, { [field]: value });
        if (updatedItem) {
          setOplItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
        }
      } catch (error) {
        console.error('OPL 항목 수정 실패:', error);
      }
    },
    [updateOplItem]
  );

  const handleStartEditOpl = useCallback(
    (itemId: number, field: string) => {
      const item = oplItems.find((item) => item.id === itemId);
      if (item) {
        setEditingOplId(itemId);
        setEditingOplField(field);
        setEditingOplText((item as any)[field] || '');
      }
    },
    [oplItems]
  );

  const handleSaveEditOpl = useCallback(() => {
    if (editingOplId !== null && editingOplField) {
      handleEditOplField(editingOplId, editingOplField as keyof OPLItem, editingOplText);
      setEditingOplId(null);
      setEditingOplField(null);
      setEditingOplText('');
    }
  }, [editingOplId, editingOplField, editingOplText, handleEditOplField]);

  const handleCancelEditOpl = useCallback(() => {
    setEditingOplId(null);
    setEditingOplField(null);
    setEditingOplText('');
  }, []);

  // 개별 체크박스 핸들러
  const handleSelectOplItem = useCallback((itemId: number) => {
    setSelectedOplItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // 전체 선택 체크박스 핸들러
  const handleSelectAllOplItems = useCallback(() => {
    if (selectedOplItems.size === oplItems.length) {
      setSelectedOplItems(new Set());
    } else {
      setSelectedOplItems(new Set(oplItems.map((item) => item.id)));
    }
  }, [selectedOplItems.size, oplItems]);

  const handleDeleteMaterial = useCallback((id: number) => {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
  }, []);

  const handleDownloadMaterial = useCallback((material: any) => {
    // 파일 다운로드 로직 (실제 구현에서는 서버에서 파일을 다운로드)
    console.log('다운로드:', material.name);
  }, []);

  // 파일 크기 포맷 함수
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 파일 아이콘 함수
  const getFileIcon = useCallback((type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📋';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '📦';
    return '📄';
  }, []);

  // OPL 아이템 추가 핸들러
  const handleAddOPLItem = useCallback(() => {
    const newOPL: OPLItem = {
      id: Date.now(),
      registrationDate: new Date().toISOString().split('T')[0],
      code: `OPL-${new Date().getFullYear().toString().slice(-2)}-${String(oplItems.length + 1).padStart(3, '0')}`,
      oplType: '안전',
      issuePhoto: '',
      issueContent: '',
      improvementPhoto: '',
      improvementAction: '',
      assignee: '',
      status: '대기',
      completedDate: '',
      attachments: [],
      evaluation: '',
      evaluationType: '3단계' as EvaluationType
    };
    setOplItems((prev) => [...prev, newOPL]);
  }, [oplItems.length]);

  // OPL 아이템 삭제 핸들러
  const handleDeleteOPLItem = useCallback((itemId: number) => {
    setOplItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // OPL 아이템 업데이트 핸들러
  const handleOPLItemChange = useCallback((itemId: number, field: string, value: any) => {
    setOplItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }, []);

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = useCallback((itemId: number, field: 'issuePhoto' | 'improvementPhoto', file: File) => {
    // 실제 구현에서는 서버에 업로드하고 URL을 받아와야 하지만,
    // 여기서는 로컬 파일 URL을 생성하여 미리보기 기능을 제공
    const imageUrl = URL.createObjectURL(file);

    setOplItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: imageUrl } : item)));
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    console.log('🔍 InspectionEditDialog handleSave 시작');
    console.log('📊 현재 formData:', formData);
    console.log('📊 현재 inspection:', inspection);

    // 필수 필드 검증
    if (!formData.inspectionContent.trim()) {
      alert('점검내용을 입력해주세요.');
      return;
    }

    if (!formData.team.trim()) {
      alert('팀 정보가 없습니다.');
      return;
    }

    if (!formData.assignee.trim()) {
      alert('담당자를 선택해주세요.');
      return;
    }

    if (!formData.inspectionType.trim()) {
      alert('점검유형을 선택해주세요.');
      return;
    }

    if (!formData.inspectionTarget.trim()) {
      alert('점검대상을 선택해주세요.');
      return;
    }

    // 코드 생성 (새로운 항목인 경우)
    let inspectionCode = formData.code;
    if (!inspectionCode && generateInspectionCode) {
      try {
        inspectionCode = await generateInspectionCode();
        console.log('🔄 생성된 코드:', inspectionCode);
      } catch (error) {
        console.error('🔴 코드 생성 실패:', error);
        // 대체 코드 생성
        const year = new Date().getFullYear().toString().slice(-2);
        const time = String(Date.now()).slice(-3);
        inspectionCode = `SEC-INS-${year}-${time}`;
      }
    }

    const updatedInspection: InspectionTableData = {
      ...inspection,
      id: inspection?.id || Date.now(),
      no: inspection?.no || Math.floor(Math.random() * 1000),
      inspectionContent: formData.inspectionContent,
      inspectionType: formData.inspectionType as any,
      inspectionTarget: formData.inspectionTarget as any,
      assignee: formData.assignee || currentUser?.user_name || '',
      inspectionDate: formData.inspectionDate,
      status: formData.status as InspectionStatus,
      code: inspectionCode || `SEC-INS-${new Date().getFullYear().toString().slice(-2)}-001`,
      registrationDate: formData.registrationDate,
      team: formData.team || currentUser?.department || '',
      details: formData.details, // 세부설명 필드 추가
      performance: formData.performance, // 점검성과보고 - 성과
      improvements: formData.improvements, // 점검성과보고 - 개선사항
      thoughts: formData.thoughts, // 점검성과보고 - 점검소감
      notes: formData.notes, // 점검성과보고 - 비고
      attachments: inspection?.attachments || []
    };

    console.log('💾 저장할 데이터:', updatedInspection);

    onSave(updatedInspection);

    // 🔄 기록 탭 변경사항 DB 저장
    console.log('💾 기록 탭 변경사항 저장 시작');
    console.time('⏱️ 기록 저장 Total');

    if (inspection?.id) {
      // 추가된 기록 (temp- ID)
      const addedFeedbacks = pendingFeedbacks.filter(fb =>
        fb.id.toString().startsWith('temp-') &&
        !initialFeedbacks.find(initial => initial.id === fb.id)
      );

      // 수정된 기록
      const updatedFeedbacks = pendingFeedbacks.filter(fb => {
        if (fb.id.toString().startsWith('temp-')) return false;
        const initial = initialFeedbacks.find(initial => initial.id === fb.id);
        return initial && initial.description !== fb.description;
      });

      // 삭제된 기록
      const deletedFeedbacks = initialFeedbacks.filter(initial =>
        !pendingFeedbacks.find(pending => pending.id === initial.id)
      );

      console.log('📊 변경사항:', {
        추가: addedFeedbacks.length,
        수정: updatedFeedbacks.length,
        삭제: deletedFeedbacks.length
      });

      // 추가 (역순으로 저장하여 DB에서 최신순 정렬 시 올바른 순서 유지)
      const reversedAddedFeedbacks = [...addedFeedbacks].reverse();
      for (const feedback of reversedAddedFeedbacks) {
        // temp ID, created_at, user_id 제거 (CreateFeedbackInput 형식으로 변환)
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
        // feedbacks 배열에 해당 ID가 존재하는지 확인
        const existsInFeedbacks = feedbacks.some(fb => String(fb.id) === String(feedback.id));
        if (existsInFeedbacks) {
          await deleteFeedback(String(feedback.id));
        } else {
          console.warn(`⚠️ 피드백 ${feedback.id}가 feedbacks 배열에 없어 삭제 건너뜀 (이미 삭제됨)`);
        }
      }

      console.timeEnd('⏱️ 기록 저장 Total');
      console.log('✅ 기록 탭 변경사항 저장 완료');
    }

    onClose();
  }, [formData, inspection, onSave, onClose, generateInspectionCode, pendingFeedbacks, initialFeedbacks, feedbacks, addFeedback, updateFeedback, deleteFeedback]);

  // 닫기 핸들러
  const handleClose = useCallback(() => {
    setActiveTab(0);
    // 🔄 기록 탭 임시 데이터 초기화
    setPendingFeedbacks([]);
    setInitialFeedbacks([]);
    onClose();
  }, [onClose]);

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // 개요 탭
        return (
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Stack spacing={3}>
              {/* 점검내용 - 전체 너비 */}
              <TextField
                fullWidth
                label="점검내용"
                required
                value={formData.inspectionContent}
                onChange={handleFieldChange('inspectionContent')}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    '& .MuiInputLabel-asterisk': {
                      color: 'red'
                    }
                  }
                }}
              />

              {/* 세부설명 - 전체 너비 */}
              <TextField
                fullWidth
                label="세부설명"
                multiline
                rows={4}
                value={formData.details}
                onChange={handleFieldChange('details')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />

              {/* 점검유형, 점검대상 - 좌우 배치 */}
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel
                    shrink
                    required
                    sx={{
                      '& .MuiInputLabel-asterisk': {
                        color: 'red'
                      }
                    }}
                  >
                    점검유형
                  </InputLabel>
                  <Select value={formData.inspectionType} label="점검유형" onChange={handleFieldChange('inspectionType')} displayEmpty>
                    <MenuItem value="">선택</MenuItem>
                    {inspectionTypeOptionsFromMasterCode.length > 0 ? (
                      inspectionTypeOptionsFromMasterCode.map((option) => (
                        <MenuItem key={option.subcode} value={option.subcode_name}>
                          {option.subcode_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem key="loading" value="" disabled>
                        로딩 중...
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel
                    shrink
                    required
                    sx={{
                      '& .MuiInputLabel-asterisk': {
                        color: 'red'
                      }
                    }}
                  >
                    점검대상
                  </InputLabel>
                  <Select value={formData.inspectionTarget} label="점검대상" onChange={handleFieldChange('inspectionTarget')} displayEmpty>
                    <MenuItem value="">선택</MenuItem>
                    {inspectionTargetOptionsFromMasterCode.length > 0 ? (
                      inspectionTargetOptionsFromMasterCode.map((option) => (
                        <MenuItem key={option.subcode} value={option.subcode_name}>
                          {option.subcode_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem key="loading" value="" disabled>
                        로딩 중...
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Stack>

              {/* 점검일, 상태 - 좌우 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="점검일"
                  type="date"
                  required
                  value={formData.inspectionDate}
                  onChange={handleFieldChange('inspectionDate')}
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      '& .MuiInputLabel-asterisk': {
                        color: 'red'
                      }
                    }
                  }}
                  variant="outlined"
                />

                <FormControl fullWidth>
                  <InputLabel shrink sx={{ color: '#2196F3' }}>
                    상태
                  </InputLabel>
                  <Select value={formData.status} label="상태" onChange={handleFieldChange('status')}>
                    {statusOptions.length > 0 ? (
                      statusOptions.map((option) => {
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
                          <MenuItem key={option.code} value={option.name}>
                            <Chip
                              label={option.name}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(option.name).bgcolor,
                                color: getStatusColor(option.name).color,
                                fontSize: '13px',
                                fontWeight: 400
                              }}
                            />
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem key="loading" value="">
                        로딩 중...
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Stack>

              {/* 팀, 담당자 - 좌우 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  disabled
                  label="팀"
                  required
                  value={formData.team || ''}
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
                  value={formData.assignee || ''}
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
                      // formData.assignee에 해당하는 사용자 찾기
                      const assigneeUser = activeUsers.find((user) => user.user_name === formData.assignee);
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
                    '& .MuiInputLabel-root': {
                      color: 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiInputLabel-root.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                />
              </Stack>

              {/* 등록일, 코드 - 좌우 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="등록일"
                  disabled
                  value={formData.registrationDate}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'grey.100'
                    },
                    '& .MuiInputBase-input': {
                      color: 'rgba(0, 0, 0, 0.7)',
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
                  label="코드"
                  disabled
                  value={formData.code}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'grey.100'
                    },
                    '& .MuiInputBase-input': {
                      color: 'rgba(0, 0, 0, 0.7)',
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
            </Stack>
          </Box>
        );

      case 1: // 점검 탭
        // 점검항목 통계 계산
        const totalItems = checklistItems.length;
        const evaluatedItems = checklistItems.filter((item) => item.score > 0).length;
        const totalScore = checklistItems.reduce((sum, item) => sum + (item.score || 0), 0);
        const maxPossibleScore = checklistEvaluationType === '3단계' ? totalItems * 3 : totalItems * 5;

        // 평가별 건수 계산
        const evaluationCounts =
          checklistEvaluationType === '3단계'
            ? {
                우수: checklistItems.filter((item) => item.score === 3).length,
                보통: checklistItems.filter((item) => item.score === 2).length,
                미흡: checklistItems.filter((item) => item.score === 1).length
              }
            : {
                '매우 우수': checklistItems.filter((item) => item.score === 5).length,
                양호: checklistItems.filter((item) => item.score === 4).length,
                보통: checklistItems.filter((item) => item.score === 3).length,
                미흡: checklistItems.filter((item) => item.score === 2).length,
                '매우 부족': checklistItems.filter((item) => item.score === 1).length
              };

        return (
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Stack spacing={3}>
              {/* 체크리스트 선택 & 평가 설정 */}
              <Stack direction="row" spacing={3}>
                <Box sx={{ flex: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    체크리스트 선택
                  </Typography>
                  <FormControl fullWidth size="small">
                    <TextField
                      select
                      label="기준정보 체크리스트를 선택하세요"
                      value={selectedChecklistId}
                      onChange={(e) => handleChecklistChange(Number(e.target.value))}
                      disabled={checklistsLoading}
                    >
                      <MenuItem value="">선택하세요</MenuItem>
                      {checklists.map((checklist) => (
                        <MenuItem key={checklist.id} value={checklist.id}>
                          <Typography variant="body2" sx={{ fontWeight: 400, width: '100%', color: 'black' }}>
                            {checklist.code} | {checklist.department} | {checklist.workContent} |{' '}
                            {checklist.description || '설명 없음'}
                          </Typography>
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    평가 설정
                  </Typography>
                  <FormControl fullWidth size="small">
                    <TextField
                      select
                      label="평가 유형을 선택하세요"
                      value={checklistEvaluationType}
                      onChange={(e) => setChecklistEvaluationType(e.target.value as EvaluationType)}
                    >
                      <MenuItem value="3단계">
                        <Typography variant="body2" sx={{ fontWeight: 400, width: '100%', color: 'black' }}>
                          3단계 | 미흡, 보통, 우수 | 1점~3점
                        </Typography>
                      </MenuItem>
                      <MenuItem value="5단계">
                        <Typography variant="body2" sx={{ fontWeight: 400, width: '100%', color: 'black' }}>
                          5단계 | 매우 부족, 미흡, 보통, 양호, 매우 우수 | 1점~5점
                        </Typography>
                      </MenuItem>
                    </TextField>
                  </FormControl>
                </Box>
              </Stack>

              {/* 점검 통계 정보 */}
              {checklistItems.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                  <Stack direction="row" spacing={4} alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        점검항목
                      </Typography>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 600 }}>
                        {evaluatedItems} / {totalItems}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        총점수
                      </Typography>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 600 }}>
                        {totalScore} / {maxPossibleScore}점
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        평가
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {Object.entries(evaluationCounts).map(([level, count]) => {
                          if (count === 0) return null;
                          const getColor = () => {
                            if (level === '우수' || level === '매우 우수') return 'success';
                            if (level === '양호') return 'info';
                            if (level === '보통') return 'default';
                            if (level === '미흡') return 'warning';
                            if (level === '매우 부족') return 'error';
                            return 'default';
                          };
                          return <Chip key={level} label={`${level} ${count}건`} size="small" color={getColor()} variant="filled" />;
                        })}
                        {totalItems > 0 && evaluatedItems < totalItems && (
                          <Chip label={`미평가 ${totalItems - evaluatedItems}건`} color="default" size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {checklistItems.length > 0 && (
                <TableContainer
                  sx={{
                    border: 'none',
                    boxShadow: 'none',
                    '& .MuiTableCell-root': {
                      border: 'none'
                    },
                    '& .MuiTextField-root': {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          border: 'none'
                        },
                        '&:hover fieldset': {
                          border: 'none'
                        },
                        '&.Mui-focused fieldset': {
                          border: '1px solid #1976d2',
                          borderWidth: '1px'
                        }
                      }
                    },
                    '& .MuiSelect-root': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #1976d2',
                        borderWidth: '1px'
                      }
                    },
                    '& .MuiButton-outlined': {
                      border: 'none',
                      '&:hover': {
                        border: 'none',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell width={50} sx={{ fontWeight: 600 }}>
                          NO
                        </TableCell>
                        <TableCell width={120} sx={{ fontWeight: 600 }}>
                          대분류
                        </TableCell>
                        <TableCell width={120} sx={{ fontWeight: 600 }}>
                          소분류
                        </TableCell>
                        <TableCell width={180} sx={{ fontWeight: 600 }}>
                          점검항목
                        </TableCell>
                        <TableCell width={200} sx={{ fontWeight: 600 }}>
                          평가내용
                        </TableCell>
                        <TableCell width={100} sx={{ fontWeight: 600 }}>
                          평가
                        </TableCell>
                        <TableCell width={80} sx={{ fontWeight: 600 }}>
                          점수
                        </TableCell>
                        <TableCell width={100} sx={{ fontWeight: 600 }}>
                          첨부
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {checklistItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{checklistItems.length - index}</TableCell>
                          <TableCell>{item.majorCategory}</TableCell>
                          <TableCell>{item.minorCategory}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              size="small"
                              placeholder="평가 내용 입력 (필수)"
                              value={item.evaluation}
                              onChange={(e) => handleChecklistItemChange(index, 'evaluation', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={
                                checklistEvaluationType === '3단계'
                                  ? item.score === 3
                                    ? '우수'
                                    : item.score === 2
                                      ? '보통'
                                      : item.score === 1
                                        ? '미흡'
                                        : ''
                                  : item.score === 5
                                    ? '매우 우수'
                                    : item.score === 4
                                      ? '양호'
                                      : item.score === 3
                                        ? '보통'
                                        : item.score === 2
                                          ? '미흡'
                                          : item.score === 1
                                            ? '매우 부족'
                                            : ''
                              }
                              onChange={(e) => {
                                const evaluation = e.target.value as string;
                                let newScore = 0;

                                if (checklistEvaluationType === '3단계') {
                                  newScore = evaluation === '우수' ? 3 : evaluation === '보통' ? 2 : evaluation === '미흡' ? 1 : 0;
                                } else {
                                  newScore =
                                    evaluation === '매우 우수'
                                      ? 5
                                      : evaluation === '양호'
                                        ? 4
                                        : evaluation === '보통'
                                          ? 3
                                          : evaluation === '미흡'
                                            ? 2
                                            : evaluation === '매우 부족'
                                              ? 1
                                              : 0;
                                }

                                handleChecklistItemChange(index, 'score', newScore);
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">선택</MenuItem>
                              {evaluationOptions[checklistEvaluationType].map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>{item.score}점</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleOpenAttachmentDialog(index)}>
                                <AttachSquare size={16} />
                              </IconButton>
                              {item.attachments && item.attachments.length > 0 && (
                                <Chip size="small" label={`${item.attachments.length}개`} variant="outlined" color="primary" />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedChecklistId && checklistItems.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    선택된 체크리스트에 항목이 없습니다.
                  </Typography>
                </Box>
              )}

              {!selectedChecklistId && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    체크리스트를 선택하세요.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        );

      case 2: // OPL 탭
        return (
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Stack spacing={3}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={selectedOplItems.size === 0}
                    startIcon={<Trash size={16} />}
                    onClick={async () => {
                      // 선택된 항목들 삭제 로직
                      const itemsToDelete = Array.from(selectedOplItems);
                      try {
                        const success = await deleteOplItems(itemsToDelete);
                        if (success) {
                          setOplItems((prev) => prev.filter((item) => !itemsToDelete.includes(item.id)));
                          setSelectedOplItems(new Set());
                        }
                      } catch (error) {
                        console.error('OPL 항목들 삭제 실패:', error);
                        alert('OPL 항목들 삭제에 실패했습니다.');
                      }
                    }}
                    sx={{
                      color: selectedOplItems.size > 0 ? '#d32f2f' : '#9e9e9e',
                      borderColor: selectedOplItems.size > 0 ? '#d32f2f' : '#e0e0e0',
                      '&:hover:not(:disabled)': {
                        backgroundColor: '#ffebee',
                        borderColor: '#c62828'
                      },
                      '&:disabled': {
                        color: '#bdbdbd',
                        borderColor: '#e0e0e0'
                      }
                    }}
                  >
                    삭제
                  </Button>
                  <Button variant="contained" size="small" startIcon={<Add size={16} />} onClick={handleAddOplItem}>
                    추가
                  </Button>
                </Box>
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, mb: 1 }}>
                  OPL (One Point Lesson)
                </Typography>
              </Box>

              <TableContainer>
                <Table sx={{ tableLayout: 'fixed', minWidth: 960 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#f8f9fa',
                        height: 40
                      }}
                    >
                      <TableCell
                        padding="checkbox"
                        sx={{
                          width: 50,
                          textAlign: 'center',
                          py: 0.5,
                          fontSize: '0.875rem'
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={oplItems.length > 0 && selectedOplItems.size === oplItems.length}
                          indeterminate={selectedOplItems.size > 0 && selectedOplItems.size < oplItems.length}
                          onChange={handleSelectAllOplItems}
                          sx={{
                            p: 0.25,
                            transform: 'scale(0.8)',
                            '& .MuiSvgIcon-root': {
                              fontSize: '1rem'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 40,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        NO
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 80,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        등록정보
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 225,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        Before
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 225,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        After
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 120,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        완료일
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 100,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        담당자
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 120,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        상태
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {oplItems.length > 0 ? (
                      [...oplItems].reverse().map((item, reverseIndex) => (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                            <Checkbox
                              size="small"
                              checked={selectedOplItems.has(item.id)}
                              onChange={() => handleSelectOplItem(item.id)}
                              sx={{
                                p: 0.25,
                                transform: 'scale(0.8)',
                                '& .MuiSvgIcon-root': {
                                  fontSize: '1rem'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{oplItems.length - reverseIndex}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {/* 등록일 */}
                              {editingOplId === item.id && editingOplField === 'registration_date' ? (
                                <TextField
                                  type="date"
                                  size="small"
                                  value={editingOplText}
                                  onChange={(e) => setEditingOplText(e.target.value)}
                                  onBlur={handleSaveEditOpl}
                                  autoFocus
                                  fullWidth
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  onClick={() => handleStartEditOpl(item.id, 'registration_date')}
                                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  {item.registration_date || '2025-09-24'}
                                </Typography>
                              )}

                              {/* 등록코드 */}
                              {editingOplId === item.id && editingOplField === 'code' ? (
                                <TextField
                                  size="small"
                                  value={editingOplText}
                                  onChange={(e) => setEditingOplText(e.target.value)}
                                  onBlur={handleSaveEditOpl}
                                  autoFocus
                                  fullWidth
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  onClick={() => handleStartEditOpl(item.id, 'code')}
                                  sx={{ cursor: 'pointer', fontSize: '0.75rem', color: 'text.secondary' }}
                                >
                                  {item.code || '-'}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ width: 225 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {/* 이미지 첨부 영역 */}
                              <Box>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  id={`before-image-${item.id}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      console.log('📤 Before 이미지 업로드 시작...');
                                      const imageUrl = await uploadOplImage(file, 'before');
                                      if (imageUrl) {
                                        handleEditOplField(item.id, 'before_image', imageUrl);
                                        console.log('✅ Before 이미지 업로드 완료:', imageUrl);
                                      } else {
                                        console.error('❌ Before 이미지 업로드 실패');
                                        alert('이미지 업로드에 실패했습니다.');
                                      }
                                    }
                                  }}
                                />
                                {!item.before_image ? (
                                  <label htmlFor={`before-image-${item.id}`}>
                                    <Button variant="outlined" component="span" size="small" sx={{ width: '100%', mb: 1 }}>
                                      📷 Before 사진 첨부
                                    </Button>
                                  </label>
                                ) : (
                                  <Box sx={{ position: 'relative', mb: 1 }}>
                                    <img
                                      src={item.before_image}
                                      alt="Before 사진"
                                      style={{
                                        width: '100%',
                                        maxHeight: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditOplField(item.id, 'before_image', '')}
                                      sx={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                                      }}
                                    >
                                      <Trash size="12" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

                              {/* 텍스트 입력 영역 */}
                              {editingOplId === item.id && editingOplField === 'before' ? (
                                <TextField
                                  multiline
                                  rows={2}
                                  size="small"
                                  value={editingOplText}
                                  onChange={(e) => setEditingOplText(e.target.value)}
                                  onBlur={handleSaveEditOpl}
                                  autoFocus
                                  fullWidth
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  onClick={() => handleStartEditOpl(item.id, 'before')}
                                  sx={{
                                    cursor: 'pointer',
                                    minHeight: '32px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {item.before || '클릭하여 입력'}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ width: 225 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {/* 이미지 첨부 영역 */}
                              <Box>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  id={`after-image-${item.id}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      console.log('📤 After 이미지 업로드 시작...');
                                      const imageUrl = await uploadOplImage(file, 'after');
                                      if (imageUrl) {
                                        handleEditOplField(item.id, 'after_image', imageUrl);
                                        console.log('✅ After 이미지 업로드 완료:', imageUrl);
                                      } else {
                                        console.error('❌ After 이미지 업로드 실패');
                                        alert('이미지 업로드에 실패했습니다.');
                                      }
                                    }
                                  }}
                                />
                                {!item.after_image ? (
                                  <label htmlFor={`after-image-${item.id}`}>
                                    <Button variant="outlined" component="span" size="small" sx={{ width: '100%', mb: 1 }}>
                                      📷 After 사진 첨부
                                    </Button>
                                  </label>
                                ) : (
                                  <Box sx={{ position: 'relative', mb: 1 }}>
                                    <img
                                      src={item.after_image}
                                      alt="After 사진"
                                      style={{
                                        width: '100%',
                                        maxHeight: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditOplField(item.id, 'after_image', '')}
                                      sx={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                                      }}
                                    >
                                      <Trash size="12" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

                              {/* 텍스트 입력 영역 */}
                              {editingOplId === item.id && editingOplField === 'after' ? (
                                <TextField
                                  multiline
                                  rows={2}
                                  size="small"
                                  value={editingOplText}
                                  onChange={(e) => setEditingOplText(e.target.value)}
                                  onBlur={handleSaveEditOpl}
                                  autoFocus
                                  fullWidth
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  onClick={() => handleStartEditOpl(item.id, 'after')}
                                  sx={{
                                    cursor: 'pointer',
                                    minHeight: '32px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {item.after || '클릭하여 입력'}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {editingOplId === item.id && editingOplField === 'completion_date' ? (
                              <TextField
                                type="date"
                                size="small"
                                value={editingOplText}
                                onChange={(e) => setEditingOplText(e.target.value)}
                                onBlur={handleSaveEditOpl}
                                autoFocus
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                onClick={() => handleStartEditOpl(item.id, 'completion_date')}
                                sx={{ cursor: 'pointer' }}
                              >
                                {item.completion_date || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingOplId === item.id && editingOplField === 'assignee' ? (
                              <TextField
                                size="small"
                                value={editingOplText}
                                onChange={(e) => setEditingOplText(e.target.value)}
                                onBlur={handleSaveEditOpl}
                                autoFocus
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                onClick={() => handleStartEditOpl(item.id, 'assignee')}
                                sx={{ cursor: 'pointer' }}
                              >
                                {item.assignee || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={item.status || (statusOptions.length > 0 ? statusOptions[0].name : '대기')}
                              onChange={(e) => {
                                handleEditOplField(item.id, 'status', e.target.value);
                              }}
                              sx={{ minWidth: 120 }}
                            >
                              {statusOptions.map((option) => (
                                <MenuItem key={option.code} value={option.name}>
                                  {option.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            등록된 OPL 항목이 없습니다.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Box>
        );

      case 3: // 점검성과보고 탭
        return (
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, mb: 3 }}>
              점검성과보고
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="성과"
                  multiline
                  rows={4}
                  value={formData.performance}
                  onChange={handleFieldChange('performance')}
                  placeholder="점검을 통해 달성한 구체적인 성과나 결과를 기록하세요."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="개선사항"
                  multiline
                  rows={4}
                  value={formData.improvements}
                  onChange={handleFieldChange('improvements')}
                  placeholder="향후 점검에서 개선이 필요한 사항이나 보완점을 기록하세요."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="점검소감"
                  multiline
                  rows={5}
                  value={formData.thoughts}
                  onChange={handleFieldChange('thoughts')}
                  placeholder="점검 과정에서의 전반적인 소감과 피드백을 종합하여 작성하세요."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비고"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleFieldChange('notes')}
                  placeholder="기타 특이사항이나 추가로 기록할 내용을 작성하세요."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4: // 기록 탭
        return (
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
            currentUserName={currentUser?.user_name}
            currentUserAvatar={currentUser?.profile_image_url}
            currentUserRole={currentUser?.role}
            currentUserDepartment={currentUser?.department}
          />
        );

      case 5: // 자료 탭
        const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
          const files = event.target.files;
          if (!files || files.length === 0) return;

          Array.from(files).forEach((file) => {
            const material = {
              id: Date.now() + Math.random(),
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: formatFileSize(file.size),
              uploadDate: new Date().toISOString().split('T')[0]
            };
            handleAddMaterial(material);
          });

          // 파일 입력 초기화
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };

        const handleUploadClick = () => {
          fileInputRef.current?.click();
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
                            <IconButton size="small" onClick={handleSaveEditMaterial} color="success" sx={{ p: 0.5 }}>
                              <Typography fontSize="14px">✓</Typography>
                            </IconButton>
                            <IconButton size="small" onClick={handleCancelEditMaterial} color="error" sx={{ p: 0.5 }}>
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
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMaterial(material.id)}
                              color="error"
                              sx={{ p: 0.5 }}
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

      default:
        return null;
    }
  };

  return (
    <>
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

      {/* 메인 다이얼로그 */}
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
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
                보안점검관리 편집
              </Typography>
              {inspection && (
                <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                  {formData.inspectionContent} ({formData.code})
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={handleClose}>
                취소
              </Button>
              <Button variant="contained" size="small" onClick={handleSave}>
                저장
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="개요" />
            <Tab label="점검" />
            <Tab label="OPL" />
            <Tab label="점검성과보고" />
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>{renderTabContent()}</DialogContent>
      </Dialog>
    </>
  );
}
