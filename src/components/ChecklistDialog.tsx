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
  Paper,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ChecklistRecord,
  ChecklistEditorItem,
  categoryOptions,
  statusOptions,
  departmentOptions,
  priorityOptions
} from '../types/checklist';

// assets
import { Add, Edit, Trash, DocumentDownload, CloseCircle, Calendar, Edit2, AttachSquare } from '@wandersonalwes/iconsax-react';

// 상태 관리를 위한 reducer
interface ChecklistEditState {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignee: string;
  dueDate: string;
  registrationDate: string;
  code: string;
}

interface ChecklistEditAction {
  type: 'SET_FIELD' | 'SET_CHECKLIST' | 'INIT_NEW_CHECKLIST' | 'RESET';
  field?: keyof ChecklistEditState;
  value?: string | number;
  checklist?: ChecklistRecord;
  code?: string;
  registrationDate?: string;
}

const editChecklistReducer = (state: ChecklistEditState, action: ChecklistEditAction): ChecklistEditState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field!]: action.value! };
    case 'SET_CHECKLIST':
      return {
        title: action.checklist!.title,
        description: action.checklist!.description,
        category: action.checklist!.category,
        priority: action.checklist!.priority,
        status: action.checklist!.status,
        assignee: action.checklist!.assignee,
        dueDate: action.checklist!.dueDate,
        registrationDate: action.checklist!.registrationDate,
        code: action.checklist!.code
      };
    case 'INIT_NEW_CHECKLIST':
      return {
        title: '',
        description: '',
        category: '업무',
        priority: '보통',
        status: '대기',
        assignee: '현재 로그인 사용자',
        dueDate: '',
        registrationDate: action.registrationDate || new Date().toISOString().split('T')[0],
        code: action.code || ''
      };
    case 'RESET':
      return {
        title: '',
        description: '',
        category: '업무',
        priority: '보통',
        status: '대기',
        assignee: '현재 로그인 사용자',
        dueDate: '',
        registrationDate: '',
        code: ''
      };
    default:
      return state;
  }
};

// 담당자 옵션 (실제로는 API에서 가져와야 함)
const assigneeOptions = [
  { name: '김철수', avatar: '/assets/images/users/avatar-1.png' },
  { name: '이민수', avatar: '/assets/images/users/avatar-2.png' },
  { name: '송민호', avatar: '/assets/images/users/avatar-3.png' },
  { name: '박영희', avatar: '/assets/images/users/avatar-4.png' },
  { name: '최윤정', avatar: '/assets/images/users/avatar-5.png' }
];

// 탭 패널 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

interface ChecklistDialogProps {
  open: boolean;
  onClose: () => void;
  checklist?: ChecklistRecord;
  onSave: (checklist: ChecklistRecord) => void;
  generateCode: () => string;
}

const ChecklistDialog: React.FC<ChecklistDialogProps> = ({ open, onClose, checklist, onSave, generateCode }) => {
  const [value, setValue] = useState(0);
  const [editState, dispatch] = useReducer(editChecklistReducer, {
    title: '',
    description: '',
    category: '업무',
    priority: '보통',
    status: '대기',
    assignee: '현재 로그인 사용자',
    dueDate: '',
    registrationDate: '',
    code: ''
  });

  const [editorContent, setEditorContent] = useState('');

  // 체크리스트 아이템 상태
  const [checklistItems, setChecklistItems] = useState<ChecklistEditorItem[]>([
    {
      id: 1,
      majorCategory: '보안',
      minorCategory: '접근통제',
      title: '사용자 권한 점검',
      description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
      evaluation: '양호',
      score: 3,
      attachments: []
    },
    {
      id: 2,
      majorCategory: '보안',
      minorCategory: '패스워드',
      title: '패스워드 정책 점검',
      description: '패스워드 복잡성 및 변경 주기 확인',
      evaluation: '보통',
      score: 2,
      attachments: []
    },
    {
      id: 3,
      majorCategory: '시스템',
      minorCategory: '백업',
      title: '데이터 백업 상태',
      description: '정기적인 백업 수행 여부 확인',
      evaluation: '양호',
      score: 3,
      attachments: []
    }
  ]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingCell, setEditingCell] = useState<{ itemId: number; field: string } | null>(null);
  const [attachmentDialog, setAttachmentDialog] = useState<{ open: boolean; itemId: number | null }>({ open: false, itemId: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 첨부파일 인터페이스는 이미 types에서 import됨

  // 다이얼로그가 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      if (checklist) {
        dispatch({ type: 'SET_CHECKLIST', checklist });
        setEditorContent(checklist.description);
        // 기존 체크리스트의 에디터 데이터 로드
        if (checklist.editorData && checklist.editorData.length > 0) {
          setChecklistItems(checklist.editorData);
        } else {
          // 에디터 데이터가 없으면 기본 데이터 설정
          const defaultItems = [
            {
              id: 1,
              majorCategory: '보안',
              minorCategory: '접근통제',
              title: '사용자 권한 점검',
              description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
              evaluation: '대기',
              score: 0,
              attachments: []
            },
            {
              id: 2,
              majorCategory: '보안',
              minorCategory: '패스워드',
              title: '패스워드 정책 점검',
              description: '패스워드 복잡성 및 변경 주기 확인',
              evaluation: '대기',
              score: 0,
              attachments: []
            },
            {
              id: 3,
              majorCategory: '시스템',
              minorCategory: '백업',
              title: '데이터 백업 상태',
              description: '정기적인 백업 수행 여부 확인',
              evaluation: '대기',
              score: 0,
              attachments: []
            }
          ];
          setChecklistItems(defaultItems);
        }
      } else {
        const newCode = generateCode();
        const today = new Date().toISOString().split('T')[0];
        dispatch({
          type: 'INIT_NEW_CHECKLIST',
          code: newCode,
          registrationDate: today
        });
        setEditorContent('');
        // 새 체크리스트 아이템 데이터
        const initialItems = [
          {
            id: 1,
            majorCategory: '보안',
            minorCategory: '접근통제',
            title: '사용자 권한 점검',
            description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
            evaluation: '대기',
            score: 0,
            attachments: []
          },
          {
            id: 2,
            majorCategory: '보안',
            minorCategory: '패스워드',
            title: '패스워드 정책 점검',
            description: '패스워드 복잡성 및 변경 주기 확인',
            evaluation: '대기',
            score: 0,
            attachments: []
          },
          {
            id: 3,
            majorCategory: '시스템',
            minorCategory: '백업',
            title: '데이터 백업 상태',
            description: '정기적인 백업 수행 여부 확인',
            evaluation: '대기',
            score: 0,
            attachments: []
          }
        ];
        setChecklistItems(initialItems);
      }
      setValue(0);
      setSelectedItems([]);
    }
  }, [open, checklist, generateCode]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleFieldChange = useCallback((field: keyof ChecklistEditState, value: string | number) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  // 체크리스트 아이템 관리 함수들
  const handleSelectAllItems = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(checklistItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };

  const handleAddItem = () => {
    setChecklistItems((prev) => {
      // 더 안전한 ID 생성 방법
      const ids = prev.map((item) => item.id);
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const newId = maxId + 1;

      const newItem: ChecklistEditorItem = {
        id: newId,
        majorCategory: '보안',
        minorCategory: '접근통제',
        title: '',
        description: '',
        evaluation: '대기',
        score: 0,
        attachments: []
      };
      // 새로운 행을 맨 앞에 추가
      return [newItem, ...prev];
    });
  };

  const handleDeleteSelectedItems = () => {
    setChecklistItems((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const handleItemChange = (itemId: number, field: keyof ChecklistEditorItem, value: string | number) => {
    setChecklistItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // 평가가 변경되면 점수도 자동으로 업데이트
          if (field === 'evaluation') {
            switch (value) {
              case '양호':
                updatedItem.score = 3;
                break;
              case '보통':
                updatedItem.score = 2;
                break;
              case '미흡':
                updatedItem.score = 1;
                break;
              case '대기':
              default:
                updatedItem.score = 0;
                break;
            }
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSave = useCallback(() => {
    if (!editState.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const newChecklist: ChecklistRecord = {
      id: checklist?.id || 0,
      title: editState.title,
      description: editState.description,
      category: editState.category as any,
      priority: editState.priority as any,
      status: editState.status as any,
      assignee: '현재 로그인 사용자', // 등록자로 고정
      dueDate: editState.dueDate,
      registrationDate: editState.registrationDate,
      code: editState.code,
      completionDate: editState.status === '완료' ? new Date().toISOString().split('T')[0] : checklist?.completionDate || '',
      attachment: false,
      attachmentCount: 0,
      attachments: [],
      editorData: checklistItems // 에디터 데이터 저장
    };

    onSave(newChecklist);
    onClose();
  }, [editState, checklist, checklistItems, onSave, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 첨부파일 관련 함수들
  const handleAttachmentClick = (itemId: number) => {
    setAttachmentDialog({ open: true, itemId });
  };

  const handleAttachmentDialogClose = () => {
    setAttachmentDialog({ open: false, itemId: null });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !attachmentDialog.itemId) return;

    const newFiles: AttachmentFile[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size),
      file: file,
      uploadDate: new Date().toISOString().split('T')[0]
    }));

    setChecklistItems((prev) =>
      prev.map((item) => (item.id === attachmentDialog.itemId ? { ...item, attachments: [...item.attachments, ...newFiles] } : item))
    );

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileDelete = (itemId: number, fileId: number) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, attachments: item.attachments.filter((file) => file.id !== fileId) } : item))
    );
  };

  const handleFileDownload = (file: AttachmentFile) => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📄';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '80vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="div">
              {checklist ? '체크리스트 수정' : '새 체크리스트 추가'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editState.code} - {editState.registrationDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClose} color="inherit" variant="outlined" size="small">
              취소
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              size="small"
              disabled={!editState.title?.trim() || !editState.description?.trim()}
            >
              저장
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleTabChange} aria-label="checklist tabs">
          <Tab label="개요" {...a11yProps(0)} />
          <Tab label="에디터" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <TabPanel value={value} index={0}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="제목 *"
                value={editState.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
                variant="outlined"
                placeholder="체크리스트 제목을 입력하세요"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={4}
                value={editState.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                variant="outlined"
                placeholder="체크리스트에 대한 상세 설명을 입력하세요"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>업무분류</InputLabel>
                <Select value={editState.category} onChange={(e) => handleFieldChange('category', e.target.value)} label="업무분류">
                  {categoryOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select value={editState.status} onChange={(e) => handleFieldChange('status', e.target.value)} label="상태">
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={6}>
              <TextField
                fullWidth
                label="등록자"
                value="현재 로그인 사용자"
                disabled
                variant="outlined"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid size={6}>
              <TextField
                fullWidth
                label="등록일"
                type="date"
                value={editState.registrationDate}
                onChange={(e) => handleFieldChange('registrationDate', e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
                disabled
              />
            </Grid>

            <Grid size={12}>
              <TextField fullWidth label="코드" value={editState.code} disabled variant="outlined" />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Box sx={{ height: '60vh' }}>
            {/* 상단 버튼 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">체크리스트 항목</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={handleAddItem}>
                  추가
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Trash />}
                  onClick={handleDeleteSelectedItems}
                  disabled={selectedItems.length === 0}
                  color="error"
                >
                  삭제 ({selectedItems.length})
                </Button>
              </Box>
            </Box>

            {/* 테이블 */}
            <TableContainer component={Paper} sx={{ height: 'calc(100% - 60px)' }}>
              <Table
                stickyHeader
                size="small"
                sx={{
                  '& .MuiTableCell-root': {
                    fontSize: '12px',
                    padding: '8px 12px'
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ width: 50 }}>
                      <Checkbox
                        checked={checklistItems.length > 0 && selectedItems.length === checklistItems.length}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < checklistItems.length}
                        onChange={handleSelectAllItems}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 50, fontWeight: 'bold', fontSize: '12px' }}>NO</TableCell>
                    <TableCell sx={{ width: 60, fontWeight: 'bold', fontSize: '12px' }}>대분류</TableCell>
                    <TableCell sx={{ width: 60, fontWeight: 'bold', fontSize: '12px' }}>소분류</TableCell>
                    <TableCell sx={{ width: 150, fontWeight: 'bold', fontSize: '12px' }}>제목</TableCell>
                    <TableCell sx={{ width: 180, fontWeight: 'bold', fontSize: '12px' }}>세부설명</TableCell>
                    <TableCell sx={{ width: 80, fontWeight: 'bold', fontSize: '12px' }}>평가</TableCell>
                    <TableCell sx={{ width: 60, fontWeight: 'bold', fontSize: '12px' }}>점수</TableCell>
                    <TableCell sx={{ width: 80, fontWeight: 'bold', fontSize: '12px' }}>첨부물</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {checklistItems.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                      </TableCell>
                      <TableCell>{checklistItems.length - index}</TableCell>
                      <TableCell onClick={() => setEditingCell({ itemId: item.id, field: 'majorCategory' })}>
                        {editingCell?.itemId === item.id && editingCell.field === 'majorCategory' ? (
                          <TextField
                            size="small"
                            value={item.majorCategory}
                            onChange={(e) => handleItemChange(item.id, 'majorCategory', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            variant="outlined"
                            sx={{
                              minWidth: 60,
                              '& .MuiOutlinedInput-root': {
                                minHeight: '20px'
                              }
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              cursor: 'pointer',
                              minHeight: '20px',
                              minWidth: '60px',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              p: 1
                            }}
                          >
                            {item.majorCategory}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell onClick={() => setEditingCell({ itemId: item.id, field: 'minorCategory' })}>
                        {editingCell?.itemId === item.id && editingCell.field === 'minorCategory' ? (
                          <TextField
                            size="small"
                            value={item.minorCategory}
                            onChange={(e) => handleItemChange(item.id, 'minorCategory', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            variant="outlined"
                            sx={{
                              minWidth: 60,
                              '& .MuiOutlinedInput-root': {
                                minHeight: '20px'
                              }
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              cursor: 'pointer',
                              minHeight: '20px',
                              minWidth: '60px',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              p: 1
                            }}
                          >
                            {item.minorCategory}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell onClick={() => setEditingCell({ itemId: item.id, field: 'title' })}>
                        {editingCell?.itemId === item.id && editingCell.field === 'title' ? (
                          <TextField
                            size="small"
                            value={item.title}
                            onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            variant="outlined"
                            sx={{
                              minWidth: 120,
                              '& .MuiOutlinedInput-root': {
                                minHeight: '20px'
                              }
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              cursor: 'pointer',
                              minHeight: '20px',
                              minWidth: '120px',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              p: 1
                            }}
                          >
                            {item.title}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell onClick={() => setEditingCell({ itemId: item.id, field: 'description' })}>
                        {editingCell?.itemId === item.id && editingCell.field === 'description' ? (
                          <TextField
                            size="small"
                            multiline
                            rows={2}
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            variant="outlined"
                            sx={{
                              minWidth: 150,
                              '& .MuiOutlinedInput-root': {
                                minHeight: '40px'
                              }
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              cursor: 'pointer',
                              minHeight: '40px',
                              minWidth: '150px',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              p: 1
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 70 }}>
                          <Select value={item.evaluation} onChange={(e) => handleItemChange(item.id, 'evaluation', e.target.value)}>
                            <MenuItem value="대기">대기</MenuItem>
                            <MenuItem value="양호">양호</MenuItem>
                            <MenuItem value="보통">보통</MenuItem>
                            <MenuItem value="미흡">미흡</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 'bold' }}>
                          {item.score}점
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.2 }}>
                          <Tooltip title="첨부파일 관리">
                            <IconButton size="small" color="primary" onClick={() => handleAttachmentClick(item.id)}>
                              <AttachSquare />
                            </IconButton>
                          </Tooltip>
                          {item.attachments.length > 0 && (
                            <Typography variant="caption" sx={{ fontSize: '10px', minWidth: 'fit-content' }}>
                              ({item.attachments.length})
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 합계 행 */}
                  <TableRow sx={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #e0e0e0' }}>
                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '12px' }}>
                      합계
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', color: 'primary.main' }}>
                      {checklistItems.reduce((total, item) => total + item.score, 0)}점
                    </TableCell>
                    <TableCell colSpan={1}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </DialogContent>

      {/* 첨부파일 관리 다이얼로그 */}
      <Dialog open={attachmentDialog.open} onClose={handleAttachmentDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          첨부파일 관리
          {attachmentDialog.itemId && (
            <Typography variant="body2" color="text.secondary">
              {checklistItems.find((item) => item.id === attachmentDialog.itemId)?.title || `항목 ${attachmentDialog.itemId}`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple style={{ display: 'none' }} />

          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" startIcon={<Add />} onClick={() => fileInputRef.current?.click()}>
              파일 추가
            </Button>
          </Box>

          {attachmentDialog.itemId &&
            (() => {
              const currentItem = checklistItems.find((item) => item.id === attachmentDialog.itemId);
              return currentItem && currentItem.attachments.length > 0 ? (
                <List>
                  {currentItem.attachments.map((file) => (
                    <ListItem key={file.id} divider>
                      <ListItemIcon>
                        <Typography sx={{ fontSize: '24px' }}>{getFileIcon(file.name)}</Typography>
                      </ListItemIcon>
                      <ListItemText primary={file.name} secondary={`${file.size} • ${file.uploadDate}`} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleFileDownload(file)} color="primary">
                          <DocumentDownload />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleFileDelete(attachmentDialog.itemId!, file.id)} color="error">
                          <CloseCircle />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  첨부된 파일이 없습니다.
                </Typography>
              );
            })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAttachmentDialogClose}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default memo(ChecklistDialog);
