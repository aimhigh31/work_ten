import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSWRConfig } from 'swr';
import { supabase } from '../lib/supabase';
import { useSupabaseAccidentReport } from '../hooks/useSupabaseAccidentReport';
import { useSupabaseImprovements } from '../hooks/useSupabaseImprovements'; // 재발방지계획 훅 추가
import { useCommonData } from '../contexts/CommonDataContext'; // ✅ 공용 창고
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import useUser from '../hooks/useUser';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { FileData } from '../types/files';
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
  Alert,
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
  Pagination
} from '@mui/material';
import { TaskTableData, TaskStatus } from '../types/task';
import { SecurityIncidentRecord } from '../types/security-incident';
import SecurityIncidentOverviewTab from './SecurityIncidentOverviewTab';
import SecurityIncidentStatusTab from './SecurityIncidentStatusTab';
import SecurityIncidentReportTab from './SecurityIncidentReportTab';
import SecurityIncidentImprovementTab from './SecurityIncidentImprovementTab';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// 기록 탭 컴포넌트 (보안교육관리와 동일)
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
                      {comment.position && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          {comment.position}
                        </Typography>
                      )}
                      {comment.department && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          {comment.department}
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
  } = useSupabaseFiles(PAGE_IDENTIFIERS.SECURITY_ACCIDENT, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = event.target.files;
      if (!uploadedFiles || uploadedFiles.length === 0) return;

      // recordId가 없으면 업로드 불가
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 사고를 저장해주세요.');
        return;
      }

      // 각 파일을 순차적으로 업로드
      for (const file of Array.from(uploadedFiles)) {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.SECURITY_ACCIDENT,
          record_id: String(recordId),
          // user_id는 UUID 타입이므로 숫자형 ID는 전달하지 않음
          user_id: undefined,
          user_name: currentUser?.user_name || '알 수 없음',
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

// 상태 관리를 위한 reducer - 보안사고 전용으로 확장
interface EditSecurityIncidentState {
  workContent: string;
  description: string;
  responseAction: string;
  incidentType: string;
  assignee: string;
  status: TaskStatus;
  code: string;
  registrationDate: string;
  completedDate: string;
  startDate: string;
  team: string;
  department: string;
  progress: number;
}

type EditSecurityIncidentAction =
  | { type: 'SET_FIELD'; field: keyof EditSecurityIncidentState; value: string }
  | { type: 'SET_TASK'; task: SecurityIncidentRecord }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_TASK'; code: string; registrationDate: string; assignee: string };

const editSecurityIncidentReducer = (state: EditSecurityIncidentState, action: EditSecurityIncidentAction): EditSecurityIncidentState => {
  switch (action.type) {
    case 'SET_FIELD': {
      console.log('🔧 SET_FIELD 리듀서 실행:', { field: action.field, value: action.value });
      // progress 필드는 숫자로 변환
      if (action.field === 'progress') {
        return { ...state, [action.field]: Number(action.value) || 0 };
      }
      const updatedState = { ...state, [action.field]: action.value };
      console.log('🔧 SET_FIELD 새 상태:', updatedState);
      return updatedState;
    }
    case 'SET_TASK':
      console.log('🔍 SET_TASK 액션 실행:', {
        mainContent: action.task.mainContent,
        task: action.task,
        currentTeam: state.team
      });
      const newState = {
        workContent: action.task.mainContent || '',
        description: action.task.description || '',
        responseAction: action.task.responseAction || '',
        incidentType: action.task.incidentType || '',
        assignee: action.task.assignee || '',
        status: action.task.status || '대기',
        code: action.task.code || '',
        registrationDate: action.task.registrationDate || '',
        completedDate: action.task.completedDate || '',
        startDate: action.task.startDate || action.task.registrationDate || '',
        team: action.task.team || state.team || '', // task의 team이 없으면 현재 state.team 유지
        department: action.task.team || 'IT',
        progress: action.task.progress || 0
      };
      console.log('🔍 SET_TASK 새로운 상태:', newState);
      return newState;
    case 'INIT_NEW_TASK':
      console.log('🔧 INIT_NEW_TASK 리듀서 실행:', {
        assignee: action.assignee,
        code: action.code,
        registrationDate: action.registrationDate
      });
      const initState = {
        workContent: '',
        description: '',
        responseAction: '',
        incidentType: '',
        assignee: action.assignee,
        status: '대기',
        code: action.code,
        registrationDate: action.registrationDate,
        completedDate: '',
        startDate: action.registrationDate,
        team: '',
        department: 'IT',
        progress: 0
      };
      console.log('🔧 INIT_NEW_TASK 새 상태:', initState);
      return initState;
    case 'RESET':
      return {
        workContent: '',
        description: '',
        responseAction: '',
        incidentType: '',
        progress: 0,
        assignee: '',
        status: '대기',
        code: '',
        registrationDate: '',
        completedDate: '',
        startDate: '',
        team: '',
        department: 'IT'
      };
    default:
      return state;
  }
};

interface SecurityIncidentEditDialogProps {
  open: boolean;
  onClose: () => void;
  task: SecurityIncidentRecord | null;
  onSave: (task: SecurityIncidentRecord) => void | Promise<void>;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  statusOptions: string[];
  statusColors: Record<string, any>;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

const SecurityIncidentEditDialog = memo(
  ({ open, onClose, task, onSave, assignees, assigneeAvatars, statusOptions, statusColors, canCreateData = true, canEditOwn = true, canEditOthers = true }: SecurityIncidentEditDialogProps) => {
    const [editTab, setEditTab] = useState(0);
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

    // 🚀 Option 3: Prefetch를 위한 SWR Config
    const { mutate: globalMutate } = useSWRConfig();

    // 로그인한 사용자 정보
    const user = useUser();

    // 로그인한 사용자 정보 가져오기 (InspectionEditDialog 패턴)
    const { data: session } = useSession();

    // ✅ 공용 창고에서 사용자 데이터와 마스터코드 가져오기
    const { users, masterCodes } = useCommonData();

    // 세션 email로 DB에서 사용자 찾기 (InspectionEditDialog 패턴)
    const currentUser = React.useMemo(() => {
      console.log('🔍 [SecurityIncidentEditDialog] currentUser 계산:', {
        sessionEmail: session?.user?.email,
        usersCount: users.length,
        users: users.map((u) => ({ email: u.email, name: u.user_name }))
      });
      if (!session?.user?.email || users.length === 0) return null;
      const foundUser = users.find((u) => u.email === session.user.email);
      console.log('✅ [SecurityIncidentEditDialog] 찾은 사용자:', foundUser ? {
        user_name: foundUser.user_name,
        email: foundUser.email,
        profile_image_url: foundUser.profile_image_url
      } : '없음');
      return foundUser;
    }, [session, users]);

    // 데이터 소유자 확인 로직
    const isOwner = React.useMemo(() => {
      if (!task || task.id === 0) return true; // 신규 생성인 경우 true

      const currentUserName = currentUser?.user_name;

      // createdBy 또는 assignee 중 하나라도 현재 사용자와 일치하면 소유자로 판단
      const isOwnerResult =
        task.createdBy === currentUserName ||
        task.assignee === currentUserName;

      console.log('🔍 [SecurityIncidentEditDialog] 데이터 소유자 확인:', {
        task_id: task.id,
        task_createdBy: task.createdBy,
        task_assignee: task.assignee,
        currentUser_email: currentUser?.email,
        currentUser_user_name: currentUserName,
        isOwner: isOwnerResult
      });

      return isOwnerResult;
    }, [task, currentUser]);

    // 사고보고 데이터 관리를 위한 훅
    const { loading: reportLoading, error: reportError, fetchReportByAccidentId, saveReport, deleteReport } = useSupabaseAccidentReport();

    // 재발방지계획(개선사항) 데이터 관리를 위한 훅 (커리큘럼탭과 동일한 패턴)
    const {
      items: improvementItems,
      loading: improvementLoading,
      fetchImprovementsByAccidentId,
      replaceAllImprovements
    } = useSupabaseImprovements();

    // 피드백/기록 훅
    const {
      feedbacks,
      loading: feedbackLoading,
      error: feedbackError,
      addFeedback,
      updateFeedback,
      deleteFeedback,
      isAdding,
      isUpdating,
      isDeleting
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.SECURITY_INCIDENT, task?.id?.toString());
    const [taskState, dispatch] = useReducer(editSecurityIncidentReducer, {
      workContent: '',
      description: '',
      responseAction: '',
      incidentType: '',
      assignee: '',
      status: '대기',
      code: '',
      registrationDate: '',
      completedDate: '',
      startDate: '',
      team: '',
      department: 'IT',
      progress: 0
    });

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

    // 🔄 임시 저장: 로컬 state로 기록 관리
    const [pendingFeedbacks, setPendingFeedbacks] = useState<FeedbackData[]>([]);
    const [initialFeedbacks, setInitialFeedbacks] = useState<FeedbackData[]>([]);

    // 초기화 여부를 추적 (무한 루프 방지)
    const feedbacksInitializedRef = useRef(false);
    const feedbacksRef = useRef<FeedbackData[]>([]);

    // feedbacks를 ref에 저장 (dependency 문제 방지)
    useEffect(() => {
      feedbacksRef.current = feedbacks;
    }, [feedbacks]);

    // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
    useEffect(() => {
      if (open && task?.id && !feedbacksInitializedRef.current) {
        // feedbacks 데이터가 로드될 때까지 기다렸다가 초기화
        if (feedbacks.length > 0) {
          setPendingFeedbacks(feedbacks);
          setInitialFeedbacks(feedbacks);
          feedbacksInitializedRef.current = true;
          console.log('✅ 보안사고관리 기록 초기화:', feedbacks.length, '개');
        }
      }

      // 다이얼로그 닫힐 때 초기화 플래그 리셋
      if (!open) {
        feedbacksInitializedRef.current = false;
        setPendingFeedbacks([]);
        setInitialFeedbacks([]);
      }
    }, [open, task?.id, feedbacks]);

    // SWR의 revalidateOnMount: true가 자동으로 데이터를 fetch합니다

    // 직급 옵션 (GROUP004)
    const positionOptions = React.useMemo(() => {
      return masterCodes
        .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP004' && item.is_active)
        .sort((a, b) => a.subcode_order - b.subcode_order)
        .map((item) => ({
          code: item.subcode,
          name: item.subcode_name
        }));
    }, [masterCodes]);

    // 서브코드를 서브코드명으로 변환하는 함수
    const convertSubcodeName = React.useCallback((subcode: string | undefined, options: Array<{ code: string; name: string }>) => {
      if (!subcode) return '';
      if (!subcode.includes('GROUP')) return subcode;
      const found = options.find((opt) => opt.code === subcode);
      return found ? found.name : subcode;
    }, []);

    // Supabase feedbacks를 RecordTab 형식으로 변환 (pendingFeedbacks 사용)
    const comments = useMemo(() => {
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
          position: convertSubcodeName(feedbackUser?.role || '', positionOptions),
          role: ''
        };
      });
    }, [pendingFeedbacks, users, positionOptions, convertSubcodeName]);

    const [postMeasures, setPostMeasures] = useState({
      rootCauseAnalysis: '',
      systemImprovements: '',
      policyChanges: '',
      trainingPlan: '',
      preventiveMeasures: '',
      monitoringEnhancement: '',
      responsiblePerson: '',
      implementationDeadline: '',
      budgetRequired: '',
      riskAssessment: '',
      lessonsLearned: ''
    });

    // 사고보고 상태 추가
    const [incidentReport, setIncidentReport] = useState<any>({
      discoveryDateTime: '',
      discoverer: '',
      discoveryMethod: '',
      reportDateTime: '',
      reporter: '',
      reportMethod: '',
      incidentTarget: '',
      incidentCause: '',
      affectedSystems: '',
      affectedData: '',
      serviceImpact: '',
      businessImpact: '',
      situationDetails: '',
      responseMethod: '',
      improvementExecutor: '',
      expectedCompletionDate: '',
      improvementDetails: '',
      completionDate: '',
      completionApprover: '',
      resolutionDetails: '',
      preventionMeasures: [],
      preventionDetails: ''
    });

    // 사고대응단계 상태
    const [responseStage, setResponseStage] = useState<string>('사고 탐지');

    // 재발방지계획(개선사항) 상태 관리 (커리큘럼탭과 동일한 패턴)
    const [improvementItemsState, setImprovementItemsState] = useState<any[]>([]);
    const [selectedImprovementRows, setSelectedImprovementRows] = useState<string[]>([]);

    // 에러 상태
    const [validationError, setValidationError] = useState<string>('');

    // 현재 날짜 생성 함수
    const getCurrentDate = useCallback(() => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }, []);

    // 팀을 로그인한 사용자의 부서로 자동 설정 (InspectionEditDialog 패턴)
    // initNewTask에서 직접 설정하므로 이 useEffect는 백업용
    React.useEffect(() => {
      console.log('🔍 팀 자동설정 useEffect 실행:', {
        currentUserDepartment: currentUser?.department,
        taskStateTeam: taskState.team,
        taskId: task?.id,
        조건충족: !!(currentUser?.department && !taskState.team && !task?.id)
      });
      if (currentUser?.department && !taskState.team && !task?.id) {
        console.log('✅ 팀 설정 실행:', currentUser.department);
        dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
      }
    }, [currentUser, taskState.team, task]);

    // Task 변경 시 상태 업데이트
    useEffect(() => {
      console.log('🔍 SecurityIncidentEditDialog useEffect 실행:', {
        task,
        open,
        taskMainContent: task?.mainContent,
        taskId: task?.id,
        taskCode: task?.code,
        hasId: !!task?.id
      });
      if (task?.id) {
        console.log('✅ 기존 task 로드:', task);
        console.log('🔍 task.mainContent 값:', task.mainContent);
        dispatch({ type: 'SET_TASK', task });
        // responseStage 초기화
        setResponseStage(task.responseStage || '사고 탐지');
        // incidentReport 초기화 (security_accident_report 테이블에서 로드)
        const loadIncidentReport = async () => {
          try {
            const report = await fetchReportByAccidentId(task.id);
            if (report) {
              console.log('✅ 사고보고 데이터 로드 성공:', report);
              setIncidentReport({
                discoveryDateTime: report.discovery_datetime || '',
                discoverer: report.discoverer || '',
                discoveryMethod: report.discovery_method || '',
                reportDateTime: report.report_datetime || '',
                reporter: report.reporter || '',
                reportMethod: report.report_method || '',
                incidentTarget: report.incident_target || '',
                incidentCause: report.incident_cause || '',
                affectedSystems: report.affected_systems || '',
                affectedData: report.affected_data || '',
                serviceImpact: report.service_impact || '',
                businessImpact: report.business_impact || '',
                situationDetails: report.situation_details || '',
                responseMethod: report.response_method || '',
                improvementExecutor: report.improvement_executor || '',
                expectedCompletionDate: report.expected_completion_date || '',
                improvementDetails: report.improvement_details || '',
                completionDate: report.completion_date || '',
                completionApprover: report.completion_approver || '',
                resolutionDetails: report.resolution_details || '',
                preventionDetails: report.prevention_details || ''
              });
            } else {
              console.log('ℹ️ 사고보고 데이터 없음, 기본값 설정');
              // 기본값 설정
              setIncidentReport({
                discoveryDateTime: '',
                discoverer: '',
                discoveryMethod: '',
                reportDateTime: '',
                reporter: '',
                reportMethod: '',
                incidentTarget: '',
                incidentCause: '',
                affectedSystems: '',
                affectedData: '',
                serviceImpact: '',
                businessImpact: '',
                situationDetails: '',
                responseMethod: '',
                improvementExecutor: '',
                expectedCompletionDate: '',
                improvementDetails: '',
                completionDate: '',
                completionApprover: '',
                resolutionDetails: '',
                preventionDetails: ''
              });
            }
          } catch (error) {
            console.error('🔴 사고보고 데이터 로드 실패:', error);
            // 에러 시에도 기본값 설정
            setIncidentReport({
              discoveryDateTime: '',
              discoverer: '',
              discoveryMethod: '',
              reportDateTime: '',
              reporter: '',
              reportMethod: '',
              incidentTarget: '',
              incidentCause: '',
              affectedSystems: '',
              affectedData: '',
              serviceImpact: '',
              businessImpact: '',
              situationDetails: '',
              responseMethod: '',
              improvementExecutor: '',
              expectedCompletionDate: '',
              improvementDetails: '',
              completionDate: '',
              completionApprover: '',
              resolutionDetails: '',
              preventionDetails: ''
            });
          }
        };

        loadIncidentReport();

        // 재발방지계획(개선사항) 데이터 로드 (커리큘럼탭과 동일한 패턴)
        const loadImprovements = async () => {
          try {
            console.log('🔄 [다이얼로그 열림] 개선사항 데이터 새로고침 시작');
            await fetchImprovementsByAccidentId(task.id);
            console.log('✅ [다이얼로그 열림] 개선사항 데이터 새로고침 완료');
          } catch (error) {
            console.error('🔴 개선사항 데이터 로드 실패:', error);
          }
        };

        loadImprovements();

        // postMeasures 초기화
        if (task.postMeasures) {
          setPostMeasures(task.postMeasures);
        }
      } else if (open) {
        console.log('🔍 새 태스크 초기화 중...');
        // API에서 다음 코드 가져오기
        const initNewTask = async () => {
          try {
            const response = await fetch('/api/security-incident/next-code');
            const result = await response.json();
            const currentUserName = currentUser ? currentUser.user_name : user ? user.name : '';

            console.log('🔍 initNewTask 실행:', {
              currentUser,
              currentUserName,
              user,
              userName: user?.name
            });

            if (response.ok && result.code) {
              const newCode = result.code;
              const newRegistrationDate = getCurrentDate();
              console.log('✅ INIT_NEW_TASK 디스패치:', { code: newCode, assignee: currentUserName });
              dispatch({ type: 'INIT_NEW_TASK', code: newCode, registrationDate: newRegistrationDate, assignee: currentUserName });
              // INIT 직후 team 설정
              console.log('🔍 INIT 후 팀 설정 시도:', { department: currentUser?.department, currentUser });
              if (currentUser?.department) {
                console.log('✅ INIT 후 팀 설정 실행:', currentUser.department);
                dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
              }
            } else {
              console.error('❌ 코드 생성 API 오류:', result);
              // 실패 시 임시 코드 사용
              const tempCode = `SEC-ACC-TEMP-${Date.now()}`;
              const newRegistrationDate = getCurrentDate();
              console.log('✅ INIT_NEW_TASK 디스패치 (임시):', { code: tempCode, assignee: currentUserName });
              dispatch({ type: 'INIT_NEW_TASK', code: tempCode, registrationDate: newRegistrationDate, assignee: currentUserName });
              // INIT 직후 team 설정
              if (currentUser?.department) {
                dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
              }
            }
          } catch (error) {
            console.error('❌ 코드 생성 API 호출 실패:', error);
            // 실패 시 임시 코드 사용
            const tempCode = `SEC-ACC-TEMP-${Date.now()}`;
            const newRegistrationDate = getCurrentDate();
            const currentUserName = currentUser ? currentUser.user_name : user ? user.name : '';
            console.log('✅ INIT_NEW_TASK 디스패치 (에러):', { code: tempCode, assignee: currentUserName });
            dispatch({ type: 'INIT_NEW_TASK', code: tempCode, registrationDate: newRegistrationDate, assignee: currentUserName });
            // INIT 직후 team 설정
            if (currentUser?.department) {
              dispatch({ type: 'SET_FIELD', field: 'team', value: currentUser.department });
            }
          }
        };

        console.log('🔍 새 태스크 초기화 - currentUser 체크:', { currentUser, user });
        if (currentUser || user) {
          console.log('✅ 사용자 정보 있음, initNewTask 실행', { currentUser, user });
          initNewTask();
        } else {
          console.warn('⚠️ currentUser와 user 모두 없음, initNewTask 실행 안 됨');
          // 그래도 기본값으로 초기화는 해야 함
          const tempCode = `SEC-ACC-TEMP-${Date.now()}`;
          const newRegistrationDate = getCurrentDate();
          dispatch({ type: 'INIT_NEW_TASK', code: tempCode, registrationDate: newRegistrationDate, assignee: '' });
        }
        // 새 태스크일 때 기본값으로 초기화
        setResponseStage('사고 탐지');
        setIncidentReport({
          discoveryDateTime: '',
          discoverer: '',
          discoveryMethod: '',
          reportDateTime: '',
          reporter: '',
          reportMethod: '',
          incidentTarget: '',
          incidentCause: '',
          affectedSystems: '',
          affectedData: '',
          serviceImpact: '',
          businessImpact: '',
          situationDetails: '',
          responseMethod: '',
          improvementExecutor: '',
          expectedCompletionDate: '',
          improvementDetails: '',
          completionDate: '',
          completionApprover: '',
          resolutionDetails: '',
          preventionDetails: ''
        });
        setPostMeasures({
          rootCauseAnalysis: '',
          systemImprovements: '',
          policyChanges: '',
          trainingPlan: '',
          preventiveMeasures: '',
          monitoringEnhancement: '',
          responsiblePerson: '',
          implementationDeadline: '',
          budgetRequired: '',
          riskAssessment: '',
          lessonsLearned: '',
          preventionDetails: ''
        });
      }
    }, [task, open, getCurrentDate, currentUser, user, fetchImprovementsByAccidentId]);

    // improvementItems가 업데이트될 때마다 자동으로 state에 반영 (커리큘럼탭과 동일한 패턴)
    useEffect(() => {
      console.log('🔧 [improvementItems useEffect] 실행됨', {
        open,
        taskId: task?.id,
        improvementItemsLength: improvementItems?.length,
        improvementItems: improvementItems
      });

      if (open && task?.id && improvementItems) {
        console.log('🔄 [improvementItems 변경 감지] 데이터 형식 변환 시작');
        console.log('🔧 전체 improvementItems:', improvementItems);

        try {
          const formattedItems = improvementItems.map((item, index) => {
            if (!item || typeof item !== 'object') {
              console.warn(`⚠️ 잘못된 개선사항 데이터 [${index}]:`, item);
              return null;
            }

            return {
              id: item.id || Date.now() + index,
              plan: String(item.plan || ''),
              status: String(item.status || '미완료'),
              completionDate: String(item.completion_date || ''),
              assignee: String(item.assignee || '')
            };
          }).filter(Boolean); // null 제거

          console.log('✅ [improvementItems 변경 감지] 형식 변환 완료:', formattedItems.length, '개');
          console.log('🔧 변환된 개선사항:', formattedItems);
          setImprovementItemsState(formattedItems);
        } catch (error) {
          console.error('🔴 개선사항 데이터 형식 변환 중 오류:', error);
          setImprovementItemsState([]);
        }
      } else if (open && !task?.id) {
        // 신규 모드일 때는 빈 배열로 초기화
        console.log('📝 신규 모드 - 개선사항 빈 배열로 초기화');
        setImprovementItemsState([]);
      }
    }, [improvementItems, open, task?.id]);

    // 최적화된 핸들러들
    const handleFieldChange = useCallback((field: keyof EditSecurityIncidentState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleTabChange = useCallback(
      (event: React.SyntheticEvent, newValue: number) => {
        setEditTab(newValue);

        // 🚀 Option 3: Prefetch - 다음 탭 데이터 미리 로드
        if (task?.id) {
          // 탭 0(개요), 1(사고보고)에서 기록 탭(2) 데이터 미리 로드
          if (newValue === 0 || newValue === 1) {
            const prefetchKey = `feedbacks|${PAGE_IDENTIFIERS.SECURITY_INCIDENT}|${task.id.toString()}`;
            globalMutate(prefetchKey); // 백그라운드에서 미리 로드
            console.log('🚀 Prefetch: 기록 탭 데이터 미리 로드 시작');
          }
        }
      },
      [task?.id, globalMutate]
    );

    const handleSave = useCallback(async () => {
      try {
        // 저장 직전에 현재 입력 값들을 taskState에 강제 반영
        const getCurrentInputValues = () => {
          console.log('🔍 window.getSecurityOverviewTabCurrentValues 존재 여부:', !!(window as any).getSecurityOverviewTabCurrentValues);
          if ((window as any).getSecurityOverviewTabCurrentValues) {
            const values = (window as any).getSecurityOverviewTabCurrentValues();
            console.log('📊 Overview Tab에서 가져온 값:', values);
            return values;
          }
          console.log('⚠️ window 함수 없음, taskState 사용:', taskState);
          return {
            workContent: taskState.workContent,
            responseAction: taskState.responseAction,
            description: taskState.description
          };
        };

        const currentValues = getCurrentInputValues();
        console.log('💾 저장할 currentValues:', currentValues);
        console.log('📌 taskState:', taskState);

        // 필수 입력 검증
        console.log('🔍 필수 입력 검증:', {
          workContent: currentValues.workContent,
          assignee: taskState.assignee,
          incidentType: taskState.incidentType
        });

        if (!currentValues.workContent.trim()) {
          setValidationError('사고내용을 입력해주세요.');
          return;
        }

        if (!taskState.assignee || !taskState.assignee.trim()) {
          setValidationError('담당자를 선택해주세요.');
          return;
        }

        if (!taskState.incidentType.trim()) {
          setValidationError('사고유형을 선택해주세요.');
          return;
        }

        // 에러 초기화
        setValidationError('');

        // 저장할 데이터 준비
        if (!task) {
          // 새 보안사고 생성
          const newTask: SecurityIncidentRecord = {
            id: Date.now(),
            no: Date.now(),
            mainContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            startDate: taskState.startDate,
            completedDate: taskState.completedDate,
            description: currentValues.description,
            responseAction: currentValues.responseAction,
            incidentType: taskState.incidentType,
            team: taskState.team,
            progress: taskState.progress,
            attachment: false,
            attachmentCount: 0,
            attachments: [],
            severity: '중간',
            isNew: true,
            responseStage: responseStage,
            incidentReport: incidentReport,
            postMeasures: postMeasures,
            comments: comments,
            likes: 0,
            likedBy: [],
            views: 0,
            viewedBy: []
          };

          console.log('📌 새 보안사고 저장:', {
            id: newTask.id,
            mainContent: newTask.mainContent,
            assignee: newTask.assignee,
            incidentType: newTask.incidentType,
            status: newTask.status,
            code: newTask.code,
            전체객체: newTask
          });

          // onSave를 먼저 호출하여 DB에 기본 레코드 생성
          let savedTask: any = null;
          try {
            savedTask = await onSave(newTask);
          } catch (saveError) {
            console.error('🔴 onSave 호출 실패:', saveError);
            // onSave가 Promise를 반환하지 않는 경우 처리
            onSave(newTask);
            savedTask = newTask;
          }
          const finalAccidentId = savedTask?.id || newTask.id;
          console.log('💾 저장된 사고 ID:', finalAccidentId);

          // 사고보고 데이터 저장 (security_accident_report 테이블 사용)
          console.log('🔍 사고보고 저장 전 데이터 확인:', {
            finalAccidentId,
            incidentReport,
            incidentReportKeys: incidentReport ? Object.keys(incidentReport) : 'null',
            responseStage
          });

          if (finalAccidentId) {
            console.group('💾 신규 사고 - 사고보고 데이터 저장');
            try {
              // incidentReport가 null이거나 undefined일 경우 빈 객체로 처리
              const safeIncidentReport = incidentReport || {};
              console.log('🔍 safeIncidentReport:', safeIncidentReport);
              console.log('🔍 safeIncidentReport 키:', Object.keys(safeIncidentReport));

              const reportData = {
                accident_id: finalAccidentId,
                discovery_datetime: safeIncidentReport.discoveryDateTime || null,
                discoverer: safeIncidentReport.discoverer || null,
                discovery_method: safeIncidentReport.discoveryMethod || null,
                report_datetime: safeIncidentReport.reportDateTime || null,
                reporter: safeIncidentReport.reporter || null,
                report_method: safeIncidentReport.reportMethod || null,
                incident_target: safeIncidentReport.incidentTarget || null,
                incident_cause: safeIncidentReport.incidentCause || null,
                affected_systems: safeIncidentReport.affectedSystems || null,
                affected_data: safeIncidentReport.affectedData || null,
                service_impact: safeIncidentReport.serviceImpact || null,
                business_impact: safeIncidentReport.businessImpact || null,
                situation_details: safeIncidentReport.situationDetails || null,
                response_method: safeIncidentReport.responseMethod || null,
                improvement_executor: safeIncidentReport.improvementExecutor || null,
                expected_completion_date: safeIncidentReport.expectedCompletionDate || null,
                improvement_details: safeIncidentReport.improvementDetails || null,
                completion_date: safeIncidentReport.completionDate || null,
                completion_approver: safeIncidentReport.completionApprover || null,
                resolution_details: safeIncidentReport.resolutionDetails || null,
                prevention_details: safeIncidentReport.preventionDetails || null
              };

              console.log('📝 저장할 사고보고 데이터:', reportData);

              const savedReport = await saveReport(reportData);
              if (savedReport) {
                console.log('✅ 사고보고 저장 성공:', savedReport);

                // 저장 후 최신 데이터 다시 로드 (캐시 무효화 후)
                const reloadedReport = await fetchReportByAccidentId(finalAccidentId);
                if (reloadedReport) {
                  console.log('✅ 사고보고 데이터 재로드 성공:', reloadedReport);
                  // incidentReport 상태 업데이트
                  setIncidentReport({
                    discoveryDateTime: reloadedReport.discovery_datetime || '',
                    discoverer: reloadedReport.discoverer || '',
                    discoveryMethod: reloadedReport.discovery_method || '',
                    reportDateTime: reloadedReport.report_datetime || '',
                    reporter: reloadedReport.reporter || '',
                    reportMethod: reloadedReport.report_method || '',
                    incidentTarget: reloadedReport.incident_target || '',
                    incidentCause: reloadedReport.incident_cause || '',
                    affectedSystems: reloadedReport.affected_systems || '',
                    affectedData: reloadedReport.affected_data || '',
                    serviceImpact: reloadedReport.service_impact || '',
                    businessImpact: reloadedReport.business_impact || '',
                    situationDetails: reloadedReport.situation_details || '',
                    responseMethod: reloadedReport.response_method || '',
                    improvementExecutor: reloadedReport.improvement_executor || '',
                    expectedCompletionDate: reloadedReport.expected_completion_date || '',
                    improvementDetails: reloadedReport.improvement_details || '',
                    completionDate: reloadedReport.completion_date || '',
                    completionApprover: reloadedReport.completion_approver || '',
                    resolutionDetails: reloadedReport.resolution_details || '',
                    preventionDetails: reloadedReport.prevention_details || ''
                  });
                }
              } else {
                console.warn('⚠️ 사고보고 저장 실패 - null 반환');
                console.warn('🔍 reportLoading:', reportLoading);
                console.warn('🔍 reportError:', reportError);
              }
            } catch (reportError) {
              console.error('🔴 사고보고 저장 예외 발생:', reportError);
              console.error('🔴 에러 타입:', typeof reportError);
              console.error('🔴 에러 상세:', JSON.stringify(reportError, null, 2));
            }
            console.groupEnd();
          } else {
            console.warn('⚠️ finalAccidentId가 없어 사고보고 저장 불가');
          }

          // 신규 사고의 경우 개선사항 저장 (커리큘럼탭과 동일한 패턴: replaceAllImprovements 사용)
          if (finalAccidentId && improvementItemsState.length > 0) {
            console.group('💾 신규 사고 개선사항 저장 프로세스');
            console.log('🚀 시작, ID:', finalAccidentId);
            console.log('📋 저장할 개선사항:', improvementItemsState);

            try {
              // 커리큘럼탭과 동일: improvementItemsState를 DB 형식으로 변환
              const improvementRequests = improvementItemsState.map((item) => ({
                accident_id: finalAccidentId,
                plan: item.plan || '',
                status: item.status || '미완료',
                completion_date: item.completionDate || undefined,
                assignee: item.assignee || undefined
              }));

              console.log('📝 DB 저장용 데이터:', improvementRequests);

              const success = await replaceAllImprovements(finalAccidentId, improvementRequests);

              if (success) {
                console.log('✅ 개선사항 저장 성공');
              } else {
                console.warn('⚠️ 개선사항 저장 실패');
              }

              console.groupEnd();
            } catch (improvementError) {
              console.group('🔴 신규 사고 개선사항 저장 오류');
              console.error('오류:', improvementError);
              console.groupEnd();
            }
          } else {
            console.log('📝 저장할 개선사항 없음 (신규 모드)');
          }
        } else {
          // 기존 보안사고 수정
          const updatedTask: SecurityIncidentRecord = {
            ...task,
            mainContent: currentValues.workContent,
            assignee: taskState.assignee,
            status: taskState.status,
            startDate: taskState.startDate,
            completedDate: taskState.completedDate,
            description: currentValues.description,
            responseAction: currentValues.responseAction,
            incidentType: taskState.incidentType,
            team: taskState.team,
            code: taskState.code,
            registrationDate: taskState.registrationDate,
            progress: taskState.progress,
            responseStage: responseStage,
            incidentReport: incidentReport,
            postMeasures: postMeasures,
            comments: comments
          };

          console.log('📌 보안사고 수정:', {
            id: updatedTask.id,
            mainContent: updatedTask.mainContent,
            assignee: updatedTask.assignee,
            incidentType: updatedTask.incidentType,
            status: updatedTask.status,
            code: updatedTask.code,
            comments: updatedTask.comments,
            전체객체: updatedTask
          });

          // onSave를 먼저 호출하여 DB 업데이트
          let savedTask: any = null;
          try {
            savedTask = await onSave(updatedTask);
          } catch (saveError) {
            console.error('🔴 onSave 호출 실패:', saveError);
            // onSave가 Promise를 반환하지 않는 경우 처리
            onSave(updatedTask);
            savedTask = updatedTask;
          }
          const finalAccidentId = savedTask?.id || updatedTask.id;
          console.log('💾 수정된 사고 ID:', finalAccidentId);

          // 사고보고 데이터 저장 (security_accident_report 테이블 사용)
          console.log('🔍 수정 모드 - 사고보고 저장 전 데이터 확인:', {
            finalAccidentId,
            incidentReport,
            incidentReportKeys: incidentReport ? Object.keys(incidentReport) : 'null',
            responseStage
          });

          if (finalAccidentId) {
            console.group('💾 수정 모드 - 사고보고 데이터 저장');
            try {
              // incidentReport가 null이거나 undefined일 경우 빈 객체로 처리
              const safeIncidentReport = incidentReport || {};
              console.log('🔍 safeIncidentReport:', safeIncidentReport);
              console.log('🔍 safeIncidentReport 키:', Object.keys(safeIncidentReport));

              const reportData = {
                accident_id: finalAccidentId,
                discovery_datetime: safeIncidentReport.discoveryDateTime || null,
                discoverer: safeIncidentReport.discoverer || null,
                discovery_method: safeIncidentReport.discoveryMethod || null,
                report_datetime: safeIncidentReport.reportDateTime || null,
                reporter: safeIncidentReport.reporter || null,
                report_method: safeIncidentReport.reportMethod || null,
                incident_target: safeIncidentReport.incidentTarget || null,
                incident_cause: safeIncidentReport.incidentCause || null,
                affected_systems: safeIncidentReport.affectedSystems || null,
                affected_data: safeIncidentReport.affectedData || null,
                service_impact: safeIncidentReport.serviceImpact || null,
                business_impact: safeIncidentReport.businessImpact || null,
                situation_details: safeIncidentReport.situationDetails || null,
                response_method: safeIncidentReport.responseMethod || null,
                improvement_executor: safeIncidentReport.improvementExecutor || null,
                expected_completion_date: safeIncidentReport.expectedCompletionDate || null,
                improvement_details: safeIncidentReport.improvementDetails || null,
                completion_date: safeIncidentReport.completionDate || null,
                completion_approver: safeIncidentReport.completionApprover || null,
                resolution_details: safeIncidentReport.resolutionDetails || null,
                prevention_details: safeIncidentReport.preventionDetails || null
              };

              console.log('📝 저장할 사고보고 데이터:', reportData);

              const savedReport = await saveReport(reportData);
              if (savedReport) {
                console.log('✅ 사고보고 저장 성공:', savedReport);

                // 저장 후 최신 데이터 다시 로드 (캐시 무효화 후)
                const reloadedReport = await fetchReportByAccidentId(finalAccidentId);
                if (reloadedReport) {
                  console.log('✅ 사고보고 데이터 재로드 성공:', reloadedReport);
                  // incidentReport 상태 업데이트
                  setIncidentReport({
                    discoveryDateTime: reloadedReport.discovery_datetime || '',
                    discoverer: reloadedReport.discoverer || '',
                    discoveryMethod: reloadedReport.discovery_method || '',
                    reportDateTime: reloadedReport.report_datetime || '',
                    reporter: reloadedReport.reporter || '',
                    reportMethod: reloadedReport.report_method || '',
                    incidentTarget: reloadedReport.incident_target || '',
                    incidentCause: reloadedReport.incident_cause || '',
                    affectedSystems: reloadedReport.affected_systems || '',
                    affectedData: reloadedReport.affected_data || '',
                    serviceImpact: reloadedReport.service_impact || '',
                    businessImpact: reloadedReport.business_impact || '',
                    situationDetails: reloadedReport.situation_details || '',
                    responseMethod: reloadedReport.response_method || '',
                    improvementExecutor: reloadedReport.improvement_executor || '',
                    expectedCompletionDate: reloadedReport.expected_completion_date || '',
                    improvementDetails: reloadedReport.improvement_details || '',
                    completionDate: reloadedReport.completion_date || '',
                    completionApprover: reloadedReport.completion_approver || '',
                    resolutionDetails: reloadedReport.resolution_details || '',
                    preventionDetails: reloadedReport.prevention_details || ''
                  });
                }
              } else {
                console.warn('⚠️ 사고보고 저장 실패 - null 반환');
                console.warn('🔍 reportLoading:', reportLoading);
                console.warn('🔍 reportError:', reportError);
              }
            } catch (reportError) {
              console.error('🔴 사고보고 저장 예외 발생:', reportError);
              console.error('🔴 에러 타입:', typeof reportError);
              console.error('🔴 에러 상세:', JSON.stringify(reportError, null, 2));
            }
            console.groupEnd();
          } else {
            console.warn('⚠️ finalAccidentId가 없어 사고보고 저장 불가');
          }

          // 수정 모드에서도 개선사항 저장 (커리큘럼탭과 동일한 패턴: replaceAllImprovements 사용)
          if (updatedTask.id) {
            console.group('💾 수정 모드 개선사항 저장 프로세스');
            console.log('🚀 시작, ID:', updatedTask.id);
            console.log('📋 저장할 개선사항:', improvementItemsState);

            try {
              // 커리큘럼탭과 동일: improvementItemsState를 DB 형식으로 변환
              const improvementRequests = improvementItemsState.map((item) => ({
                accident_id: updatedTask.id,
                plan: item.plan || '',
                status: item.status || '미완료',
                completion_date: item.completionDate || undefined,
                assignee: item.assignee || undefined
              }));

              console.log('📝 DB 저장용 데이터:', improvementRequests);

              const success = await replaceAllImprovements(updatedTask.id, improvementRequests);

              if (success) {
                console.log('✅ 개선사항 저장 성공');
              } else {
                console.warn('⚠️ 개선사항 저장 실패');
              }

              console.groupEnd();
            } catch (improvementError) {
              console.group('🔴 수정 모드 개선사항 저장 오류');
              console.error('오류:', improvementError);
              console.groupEnd();
            }
          } else {
            console.log('⚠️ updatedTask.id가 없어 개선사항 저장 불가');
          }
        }

        // 🔄 기록 탭 변경사항 DB 저장
        console.log('💾 기록 탭 변경사항 저장 시작');
        console.time('⏱️ 기록 저장 Total');

        if (task?.id) {
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

        onClose();
      } catch (error) {
        console.error('🔴 handleSave 오류:', error);
        if (error instanceof Error) {
          setValidationError(`저장 중 오류가 발생했습니다: ${error.message}`);
        } else {
          setValidationError('저장 중 알 수 없는 오류가 발생했습니다.');
        }
      }
    }, [
      task,
      taskState,
      onSave,
      onClose,
      responseStage,
      incidentReport,
      postMeasures,
      comments,
      pendingFeedbacks,
      initialFeedbacks,
      feedbacks,
      addFeedback,
      updateFeedback,
      deleteFeedback,
      improvementItemsState,
      replaceAllImprovements,
      saveReport,
      fetchReportByAccidentId,
      reportLoading,
      reportError
    ]);

    const handleClose = useCallback(() => {
      setEditTab(0);
      dispatch({ type: 'RESET' });
      setChecklistItems([]);
      setNewComment('');
      setNewChecklistText('');
      setPostMeasures({
        rootCauseAnalysis: '',
        systemImprovements: '',
        policyChanges: '',
        trainingPlan: '',
        preventiveMeasures: '',
        monitoringEnhancement: '',
        responsiblePerson: '',
        implementationDeadline: '',
        budgetRequired: '',
        riskAssessment: '',
        lessonsLearned: ''
      });
      setValidationError('');
      // 🔄 기록 탭 임시 데이터 초기화
      setPendingFeedbacks([]);
      setInitialFeedbacks([]);
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
        assignee: '김철수'
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

    const handleToggleChecklistItem = useCallback((index: number) => {
      setChecklistItems((prev) => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
    }, []);

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

    const handleChecklistDueDateChange = useCallback((id: number, dueDate: string) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, dueDate } : item)));
    }, []);

    const handleChecklistProgressRateChange = useCallback((id: number, progressRate: number) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, progressRate } : item)));
    }, []);

    const handleToggleExpanded = useCallback((id: number) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : item)));
    }, []);

    // 드래그 앤 드롭 핸들러들 (간단 버전)
    const handleDragStart = useCallback((e: React.DragEvent, itemId: number) => {
      setDraggedItemId(itemId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    const handleDragEnd = useCallback(() => {
      setDraggedItemId(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetId: number) => {
      e.preventDefault();
      setDraggedItemId(null);
    }, []);

    // 🚀 Option 3: 다이얼로그 열릴 때 기록 탭 데이터 prefetch
    // Note: globalMutate는 안정적인 함수이므로 dependency에서 제외
    useEffect(() => {
      if (open && task?.id) {
        const prefetchKey = `feedbacks|${PAGE_IDENTIFIERS.SECURITY_INCIDENT}|${task.id.toString()}`;
        // 백그라운드에서 미리 로드 (사용자가 기록 탭 클릭하기 전에)
        setTimeout(() => {
          globalMutate(prefetchKey);
          console.log('🚀 다이얼로그 열림: 기록 탭 데이터 미리 로드 시작');
        }, 100); // 100ms 지연 후 로드 (다이얼로그 렌더링 우선)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, task?.id]);

    // 🔄 기록 탭 핸들러들 - 로컬 state만 변경 (임시 저장)
    const handleAddComment = useCallback(() => {
      if (!newComment.trim() || !task?.id) return;

      const currentUserName = currentUser?.user_name || user?.name || '현재 사용자';
      const currentTeam = currentUser?.department || user?.department || '';
      const currentPosition = convertSubcodeName(currentUser?.role || '', positionOptions);
      const currentProfileImage = currentUser?.profile_image_url || '';

      // 로컬 임시 ID 생성
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newFeedback: FeedbackData = {
        id: tempId,
        page: PAGE_IDENTIFIERS.SECURITY_INCIDENT,
        record_id: task.id.toString(),
        action_type: '기록',
        description: newComment,
        // user_id는 UUID 타입이므로 전달하지 않음 (nullable)
        user_name: currentUserName,
        team: currentTeam,
        created_at: new Date().toISOString(),
        metadata: {},
        user_department: currentTeam,
        user_position: currentPosition,
        user_profile_image: currentProfileImage
      };

      // 로컬 state에만 추가 (즉시 반응)
      setPendingFeedbacks((prev) => [newFeedback, ...prev]);
      setNewComment('');
    }, [newComment, task, currentUser, user, positionOptions, convertSubcodeName]);

    const handleEditComment = useCallback((commentId: string, content: string) => {
      setEditingCommentId(commentId);
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

    const handleDeleteComment = useCallback((commentId: string) => {
      // 로컬 state에서만 제거 (즉시 반응)
      setPendingFeedbacks((prev) => prev.filter((fb) => fb.id !== commentId));
    }, []);

    const handlePostMeasuresChange = useCallback((field: string, value: string) => {
      setPostMeasures((prev) => ({
        ...prev,
        [field]: value
      }));
    }, []);

    // 사고보고 변경 핸들러 추가
    const handleIncidentReportChange = useCallback((field: string, value: any) => {
      setIncidentReport((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }, []);

    // 개요 탭용 props
    const overviewTabProps = useMemo(
      () => ({
        taskState,
        onFieldChange: handleFieldChange,
        assignees,
        assigneeAvatars,
        statusOptions,
        statusColors
      }),
      [taskState, handleFieldChange, assignees, assigneeAvatars, statusOptions, statusColors]
    );

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
              보안사고관리 편집
            </Typography>
            {task && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                {task.mainContent} ({task.code})
              </Typography>
            )}
          </Box>

          {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              size="small"
              disabled={(!task || task.id === 0) ? !(canCreateData || canEditOwn) : !(canEditOthers || (canEditOwn && isOwner))}
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
              disabled={(!task || task.id === 0) ? !(canCreateData || canEditOwn) : !(canEditOthers || (canEditOwn && isOwner))}
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
            <Tab label="사고보고" />
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {editTab === 0 && <SecurityIncidentOverviewTab {...overviewTabProps} />}
          {editTab === 1 && (
            <SecurityIncidentReportTab
              incidentReport={incidentReport}
              onIncidentReportChange={handleIncidentReportChange}
              responseStage={responseStage}
              onResponseStageChange={setResponseStage}
              accidentId={task?.id}
              // 커리큘럼탭과 동일한 패턴: 부모 state 전달
              improvementItems={improvementItemsState}
              setImprovementItems={setImprovementItemsState}
              selectedRows={selectedImprovementRows}
              setSelectedRows={setSelectedImprovementRows}
            />
          )}
          {editTab === 2 && (
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
              currentUserRole={convertSubcodeName(currentUser?.role || '', positionOptions)}
              currentUserDepartment={currentUser?.department || user?.department || ''}
            />
          )}
          {editTab === 3 && <MaterialTab recordId={task?.id} currentUser={currentUser} canEditOwn={canEditOwn && isOwner} canEditOthers={canEditOthers} />}
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

SecurityIncidentEditDialog.displayName = 'SecurityIncidentEditDialog';

export default SecurityIncidentEditDialog;
