'use client';

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// third-party
import ReactApexChart, { Props as ChartProps } from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// project imports

// dnd-kit
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Material-UI
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Pagination,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Checkbox,
  SelectChangeEvent,
  Avatar,
  CircularProgress,
  Skeleton,
  Snackbar,
  Alert
} from '@mui/material';

// 아이콘을 텍스트로 대체 (Material-UI Icons 패키지 미설치로 인함)
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Project imports
import RegulationTable from 'views/apps/RegulationTable';
import RegulationEditDialog from 'components/RegulationEditDialog';
import { regulationData, teams, assignees, regulationStatusOptions, regulationStatusColors, assigneeAvatars } from 'data/regulation';
import { RegulationTableData, RegulationStatus } from 'types/regulation';
import { ThemeMode } from 'config';

// icons (기존 @wandersonalwes/iconsax-react에서 가져오기)
import { Folder, DocumentText, Element, Calendar } from '@wandersonalwes/iconsax-react';

// hooks
import { useSupabaseSecurityRegulation } from 'hooks/useSupabaseSecurityRegulation';
import { useSupabaseSecurityRevision } from 'hooks/useSupabaseSecurityRevision';
import { useCommonData } from 'contexts/CommonDataContext'; // 🏪 공용 창고
import useUser from 'hooks/useUser';
import { useSupabaseFeedback } from 'hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS, FeedbackData } from 'types/feedback';
import { useMenuPermission } from '../../hooks/usePermissions';
import { useSupabaseChangeLog } from 'hooks/useSupabaseChangeLog';
import { ChangeLogData } from 'types/changelog';
import { createClient } from '@/lib/supabase/client';

// 서브코드를 서브코드명으로 변환하는 유틸리티 함수
const convertSubcodeName = (subcode: string | undefined, options: Array<{ code: string; name: string }>) => {
  if (!subcode) return '';
  // 이미 서브코드명이면 그대로 반환
  if (!subcode.includes('GROUP')) return subcode;
  // 서브코드를 서브코드명으로 변환
  const found = options.find((opt) => opt.code === subcode);
  return found ? found.name : subcode;
};

// 변경로그 타입 정의
interface ChangeLog {
  id: number;
  dateTime: string;
  team: string;
  user: string;
  action: string;
  target: string;
  description: string;
}

// 한국어 조사 자동 선택 헬퍼 함수
function getJosa(word: string, josaType: '이가' | '은는' | '을를'): string {
  if (!word || word.length === 0) return josaType === '이가' ? '이' : josaType === '은는' ? '은' : '을';

  const lastChar = word.charAt(word.length - 1);
  const code = lastChar.charCodeAt(0);

  // 한글이 아닌 경우
  if (code < 0xac00 || code > 0xd7a3) {
    // 영어나 숫자인 경우 받침 없는 것으로 처리
    return josaType === '이가' ? '가' : josaType === '은는' ? '는' : '를';
  }

  // 받침 유무 확인
  const hasJongseong = (code - 0xac00) % 28 !== 0;

  if (josaType === '이가') {
    return hasJongseong ? '이' : '가';
  } else if (josaType === '은는') {
    return hasJongseong ? '은' : '는';
  } else {
    return hasJongseong ? '을' : '를';
  }
}

// 폴더 타입 정의
interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  createdDate?: string;
  modifiedDate?: string;
  children?: FolderItem[];
  description?: string;
  code?: string; // SECDOC 코드 추가
  // 개요탭 관련 필드들
  status?: string; // 상태 (대기, 진행, 완료, 홀딩)
  documentType?: string; // 문서유형
  team?: string; // 팀
  assignee?: string; // 담당자
  materials?: Array<{
    // 자료탭 데이터
    id: string;
    name: string;
    revision: string;
    uploadDate: string;
    size?: string;
  }>;
}

// 초기 폴더 데이터
const initialFolderData: FolderItem[] = [
  {
    id: '1',
    name: '정책서',
    type: 'folder',
    createdDate: '2025-01-15',
    modifiedDate: '2025-08-20',
    description: '보안 관련 정책 문서들',
    children: [
      {
        id: '1-1',
        name: '보안정책_2024.pdf',
        type: 'file',
        size: '2.4MB',
        createdDate: '2025-01-15',
        modifiedDate: '2025-03-10',
        description: '2024년 회사 보안 정책 문서',
        status: '대기',
        documentType: '보안정책',
        assignee: '박영희',
        code: 'SEC-DOC-24-001',
        materials: [
          { id: 'mat-1-1', name: '보안정책_2024_v1.pdf', revision: 'R1', uploadDate: '2025-01-15' },
          { id: 'mat-1-2', name: '보안정책_2024_v2.pdf', revision: 'R2', uploadDate: '2025-03-10' }
        ]
      },
      {
        id: '1-2',
        name: '개인정보보호정책.docx',
        type: 'file',
        size: '856KB',
        createdDate: '2025-02-20',
        modifiedDate: '2025-05-15',
        description: '개인정보 보호에 관한 상세 정책',
        status: '진행',
        documentType: '보안지침',
        assignee: '김민수',
        code: 'SEC-DOC-24-002',
        materials: [{ id: 'mat-2-1', name: '개인정보보호정책_v1.docx', revision: 'R1', uploadDate: '2025-02-20' }]
      }
    ]
  },
  {
    id: '2',
    name: '매뉴얼',
    type: 'folder',
    createdDate: '2025-02-01',
    modifiedDate: '2025-08-15',
    description: '보안 업무 관련 매뉴얼과 가이드',
    children: [
      {
        id: '2-1',
        name: '보안업무가이드.pdf',
        type: 'file',
        size: '3.2MB',
        createdDate: '2025-02-01',
        modifiedDate: '2025-06-20',
        description: '보안 업무 수행을 위한 상세 가이드',
        status: '완료',
        documentType: '보안매뉴얼',
        assignee: '이영수',
        code: 'SEC-DOC-24-003',
        materials: [
          { id: 'mat-3-1', name: '보안업무가이드_v1.pdf', revision: 'R1', uploadDate: '2025-02-01' },
          { id: 'mat-3-2', name: '보안업무가이드_v2.pdf', revision: 'R2', uploadDate: '2025-06-20' }
        ]
      },
      {
        id: '2-2',
        name: '교육자료.pptx',
        type: 'file',
        size: '12.5MB',
        createdDate: '2025-03-10',
        modifiedDate: '2025-07-05',
        description: '보안 교육을 위한 프레젖테이션 자료',
        status: '대기',
        documentType: '보안규정',
        assignee: '최지연',
        code: 'SEC-DOC-24-004',
        materials: [
          { id: 'mat-4-1', name: '교육자료_v1.pptx', revision: 'R1', uploadDate: '2025-03-10' },
          { id: 'mat-4-2', name: '교육자료_v2.pptx', revision: 'R2', uploadDate: '2025-07-05' }
        ]
      }
    ]
  },
  {
    id: '3',
    name: '서식',
    type: 'folder',
    createdDate: '2025-01-20',
    modifiedDate: '2025-08-25',
    description: '보안 관련 서식 및 양식',
    children: [
      {
        id: '3-1',
        name: '보안점검표.xlsx',
        type: 'file',
        size: '245KB',
        createdDate: '2025-01-20',
        modifiedDate: '2025-04-30',
        description: '주기적 보안 점검을 위한 체크리스트',
        status: '완료',
        documentType: '보안절차',
        assignee: '정현우',
        code: 'SEC-DOC-24-005',
        materials: [
          { id: 'mat-5-1', name: '보안점검표_v1.xlsx', revision: 'R1', uploadDate: '2025-01-20' },
          { id: 'mat-5-2', name: '보안점검표_v2.xlsx', revision: 'R2', uploadDate: '2025-04-30' }
        ]
      },
      {
        id: '3-2',
        name: '사고보고서.docx',
        type: 'file',
        size: '187KB',
        createdDate: '2025-02-15',
        modifiedDate: '2025-05-20',
        description: '보안 사고 발생 시 작성하는 보고서 서식',
        status: '대기',
        documentType: '보안규정',
        assignee: '박영희',
        code: 'SEC-DOC-24-006',
        materials: [] // 자료가 없는 상태
      }
    ]
  }
];

// Icons
import {
  TableDocument,
  ArrowDown2,
  ArrowRight2,
  FolderOpen,
  DocumentText1,
  Add,
  Trash,
  Edit,
  FolderAdd
} from '@wandersonalwes/iconsax-react';

// 폴더 트리 컴포넌트
interface FolderTreeProps {
  data: FolderItem[];
  level?: number;
  selectedItem: FolderItem | null;
  onSelectItem: (item: FolderItem) => void;
  onDeleteItem: (item: FolderItem) => void;
}

const FolderTree = React.memo(({ data, level = 0, selectedItem, onSelectItem, onDeleteItem }: FolderTreeProps) => {
  const theme = useTheme();
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  // 최상위 레벨 폴더들을 자동으로 펼침
  React.useEffect(() => {
    if (level === 0 && data.length > 0) {
      const allFolderIds = data.filter(item => item.type === 'folder').map(item => item.id);
      setExpandedFolders(new Set(allFolderIds));
    }
  }, [data, level]);

  const toggleFolder = React.useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  return (
    <Box>
      {data.map((item: FolderItem) => (
        <Box key={item.id} sx={{ ml: level * 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 0.5,
              px: 1,
              borderRadius: 1,
              cursor: 'pointer',
              backgroundColor: selectedItem?.id === item.id ? 'primary.50' : 'transparent',
              border: selectedItem?.id === item.id ? '1px solid' : '1px solid transparent',
              borderColor: selectedItem?.id === item.id ? 'primary.main' : 'transparent',
              '&:hover': {
                bgcolor: selectedItem?.id === item.id ? 'primary.100' : 'action.hover'
              }
            }}
            onClick={() => {
              onSelectItem(item);
              if (item.type === 'folder') {
                toggleFolder(item.id);
              }
            }}
          >
            {item.type === 'folder' ? (
              <>
                {expandedFolders.has(item.id) ? (
                  <ArrowDown2 size={16} style={{ marginRight: 8 }} />
                ) : (
                  <ArrowRight2 size={16} style={{ marginRight: 8 }} />
                )}
                <FolderOpen size={20} style={{ marginRight: 8, color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1 }}>
                  {item.name}
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{ width: 16, mr: 1 }} />
                <DocumentText1 size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {item.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                  {item.size}
                </Typography>
              </>
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item);
              }}
              sx={{
                opacity: 0.6,
                '&:hover': {
                  opacity: 1,
                  color: 'error.main'
                }
              }}
            >
              <Trash size={14} />
            </IconButton>
          </Box>
          {item.type === 'folder' && item.children && expandedFolders.has(item.id) && (
            <FolderTree
              data={item.children}
              level={level + 1}
              selectedItem={selectedItem}
              onSelectItem={onSelectItem}
              onDeleteItem={onDeleteItem}
            />
          )}
        </Box>
      ))}
    </Box>
  );
});

FolderTree.displayName = 'FolderTree';

// 개요탭 컴포넌트
interface OverviewTabProps {
  selectedItem: FolderItem;
  onUpdateItem?: (updatedItem: Partial<FolderItem>) => void;
  latestRevision: string;
  latestRevisionDate: string;
  onDataChange?: (data: any) => void;
  documentTypes?: Array<{
    subcode_name: string;
    subcode: string;
  }>;
  statusTypes?: Array<{
    subcode_name: string;
    subcode: string;
  }>;
  assigneeList?: Array<{
    id: number;
    name: string;
    user_code: string;
    avatar?: string;
  }>;
  setValidationError?: (error: string) => void;
}

const OverviewTab = React.memo(
  ({
    selectedItem,
    onUpdateItem,
    latestRevision,
    latestRevisionDate,
    onDataChange,
    documentTypes,
    statusTypes,
    assigneeList,
    setValidationError
  }: OverviewTabProps) => {
    const theme = useTheme();

    // 편집 가능한 필드들의 상태
    const [title, setTitle] = React.useState(selectedItem.name);
    const [description, setDescription] = React.useState(selectedItem.description || '');
    const [status, setStatus] = React.useState(selectedItem.status || '대기');
    const [documentType, setDocumentType] = React.useState(selectedItem.documentType || '');
    const [team, setTeam] = React.useState(selectedItem.team || '');
    const [assignee, setAssignee] = React.useState(selectedItem.assignee || '');

    // selectedItem이 변경될 때 상태 업데이트
    React.useEffect(() => {
      console.log('🔄 OverviewTab selectedItem 변경:', {
        id: selectedItem.id,
        name: selectedItem.name,
        team: selectedItem.team,
        assignee: selectedItem.assignee
      });

      setTitle(selectedItem.name);
      setDescription(selectedItem.description || '');
      setStatus(selectedItem.status || '대기');
      setDocumentType(selectedItem.documentType || '');
      setTeam(selectedItem.team || '');
      setAssignee(selectedItem.assignee || '');

      console.log('✅ OverviewTab state 업데이트 후 team:', selectedItem.team || '');
    }, [
      selectedItem.id,
      selectedItem.name,
      selectedItem.description,
      selectedItem.status,
      selectedItem.documentType,
      selectedItem.team,
      selectedItem.assignee
    ]);

    // 데이터 변경 시 상위 컴포넌트에 알림
    React.useEffect(() => {
      if (onDataChange) {
        onDataChange({
          name: title,
          description,
          status,
          document_type: documentType,
          team,
          assignee
        });
      }
    }, [title, description, status, documentType, team, assignee, onDataChange]);

    // 필드 변경 핸들러 - useCallback으로 최적화
    const handleTitleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = event.target.value;
        setTitle(newTitle);
        // setTimeout을 사용하여 렌더링 사이클 이후에 업데이트
        setTimeout(() => {
          if (selectedItem) {
            onUpdateItem?.({ ...selectedItem, name: newTitle });
          }
        }, 0);
      },
      [selectedItem, onUpdateItem]
    );

    const handleDescriptionChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDescription = event.target.value;
        setDescription(newDescription);
        setTimeout(() => {
          if (selectedItem) {
            onUpdateItem?.({ ...selectedItem, description: newDescription });
          }
        }, 0);
      },
      [selectedItem, onUpdateItem]
    );

    const handleStatusChange = React.useCallback(
      (event: any) => {
        const newStatus = event.target.value;
        setStatus(newStatus);
        setTimeout(() => {
          if (selectedItem) {
            onUpdateItem?.({ ...selectedItem, status: newStatus });
          }
        }, 0);
      },
      [selectedItem, onUpdateItem]
    );

    const handleDocumentTypeChange = React.useCallback(
      (event: any) => {
        const newDocumentType = event.target.value;

        // 에러 초기화
        setValidationError?.('');

        setDocumentType(newDocumentType);

        // selectedFile 업데이트 (저장 버튼 검증용)
        setTimeout(() => {
          if (selectedItem) {
            onUpdateItem?.({ ...selectedItem, documentType: newDocumentType });
          }
        }, 0);
      },
      [selectedItem, onUpdateItem, setValidationError]
    );

    // 담당자는 읽기 전용이므로 handleAssigneeChange 제거됨

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 제목 - 전체 너비 (편집 가능) */}
          <TextField
            fullWidth
            label={
              <span>
                제목 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={title}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            onChange={handleTitleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />

          {/* 설명 - 전체 너비 (편집 가능) */}
          <TextField
            fullWidth
            label="설명"
            multiline
            rows={4}
            value={description}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            onChange={handleDescriptionChange}
            placeholder="설명을 입력하세요..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />

          {/* 보안문서유형-상태 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="document-type-label" shrink>
                보안문서유형 <span style={{ color: 'red' }}>*</span>
              </InputLabel>
              <Select
                labelId="document-type-label"
                value={documentType}
                onChange={handleDocumentTypeChange}
                label="보안문서유형 *"
                displayEmpty
                notched
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {documentTypes && documentTypes.length > 0
                  ? documentTypes.map((docType) => (
                      <MenuItem key={docType.subcode} value={docType.subcode_name}>
                        {docType.subcode_name}
                      </MenuItem>
                    ))
                  : [
                      <MenuItem key="1" value="보안규정">
                        보안규정
                      </MenuItem>,
                      <MenuItem key="2" value="보안지침">
                        보안지침
                      </MenuItem>,
                      <MenuItem key="3" value="보안절차">
                        보안절차
                      </MenuItem>,
                      <MenuItem key="4" value="보안매뉴얼">
                        보안매뉴얼
                      </MenuItem>,
                      <MenuItem key="5" value="보안정책">
                        보안정책
                      </MenuItem>
                    ]}
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-label">상태</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                onChange={handleStatusChange}
                label="상태"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
                renderValue={(selected) => {
                  const getStatusStyle = (statusName: string) => {
                    switch (statusName) {
                      case '대기':
                        return { backgroundColor: '#F5F5F5', color: '#757575' };
                      case '진행':
                        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
                      case '완료':
                        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
                      case '홀딩':
                        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
                      default:
                        return { backgroundColor: '#F5F5F5', color: '#757575' };
                    }
                  };
                  const style = getStatusStyle(selected as string);
                  return (
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '16px',
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        fontWeight: 400,
                        fontSize: '13px'
                      }}
                    >
                      {selected}
                    </Box>
                  );
                }}
              >
                {statusTypes && statusTypes.length > 0
                  ? statusTypes.map((statusType) => {
                      const getStatusStyle = (statusName: string) => {
                        switch (statusName) {
                          case '대기':
                            return { backgroundColor: '#F5F5F5', color: '#757575' };
                          case '진행':
                            return { backgroundColor: '#E3F2FD', color: '#1976D2' };
                          case '완료':
                            return { backgroundColor: '#E8F5E9', color: '#388E3C' };
                          case '홀딩':
                            return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
                          default:
                            return { backgroundColor: '#F5F5F5', color: '#757575' };
                        }
                      };
                      const style = getStatusStyle(statusType.subcode_name);
                      return (
                        <MenuItem key={statusType.subcode} value={statusType.subcode_name}>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 2,
                              py: 0.5,
                              borderRadius: '16px',
                              backgroundColor: style.backgroundColor,
                              color: style.color,
                              fontWeight: 400,
                              fontSize: '13px'
                            }}
                          >
                            {statusType.subcode_name}
                          </Box>
                        </MenuItem>
                      );
                    })
                  : [
                      <MenuItem key="대기" value="대기">
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: '16px',
                            backgroundColor: '#F5F5F5',
                            color: '#757575',
                            fontWeight: 400,
                            fontSize: '13px'
                          }}
                        >
                          대기
                        </Box>
                      </MenuItem>,
                      <MenuItem key="진행" value="진행">
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: '16px',
                            backgroundColor: '#E3F2FD',
                            color: '#1976D2',
                            fontWeight: 400,
                            fontSize: '13px'
                          }}
                        >
                          진행
                        </Box>
                      </MenuItem>,
                      <MenuItem key="완료" value="완료">
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: '16px',
                            backgroundColor: '#E8F5E9',
                            color: '#388E3C',
                            fontWeight: 400,
                            fontSize: '13px'
                          }}
                        >
                          완료
                        </Box>
                      </MenuItem>,
                      <MenuItem key="홀딩" value="홀딩">
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: '16px',
                            backgroundColor: '#FFEBEE',
                            color: '#D32F2F',
                            fontWeight: 400,
                            fontSize: '13px'
                          }}
                        >
                          홀딩
                        </Box>
                      </MenuItem>
                    ]}
              </Select>
            </FormControl>
          </Stack>

          {/* 최종리비전-리비전수정일 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="최종리비전"
              value={latestRevision || ''}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              placeholder={!latestRevision ? '' : undefined}
            />
            <TextField
              fullWidth
              label="리비전수정일"
              type="date"
              value={latestRevisionDate || ''}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              placeholder={!latestRevisionDate ? '' : undefined}
            />
          </Stack>

          {/* 팀-담당자 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              value={team}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5'
                }
              }}
            />
            <TextField
              fullWidth
              label="담당자"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment:
                  assignee && assigneeList ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -0.5 }}>
                      <Avatar
                        src={assigneeList.find((user) => user.name === assignee)?.avatar || '/assets/images/users/avatar-1.png'}
                        alt={assignee}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography variant="body1">{assignee}</Typography>
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
                '& .MuiInputBase-input': {
                  display: 'none'
                }
              }}
            />
          </Stack>

          {/* 최초등록일-코드 - 2등분 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="최초등록일"
              type="date"
              value={selectedItem.createdDate || '2024-08-29'}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5'
                }
              }}
            />
            <TextField
              fullWidth
              label="코드"
              value={selectedItem.code || `REG-${selectedItem.id.padStart(4, '0')}`}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5'
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

// 기록탭 컴포넌트
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
    currentUserDepartment,
    isAdding,
    isUpdating,
    isDeleting
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
    isAdding?: boolean;
    isUpdating?: boolean;
    isDeleting?: boolean;
  }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 3;

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
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: 5, pt: 3 }}>
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
            disabled={!newComment.trim() || isAdding}
            sx={{ minWidth: '80px', height: '40px', mt: 0.5 }}
            startIcon={isAdding ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isAdding ? '등록 중...' : '등록'}
          </Button>
        </Box>

        {/* 기록 항목들 */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            pb: 2,
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
                        <IconButton
                          size="small"
                          onClick={onSaveEditComment}
                          color="success"
                          sx={{ p: 0.5 }}
                          title="저장 (Ctrl+Enter)"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <CircularProgress size={14} color="inherit" /> : <Typography fontSize="14px">✓</Typography>}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={onCancelEditComment}
                          color="error"
                          sx={{ p: 0.5 }}
                          title="취소 (Escape)"
                          disabled={isUpdating}
                        >
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
                          disabled={isUpdating || isDeleting}
                        >
                          <Typography fontSize="14px">✏️</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteComment(comment.id)}
                          color="error"
                          sx={{ p: 0.5 }}
                          title="삭제"
                          disabled={isUpdating || isDeleting}
                        >
                          {isDeleting ? <CircularProgress size={14} color="inherit" /> : <Typography fontSize="14px">🗑️</Typography>}
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
            height: '64px',
            pt: 2,
            pb: 2,
            px: 4,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            flexShrink: 0
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {comments.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, comments.length)} of ${comments.length}` : '0-0 of 0'}
          </Typography>
          {totalPages > 0 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
              siblingCount={1}
              boundaryCount={1}
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

// 자료탭 컴포넌트
interface MaterialTabProps {
  selectedItem: FolderItem;
  attachedFiles: Array<{
    id: string;
    name: string;
    size: string;
    fileDescription: string;
    createdDate: string;
    revision: string;
    no: number;
    file?: File;
    filePath?: string; // 파일 경로 추가
  }>;
  setAttachedFiles: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        name: string;
        size: string;
        fileDescription: string;
        createdDate: string;
        revision: string;
        no: number;
        file?: File;
        filePath?: string; // 파일 경로 추가
      }>
    >
  >;
  onRefreshRevisions?: () => void;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

const MaterialTab = React.memo(({ selectedItem, attachedFiles, setAttachedFiles, onRefreshRevisions, canCreateData = true, canEditOwn = true, canEditOthers = true }: MaterialTabProps) => {
  const theme = useTheme();
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set());
  const { createRevision, updateRevision, deleteRevision } = useSupabaseSecurityRevision();

  // attachedFiles는 이미 OverviewPanel에서 로드되므로 여기서는 fetch 불필요

  // 파일 첨부 기능 (DB 저장)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedItem && selectedItem.type === 'file') {
      const regulationId = Number(selectedItem.id);
      if (isNaN(regulationId)) {
        alert('파일 ID가 올바르지 않습니다.');
        return;
      }

      for (const file of Array.from(files)) {
        try {
          // 1. 서버에 파일 업로드
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch('/api/upload/regulation', {
            method: 'POST',
            body: formData
          });

          const uploadResult = await uploadResponse.json();

          if (!uploadResult.success) {
            alert(`파일 ${file.name} 업로드에 실패했습니다: ${uploadResult.error}`);
            continue;
          }

          console.log('✅ 파일 업로드 성공:', uploadResult);

          // 2. DB에 리비전 저장 (file_path 포함)
          const success = await createRevision({
            security_regulation_id: regulationId,
            file_name: file.name,
            file_size: `${Math.round(file.size / 1024)}KB`,
            file_description: '',
            file_path: uploadResult.url // 업로드된 파일 경로
          });

          if (!success) {
            alert(`파일 ${file.name} DB 저장에 실패했습니다.`);
          }
        } catch (error) {
          console.error('❌ 파일 업로드 오류:', error);
          alert(`파일 ${file.name} 업로드 중 오류가 발생했습니다.`);
        }
      }

      // 리비전 목록 새로고침
      if (onRefreshRevisions) {
        onRefreshRevisions();
      }
    }
    // input 초기화
    if (event.target) {
      event.target.value = '';
    }
  };

  // 선택된 파일 삭제 (DB에서 소프트 삭제)
  const handleDeleteSelected = async () => {
    if (!selectedItem || selectedItem.type !== 'file') return;

    const regulationId = Number(selectedItem.id);
    if (isNaN(regulationId)) {
      alert('파일 ID가 올바르지 않습니다.');
      return;
    }

    for (const fileId of Array.from(selectedFiles)) {
      const success = await deleteRevision(Number(fileId), regulationId);
      if (!success) {
        alert(`파일 삭제에 실패했습니다.`);
        return;
      }
    }
    setSelectedFiles(new Set());

    // 리비전 목록 새로고침
    if (onRefreshRevisions) {
      onRefreshRevisions();
    }
  };

  // 파일설명 편집 (DB 업데이트)
  const handleDescriptionChange = async (fileId: string, newDescription: string) => {
    // 먼저 로컬 state 업데이트 (즉각 반영)
    setAttachedFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, fileDescription: newDescription } : file)));

    // DB 업데이트는 디바운싱 없이 즉시 실행
    const success = await updateRevision(Number(fileId), {
      file_description: newDescription
    });

    if (!success) {
      console.error('파일 설명 업데이트 실패');
    }
  };

  // 체크박스 선택 처리
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedFiles.size === attachedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(attachedFiles.map((file) => file.id)));
    }
  };

  // 파일 다운로드 기능
  const handleFileDownload = (fileId: string, fileName: string) => {
    const fileData = attachedFiles.find((f) => f.id === fileId);

    if (fileData) {
      if (fileData.filePath) {
        // 서버에 저장된 파일 경로가 있는 경우
        const link = document.createElement('a');
        link.href = fileData.filePath;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ 파일 다운로드:', fileName, fileData.filePath);
      } else if (fileData.file) {
        // File 객체가 있는 경우 (방금 업로드한 파일)
        const url = URL.createObjectURL(fileData.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('✅ 파일 다운로드 (메모리):', fileName);
      } else {
        // 파일 경로도 File 객체도 없는 경우
        console.log(`❌ 파일 다운로드 불가: ${fileName} (경로 없음)`);
        alert('파일 경로가 없어 다운로드할 수 없습니다.\n오래된 파일은 다시 업로드해주세요.');
      }
    } else {
      alert('파일 정보를 찾을 수 없습니다.');
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* 파일 버튼들 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          첨부파일 목록 ({attachedFiles.length}건)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add size={16} />}
            size="small"
            component="label"
            disabled={!canCreateData || !selectedItem || selectedItem.type !== 'file'}
            sx={{
              px: 2,
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
            title={
              !selectedItem || selectedItem.type !== 'file'
                ? '파일을 먼저 선택해주세요'
                : !canCreateData
                ? '파일 추가 권한이 없습니다'
                : '파일 추가'
            }
          >
            추가
            <input type="file" multiple hidden onChange={handleFileUpload} accept="*/*" />
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={selectedFiles.size === 0 || !(canEditOwn || canEditOthers)}
            onClick={handleDeleteSelected}
            sx={{
              px: 2,
              borderColor: selectedFiles.size > 0 && (canEditOwn || canEditOthers) ? 'error.main' : 'grey.300',
              color: selectedFiles.size > 0 && (canEditOwn || canEditOthers) ? 'error.main' : 'grey.500',
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            삭제 {selectedFiles.size > 0 && `(${selectedFiles.size})`}
          </Button>
        </Box>
      </Box>

      {/* 파일 테이블 */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center', px: 1 }}>
                <Checkbox
                  indeterminate={selectedFiles.size > 0 && selectedFiles.size < attachedFiles.length}
                  checked={attachedFiles.length > 0 && selectedFiles.size === attachedFiles.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center' }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '220px', minWidth: '220px', maxWidth: '220px' }}>파일명</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '90px', minWidth: '90px', maxWidth: '90px', textAlign: 'center' }}>
                파일크기
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: '220px', minWidth: '220px', maxWidth: '220px' }}>파일설명</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' }}>
                등록일
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: '80px', minWidth: '80px', maxWidth: '80px', textAlign: 'center' }}>리비전</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attachedFiles.map((file) => (
              <TableRow key={file.id} hover>
                <TableCell sx={{ width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center', px: 1 }}>
                  <Checkbox checked={selectedFiles.has(file.id)} onChange={() => handleSelectFile(file.id)} />
                </TableCell>
                <TableCell sx={{ width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center' }}>{file.no}</TableCell>
                <TableCell sx={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        '& .file-name': {
                          color: 'primary.main'
                        }
                      }
                    }}
                    onClick={() => handleFileDownload(file.id, file.name)}
                  >
                    <DocumentText1 size={16} style={{ color: theme.palette.text.secondary }} />
                    <Typography
                      variant="body2"
                      noWrap
                      className="file-name"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      {file.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ width: '90px', minWidth: '90px', maxWidth: '90px', textAlign: 'center' }}>
                  <Typography variant="body2">{file.size}</Typography>
                </TableCell>
                <TableCell sx={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="파일 설명"
                    value={file.fileDescription}
                    onChange={(e) => handleDescriptionChange(file.id, e.target.value)}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                        height: '32px',
                        '& fieldset': {
                          border: 'none' // 기본 상태에서 테두리 숨김
                        },
                        '&:hover fieldset': {
                          border: 'none' // 호버 시에도 테두리 숨김
                        },
                        '&.Mui-focused fieldset': {
                          border: '1px solid',
                          borderColor: 'primary.main' // 포커스 시에만 테두리 표시
                        }
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' }}>
                  <Typography variant="body2">{file.createdDate}</Typography>
                </TableCell>
                <TableCell sx={{ width: '80px', minWidth: '80px', maxWidth: '80px', textAlign: 'center' }}>
                  <Chip label={file.revision} size="small" variant="outlined" color="primary" />
                </TableCell>
              </TableRow>
            ))}
            {attachedFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    첨부된 파일이 없습니다. 위의 '추가' 버튼을 눌러 파일을 첨부하세요.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

MaterialTab.displayName = 'MaterialTab';

// 상세보기 패널 (탭 방식)
interface OverviewPanelProps {
  selectedItem: FolderItem | null;
  onUpdateItem?: (updatedItem: Partial<FolderItem>) => void;
  updateItem?: (id: number, updateData: Partial<any>) => Promise<boolean>;
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
  ) => Promise<void>;
  documentTypes?: Array<{
    subcode_name: string;
    subcode: string;
  }>;
  statusTypes?: Array<{
    subcode_name: string;
    subcode: string;
  }>;
  assigneeList?: Array<{
    id: number;
    name: string;
    user_code: string;
    avatar?: string;
  }>;
  attachedFiles?: Array<{
    id: string;
    name: string;
    size: string;
    fileDescription: string;
    createdDate: string;
    revision: string;
    no: number;
    file?: File;
  }>;
  setAttachedFiles?: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        name: string;
        size: string;
        fileDescription: string;
        createdDate: string;
        revision: string;
        no: number;
        file?: File;
      }>
    >
  >;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  setSnackbar?: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      severity: 'success' | 'error' | 'warning' | 'info';
    }>
  >;
  positionOptions?: Array<{
    code: string;
    name: string;
  }>;
}

const OverviewPanel = React.memo(
  ({
    selectedItem,
    onUpdateItem,
    updateItem,
    addChangeLog,
    documentTypes,
    statusTypes,
    assigneeList,
    attachedFiles: externalAttachedFiles,
    setAttachedFiles: externalSetAttachedFiles,
    canCreateData = true,
    canEditOwn = true,
    canEditOthers = true,
    setSnackbar,
    positionOptions = []
  }: OverviewPanelProps) => {
    const [detailTab, setDetailTab] = React.useState(0);
    const { revisions, fetchRevisions } = useSupabaseSecurityRevision();

    // 사용자 정보
    const { data: session } = useSession();
    const user = useUser();
    const { users } = useCommonData(); // 🏪 공용 창고에서 가져오기

    // 현재 사용자 찾기
    const currentUser = React.useMemo(() => {
      if (!session?.user?.email || users.length === 0) return null;
      return users.find((u) => u.email === session.user.email);
    }, [session, users]);

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
    } = useSupabaseFeedback(PAGE_IDENTIFIERS.SECURITY_REGULATION, selectedItem?.id?.toString());

    // 기록 상태 관리
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // Supabase feedbacks를 RecordTab 형식으로 변환
    const comments = useMemo(() => {
      return feedbacks.map((feedback) => {
        const feedbackUser = users.find((u) => u.user_name === feedback.user_name);

        // ⚠️ DB에 position과 role이 바뀌어 저장되어 있음
        // feedbackUser.role에 직급 서브코드(GROUP004-SUB003)가 들어있어서 이걸 변환하면 "팀장"이 나옴
        // feedbackUser.position에는 직책명("사원")이 들어있는데, 이건 표시하지 않음
        return {
          id: feedback.id,
          author: feedback.user_name,
          content: feedback.description,
          timestamp: new Date(feedback.created_at).toLocaleString('ko-KR'),
          avatar: feedback.user_profile_image || feedbackUser?.profile_image_url || undefined,
          department: feedback.user_department || feedback.team || feedbackUser?.department || '',
          position: convertSubcodeName(feedbackUser?.role || '', positionOptions),
          role: '' // DB에 position/role이 바뀌어 있어서 role은 표시하지 않음
        };
      });
    }, [feedbacks, users, positionOptions]);

    // 파일이 선택될 때마다 개요탭으로 이동
    React.useEffect(() => {
      if (selectedItem?.type === 'file') {
        setDetailTab(0);
      }
    }, [selectedItem?.id, selectedItem?.type]);

    // 원본 selectedItem 저장 (변경 전 데이터 비교용)
    const originalItemRef = React.useRef<any>(null);

    // selectedItem이 변경될 때마다 원본 데이터 저장 (currentData와 같은 형식으로 저장)
    React.useEffect(() => {
      if (selectedItem) {
        originalItemRef.current = {
          name: selectedItem.name,
          description: selectedItem.description,
          status: selectedItem.status,
          document_type: selectedItem.documentType,
          team: selectedItem.team,
          assignee: selectedItem.assignee
        };
      }
    }, [selectedItem?.id]);

    // 현재 편집 중인 selectedItem 상태 (로컬 state)
    const [editingItem, setEditingItem] = React.useState<any>(selectedItem);

    // selectedItem이 변경될 때 editingItem도 업데이트
    React.useEffect(() => {
      if (selectedItem) {
        setEditingItem({ ...selectedItem });
      }
    }, [selectedItem?.id]);

    // 현재 편집된 데이터 상태
    const [currentData, setCurrentData] = React.useState<any>(null);

    // 공유할 파일 데이터 상태 (외부에서 받거나 내부 상태 사용)
    const [internalAttachedFiles, setInternalAttachedFiles] = React.useState<
      Array<{
        id: string;
        name: string;
        size: string;
        fileDescription: string;
        createdDate: string;
        revision: string;
        no: number;
        file?: File;
        filePath?: string;
      }>
    >([]);

    // 외부 props가 있으면 사용하고, 없으면 내부 상태 사용
    const attachedFiles = externalAttachedFiles || internalAttachedFiles;
    const setAttachedFiles = externalSetAttachedFiles || setInternalAttachedFiles;

    // selectedItem 변경 시 DB에서 리비전 목록 가져오기
    React.useEffect(() => {
      if (selectedItem && selectedItem.type === 'file') {
        const regulationId = Number(selectedItem.id);
        if (!isNaN(regulationId)) {
          console.log('🔄 OverviewPanel: 파일 선택됨, regulationId =', regulationId);
          fetchRevisions(regulationId);
        }
      }
    }, [selectedItem, fetchRevisions]);

    // DB에서 가져온 리비전을 attachedFiles 형태로 변환
    React.useEffect(() => {
      // 파일이 선택되었고, revisions 데이터가 로드되었을 때 변환
      if (selectedItem && selectedItem.type === 'file') {
        if (revisions && revisions.length > 0) {
          const converted = revisions.map((rev, index) => ({
            id: rev.id.toString(),
            name: rev.file_name,
            size: rev.file_size || '',
            fileDescription: rev.file_description || '',
            createdDate: rev.upload_date,
            revision: rev.revision,
            no: revisions.length - index,
            filePath: rev.file_path || undefined // 파일 경로 추가
          }));
          setAttachedFiles(converted);
        } else if (revisions && revisions.length === 0) {
          // DB에 리비전이 없으면 빈 배열로 설정
          setAttachedFiles([]);
        }
      }
    }, [revisions, selectedItem, setAttachedFiles]);

    // 최종 리비전 계산 - R 형식과 v 형식 모두 지원
    const getLatestRevision = React.useCallback(() => {
      if (attachedFiles.length === 0) return ''; // 빈 문자열로 변경

      // R형식 (R1, R2, R3 등)과 v형식 (v1.0, v1.1, v2.0 등) 모두 처리
      const sortedFiles = [...attachedFiles].sort((a, b) => {
        const getRevisionNumber = (revision: string) => {
          // R형식 처리
          const rMatch = revision.match(/R(\d+)/);
          if (rMatch) return parseInt(rMatch[1]);

          // v형식 처리
          const vMatch = revision.match(/v?(\d+)\.(\d+)/);
          if (vMatch) return parseFloat(`${vMatch[1]}.${vMatch[2]}`);

          return 0;
        };
        return getRevisionNumber(b.revision) - getRevisionNumber(a.revision);
      });

      return sortedFiles[0]?.revision || '';
    }, [attachedFiles]);

    // 최종 리비전의 등록일 가져오기
    const getLatestRevisionDate = React.useCallback(() => {
      if (attachedFiles.length === 0) return ''; // 빈 문자열로 변경

      const latestRevision = getLatestRevision();
      const latestFile = attachedFiles.find((file) => file.revision === latestRevision);

      return latestFile?.createdDate || ''; // 빈 문자열로 변경
    }, [attachedFiles, getLatestRevision]);

    // 최종리비전과 리비전수정일 변경 감지를 위한 ref
    const prevLatestRevisionRef = React.useRef<string>('');
    const prevLatestRevisionDateRef = React.useRef<string>('');

    // attachedFiles 변경 시 최종리비전과 리비전수정일 변경 감지 및 변경로그 추가
    React.useEffect(() => {
      if (!selectedItem || selectedItem.type !== 'file' || !addChangeLog) return;

      const currentLatestRevision = getLatestRevision();
      const currentLatestRevisionDate = getLatestRevisionDate();

      // 초기화 시에는 변경로그를 추가하지 않음 (빈 문자열에서 처음 값으로 변경될 때)
      const isInitializing = prevLatestRevisionRef.current === '' && prevLatestRevisionDateRef.current === '';

      if (!isInitializing) {
        const team = user?.department || user?.name || '시스템';

        // 최종리비전 변경 감지
        if (prevLatestRevisionRef.current !== currentLatestRevision && currentLatestRevision !== '') {
          const beforeValue = prevLatestRevisionRef.current || '없음';
          const afterValue = currentLatestRevision;
          const description = `최종리비전이 "${beforeValue}"에서 "${afterValue}"(으)로 변경되었습니다.`;

          addChangeLog(
            '수정',
            selectedItem.code || `REG-${selectedItem.id}`,
            description,
            team,
            beforeValue,
            afterValue,
            '최종리비전',
            selectedItem.name || '규정제목 없음',
            '폴더탭'
          );
        }

        // 리비전수정일 변경 감지
        if (prevLatestRevisionDateRef.current !== currentLatestRevisionDate && currentLatestRevisionDate !== '') {
          const beforeValue = prevLatestRevisionDateRef.current || '없음';
          const afterValue = currentLatestRevisionDate;
          const description = `리비전수정일이 "${beforeValue}"에서 "${afterValue}"(으)로 변경되었습니다.`;

          addChangeLog(
            '수정',
            selectedItem.code || `REG-${selectedItem.id}`,
            description,
            team,
            beforeValue,
            afterValue,
            '리비전수정일',
            selectedItem.name || '규정제목 없음',
            '폴더탭'
          );
        }
      }

      // 현재 값을 ref에 저장 (다음 비교를 위해)
      prevLatestRevisionRef.current = currentLatestRevision;
      prevLatestRevisionDateRef.current = currentLatestRevisionDate;
    }, [attachedFiles, selectedItem, getLatestRevision, getLatestRevisionDate, addChangeLog, user]);

    // 기록 핸들러들
    const handleAddComment = useCallback(async () => {
      if (!newComment.trim() || !selectedItem?.id) return;

      const currentUserName = currentUser?.user_name || user?.name || '현재 사용자';
      const currentTeam = currentUser?.department || user?.department || '';
      const currentPosition = currentUser?.position || '';
      const currentProfileImage = currentUser?.profile_image_url || '';
      const currentRole = currentUser?.role || '';

      const feedbackInput: any = {
        page: PAGE_IDENTIFIERS.SECURITY_REGULATION,
        record_id: selectedItem.id.toString(),
        action_type: '기록',
        description: newComment,
        user_name: currentUserName,
        team: currentTeam || undefined,
        user_department: currentTeam || undefined,
        user_position: currentPosition || undefined,
        user_profile_image: currentProfileImage || undefined
      };

      // user_id는 UUID 타입이므로 전송하지 않음 (optional)
      // DB 스키마가 UUID를 요구하는데 숫자 ID를 전달하면 에러 발생

      // metadata에 role이 있을 때만 추가
      if (currentRole) {
        feedbackInput.metadata = { role: currentRole };
      }

      await addFeedback(feedbackInput);

      setNewComment('');
    }, [newComment, selectedItem, currentUser, user, addFeedback]);

    const handleEditComment = useCallback((commentId: string, content: string) => {
      setEditingCommentId(commentId);
      setEditingCommentText(content);
    }, []);

    const handleSaveEditComment = useCallback(async () => {
      if (!editingCommentText.trim() || !editingCommentId) return;

      await updateFeedback(editingCommentId, {
        description: editingCommentText
      });

      setEditingCommentId(null);
      setEditingCommentText('');
    }, [editingCommentText, editingCommentId, updateFeedback]);

    const handleCancelEditComment = useCallback(() => {
      setEditingCommentId(null);
      setEditingCommentText('');
    }, []);

    const handleDeleteComment = useCallback(
      async (commentId: string) => {
        await deleteFeedback(commentId);
      },
      [deleteFeedback]
    );

    if (!selectedItem) {
      return (
        <Paper
          variant="outlined"
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="body1" color="text.secondary" align="center">
            폴더나 파일을 선택하여 상세 정보를 확인하세요.
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 탭 영역 */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Tabs
            value={detailTab}
            onChange={(e, newValue) => setDetailTab(newValue)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500
              }
            }}
          >
            <Tab label="개요" disabled={selectedItem?.type === 'folder'} />
            <Tab label="자료" disabled={selectedItem?.type === 'folder'} />
            <Tab label="기록" disabled={selectedItem?.type === 'folder'} />
          </Tabs>

          {/* 취소, 저장 버튼 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                console.log('📌 폴더뷰 개요창 취소 버튼 클릭 - 원본 데이터로 복원');

                // 원본 데이터로 복원 (snake_case를 camelCase로 변환)
                if (originalItemRef.current && selectedItem) {
                  const restoredItem = {
                    ...selectedItem,
                    name: originalItemRef.current.name,
                    description: originalItemRef.current.description,
                    status: originalItemRef.current.status,
                    documentType: originalItemRef.current.document_type,
                    team: originalItemRef.current.team,
                    assignee: originalItemRef.current.assignee
                  };

                  setEditingItem(restoredItem);

                  // onUpdateItem을 호출하여 상위 컴포넌트도 업데이트
                  if (onUpdateItem) {
                    onUpdateItem(restoredItem);
                  }
                }
              }}
              disabled={!(canEditOwn || canEditOthers)}
              sx={{
                minWidth: 'auto',
                px: 2,
                fontSize: '13px',
                height: '32px',
                borderColor: '#d32f2f',
                color: '#d32f2f',
                '&:hover': {
                  borderColor: '#b71c1c',
                  backgroundColor: 'rgba(211, 47, 47, 0.04)'
                },
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
              onClick={async () => {
                if (!editingItem || !updateItem || !currentData) {
                  console.log('저장할 데이터가 없습니다.');
                  return;
                }

                const originalItem = originalItemRef.current;
                if (!originalItem) {
                  console.log('원본 데이터가 없습니다.');
                  return;
                }

                try {
                  console.log('📋 폴더뷰 개요창 저장 시작:', {
                    originalItem,
                    currentData
                  });

                  // 변경된 필드 찾기 및 변경로그 추가
                  const fieldMap: { [key: string]: string } = {
                    name: '제목',
                    description: '설명',
                    status: '상태',
                    document_type: '보안문서유형',
                    team: '팀',
                    assignee: '담당자'
                  };

                  const changedFields: string[] = [];

                  Object.keys(fieldMap).forEach((key) => {
                    // originalItem과 currentData 모두 snake_case 사용
                    const oldValue = (originalItem as any)[key];
                    const newValue = (currentData as any)[key];

                    console.log(`🔍 필드 비교 [${key}]:`, {
                      oldValue,
                      newValue,
                      isDifferent: oldValue !== newValue
                    });

                    // 실제로 값이 변경된 경우만 추가 (빈 문자열과 undefined는 같은 것으로 처리)
                    const isChanged = oldValue !== newValue &&
                                     !(oldValue === '' && newValue === undefined) &&
                                     !(oldValue === undefined && newValue === '') &&
                                     !(oldValue === '' && newValue === '');

                    if (isChanged) {
                      changedFields.push(fieldMap[key]);

                      const regulationCode = editingItem.code || editingItem.id;
                      const regulationTitle = currentData.name || editingItem.name || '규정제목 없음';
                      const fieldName = fieldMap[key];
                      const josa = getJosa(fieldName, '이가');
                      const description = `보안규정관리 ${regulationTitle}(${regulationCode}) 폴더탭의 ${fieldName}${josa} ${oldValue || '(없음)'} → ${newValue || '(없음)'}로 수정 되었습니다.`;

                      console.log('📝 폴더뷰 개요창 변경로그 추가:', {
                        field: fieldName,
                        oldValue,
                        newValue,
                        code: regulationCode,
                        title: regulationTitle
                      });

                      // 변경로그 추가
                      if (addChangeLog) {
                        addChangeLog(
                          '수정',
                          regulationCode,
                          description,
                          editingItem.team || '미분류',
                          String(oldValue || ''),
                          String(newValue || ''),
                          fieldName,
                          regulationTitle,
                          '폴더탭'
                        );
                      }
                    }
                  });

                  // DB 저장
                  console.log('💾 DB 저장 중...', currentData);
                  const success = await updateItem(Number(editingItem.id), {
                    name: currentData.name,
                    description: currentData.description,
                    status: currentData.status,
                    document_type: currentData.document_type,
                    team: currentData.team,
                    assignee: currentData.assignee
                  });

                  if (success) {
                    console.log('✅ 저장 완료!');

                    // onUpdateItem을 호출하여 상위 컴포넌트 업데이트
                    if (onUpdateItem) {
                      onUpdateItem({
                        ...editingItem,
                        name: currentData.name,
                        description: currentData.description,
                        status: currentData.status,
                        documentType: currentData.document_type,
                        team: currentData.team,
                        assignee: currentData.assignee
                      });
                    }

                    // 원본 데이터 업데이트 (currentData와 같은 형식으로 저장)
                    originalItemRef.current = {
                      name: currentData.name,
                      description: currentData.description,
                      status: currentData.status,
                      document_type: currentData.document_type,
                      team: currentData.team,
                      assignee: currentData.assignee
                    };

                    // 성공 토스트 알림
                    if (setSnackbar) {
                      let message = '';
                      if (changedFields.length > 0) {
                        const fieldsText = changedFields.join(', ');
                        const lastField = changedFields[changedFields.length - 1];
                        const josa = getJosa(lastField, '이가');
                        message = `${currentData.name}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
                      } else {
                        const josa = getJosa(currentData.name, '이가');
                        message = `${currentData.name}${josa} 성공적으로 저장되었습니다.`;
                      }
                      setSnackbar({
                        open: true,
                        message: message,
                        severity: 'success'
                      });
                    }
                  } else {
                    console.error('❌ 저장 실패');

                    // 실패 토스트 알림
                    if (setSnackbar) {
                      setSnackbar({
                        open: true,
                        message: '저장 중 오류가 발생했습니다.',
                        severity: 'error'
                      });
                    }
                  }
                } catch (error) {
                  console.error('❌ 저장 중 오류:', error);

                  // 에러 토스트 알림
                  if (setSnackbar) {
                    setSnackbar({
                      open: true,
                      message: '저장 중 오류가 발생했습니다.',
                      severity: 'error'
                    });
                  }
                }
              }}
              disabled={!(canEditOwn || canEditOthers)}
              sx={{
                minWidth: 'auto',
                px: 2,
                fontSize: '13px',
                height: '32px',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                },
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

        {/* 탭 컨텐츠 */}
        <Box sx={{ flexGrow: 1, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
          {selectedItem?.type === 'folder' ? (
            /* 폴더 선택 시 안내 메시지 */
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography variant="h6" color="text.secondary">
                폴더가 선택되었습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                파일을 선택하시면 해당 파일의
                <br />
                개요, 자료, 기록 정보를 확인할 수 있습니다.
              </Typography>
            </Box>
          ) : (
            /* 파일 선택 시 탭 컨텐츠 */
            <>
              {detailTab === 0 && editingItem && (
                <OverviewTab
                  selectedItem={editingItem}
                  onUpdateItem={(updates) => {
                    // 폴더뷰 개요창에서는 로컬 state만 업데이트 (DB 저장 안 함)
                    // 저장 버튼 클릭 시에만 DB에 저장하고 변경로그 추가
                    console.log('📝 OverviewTab onUpdateItem 호출 (로컬 state만 업데이트):', updates);
                    setEditingItem((prev: any) => {
                      if (prev && prev.id === editingItem.id) {
                        return { ...prev, ...updates };
                      }
                      return prev;
                    });
                  }}
                  latestRevision={getLatestRevision()}
                  latestRevisionDate={getLatestRevisionDate()}
                  onDataChange={setCurrentData}
                  documentTypes={documentTypes}
                  statusTypes={statusTypes}
                  assigneeList={assigneeList}
                />
              )}
              {detailTab === 1 && selectedItem && (
                <MaterialTab
                  selectedItem={selectedItem}
                  attachedFiles={attachedFiles}
                  setAttachedFiles={setAttachedFiles}
                  onRefreshRevisions={() => {
                    const regulationId = Number(selectedItem.id);
                    if (!isNaN(regulationId)) {
                      fetchRevisions(regulationId);
                    }
                  }}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                />
              )}
              {detailTab === 2 && selectedItem && (
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
                  isAdding={isAdding}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                />
              )}
            </>
          )}
        </Box>
      </Paper>
    );
  }
);

OverviewPanel.displayName = 'OverviewPanel';

// 폴더 뷰 컴포넌트
interface FolderViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  folderData: FolderItem[];
  setFolderData: React.Dispatch<React.SetStateAction<FolderItem[]>>;
  updateItem?: (id: number, updateData: Partial<any>) => Promise<boolean>;
  createItem?: (itemData: any) => Promise<boolean>;
  deleteItem?: (id: number) => Promise<boolean>;
  fetchTree?: () => Promise<void>;
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
  ) => Promise<void>;
  documentTypes?: Array<{
    subcode_name: string;
    subcode: string;
  }>;
  statusTypes?: Array<{
    subcode_name: string;
    subcode: string;
  }>;
  assigneeList?: Array<{
    id: number;
    name: string;
    user_code: string;
    avatar?: string;
  }>;
  sharedAttachedFiles: Array<{
    id: string;
    name: string;
    size: string;
    fileDescription: string;
    createdDate: string;
    revision: string;
    no: number;
    file?: File;
    filePath?: string;
  }>;
  setSharedAttachedFiles: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        name: string;
        size: string;
        fileDescription: string;
        createdDate: string;
        revision: string;
        no: number;
        file?: File;
        filePath?: string;
      }>
    >
  >;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
  positionOptions?: Array<{
    code: string;
    name: string;
  }>;
}

function FolderView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  folderData,
  setFolderData,
  updateItem,
  createItem,
  deleteItem: deleteItemDB,
  fetchTree,
  addChangeLog,
  documentTypes,
  statusTypes,
  assigneeList,
  sharedAttachedFiles,
  setSharedAttachedFiles,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true,
  setSnackbar,
  positionOptions = []
}: FolderViewProps) {
  const theme = useTheme();
  const user = useUser(); // 로그인한 사용자 정보
  const [selectedItem, setSelectedItem] = React.useState<FolderItem | null>(null);
  const [isAddingFolder, setIsAddingFolder] = React.useState(false);
  const [isAddingFile, setIsAddingFile] = React.useState(false);
  const [newItemName, setNewItemName] = React.useState('');

  // 전체 파일 개수를 세는 헬퍼 함수
  const getAllFiles = React.useCallback((items: FolderItem[]): FolderItem[] => {
    const files: FolderItem[] = [];

    const traverse = (itemList: FolderItem[]) => {
      itemList.forEach((item) => {
        if (item.type === 'file') {
          files.push(item);
        } else if (item.children) {
          traverse(item.children);
        }
      });
    };

    traverse(items);
    return files;
  }, []);

  // 폴더 추가
  const handleAddFolder = React.useCallback(async () => {
    if (newItemName.trim() && createItem) {
      const folderData = {
        parent_id: selectedItem && selectedItem.type === 'folder' ? Number(selectedItem.id) : null,
        type: 'folder',
        name: newItemName.trim(),
        description: `새로 생성된 폴더: ${newItemName.trim()}`
      };

      try {
        const success = await createItem(folderData);
        if (success) {
          // 변경로그 추가
          const folderName = newItemName.trim();
          const parentName = selectedItem?.name || '루트';
          const description = `"${parentName}" 폴더에 새로운 폴더 "${folderName}"${getJosa(folderName, '이가')} 추가되었습니다.`;
          const team = user?.department || user?.name || '시스템';

          addChangeLog(
            '추가',
            'FOLDER-NEW',
            description,
            team,
            '',
            folderName,
            '폴더명',
            folderName,
            '폴더탭'
          );

          // 토스트 알림
          setSnackbar({
            open: true,
            message: `폴더 "${folderName}"이(가) 성공적으로 추가되었습니다.`,
            severity: 'success'
          });

          // DB에서 전체 트리 다시 로드
          if (fetchTree) {
            await fetchTree();
          }
          setNewItemName('');
          setIsAddingFolder(false);
        } else {
          console.error('폴더 생성에 실패했습니다.');
          setSnackbar({
            open: true,
            message: '폴더 생성에 실패했습니다.',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('폴더 생성 오류:', error);
      }
    }
  }, [newItemName, selectedItem, createItem, fetchTree, user, addChangeLog, setSnackbar]);

  // 파일 추가 (선택된 폴더에 추가)
  const handleAddFile = React.useCallback(async () => {
    if (newItemName.trim() && selectedItem && selectedItem.type === 'folder' && createItem) {
      const randomSize = ['1.2MB', '856KB', '3.4MB', '245KB', '12.1MB'][Math.floor(Math.random() * 5)];

      // 현재 연도 및 생성번호 계산
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const allFiles = getAllFiles(folderData);
      const nextNumber = (allFiles.length + 1).toString().padStart(3, '0');
      const secDocCode = `SEC-DOC-${currentYear}-${nextNumber}`;

      console.log('📝 파일 추가 - 사용자 정보:', user);
      console.log('📝 파일 추가 - 팀:', user ? user.department : '없음');
      console.log('📝 파일 추가 - 담당자:', user ? user.name : '없음');

      const fileData = {
        parent_id: Number(selectedItem.id),
        type: 'file',
        name: newItemName.trim(),
        file_size: randomSize,
        file_extension: 'pdf', // 기본값
        description: '',
        code: secDocCode,
        status: '대기',
        document_type: '',
        team: user ? user.department : '', // 로그인한 사용자의 부서를 팀으로 설정
        assignee: user ? user.name : '' // 로그인한 사용자의 이름을 담당자로 설정
      };

      console.log('📝 파일 추가 - fileData:', fileData);

      try {
        const success = await createItem(fileData);
        if (success) {
          // 변경로그 추가
          const fileName = newItemName.trim();
          const folderName = selectedItem.name;
          const description = `"${folderName}" 폴더에 새로운 파일 "${fileName}"${getJosa(fileName, '이가')} 추가되었습니다.`;
          const team = user?.department || user?.name || '시스템';

          addChangeLog(
            '추가',
            secDocCode,
            description,
            team,
            '',
            fileName,
            '파일명',
            fileName,
            '폴더탭'
          );

          // 토스트 알림
          setSnackbar({
            open: true,
            message: `파일 "${fileName}"이(가) 성공적으로 추가되었습니다.`,
            severity: 'success'
          });

          // DB에서 전체 트리 다시 로드
          if (fetchTree) {
            await fetchTree();
          }
          setNewItemName('');
          setIsAddingFile(false);
        } else {
          setSnackbar({
            open: true,
            message: '파일 생성에 실패했습니다.',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('파일 생성 오류:', error);
        setSnackbar({
          open: true,
          message: '파일 생성 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  }, [newItemName, selectedItem, folderData, getAllFiles, createItem, fetchTree, user, addChangeLog, setSnackbar]);

  // 아이템 삭제
  const handleDeleteItem = React.useCallback(
    async (itemToDelete: FolderItem) => {
      if (deleteItemDB) {
        const confirmDelete = window.confirm(
          `"${itemToDelete.name}" ${itemToDelete.type === 'folder' ? '폴더' : '파일'}을(를) 삭제하시겠습니까?`
        );

        if (!confirmDelete) return;

        try {
          const success = await deleteItemDB(Number(itemToDelete.id));
          if (success) {
            // 변경로그 추가
            const regulationCode = itemToDelete.code || `REG-${itemToDelete.id}`;
            const regulationTitle = itemToDelete.name || '규정제목 없음';
            const itemType = itemToDelete.type === 'folder' ? '폴더' : '파일';
            const josa = getJosa(regulationTitle, '이가');
            const description = `${itemType} "${regulationTitle}"${josa} 삭제되었습니다.`;

            addChangeLog(
              '삭제',
              regulationCode,
              description,
              itemToDelete.team || '미분류',
              itemToDelete.name,
              '',
              itemType,
              regulationTitle,
              '폴더탭'
            );

            // DB에서 전체 트리 다시 로드
            if (fetchTree) {
              await fetchTree();
            }
            if (selectedItem?.id === itemToDelete.id) {
              setSelectedItem(null);
            }

            // 성공 알림
            if (setSnackbar) {
              const itemName = `${itemToDelete.name}${itemToDelete.type === 'folder' ? '(폴더)' : ''}`;
              const josa = getJosa(itemName, '이가');
              setSnackbar({
                open: true,
                message: `${itemName}${josa} 성공적으로 삭제되었습니다.`,
                severity: 'error'
              });
            }
          } else {
            console.error('삭제에 실패했습니다.');

            // 실패 알림
            if (setSnackbar) {
              setSnackbar({
                open: true,
                message: '삭제에 실패했습니다.',
                severity: 'error'
              });
            }
          }
        } catch (error) {
          console.error('삭제 오류:', error);

          // 실패 알림
          if (setSnackbar) {
            setSnackbar({
              open: true,
              message: '삭제 중 오류가 발생했습니다.',
              severity: 'error'
            });
          }
        }
      }
    },
    [selectedItem, deleteItemDB, fetchTree, setSnackbar]
  );

  // 아이템 업데이트 함수
  const handleUpdateItem = React.useCallback(
    async (updatedItem: Partial<FolderItem>) => {
      if (!selectedItem || !updateItem) return;

      // 로컬 상태 업데이트
      setFolderData((prev) => {
        const updateItemInArray = (items: FolderItem[]): FolderItem[] => {
          return items.map((item) => {
            if (item.id === selectedItem.id) {
              const newItem = { ...item, ...updatedItem };
              // setTimeout을 사용하여 렌더링 사이클 이후에 selectedItem 업데이트
              setTimeout(() => {
                setSelectedItem(newItem);
              }, 0);
              return newItem;
            }
            if (item.children) {
              return { ...item, children: updateItemInArray(item.children) };
            }
            return item;
          });
        };

        return updateItemInArray(prev);
      });

      // DB에 저장 (필드명 매핑)
      const dbUpdateData: any = {};

      if (updatedItem.name !== undefined) dbUpdateData.name = updatedItem.name;
      if (updatedItem.description !== undefined) dbUpdateData.description = updatedItem.description;
      if (updatedItem.status !== undefined) dbUpdateData.status = updatedItem.status;
      if (updatedItem.documentType !== undefined) dbUpdateData.document_type = updatedItem.documentType;
      if (updatedItem.team !== undefined) dbUpdateData.team = updatedItem.team;
      if (updatedItem.assignee !== undefined) dbUpdateData.assignee = updatedItem.assignee;
      if (updatedItem.code !== undefined) dbUpdateData.code = updatedItem.code;
      if (updatedItem.revision !== undefined) dbUpdateData.revision = updatedItem.revision;

      try {
        const success = await updateItem(Number(selectedItem.id), dbUpdateData);
        if (!success) {
          console.warn('⚠️ DB 업데이트 실패 - selectedItem:', selectedItem.id, 'dbUpdateData:', dbUpdateData);

          // 실패 알림
          if (setSnackbar) {
            setSnackbar({
              open: true,
              message: '업데이트에 실패했습니다.',
              severity: 'error'
            });
          }
        } else {
          // 변경된 필드 찾기 - 원본 데이터와 비교
          const changedFields: string[] = [];
          const fieldMap: { [key: string]: string } = {
            name: '제목',
            description: '설명',
            status: '상태',
            documentType: '보안문서유형',
            team: '팀',
            assignee: '담당자',
            revision: '리비전'
          };

          Object.keys(updatedItem).forEach((key) => {
            if (fieldMap[key]) {
              const oldValue = (selectedItem as any)[key];
              const newValue = (updatedItem as any)[key];

              // 실제로 값이 변경된 경우만 추가
              if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
                changedFields.push(fieldMap[key]);
              }
            }
          });

          // 성공 알림
          let message = '';
          if (changedFields.length > 0) {
            const fieldsText = changedFields.join(', ');
            const lastField = changedFields[changedFields.length - 1];
            const josa = getJosa(lastField, '이가');
            message = `${selectedItem.name}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
          } else {
            const josa = getJosa(selectedItem.name, '이가');
            message = `${selectedItem.name}${josa} 성공적으로 수정되었습니다.`;
          }
          if (setSnackbar) {
            setSnackbar({
              open: true,
              message: message,
              severity: 'success'
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ DB 업데이트 오류:', error);

        // 실패 알림
        if (setSnackbar) {
          setSnackbar({
            open: true,
            message: '업데이트 중 오류가 발생했습니다.',
            severity: 'error'
          });
        }
      }
    },
    [selectedItem, updateItem, setSnackbar]
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* 메인 컨텐츠 - 2단 레이아웃 */}
      <Box sx={{ display: 'flex', gap: 2, height: '100%', flexGrow: 1 }}>
        {/* 왼쪽 폴더 트리 */}
        <Paper
          variant="outlined"
          sx={{
            width: '40%',
            p: 2,
            overflow: 'auto',
            bgcolor: 'background.default'
          }}
          onClick={(e) => {
            // Paper 자체를 클릭했을 때만 선택 해제 (하위 요소가 아닌 경우)
            if (e.target === e.currentTarget) {
              setSelectedItem(null);
            }
          }}
        >
          {/* 폴더 구조 헤더와 버튼들 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              폴더 구조
            </Typography>

            {/* 추가 버튼들 */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FolderAdd size={16} />}
                onClick={() => setIsAddingFolder(true)}
                disabled={!canCreateData}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1,
                  '&.Mui-disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                폴더추가
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add size={16} />}
                onClick={() => setIsAddingFile(true)}
                disabled={!canCreateData || !selectedItem || selectedItem.type !== 'folder'}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1,
                  '&.Mui-disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                파일추가
              </Button>
            </Box>
          </Box>

          <FolderTree data={folderData} selectedItem={selectedItem} onSelectItem={setSelectedItem} onDeleteItem={handleDeleteItem} />

          {/* 빈 공간 클릭으로 선택 해제 */}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: '100px',
              cursor: 'default'
            }}
            onClick={() => setSelectedItem(null)}
          />
        </Paper>

        {/* 오른쪽 개요창 */}
        <Box sx={{ width: '60%' }}>
          <OverviewPanel
            selectedItem={selectedItem}
            onUpdateItem={(updatedItem: Partial<FolderItem>) => {
              // 폴더뷰 OverviewPanel에서는 로컬 state만 업데이트 (DB 저장은 OverviewPanel 내부 저장 버튼에서 처리)
              if (!selectedItem) return;

              setFolderData((prev) => {
                const updateItemInArray = (items: FolderItem[]): FolderItem[] => {
                  return items.map((item) => {
                    if (item.id === selectedItem.id) {
                      const newItem = { ...item, ...updatedItem };
                      setTimeout(() => {
                        setSelectedItem(newItem);
                      }, 0);
                      return newItem;
                    }
                    if (item.children) {
                      return { ...item, children: updateItemInArray(item.children) };
                    }
                    return item;
                  });
                };
                return updateItemInArray(prev);
              });
            }}
            updateItem={updateItem}
            addChangeLog={addChangeLog}
            documentTypes={documentTypes}
            statusTypes={statusTypes}
            assigneeList={assigneeList}
            attachedFiles={sharedAttachedFiles}
            setAttachedFiles={setSharedAttachedFiles}
            canCreateData={canCreateData}
            canEditOwn={canEditOwn}
            canEditOthers={canEditOthers}
            setSnackbar={setSnackbar}
            positionOptions={positionOptions}
          />
        </Box>
      </Box>

      {/* 폴더 추가 다이얼로그 */}
      <Dialog open={isAddingFolder} onClose={() => setIsAddingFolder(false)}>
        <DialogTitle>
          {selectedItem && selectedItem.type === 'folder' ? `"${selectedItem.name}" 폴더에 새 폴더 추가` : '새 폴더 추가'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="폴더 이름"
            fullWidth
            variant="outlined"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddFolder();
              }
            }}
            InputLabelProps={{
              shrink: true,
              sx: { fontSize: '0.875rem' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingFolder(false)}>취소</Button>
          <Button onClick={handleAddFolder} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 파일 추가 다이얼로그 */}
      <Dialog open={isAddingFile} onClose={() => setIsAddingFile(false)}>
        <DialogTitle>새 파일 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="파일 이름"
            fullWidth
            variant="outlined"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddFile();
              }
            }}
            InputLabelProps={{
              shrink: true,
              sx: { fontSize: '0.875rem' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingFile(false)}>취소</Button>
          <Button onClick={handleAddFile} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ==============================|| 보안규정관리 메인 페이지 ||============================== //

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`regulation-tabpanel-${index}`}
      aria-labelledby={`regulation-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && <Box sx={{ pt: 0.5, height: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `regulation-tab-${index}`,
    'aria-controls': `regulation-tabpanel-${index}`
  };
}

// 칸반 뷰 컴포넌트
interface KanbanViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  tasks: RegulationTableData[];
  setTasks: React.Dispatch<React.SetStateAction<RegulationTableData[]>>;
  addChangeLog: (action: string, target: string, description: string, team?: string) => void;
  onCardClick?: (task: RegulationTableData) => void;
  folderData: FolderItem[];
  setFolderData: React.Dispatch<React.SetStateAction<FolderItem[]>>;
  onFileCardClick?: (file: FolderItem) => void;
  getAllFilesFromFolders: (folders: FolderItem[]) => FolderItem[];
  assigneeList: Array<{
    id: string;
    name: string;
    user_code: string;
    avatar: string;
  }>;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
  updateItem?: (id: number, data: any) => Promise<boolean>;
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}

function KanbanView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  tasks,
  setTasks,
  addChangeLog,
  onCardClick,
  folderData,
  setFolderData,
  onFileCardClick,
  getAllFilesFromFolders,
  assigneeList,
  canEditOwn = true,
  canEditOthers = true,
  updateItem,
  setSnackbar
}: KanbanViewProps) {
  const theme = useTheme();

  // 상태 관리
  const [activeTask, setActiveTask] = useState<RegulationTableData | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // getAllFilesFromFolders는 props로 전달받음

  // 폴더 파일 데이터를 칸반 카드 데이터로 변환
  const fileItems = React.useMemo(() => {
    return getAllFilesFromFolders(folderData);
  }, [folderData, getAllFilesFromFolders]);

  // 상태 매핑 함수 (폴더 상태 -> 칸반 상태)
  const mapFolderStatusToKanban = React.useCallback((folderStatus: string | undefined): '대기' | '진행' | '완료' | '홀딩' => {
    switch (folderStatus) {
      case '완료':
        return '완료';
      case '홀딩':
        return '홀딩';
      case '진행':
        return '진행';
      case '대기':
      default:
        return '대기';
    }
  }, []);

  // 칸반 상태를 폴더 상태로 매핑하는 함수
  const mapKanbanStatusToFolder = React.useCallback((kanbanStatus: '대기' | '진행' | '완료' | '홀딩'): string => {
    switch (kanbanStatus) {
      case '완료':
        return '완료';
      case '홀딩':
        return '홀딩';
      case '진행':
        return '진행';
      case '대기':
      default:
        return '대기';
    }
  }, []);

  // 파일을 칸반 카드용 데이터로 변환
  const convertFileToKanbanData = React.useCallback(
    (file: FolderItem): RegulationTableData => {
      return {
        id: parseInt(file.id.replace(/\D/g, '')) || Math.random() * 1000,
        no: parseInt(file.id.replace(/\D/g, '')) || 1,
        registrationDate: file.createdDate || '2024-01-01',
        code: file.code || `REG-${file.id}`,
        team: file.team || '', // FolderItem의 team 필드 사용
        department: 'IT' as const,
        workContent: file.name || '문서명',
        type: file.documentType || '정책서',
        status: mapFolderStatusToKanban(file.status),
        assignee: file.assignee || '담당자',
        startDate: file.createdDate || '2024-01-01',
        completedDate: file.modifiedDate || '',
        attachments: [],
        lastRevision: 'v1.0',
        revisionModifiedDate: file.modifiedDate || file.createdDate || '2024-01-01'
      };
    },
    [mapFolderStatusToKanban]
  );

  // 폴더 파일들을 칸반 데이터로 변환
  const kanbanDataFromFiles = React.useMemo(() => {
    return fileItems.map(convertFileToKanbanData);
  }, [fileItems, convertFileToKanbanData]);

  // 데이터 필터링 (폴더 파일 데이터 사용)
  const filteredData = kanbanDataFromFiles.filter((task) => {
    // 연도 필터
    if (selectedYear !== '전체') {
      const taskYear = new Date(task.registrationDate).getFullYear().toString();
      if (taskYear !== selectedYear) return false;
    }

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTask = filteredData.find((task) => task.id.toString() === active.id.toString());
    setActiveTask(draggedTask || null);
    setIsDraggingState(true);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDraggingState(false);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id as string;

    // 유효한 상태인지 확인
    if (!['대기', '진행', '완료', '홀딩'].includes(newStatus)) {
      return;
    }

    // 상태가 변경된 경우만 업데이트
    const currentTask = filteredData.find((task) => task.id.toString() === taskId.toString());
    if (currentTask && currentTask.status !== newStatus) {
      const oldStatus = currentTask.status;

      // 해당하는 폴더 파일 찾기
      const correspondingFile = fileItems.find(
        (file) => file.name === currentTask.workContent || file.code === currentTask.code || file.id === taskId.toString()
      );

      if (correspondingFile) {
        // 칸반 상태를 폴더 상태로 변환하여 업데이트
        const folderStatus = mapKanbanStatusToFolder(newStatus as '대기' | '진행' | '완료' | '홀딩');

        // 로컬 상태 업데이트
        setFolderData((prev) => {
          const updateItemInArray = (items: FolderItem[]): FolderItem[] => {
            return items.map((item) => {
              if (item.id === correspondingFile.id) {
                return { ...item, status: folderStatus };
              }
              if (item.children) {
                return { ...item, children: updateItemInArray(item.children) };
              }
              return item;
            });
          };
          return updateItemInArray(prev);
        });

        // DB에 저장
        if (updateItem) {
          try {
            console.log('🔄 칸반 드래그: 상태 변경 DB 저장 시작', {
              fileId: correspondingFile.id,
              oldStatus,
              newStatus: folderStatus
            });

            const success = await updateItem(Number(correspondingFile.id), {
              status: folderStatus
            });

            if (success) {
              console.log('✅ 칸반 드래그: 상태 변경 DB 저장 성공');

              // 변경로그 기록
              const regulationCode = currentTask.code || `REG-${taskId}`;
              const regulationTitle = currentTask.workContent || '규정제목 없음';
              const description = `보안규정관리 ${regulationTitle}(${regulationCode}) 폴더탭의 상태가 ${oldStatus} → ${newStatus} 수정 되었습니다.`;

              addChangeLog(
                '수정',
                regulationCode,
                description,
                currentTask.team || '미분류',
                oldStatus,
                newStatus,
                '상태',
                regulationTitle,
                '폴더탭'
              );

              // 성공 알림
              if (setSnackbar) {
                setSnackbar({
                  open: true,
                  message: `상태가 "${oldStatus}"에서 "${newStatus}"로 변경되었습니다.`,
                  severity: 'success'
                });
              }
            } else {
              console.error('🔴 칸반 드래그: 상태 변경 DB 저장 실패');

              // 실패 시 로컬 상태 되돌림
              setFolderData((prev) => {
                const revertItemInArray = (items: FolderItem[]): FolderItem[] => {
                  return items.map((item) => {
                    if (item.id === correspondingFile.id) {
                      const originalStatus = mapKanbanStatusToFolder(oldStatus as '대기' | '진행' | '완료' | '홀딩');
                      return { ...item, status: originalStatus };
                    }
                    if (item.children) {
                      return { ...item, children: revertItemInArray(item.children) };
                    }
                    return item;
                  });
                };
                return revertItemInArray(prev);
              });

              // 실패 알림
              if (setSnackbar) {
                setSnackbar({
                  open: true,
                  message: '상태 변경 저장에 실패했습니다.',
                  severity: 'error'
                });
              }
              return;
            }
          } catch (error) {
            console.error('🔴 칸반 드래그: 상태 변경 DB 저장 오류:', error);

            // 실패 시 로컬 상태 되돌림
            setFolderData((prev) => {
              const revertItemInArray = (items: FolderItem[]): FolderItem[] => {
                return items.map((item) => {
                  if (item.id === correspondingFile.id) {
                    const originalStatus = mapKanbanStatusToFolder(oldStatus as '대기' | '진행' | '완료' | '홀딩');
                    return { ...item, status: originalStatus };
                  }
                  if (item.children) {
                    return { ...item, children: revertItemInArray(item.children) };
                  }
                  return item;
                });
              };
              return revertItemInArray(prev);
            });

            // 실패 알림
            if (setSnackbar) {
              setSnackbar({
                open: true,
                message: '상태 변경 저장에 실패했습니다.',
                severity: 'error'
              });
            }
            return;
          }
        }
      }

      // 변경로그는 handleDragEnd에서 처리하므로 여기서는 추가하지 않음 (중복 방지)
    }
  };

  // 상태별 컬럼 정의
  const statusColumns = [
    { key: '대기', title: '대기', pillColor: '#F0F0F0', textColor: '#424242' },
    { key: '진행', title: '진행', pillColor: '#E3F2FD', textColor: '#1976D2' },
    { key: '완료', title: '완료', pillColor: '#E8F5E8', textColor: '#388E3C' },
    { key: '홀딩', title: '홀딩', pillColor: '#FFEBEE', textColor: '#D32F2F' }
  ];

  // 상태별 아이템 가져오기
  const getItemsByStatus = (status: string) => {
    return filteredData.filter((item) => item.status === status);
  };

  // 팀별 색상 매핑 (데이터 테이블과 동일)
  const getTeamColor = (team: string) => {
    return { color: '#333333' };
  };

  // 담당자별 배경색 매핑
  const getAssigneeStyle = (assignee: string) => {
    const colorMap: Record<string, string> = {
      김철수: '#D8DCFF',
      이영희: '#D8CBF4',
      박민수: '#F8E7B5',
      최지연: '#FAD0D0',
      정현우: '#D8DCFF',
      강민정: '#D8CBF4',
      윤성호: '#F8E7B5',
      박영희: '#FAD0D0',
      김민수: '#D8DCFF',
      최윤정: '#D8CBF4',
      이민수: '#F8E7B5',
      송민호: '#FAD0D0',
      정상현: '#D8DCFF',
      박지민: '#D8CBF4',
      노수진: '#F8E7B5',
      최영수: '#FAD0D0',
      김혜진: '#D8DCFF',
      이재훈: '#D8CBF4',
      이준호: '#F8E7B5',
      김태호: '#FAD0D0',
      한지민: '#D8DCFF',
      박서영: '#D8CBF4'
    };
    return colorMap[assignee] || '#E0E0E0';
  };

  // 드래그 가능한 카드 컴포넌트
  function DraggableCard({ task }: { task: RegulationTableData }) {
    const isDragDisabled = !(canEditOwn || canEditOthers);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id,
      disabled: isDragDisabled
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : (isDragDisabled ? 'default' : 'grab')
        }
      : { cursor: isDragDisabled ? 'default' : 'grab' };

    return (
      <article
        ref={setNodeRef}
        style={style}
        {...(isDragDisabled ? {} : listeners)}
        {...attributes}
        className="kanban-card"
        onClick={(e) => {
          // 드래그가 아닌 경우에만 클릭 이벤트 처리
          if (!isDraggingState && !isDragging) {
            e.stopPropagation();

            // 해당하는 폴더 파일 찾기
            const correspondingFile = fileItems.find(
              (file) => file.name === task.workContent || file.code === task.code || file.id === task.id.toString()
            );

            if (correspondingFile && onFileCardClick) {
              onFileCardClick(correspondingFile);
            } else if (onCardClick) {
              onCardClick(task);
            }
          }
        }}
      >
        {/* 상태 태그 */}
        <div className="status-tags">
          <span className={`status-tag status-${task.status?.toLowerCase() || 'waiting'}`}>{task.status || '대기'}</span>
          <span className="document-type-tag">{task.type || '정책서'}</span>
        </div>

        {/* 카드 제목 */}
        <h3 className="card-title">{task.workContent || '문서 제목'}</h3>

        {/* 카드 정보 */}
        <div className="card-info">
          <div className="info-line">
            <span className="info-label">코드:</span>
            <span className="info-value">{task.code || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">등록일:</span>
            <span className="info-value">{task.registrationDate || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">최종리비전:</span>
            <span className="info-value">{task.lastRevision || '-'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">리비전수정일:</span>
            <span className="info-value">{task.revisionModifiedDate || '-'}</span>
          </div>
        </div>

        {/* 하단 - 담당자와 통계 */}
        <div className="card-footer">
          <div className="assignee-info">
            <img
              className="assignee-avatar"
              src={assigneeList.find((user) => user.name === task.assignee)?.avatar || '/assets/images/users/avatar-1.png'}
              alt={task.assignee || '담당자'}
            />
            <span className="assignee-name">{task.assignee || '담당자'}</span>
          </div>
        </div>
      </article>
    );
  }

  // 드롭 가능한 컬럼 컴포넌트
  function DroppableColumn({
    column,
    children
  }: {
    column: { key: string; title: string; pillColor: string; textColor: string };
    children: React.ReactNode;
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id: column.key
    });

    return (
      <section
        ref={setNodeRef}
        className="kanban-column"
        style={{
          backgroundColor: isOver ? '#f5f5f5' : 'transparent'
        }}
      >
        <header className="column-header">
          <span
            className="pill"
            style={{
              background: column.pillColor,
              color: column.textColor
            }}
          >
            {column.title}
          </span>
          <span className="count">{getItemsByStatus(column.key).length}</span>
        </header>
        {children}
      </section>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        fontFamily: '"Inter", "Noto Sans KR", sans-serif'
      }}
    >
      <style>{`
        .kanban-board {
          display: flex;
          gap: 32px;
          padding: 24px 24px 0 24px;
          overflow-x: auto;
          height: 100%;
        }
        
        .kanban-board::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .kanban-board::-webkit-scrollbar-track {
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        
        .kanban-board::-webkit-scrollbar-thumb {
          background-color: #e9ecef;
          border-radius: 4px;
          border: 2px solid #f8f9fa;
        }
        
        .kanban-board::-webkit-scrollbar-thumb:hover {
          background-color: #dee2e6;
        }
        
        .kanban-board::-webkit-scrollbar-corner {
          background-color: #f8f9fa;
        }
        
        .kanban-column {
          width: 340px;
          display: flex;
          flex-direction: column;
          row-gap: 20px;
          flex-shrink: 0;
        }
        
        .column-header {
          display: flex;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #E4E6EB;
          margin-bottom: 8px;
        }
        
        .pill {
          padding: 6px 20px;
          border-radius: 9999px;
          font: 500 13px/0.5 "Inter", "Noto Sans KR", sans-serif;
        }
        
        .count {
          font: 400 12px/1 "Inter", "Noto Sans KR", sans-serif;
          margin-left: 8px;
          color: #606060;
        }
        
        .kanban-card {
          background: #fff;
          border: 1px solid #E4E6EB;
          border-radius: 10px;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
          display: flex;
          flex-direction: column;
          row-gap: 12px;
          transition: all 0.2s ease;
        }
        
        .kanban-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,.1);
          transform: translateY(-1px);
        }
        
        .status-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .status-tag {
          padding: 4px 12px;
          border-radius: 20px;
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
        }
        
        .status-대기 {
          background: rgba(251, 191, 36, 0.15);
          color: #f59e0b;
        }
        
        .status-진행 {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        
        .status-완료 {
          background: rgba(34, 197, 94, 0.15);
          color: #16a34a;
        }

        .status-홀딩 {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }
        
        .document-type-tag {
          padding: 2px 8px;
          border-radius: 12px;
          background: #f3f4f6;
          color: #6b7280;
          font: 400 11px/1.2 "Inter", "Noto Sans KR", sans-serif;
          border: 1px solid #e5e7eb;
        }

        .card-title {
          font: 600 16px/1.3 "Inter", "Noto Sans KR", sans-serif;
          color: #1f2937;
          margin: 0 0 3px 0;
        }
        
        .card-info {
          margin: 0 0 7px 0;
        }
        
        .info-line {
          display: flex;
          align-items: center;
          margin: 0 0 8px 0;
        }
        
        .info-label {
          font: 500 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
          color: #4b5563;
          margin-right: 6px;
          flex-shrink: 0;
        }
        
        .info-value {
          font: 400 12px/1.2 "Inter", "Noto Sans KR", sans-serif;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .progress-section {
          margin-bottom: 16px;
        }
        
        .progress-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .progress-text {
          font: 600 12px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #374151;
        }
        
        .progress-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .progress-percentage {
          font: 500 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #3b82f6;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .assignee-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .assignee-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #e5e7eb;
        }
        
        .assignee-name {
          font-size: 12px;
          color: #4b5563;
          font-weight: 500;
        }
        
        .card-stats {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .stat-item.clickable {
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .stat-item.clickable:hover {
          transform: scale(1.1);
        }
        
        .stat-icon {
          font-size: 13px;
          color: #9ca3af;
          opacity: 1;
          font-weight: 300;
        }
        
        .stat-icon.liked {
          color: #ef4444;
        }
        
        .stat-number {
          font: 400 11px/1 "Inter", "Noto Sans KR", sans-serif;
          color: #9ca3af;
        }
        
        @media (max-width: 768px) {
          .kanban-column {
            width: 220px;
          }
        }
      `}</style>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {statusColumns.map((column) => {
            const items = getItemsByStatus(column.key);
            return (
              <DroppableColumn key={column.key} column={column}>
                {items.map((item) => (
                  <DraggableCard key={item.id} task={item} />
                ))}

                {/* 빈 칼럼 메시지 */}
                {items.length === 0 && (
                  <Box
                    sx={{
                      padding: 3,
                      textAlign: 'center',
                      color: 'text.secondary'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      이 상태에 항목이 없습니다
                    </Typography>
                  </Box>
                )}
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>
    </Box>
  );
}

// 월간일정 뷰 컴포넌트
interface MonthlyScheduleViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  tasks: RegulationTableData[];
  folderData: FolderItem[];
  onCardClick: (task: RegulationTableData) => void;
  onFolderFileClick: (file: FolderItem) => void;
}

function MonthlyScheduleView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  tasks,
  folderData,
  onCardClick,
  onFolderFileClick
}: MonthlyScheduleViewProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  // 폴더 파일 데이터를 월간일정 형식으로 변환
  const folderFiles: any[] = [];
  const extractFiles = (items: FolderItem[]) => {
    items.forEach((item) => {
      if (item.type === 'file' && item.createdDate && item.status && item.assignee) {
        folderFiles.push({
          id: item.id,
          no: parseInt(item.id.replace(/\D/g, '')) || 1,
          registrationDate: item.createdDate,
          code: item.code || `CODE-${item.id}`,
          incidentType: item.documentType || '보안규정',
          requestContent: item.name,
          mainContent: item.description || item.name,
          workContent: item.name,
          severity: '중간',
          status: item.status,
          responseStage: item.status === '완료' ? '완료' : item.status === '진행' ? '진행 중' : '대기',
          assignee: item.assignee,
          team: '보안팀',
          occurrenceDate: item.createdDate,
          completedDate: item.status === '완료' ? item.modifiedDate : undefined,
          startDate: item.createdDate,
          progress: item.status === '완료' ? 100 : item.status === '진행' ? 50 : 0,
          attachment: item.materials && item.materials.length > 0,
          attachmentCount: item.materials?.length || 0,
          attachments: item.materials || [],
          likes: 0,
          likedBy: [],
          views: 0,
          viewedBy: [],
          comments: [],
          isFromFolder: true // 폴더에서 온 데이터임을 표시
        });
      }
      if (item.children) {
        extractFiles(item.children);
      }
    });
  };
  extractFiles(folderData);

  // 디버깅용 로그
  console.log('📁 Folder Data:', folderData);
  console.log('📄 Extracted Folder Files:', folderFiles);
  console.log('📋 Tasks:', tasks);

  // 기존 tasks와 폴더 파일 데이터 결합
  const combinedData = [...tasks, ...folderFiles];

  // 데이터 필터링
  const filteredData = combinedData.filter((task) => {
    // 연도 필터 (메인 필터가 전체가 아니면 메인 필터 우선, 아니면 뷰 필터 사용)
    const useYear = selectedYear !== '전체' ? selectedYear : viewYear;
    const taskYear = new Date(task.registrationDate).getFullYear().toString();

    // 디버깅 로그
    if (task.isFromFolder) {
      console.log(
        `🔍 Filtering ${task.name}: taskYear=${taskYear}, useYear=${useYear}, selectedYear=${selectedYear}, viewYear=${viewYear}`
      );
    }

    if (taskYear !== useYear) return false;

    // 팀 필터
    if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;

    // 담당자 필터
    if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;

    // 상태 필터
    if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;

    return true;
  });

  // 월별로 데이터 그룹화 (등록일 기준)
  const monthlyData: { [key: number]: any[] } = {};
  filteredData.forEach((item) => {
    const date = new Date(item.registrationDate);
    const month = date.getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(item);

    // 디버깅 로그
    if (item.isFromFolder) {
      console.log(`📅 Grouped ${item.name} to month ${month + 1} (${date.toLocaleDateString()})`);
    }
  });

  console.log('📊 Monthly Data:', monthlyData);
  console.log('📈 Filtered Data Count:', filteredData.length);

  // 월 이름 배열
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#E0E0E0';
      case '진행':
        return '#e3f2fd';
      case '완료':
        return '#e8f5e8';
      case '홀딩':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#424242';
      case '진행':
        return '#1976D2';
      case '완료':
        return '#388E3C';
      case '홀딩':
        return '#D32F2F';
      default:
        return '#424242';
    }
  };

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        // 스크롤바 스타일
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          border: '2px solid #f8f9fa'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#dee2e6'
        },
        '&::-webkit-scrollbar-corner': {
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      {/* 월간 일정 테이블 - 2행 6열 */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* 상반기 (1-6월) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            borderBottom: '2px solid',
            borderColor: 'divider'
          }}
        >
          {/* 월 헤더 - 상반기 */}
          {monthNames.slice(0, 6).map((month, index) => (
            <Box
              key={`month-header-first-${index}`}
              sx={{
                py: 1.5,
                px: 1,
                textAlign: 'center',
                borderRight: index < 5 ? '1px solid' : 'none',
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontWeight: 600,
                fontSize: '14px',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.grey[50]
              }}
            >
              {month}
            </Box>
          ))}

          {/* 월 내용 - 상반기 */}
          {monthNames.slice(0, 6).map((_, monthIndex) => {
            const items = monthlyData[monthIndex] || [];
            items.sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

            return (
              <Box
                key={`month-content-first-${monthIndex}`}
                sx={{
                  borderRight: monthIndex < 5 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  p: 1.5,
                  backgroundColor: '#fff',
                  minHeight: '254px',
                  maxHeight: '254px',
                  overflowY: 'auto',
                  verticalAlign: 'top',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {items.map((item, itemIndex) => {
                  const date = new Date(item.registrationDate);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');

                  return (
                    <Box
                      key={`month-${monthIndex}-item-${item.id}`}
                      onClick={() => {
                        if (item.isFromFolder) {
                          // 폴더 파일인 경우, 폴더 데이터에서 원본 파일 찾아서 처리
                          const findFile = (items: FolderItem[]): FolderItem | null => {
                            for (const folderItem of items) {
                              if (folderItem.id === item.id) return folderItem;
                              if (folderItem.children) {
                                const found = findFile(folderItem.children);
                                if (found) return found;
                              }
                            }
                            return null;
                          };
                          const originalFile = findFile(folderData);
                          if (originalFile) {
                            onFolderFileClick(originalFile);
                          }
                        } else {
                          onCardClick(item);
                        }
                      }}
                      sx={{
                        mb: itemIndex < items.length - 1 ? 0.8 : 0,
                        p: 0.6,
                        borderRadius: 1,
                        backgroundColor: getStatusColor(item.status),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '13px',
                          color: getStatusTextColor(item.status),
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <span>{`${month}-${day}`}</span>
                        <span>{item.status}</span>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '13px',
                          color: theme.palette.text.secondary,
                          mt: 0.15,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={item.workContent || '업무내용 없음'}
                      >
                        {item.isFromFolder ? item.requestContent : item.workContent || '업무내용 없음'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>

        {/* 하반기 (7-12월) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)'
          }}
        >
          {/* 월 헤더 - 하반기 */}
          {monthNames.slice(6, 12).map((month, index) => (
            <Box
              key={`month-header-second-${index}`}
              sx={{
                py: 1.5,
                px: 1,
                textAlign: 'center',
                borderRight: index < 5 ? '1px solid' : 'none',
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontWeight: 600,
                fontSize: '14px',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.grey[50]
              }}
            >
              {month}
            </Box>
          ))}

          {/* 월 내용 - 하반기 */}
          {monthNames.slice(6, 12).map((_, index) => {
            const monthIndex = index + 6;
            const items = monthlyData[monthIndex] || [];
            items.sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

            return (
              <Box
                key={`month-content-second-${index}`}
                sx={{
                  borderRight: index < 5 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  p: 1.5,
                  backgroundColor: '#fff',
                  minHeight: '254px',
                  maxHeight: '254px',
                  overflowY: 'auto',
                  verticalAlign: 'top',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {items.map((item, itemIndex) => {
                  const date = new Date(item.registrationDate);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');

                  return (
                    <Box
                      key={`month-second-${index}-item-${item.id}`}
                      onClick={() => {
                        if (item.isFromFolder) {
                          // 폴더 파일인 경우, 폴더 데이터에서 원본 파일 찾아서 처리
                          const findFile = (items: FolderItem[]): FolderItem | null => {
                            for (const folderItem of items) {
                              if (folderItem.id === item.id) return folderItem;
                              if (folderItem.children) {
                                const found = findFile(folderItem.children);
                                if (found) return found;
                              }
                            }
                            return null;
                          };
                          const originalFile = findFile(folderData);
                          if (originalFile) {
                            onFolderFileClick(originalFile);
                          }
                        } else {
                          onCardClick(item);
                        }
                      }}
                      sx={{
                        mb: itemIndex < items.length - 1 ? 0.8 : 0,
                        p: 0.6,
                        borderRadius: 1,
                        backgroundColor: getStatusColor(item.status),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '13px',
                          color: getStatusTextColor(item.status),
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <span>{`${month}-${day}`}</span>
                        <span>{item.status}</span>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '13px',
                          color: theme.palette.text.secondary,
                          mt: 0.15,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={item.workContent || '업무내용 없음'}
                      >
                        {item.isFromFolder ? item.requestContent : item.workContent || '업무내용 없음'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}

// 변경로그 뷰 컴포넌트
interface ChangeLogViewProps {
  changeLogs: ChangeLog[];
  tasks: RegulationTableData[];
  page: number;
  rowsPerPage: number;
  goToPage: string;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onGoToPageChange: (page: string) => void;
}

function ChangeLogView({
  changeLogs,
  tasks,
  page,
  rowsPerPage,
  goToPage,
  loading = false,
  onPageChange,
  onRowsPerPageChange,
  onGoToPageChange
}: ChangeLogViewProps) {
  const theme = useTheme();

  // 팀 색상 설정 함수
  const getTeamColor = (team: string) => {
    return 'transparent';
  };

  // 페이지별로 데이터 슬라이스
  const startIndex = page * rowsPerPage;
  const paginatedLogs = changeLogs.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(changeLogs.length / rowsPerPage);

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber - 1);
    }
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    onPageChange(newPage - 1);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            border: '2px solid #f8f9fa'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#dee2e6'
          },
          '&::-webkit-scrollbar-corner': {
            backgroundColor: '#f8f9fa'
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600, width: 50, fontSize: '12px' }}>NO</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120, fontSize: '12px' }}>변경시간</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140, fontSize: '12px' }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140, fontSize: '12px' }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경분류</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70, fontSize: '12px' }}>변경위치</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경필드</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경전</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, fontSize: '12px' }}>변경후</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 400, fontSize: '12px' }}>변경세부내용</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>팀</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90, fontSize: '12px' }}>변경자</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    변경로그를 불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    변경로그가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log, index) => (
              <TableRow
                key={log.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {changeLogs.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.dateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.target}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.action}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.location}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.changedField || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 100
                    }}
                    title={log.beforeValue || '-'}
                  >
                    {log.beforeValue || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 100
                    }}
                    title={log.afterValue || '-'}
                  >
                    {log.afterValue || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'normal',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                    title={log.description}
                  >
                    {log.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.team}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '12px',
                      backgroundColor: getTeamColor(log.team),
                      color: '#333333'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {log.user}
                  </Typography>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.5,
          px: 1,
          py: 0.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        {/* 왼쪽: Row per page */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Row per page
          </Typography>
          <FormControl size="small" sx={{ minWidth: 60 }}>
            <Select
              value={rowsPerPage}
              onChange={(e) => {
                onRowsPerPageChange(Number(e.target.value));
                onPageChange(0);
              }}
              sx={{
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 1,
                  fontSize: '0.875rem'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #e0e0e0'
                }
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>

          {/* Go to */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Go to
            </Typography>
            <TextField
              size="small"
              value={goToPage}
              onChange={(e) => onGoToPageChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGoToPage();
                }
              }}
              placeholder="1"
              sx={{
                width: 60,
                '& .MuiOutlinedInput-root': {
                  '& input': {
                    py: 0.5,
                    px: 1,
                    textAlign: 'center',
                    fontSize: '0.875rem'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e0e0e0'
                  }
                }
              }}
            />
          </Box>
        </Box>

        {/* 오른쪽: 페이지 네비게이션 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {changeLogs.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, changeLogs.length)} of ${changeLogs.length}`
              : '0-0 of 0'}
          </Typography>
          {totalPages > 0 && (
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handleChangePage}
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
    </Box>
  );
}

// 대시보드 뷰 컴포넌트
interface DashboardViewProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  selectedRecentStatus: string;
  setSelectedRecentStatus: (status: string) => void;
  tasks: RegulationTableData[];
  folderData?: FolderItem[]; // 폴더 데이터 추가
  getAllFilesFromFolders: (folders: FolderItem[]) => FolderItem[];
}

function DashboardView({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  selectedRecentStatus,
  setSelectedRecentStatus,
  tasks,
  folderData,
  getAllFilesFromFolders
}: DashboardViewProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // getAllFilesFromFolders는 props로 전달받음

  // 폴더의 파일들을 사용 (folderData가 있으면 우선 사용)
  const fileItems = React.useMemo(() => {
    if (folderData) {
      return getAllFilesFromFolders(folderData);
    }
    return [];
  }, [folderData, getAllFilesFromFolders]);

  // 날짜 범위 필터링 함수
  const filterByDateRange = (data: RegulationTableData[]) => {
    if (!startDate && !endDate) {
      return data;
    }

    return data.filter((task) => {
      const taskDate = new Date(task.startDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return taskDate >= start && taskDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return taskDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return taskDate <= end;
      }

      return true;
    });
  };

  // 파일 데이터 날짜 범위 필터링 함수
  const filterFilesByDateRange = (files: FolderItem[]) => {
    if (!startDate && !endDate) {
      return files;
    }

    return files.filter((file) => {
      if (!file.createdDate) return false;
      const fileDate = new Date(file.createdDate);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return fileDate >= start && fileDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        return fileDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        return fileDate <= end;
      }

      return true;
    });
  };

  // 파일 데이터 필터링
  const filteredFiles = filterFilesByDateRange(fileItems).filter((file) => {
    // 연도 필터
    if (selectedYear !== '전체' && file.createdDate) {
      const fileYear = new Date(file.createdDate).getFullYear().toString();
      if (fileYear !== selectedYear) return false;
    }

    if (selectedAssignee !== '전체' && file.assignee !== selectedAssignee) return false;
    if (selectedStatus !== '전체' && file.status !== selectedStatus) return false;
    return true;
  });

  // 데이터 필터링 (기존 tasks - folderData가 없을 때 사용)
  const filteredData = folderData
    ? []
    : filterByDateRange(tasks).filter((task) => {
        // 연도 필터
        if (selectedYear !== '전체') {
          const taskYear = new Date(task.startDate).getFullYear().toString();
          if (taskYear !== selectedYear) return false;
        }

        if (selectedTeam !== '전체' && task.team !== selectedTeam) return false;
        if (selectedAssignee !== '전체' && task.assignee !== selectedAssignee) return false;
        if (selectedStatus !== '전체' && task.status !== selectedStatus) return false;
        return true;
      });

  // 통계 계산 (파일 데이터 우선, 없으면 기존 tasks 사용)
  const dataForStats = folderData ? filteredFiles : filteredData;
  const totalCount = dataForStats.length;

  // 상태별 통계 (파일과 tasks 모두 처리)
  const statusStats = dataForStats.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 업무분류별 통계 (원형차트용) - 파일의 경우 documentType 사용
  const categoryStats = dataForStats.reduce(
    (acc, item: any) => {
      const category = folderData
        ? item.documentType || '기타' // 파일 데이터는 documentType 사용
        : item.department || '기타'; // tasks는 department 사용
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 담당자별 통계 (원형차트용)
  const assigneeStats = dataForStats.reduce(
    (acc, item: any) => {
      const assignee = item.assignee || '미할당';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 디버깅을 위한 로그 - 제거
  // console.log('Dashboard Debug:', {
  //   filteredData: filteredData.length,
  //   categoryStats,
  //   assigneeStats,
  //   categoryLabels: Object.keys(categoryStats),
  //   categoryValues: Object.values(categoryStats)
  // });

  // 월별 통계 (막대차트용) - 완료 상태 추가
  const monthlyStats: { month: string; 대기: number; 진행: number; 완료: number; 홀딩: number }[] = [];
  const monthData: Record<string, Record<string, number>> = {};

  // 파일 데이터와 tasks 데이터를 통합 처리
  dataForStats.forEach((item: any) => {
    const dateField = folderData ? item.createdDate : item.startDate;
    if (!dateField) return;

    const date = new Date(dateField);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthData[monthKey]) {
      monthData[monthKey] = { 대기: 0, 진행: 0, 완료: 0, 홀딩: 0 };
    }

    // 상태를 그대로 사용
    const status = item.status;
    monthData[monthKey][status] = (monthData[monthKey][status] || 0) + 1;
  });

  // 정렬된 월별 데이터 생성
  Object.keys(monthData)
    .sort()
    .forEach((month) => {
      const [year, monthNum] = month.split('-');
      const yearShort = year.slice(-2); // 연도를 마지막 2자리로
      monthlyStats.push({
        month: `${yearShort}/${monthNum}`,
        대기: monthData[month]['대기'] || 0,
        진행: monthData[month]['진행'] || 0,
        완료: monthData[month]['완료'] || 0,
        홀딩: monthData[month]['홀딩'] || 0
      });
    });

  // 상태별 색상 (보안사고관리와 동일하게 적용)
  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
        return '#90A4AE';
      case '진행':
        return '#7986CB';
      case '완료':
        return '#81C784';
      case '홀딩':
        return '#E57373';
      default:
        return '#9e9e9e';
    }
  };

  // 라벨과 값 배열 미리 생성
  const categoryLabels = Object.keys(categoryStats);
  const categoryValues = Object.values(categoryStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 업무분류 데이터 확인:', {
    filteredData: filteredData.length,
    categoryStats,
    categoryLabels,
    categoryValues,
    sampleData: filteredData.slice(0, 3).map((item) => ({
      department: item.department,
      team: item.team,
      assignee: item.assignee
    }))
  });

  // 원형차트 옵션 - 새로운 접근방식: 내장 툴팁 포맷터 사용
  const pieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: categoryLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2'],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: any) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '13px',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      custom: function ({ series, seriesIndex, w }: any) {
        // able-pro 표준 스타일 적용
        const capturedLabels = [...categoryLabels];
        const capturedValues = [...categoryValues];

        const value = capturedValues[seriesIndex] || 0;
        const label = capturedLabels[seriesIndex] || '분류';
        const total = capturedValues.reduce((sum: number, val: number) => sum + val, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

        return `<div class="pie_box">
        <span class="PieDot" style='background-color:${w.globals.colors[seriesIndex]}'></span>
        <span class="fontsize">${label}${' '}
        <span class="fontsizeValue">${value}건 (${percentage}%)</span></span></div>`;
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            width: 250,
            offsetX: 0
          },
          legend: {
            position: 'bottom',
            offsetX: 0,
            width: 'auto'
          }
        }
      }
    ]
  };

  const pieChartSeries = categoryValues;

  // 담당자 라벨과 값 배열 미리 생성
  const assigneeLabels = Object.keys(assigneeStats);
  const assigneeValues = Object.values(assigneeStats);

  // 디버깅 - 실제 데이터 확인
  console.log('🔍 업무담당 데이터 확인:', {
    assigneeStats,
    assigneeLabels,
    assigneeValues
  });

  // 담당자 원형차트 옵션 - 새로운 접근방식: 내장 툴팁 포맷터 사용
  const assigneePieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: assigneeLabels,
    colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2', '#A8C5D8', '#6B9BD1'],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: any) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '13px',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      custom: function ({ series, seriesIndex, w }: any) {
        // able-pro 표준 스타일 적용
        const capturedLabels = [...assigneeLabels];
        const capturedValues = [...assigneeValues];

        const value = capturedValues[seriesIndex] || 0;
        const label = capturedLabels[seriesIndex] || '담당자';
        const total = capturedValues.reduce((sum: number, val: number) => sum + val, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

        return `<div class="pie_box">
        <span class="PieDot" style='background-color:${w.globals.colors[seriesIndex]}'></span>
        <span class="fontsize">${label}${' '}
        <span class="fontsizeValue">${value}건 (${percentage}%)</span></span></div>`;
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            width: 250,
            offsetX: 0
          },
          legend: {
            position: 'bottom',
            offsetX: 0,
            width: 'auto'
          }
        }
      }
    ]
  };

  const assigneePieChartSeries = assigneeValues;

  // 막대차트 옵션
  const barChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: monthlyStats.map((item) => item.month)
    },
    yaxis: {
      title: {
        text: '업무 건수'
      }
    },
    colors: ['#90A4AE', '#7986CB', '#81C784', '#E57373'],
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    fill: {
      opacity: 1
    },
    dataLabels: {
      enabled: false
    },
    annotations: {
      points: monthlyStats.map((item, index) => {
        // 각 상태별 실제 값을 합산하여 정확한 총합 계산 (안전한 숫자 변환)
        const 대기 = Number(item.대기) || 0;
        const 진행 = Number(item.진행) || 0;
        const 완료 = Number(item.완료) || 0;
        const 홀딩 = Number(item.홀딩) || 0;
        const total = 대기 + 진행 + 완료 + 홀딩;

        // 디버깅: 각 월의 데이터 확인
        console.log(`${item.month}: 대기=${대기}, 진행=${진행}, 완료=${완료}, 홀딩=${홀딩}, total=${total}`);

        // 6월, 8월 특별 확인
        if (item.month === '06월' || item.month === '08월') {
          console.warn(`⚠️ 문제 월 발견: ${item.month}, total=${total}`, item);
        }

        // total > 0 조건 제거하여 모든 월에 대해 annotation 생성
        return {
          x: item.month,
          y: total, // 막대 최상단에 정확히 위치
          marker: {
            size: 0,
            strokeWidth: 0,
            fillColor: 'transparent'
          },
          label: {
            text: total > 0 ? total.toString() : '',
            offsetY: -5, // 간격 없이 막대 바로 위에 표시
            style: {
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#333',
              background: 'transparent',
              borderWidth: 0,
              padding: 0
            }
          }
        };
      })
    },
    tooltip: {
      marker: {
        show: false
      },
      y: {
        formatter: function (val: any) {
          return val + '건';
        }
      }
    }
  };

  const barChartSeries = [
    {
      name: '대기',
      data: monthlyStats.map((item) => item.대기)
    },
    {
      name: '진행',
      data: monthlyStats.map((item) => item.진행)
    },
    {
      name: '완료',
      data: monthlyStats.map((item) => item.완료)
    },
    {
      name: '홀딩',
      data: monthlyStats.map((item) => item.홀딩)
    }
  ];

  // 페이지네이션 로직 (파일과 tasks 통합)
  const dataForPagination = folderData ? filteredFiles : filteredData;
  const totalPages = Math.ceil(dataForPagination.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = dataForPagination.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // 필터가 변경될 때 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedTeam, selectedStatus, selectedAssignee, startDate, endDate]);

  return (
    <Box
      sx={{
        p: 3,
        height: '100%',
        overflow: 'auto',
        // 스크롤바 스타일
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          border: '2px solid #f8f9fa'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#dee2e6'
        },
        '&::-webkit-scrollbar-corner': {
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      {/* 기간 선택 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          업무 현황 대시보드
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            type="date"
            label="시작일"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          <Typography>~</Typography>
          <TextField
            type="date"
            label="종료일"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            sx={{ whiteSpace: 'nowrap' }}
          >
            초기화
          </Button>
        </Box>
      </Box>

      {/* 상태 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* 총건수 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#48C4B7',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              총건수
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {totalCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              전체 업무 현황
            </Typography>
          </Card>
        </Grid>

        {/* 대기 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#90A4AE',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: '#fff', fontSize: '14px', mb: 1 }}>
              대기
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['대기'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
              대기중인 업무
            </Typography>
          </Card>
        </Grid>

        {/* 진행 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#7986CB',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              진행
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['진행'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              진행중인 업무
            </Typography>
          </Card>
        </Grid>

        {/* 승인 (완료) */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#81C784',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              완료
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['완료'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              완료된 업무
            </Typography>
          </Card>
        </Grid>

        {/* 홀딩 */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              p: 3,
              background: '#E57373',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', mb: 1 }}>
              홀딩
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {statusStats['홀딩'] || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              홀딩된 업무
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 상단 레이아웃: 업무분류 - 업무목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 업무분류 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              // able-pro 표준 툴팁 스타일 + 사용자 지정 색상
              '.pie_box': {
                padding: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              '.PieDot': { width: 12, height: 12, borderRadius: '50%' },
              '.fontsize': { fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.375rem', color: '#000000' },
              '.fontsizeValue': { color: '#000000', fontWeight: 600 }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              업무분류
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 320,
                px: 3
              }}
            >
              {pieChartSeries.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 0.5
                  }}
                >
                  {/* 차트 영역 */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <ReactApexChart options={pieChartOptions} series={pieChartSeries} type="pie" height={250} width={250} />
                  </Box>
                  {/* 커스텀 범례 영역 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: 180,
                      justifyContent: 'center'
                    }}
                  >
                    {Object.keys(categoryStats).map((key, index) => {
                      const count = categoryStats[key];
                      const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                      return (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '2px',
                              backgroundColor: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2'][index]
                            }}
                          />
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {key} - {count}건 ({percentage}%)
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Typography color="text.secondary">데이터가 없습니다</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* 업무 목록 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              업무 목록
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>NO</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>업무내용</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>담당자</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>완료일</TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((item: any, index) => (
                      <TableRow key={item.id || index} hover>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>
                          {dataForPagination.length - (startIndex + index)}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 0.5,
                            fontSize: '13px',
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {folderData ? item.name : item.workContent || '업무내용 없음'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>{item.assignee || '-'}</TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '13px' }}>
                          {folderData ? item.modifiedDate || item.createdDate || '-' : item.completedDate || '-'}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={item.status || '대기'}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(item.status || '대기'),
                              color: 'white',
                              fontSize: '13px',
                              height: 18,
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 빈 행으로 높이 유지 */}
                    {Array.from({ length: Math.max(0, itemsPerPage - paginatedData.length) }).map((_, index) => (
                      <TableRow key={`empty-${index}`} sx={{ height: 33 }}>
                        <TableCell colSpan={5} sx={{ border: 'none' }}></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} size="small" color="primary" />
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 하단 레이아웃: 업무담당 - 월별업무 */}
      <Grid container spacing={3}>
        {/* 업무담당 원형차트 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 2,
              height: 400,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              // able-pro 표준 툴팁 스타일 + 사용자 지정 색상
              '.pie_box': {
                padding: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              '.PieDot': { width: 12, height: 12, borderRadius: '50%' },
              '.fontsize': { fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.375rem', color: '#000000' },
              '.fontsizeValue': { color: '#000000', fontWeight: 600 }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              업무담당
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 320,
                px: 3
              }}
            >
              {assigneePieChartSeries.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    gap: 0.5
                  }}
                >
                  {/* 차트 영역 */}
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <ReactApexChart options={assigneePieChartOptions} series={assigneePieChartSeries} type="pie" height={250} width={250} />
                  </Box>
                  {/* 커스텀 범례 영역 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      minWidth: 180,
                      justifyContent: 'center'
                    }}
                  >
                    {Object.keys(assigneeStats).map((key, index) => {
                      const count = assigneeStats[key];
                      const total = Object.values(assigneeStats).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                      return (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '2px',
                              backgroundColor: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC', '#E0D8D2', '#F2E8E2', '#A8C5D8', '#6B9BD1'][
                                index
                              ]
                            }}
                          />
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {key} - {count}건 ({percentage}%)
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Typography color="text.secondary">데이터가 없습니다</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* 월별 업무현황 막대차트 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              월별 업무현황
            </Typography>
            {barChartSeries[0].data.length > 0 ? (
              <ReactApexChart options={barChartOptions} series={barChartSeries} type="bar" height={320} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                <Typography color="text.secondary">데이터가 없습니다</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function RegulationManagement() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // 유효성 검증 에러 상태
  const [validationError, setValidationError] = useState<string>('');

  // 🔐 권한 체크
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers } = useMenuPermission('/security/regulation');

  // 공유 Tasks 상태
  const [tasks, setTasks] = useState<RegulationTableData[]>(regulationData);

  // 폴더 데이터 상태 (칸반과 폴더뷰에서 공유) - 초기값을 빈 배열로 설정
  const [folderData, setFolderData] = useState<FolderItem[]>([]);

  // 데이터 로딩 상태
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Supabase Security Regulation 훅
  const { items, updateItem, createItem, deleteItem, fetchTree } = useSupabaseSecurityRegulation();

  // Supabase Security Revision 훅 (칸반 팝업창용)
  const { revisions, fetchRevisions } = useSupabaseSecurityRevision();

  // 사용자 및 부서 데이터
  const { users, departments, masterCodes } = useCommonData(); // 🏪 공용 창고에서 가져오기

  // 로그인한 사용자 정보
  const user = useUser();
  const { data: session } = useSession();

  // 현재 사용자 정보 (피드백/기록용)
  const currentUser = React.useMemo(() => {
    if (!session?.user?.email || users.length === 0) return null;
    return users.find((u) => u.email === session.user.email);
  }, [session, users]);

  // GROUP004 서브코드 목록 (직급용) - masterCodes에서 필터링
  const positionOptions = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP004' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order)
      .map((item) => ({
        code: item.subcode,
        name: item.subcode_name
      }));
  }, [masterCodes]);

  // GROUP007 서브코드 목록 (문서유형용) - masterCodes에서 필터링
  const documentTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP007' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // GROUP002 서브코드 목록 (상태용) - masterCodes에서 필터링
  const statusTypes = React.useMemo(() => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === 'GROUP002' && item.is_active)
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // 활성 사용자 목록 (담당자용)
  const assigneeList = React.useMemo(() => {
    return users
      .filter((user) => user.status === 'active')
      .map((user) => ({
        id: user.id,
        name: user.user_name,
        user_code: user.user_code,
        avatar: user.profile_image_url || user.avatar_url || '/assets/images/users/avatar-1.png'
      }));
  }, [users]);

  // DB 데이터를 FolderItem 형식으로 변환
  React.useEffect(() => {
    const convertToFolderItems = (dbItems: any[]): FolderItem[] => {
      return dbItems.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        type: item.type as 'folder' | 'file',
        createdDate: item.created_at?.split('T')[0] || '',
        modifiedDate: item.updated_at?.split('T')[0] || '',
        description: item.description || '',
        size: item.file_size || '',
        code: item.code || '',
        status: item.status || '',
        team: item.team || '',
        assignee: item.assignee || '',
        documentType: item.document_type || '',
        children: item.children ? convertToFolderItems(item.children) : []
      }));
    };

    if (items && items.length > 0) {
      console.log('🔄 DB items 변환 시작:', items);
      const converted = convertToFolderItems(items);
      console.log('✅ 변환된 folderData:', converted);

      // 모든 파일의 team 필드 확인 (재귀적으로)
      const getAllFiles = (items: FolderItem[]): any[] => {
        const files: any[] = [];
        items.forEach((item) => {
          if (item.type === 'file') {
            files.push({ id: item.id, name: item.name, team: item.team });
          }
          if (item.children) {
            files.push(...getAllFiles(item.children));
          }
        });
        return files;
      };

      const allFiles = getAllFiles(converted);
      console.log('📋 모든 파일의 팀 필드:', allFiles);

      setFolderData(converted);
      setIsDataLoading(false); // 데이터 로딩 완료
    } else if (items && items.length === 0) {
      // items가 빈 배열이면 로딩 완료 (데이터 없음)
      console.log('⚠️ items가 비어있음:', items);
      setFolderData([]);
      setIsDataLoading(false);
    }
    // items가 undefined이면 아직 로딩 중
  }, [items]);

  // 편집 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<RegulationTableData | null>(null);

  // 폴더 상세보기 팝업 관련 상태
  const [folderDetailDialog, setFolderDetailDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FolderItem | null>(null);
  const [originalFile, setOriginalFile] = useState<FolderItem | null>(null); // 원본 데이터 저장 (변경 감지용)
  const [selectedTab, setSelectedTab] = useState(0);

  // Feedback/Record hook (Dialog용) - selectedFile 선언 후에 위치
  const {
    feedbacks: dialogFeedbacks,
    loading: dialogFeedbackLoading,
    error: dialogFeedbackError,
    addFeedback: addDialogFeedback,
    updateFeedback: updateDialogFeedback,
    deleteFeedback: deleteDialogFeedback,
    isAdding: isDialogAdding,
    isUpdating: isDialogUpdating,
    isDeleting: isDialogDeleting
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.SECURITY_REGULATION, selectedFile?.id?.toString());

  // Record state management (Dialog용)
  const [dialogNewComment, setDialogNewComment] = useState('');
  const [dialogEditingCommentId, setDialogEditingCommentId] = useState<string | null>(null);
  const [dialogEditingCommentText, setDialogEditingCommentText] = useState('');

  // Convert Supabase feedbacks to RecordTab format (Dialog용)
  const dialogComments = useMemo(() => {
    return dialogFeedbacks.map((feedback) => {
      const feedbackUser = users.find((u) => u.user_name === feedback.user_name);

      // ⚠️ DB에 position과 role이 바뀌어 저장되어 있음
      // feedbackUser.role에 직급 서브코드(GROUP004-SUB003)가 들어있어서 이걸 변환하면 "팀장"이 나옴
      // feedbackUser.position에는 직책명("사원")이 들어있는데, 이건 표시하지 않음
      return {
        id: feedback.id,
        author: feedback.user_name,
        content: feedback.description,
        timestamp: new Date(feedback.created_at).toLocaleString('ko-KR'),
        avatar: feedback.user_profile_image || feedbackUser?.profile_image_url || undefined,
        department: feedback.user_department || feedback.team || feedbackUser?.department || '',
        position: convertSubcodeName(feedbackUser?.role || '', positionOptions),
        role: '' // DB에 position/role이 바뀌어 있어서 role은 표시하지 않음
      };
    });
  }, [dialogFeedbacks, users, positionOptions]);

  // 공유할 첨부파일 상태 (폴더탭과 칸반 팝업창 공통)
  const [sharedAttachedFiles, setSharedAttachedFiles] = useState<
    Array<{
      id: string;
      name: string;
      size: string;
      fileDescription: string;
      createdDate: string;
      revision: string;
      no: number;
      file?: File;
      filePath?: string;
    }>
  >([]);

  // 칸반 팝업창이 열릴 때 selectedFile의 리비전 데이터 가져오기
  React.useEffect(() => {
    if (selectedFile && selectedFile.type === 'file' && folderDetailDialog) {
      const regulationId = Number(selectedFile.id);
      if (!isNaN(regulationId)) {
        console.log('🔄 칸반 팝업창: 리비전 데이터 가져오기 시작', { regulationId, fileName: selectedFile.name });
        fetchRevisions(regulationId);
      }
    }
  }, [selectedFile, folderDetailDialog, fetchRevisions]);

  // DB에서 가져온 리비전을 sharedAttachedFiles 형태로 변환
  React.useEffect(() => {
    if (selectedFile && selectedFile.type === 'file' && folderDetailDialog) {
      if (revisions && revisions.length > 0) {
        const converted = revisions.map((rev, index) => ({
          id: rev.id.toString(),
          name: rev.file_name,
          size: rev.file_size || '',
          fileDescription: rev.file_description || '',
          createdDate: rev.upload_date,
          revision: rev.revision,
          no: revisions.length - index,
          filePath: rev.file_path || undefined // 파일 경로 추가
        }));
        console.log('📋 칸반 팝업창: attachedFiles 변환 완료', converted);
        setSharedAttachedFiles(converted);
      } else if (revisions && revisions.length === 0) {
        console.log('📋 칸반 팝업창: 리비전 없음');
        setSharedAttachedFiles([]);
      }
    }
  }, [revisions, selectedFile, folderDetailDialog]);

  // 자료탭의 첨부파일에서 최신 리비전 정보를 계산하는 함수 (폴더탭과 동일한 로직)
  const getLatestRevisionInfo = React.useCallback(() => {
    if (!sharedAttachedFiles || sharedAttachedFiles.length === 0) {
      console.log('📊 칸반 팝업창: 리비전 없음 (빈 문자열 반환)');
      return {
        latestRevision: '',
        latestRevisionDate: ''
      };
    }

    // R형식 (R1, R2, R3 등)과 v형식 (v1.0, v1.1, v2.0 등) 모두 처리
    const sortedFiles = [...sharedAttachedFiles].sort((a, b) => {
      const getRevisionNumber = (revision: string) => {
        // R형식 처리
        const rMatch = revision.match(/R(\d+)/);
        if (rMatch) return parseInt(rMatch[1]);

        // v형식 처리
        const vMatch = revision.match(/v?(\d+)\.(\d+)/);
        if (vMatch) return parseFloat(`${vMatch[1]}.${vMatch[2]}`);

        return 0;
      };
      return getRevisionNumber(b.revision) - getRevisionNumber(a.revision);
    });

    const result = {
      latestRevision: sortedFiles[0]?.revision || '',
      latestRevisionDate: sortedFiles[0]?.createdDate || ''
    };

    console.log('📊 칸반 팝업창: 최종리비전 정보', result);
    return result;
  }, [sharedAttachedFiles]);

  // 변경로그 페이지네이션 상태
  const [changeLogPage, setChangeLogPage] = useState(0);
  const [changeLogRowsPerPage, setChangeLogRowsPerPage] = useState(10);
  const [changeLogGoToPage, setChangeLogGoToPage] = useState('');

  // 변경로그 Hook (전체 보안규정의 변경 이력)
  const { logs: dbChangeLogs, loading: changeLogsLoading, fetchChangeLogs } = useSupabaseChangeLog('security_regulation');

  // 변경로그탭이 활성화될 때 데이터 강제 새로고침
  useEffect(() => {
    if (value === 4 && fetchChangeLogs) {
      console.log('🔄 변경로그탭 활성화 - 데이터 새로고침');
      fetchChangeLogs();
    }
  }, [value, fetchChangeLogs]);

  // 변경분류를 표준화하는 함수
  const normalizeActionType = useCallback((actionType: string) => {
    if (!actionType) return '-';

    const action = actionType.toLowerCase().trim();

    // 추가 관련
    if (action.includes('추가') || action.includes('생성') || action.includes('create') || action.includes('add') || action.includes('등록')) {
      return '추가';
    }

    // 삭제 관련
    if (action.includes('삭제') || action.includes('제거') || action.includes('delete') || action.includes('remove')) {
      return '삭제';
    }

    // 수정 관련 (기본값)
    if (action.includes('수정') || action.includes('변경') || action.includes('편집') || action.includes('update') || action.includes('edit') || action.includes('modify')) {
      return '수정';
    }

    // 기본값: 수정
    return '수정';
  }, []);

  // DB 변경로그를 UI 변경로그 형식으로 변환
  const changeLogs: ChangeLog[] = useMemo(() => {
    return dbChangeLogs.map((log: ChangeLogData) => {
      // created_at을 포맷팅
      const date = new Date(log.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}.${month}.${day} ${hour}:${minute}`;

      return {
        id: log.id,
        dateTime: formattedDateTime,
        code: log.record_id || '',
        target: log.title || log.record_id || '',
        location: log.change_location || '개요탭',
        action: normalizeActionType(log.action_type || ''),
        changedField: log.changed_field || '-',
        description: log.description || '',
        beforeValue: log.before_value || '',
        afterValue: log.after_value || '',
        team: log.team || log.user_department || '-',
        user: log.user_name || ''
      };
    });
  }, [dbChangeLogs, normalizeActionType]);

  // 필터 상태
  const [selectedYear, setSelectedYear] = useState('전체');
  const [selectedTeam, setSelectedTeam] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedAssignee, setSelectedAssignee] = useState('전체');
  const [selectedRecentStatus, setSelectedRecentStatus] = useState('전체');

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 3; i <= currentYear + 3; i++) {
    yearOptions.push(i.toString());
  }

  // 중복 방지를 위한 마지막 변경로그 정보 저장
  const lastChangeLogRef = React.useRef<{
    record_id: string;
    action_type: string;
    before_value: string;
    after_value: string;
    timestamp: number;
  } | null>(null);

  // 변경로그 추가 함수
  const addChangeLog = React.useCallback(
    async (
      action: string,
      target: string,
      description: string,
      team: string = '시스템',
      beforeValue?: string,
      afterValue?: string,
      changedField?: string,
      title?: string,
      location?: string
    ) => {
      try {
        const userName = currentUser?.user_name || currentUser?.name || user?.name || '시스템';
        const now = Date.now();

        // 중복 체크: 최근 2초 이내에 동일한 변경로그가 있으면 스킵
        if (lastChangeLogRef.current) {
          const timeDiff = now - lastChangeLogRef.current.timestamp;
          const isSameLog =
            lastChangeLogRef.current.record_id === target &&
            lastChangeLogRef.current.action_type === action &&
            lastChangeLogRef.current.before_value === (beforeValue || '') &&
            lastChangeLogRef.current.after_value === (afterValue || '');

          if (isSameLog && timeDiff < 2000) {
            console.log('⚠️ 중복 변경로그 감지 - 저장 스킵');
            return;
          }
        }

        // 마지막 변경로그 정보 업데이트
        lastChangeLogRef.current = {
          record_id: target,
          action_type: action,
          before_value: beforeValue || '',
          after_value: afterValue || '',
          timestamp: now
        };

        const logData = {
          page: 'security_regulation',
          record_id: target, // 코드를 record_id로 사용
          action_type: action,
          title: title || null,
          description: description,
          before_value: beforeValue || null,
          after_value: afterValue || null,
          changed_field: changedField || null,
          change_location: location || '개요탭',
          user_name: userName,
          team: currentUser?.department || '시스템',
          user_department: currentUser?.department,
          user_position: currentUser?.position,
          user_profile_image: currentUser?.profile_image_url,
          created_at: new Date().toISOString()
        };

        console.log('📝 보안규정관리 변경로그 저장 시도:', logData);

        // common_log_data에 직접 저장
        const supabase = createClient();
        const { data, error } = await supabase.from('common_log_data').insert(logData).select();

        if (error) {
          console.error('❌ 변경로그 저장 실패:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            error: error
          });
        } else {
          console.log('✅ 변경로그 저장 성공:', data);
          // 변경로그 데이터 새로고침
          if (fetchChangeLogs) {
            fetchChangeLogs();
          }
        }
      } catch (error) {
        console.error('❌ 변경로그 저장 중 예외 발생:', error);
      }
    },
    [currentUser, user, fetchChangeLogs]
  );

  // 최종리비전과 리비전수정일 변경 감지를 위한 ref (칸반 팝업창용)
  const prevLatestRevisionKanbanRef = React.useRef<string>('');
  const prevLatestRevisionDateKanbanRef = React.useRef<string>('');

  // sharedAttachedFiles 변경 시 최종리비전과 리비전수정일 변경 감지 및 변경로그 추가 (칸반 팝업창용)
  React.useEffect(() => {
    if (!selectedFile || selectedFile.type !== 'file' || !folderDetailDialog) return;

    const latestInfo = getLatestRevisionInfo();
    const currentLatestRevision = latestInfo.latestRevision;
    const currentLatestRevisionDate = latestInfo.latestRevisionDate;

    // 초기화 시에는 변경로그를 추가하지 않음 (빈 문자열에서 처음 값으로 변경될 때)
    const isInitializing = prevLatestRevisionKanbanRef.current === '' && prevLatestRevisionDateKanbanRef.current === '';

    if (!isInitializing) {
      const team = user?.department || user?.name || '시스템';

      // 최종리비전 변경 감지
      if (prevLatestRevisionKanbanRef.current !== currentLatestRevision && currentLatestRevision !== '') {
        const beforeValue = prevLatestRevisionKanbanRef.current || '없음';
        const afterValue = currentLatestRevision;
        const description = `최종리비전이 "${beforeValue}"에서 "${afterValue}"(으)로 변경되었습니다.`;

        addChangeLog(
          '수정',
          selectedFile.code || `REG-${selectedFile.id}`,
          description,
          team,
          beforeValue,
          afterValue,
          '최종리비전',
          selectedFile.name || '규정제목 없음',
          '칸반탭'
        );
      }

      // 리비전수정일 변경 감지
      if (prevLatestRevisionDateKanbanRef.current !== currentLatestRevisionDate && currentLatestRevisionDate !== '') {
        const beforeValue = prevLatestRevisionDateKanbanRef.current || '없음';
        const afterValue = currentLatestRevisionDate;
        const description = `리비전수정일이 "${beforeValue}"에서 "${afterValue}"(으)로 변경되었습니다.`;

        addChangeLog(
          '수정',
          selectedFile.code || `REG-${selectedFile.id}`,
          description,
          team,
          beforeValue,
          afterValue,
          '리비전수정일',
          selectedFile.name || '규정제목 없음',
          '칸반탭'
        );
      }
    }

    // 현재 값을 ref에 저장 (다음 비교를 위해)
    prevLatestRevisionKanbanRef.current = currentLatestRevision;
    prevLatestRevisionDateKanbanRef.current = currentLatestRevisionDate;
  }, [sharedAttachedFiles, selectedFile, folderDetailDialog, getLatestRevisionInfo, user, addChangeLog]);

  // folderData의 이전 값을 저장하는 ref
  const prevFolderDataRef = React.useRef<FolderItem[]>(folderData);

  // folderData가 변경될 때마다 이전 값 저장
  React.useEffect(() => {
    prevFolderDataRef.current = folderData;
  }, [folderData]);

  // 파일 업데이트 핸들러 (칸반 드래그 앤 드롭용)
  const handleUpdateItem = React.useCallback(
    async (itemId: string, updates: Partial<FolderItem>) => {
      // 이전 folderData에서 원본 아이템 찾기
      const findItem = (items: FolderItem[], id: string): FolderItem | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = findItem(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const originalItem = findItem(prevFolderDataRef.current, itemId);

      console.log('🔄 handleUpdateItem 호출:', {
        itemId,
        updates,
        originalItem,
        prevFolderData: prevFolderDataRef.current
      });

      // 로컬 상태 업데이트
      setFolderData((prevData) => {
        const updateItemInArray = (items: FolderItem[]): FolderItem[] => {
          return items.map((item) => {
            if (item.id === itemId) {
              // 변경사항이 있는지 확인하여 불필요한 업데이트 방지
              const hasChanges = Object.keys(updates).some((key) => (item as any)[key] !== (updates as any)[key]);
              return hasChanges ? { ...item, ...updates } : item;
            }
            if (item.children) {
              return { ...item, children: updateItemInArray(item.children) };
            }
            return item;
          });
        };

        return updateItemInArray(prevData);
      });

      // selectedFile도 함께 업데이트 (저장 버튼 검증용)
      setSelectedFile((prev) => {
        if (prev && prev.id === itemId) {
          return { ...prev, ...updates };
        }
        return prev;
      });

      // 변경로그 추가 (각 변경된 필드마다)
      if (originalItem) {
        const fieldMap: { [key: string]: string } = {
          name: '제목',
          description: '설명',
          status: '상태',
          documentType: '보안문서유형',
          team: '팀',
          assignee: '담당자',
          revision: '리비전'
        };

        Object.keys(updates).forEach((key) => {
          const oldValue = (originalItem as any)[key];
          const newValue = (updates as any)[key];

          console.log(`🔍 필드 비교 [${key}]:`, {
            oldValue,
            newValue,
            isDifferent: oldValue !== newValue,
            hasMapping: !!fieldMap[key]
          });

          // 실제로 값이 변경된 경우만 변경로그 추가
          if (oldValue !== newValue && fieldMap[key]) {
            const regulationCode = originalItem.code || originalItem.id;
            const regulationTitle = originalItem.name || '규정제목 없음';
            const fieldName = fieldMap[key];
            const josa = getJosa(fieldName, '이가');
            const description = `보안규정관리 ${regulationTitle}(${regulationCode}) 폴더탭의 ${fieldName}${josa} ${oldValue || '(없음)'} → ${newValue || '(없음)'}로 수정 되었습니다.`;

            console.log('📝 폴더탭 변경로그 추가:', {
              field: fieldName,
              oldValue,
              newValue,
              code: regulationCode,
              title: regulationTitle
            });

            addChangeLog(
              '수정',
              regulationCode,
              description,
              originalItem.team || '미분류',
              String(oldValue || ''),
              String(newValue || ''),
              fieldName,
              regulationTitle,
              '폴더탭'
            );
          }
        });
      } else {
        console.error('❌ 원본 아이템을 찾을 수 없습니다:', itemId);
      }

      // DB에 저장 (필드명 매핑)
      const dbUpdateData: any = {};

      if (updates.name !== undefined) dbUpdateData.name = updates.name;
      if (updates.description !== undefined) dbUpdateData.description = updates.description;
      if (updates.status !== undefined) dbUpdateData.status = updates.status;
      // "선택" 값이 아닐 때만 DB에 저장
      if (updates.documentType !== undefined && updates.documentType !== '선택' && updates.documentType.trim()) {
        dbUpdateData.document_type = updates.documentType;
      }
      if (updates.team !== undefined) dbUpdateData.team = updates.team;
      if (updates.assignee !== undefined) dbUpdateData.assignee = updates.assignee;
      if (updates.code !== undefined) dbUpdateData.code = updates.code;
      if (updates.revision !== undefined) dbUpdateData.revision = updates.revision;

      try {
        const success = await updateItem(Number(itemId), dbUpdateData);
        if (!success) {
          console.error('DB 업데이트 실패');
        }
      } catch (error) {
        console.error('DB 업데이트 오류:', error);
      }
    },
    [updateItem, addChangeLog]
  );

  // 카드 클릭 핸들러
  const handleCardClick = (task: RegulationTableData) => {
    setEditingTask(task);
    setEditDialog(true);
  };

  // 파일 카드 클릭 핸들러 (칸반에서 폴더 팝업 열기)
  const handleFileCardClick = (file: FolderItem) => {
    setSelectedFile(file);
    // 원본 데이터를 깊은 복사로 저장 (변경 감지용)
    setOriginalFile(JSON.parse(JSON.stringify(file)));
    setFolderDetailDialog(true);
    setValidationError(''); // 팝업 열 때 에러 초기화
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingTask(null);
  };

  // 폴더 상세보기 다이얼로그 닫기
  const handleFolderDetailDialogClose = () => {
    setFolderDetailDialog(false);
    setSelectedFile(null);
    setOriginalFile(null); // 원본 데이터 초기화
    setValidationError(''); // 팝업 닫을 때 에러 초기화
  };

  // 새 파일 추가 핸들러 (팝업에서)
  const handleAddNewFile = () => {
    const randomSize = ['1.2MB', '856KB', '3.4MB', '245KB', '12.1MB'][Math.floor(Math.random() * 5)];

    // 현재 연도 및 생성번호 계산
    const currentYear = new Date().getFullYear().toString().slice(-2); // 25 (2025년)
    const allFiles = getAllFilesFromFolders(folderData);
    const nextNumber = (allFiles.length + 1).toString().padStart(3, '0'); // 001, 002, 003...
    const secDocCode = `SEC-DOC-${currentYear}-${nextNumber}`;

    const newFile: FolderItem = {
      id: `file_${Date.now()}`,
      name: '새 문서',
      type: 'file',
      size: randomSize,
      createdDate: new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0],
      description: '',
      code: secDocCode,
      status: '대기',
      documentType: '',
      team: user ? user.department : '', // 로그인한 사용자의 부서를 팀으로 설정
      assignee: user ? user.name : '' // 로그인한 사용자의 이름을 담당자로 설정
    };

    // 첫 번째 폴더(정책서)에 파일 추가
    setFolderData((prev) => {
      return prev.map((item) => {
        if (item.id === '1' && item.type === 'folder') {
          return {
            ...item,
            children: [...(item.children || []), newFile]
          };
        }
        return item;
      });
    });

    // 변경로그 추가
    addChangeLog('추가', secDocCode, `새 문서 "${newFile.name}" 생성`, '시스템');

    // 팝업 닫기
    handleFolderDetailDialogClose();
  };

  // 선택된 파일 저장 핸들러
  const handleSaveSelectedFile = () => {
    if (!selectedFile) return;

    // 유효성 검사
    if (!selectedFile.name || !selectedFile.name.trim()) {
      setValidationError('제목을 입력해주세요.');
      return;
    }

    if (!selectedFile.documentType || !selectedFile.documentType.trim() || selectedFile.documentType === '선택') {
      setValidationError('보안문서유형을 선택해주세요.');
      return;
    }

    // 에러 초기화
    setValidationError('');

    // 저장 버튼 클릭 시 DB 저장 + 변경로그 추가

    // 변경된 필드 찾기 및 변경로그 추가
    const changedFields: string[] = [];
    const fieldMap: { [key: string]: string } = {
      name: '제목',
      description: '설명',
      status: '상태',
      documentType: '보안문서유형',
      team: '팀',
      assignee: '담당자',
      revision: '리비전'
    };

    if (originalFile) {
      console.log('📋 폴더탭 저장 - 변경 감지 시작:', {
        originalFile,
        selectedFile
      });

      Object.keys(fieldMap).forEach((key) => {
        const oldValue = (originalFile as any)[key];
        const newValue = (selectedFile as any)[key];

        // 실제로 값이 변경된 경우만 추가
        if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
          changedFields.push(fieldMap[key]);

          // 각 필드별 변경로그 추가
          const regulationCode = selectedFile.code || selectedFile.id;
          const regulationTitle = selectedFile.name || '규정제목 없음';
          const fieldName = fieldMap[key];
          const josa = getJosa(fieldName, '이가');
          const description = `보안규정관리 ${regulationTitle}(${regulationCode}) 폴더탭의 ${fieldName}${josa} ${oldValue || '(없음)'} → ${newValue || '(없음)'}로 수정 되었습니다.`;

          console.log('📝 폴더탭 변경로그 추가:', {
            field: fieldName,
            oldValue,
            newValue,
            code: regulationCode,
            title: regulationTitle
          });

          addChangeLog(
            '수정',
            regulationCode,
            description,
            selectedFile.team || '미분류',
            String(oldValue || ''),
            String(newValue || ''),
            fieldName,
            regulationTitle,
            '폴더탭'
          );
        }
      });
    }

    // DB에 저장 (필드명 매핑)
    const dbUpdateData: any = {};
    if (selectedFile.name !== undefined) dbUpdateData.name = selectedFile.name;
    if (selectedFile.description !== undefined) dbUpdateData.description = selectedFile.description;
    if (selectedFile.status !== undefined) dbUpdateData.status = selectedFile.status;
    if (selectedFile.documentType !== undefined && selectedFile.documentType !== '선택' && selectedFile.documentType.trim()) {
      dbUpdateData.document_type = selectedFile.documentType;
    }
    if (selectedFile.team !== undefined) dbUpdateData.team = selectedFile.team;
    if (selectedFile.assignee !== undefined) dbUpdateData.assignee = selectedFile.assignee;
    if (selectedFile.code !== undefined) dbUpdateData.code = selectedFile.code;

    // DB 업데이트 실행
    (async () => {
      try {
        const success = await updateItem(Number(selectedFile.id), dbUpdateData);
        if (!success) {
          console.error('❌ DB 업데이트 실패');
          setSnackbar({
            open: true,
            message: '저장 중 오류가 발생했습니다.',
            severity: 'error'
          });
          return;
        }
        console.log('✅ DB 업데이트 성공');
      } catch (error) {
        console.error('❌ DB 업데이트 오류:', error);
        setSnackbar({
          open: true,
          message: '저장 중 오류가 발생했습니다.',
          severity: 'error'
        });
        return;
      }
    })();

    // folderData state도 업데이트
    setFolderData((prevData) => {
      const updateItemInArray = (items: FolderItem[]): FolderItem[] => {
        return items.map((item) => {
          if (item.id === selectedFile.id) {
            return { ...item, ...selectedFile };
          }
          if (item.children) {
            return { ...item, children: updateItemInArray(item.children) };
          }
          return item;
        });
      };
      return updateItemInArray(prevData);
    });

    // 성공 알림
    let message = '';
    if (changedFields.length > 0) {
      const fieldsText = changedFields.join(', ');
      const lastField = changedFields[changedFields.length - 1];
      const josa = getJosa(lastField, '이가');
      message = `${selectedFile.name}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
    } else {
      const josa = getJosa(selectedFile.name, '이가');
      message = `${selectedFile.name}${josa} 성공적으로 수정되었습니다.`;
    }

    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });

    // 팝업 닫기
    handleFolderDetailDialogClose();
  };

  // Dialog Record handlers
  const handleDialogAddComment = useCallback(async () => {
    if (!dialogNewComment.trim() || !selectedFile?.id) return;

    const currentUserName = currentUser?.user_name || user?.name || '현재 사용자';
    const currentTeam = currentUser?.department || user?.department || '';
    const currentPosition = currentUser?.position || '';
    const currentProfileImage = currentUser?.profile_image_url || '';
    const currentRole = currentUser?.role || '';

    const feedbackInput: any = {
      page: PAGE_IDENTIFIERS.SECURITY_REGULATION,
      record_id: selectedFile.id.toString(),
      action_type: '기록',
      description: dialogNewComment,
      user_name: currentUserName,
      team: currentTeam || undefined,
      user_department: currentTeam || undefined,
      user_position: currentPosition || undefined,
      user_profile_image: currentProfileImage || undefined
    };

    // user_id는 UUID 타입이므로 전송하지 않음 (optional)
    // DB 스키마가 UUID를 요구하는데 숫자 ID를 전달하면 에러 발생

    // metadata에 role이 있을 때만 추가
    if (currentRole) {
      feedbackInput.metadata = { role: currentRole };
    }

    await addDialogFeedback(feedbackInput);

    setDialogNewComment('');
  }, [dialogNewComment, selectedFile, currentUser, user, addDialogFeedback]);

  const handleDialogEditComment = useCallback((commentId: string, content: string) => {
    setDialogEditingCommentId(commentId);
    setDialogEditingCommentText(content);
  }, []);

  const handleDialogSaveEditComment = useCallback(async () => {
    if (!dialogEditingCommentText.trim() || !dialogEditingCommentId) return;
    await updateDialogFeedback(dialogEditingCommentId, { description: dialogEditingCommentText });
    setDialogEditingCommentId(null);
    setDialogEditingCommentText('');
  }, [dialogEditingCommentText, dialogEditingCommentId, updateDialogFeedback]);

  const handleDialogCancelEditComment = useCallback(() => {
    setDialogEditingCommentId(null);
    setDialogEditingCommentText('');
  }, []);

  const handleDialogDeleteComment = useCallback(
    async (commentId: string) => {
      await deleteDialogFeedback(commentId);
    },
    [deleteDialogFeedback]
  );

  // 폴더에서 모든 파일 추출 함수 (메인에서 정의, 재사용)
  const getAllFilesFromFolders = React.useCallback((folders: FolderItem[]): FolderItem[] => {
    const files: FolderItem[] = [];

    const traverse = (items: FolderItem[]) => {
      items.forEach((item) => {
        if (item.type === 'file') {
          files.push(item);
        } else if (item.children) {
          traverse(item.children);
        }
      });
    };

    if (folders) {
      traverse(folders);
    }
    return files;
  }, []);

  // Task 저장 핸들러
  const handleEditTaskSave = (updatedTask: RegulationTableData) => {
    const originalTask = tasks.find((t) => t.id === updatedTask.id);

    if (originalTask) {
      // 업데이트
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? { ...updatedTask } : task)));

      // 변경된 필드 찾기
      const changedFields: string[] = [];
      const fieldMap: { [key: string]: string } = {
        workContent: '업무내용',
        type: '문서유형',
        status: '상태',
        assignee: '담당자',
        team: '팀',
        department: '부서',
        startDate: '시작일',
        completedDate: '완료일'
      };

      Object.keys(fieldMap).forEach((key) => {
        const oldValue = (originalTask as any)[key];
        const newValue = (updatedTask as any)[key];

        if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
          changedFields.push(fieldMap[key]);
        }
      });

      // 변경로그 추가
      if (changedFields.length > 0) {
        addChangeLog('수정', updatedTask.code, `${updatedTask.workContent} - ${changedFields.join(', ')} 변경`, updatedTask.team);
      }

      // 성공 알림
      let message = '';
      if (changedFields.length > 0) {
        const fieldsText = changedFields.join(', ');
        const lastField = changedFields[changedFields.length - 1];
        const josa = getJosa(lastField, '이가');
        message = `${updatedTask.workContent}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
      } else {
        const josa = getJosa(updatedTask.workContent, '이가');
        message = `${updatedTask.workContent}${josa} 성공적으로 수정되었습니다.`;
      }
      setSnackbar({
        open: true,
        message: message,
        severity: 'success'
      });
    } else {
      // 새로 생성
      setTasks((prevTasks) => [...prevTasks, updatedTask]);
      addChangeLog('추가', updatedTask.code, `새로운 업무가 생성되었습니다: ${updatedTask.workContent}`, updatedTask.team);

      // 성공 알림
      const josa = getJosa(updatedTask.workContent, '이가');
      setSnackbar({
        open: true,
        message: `${updatedTask.workContent}${josa} 성공적으로 추가되었습니다.`,
        severity: 'success'
      });
    }

    handleEditDialogClose();
  };

  const handleTaskClick = (task: RegulationTableData) => {
    setEditingTask(task);
    setEditDialog(true);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // 스크롤바 스타일
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          border: '2px solid #f8f9fa'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#dee2e6'
        },
        '&::-webkit-scrollbar-corner': {
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      <Card
        sx={{
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <CardContent
          sx={{
            pb: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // 스크롤바 스타일
            '&::-webkit-scrollbar': {
              width: '10px',
              height: '10px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              border: '2px solid #f8f9fa'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#dee2e6'
            },
            '&::-webkit-scrollbar-corner': {
              backgroundColor: '#f8f9fa'
            }
          }}
        >
          {/* 페이지 타이틀 및 브레드크럼 */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                보안규정관리
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ pb: 0.5 }}>
                보안메뉴 &gt; 보안규정관리
              </Typography>
            </Box>
          </Box>

          {/* 권한 체크: KPI관리 패턴 (깜빡임 방지) */}
          {canViewCategory && !canReadData ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                py: 8
              }}
            >
              <Typography variant="h5" color="text.secondary">
                이 페이지에 대한 데이터 조회 권한이 없습니다.
              </Typography>
              <Typography variant="body2" color="text.disabled">
                관리자에게 권한을 요청하세요.
              </Typography>
            </Box>
          ) : (
            <>
              {/* 탭 네비게이션 및 필터 */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              flexShrink: 0,
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="보안규정관리 탭"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.91rem',
                  fontWeight: 500
                }
              }}
            >
              <Tab
                icon={<Folder size={19} />}
                iconPosition="start"
                label="폴더"
                {...a11yProps(0)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<Element size={19} />}
                iconPosition="start"
                label="칸반"
                {...a11yProps(1)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<Calendar size={19} />}
                iconPosition="start"
                label="월간일정"
                {...a11yProps(2)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<TableDocument size={19} />}
                iconPosition="start"
                label="대시보드"
                {...a11yProps(3)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
              <Tab
                icon={<DocumentText size={19} />}
                iconPosition="start"
                label="변경로그"
                {...a11yProps(4)}
                sx={{
                  gap: 0.8,
                  '& .MuiTab-iconWrapper': {
                    margin: 0
                  }
                }}
              />
            </Tabs>

            {/* 필터 영역 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mr: 1 }}>
              {/* 연도 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>연도</InputLabel>
                <Select
                  value={selectedYear}
                  label="연도"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}년
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 팀 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>팀</InputLabel>
                <Select
                  value={selectedTeam}
                  label="팀"
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {departments
                    .filter((dept) => dept.is_active)
                    .map((dept) => (
                      <MenuItem key={dept.id} value={dept.department_name}>
                        {dept.department_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* 담당자 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>담당자</InputLabel>
                <Select
                  value={selectedAssignee}
                  label="담당자"
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {users
                    .filter((user) => user.status === 'active')
                    .map((user) => (
                      <MenuItem key={user.id} value={user.user_name}>
                        {user.user_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* 상태 필터 */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={selectedStatus}
                  label="상태"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1,
                      px: 2
                    }
                  }}
                >
                  <MenuItem value="전체">전체</MenuItem>
                  {statusTypes.map((statusItem) => (
                    <MenuItem key={statusItem.id} value={statusItem.subcode_name}>
                      {statusItem.subcode_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* 탭 내용 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              minHeight: 0,
              // 스크롤바 스타일
              '&::-webkit-scrollbar': {
                width: '10px',
                height: '10px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                border: '2px solid #f8f9fa'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#dee2e6'
              },
              '&::-webkit-scrollbar-corner': {
                backgroundColor: '#f8f9fa'
              }
            }}
          >
            <TabPanel value={value} index={0}>
              {/* 폴더 탭 */}
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                {isDataLoading ? (
                  <Box sx={{ p: 2 }}>
                    {/* 폴더 구조 헤더 스켈레톤 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Skeleton variant="text" width={100} height={30} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Skeleton variant="rounded" width={90} height={32} />
                        <Skeleton variant="rounded" width={90} height={32} />
                      </Box>
                    </Box>

                    {/* 폴더/파일 아이템 스켈레톤 */}
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, ml: item % 2 === 0 ? 3 : 0 }}>
                        <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
                        <Skeleton variant="text" width={`${Math.random() * 40 + 40}%`} height={32} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <FolderView
                    selectedYear={selectedYear}
                    selectedTeam={selectedTeam}
                    selectedStatus={selectedStatus}
                    selectedAssignee={selectedAssignee}
                    folderData={folderData}
                    setFolderData={setFolderData}
                    updateItem={updateItem}
                    createItem={createItem}
                    deleteItem={deleteItem}
                    fetchTree={fetchTree}
                    addChangeLog={addChangeLog}
                    documentTypes={documentTypes}
                    statusTypes={statusTypes}
                    assigneeList={assigneeList}
                    sharedAttachedFiles={sharedAttachedFiles}
                    setSharedAttachedFiles={setSharedAttachedFiles}
                    canCreateData={canCreateData}
                    canEditOwn={canEditOwn}
                    canEditOthers={canEditOthers}
                    setSnackbar={setSnackbar}
                    positionOptions={positionOptions}
                  />
                )}
              </Box>
            </TabPanel>

            <TabPanel value={value} index={1}>
              {/* 칸반 탭 */}
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
                {isDataLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary">
                      데이터를 불러오는 중입니다...
                    </Typography>
                  </Box>
                ) : (
                  <KanbanView
                    selectedYear={selectedYear}
                    selectedTeam={selectedTeam}
                    selectedStatus={selectedStatus}
                    selectedAssignee={selectedAssignee}
                    tasks={tasks}
                    setTasks={setTasks}
                    addChangeLog={addChangeLog}
                    onCardClick={handleTaskClick}
                    folderData={folderData}
                    setFolderData={setFolderData}
                    onFileCardClick={handleFileCardClick}
                    getAllFilesFromFolders={getAllFilesFromFolders}
                    assigneeList={assigneeList}
                    canEditOwn={canEditOwn}
                    canEditOthers={canEditOthers}
                    updateItem={updateItem}
                    setSnackbar={setSnackbar}
                  />
                )}
              </Box>
            </TabPanel>

            <TabPanel value={value} index={2}>
              {/* 월간일정 탭 */}
              <Box
                sx={{
                  p: 3,
                  height: '100%',
                  overflow: 'auto',
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    border: '2px solid #f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#dee2e6'
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <MonthlyScheduleView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  tasks={tasks}
                  folderData={folderData}
                  onCardClick={(task) => {
                    // 일반 task를 FolderItem 형태로 변환해서 동일한 다이얼로그 사용
                    const fileItem: FolderItem = {
                      id: task.id.toString(),
                      name: task.workContent || task.requestContent || '업무내용',
                      type: 'file',
                      description: task.mainContent || task.requestContent,
                      status: task.status,
                      assignee: task.assignee,
                      code: task.code,
                      createdDate: task.registrationDate,
                      modifiedDate: task.completedDate || task.registrationDate,
                      materials:
                        task.attachments?.map((att) => ({
                          id: att.id?.toString() || Math.random().toString(),
                          name: att.name || 'Unknown',
                          revision: 'R1',
                          uploadDate: task.registrationDate,
                          size: att.size
                        })) || []
                    };
                    setSelectedFile(fileItem);
                    setOriginalFile(JSON.parse(JSON.stringify(fileItem)));
                    setFolderDetailDialog(true);
                  }}
                  onFolderFileClick={(file) => {
                    setSelectedFile(file);
                    setOriginalFile(JSON.parse(JSON.stringify(file)));
                    setFolderDetailDialog(true);
                  }}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={3}>
              {/* 대시보드 탭 */}
              <Box
                sx={{
                  p: 1.5,
                  height: '100%',
                  overflow: 'auto',
                  // 스크롤바 스타일
                  '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    border: '2px solid #f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#dee2e6'
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <DashboardView
                  selectedYear={selectedYear}
                  selectedTeam={selectedTeam}
                  selectedStatus={selectedStatus}
                  selectedAssignee={selectedAssignee}
                  selectedRecentStatus={selectedRecentStatus}
                  setSelectedRecentStatus={setSelectedRecentStatus}
                  tasks={tasks}
                  folderData={folderData}
                  getAllFilesFromFolders={getAllFilesFromFolders}
                />
              </Box>
            </TabPanel>

            <TabPanel value={value} index={4}>
              {/* 변경로그 탭 */}
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
                <ChangeLogView
                  changeLogs={changeLogs}
                  tasks={tasks}
                  page={changeLogPage}
                  rowsPerPage={changeLogRowsPerPage}
                  goToPage={changeLogGoToPage}
                  loading={changeLogsLoading}
                  onPageChange={setChangeLogPage}
                  onRowsPerPageChange={setChangeLogRowsPerPage}
                  onGoToPageChange={setChangeLogGoToPage}
                />
              </Box>
            </TabPanel>
          </Box>
          </>
          )}
        </CardContent>
      </Card>

      {/* Task 편집 다이얼로그 */}
      {editDialog && (
        <RegulationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          task={editingTask}
          onSave={handleEditTaskSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={regulationStatusOptions}
          statusColors={regulationStatusColors}
          teams={teams}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      )}

      {/* 폴더 상세보기 다이얼로그 */}
      <Dialog
        open={folderDetailDialog}
        onClose={handleFolderDetailDialogClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '840px',
            maxHeight: '840px',
            overflow: 'hidden',
            '& .MuiDialogContent-root': {
              paddingBottom: '0 !important',
              marginBottom: '0 !important',
              paddingTop: '0 !important',
              borderTop: 'none !important'
            },
            '& .MuiDialogTitle-root': {
              borderBottom: 'none !important',
              '&:after': { display: 'none !important' },
              '&::after': { display: 'none !important' },
              '&::before': { display: 'none !important' },
              boxShadow: 'none !important',
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important'
            },
            '& hr': { display: 'none !important' },
            '& .MuiDivider-root': { display: 'none !important' }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pr: 2,
            pt: 2,
            pb: 0,
            mb: 0,
            borderBottom: 'none !important',
            '&:after': { display: 'none !important' },
            '&::after': { display: 'none !important' },
            boxShadow: 'none !important',
            position: 'relative',
            '&::before': { display: 'none !important' }
          }}
        >
          <Box>
            <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: '#000000', fontWeight: 500 }}>
              보안규정관리 편집
            </Typography>
            {selectedFile && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                {selectedFile.name} ({selectedFile.code})
              </Typography>
            )}
          </Box>

          {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleFolderDetailDialogClose}
              disabled={!(canEditOwn || canEditOthers)}
              sx={{
                minWidth: 'auto',
                px: 2,
                fontSize: '13px',
                color: '#666',
                borderColor: '#ddd',
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
              onClick={handleSaveSelectedFile}
              disabled={!(canEditOwn || canEditOthers)}
              sx={{
                minWidth: 'auto',
                px: 2,
                fontSize: '13px',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                },
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

        {/* 탭 메뉴 영역 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(event, newValue) => setSelectedTab(newValue)}>
            <Tab label="개요" />
            <Tab label="자료" />
            <Tab label="기록" />
          </Tabs>
        </Box>

        <DialogContent
          sx={{
            p: 0,
            pb: 0,
            mb: 0,
            pt: 0,
            mt: 0,
            borderTop: 'none !important',
            '&::before': { display: 'none !important' },
            '&::after': { display: 'none !important' }
          }}
        >
          {selectedFile && (
            <Box sx={{ height: '650px', overflowY: 'auto' }}>
              {selectedTab === 0 && (
                <OverviewTab
                  selectedItem={selectedFile}
                  onUpdateItem={(updates) => {
                    // 폴더탭 다이얼로그에서는 로컬 state만 업데이트 (DB 저장 안 함)
                    // 저장 버튼 클릭 시에만 DB에 저장하고 변경로그 추가
                    setSelectedFile((prev) => {
                      if (prev && prev.id === selectedFile.id) {
                        return { ...prev, ...updates };
                      }
                      return prev;
                    });
                  }}
                  latestRevision={getLatestRevisionInfo().latestRevision}
                  latestRevisionDate={getLatestRevisionInfo().latestRevisionDate}
                  documentTypes={documentTypes}
                  statusTypes={statusTypes}
                  assigneeList={assigneeList}
                  setValidationError={setValidationError}
                />
              )}
              {selectedTab === 1 && (
                <MaterialTab
                  selectedItem={selectedFile}
                  attachedFiles={sharedAttachedFiles}
                  setAttachedFiles={setSharedAttachedFiles}
                  onRefreshRevisions={() => {
                    const regulationId = Number(selectedFile.id);
                    if (!isNaN(regulationId)) {
                      fetchRevisions(regulationId);
                    }
                  }}
                  canCreateData={canCreateData}
                  canEditOwn={canEditOwn}
                  canEditOthers={canEditOthers}
                />
              )}
              {selectedTab === 2 && (
                <RecordTab
                  comments={dialogComments}
                  newComment={dialogNewComment}
                  onNewCommentChange={setDialogNewComment}
                  onAddComment={handleDialogAddComment}
                  editingCommentId={dialogEditingCommentId}
                  editingCommentText={dialogEditingCommentText}
                  onEditComment={handleDialogEditComment}
                  onSaveEditComment={handleDialogSaveEditComment}
                  onCancelEditComment={handleDialogCancelEditComment}
                  onDeleteComment={handleDialogDeleteComment}
                  onEditCommentTextChange={setDialogEditingCommentText}
                  currentUserName={currentUser?.user_name || user?.name || '현재 사용자'}
                  currentUserAvatar={currentUser?.profile_image_url || ''}
                  currentUserRole={convertSubcodeName(currentUser?.role || '', positionOptions)}
                  currentUserDepartment={currentUser?.department || user?.department || ''}
                  isAdding={isDialogAdding}
                  isUpdating={isDialogUpdating}
                  isDeleting={isDialogDeleting}
                />
              )}
            </Box>
          )}

          {/* 에러 메시지 표시 */}
          {validationError && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Alert severity="error" sx={{ mt: 1 }}>
                {validationError}
              </Alert>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 알림 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
