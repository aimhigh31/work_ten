'use client';

import React, { useState, useMemo } from 'react';

// Material-UI
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Tooltip,
  Avatar,
  Pagination,
  Stack,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Trash, Setting4, Profile2User, CloseCircle, Edit, Eye, DocumentUpload } from '@wandersonalwes/iconsax-react';
// ExpandMore 아이콘은 기본 화살표로 대체

// Project imports
import {
  EducationRecord,
  educationTypeOptions,
  statusOptions,
  attendanceStatusOptions,
  educationTypeCodeMap,
  CurriculumItem,
  ParticipantItem,
  EducationResult
} from 'types/education';
import { educationData } from 'data/education';
import { useSupabaseEducation } from 'hooks/useSupabaseEducation';

// ==============================|| 교육관리 데이터 테이블 ||============================== //

interface EducationDataTableProps {
  selectedStatus: string;
  selectedYear: string;
  selectedTeam?: string;
  selectedAssignee?: string;
  tasks?: any[];
  setTasks?: React.Dispatch<React.SetStateAction<any[]>>;
  addChangeLog?: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string
  ) => void;
  onDataRefresh?: () => Promise<void>;
}

// 컬럼 너비 정의
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  educationCategory: 100,
  title: 200,
  educationType: 100,
  team: 80,
  assignee: 120,
  status: 90,
  startDate: 100,
  completionDate: 100,
  action: 80
};

// 담당자 목록 (실제로는 API에서 가져와야 함)
const assigneeOptions = [
  { name: '김인사', avatar: '/assets/images/users/avatar-1.png' },
  { name: '이기술', avatar: '/assets/images/users/avatar-2.png' },
  { name: '박안전', avatar: '/assets/images/users/avatar-3.png' },
  { name: '최리더', avatar: '/assets/images/users/avatar-4.png' },
  { name: '정마케팅', avatar: '/assets/images/users/avatar-5.png' },
  { name: '김디지털', avatar: '/assets/images/users/avatar-6.png' },
  { name: '이개발', avatar: '/assets/images/users/avatar-7.png' },
  { name: '송보안', avatar: '/assets/images/users/avatar-8.png' },
  { name: '한영업', avatar: '/assets/images/users/avatar-9.png' }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`action-tabpanel-${index}`} aria-labelledby={`action-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EducationDataTable({
  selectedStatus,
  selectedYear,
  selectedTeam = '전체',
  selectedAssignee = '전체',
  tasks,
  setTasks,
  addChangeLog,
  onDataRefresh
}: EducationDataTableProps) {
  const theme = useTheme();
  const { addEducation, updateEducation, deleteEducation } = useSupabaseEducation();
  const [data, setData] = useState<EducationRecord[]>(educationData);
  const [selected, setSelected] = useState<number[]>([]);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; recordId: number | null; isNew: boolean }>({
    open: false,
    recordId: null,
    isNew: false
  });
  const [actionTabValue, setActionTabValue] = useState(0);

  // 편집 중인 레코드 상태
  const [editingRecord, setEditingRecord] = useState<EducationRecord | null>(null);

  // 선택된 커리큘럼과 참석자 관리
  const [selectedCurriculumItems, setSelectedCurriculumItems] = useState<number[]>([]);
  const [selectedParticipantItems, setSelectedParticipantItems] = useState<number[]>([]);

  // 첨부파일 관리
  const [attachmentDialog, setAttachmentDialog] = useState<{
    open: boolean;
    curriculumId: number | null;
  }>({ open: false, curriculumId: null });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState<string>('');

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const statusMatch = selectedStatus === '전체' || record.status === selectedStatus;
      const yearMatch = selectedYear === '전체' || record.registrationDate.startsWith(selectedYear);

      return statusMatch && yearMatch;
    });
  }, [data, selectedStatus, selectedYear]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 새로운 코드 생성 함수 (EDU-I-24-001 형식)
  const generateCode = (records: EducationRecord[], educationType: string) => {
    const year = new Date().getFullYear().toString().slice(-2);
    const typeCode = educationTypeCodeMap[educationType as keyof typeof educationTypeCodeMap];

    const existingCodes = records
      .filter((record) => record.code.startsWith(`EDU-${typeCode}-${year}-`))
      .map((record) => {
        const match = record.code.match(/EDU-[A-Z]-\d{2}-(\d{3})/);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const newNumber = maxNumber + 1;

    return `EDU-${typeCode}-${year}-${newNumber.toString().padStart(3, '0')}`;
  };

  // 체크박스 관련 함수들
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((row) => row.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // 새 행 추가 - Action 다이얼로그 열기
  const handleAddRow = () => {
    const newRecord: EducationRecord = {
      id: Math.max(...data.map((r) => r.id)) + 1,
      registrationDate: new Date().toISOString().split('T')[0],
      code: generateCode(data, '신입교육'), // 기본값으로 신입교육 사용
      educationType: '신입교육',
      content: '',
      participants: 0,
      location: '',
      status: '예정',
      completionDate: '',
      assignee: '김인사',
      curriculum: [],
      participantList: [],
      result: {
        performance: '',
        improvement: '',
        feedback: ''
      },
      isNew: true
    };

    setData((prev) => [newRecord, ...prev]);
    setEditingRecord(newRecord);
    setActionDialog({ open: true, recordId: newRecord.id, isNew: true });
    setActionTabValue(0);
  };

  // 선택된 행 삭제
  const handleDeleteRows = async () => {
    if (selected.length === 0) return;

    const confirmDelete = window.confirm(`선택한 ${selected.length}개의 교육을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      console.log('🗑️ 삭제할 항목들:', selected);

      // Supabase에서 각 항목 삭제
      const deletePromises = selected.map(async (id) => {
        const success = await deleteEducation(String(id));
        if (!success) {
          console.error(`❌ ID ${id} 삭제 실패`);
        } else {
          console.log(`✅ ID ${id} 삭제 성공`);
        }
        return success;
      });

      const results = await Promise.all(deletePromises);
      const allSuccess = results.every((result) => result);

      if (allSuccess) {
        console.log('✅ 모든 항목 삭제 성공');

        // 삭제될 교육들의 정보를 변경로그에 추가
        if (addChangeLog) {
          const deletedRecords = data.filter((record) => selected.includes(record.id));
          for (const record of deletedRecords) {
            const codeToUse = record.code || `ID-${record.id}`;
            const educationTitle = record.title || record.content || '교육';
            console.log('🔍 삭제 변경로그:', { code: record.code, codeToUse });
            // 삭제의 경우 변경 후 값은 없음
            await addChangeLog(
              '삭제',
              codeToUse,
              `개인교육관리 ${educationTitle}(${codeToUse}) 정보의 데이터탭 데이터가 삭제 되었습니다.`,
              record.team || '시스템',
              `${educationTitle} - ${record.location || '-'}`,
              '',
              '데이터탭',
              educationTitle
            );
          }
        }

        // 로컬 상태 업데이트
        const updatedData = data.filter((record) => !selected.includes(record.id));
        setData(updatedData);
        setSelected([]);

        // 부모 컴포넌트로 동기화
        if (setTasks) {
          setTasks(updatedData);
        }

        // 데이터 새로고침
        if (onDataRefresh) {
          await onDataRefresh();
        }

        alert('선택한 교육이 삭제되었습니다.');
      } else {
        alert('일부 항목 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('🔴 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // Action 다이얼로그 열기
  const handleActionClick = (recordId: number) => {
    const record = data.find((r) => r.id === recordId);
    if (record) {
      setEditingRecord({ ...record });
      setActionDialog({ open: true, recordId, isNew: false });
      setActionTabValue(0);
    }
  };

  const handleActionClose = () => {
    setActionDialog({ open: false, recordId: null, isNew: false });
    setEditingRecord(null);
    setActionTabValue(0);
  };

  // 저장
  const handleSave = async () => {
    if (!editingRecord) return;

    try {
      console.log('[HANDLE_SAVE] 💾 저장 시작');

      // 필수 필드 validation
      const validateRequiredFields = () => {
        const errors: string[] = [];
        if (!editingRecord?.content) errors.push('교육명');
        if (!editingRecord?.completionDate) errors.push('완료일');
        if (!editingRecord?.location) errors.push('장소');
        if (!editingRecord?.participants || editingRecord.participants <= 0) errors.push('참석수');
        return errors;
      };

      // 필드 검증
      const errors = validateRequiredFields();
      if (errors.length > 0) {
        alert(`필수 필드를 입력해주세요: ${errors.join(', ')}`);
        return;
      }

      // 교육유형이 변경된 경우 코드 재생성
      if (actionDialog.isNew || editingRecord.educationType !== data.find((r) => r.id === editingRecord.id)?.educationType) {
        editingRecord.code = generateCode(
          data.filter((r) => r.id !== editingRecord.id),
          editingRecord.educationType
        );
      }

      // EducationInput 형식으로 변환
      const educationData = {
        code: editingRecord.code,
        registration_date: editingRecord.registrationDate,
        start_date: editingRecord.startDate || null,
        completion_date: editingRecord.completionDate || null,
        education_category: editingRecord.educationCategory || null,
        title: editingRecord.content || null,
        description: editingRecord.description || null,
        education_type: editingRecord.educationType || null,
        team: editingRecord.team || null,
        assignee_id: null,
        assignee_name: editingRecord.assignee || null,
        status: editingRecord.status
      };

      if (actionDialog.isNew) {
        // 새 교육 생성
        console.log('🔵 새 교육 생성 시작');
        const result = await addEducation(educationData);

        if (result) {
          console.log('✅ 생성 성공:', result);

          if (addChangeLog) {
            const educationTitle = educationData.title || '교육';
            await addChangeLog(
              '추가',
              result.code,
              `개인교육관리 ${educationTitle}(${result.code}) 정보의 개요탭 데이터가 추가 되었습니다.`,
              educationData.team || '시스템',
              '',
              `${educationTitle} - ${editingRecord.location || '-'}`,
              '개요탭',
              educationTitle
            );
          }

          // 데이터 새로고침
          if (onDataRefresh) {
            console.log('🔄 데이터 새로고침 호출 (생성)');
            await onDataRefresh();
          }

          alert('교육이 추가되었습니다.');
        } else {
          console.error('❌ 생성 실패');
          alert('교육 추가에 실패했습니다.');
          return;
        }
      } else {
        // 기존 교육 수정
        console.log('🔵 기존 교육 수정 시작:', editingRecord.id);
        const originalRecord = data.find((r) => r.id === editingRecord.id);
        const success = await updateEducation(String(editingRecord.id), educationData);

        if (success) {
          console.log('✅ 수정 성공');

          if (addChangeLog && originalRecord) {
            // 필드 한글명 매핑
            const fieldNameMap: Record<string, string> = {
              content: '교육명',
              educationType: '교육유형',
              status: '상태',
              location: '장소',
              completionDate: '완료일',
              assignee: '담당자',
              participants: '참석수',
              team: '팀',
              description: '설명',
              educationCategory: '교육분류'
            };

            // 변경된 필드 찾기
            const changes: Array<{ field: string; fieldKorean: string; before: any; after: any }> = [];

            Object.keys(fieldNameMap).forEach((field) => {
              const beforeVal = (originalRecord as any)[field];
              const afterVal = (editingRecord as any)[field];

              // 값이 다른 경우만 추가
              if (beforeVal !== afterVal) {
                changes.push({
                  field,
                  fieldKorean: fieldNameMap[field],
                  before: beforeVal || '',
                  after: afterVal || ''
                });
              }
            });

            console.log('🔍 변경 감지된 필드들:', changes);

            const educationTitle = editingRecord.content || editingRecord.title || '교육';
            const codeToUse = originalRecord.code || editingRecord.code || `ID-${editingRecord.id}`;

            // 변경된 필드가 있으면 각각 로그 기록
            if (changes.length > 0) {
              for (const change of changes) {
                const description = `개인교육관리 ${educationTitle}(${codeToUse}) 정보의 개요탭 ${change.fieldKorean}이 ${change.before} → ${change.after} 로 수정 되었습니다.`;

                await addChangeLog(
                  '수정',
                  codeToUse,
                  description,
                  editingRecord.team || '시스템',
                  String(change.before),
                  String(change.after),
                  change.fieldKorean,
                  educationTitle
                );
              }
            } else {
              // 변경사항이 없는 경우 (일반 저장)
              await addChangeLog(
                '수정',
                codeToUse,
                `개인교육관리 ${educationTitle}(${codeToUse}) 정보의 개요탭에서 수정되었습니다.`,
                editingRecord.team || '시스템',
                '',
                '',
                '-',
                educationTitle
              );
            }
          }

          // 데이터 새로고침
          if (onDataRefresh) {
            console.log('🔄 데이터 새로고침 호출 (수정)');
            await onDataRefresh();
          }

          alert('교육이 수정되었습니다.');
        } else {
          console.error('❌ 수정 실패');
          alert('교육 수정에 실패했습니다.');
          return;
        }
      }

      // 로컬 상태 업데이트
      setData((prev) => prev.map((record) => (record.id === editingRecord.id ? { ...editingRecord, isNew: false } : record)));
      setActionDialog({ open: false, recordId: null, isNew: false });
      setEditingRecord(null);
    } catch (error) {
      console.error('🔴 저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 취소
  const handleCancel = () => {
    if (actionDialog.isNew && editingRecord) {
      // 새 레코드인 경우 데이터에서 제거
      setData((prev) => prev.filter((record) => record.id !== editingRecord.id));
    }
    handleActionClose();
  };

  // 커리큘럼 선택 관리 함수들
  const handleCurriculumSelect = (curriculumId: number) => {
    setSelectedCurriculumItems((prev) =>
      prev.includes(curriculumId) ? prev.filter((id) => id !== curriculumId) : [...prev, curriculumId]
    );
  };

  const handleSelectAllCurriculum = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && editingRecord) {
      setSelectedCurriculumItems(editingRecord.curriculum.map((c) => c.id));
    } else {
      setSelectedCurriculumItems([]);
    }
  };

  // 커리큘럼 관리 함수들
  const handleAddCurriculum = () => {
    if (editingRecord) {
      const newCurriculum: CurriculumItem = {
        id: Math.max(...editingRecord.curriculum.map((c) => c.id), 0) + 1,
        time: '',
        subject: '',
        instructor: '',
        content: '',
        attachment: ''
      };
      setEditingRecord({
        ...editingRecord,
        curriculum: [newCurriculum, ...editingRecord.curriculum]
      });
    }
  };

  const handleDeleteCurriculum = () => {
    if (editingRecord && selectedCurriculumItems.length > 0) {
      setEditingRecord({
        ...editingRecord,
        curriculum: editingRecord.curriculum.filter((c) => !selectedCurriculumItems.includes(c.id))
      });
      setSelectedCurriculumItems([]);
    }
  };

  const handleUpdateCurriculum = (curriculumId: number, field: keyof CurriculumItem, value: string) => {
    if (editingRecord) {
      setEditingRecord({
        ...editingRecord,
        curriculum: editingRecord.curriculum.map((c) => (c.id === curriculumId ? { ...c, [field]: value } : c))
      });
    }
  };

  // 참석자 선택 관리 함수들
  const handleParticipantSelect = (participantId: number) => {
    setSelectedParticipantItems((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId]
    );
  };

  const handleSelectAllParticipants = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && editingRecord) {
      setSelectedParticipantItems(editingRecord.participantList.map((p) => p.id));
    } else {
      setSelectedParticipantItems([]);
    }
  };

  // 참석자 관리 함수들
  const handleAddParticipant = () => {
    if (editingRecord) {
      const newParticipant: ParticipantItem = {
        id: Math.max(...editingRecord.participantList.map((p) => p.id), 0) + 1,
        assignee: '',
        department: '',
        position: '',
        attendance: '예정',
        report: '',
        notes: ''
      };
      setEditingRecord({
        ...editingRecord,
        participantList: [...editingRecord.participantList, newParticipant]
      });
    }
  };

  const handleDeleteParticipant = () => {
    if (editingRecord && selectedParticipantItems.length > 0) {
      setEditingRecord({
        ...editingRecord,
        participantList: editingRecord.participantList.filter((p) => !selectedParticipantItems.includes(p.id))
      });
      setSelectedParticipantItems([]);
    }
  };

  const handleUpdateParticipant = (participantId: number, field: keyof ParticipantItem, value: string) => {
    if (editingRecord) {
      setEditingRecord({
        ...editingRecord,
        participantList: editingRecord.participantList.map((p) => (p.id === participantId ? { ...p, [field]: value } : p))
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '대기':
      case '예정':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '홀딩':
      case '취소':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  const getAttendanceColor = (attendance: string) => {
    switch (attendance) {
      case '참석':
        return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case '불참':
        return { backgroundColor: '#ffebee', color: '#d32f2f' };
      case '예정':
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#757575' };
    }
  };

  const renderDisplayCell = (value: string | number) => {
    return (
      <Typography
        sx={{
          fontSize: '12px'
        }}
      >
        {value}
      </Typography>
    );
  };

  const renderAssigneeCell = (record: EducationRecord) => {
    const assignee = assigneeOptions.find((option) => option.name === record.assignee);

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Avatar src={assignee?.avatar} sx={{ width: 24, height: 24 }} />
        <Typography sx={{ fontSize: '12px' }}>{record.assignee}</Typography>
      </Box>
    );
  };

  // 페이지 변경
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // 특정 페이지로 이동
  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber - 1);
      setGoToPage('');
    }
  };

  // 선택된 교육 기록 찾기
  const selectedRecord = actionDialog.recordId ? data.find((r) => r.id === actionDialog.recordId) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* 상단 액션 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            총 {filteredData.length}건
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddRow} size="small">
              추가
            </Button>
            <Button
              variant="outlined"
              startIcon={<Trash />}
              onClick={handleDeleteRows}
              disabled={selected.length === 0}
              size="small"
              color="error"
            >
              삭제 {selected.length > 0 && `(${selected.length})`}
            </Button>
          </Box>
        </Box>

        {/* 테이블 */}
        <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                    checked={paginatedData.length > 0 && selected.length === paginatedData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ width: columnWidths.no, fontWeight: 600, fontSize: '12px' }}>NO</TableCell>
                <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600, fontSize: '12px' }}>등록일</TableCell>
                <TableCell sx={{ width: columnWidths.code, fontWeight: 600, fontSize: '12px' }}>코드</TableCell>
                <TableCell sx={{ width: columnWidths.educationCategory, fontWeight: 600, fontSize: '12px' }}>교육분류</TableCell>
                <TableCell sx={{ width: columnWidths.title, fontWeight: 600, fontSize: '12px' }}>제목</TableCell>
                <TableCell sx={{ width: columnWidths.educationType, fontWeight: 600, fontSize: '12px' }}>교육유형</TableCell>
                <TableCell sx={{ width: columnWidths.team, fontWeight: 600, fontSize: '12px' }}>팀</TableCell>
                <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600, fontSize: '12px' }}>담당자</TableCell>
                <TableCell sx={{ width: columnWidths.status, fontWeight: 600, fontSize: '12px' }}>상태</TableCell>
                <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600, fontSize: '12px' }}>시작일</TableCell>
                <TableCell sx={{ width: columnWidths.completionDate, fontWeight: 600, fontSize: '12px' }}>완료일</TableCell>
                <TableCell sx={{ width: columnWidths.action, fontWeight: 600, fontSize: '12px' }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((record, index) => {
                const isItemSelected = isSelected(record.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={record.id}
                    selected={isItemSelected}
                    sx={{
                      backgroundColor: record.isNew ? theme.palette.action.hover : 'inherit'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelected([...selected, record.id]);
                          } else {
                            setSelected(selected.filter((id) => id !== record.id));
                          }
                        }}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.registration_date}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.educationCategory || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.title || record.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          backgroundColor: 'white',
                          color: 'black',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {record.educationType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.team || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderAssigneeCell(record)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        size="small"
                        sx={{
                          ...getStatusColor(record.status),
                          fontSize: '13px',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.start_date || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {record.completion_date || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleActionClick(record.id)} sx={{ color: theme.palette.primary.main }}>
                        <Setting4 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 - VOC관리와 동일한 디자인 */}
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
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
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
                onChange={(e) => setGoToPage(e.target.value)}
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
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #e0e0e0'
                    }
                  }
                }}
              />
              <Button
                size="small"
                onClick={handleGoToPage}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.875rem'
                }}
              >
                Go
              </Button>
            </Box>
          </Box>

          {/* 오른쪽: 페이지 정보와 페이지네이션 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filteredData.length > 0
                ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredData.length)} of ${filteredData.length}`
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
                }
              }
            />
            )}
          </Box>
        </Box>

        {/* 교육 상세 정보 다이얼로그 */}
        <Dialog
          open={actionDialog.open}
          onClose={handleActionClose}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: '80vh',
              maxHeight: '90vh'
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
              pb: 1
            }}
          >
            <Box>
              <Typography variant="h6" component="div">
                {editingRecord?.id ? '교육 정보 수정' : '새 교육 과정 등록'}
              </Typography>
              {editingRecord?.code && (
                <Typography variant="body2" color="text.secondary">
                  {editingRecord.code} - {editingRecord.content}
                </Typography>
              )}
            </Box>

            {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Button onClick={handleActionClose} variant="outlined" size="small" sx={{ minWidth: '60px' }}>
                취소
              </Button>
              <Button onClick={handleSave} variant="contained" size="small" sx={{ minWidth: '60px' }}>
                저장
              </Button>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 2 }}>
            <Tabs value={actionTabValue} onChange={(e, newValue) => setActionTabValue(newValue)} sx={{ mb: 3 }}>
              <Tab label="개요" />
              <Tab label="커리큘럼" />
              <Tab label="참석자" />
              <Tab label="교육실적" />
            </Tabs>

            {/* 개요 탭 */}
            {actionTabValue === 0 && editingRecord && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          교육명 <span style={{ color: 'red' }}>*</span>
                        </span>
                      }
                      value={editingRecord.content}
                      onChange={(e) => setEditingRecord((prev) => (prev ? { ...prev, content: e.target.value } : null))}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      error={!editingRecord.content}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: !editingRecord.content ? '#ffebee' : 'inherit',
                          '& fieldset': {
                            borderColor: !editingRecord.content ? '#f44336' : undefined
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth error={!editingRecord.educationType}>
                      <InputLabel shrink>교육유형</InputLabel>
                      <Select
                        value={editingRecord.educationType}
                        label="교육유형"
                        onChange={(e) => {
                          const newType = e.target.value as any;
                          setEditingRecord((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  educationType: newType,
                                  code: generateCode(
                                    data.filter((r) => r.id !== prev.id),
                                    newType
                                  )
                                }
                              : null
                          );
                        }}
                      >
                        {educationTypeOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          참석수 <span style={{ color: 'red' }}>*</span>
                        </span>
                      }
                      type="number"
                      value={editingRecord.participants}
                      onChange={(e) => setEditingRecord((prev) => (prev ? { ...prev, participants: Number(e.target.value) } : null))}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      error={!editingRecord.participants || editingRecord.participants <= 0}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: !editingRecord.participants || editingRecord.participants <= 0 ? '#ffebee' : 'inherit',
                          '& fieldset': {
                            borderColor: !editingRecord.participants || editingRecord.participants <= 0 ? '#f44336' : undefined
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          완료일 <span style={{ color: 'red' }}>*</span>
                        </span>
                      }
                      type="date"
                      value={editingRecord.completionDate}
                      onChange={(e) => setEditingRecord((prev) => (prev ? { ...prev, completionDate: e.target.value } : null))}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      error={!editingRecord.completionDate}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: !editingRecord.completionDate ? '#ffebee' : 'inherit',
                          '& fieldset': {
                            borderColor: !editingRecord.completionDate ? '#f44336' : undefined
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          장소 <span style={{ color: 'red' }}>*</span>
                        </span>
                      }
                      value={editingRecord.location}
                      onChange={(e) => setEditingRecord((prev) => (prev ? { ...prev, location: e.target.value } : null))}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      error={!editingRecord.location}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: !editingRecord.location ? '#ffebee' : 'inherit',
                          '& fieldset': {
                            borderColor: !editingRecord.location ? '#f44336' : undefined
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel shrink>상태</InputLabel>
                      <Select
                        value={editingRecord.status}
                        label="상태"
                        onChange={(e) => setEditingRecord((prev) => (prev ? { ...prev, status: e.target.value as any } : null))}
                      >
                        {statusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            <Chip label={status} size="small" />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel shrink>담당자</InputLabel>
                      <Select
                        value={editingRecord.assignee}
                        label="담당자"
                        onChange={(e) => setEditingRecord((prev) => (prev ? { ...prev, assignee: e.target.value } : null))}
                        renderValue={(value) => {
                          const assignee = assigneeOptions.find((option) => option.name === value);
                          return assignee ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={assignee.avatar} sx={{ width: 24, height: 24 }} />
                              <Typography sx={{ fontSize: '14px' }}>{assignee.name}</Typography>
                            </Box>
                          ) : (
                            value
                          );
                        }}
                      >
                        {assigneeOptions.map((option) => (
                          <MenuItem key={option.name} value={option.name}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={option.avatar} sx={{ width: 24, height: 24 }} />
                              <Typography sx={{ fontSize: '14px' }}>{option.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="등록일"
                      type="date"
                      value={editingRecord.registrationDate}
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
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* 커리큘럼 탭 - KPI관리와 동일한 디자인 */}
            {actionTabValue === 1 && (
              <Box sx={{ py: 2 }}>
                {/* 추가, 삭제 버튼을 우측 상단으로 이동 */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddCurriculum}
                    sx={{
                      minWidth: '60px',
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565c0'
                      }
                    }}
                  >
                    추가
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDeleteCurriculum()}
                    disabled={selectedCurriculumItems.length === 0}
                    sx={{
                      minWidth: '60px',
                      color: selectedCurriculumItems.length > 0 ? '#d32f2f' : '#9e9e9e',
                      borderColor: selectedCurriculumItems.length > 0 ? '#d32f2f' : '#e0e0e0',
                      '&:hover': {
                        borderColor: selectedCurriculumItems.length > 0 ? '#c62828' : '#e0e0e0',
                        backgroundColor: selectedCurriculumItems.length > 0 ? '#ffebee' : 'transparent'
                      }
                    }}
                  >
                    삭제 ({selectedCurriculumItems.length})
                  </Button>
                </Box>

                {/* KPI관리와 동일한 테이블 디자인 */}
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none' }}>
                  <Table sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '50px',
                            textAlign: 'center',
                            padding: '16px'
                          }}
                        >
                          <Checkbox
                            indeterminate={
                              selectedCurriculumItems.length > 0 && selectedCurriculumItems.length < (editingRecord?.curriculum.length || 0)
                            }
                            checked={
                              editingRecord?.curriculum.length > 0 && selectedCurriculumItems.length === editingRecord.curriculum.length
                            }
                            onChange={handleSelectAllCurriculum}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '60px',
                            textAlign: 'center',
                            padding: '16px'
                          }}
                        >
                          NO
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '80px',
                            textAlign: 'left',
                            padding: '16px'
                          }}
                        >
                          시간
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '200px',
                            textAlign: 'left',
                            padding: '16px'
                          }}
                        >
                          과목명
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '120px',
                            textAlign: 'left',
                            padding: '16px'
                          }}
                        >
                          강사
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '300px',
                            textAlign: 'left',
                            padding: '16px'
                          }}
                        >
                          내용
                        </TableCell>
                        <TableCell
                          sx={{
                            backgroundColor: '#fafafa',
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '14px',
                            border: 'none',
                            width: '100px',
                            textAlign: 'center',
                            padding: '16px'
                          }}
                        >
                          첨부
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editingRecord?.curriculum.map((item, index) => (
                        <TableRow
                          key={item.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f9f9f9'
                            },
                            height: 'auto',
                            minHeight: '60px',
                            borderBottom: '1px solid #e0e0e0'
                          }}
                        >
                          <TableCell
                            sx={{
                              width: '50px',
                              textAlign: 'center',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            <Checkbox
                              checked={selectedCurriculumItems.includes(item.id)}
                              onChange={() => handleCurriculumSelect(item.id)}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              width: '60px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#333',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            {editingRecord.curriculum.length - index}
                          </TableCell>
                          <TableCell
                            sx={{
                              width: '80px',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              value={item.time}
                              onChange={(e) => handleUpdateCurriculum(item.id, 'time', e.target.value)}
                              variant="standard"
                              InputProps={{
                                disableUnderline: true,
                                style: { fontSize: '14px' }
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  padding: '0'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              width: '200px',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              value={item.subject}
                              onChange={(e) => handleUpdateCurriculum(item.id, 'subject', e.target.value)}
                              variant="standard"
                              InputProps={{
                                disableUnderline: true,
                                style: { fontSize: '14px' }
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  padding: '0'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              width: '120px',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              value={item.instructor}
                              onChange={(e) => handleUpdateCurriculum(item.id, 'instructor', e.target.value)}
                              variant="standard"
                              InputProps={{
                                disableUnderline: true,
                                style: { fontSize: '14px' }
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  padding: '0'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              width: '300px',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              value={item.content}
                              onChange={(e) => handleUpdateCurriculum(item.id, 'content', e.target.value)}
                              variant="standard"
                              multiline
                              maxRows={3}
                              InputProps={{
                                disableUnderline: true,
                                style: { fontSize: '14px' }
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  padding: '0'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              width: '100px',
                              textAlign: 'center',
                              padding: '16px',
                              borderBottom: '1px solid #e0e0e0',
                              borderTop: 'none',
                              borderLeft: 'none',
                              borderRight: 'none'
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setAttachmentDialog({ open: true, curriculumId: item.id })}
                              sx={{ fontSize: '12px', minWidth: '60px' }}
                            >
                              첨부
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 참석자 탭 */}
            {actionTabValue === 2 && (
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">참석자 목록</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleDeleteParticipant}
                      disabled={editingRecord?.participantList.length === 0}
                    >
                      삭제
                    </Button>
                    <Button variant="contained" size="small" onClick={handleAddParticipant}>
                      추가
                    </Button>
                  </Box>
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={
                              editingRecord?.participantList.length > 0 &&
                              editingRecord.participantList.length < editingRecord.participantList.length
                            }
                            checked={
                              editingRecord?.participantList.length > 0 &&
                              editingRecord.participantList.length === editingRecord.participantList.length
                            }
                            onChange={() => {
                              const allChecked =
                                editingRecord.participantList.length > 0 &&
                                editingRecord.participantList.length === editingRecord.participantList.length;
                              editingRecord.participantList.forEach((item) => {
                                const checkbox = document.getElementById(`participant-checkbox-${item.id}`);
                                if (checkbox) {
                                  checkbox.checked = allChecked;
                                }
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>NO</TableCell>
                        <TableCell>담당자</TableCell>
                        <TableCell>부서</TableCell>
                        <TableCell>직급</TableCell>
                        <TableCell>참석여부</TableCell>
                        <TableCell>Report</TableCell>
                        <TableCell>비고</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editingRecord?.participantList.map((participant, index) => (
                        <TableRow key={participant.id}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={editingRecord.participantList.some((p) => p.id === participant.id)}
                              onChange={() => {
                                const newParticipants = editingRecord.participantList.map((p) => ({ ...p, id: p.id }));
                                if (editingRecord.participantList.some((p) => p.id === participant.id)) {
                                  newParticipants.splice(
                                    newParticipants.findIndex((p) => p.id === participant.id),
                                    1
                                  );
                                } else {
                                  newParticipants.push({
                                    ...participant,
                                    id: Math.max(...editingRecord.participantList.map((p) => p.id)) + 1
                                  });
                                }
                                setEditingRecord((prev) => (prev ? { ...prev, participantList: newParticipants } : null));
                              }}
                            />
                          </TableCell>
                          <TableCell>{editingRecord.participantList.length - index}</TableCell>
                          <TableCell>
                            <Select
                              value={participant.assignee}
                              onChange={(e) => handleUpdateParticipant(participant.id, 'assignee', e.target.value)}
                              size="small"
                              fullWidth
                            >
                              {assigneeOptions.map((option) => (
                                <MenuItem key={option.name} value={option.name}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={option.avatar} sx={{ width: 24, height: 24 }} />
                                    <Typography sx={{ fontSize: '14px' }}>{option.name}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={participant.department}
                              onChange={(e) => handleUpdateParticipant(participant.id, 'department', e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={participant.position}
                              onChange={(e) => handleUpdateParticipant(participant.id, 'position', e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={participant.attendance}
                              onChange={(e) => handleUpdateParticipant(participant.id, 'attendance', e.target.value as any)}
                              size="small"
                              fullWidth
                            >
                              {attendanceStatusOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                  <Chip label={option} size="small" />
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={participant.report}
                              onChange={(e) => handleUpdateParticipant(participant.id, 'report', e.target.value)}
                              fullWidth
                              multiline
                              rows={2}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={participant.note || ''}
                              onChange={(e) => handleUpdateParticipant(participant.id, 'note', e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 교육실적 탭 */}
            {actionTabValue === 3 && (
              <Box sx={{ py: 2 }}>
                <Stack spacing={3}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 1
                      }}
                      onClick={() => setEditingRecord((prev) => (prev ? { ...prev, result: { ...prev.result, performance: '' } } : null))}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        성과
                      </Typography>
                      <Typography sx={{ fontSize: '16px' }}>{editingRecord?.result.performance ? '▲' : '▼'}</Typography>
                    </Box>
                    {editingRecord?.result.performance && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="교육을 통해 달성한 성과를 입력하세요..."
                          value={editingRecord.result.performance}
                          onChange={(e) =>
                            setEditingRecord((prev) => (prev ? { ...prev, result: { ...prev.result, performance: e.target.value } } : null))
                          }
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 1
                      }}
                      onClick={() => setEditingRecord((prev) => (prev ? { ...prev, result: { ...prev.result, improvement: '' } } : null))}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        개선
                      </Typography>
                      <Typography sx={{ fontSize: '16px' }}>{editingRecord?.result.improvement ? '▲' : '▼'}</Typography>
                    </Box>
                    {editingRecord?.result.improvement && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="앞으로 개선해야 할 사항을 입력하세요..."
                          value={editingRecord.result.improvement}
                          onChange={(e) =>
                            setEditingRecord((prev) => (prev ? { ...prev, result: { ...prev.result, improvement: e.target.value } } : null))
                          }
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 1
                      }}
                      onClick={() => setEditingRecord((prev) => (prev ? { ...prev, result: { ...prev.result, feedback: '' } } : null))}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        교육소감
                      </Typography>
                      <Typography sx={{ fontSize: '16px' }}>{editingRecord?.result.feedback ? '▲' : '▼'}</Typography>
                    </Box>
                    {editingRecord?.result.feedback && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="교육에 대한 전반적인 소감을 입력하세요..."
                          value={editingRecord.result.feedback}
                          onChange={(e) =>
                            setEditingRecord((prev) => (prev ? { ...prev, result: { ...prev.result, feedback: e.target.value } } : null))
                          }
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Paper>
                </Stack>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* 첨부파일 다이얼로그 */}
        <Dialog
          open={attachmentDialog.open}
          onClose={() => setAttachmentDialog({ open: false, curriculumId: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>첨부파일 관리</DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                파일을 선택하여 업로드하세요.
              </Typography>
              <Button variant="contained" component="label" sx={{ mt: 2 }}>
                파일 선택
                <input
                  type="file"
                  hidden
                  multiple
                  accept="*/*"
                  onChange={(e) => {
                    // 파일 업로드 로직 (향후 구현)
                    console.log('Selected files:', e.target.files);
                  }}
                />
              </Button>
            </Box>
          </DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 1 }}>
            <Button onClick={() => setAttachmentDialog({ open: false, curriculumId: null })}>닫기</Button>
          </Box>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
