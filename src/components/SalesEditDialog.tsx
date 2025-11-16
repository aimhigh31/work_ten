import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  Grid,
  Paper,
  IconButton,
  Divider,
  Alert,
  Stack,
  Avatar,
  Chip,
  Pagination
} from '@mui/material';
// Icons - 기존 프로젝트에서 사용하는 iconsax 사용
import { CloseCircle, Edit, TickSquare, CloseSquare } from '@wandersonalwes/iconsax-react';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS } from '../types/feedback';
import useUser from '../hooks/useUser';
import type { SalesRecord } from '../types/sales';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';

interface SalesEditDialogProps {
  open: boolean;
  onClose: () => void;
  salesRecord: SalesRecord | null;
  onSave: (updatedRecord: SalesRecord) => void;
  users?: any[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  generateSalesCode?: () => Promise<string>;
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

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

// 자료 탭 컴포넌트 - DB 기반 파일 관리
const MaterialTab = memo(({ recordId, currentUser, canEdit = true, canEditOwn = true, canEditOthers = true }: { recordId?: number | string; currentUser?: any; canEdit?: boolean; canEditOwn?: boolean; canEditOthers?: boolean }) => {
  const {
    files,
    loading: filesLoading,
    uploadFile,
    updateFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useSupabaseFiles(PAGE_IDENTIFIERS.SALES, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 매출을 저장해주세요.');
        return;
      }

      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const uploadPromises = Array.from(fileList).map(async (file) => {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.SALES,
          record_id: String(recordId),
          user_id: undefined,
          user_name: currentUser?.name || '알 수 없음',
          team: currentUser?.department
        });

        if (!result.success) {
          alert(`파일 업로드 실패: ${result.error}`);
        }
      });

      await Promise.all(uploadPromises);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [recordId, uploadFile, currentUser]
  );

  const handleEditMaterial = useCallback((fileId: string, fileName: string) => {
    setEditingMaterialId(fileId);
    setEditingMaterialText(fileName);
  }, []);

  const handleSaveEditMaterial = useCallback(async () => {
    if (!editingMaterialText.trim() || !editingMaterialId) return;

    try {
      await updateFile(editingMaterialId, {
        file_name: editingMaterialText.trim()
      });
      setEditingMaterialId(null);
      setEditingMaterialText('');
    } catch (error) {
      console.error('파일명 수정 실패:', error);
      alert('파일명 수정에 실패했습니다.');
    }
  }, [editingMaterialText, editingMaterialId, updateFile]);

  const handleCancelEditMaterial = useCallback(() => {
    setEditingMaterialId(null);
    setEditingMaterialText('');
  }, []);

  const handleDeleteMaterial = useCallback(
    async (fileId: string) => {
      if (!confirm('파일을 삭제하시겠습니까?')) return;

      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error('파일 삭제 실패:', error);
        alert('파일 삭제에 실패했습니다.');
      }
    },
    [deleteFile]
  );

  const handleDownloadMaterial = useCallback(async (file: FileData) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    if (!recordId) {
      alert('파일을 업로드하려면 먼저 매출을 저장해주세요.');
      return;
    }
    fileInputRef.current?.click();
  }, [recordId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return '🖼️';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) return '🎥';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return '🎵';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx', 'txt'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📋';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦';
    return '📄';
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
              {isUploading ? '파일 업로드 중...' : '파일을 업로드하세요'}
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
              파일 선택
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* 자료 항목들 */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {filesLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              파일 목록 로딩 중...
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {files.map((file: FileData) => (
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
                    <Typography fontSize="24px">{getFileIcon(file.file_name)}</Typography>
                  </Box>

                  {/* 파일 정보 영역 */}
                  <Box sx={{ flexGrow: 1 }}>
                    {editingMaterialId === file.id ? (
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
                        onClick={() => handleEditMaterial(file.id, file.file_name)}
                      >
                        {file.file_name}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('ko-KR')}
                      {file.uploaded_by && ` • ${file.uploaded_by}`}
                    </Typography>
                  </Box>

                  {/* 액션 버튼들 */}
                  <Stack direction="row" spacing={1}>
                    {editingMaterialId === file.id ? (
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
                          onClick={() => handleEditMaterial(file.id, file.file_name)}
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
                          onClick={() => handleDeleteMaterial(file.id)}
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // 기록탭(index 1)은 padding 없음 (InvestmentEditDialog와 동일하게)
  const padding = index === 1 ? { p: 0 } : { p: 2, px: 1.5 };

  return (
    <div role="tabpanel" hidden={value !== index} id={`sales-tabpanel-${index}`} aria-labelledby={`sales-tab-${index}`} {...other}>
      {value === index && <Box sx={padding}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `sales-tab-${index}`,
    'aria-controls': `sales-tabpanel-${index}`
  };
}

const SalesEditDialog: React.FC<SalesEditDialogProps> = ({ open, onClose, salesRecord, onSave, users: propUsers, canCreateData = true, canEditOwn = true, canEditOthers = true, generateSalesCode, setSnackbar }) => {
  const [value, setValue] = useState(0);
  const [formData, setFormData] = useState<SalesRecord | null>(null);

  // 로그인된 사용자 정보
  const user = useUser();
  const currentUser = {
    name: user ? user.name : '사용자',
    department: user ? user.department || '부서' : '부서',
    profileImage: user ? user.avatar : '/assets/images/users/avatar-1.png',
    role: user ? user.role : ''
  };

  // ✅ 공용 창고에서 마스터코드 및 사용자 데이터 가져오기
  const { masterCodes, users } = useCommonData();

  console.log('🔍 [SalesEditDialog] masterCodes:', masterCodes?.length);
  console.log('🔍 [SalesEditDialog] users:', users?.length);

  // 세션 및 권한 체크
  const { data: session } = useSession();
  const usersForPermissionCheck = propUsers || users;

  const currentUserForPermission = useMemo(() => {
    if (!session?.user?.email || !usersForPermissionCheck || usersForPermissionCheck.length === 0) {
      console.log('🔍 [SalesEditDialog] currentUserForPermission: 없음 (세션 또는 users 없음)');
      return null;
    }
    const found = usersForPermissionCheck.find((u) => u.email === session.user.email);
    console.log('🔍 [SalesEditDialog] currentUserForPermission:', found ? found.user_name : '없음');
    return found;
  }, [session, usersForPermissionCheck]);

  // 데이터 소유자 확인 (생성자 또는 담당자)
  const isDataOwner = useMemo(() => {
    if (!salesRecord) return true; // 신규 생성인 경우 true
    if (!currentUserForPermission) return false;

    const currentUserName = currentUserForPermission?.user_name;

    // createdBy로 확인 (우선순위 1)
    const isCreator = salesRecord.createdBy === currentUserName;

    // registrant로 확인 (우선순위 2)
    // registrant가 "홍길동 팀장" 형식일 수 있으므로, startsWith도 체크
    const registrantStartsWith = salesRecord.registrant?.startsWith(currentUserName || '');
    const isAssignee = salesRecord.registrant === currentUserName || registrantStartsWith;

    const result = isCreator || isAssignee;

    console.log('🔍 [SalesEditDialog] 소유자 확인:', {
      salesRecordId: salesRecord.id,
      createdBy: salesRecord.createdBy,
      registrant: salesRecord.registrant,
      currentUserName,
      isCreator,
      registrantStartsWith,
      isAssignee,
      isDataOwner: result
    });

    return result;
  }, [salesRecord, currentUserForPermission]);

  // 편집 권한 확인
  const canEdit = useMemo(() => {
    if (!salesRecord) {
      console.log('🔍 [SalesEditDialog] 신규 생성 - canEdit:', canCreateData);
      return canCreateData; // 신규 생성
    }

    const result = canEditOthers || (canEditOwn && isDataOwner);
    console.log('🔍 [SalesEditDialog] 편집 가능 여부:', {
      canEditOthers,
      canEditOwn,
      isDataOwner,
      canEdit: result
    });

    return result;
  }, [salesRecord, canCreateData, canEditOwn, canEditOthers, isDataOwner]);

  // Supabase 클라이언트 생성 (DB 직접 조회용)
  const supabaseClient = React.useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // DB 직접 조회 상태
  const [businessUnitsFromDB, setBusinessUnitsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
  const [customerNamesFromDB, setCustomerNamesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
  const [salesTypesFromDB, setSalesTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
  const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

  // Dialog 열릴 때마다 DB에서 직접 조회
  useEffect(() => {
    if (!open) return;

    const fetchMasterCodeData = async () => {
      // GROUP035: 사업부
      const { data: group035Data } = await supabaseClient
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('codetype', 'subcode')
        .eq('group_code', 'GROUP035')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (group035Data) {
        setBusinessUnitsFromDB(group035Data);
        console.log('✅ [SalesEditDialog] GROUP035 사업부 DB 조회 완료:', group035Data.length, '개');
      }

      // GROUP039: 고객명
      const { data: group039Data } = await supabaseClient
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('codetype', 'subcode')
        .eq('group_code', 'GROUP039')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (group039Data) {
        setCustomerNamesFromDB(group039Data);
        console.log('✅ [SalesEditDialog] GROUP039 고객명 DB 조회 완료:', group039Data.length, '개');
      }

      // GROUP036: 판매유형
      const { data: group036Data } = await supabaseClient
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('codetype', 'subcode')
        .eq('group_code', 'GROUP036')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (group036Data) {
        setSalesTypesFromDB(group036Data);
        console.log('✅ [SalesEditDialog] GROUP036 판매유형 DB 조회 완료:', group036Data.length, '개');
      }

      // GROUP002: 상태
      const { data: group002Data } = await supabaseClient
        .from('admin_mastercode_data')
        .select('subcode, subcode_name, subcode_order')
        .eq('codetype', 'subcode')
        .eq('group_code', 'GROUP002')
        .eq('is_active', true)
        .order('subcode_order', { ascending: true });

      if (group002Data) {
        setStatusTypesFromDB(group002Data);
        console.log('✅ [SalesEditDialog] GROUP002 상태 DB 조회 완료:', group002Data.length, '개');
      }
    };

    fetchMasterCodeData();
  }, [supabaseClient, open]);

  // statusTypesFromDB 로드 후 신규 생성 시 기본값 설정
  useEffect(() => {
    if (formData && !salesRecord && statusTypesFromDB.length > 0 && !formData.status) {
      console.log('🔧 [SalesEditDialog] status 기본값 설정:', statusTypesFromDB[0].subcode);
      setFormData(prev => prev ? { ...prev, status: statusTypesFromDB[0].subcode } : null);
    }
  }, [statusTypesFromDB, formData, salesRecord]);

  // 피드백/기록 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.SALES, salesRecord?.id);

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

  // Supabase feedbacks를 RecordTab 형식으로 변환하고 pendingComments와 합치기
  const comments = useMemo(() => {
    // 기존 DB의 feedbacks (삭제된 것 제외)
    const existingComments = feedbacks
      .filter((feedback) => !deletedCommentIds.includes(String(feedback.id)))
      .map((feedback) => {
        // user_name으로 사용자 찾기
        const feedbackUser = users.find((u) => u.user_name === feedback.user_name);

        // 수정된 내용이 있으면 사용 (feedback.id를 문자열로 변환)
        const feedbackIdStr = String(feedback.id);
        const content = modifiedComments[feedbackIdStr] || feedback.description;

        return {
          id: feedbackIdStr, // 문자열로 변환
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

  // 유효성 검사 상태
  const [validationError, setValidationError] = useState('');

  // salesRecord가 변경될 때 formData 초기화
  useEffect(() => {
    if (open) {
      if (salesRecord) {
        console.log('📝 기존 매출 데이터 로드:', salesRecord);
        setFormData({ ...salesRecord });
      } else {
        console.log('🆕 신규 매출 생성 - 초기값 설정');
        // 새로운 레코드를 위한 기본값 설정
        setFormData({
          id: Date.now(),
          registrationDate: new Date().toISOString().split('T')[0],
          code: `PLAN-SALES-${new Date().getFullYear().toString().slice(-2)}-001`,
          customerName: '',
          salesType: '',
          status: '', // 초기값 빈 문자열 (DB 로드 후 설정)
          businessUnit: '',
          modelCode: '',
          itemCode: '',
          itemName: '',
          quantity: 0,
          unitPrice: 0,
          totalAmount: 0,
          team: currentUser.department,
          registrant: currentUser.role ? `${currentUser.name} ${currentUser.role}` : currentUser.name,
          deliveryDate: '',
          notes: ''
        });
      }
    } else {
      // 다이얼로그가 닫힐 때 formData 초기화
      console.log('🚪 다이얼로그 닫힘 - formData 초기화');
      setFormData(null);
    }
  }, [salesRecord, open]);

  // 매출 코드 자동 생성 (신규 생성 시에만)
  useEffect(() => {
    const initializeNewSalesCode = async () => {
      // 다이얼로그가 열렸고, 신규 생성 모드일 때만 코드 생성
      if (open && !salesRecord && generateSalesCode) {
        try {
          const newCode = await generateSalesCode();
          console.log('🔄 [SalesEditDialog] 자동 생성된 코드:', newCode);
          setFormData((prev) => {
            if (prev && prev.code.startsWith('PLAN-SALES-')) {
              // 임시 코드만 업데이트 (이미 생성된 코드는 유지)
              return { ...prev, code: newCode };
            }
            return prev;
          });
        } catch (error) {
          console.error('❌ [SalesEditDialog] 코드 생성 실패:', error);
        }
      }
    };

    initializeNewSalesCode();
  }, [open, salesRecord, generateSalesCode]);

  // 다이얼로그가 열릴 때 탭을 첫 번째로 리셋
  useEffect(() => {
    if (open) {
      setValue(0);
    }
  }, [open]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleInputChange = (field: keyof SalesRecord, value: any) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleSave = async () => {
    console.log('💾 [SalesEditDialog] handleSave 호출됨');
    console.log('📦 [SalesEditDialog] formData:', formData);

    if (!formData) {
      console.log('❌ [SalesEditDialog] formData가 없음');
      return;
    }

    // 필수값 검증
    if (!formData.businessUnit) {
      console.log('❌ [SalesEditDialog] 사업부 누락');
      setValidationError('사업부를 선택해주세요.');
      return;
    }
    if (!formData.customerName) {
      console.log('❌ [SalesEditDialog] 고객명 누락');
      setValidationError('고객명을 선택해주세요.');
      return;
    }
    if (!formData.modelCode) {
      console.log('❌ [SalesEditDialog] 모델코드 누락');
      setValidationError('모델코드를 입력해주세요.');
      return;
    }
    if (!formData.itemCode) {
      console.log('❌ [SalesEditDialog] 품목코드 누락');
      setValidationError('품목코드를 입력해주세요.');
      return;
    }
    if (!formData.itemName) {
      console.log('❌ [SalesEditDialog] 품목명 누락');
      setValidationError('품목명을 입력해주세요.');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      console.log('❌ [SalesEditDialog] 수량 누락 또는 0 이하:', formData.quantity);
      setValidationError('수량을 입력해주세요.');
      return;
    }
    if (!formData.unitPrice || formData.unitPrice <= 0) {
      console.log('❌ [SalesEditDialog] 단가 누락 또는 0 이하:', formData.unitPrice);
      setValidationError('단가를 입력해주세요.');
      return;
    }
    if (!formData.salesType) {
      console.log('❌ [SalesEditDialog] 판매유형 누락');
      setValidationError('판매유형을 선택해주세요.');
      return;
    }
    if (!formData.deliveryDate) {
      console.log('❌ [SalesEditDialog] 배송일 누락');
      setValidationError('배송일을 선택해주세요.');
      return;
    }

    // 검증 통과
    console.log('✅ [SalesEditDialog] 유효성 검증 통과! onSave 호출...');
    console.log('📤 [SalesEditDialog] 전달할 데이터:', JSON.stringify(formData, null, 2));
    setValidationError('');
    onSave(formData);
    console.log('✅ [SalesEditDialog] onSave 호출 완료');

    // 기록(피드백) 데이터 저장
    console.log('📝 기록 데이터 저장 시작');
    console.log('📝 삭제할 기록:', deletedCommentIds.length, '개');
    console.log('📝 수정할 기록:', Object.keys(modifiedComments).length, '개');
    console.log('📝 추가할 기록:', pendingComments.length, '개');

    try {
      // 삭제된 기록들 처리
      if (deletedCommentIds.length > 0) {
        for (const commentId of deletedCommentIds) {
          // DB 피드백 ID는 숫자로 변환하여 삭제
          await deleteFeedback(Number(commentId));
          console.log('✅ 기록 삭제 완료:', commentId);
        }
      }

      // 수정된 기록들 처리
      if (Object.keys(modifiedComments).length > 0) {
        for (const [commentId, newContent] of Object.entries(modifiedComments)) {
          // DB 피드백 ID는 숫자로 변환하여 수정
          await updateFeedback(Number(commentId), { description: newContent });
          console.log('✅ 기록 수정 완료:', commentId);
        }
      }

      // 새로 추가된 기록들 처리
      if (pendingComments.length > 0 && formData?.id) {
        console.log('📝 기록 추가 시작:', {
          '기록 개수': pendingComments.length,
          '매출 ID (원본)': formData.id,
          '매출 ID (타입)': typeof formData.id,
          '매출 ID (문자열 변환)': String(formData.id)
        });

        for (const comment of pendingComments) {
          const feedbackInput = {
            page: PAGE_IDENTIFIERS.SALES,
            record_id: String(formData.id), // 숫자를 문자열로 변환
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
      } else if (pendingComments.length > 0 && !formData?.id) {
        console.error('❌ 기록을 저장할 수 없음: formData.id가 없습니다', {
          'formData.id': formData?.id,
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
      console.warn('⚠️ 기록 저장에 실패했지만 매출 데이터는 저장되었습니다.');
    }

    // onClose는 SalesManagement에서 호출됨
  };

  const handleClose = () => {
    setValue(0); // 탭을 첫 번째로 리셋
    setFormData(null); // 폼 데이터 초기화
    setPendingComments([]); // 임시 기록 초기화
    setModifiedComments({}); // 수정된 기록 초기화
    setDeletedCommentIds([]); // 삭제된 기록 ID 초기화
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setValidationError(''); // 유효성 검사 에러 초기화
    onClose();
  };

  // 기록 탭 핸들러들
  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    // 현재 사용자 정보 가져오기
    const feedbackUser = users.find((u) => u.user_name === user?.name);
    const currentUserName = feedbackUser?.user_name || user?.name || '현재 사용자';
    const currentTeam = feedbackUser?.department || user?.department || '';
    const currentPosition = feedbackUser?.position || '';
    const currentProfileImage = feedbackUser?.profile_image_url || '';
    const currentRole = feedbackUser?.role || '';

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
  }, [newComment, users, user]);

  const handleEditComment = useCallback((commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  }, []);

  const handleSaveEditComment = useCallback(() => {
    if (!editingCommentText.trim() || !editingCommentId) return;

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
      setPendingComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } else {
      // 기존 DB 데이터는 삭제 목록에 추가 (저장 시 DB에서 삭제)
      setDeletedCommentIds((prev) => [...prev, commentId]);
    }
  }, []);

  if (!formData || !open) return null;

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
            매출관리 편집
          </Typography>
          {salesRecord && formData && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
              {formData.itemName} ({formData.code})
            </Typography>
          )}
        </Box>

        {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={!canEdit}
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
            disabled={!canEdit}
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
        <Tabs value={value} onChange={handleChange}>
          <Tab label="개요" />
          <Tab label="기록" />
          <Tab label="자료" />
        </Tabs>
      </Box>

      <DialogContent
        sx={{
          p: 1,
          pt: 1,
          pb: 1,
          height: 'calc(840px - 80px - 60px)',
          maxHeight: 'calc(840px - 80px - 60px)',
          overflow: 'auto'
        }}
      >
        {formData && (
          <>
            <TabPanel value={value} index={0}>
              {/* 개요 탭 */}
              <Stack spacing={3}>
                {/* 사업부-고객명 */}
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel shrink>
                      사업부 <span style={{ color: 'red' }}>*</span>
                    </InputLabel>
                    <Select
                      value={formData.businessUnit || ''}
                      label="사업부 *"
                      onChange={(e) => handleInputChange('businessUnit', e.target.value)}
                      displayEmpty
                      notched
                      renderValue={(selected) => {
                        if (!selected) return '선택';
                        const item = businessUnitsFromDB.find(b => b.subcode === selected);
                        return item ? item.subcode_name : selected;
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        }
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {businessUnitsFromDB.map((option) => (
                        <MenuItem key={option.subcode} value={option.subcode}>
                          {option.subcode_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel shrink>
                      고객명 <span style={{ color: 'red' }}>*</span>
                    </InputLabel>
                    <Select
                      value={formData.customerName || ''}
                      label="고객명 *"
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      displayEmpty
                      notched
                      renderValue={(selected) => {
                        if (!selected) return '선택';
                        const item = customerNamesFromDB.find(c => c.subcode === selected);
                        return item ? item.subcode_name : selected;
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        }
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {customerNamesFromDB.map((option) => (
                        <MenuItem key={option.subcode} value={option.subcode}>
                          {option.subcode_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                {/* 모델코드-품목코드-품목명 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label={
                      <>
                        모델코드 <span style={{ color: 'red' }}>*</span>
                      </>
                    }
                    value={formData.modelCode || ''}
                    onChange={(e) => handleInputChange('modelCode', e.target.value)}
                    placeholder="모델코드를 입력하세요 (예: PRJ-2024-001)"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label={
                      <>
                        품목코드 <span style={{ color: 'red' }}>*</span>
                      </>
                    }
                    value={formData.itemCode || ''}
                    onChange={(e) => handleInputChange('itemCode', e.target.value)}
                    placeholder="품목코드를 입력하세요 (예: PROD-SEC-001)"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label={
                      <>
                        품목명 <span style={{ color: 'red' }}>*</span>
                      </>
                    }
                    value={formData.itemName || ''}
                    onChange={(e) => handleInputChange('itemName', e.target.value)}
                    placeholder="품목명을 입력하세요"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />
                </Stack>

                {/* 수량-단가-총금액 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label={
                      <>
                        수량 <span style={{ color: 'red' }}>*</span>
                      </>
                    }
                    type="number"
                    value={formData.quantity === 0 ? '' : formData.quantity}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0;
                      const totalAmount = quantity * (formData.unitPrice || 0);
                      setFormData({
                        ...formData,
                        quantity,
                        totalAmount
                      });
                    }}
                    placeholder="수량 입력"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label={
                      <>
                        단가 <span style={{ color: 'red' }}>*</span>
                      </>
                    }
                    type="number"
                    value={formData.unitPrice === 0 ? '' : formData.unitPrice}
                    onChange={(e) => {
                      const unitPrice = parseInt(e.target.value) || 0;
                      const totalAmount = (formData.quantity || 0) * unitPrice;
                      setFormData({
                        ...formData,
                        unitPrice,
                        totalAmount
                      });
                    }}
                    placeholder="단가 입력"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="총금액"
                    value={formData.totalAmount === 0 ? '' : formData.totalAmount}
                    disabled
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    placeholder="자동 계산"
                    helperText="수량 × 단가로 자동 계산됩니다"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />
                </Stack>

                {/* 판매유형-배송일-상태 */}
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel shrink>
                      판매유형 <span style={{ color: 'red' }}>*</span>
                    </InputLabel>
                    <Select
                      value={formData.salesType || ''}
                      label="판매유형 *"
                      onChange={(e) => handleInputChange('salesType', e.target.value)}
                      displayEmpty
                      notched
                      renderValue={(selected) => {
                        if (!selected) return '선택';
                        const item = salesTypesFromDB.find(s => s.subcode === selected);
                        return item ? item.subcode_name : selected;
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        }
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {salesTypesFromDB.map((option) => (
                        <MenuItem key={option.subcode} value={option.subcode}>
                          {option.subcode_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label={
                      <>
                        배송일 <span style={{ color: 'red' }}>*</span>
                      </>
                    }
                    type="date"
                    value={formData.deliveryDate || ''}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel shrink>상태</InputLabel>
                    <Select
                      value={formData.status || ''}
                      label="상태"
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      notched
                      renderValue={(selected) => {
                        if (!selected) return '';
                        const item = statusTypesFromDB.find(s => s.subcode === selected);
                        const displayName = item ? item.subcode_name : selected;

                        const getStatusColor = (statusName: string) => {
                          switch (statusName) {
                            case '대기':
                              return { bgcolor: '#F5F5F5', color: '#757575' };
                            case '진행':
                            case '진행중':
                              return { bgcolor: '#E3F2FD', color: '#1976D2' };
                            case '완료':
                              return { bgcolor: '#E8F5E9', color: '#388E3C' };
                            case '홀딩':
                            case '취소':
                              return { bgcolor: '#FFEBEE', color: '#D32F2F' };
                            default:
                              return { bgcolor: '#F5F5F5', color: '#757575' };
                          }
                        };

                        return (
                          <Chip
                            label={displayName}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(displayName).bgcolor,
                              color: getStatusColor(displayName).color,
                              fontSize: '13px',
                              fontWeight: 400
                            }}
                          />
                        );
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        }
                      }}
                    >
                      {statusTypesFromDB.map((option) => {
                        const getStatusColor = (statusName: string) => {
                          switch (statusName) {
                            case '대기':
                              return { bgcolor: '#F5F5F5', color: '#757575' };
                            case '진행':
                            case '진행중':
                              return { bgcolor: '#E3F2FD', color: '#1976D2' };
                            case '완료':
                              return { bgcolor: '#E8F5E9', color: '#388E3C' };
                            case '홀딩':
                            case '취소':
                              return { bgcolor: '#FFEBEE', color: '#D32F2F' };
                            default:
                              return { bgcolor: '#F5F5F5', color: '#757575' };
                          }
                        };

                        return (
                          <MenuItem key={option.subcode} value={option.subcode}>
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

                {/* 팀-등록자 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="팀"
                    value={formData.team || ''}
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
                    label="등록자"
                    value={(() => {
                      // registrant에서 이름만 추출 (서브코드 제거)
                      if (!formData.registrant) return '';
                      const registrantUser = users.find((u) => u.user_name === formData.registrant);
                      if (registrantUser) return registrantUser.user_name;
                      // users에서 못 찾은 경우, registrant 값에서 서브코드 패턴 제거
                      return formData.registrant.replace(/\s+GROUP\d+-SUB\d+$/g, '').trim();
                    })()}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                      startAdornment: (() => {
                        console.log('🔍 [매출 등록자 프로필] registrant:', formData.registrant);
                        console.log('🔍 [매출 등록자 프로필] users 개수:', users?.length);
                        const registrantUser = users.find((u) => u.user_name === formData.registrant);
                        console.log('🔍 [매출 등록자 프로필] 찾은 registrantUser:', registrantUser ? {
                          user_name: registrantUser.user_name,
                          profile_image_url: registrantUser.profile_image_url,
                          avatar_url: registrantUser.avatar_url
                        } : '없음');
                        const avatarSrc = registrantUser ? (registrantUser.profile_image_url || registrantUser.avatar_url) : currentUser.profileImage;
                        const avatarInitial = formData.registrant ? formData.registrant.replace(/\s+GROUP\d+-SUB\d+$/g, '').trim()[0] : currentUser.name[0];
                        return (
                          <Avatar src={avatarSrc} sx={{ width: 24, height: 24, mr: 0 }}>
                            {avatarInitial}
                          </Avatar>
                        );
                      })()
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

                {/* 등록일-코드 */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="등록일"
                    type="date"
                    value={formData.registrationDate || ''}
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
                    value={formData.code || ''}
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

                {/* 비고 - 전체 너비 */}
                <TextField
                  fullWidth
                  label="비고"
                  multiline
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="추가 정보를 입력하세요"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0'
                    }
                  }}
                />
              </Stack>
            </TabPanel>

            <TabPanel value={value} index={1}>
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
                currentUserName={currentUser.name}
                currentUserAvatar={currentUser.profileImage}
                currentUserRole={currentUser.role}
                currentUserDepartment={currentUser.department}
              />
            </TabPanel>

            <TabPanel value={value} index={2}>
              <MaterialTab recordId={formData?.id} currentUser={currentUser} canEdit={canEdit} canEditOwn={canEditOwn} canEditOthers={canEditOthers} />
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
};

export default SalesEditDialog;
