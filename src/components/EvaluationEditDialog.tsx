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
  Pagination,
  Alert
} from '@mui/material';
import { Add, Trash, AttachSquare, Eye, DocumentDownload } from '@wandersonalwes/iconsax-react';
import { useSupabaseSecurityInspectionOpl, OPLItem } from '../hooks/useSupabaseSecurityInspectionOpl';
import { useDepartmentNames } from '../hooks/useDepartmentNames';
import { useCommonData } from '../contexts/CommonDataContext'; // ✅ 공용 창고
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import { createClient } from '@supabase/supabase-js';
import { useSupabaseEvaluationSubmissions } from '../hooks/useSupabaseEvaluationSubmissions';
import { useSupabaseChecklistManagement } from '../hooks/useSupabaseChecklistManagement';
import { useSupabaseChecklistEditor } from '../hooks/useSupabaseChecklistEditor';
import { useSupabaseSecurityInspectionChecksheet } from '../hooks/useSupabaseSecurityInspectionChecksheet';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { EvaluationTableData, EvaluationStatus } from '../types/evaluation';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { FileData } from '../types/files';
import { evaluationStatusColors, evaluationTypeOptions, managementCategoryOptions } from '../data/evaluation';
import { ChecklistRecord, ChecklistEditorItem } from '../types/checklist';
import { sampleChecklistData, checklistItemTemplates } from '../data/checklist';
import { useSession } from 'next-auth/react';

interface EvaluationEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (evaluation: EvaluationTableData) => void;
  evaluation?: EvaluationTableData | null;
  generateEvaluationCode?: () => Promise<string>;
  evaluationTypes?: string[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

// 평가 아이템 타입
export interface CurriculumItem {
  id: string;
  evaluationDate: string; // 평가일자
  department: string; // 부서
  recommendedScore: number; // 권장점수
  actualScore: number; // 실제점수
  difference: number; // 차이 (자동계산)
  targetPerson: string; // 대상자
  position: string; // 직위
  evaluator: string; // 평가자
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

// 평가 상세 항목 타입
interface EvaluationDetailItem {
  id: number;
  name: string;
  behaviors: string[];
  checkedBehaviors: boolean[]; // 각 행동지표의 체크 상태
  performance: string;
  recommended: number; // 자동 계산될 값
  actual: number;
  deviation: string;
  differenceReason: string; // 차이 사유
}

// 커리큘럼 탭 컴포넌트 (제출된 평가 목록 표시)
const CurriculumTab = memo(({ evaluationCode, canEditOwn = true, canEditOthers = true }: { evaluationCode?: string; canEditOwn?: boolean; canEditOthers?: boolean }) => {
  // 제출된 평가 데이터 조회
  const { submissions, loading, fetchSubmissionWithItems, deleteSubmission } = useSupabaseEvaluationSubmissions();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 필터 상태
  const [filterTargetName, setFilterTargetName] = useState('');
  const [filterTargetDepartment, setFilterTargetDepartment] = useState('');
  const [filterEvaluatorName, setFilterEvaluatorName] = useState('');
  const [filterEvaluatorDepartment, setFilterEvaluatorDepartment] = useState('');

  // 평가 상세 항목 상태
  const [evaluationItems, setEvaluationItems] = useState<EvaluationDetailItem[]>([
    {
      id: 1,
      name: '혁신과 도전',
      behaviors: ['신기술/지식 지속 탐구', '창의 발상으로 대안/기회 발굴', '도전적 목표 설정을 통한 능력 향상'],
      checkedBehaviors: [true, true, true],
      performance: 'Y',
      recommended: 5,
      actual: 4,
      deviation: 'Y',
      differenceReason: ''
    },
    {
      id: 2,
      name: '정직과 감동',
      behaviors: ['구성/협착 준수·정직', '능력/성과 기반 공정평가', '고객가치 지속 창출'],
      checkedBehaviors: [true, true, false],
      performance: 'N',
      recommended: 3,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 3,
      name: '소통과 속도',
      behaviors: ['과정/결과 적극 공유', '상호 신뢰·협력', '변화 민첩 대응·신속 달성'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 1,
      deviation: 'Y'
    },
    {
      id: 4,
      name: '탁월한과 자기주도',
      behaviors: ['적극적 자기개발', '현장 문제 지속 개선', '자발적 업무발굴 집중'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 5,
      name: '팀워크족',
      behaviors: ['정보공유 장 마련', '경청·수용 노력', '갈등 조정·협조 분위기'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 6,
      name: '업무배분/지원',
      behaviors: ['능력기반 공정 배분·명확 지시', '역할·권한 부여', '자원 선택·집중·지시간 고취'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 7,
      name: '성과관리능력',
      behaviors: ['환경분석·회사목표 연계', '팀원 참여·합의·공유', '성과 피드백·격려'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 8,
      name: '팀간 조정/협상능력',
      behaviors: ['경청·소통·문제 단순화', '갈등요인 분석·대안', '근거 기반 설득·유연 협상'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 9,
      name: '후배지도/코칭',
      behaviors: ['강점/약점 파악', '전문성/노하우 전수', '스킬/프로세스·교육 피드백'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 10,
      name: '업무계획/추진력',
      behaviors: ['우선순위·실행안 도출', '조직역량 결집·장애 제거', '핵심자료 분석·결론'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 11,
      name: '업무열정',
      behaviors: ['주인의식·책임감', '일의 의미/가치 창출', '새로운 아이디어 창출'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 12,
      name: '업무전문성',
      behaviors: ['지식 습득·탁월한 추구', '현장 문제 발견·개선', '적절 용어로 구두/문서 소통'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    },
    {
      id: 13,
      name: '자기관리능력',
      behaviors: ['우선순위·시간관리', '건강관리·긍정 에너지', '모범적 태도로 신뢰'],
      checkedBehaviors: [true, false, false],
      performance: '',
      recommended: 1,
      actual: 0,
      deviation: '',
      differenceReason: ''
    }
  ]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // 필터링된 submissions
  const filteredSubmissions = submissions.filter((submission) => {
    // 평가 코드로 필터링 (현재 평가의 제출 목록만 표시)
    // evaluationCode가 없으면 빈 배열 반환 (새 창일 때는 아무것도 표시 안 함)
    if (!evaluationCode) {
      return false;
    }
    const matchEvaluationCode = submission.evaluation_id === evaluationCode;

    const matchTargetName = !filterTargetName || submission.target_person.toLowerCase().includes(filterTargetName.toLowerCase());
    const matchTargetDept = !filterTargetDepartment || submission.department.toLowerCase().includes(filterTargetDepartment.toLowerCase());
    const matchEvaluatorName = !filterEvaluatorName || submission.evaluator.toLowerCase().includes(filterEvaluatorName.toLowerCase());
    const matchEvaluatorDept = !filterEvaluatorDepartment || (submission.evaluator_department || '').toLowerCase().includes(filterEvaluatorDepartment.toLowerCase());

    return matchEvaluationCode && matchTargetName && matchTargetDept && matchEvaluatorName && matchEvaluatorDept;
  });

  // 페이지네이션 계산 (필터링된 결과 기준)
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredSubmissions.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilterTargetName('');
    setFilterTargetDepartment('');
    setFilterEvaluatorName('');
    setFilterEvaluatorDepartment('');
    setCurrentPage(1);
  };

  // Excel 다운로드 (CSV 형식)
  const handleExcelDownload = () => {
    if (filteredSubmissions.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // CSV 헤더
    const headers = [
      'NO',
      '제출일시',
      '대상자 이름',
      '대상자 부서',
      '대상자 직책',
      '평가자 이름',
      '평가자 부서',
      '평가자 직책',
      '문항수',
      '점수'
    ];

    // CSV 데이터
    const csvData = filteredSubmissions.map((submission, index) => {
      const date = new Date(submission.submitted_at);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      return [
        filteredSubmissions.length - index,
        formattedDate,
        submission.target_person,
        submission.department,
        submission.position,
        submission.evaluator,
        submission.evaluator_department || '-',
        submission.evaluator_position || '-',
        submission.item_count || 0,
        submission.total_score || 0
      ];
    });

    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // BOM 추가 (Excel에서 한글이 깨지지 않도록)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 다운로드
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `평가목록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 선택된 행 삭제
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      alert('삭제할 평가를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedRows.length}개의 평가를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 선택된 모든 항목 삭제
      for (const id of selectedRows) {
        await deleteSubmission(parseInt(id));
      }

      // 선택 초기화
      setSelectedRows([]);
      alert('삭제가 완료되었습니다.');
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 행동지표 체크박스 변경 핸들러
  const handleBehaviorCheck = (itemId: number, behaviorIndex: number, checked: boolean) => {
    setEvaluationItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const newCheckedBehaviors = [...item.checkedBehaviors];
          newCheckedBehaviors[behaviorIndex] = checked;

          // 체크된 개수 계산
          const checkedCount = newCheckedBehaviors.filter(Boolean).length;

          // 권장점수 계산: 1개=1점, 2개=3점, 3개=5점
          let recommended = 0;
          if (checkedCount === 1) recommended = 1;
          else if (checkedCount === 2) recommended = 3;
          else if (checkedCount === 3) recommended = 5;

          return {
            ...item,
            checkedBehaviors: newCheckedBehaviors,
            recommended
          };
        }
        return item;
      })
    );
  };

  // 실제점수 변경 핸들러
  const handleActualScoreChange = (itemId: number, actualScore: number) => {
    setEvaluationItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            actual: actualScore
          };
        }
        return item;
      })
    );
  };

  // 차이 사유 변경 핸들러
  const handleDifferenceReasonChange = (itemId: number, reason: string) => {
    setEvaluationItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            differenceReason: reason
          };
        }
        return item;
      })
    );
  };

  // 상세보기 다이얼로그 닫기
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedSubmissionId(null);
    setSelectedItem(null);
  };

  // 제출 유효성 검사
  const handleSubmitEvaluation = () => {
    // 차이점수가 1 이상이고 차이 사유가 없는 항목 찾기
    const invalidItems = evaluationItems.filter(
      (item) => Math.abs(item.actual - item.recommended) >= 1 && !(item.differenceReason || '').trim()
    );

    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map((item) => `${item.id}. ${item.name}`).join(', ');
      alert(`다음 항목의 차이 사유를 입력해주세요:\n${itemNames}`);
      return;
    }

    // 유효성 검사 통과 시 제출 로직
    alert('평가가 제출되었습니다.');
    handleCloseDetail();
  };

  // 초기화 핸들러
  const handleResetEvaluation = () => {
    if (confirm('평가 내용을 초기화하시겠습니까?')) {
      setEvaluationItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          checkedBehaviors: [false, false, false], // 모든 체크박스 해제
          recommended: 0, // 권장점수 초기화
          actual: 0, // 실제점수 초기화
          differenceReason: '' // 차이 사유 초기화
        }))
      );
    }
  };

  // 선택된 제출 평가 데이터 로드
  useEffect(() => {
    const loadSubmissionData = async () => {
      if (selectedSubmissionId && detailDialogOpen) {
        const submissionWithItems = await fetchSubmissionWithItems(selectedSubmissionId);
        if (submissionWithItems && submissionWithItems.items) {
          // selectedItem에 전체 데이터 저장 (체크리스트 항목 포함)
          setSelectedItem({
            targetPerson: submissionWithItems.target_person,
            department: submissionWithItems.department,
            position: submissionWithItems.position,
            evaluator: submissionWithItems.evaluator,
            evaluatorDepartment: submissionWithItems.evaluator_department,
            evaluatorPosition: submissionWithItems.evaluator_position,
            submittedAt: submissionWithItems.submitted_at,
            totalScore: submissionWithItems.total_score || 0,
            items: submissionWithItems.items // 체크리스트 항목 전체 저장
          });
        }
      }
    };

    loadSubmissionData();
  }, [selectedSubmissionId, detailDialogOpen, fetchSubmissionWithItems]);


  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(filteredSubmissions.map((s) => String(s.id)));
    } else {
      setSelectedRows([]);
    }
  };

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 50,
    no: 60,
    submittedAt: 150,
    targetPerson: 100,
    targetDepartment: 100,
    targetPosition: 80,
    evaluator: 100,
    evaluatorDepartment: 100,
    evaluatorPosition: 80,
    itemCount: 80,
    score: 80,
    action: 80
  };

  const cellHeight = 48;

  return (
    <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          제출된 평가 목록
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            variant="text"
            onClick={handleResetFilters}
            sx={{
              minWidth: '60px',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            초기화
          </Button>
          <TextField
            size="small"
            placeholder="대상자 이름"
            value={filterTargetName}
            onChange={(e) => {
              setFilterTargetName(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ width: '130px' }}
          />
          <TextField
            size="small"
            placeholder="대상자 부서"
            value={filterTargetDepartment}
            onChange={(e) => {
              setFilterTargetDepartment(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ width: '130px' }}
          />
          <TextField
            size="small"
            placeholder="평가자 이름"
            value={filterEvaluatorName}
            onChange={(e) => {
              setFilterEvaluatorName(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ width: '130px' }}
          />
          <TextField
            size="small"
            placeholder="평가자 부서"
            value={filterEvaluatorDepartment}
            onChange={(e) => {
              setFilterEvaluatorDepartment(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ width: '130px' }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={handleExcelDownload}
            startIcon={<DocumentDownload size={16} />}
            sx={{
              px: 2,
              borderColor: '#4CAF50',
              color: '#4CAF50',
              '&:hover': {
                borderColor: '#4CAF50',
                backgroundColor: '#4CAF50',
                color: '#fff'
              }
            }}
          >
            Excel Down
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Trash size={16} />}
            color="error"
            onClick={handleDeleteSelected}
            disabled={selectedRows.length === 0 || !(canEditOwn || canEditOthers)}
            sx={{
              px: 2,
              borderColor: selectedRows.length > 0 && (canEditOwn || canEditOthers) ? 'error.main' : 'grey.300',
              color: selectedRows.length > 0 && (canEditOwn || canEditOthers) ? 'error.main' : 'grey.500',
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            삭제 {selectedRows.length > 0 && `(${selectedRows.length})`}
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
          },
          '& .MuiTableCell-root': {
            fontSize: '12px'
          }
        }}
      >
        <Table size="small">
          <TableHead>
            {/* 1단 헤더 */}
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" rowSpan={2} sx={{ width: columnWidths.checkbox, borderRight: '1px solid #e0e0e0' }}>
                <Checkbox
                  checked={selectedRows.length === filteredSubmissions.length && filteredSubmissions.length > 0}
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
              <TableCell rowSpan={2} sx={{ width: columnWidths.no, textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>NO</TableCell>
              <TableCell rowSpan={2} sx={{ width: columnWidths.submittedAt, textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>제출일시</TableCell>
              <TableCell colSpan={3} sx={{ textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>대상자</TableCell>
              <TableCell colSpan={3} sx={{ textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>평가자</TableCell>
              <TableCell rowSpan={2} sx={{ width: columnWidths.itemCount, textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>문항수</TableCell>
              <TableCell rowSpan={2} sx={{ width: columnWidths.score, textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>점수</TableCell>
              <TableCell rowSpan={2} sx={{ width: columnWidths.action, textAlign: 'center' }}>ACTION</TableCell>
            </TableRow>
            {/* 2단 헤더 */}
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ width: columnWidths.targetPerson, textAlign: 'center' }}>이름</TableCell>
              <TableCell sx={{ width: columnWidths.targetDepartment, textAlign: 'center' }}>부서</TableCell>
              <TableCell sx={{ width: columnWidths.targetPosition, textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>직책</TableCell>
              <TableCell sx={{ width: columnWidths.evaluator, textAlign: 'center' }}>이름</TableCell>
              <TableCell sx={{ width: columnWidths.evaluatorDepartment, textAlign: 'center' }}>부서</TableCell>
              <TableCell sx={{ width: columnWidths.evaluatorPosition, textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>직책</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography>로딩 중...</Typography>
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">제출된 평가가 없습니다</Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((submission, index) => (
                <TableRow key={submission.id} hover>
                  <TableCell sx={{ padding: 1 }}>
                    <Checkbox
                      checked={selectedRows.includes(String(submission.id))}
                      onChange={() => handleSelectRow(String(submission.id))}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{filteredSubmissions.length - startIndex - index}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                    {(() => {
                      const date = new Date(submission.submitted_at);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day} ${hours}:${minutes}`;
                    })()}
                  </TableCell>
                  <TableCell>{submission.target_person}</TableCell>
                  <TableCell>{submission.department}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{submission.position}</TableCell>
                  <TableCell>{submission.evaluator}</TableCell>
                  <TableCell>{submission.evaluator_department || '-'}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{submission.evaluator_position || '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{submission.item_count || 0}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {submission.total_score || 0}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={async () => {
                        const submissionWithItems = await fetchSubmissionWithItems(submission.id);
                        if (submissionWithItems) {
                          setSelectedSubmissionId(submission.id);
                          setDetailDialogOpen(true);
                        }
                      }}
                      title="상세보기"
                    >
                      <Eye size={18} />
                    </IconButton>
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
          {submissions.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, submissions.length)} of ${submissions.length}` : '0-0 of 0'}
        </Typography>
        {submissions.length > 0 && (
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
                minWidth: '32px',
                height: '32px',
                borderRadius: '4px'
              },
              '& .MuiPaginationItem-page.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white !important',
                borderRadius: '4px',
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

      {/* 상세보기 다이얼로그 */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ pb: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              체크시트 작성 내용
            </Typography>
            <IconButton size="small" onClick={handleCloseDetail}>
              <Box sx={{ fontSize: '24px' }}>×</Box>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {selectedItem && selectedItem.items && (
            <Stack spacing={3}>
              {/* 상단 기본 정보 */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: -1 }}>
                대상자 {selectedItem.department} {selectedItem.targetPerson} {selectedItem.position}, 평가자 {selectedItem.evaluatorDepartment} {selectedItem.evaluator} {selectedItem.evaluatorPosition}
              </Typography>

              {/* 통계 카드 */}
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, bgcolor: '#f8f9fa' }}>
                    <Typography variant="caption" color="text.secondary">
                      총 항목
                    </Typography>
                    <Typography variant="h5">
                      {selectedItem.items.length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, bgcolor: '#f8f9fa' }}>
                    <Typography variant="caption" color="text.secondary">
                      평가 완료
                    </Typography>
                    <Typography variant="h5">
                      {selectedItem.items.filter((item: any) => item.evaluation && item.evaluation !== '선택').length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, bgcolor: '#f8f9fa' }}>
                    <Typography variant="caption" color="text.secondary">
                      총 점수
                    </Typography>
                    <Typography variant="h5">
                      {selectedItem.totalScore || 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* 평가 항목 테이블 */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ width: 50 }}>NO</TableCell>
                      <TableCell sx={{ width: 120 }}>대분류</TableCell>
                      <TableCell sx={{ width: 120 }}>소분류</TableCell>
                      <TableCell sx={{ width: 200 }}>점검항목</TableCell>
                      <TableCell sx={{ width: 100 }}>평가</TableCell>
                      <TableCell sx={{ width: 80, textAlign: 'center' }}>점수</TableCell>
                      <TableCell>평가내용</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItem.items.map((item: any, index: number) => (
                      <TableRow key={item.id || index} hover>
                        <TableCell sx={{ textAlign: 'center' }}>{item.item_no || index + 1}</TableCell>
                        <TableCell>{item.major_category || '-'}</TableCell>
                        <TableCell>{item.sub_category || '-'}</TableCell>
                        <TableCell>{item.title || '-'}</TableCell>
                        <TableCell>{item.evaluation || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{item.score || 0}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
});

CurriculumTab.displayName = 'CurriculumTab';

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
  } = useSupabaseFiles(PAGE_IDENTIFIERS.SECURITY_INSPECTION, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = event.target.files;
      if (!uploadedFiles || uploadedFiles.length === 0) return;

      // recordId가 없으면 업로드 불가
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 점검을 저장해주세요.');
        return;
      }

      // 각 파일을 순차적으로 업로드
      for (const file of Array.from(uploadedFiles)) {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.SECURITY_INSPECTION,
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

MaterialTab.displayName = 'MaterialTab';

export default function EvaluationEditDialog({
  open,
  onClose,
  onSave,
  evaluation,
  generateEvaluationCode,
  evaluationTypes = [],
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}: EvaluationEditDialogProps) {
  const [activeTab, setActiveTab] = useState(0);

  // 유효성 검증 에러 상태
  const [validationError, setValidationError] = useState<string>('');

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

  // OPL 관련 상태
  const [oplItems, setOplItems] = useState<OPLItem[]>([]);
  const [editingOplId, setEditingOplId] = useState<number | null>(null);
  const [editingOplField, setEditingOplField] = useState<string | null>(null);
  const [editingOplText, setEditingOplText] = useState('');
  const [selectedOplItems, setSelectedOplItems] = useState<Set<number>>(new Set());

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
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.SECURITY_INSPECTION, evaluation?.id?.toString());

  // 평가 데이터 CRUD 훅
  const {
    createEvaluationData,
    updateEvaluationData,
    fetchEvaluationData
  } = useSupabaseEvaluationSubmissions();

  // ✅ 공용 창고에서 마스터코드 데이터 가져오기
  const { masterCodes, users, departments } = useCommonData();

  // ✅ useSupabaseMasterCode3에서 getSubCodesByGroup 함수 가져오기
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // Supabase 클라이언트 생성
  const supabase = React.useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // DB에서 직접 가져온 평가유형 및 관리분류 목록 state
  const [evaluationTypesFromDB, setEvaluationTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
  const [managementCategoriesFromDB, setManagementCategoriesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

  console.log('🔍 [EvaluationEditDialog] masterCodes 전체:', masterCodes?.length, '개');
  console.log('🔍 [EvaluationEditDialog] GROUP043 관련 레코드:', masterCodes?.filter(m => m.group_code === 'GROUP043'));
  console.log('🔍 [EvaluationEditDialog] users:', users?.length, '명');

  const [statusOptions, setStatusOptions] = useState<Array<{ code: string; name: string }>>([]);

  // 부서명 훅 (fallback용)
  const { departmentOptions } = useDepartmentNames();

  // 로그인한 사용자 정보 가져오기
  const { data: session } = useSession();

  // 세션 email로 DB에서 사용자 찾기
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    console.log('🔍 [InspectionEditDialog] currentUser:', found ? found.user_name : '없음');
    return found;
  }, [session, users]);

  const currentUserCode = currentUser?.user_code || '';

  // 데이터 소유자 확인 로직
  const isOwner = React.useMemo(() => {
    if (!evaluation) return true; // 신규 생성인 경우 true

    // evaluation의 created_by 또는 manager와 현재 사용자 비교
    const dataOwner = evaluation.createdBy || evaluation.assignee;
    const currentUserName = currentUser?.user_name;

    console.log('🔍 [EvaluationEditDialog] 소유자 확인:', {
      dataOwner,
      currentUserName,
      isOwner: dataOwner === currentUserName
    });

    return dataOwner === currentUserName;
  }, [evaluation, currentUser]);

  // 편집 가능 여부 결정
  const canEdit = React.useMemo(() => {
    const result = canEditOthers || (canEditOwn && isOwner);
    console.log('🔍 [EvaluationEditDialog] 편집 가능 여부:', {
      canEditOthers,
      canEditOwn,
      isOwner,
      canEdit: result
    });
    return result;
  }, [canEditOthers, canEditOwn, isOwner]);

  // feedbacks를 ref에 저장 (dependency 문제 방지)
  useEffect(() => {
    feedbacksRef.current = feedbacks;
  }, [feedbacks]);

  // 평가 폼 URL 생성 관련 상태
  const [evaluationFormUrl, setEvaluationFormUrl] = useState<string>('');
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  // Dialog가 열릴 때 DB에서 평가유형(GROUP043), 관리분류(GROUP040), 상태(GROUP002) 직접 조회
  useEffect(() => {
    if (!open) return;

    const fetchMasterCodeData = async () => {
      try {
        console.log('🔄 [EvaluationEditDialog] DB에서 평가유형/관리분류/상태 직접 조회 시작');

        // GROUP043 평가유형 조회
        const { data: group043Data, error: group043Error } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP043')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group043Error) {
          console.error('❌ GROUP043 조회 오류:', group043Error);
        } else {
          console.log('✅ GROUP043 평가유형:', group043Data);
          setEvaluationTypesFromDB(group043Data || []);
        }

        // GROUP040 관리분류 조회
        const { data: group040Data, error: group040Error } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP040')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        if (group040Error) {
          console.error('❌ GROUP040 조회 오류:', group040Error);
        } else {
          console.log('✅ GROUP040 관리분류:', group040Data);
          setManagementCategoriesFromDB(group040Data || []);
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
          // 기본값 설정
          const fallbackOptions = [
            { code: 'WAIT', name: '대기' },
            { code: 'PROGRESS', name: '진행' },
            { code: 'COMPLETE', name: '완료' }
          ];
          console.log('⚠️ [EvaluationEditDialog] 기본 상태 옵션 사용:', fallbackOptions);
          setStatusOptions(fallbackOptions);
        } else {
          console.log('✅ GROUP002 상태:', group002Data);
          const options = (group002Data || []).map((item) => ({
            code: item.subcode,
            name: item.subcode_name
          }));
          setStatusOptions(options);
        }
      } catch (error) {
        console.error('❌ 마스터코드 조회 중 오류:', error);
      }
    };

    fetchMasterCodeData();
  }, [open, supabase]);

  // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
  useEffect(() => {
    if (open && evaluation?.id && !feedbacksInitializedRef.current) {
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
  }, [open, evaluation?.id, feedbacks]);

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

  // 평가유형 목록 - DB에서 직접 가져온 데이터 사용
  const evaluationTypesList = evaluationTypesFromDB;

  // subcode → subcode_name 변환 헬퍼 함수
  const getSubcodeName = useCallback((subcode: string) => {
    const found = evaluationTypesList.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [evaluationTypesList]);

  // 관리분류 목록 - DB에서 직접 가져온 데이터 사용
  const managementCategoryOptionsFromMasterCode = managementCategoriesFromDB;

  // subcode → subcode_name 변환 (관리분류용)
  const getManagementCategoryName = useCallback((subcode: string) => {
    const found = managementCategoryOptionsFromMasterCode.find(item => item.subcode === subcode);
    return found ? found.subcode_name : subcode;
  }, [managementCategoryOptionsFromMasterCode]);

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
    inspectionContent: evaluation?.evaluationTitle || '',
    inspectionType: evaluation?.evaluationType || '', // 마스터코드에서 로드될 때까지 빈 문자열
    inspectionTarget: evaluation?.managementCategory || '', // 마스터코드에서 로드될 때까지 빈 문자열
    assignee: evaluation?.assignee || '',
    inspectionDate: evaluation?.inspectionDate || new Date().toISOString().split('T')[0],
    startDate: evaluation?.startDate || new Date().toISOString().split('T')[0],
    endDate: evaluation?.endDate || '',
    status: evaluation?.status || '', // 마스터코드에서 로드될 때까지 빈 문자열
    code: evaluation?.code || '',
    registrationDate: evaluation?.registrationDate || new Date().toISOString().split('T')[0],
    team: evaluation?.team || '', // 부서 옵션에서 로드될 때까지 빈 문자열
    details: evaluation?.details || '',
    performance: evaluation?.performance || '',
    improvements: evaluation?.improvements || '',
    thoughts: evaluation?.thoughts || '',
    notes: evaluation?.notes || '',
    checklistGuide: evaluation?.checklistGuide || ''
  });

  // 점검유형과 점검대상은 사용자가 직접 선택하도록 자동 설정 제거

  // 상태 초기값을 "대기" 서브코드명으로 설정 (add 모드일 때만)
  React.useEffect(() => {
    if (statusOptions.length > 0 && !formData.status && !evaluation) {
      // "대기"에 해당하는 서브코드명 찾기
      const defaultStatus = statusOptions.find(option => option.name === '대기');
      if (defaultStatus) {
        console.log('✅ [EvaluationEditDialog] 상태 초기값 설정:', defaultStatus.name);
        setFormData((prev) => ({
          ...prev,
          status: defaultStatus.name
        }));
      } else {
        // "대기"가 없으면 첫 번째 옵션 사용
        console.log('⚠️ [EvaluationEditDialog] "대기" 없음, 첫 번째 옵션 사용:', statusOptions[0].name);
        setFormData((prev) => ({
          ...prev,
          status: statusOptions[0].name
        }));
      }
    }
  }, [statusOptions, formData.status, evaluation]);

  // 팀을 로그인한 사용자의 부서로 자동 설정
  React.useEffect(() => {
    if (currentUser?.department && !formData.team && !evaluation) {
      setFormData((prev) => ({
        ...prev,
        team: currentUser.department
      }));
    }
  }, [currentUser, formData.team, evaluation]);

  // 담당자를 로그인한 사용자로 자동 설정
  React.useEffect(() => {
    if (currentUser && !formData.assignee && !evaluation && activeUsers.length > 0) {
      // activeUsers에서 현재 로그인한 사용자 찾기
      const currentActiveUser = activeUsers.find((user) => user.user_code === currentUserCode);

      if (currentActiveUser) {
        setFormData((prev) => ({
          ...prev,
          assignee: currentActiveUser.user_name
        }));
      }
    }
  }, [currentUser, currentUserCode, formData.assignee, evaluation, activeUsers]);

  // 신규 평가 생성 시 코드 자동 생성
  React.useEffect(() => {
    const initializeNewEvaluation = async () => {
      if (!evaluation && open && !formData.code && generateEvaluationCode) {
        try {
          const newCode = await generateEvaluationCode();
          console.log('🔄 [EvaluationEditDialog] 자동 생성된 코드:', newCode);
          setFormData((prev) => ({
            ...prev,
            code: newCode
          }));
        } catch (error) {
          console.error('❌ [EvaluationEditDialog] 코드 생성 실패:', error);
        }
      }
    };

    initializeNewEvaluation();
  }, [open, evaluation, formData.code, generateEvaluationCode]);

  // GROUP002 상태 옵션은 Dialog 열릴 때 DB에서 직접 조회 (위의 fetchMasterCodeData에서 처리)

  // evaluation prop 변경시 formData 업데이트
  useEffect(() => {
    const loadEvaluationData = async () => {
      if (!evaluation) return;

      // evaluationDataId가 있으면 DB에서 데이터 로드
      if (evaluation.evaluationDataId) {
        try {
          const dbData = await fetchEvaluationData(evaluation.evaluationDataId);
          if (dbData) {
            console.log('✅ DB에서 평가 데이터 로드:', dbData);
            setFormData({
              inspectionContent: dbData.evaluation_title || evaluation.evaluationTitle || '',
              inspectionType: dbData.evaluation_type || evaluation.evaluationType || '',
              inspectionTarget: dbData.management_category || evaluation.managementCategory || '',
              assignee: dbData.manager || evaluation.assignee || '',
              inspectionDate: evaluation.inspectionDate || new Date().toISOString().split('T')[0],
              startDate: dbData.start_date || evaluation.startDate || new Date().toISOString().split('T')[0],
              endDate: dbData.end_date || evaluation.endDate || '',
              status: dbData.status || evaluation.status || '',
              code: evaluation.code || '',
              registrationDate: evaluation.registrationDate || new Date().toISOString().split('T')[0],
              team: dbData.team || evaluation.team || '개발팀',
              details: dbData.details || evaluation.details || '',
              performance: dbData.performance || evaluation.performance || '',
              improvements: dbData.improvements || evaluation.improvements || '',
              thoughts: dbData.thoughts || evaluation.thoughts || '',
              notes: dbData.notes || evaluation.notes || '',
              checklistGuide: dbData.checklist_guide || evaluation.checklistGuide || ''
            });

            // 디버깅: checklistGuide 값 확인
            console.log('📋 Dialog에서 불러온 checklistGuide:', dbData.checklist_guide);
          }
        } catch (error) {
          console.error('❌ DB 데이터 로드 실패:', error);
          // 실패 시 기존 evaluation 데이터 사용
          setFormData({
            inspectionContent: evaluation.evaluationTitle || '',
            inspectionType: evaluation.evaluationType || '',
            inspectionTarget: evaluation.managementCategory || '',
            assignee: evaluation.assignee || '',
            inspectionDate: evaluation.inspectionDate || new Date().toISOString().split('T')[0],
            startDate: evaluation.startDate || new Date().toISOString().split('T')[0],
            endDate: evaluation.endDate || '',
            status: evaluation.status || '',
            code: evaluation.code || '',
            registrationDate: evaluation.registrationDate || new Date().toISOString().split('T')[0],
            team: evaluation.team || '개발팀',
            details: evaluation.details || '',
            performance: evaluation.performance || '',
            improvements: evaluation.improvements || '',
            thoughts: evaluation.thoughts || '',
            notes: evaluation.notes || '',
            checklistGuide: evaluation.checklistGuide || ''
          });
        }
      } else {
        // evaluationDataId가 없으면 기존 로직
        setFormData({
          inspectionContent: evaluation.evaluationTitle || '',
          inspectionType: evaluation.evaluationType || '',
          inspectionTarget: evaluation.managementCategory || '',
          assignee: evaluation.assignee || '',
          inspectionDate: evaluation.inspectionDate || new Date().toISOString().split('T')[0],
          startDate: evaluation.startDate || new Date().toISOString().split('T')[0],
          endDate: evaluation.endDate || '',
          status: evaluation.status || '',
          code: evaluation.code || '',
          registrationDate: evaluation.registrationDate || new Date().toISOString().split('T')[0],
          team: evaluation.team || '개발팀',
          details: evaluation.details || '',
          performance: evaluation.performance || '',
          improvements: evaluation.improvements || '',
          thoughts: evaluation.thoughts || '',
          notes: evaluation.notes || '',
          checklistGuide: evaluation.checklistGuide || ''
        });
      }
    };

    loadEvaluationData();

    if (evaluation?.id) {
      // OPL 데이터 로드
      loadOplItems(evaluation.id);

      // 체크시트 데이터 로드
      fetch(`/api/security-inspection-checksheet?inspection_id=${evaluation.id}`)
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
    } else {
      // 새로운 점검의 경우 OPL 초기화
      setOplItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation?.id, evaluation?.evaluationDataId]);

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
          if (selectedChecklistId && selectedChecklistId !== checklistId && evaluation?.id) {
            console.log('🗑️ 기존 체크리스트 데이터 삭제 중...', {
              inspectionId: evaluation.id,
              oldChecklistId: selectedChecklistId,
              newChecklistId: checklistId
            });
            await deleteAllChecksheetItems(evaluation.id);
            console.log('✅ 기존 체크리스트 데이터 삭제 완료');
          }

          // 먼저 DB에 저장된 체크시트 데이터가 있는지 확인
          if (evaluation?.id) {
            console.log('🔍 DB에 저장된 체크시트 데이터 확인 중...', {
              inspectionId: evaluation.id,
              checklistId: Number(checklistId)
            });
            const savedItems = await fetchChecksheetItemsByChecklist(evaluation.id, Number(checklistId));

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
            if (evaluation?.id) {
              console.log('📝 새 체크시트 데이터 저장 중...', evaluation.id);
              await createChecksheetItems(evaluation.id, checklistItemsData, Number(checklistId));

              // DB에서 실제 ID를 가진 항목들을 다시 가져옴
              console.log('🔄 저장된 체크시트 항목 다시 로드 중...');
              const savedItems = await fetchChecksheetItems(evaluation.id);
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
      evaluation,
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
            if (evaluation?.id && updatedItem.id > 0) {
              updateChecksheetItem(evaluation.id, updatedItem);
            }

            return updatedItem;
          }
          return item;
        });
        return updated;
      });
    },
    [evaluation, updateChecksheetItem]
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
    if (!newComment.trim() || !evaluation?.id) return;

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
      record_id: evaluation.id.toString(),
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
  }, [newComment, evaluation, currentUser]);

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

  // 평가 폼 URL 생성 핸들러
  const handleGenerateEvaluationFormUrl = useCallback(async () => {
    // 체크리스트가 선택되지 않았거나 항목이 없으면 경고
    if (!selectedChecklistId || checklistItems.length === 0) {
      alert('체크리스트를 선택하고 항목이 있어야 평가 폼을 생성할 수 있습니다.');
      return;
    }

    // 평가 데이터가 저장되지 않았으면 경고
    if (!evaluation?.evaluationDataId) {
      alert('평가를 먼저 저장한 후 평가 폼을 생성해주세요.');
      return;
    }

    // 평가 코드가 없으면 경고
    if (!formData.code) {
      alert('평가 코드가 생성되지 않았습니다. 평가를 저장한 후 다시 시도해주세요.');
      return;
    }

    try {
      setIsGeneratingUrl(true);

      // hr_evaluation_data에 체크리스트 ID와 evaluation_code 저장
      const result = await updateEvaluationData(evaluation.evaluationDataId, {
        checklist_id: selectedChecklistId,
        checklist_evaluation_type: checklistEvaluationType,
        evaluation_code: formData.code
      });

      if (result) {
        console.log('✅ 평가 데이터 수정 성공:', result);
      }

      // 평가 폼 URL 생성
      const baseUrl = window.location.origin;
      const formUrl = `${baseUrl}/evaluation-form/${formData.code}`;

      setEvaluationFormUrl(formUrl);
      setUrlDialogOpen(true);

      console.log('✅ 평가 폼 URL 생성 완료:', formUrl);
    } catch (error) {
      console.error('❌ 평가 폼 URL 생성 오류:', error);
      alert('평가 폼 URL 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingUrl(false);
    }
  }, [
    selectedChecklistId,
    checklistItems,
    evaluation,
    formData.code,
    checklistEvaluationType,
    updateEvaluationData
  ]);

  // URL 복사 핸들러
  const handleCopyUrl = useCallback(() => {
    // Clipboard API 사용 가능 여부 확인
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(evaluationFormUrl).then(() => {
        alert('URL이 클립보드에 복사되었습니다.');
      }).catch(() => {
        alert('URL 복사에 실패했습니다.');
      });
    } else {
      // Fallback: 임시 textarea 사용
      const textarea = document.createElement('textarea');
      textarea.value = evaluationFormUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('URL이 클립보드에 복사되었습니다.');
      } catch (err) {
        alert('URL 복사에 실패했습니다.');
      }
      document.body.removeChild(textarea);
    }
  }, [evaluationFormUrl]);

  // OPL 관련 핸들러 함수들 (Supabase 연동)
  const handleAddOplItem = useCallback(async () => {
    if (!evaluation?.id) {
      alert('점검을 먼저 저장한 후 OPL을 추가해주세요.');
      return;
    }

    try {
      const newCode = await generateOplCode();
      const newOplItem: Omit<OPLItem, 'id' | 'created_at' | 'updated_at'> = {
        inspection_id: evaluation.id,
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
  }, [evaluation?.id, generateOplCode, addOplItem, statusOptions]);

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
    console.log('🔍 EvaluationEditDialog handleSave 시작');
    console.log('📊 현재 formData:', formData);
    console.log('📊 현재 evaluation:', evaluation);

    // 필수 필드 검증
    if (!formData.inspectionContent.trim()) {
      setValidationError('평가제목을 입력해주세요.');
      return;
    }

    if (!formData.team.trim()) {
      setValidationError('팀 정보가 없습니다.');
      return;
    }

    if (!formData.assignee.trim()) {
      setValidationError('담당자를 선택해주세요.');
      return;
    }

    if (!formData.inspectionType.trim()) {
      setValidationError('평가유형을 선택해주세요.');
      return;
    }

    if (!formData.inspectionTarget.trim()) {
      setValidationError('관리분류를 선택해주세요.');
      return;
    }

    // 에러 초기화
    setValidationError('');

    // 코드 생성 (새로운 항목인 경우)
    let evaluationCode = formData.code;
    if (!evaluationCode && generateEvaluationCode) {
      try {
        evaluationCode = await generateEvaluationCode();
        console.log('🔄 생성된 코드:', evaluationCode);
      } catch (error) {
        console.error('🔴 코드 생성 실패:', error);
        // 대체 코드 생성
        const year = new Date().getFullYear().toString().slice(-2);
        const time = String(Date.now()).slice(-3);
        evaluationCode = `EVAL-${year}-${time}`;
      }
    }

    const updatedEvaluation: EvaluationTableData = {
      ...evaluation,
      id: evaluation?.id || Date.now(),
      no: evaluation?.no || Math.floor(Math.random() * 1000),
      evaluationTitle: formData.inspectionContent,
      evaluationType: formData.inspectionType as any,
      managementCategory: formData.inspectionTarget as any,
      assignee: formData.assignee || currentUser?.user_name || '',
      inspectionDate: formData.inspectionDate,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status as EvaluationStatus,
      code: evaluationCode || `EVAL-${new Date().getFullYear().toString().slice(-2)}-001`,
      registrationDate: formData.registrationDate,
      team: formData.team || currentUser?.department || '',
      details: formData.details,
      performance: formData.performance,
      improvements: formData.improvements,
      thoughts: formData.thoughts,
      notes: formData.notes,
      checklistGuide: formData.checklistGuide,
      attachments: evaluation?.attachments || []
    };

    console.log('💾 저장할 데이터:', updatedEvaluation);

    // 🔄 hr_evaluation_data 테이블에 저장
    try {
      const evaluationDataPayload = {
        evaluation_title: formData.inspectionContent,
        details: formData.details || '',
        evaluation_type: formData.inspectionType || '',
        management_category: formData.inspectionTarget || '',
        status: formData.status || '대기',
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        team: formData.team || currentUser?.department || '',
        manager: formData.assignee || currentUser?.user_name || '',
        evaluation_code: evaluationCode || formData.code,
        performance: formData.performance || '',
        improvements: formData.improvements || '',
        thoughts: formData.thoughts || '',
        notes: formData.notes || '',
        checklist_guide: formData.checklistGuide || '',
        created_by: currentUser?.user_name || '',
        updated_by: currentUser?.user_name || ''
      };

      console.log('💾 DB 저장 데이터:', evaluationDataPayload);

      if (evaluation?.evaluationDataId) {
        // 기존 데이터 수정
        const result = await updateEvaluationData(evaluation.evaluationDataId, evaluationDataPayload);
        console.log('✅ 평가 데이터 수정 완료:', result);
      } else {
        // 새 데이터 생성
        const result = await createEvaluationData(evaluationDataPayload);
        console.log('✅ 평가 데이터 생성 완료:', result);

        // 생성된 ID를 updatedEvaluation에 추가
        if (result?.id) {
          updatedEvaluation.evaluationDataId = result.id;
        }
      }
    } catch (error) {
      console.error('❌ 평가 데이터 저장 오류:', error);
      setValidationError('평가 데이터 저장에 실패했습니다.');
      return;
    }

    onSave(updatedEvaluation);

    // 🔄 기록 탭 변경사항 DB 저장
    console.log('💾 기록 탭 변경사항 저장 시작');
    console.time('⏱️ 기록 저장 Total');

    if (evaluation?.id) {
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
  }, [
    formData,
    evaluation,
    onSave,
    onClose,
    generateEvaluationCode,
    pendingFeedbacks,
    initialFeedbacks,
    feedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback
  ]);

  // 닫기 핸들러
  const handleClose = useCallback(() => {
    setActiveTab(0);
    setValidationError(''); // 에러 상태 초기화
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
              {/* 평가제목 - 전체 너비 */}
              <TextField
                fullWidth
                label="평가제목"
                required
                value={formData.inspectionContent || ''}
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
                value={formData.details || ''}
                onChange={handleFieldChange('details')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />

              {/* 평가유형, 관리분류, 상태 - 3개 가로 배치 */}
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
                    평가유형
                  </InputLabel>
                  <Select
                    value={formData.inspectionType || ''}
                    label="평가유형"
                    onChange={handleFieldChange('inspectionType')}
                    displayEmpty
                  >
                    <MenuItem value="">선택</MenuItem>
                    {evaluationTypesList.map((type, index) => (
                      <MenuItem key={index} value={type.subcode_name}>
                        {type.subcode_name}
                      </MenuItem>
                    ))}
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
                    관리분류
                  </InputLabel>
                  <Select value={formData.inspectionTarget || ''} label="관리분류" onChange={handleFieldChange('inspectionTarget')} displayEmpty>
                    <MenuItem value="">선택</MenuItem>
                    {managementCategoryOptionsFromMasterCode.length > 0 ? (
                      managementCategoryOptionsFromMasterCode.map((option) => (
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
                  <InputLabel shrink sx={{ color: '#2196F3' }}>
                    상태
                  </InputLabel>
                  <Select value={formData.status || ''} label="상태" onChange={handleFieldChange('status')}>
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

              {/* 시작일, 종료일 - 좌우 배치 */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="시작일"
                  type="date"
                  required
                  value={formData.startDate || ''}
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
                  label="종료일"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={handleFieldChange('endDate')}
                  InputLabelProps={{
                    shrink: true
                  }}
                  variant="outlined"
                />
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
                  value={formData.registrationDate || ''}
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
                  value={formData.code || ''}
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

      case 1: // 체크리스트 탭
        return (
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Stack spacing={3}>
              {/* 평가 폼 생성 버튼 */}
              {checklistItems.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateEvaluationFormUrl}
                    disabled={isGeneratingUrl || !evaluation?.evaluationDataId || !canEdit}
                    sx={{
                      fontWeight: 600,
                      '&.Mui-disabled': {
                        backgroundColor: 'grey.300',
                        color: 'grey.500'
                      }
                    }}
                  >
                    {isGeneratingUrl ? '생성 중...' : '평가 폼 URL 생성'}
                  </Button>
                </Box>
              )}

              {/* 체크리스트 선택 & 평가 설정 */}
              <Stack direction="row" spacing={3}>
                <Box sx={{ flex: 2 }}>
                  <FormControl fullWidth size="small">
                    <TextField
                      select
                      label="기준정보 체크리스트를 선택하세요"
                      value={selectedChecklistId}
                      onChange={(e) => handleChecklistChange(Number(e.target.value))}
                      disabled={checklistsLoading || !canEdit}
                      sx={{
                        '& .Mui-disabled': {
                          backgroundColor: 'grey.100',
                          color: 'grey.500'
                        }
                      }}
                    >
                      <MenuItem value="">선택하세요</MenuItem>
                      {checklists.map((checklist) => (
                        <MenuItem key={checklist.id} value={checklist.id}>
                          <Typography variant="body2" sx={{ fontWeight: 400, width: '100%', color: 'black' }}>
                            {checklist.code} | {checklist.department} | {checklist.workContent} | {checklist.description || '설명 없음'}
                          </Typography>
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <TextField
                      select
                      label="평가 유형을 선택하세요"
                      value={checklistEvaluationType}
                      onChange={(e) => setChecklistEvaluationType(e.target.value as EvaluationType)}
                      disabled={!canEdit}
                      sx={{
                        '& .Mui-disabled': {
                          backgroundColor: 'grey.100',
                          color: 'grey.500'
                        }
                      }}
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

              {/* 안내가이드 */}
              {checklistItems.length > 0 && (
                <Box>
                  <TextField
                    fullWidth
                    label="안내가이드"
                    multiline
                    rows={3}
                    value={formData.checklistGuide || ''}
                    onChange={handleFieldChange('checklistGuide')}
                    placeholder="체크리스트 평가에 대한 안내사항을 작성하세요. (예: 각 항목을 객관적으로 평가해주세요.)"
                    disabled={!canEdit}
                    InputLabelProps={{
                      shrink: true
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '14px'
                      },
                      '& .Mui-disabled': {
                        backgroundColor: 'grey.100',
                        color: 'grey.500'
                      }
                    }}
                  />
                </Box>
              )}

              {/* 체크리스트 항목 */}
              {checklistItems.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    체크리스트 항목
                  </Typography>
                  <TableContainer
                  sx={{
                    border: 'none',
                    boxShadow: 'none',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    position: 'relative',
                    mb: 4,
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
                  <Box sx={{ paddingBottom: '20px' }}>
                    <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell
                          width={50}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          NO
                        </TableCell>
                        <TableCell
                          width={120}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          대분류
                        </TableCell>
                        <TableCell
                          width={120}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          소분류
                        </TableCell>
                        <TableCell
                          width={180}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          점검항목
                        </TableCell>
                        <TableCell
                          width={120}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          평가
                        </TableCell>
                        <TableCell
                          width={80}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          점수
                        </TableCell>
                        <TableCell
                          width={250}
                          sx={{
                            fontWeight: 600,
                            bgcolor: '#fafafa !important',
                            position: 'sticky !important',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '2px solid #e0e0e0'
                          }}
                        >
                          평가내용
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
                            <Select
                              size="small"
                              fullWidth
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
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </Box>
                </TableContainer>
                </Box>
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

      case 2: // 평가 탭 (커리큘럼)
        return <CurriculumTab evaluationCode={formData.code} canEditOwn={canEdit} canEditOthers={canEdit} />;

      case 3: // 평가성과보고 탭
        return (
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, mb: 3 }}>
              평가성과보고
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="성과"
                  multiline
                  rows={4}
                  value={formData.performance || ''}
                  onChange={handleFieldChange('performance')}
                  placeholder="평가를 통해 달성한 구체적인 성과나 결과를 기록하세요."
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="개선사항"
                  multiline
                  rows={4}
                  value={formData.improvements || ''}
                  onChange={handleFieldChange('improvements')}
                  placeholder="향후 평가에서 개선이 필요한 사항이나 보완점을 기록하세요."
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="평가소감"
                  multiline
                  rows={5}
                  value={formData.thoughts || ''}
                  onChange={handleFieldChange('thoughts')}
                  placeholder="평가 과정에서의 전반적인 소감과 피드백을 종합하여 작성하세요."
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비고"
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleFieldChange('notes')}
                  placeholder="기타 특이사항이나 추가로 기록할 내용을 작성하세요."
                  disabled={!canEdit}
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
        return <MaterialTab recordId={evaluation?.id} currentUser={currentUser} canEditOwn={canEdit} canEditOthers={canEdit} />;

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
                인사평가관리 편집
              </Typography>
              {evaluation && (
                <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                  {formData.inspectionContent || ''} ({formData.code || ''})
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClose}
                disabled={!evaluation ? !canCreateData : !canEdit}
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
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={!evaluation ? !canCreateData : !canEdit}
                sx={{
                  '&.Mui-disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                저장
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="개요" />
            <Tab label="체크리스트" />
            <Tab label="평가" />
            <Tab label="평가성과보고" />
            <Tab label="기록" />
            <Tab label="자료" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>{renderTabContent()}</DialogContent>

        {/* 에러 메시지 표시 */}
        {validationError && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="error" sx={{ mt: 1 }}>
              {validationError}
            </Alert>
          </Box>
        )}
      </Dialog>

      {/* 평가 폼 URL 표시 다이얼로그 */}
      <Dialog
        open={urlDialogOpen}
        onClose={() => setUrlDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>평가 폼 URL 생성 완료</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              평가 폼 URL이 생성되었습니다. 아래 URL을 복사하여 평가 대상자에게 공유하세요.
            </Typography>
            <TextField
              fullWidth
              value={evaluationFormUrl}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '14px'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setUrlDialogOpen(false)}>
            닫기
          </Button>
          <Button variant="contained" onClick={handleCopyUrl}>
            URL 복사
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
