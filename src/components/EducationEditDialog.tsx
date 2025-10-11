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
  Pagination
} from '@mui/material';

// Icons
import { TableDocument, Category, Element } from '@wandersonalwes/iconsax-react';

// Hooks
import useUser from '../hooks/useUser';
import { useSupabaseUserManagement } from '../hooks/useSupabaseUserManagement';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS } from '../types/feedback';

// 교육 데이터 타입 정의
interface EducationData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  category: string;
  content: string;
  type: string;
  assignee: string;
  team: string;
  status: string;
  startDate: string;
  endDate: string;
}

// 상태 관리를 위한 reducer
interface EditEducationState {
  content: string;
  description: string;
  assignee: string;
  status: string;
  code: string;
  registrationDate: string;
  startDate: string;
  endDate: string;
  team: string;
  category: string;
  type: string;
}

type EditEducationAction =
  | { type: 'SET_FIELD'; field: keyof EditEducationState; value: string }
  | { type: 'SET_EDUCATION'; education: EducationData }
  | { type: 'RESET' }
  | { type: 'INIT_NEW_EDUCATION'; code: string; registrationDate: string; startDate: string };

const editEducationReducer = (state: EditEducationState, action: EditEducationAction): EditEducationState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_EDUCATION':
      return {
        content: action.education.content,
        description: action.education.description || '',
        assignee: action.education.assignee,
        status: action.education.status,
        code: action.education.code,
        registrationDate: action.education.registrationDate || '',
        startDate: action.education.startDate || '',
        endDate: action.education.endDate || '',
        team: action.education.team || '',
        category: action.education.category || '기술교육',
        type: action.education.type || '온라인'
      };
    case 'INIT_NEW_EDUCATION':
      return {
        content: '',
        description: '',
        assignee: '',
        status: '대기',
        code: action.code,
        registrationDate: action.registrationDate,
        startDate: action.startDate,
        endDate: '',
        team: '',
        category: '',
        type: ''
      };
    case 'RESET':
      return {
        content: '',
        description: '',
        assignee: '',
        status: '대기',
        code: '',
        registrationDate: '',
        startDate: '',
        endDate: '',
        team: '',
        category: '',
        type: ''
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
    educationCategories,
    educationMethods,
    statusOptions,
    departments,
    users
  }: {
    educationState: EditEducationState;
    onFieldChange: (field: keyof EditEducationState, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    educationCategories: string[];
    educationMethods: string[];
    statusOptions: string[];
    departments: string[];
    users: any[];
  }) => {
    const handleFieldChange = useCallback(
      (field: keyof EditEducationState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
          onFieldChange(field, e.target.value);
        },
      []
    );

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
            value={educationState.content}
            onChange={handleFieldChange('content')}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          {/* 세부내용 - 전체 너비 */}
          <TextField
            fullWidth
            label="세부내용"
            multiline
            rows={4}
            value={educationState.description}
            onChange={handleFieldChange('description')}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          {/* 교육분류, 교육유형, 상태 - 3등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth required>
              <InputLabel
                shrink
                sx={{
                  '& .MuiInputLabel-asterisk': {
                    color: 'red'
                  }
                }}
              >
                교육분류
              </InputLabel>
              <Select value={educationState.category} label="교육분류" onChange={handleFieldChange('category')} displayEmpty>
                <MenuItem value="">선택</MenuItem>
                {educationCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel
                shrink
                sx={{
                  '& .MuiInputLabel-asterisk': {
                    color: 'red'
                  }
                }}
              >
                교육방식
              </InputLabel>
              <Select value={educationState.type} label="교육방식" onChange={handleFieldChange('type')} displayEmpty>
                <MenuItem value="">선택</MenuItem>
                {educationMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select value={educationState.status} label="상태" onChange={handleFieldChange('status')}>
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

          {/* 시작일, 완료일 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              required
              label="시작일"
              type="date"
              value={educationState.startDate}
              onChange={handleFieldChange('startDate')}
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

            <TextField
              fullWidth
              required
              label="완료일"
              type="date"
              value={educationState.endDate}
              onChange={handleFieldChange('endDate')}
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
          </Stack>

          {/* 팀, 담당자 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              disabled
              label="팀"
              required
              value={educationState.team || ''}
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
              value={educationState.assignee || ''}
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
                  // educationState.assignee에 해당하는 사용자 찾기
                  const assigneeUser = users.find((user) => user.user_name === educationState.assignee);
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

          {/* 등록일, 코드 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              disabled
              value={educationState.registrationDate}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'grey.100'
                },
                '& .MuiInputBase-input': {
                  color: 'rgba(0, 0, 0, 0.87)',
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.87)'
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.87)'
                }
              }}
            />

            <TextField
              fullWidth
              label="코드"
              disabled
              value={educationState.code}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'grey.100'
                },
                '& .MuiInputBase-input': {
                  color: 'rgba(0, 0, 0, 0.87)',
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.87)'
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.87)'
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
            {materials.map((material: any) => (
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

// 메인 EducationEditDialog 컴포넌트
interface EducationEditDialogProps {
  open: boolean;
  onClose: () => void;
  education: EducationData | null;
  onSave: (education: EducationData) => void;
  assignees: string[];
  assigneeAvatars: Record<string, string>;
  educationCategories?: string[];
  educationMethods?: string[];
  statusOptions?: string[];
  departments?: string[];
  educations?: EducationData[];
}

const EducationEditDialog = memo(({ open, onClose, education, onSave, assignees, assigneeAvatars, educationCategories = ['기술', '리더십', '외국어'], educationMethods = ['온라인', '세미나', '워크샵', '집합교육2'], statusOptions = ['예정', '진행중', '완료', '보류'], departments = ['개발팀', '기획팀', '디자인팀'], educations = [] }: EducationEditDialogProps) => {
  // 사용자 정보 가져오기
  const user = useUser();
  const { users } = useSupabaseUserManagement();

  const [editTab, setEditTab] = useState(0);
  const [educationState, dispatch] = useReducer(editEducationReducer, {
    content: '',
    description: '',
    assignee: '',
    status: '대기',
    code: '',
    registrationDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    team: '',
    category: '',
    type: ''
  });

  // 피드백/기록 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.EDUCATION, education?.id);

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

  // 코드 자동 생성 함수
  const generateEducationCode = useCallback(() => {
    const year = new Date().getFullYear().toString().slice(-2);

    // 모든 교육 데이터에서 번호 추출 (PSEDU, MAIN-EDUCATION 둘 다 지원)
    const allNumbers = educations
      .filter((e) => e.code)
      .map((e) => {
        const codeParts = e.code.split('-');
        // MAIN-EDUCATION-25-001 형식
        if (codeParts.length === 4 && codeParts[0] === 'MAIN' && codeParts[1] === 'EDUCATION') {
          return parseInt(codeParts[3]) || 0;
        }
        // PSEDU-25-001 형식
        if (codeParts.length === 3 && codeParts[0] === 'PSEDU') {
          return parseInt(codeParts[2]) || 0;
        }
        return 0;
      })
      .filter(num => num > 0);

    const maxNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
    const code = `MAIN-EDUCATION-${year}-${(maxNumber + 1).toString().padStart(3, '0')}`;

    return code;
  }, [educations]);

  // 현재 날짜 생성 함수
  const getCurrentDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  }, []);

  // 교육 변경 시 상태 업데이트
  React.useEffect(() => {
    if (education) {
      dispatch({ type: 'SET_EDUCATION', education });
    } else if (open) {
      // 새 교육 추가 시 API에서 다음 코드 가져오기
      const initNewEducation = async () => {
        try {
          console.log('✅ API 호출 시작: /api/education/next-code');
          const response = await fetch('/api/education/next-code');
          const result = await response.json();
          console.log('✅ API 응답:', result);

          if (response.ok && result.code) {
            const newCode = result.code;
            const today = new Date().toISOString().split('T')[0];
            console.log('✅ 생성된 코드:', newCode);
            dispatch({ type: 'INIT_NEW_EDUCATION', code: newCode, registrationDate: today, startDate: today });
          } else {
            console.error('❌ 코드 생성 API 오류:', result);
            // 실패 시 임시 코드 사용
            const tempCode = `MAIN-EDU-TEMP-${Date.now()}`;
            const today = new Date().toISOString().split('T')[0];
            dispatch({ type: 'INIT_NEW_EDUCATION', code: tempCode, registrationDate: today, startDate: today });
          }
        } catch (error) {
          console.error('❌ 코드 생성 API 호출 실패:', error);
          // 실패 시 임시 코드 사용
          const tempCode = `MAIN-EDU-TEMP-${Date.now()}`;
          const today = new Date().toISOString().split('T')[0];
          dispatch({ type: 'INIT_NEW_EDUCATION', code: tempCode, registrationDate: today, startDate: today });
        }
      };

      initNewEducation();
    }
  }, [education, open]);

  // 팀을 로그인한 사용자의 부서로 자동 설정
  useEffect(() => {
    if (user && typeof user !== 'boolean' && user.department && !educationState.team && !education && open) {
      dispatch({ type: 'SET_FIELD', field: 'team', value: user.department });
    }
  }, [user, educationState.team, education, open]);

  // 담당자를 로그인한 사용자로 자동 설정
  useEffect(() => {
    if (user && typeof user !== 'boolean' && user.name && !educationState.assignee && !education && open) {
      dispatch({ type: 'SET_FIELD', field: 'assignee', value: user.name });
    }
  }, [user, educationState.assignee, education, open]);

  // 에러 상태
  const [validationError, setValidationError] = useState<string>('');

  // 최적화된 핸들러들
  const handleFieldChange = useCallback((field: keyof EditEducationState, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setEditTab(newValue);
  }, []);

  // 기록 핸들러들
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

  const handleSave = useCallback(async () => {
    // 필수 입력 검증
    if (!educationState.content.trim()) {
      setValidationError('교육내용을 입력해주세요.');
      return;
    }

    if (!educationState.category) {
      setValidationError('교육분류를 선택해주세요.');
      return;
    }

    if (!educationState.type) {
      setValidationError('교육방식을 선택해주세요.');
      return;
    }

    if (!educationState.startDate) {
      setValidationError('시작일을 선택해주세요.');
      return;
    }

    if (!educationState.endDate) {
      setValidationError('완료일을 선택해주세요.');
      return;
    }

    if (!educationState.team.trim()) {
      setValidationError('팀을 선택해주세요.');
      return;
    }

    if (!educationState.assignee.trim()) {
      setValidationError('담당자를 선택해주세요.');
      return;
    }

    // 에러 초기화
    setValidationError('');

    let educationId: number;

    if (!education) {
      // 새 교육 생성
      const newEducation: EducationData = {
        id: Date.now(),
        no: Date.now(),
        content: educationState.content,
        description: educationState.description,
        assignee: educationState.assignee,
        status: educationState.status,
        code: educationState.code,
        registrationDate: educationState.registrationDate,
        startDate: educationState.startDate,
        endDate: educationState.endDate,
        team: educationState.team,
        category: educationState.category,
        type: educationState.type
      };

      educationId = newEducation.id;
      onSave(newEducation);
    } else {
      // 기존 교육 수정
      const updatedEducation: EducationData = {
        ...education,
        content: educationState.content,
        description: educationState.description,
        assignee: educationState.assignee,
        status: educationState.status,
        startDate: educationState.startDate,
        endDate: educationState.endDate,
        team: educationState.team,
        category: educationState.category,
        type: educationState.type,
        code: educationState.code,
        registrationDate: educationState.registrationDate
      };

      educationId = updatedEducation.id;
      onSave(updatedEducation);
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
        console.log('📝 기록 추가 시작:', {
          '기록 개수': pendingComments.length,
          '교육 ID (원본)': educationId,
          '교육 ID (타입)': typeof educationId,
          '교육 ID (문자열 변환)': String(educationId)
        });

        for (const comment of pendingComments) {
          const feedbackInput = {
            page: PAGE_IDENTIFIERS.EDUCATION,
            record_id: String(educationId),
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

    onClose();
  }, [education, educationState, onSave, onClose, deletedCommentIds, modifiedComments, pendingComments, deleteFeedback, updateFeedback, addFeedback]);

  const handleClose = useCallback(() => {
    setEditTab(0);
    dispatch({ type: 'RESET' });
    setPendingComments([]);
    setModifiedComments({});
    setDeletedCommentIds([]);
    setMaterials([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setEditingMaterialId(null);
    setEditingMaterialText('');
    setValidationError('');
    onClose();
  }, [onClose]);

  // 메모이제이션된 탭 컴포넌트 props
  const overviewTabProps = useMemo(
    () => ({
      educationState,
      onFieldChange: handleFieldChange,
      assignees,
      assigneeAvatars,
      educationCategories,
      educationMethods,
      statusOptions,
      departments,
      users
    }),
    [educationState, handleFieldChange, assignees, assigneeAvatars, educationCategories, educationMethods, statusOptions, departments, users]
  );

  const recordTabProps = useMemo(
    () => {
      // 현재 사용자 정보 가져오기
      const feedbackUser = users.find((u) => u.user_name === user?.name);
      const currentUserName = feedbackUser?.user_name || user?.name || '현재 사용자';
      const currentUserAvatar = feedbackUser?.profile_image_url || user?.avatar || '';
      const currentUserRole = feedbackUser?.role || user?.role || '';
      const currentUserDepartment = feedbackUser?.department || user?.department || '';

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
      user
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
            개인교육관리 편집
          </Typography>
          {education && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
              {education.content} ({education.code})
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
          <Tab label="기록" />
          <Tab label="자료" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 1, pt: 1, overflow: 'hidden' }}>
        {editTab === 0 && <OverviewTab {...overviewTabProps} />}
        {editTab === 1 && <RecordTab {...recordTabProps} />}
        {editTab === 2 && <MaterialTab {...materialTabProps} />}
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
});

EducationEditDialog.displayName = 'EducationEditDialog';

export default EducationEditDialog;
