'use client';

import { useState, useMemo, useEffect } from 'react';

// Material-UI
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Pagination,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
// project imports
import EducationEditDialog from 'components/EducationEditDialog';

// data and types
import { teams, assignees, educationStatusOptions, educationStatusColors, assigneeAvatars } from 'data/education';
import { EducationData } from 'types/education';

// hooks
import { useSupabaseEducation } from 'hooks/useSupabaseEducation';
import { useSupabaseMasterCode3 } from 'hooks/useSupabaseMasterCode3';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';

// Icons
import { Add, Trash, Edit, DocumentDownload } from '@wandersonalwes/iconsax-react';

// 컬럼 너비 정의 (Education 테이블 구조)
const columnWidths = {
  checkbox: 50,
  no: 60,
  registrationDate: 100,
  code: 120,
  educationType: 120,
  title: 250,
  team: 100,
  assignee: 120,
  status: 90,
  startDate: 100,
  completionDate: 100,
  action: 80
};

interface EducationDataTableProps {
  selectedYear?: string;
  selectedTeam?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  educations?: EducationData[];
  setEducations?: React.Dispatch<React.SetStateAction<EducationData[]>>;
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
}

export default function EducationDataTable({
  selectedYear = '전체',
  selectedTeam = '전체',
  selectedStatus = '전체',
  selectedAssignee = '전체',
  educations,
  setEducations,
  addChangeLog
}: EducationDataTableProps) {
  const [data, setData] = useState<EducationData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 초기 로딩 상태

  // Supabase Education 연동
  const {
    getEducations,
    createEducation,
    updateEducation,
    deleteEducation,
    convertToEducationData,
    convertToDbEducationData,
    loading,
    error
  } = useSupabaseEducation();

  // 마스터코드 연동
  const { getSubCodesByGroup } = useSupabaseMasterCode3();

  // 사용자관리 연동 (Auto-loading 패턴)
  const { users } = useSupabaseUsers();

  // GROUP023의 Education유형 목록 가져오기
  const educationTypeOptions = getSubCodesByGroup('GROUP023');

  // 사용자 목록 옵션 생성 (등록자) - useSupabaseUsers가 이미 활성 사용자만 반환
  const userOptions = users.map((user) => user.user_name);

  // 사용자명으로 사용자 정보를 빠르게 찾기 위한 Map
  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      map.set(user.user_name, user);
    });
    return map;
  }, [users]);

  // GROUP024의 우선순위 목록 가져오기 (현재 미사용이지만 향후 확장을 위해 유지)
  // const priorityOptions = getSubCodesByGroup('GROUP024');

  // GROUP002의 상태 목록 가져오기 (현재 미사용이지만 향후 확장을 위해 유지)
  // const statusOptionsFromMaster = getSubCodesByGroup('GROUP002');

  // Education유형별 색상 매핑 함수
  const getEducationTypeColor = (educationType: string) => {
    const colors = [
      '#E3F2FD', // 파란색
      '#FFEBEE', // 빨간색
      '#F3E5F5', // 보라색
      '#E8F5E9', // 초록색
      '#FFF3E0', // 주황색
      '#E0F2F1', // 청록색
      '#FFF8E1', // 노란색
      '#FCE4EC' // 분홍색
    ];

    // Education유형의 인덱스를 기반으로 색상 선택
    const index = educationTypeOptions.findIndex((option) => option.subcode_name === educationType);
    return index >= 0 ? colors[index % colors.length] : '#F5F5F5';
  };

  // 우선순위별 색상 매핑 함수
  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      긴급: '#FFEBEE', // 빨간색
      높음: '#FFF3E0', // 주황색
      보통: '#E8F5E9', // 초록색
      낮음: '#E3F2FD' // 파란색
    };

    return priorityColors[priority as keyof typeof priorityColors] || '#F5F5F5';
  };

  // 상태별 색상 매핑 함수
  const getStatusColor = (status: string) => {
    switch (status) {
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

  // Edit 팝업 관련 상태
  const [editDialog, setEditDialog] = useState(false);
  const [editingEducation, setEditingEducation] = useState<EducationData | null>(null);

  // Excel 다운로드 기능
  const handleExcelDownload = () => {
    try {
      // 필터링된 데이터를 Excel 형식으로 변환 (테이블과 동일한 컬럼 순서)
      const excelData = filteredData.map((education) => ({
        NO: education.no,
        등록일: education.registrationDate,
        코드: `MAIN-EDU-${new Date(education.registrationDate).getFullYear().toString().slice(-2)}-${String(education.no).padStart(3, '0')}`,
        Education유형: education.educationType || '미분류',
        요청내용: education.content || '',
        처리내용: education.responseContent || '',
        우선순위: education.priority || '보통',
        상태: education.status || '대기',
        완료일: education.resolutionDate || '',
        등록자: education.assignee || ''
      }));

      // CSV 형식으로 데이터 변환 (Excel에서 열 수 있음)
      const csvContent = [
        // 헤더
        Object.keys(excelData[0] || {}).join(','),
        // 데이터 행들
        ...excelData.map((row) =>
          Object.values(row)
            .map((value) =>
              // CSV에서 쉼표가 포함된 값은 따옴표로 감싸기
              typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            )
            .join(',')
        )
      ].join('\n');

      // BOM 추가 (한글 깨짐 방지)
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 파일 다운로드
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `개인교육관리_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel 다운로드 중 오류 발생:', error);
      alert('Excel 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 Education 데이터 로드
  useEffect(() => {
    const loadEducationData = async () => {
      console.log('📞 Education 데이터 로드 시작');
      setIsInitialLoading(true);
      const dbEducations = await getEducations();
      const educationData = dbEducations.map(convertToEducationData);
      setData(educationData);
      if (setEducations) {
        setEducations(educationData);
      }
      setIsInitialLoading(false);
    };

    loadEducationData();
  }, [getEducations, convertToEducationData, setEducations]);

  // educations props가 변경될 때 data 상태 업데이트
  useEffect(() => {
    if (educations) {
      setData([...educations]);
    }
  }, [educations]);

  // 필터링된 데이터 (역순 정렬 추가)
  const filteredData = useMemo(() => {
    const filtered = data.filter((education) => {
      // 연도 필터
      if (selectedYear !== '전체') {
        const educationYear = new Date(education.registrationDate).getFullYear().toString();
        if (educationYear !== selectedYear) return false;
      }

      const teamMatch = selectedTeam === '전체' || education.team === selectedTeam;
      const statusMatch = selectedStatus === '전체' || education.status === selectedStatus;
      const assigneeMatch = selectedAssignee === '전체' || education.assignee === selectedAssignee;

      return teamMatch && statusMatch && assigneeMatch;
    });
    // NO 기준 역순 정렬
    return filtered.sort((a, b) => (b.no || 0) - (a.no || 0));
  }, [data, selectedYear || '전체', selectedTeam, selectedStatus, selectedAssignee]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // 필터가 변경될 때 페이지를 리셋
  useEffect(() => {
    setPage(0);
  }, [selectedYear || '전체', selectedTeam, selectedStatus, selectedAssignee]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // Go to 페이지 핸들러
  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber - 1);
    }
    setGoToPage('');
  };

  // 전체 선택 처리
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = paginatedData.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  // 선택된 행 삭제
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;

    try {
      const deletedEducations = data.filter((education) => selected.includes(education.id));

      // Supabase에서 삭제 (soft delete)
      for (const education of deletedEducations) {
        await deleteEducation(education.id);
      }

      // 삭제될 Education들의 정보를 변경로그에 추가
      if (addChangeLog) {
        deletedEducations.forEach((education) => {
          const educationCode = `MAIN-EDU-${new Date(education.registrationDate).getFullYear().toString().slice(-2)}-${String(education.no).padStart(3, '0')}`;
          const educationTitle = education.title || 'Education';
          addChangeLog(
            '삭제',
            educationCode,
            `개인교육관리 ${educationTitle}(${educationCode})이 삭제되었습니다.`,
            education.team || '미분류',
            undefined,
            undefined,
            undefined,
            educationTitle
          );
        });
      }

      const updatedData = data.filter((education) => !selected.includes(education.id));
      setData(updatedData);
      setSelected([]);

      // 부모 컴포넌트로 동기화
      if (setEducations) {
        setEducations(updatedData);
      }
    } catch (error) {
      console.error('❌ 개인교육관리 삭제 실패:', error);
      alert('개인교육관리 삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 다이얼로그 닫기
  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditingEducation(null);
  };

  // Education 저장
  const handleEditEducationSave = async (updatedEducation: EducationData) => {
    console.log('🔥🔥🔥 EducationDataTable handleEditEducationSave 시작!', updatedEducation);
    console.log('🔥🔥🔥 addChangeLog 함수 존재?', !!addChangeLog, typeof addChangeLog);

    try {
      const existingIndex = data.findIndex((education) => education.id === updatedEducation.id);
      console.log('🔍 기존 Education 인덱스:', existingIndex);

      if (existingIndex !== -1) {
        // 기존 Education 업데이트
        const originalEducation = data[existingIndex];

        console.log('🔥🔥🔥 변경로그 추가 시작!', {
          'addChangeLog 존재': !!addChangeLog,
          'originalEducation.title': originalEducation.title,
          'updatedEducation.title': updatedEducation.title,
          'title 변경됨?': originalEducation.title !== updatedEducation.title
        });

        // 변경로그 추가 - DB 저장 전에 실행 (필드별 상세 추적)
        if (addChangeLog) {
          console.log('🔥🔥🔥 addChangeLog 함수 실행!');
          const educationCode = `MAIN-EDU-${new Date(updatedEducation.registrationDate).getFullYear().toString().slice(-2)}-${String(updatedEducation.no).padStart(3, '0')}`;
          const educationTitle = updatedEducation.title || 'Education';

          // 0. 교육명 변경
          if (originalEducation.title !== updatedEducation.title) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 교육명이 ${originalEducation.title || ''} → ${updatedEducation.title || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.title || '',
              updatedEducation.title || '',
              '교육명',
              updatedEducation.title
            );
          }

          // 1. Education유형 변경
          if (originalEducation.educationType !== updatedEducation.educationType) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 Education유형이 ${originalEducation.educationType || ''} → ${updatedEducation.educationType || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.educationType || '',
              updatedEducation.educationType || '',
              'Education유형',
              educationTitle
            );
          }

          // 2. 고객명 변경
          if (originalEducation.customerName !== updatedEducation.customerName) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 고객명이 ${originalEducation.customerName || ''} → ${updatedEducation.customerName || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.customerName || '',
              updatedEducation.customerName || '',
              '고객명',
              educationTitle
            );
          }

          // 3. 회사명 변경
          if (originalEducation.companyName !== updatedEducation.companyName) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 회사명이 ${originalEducation.companyName || ''} → ${updatedEducation.companyName || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.companyName || '',
              updatedEducation.companyName || '',
              '회사명',
              educationTitle
            );
          }

          // 4. 요청내용 변경
          if (originalEducation.content !== updatedEducation.content) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 요청내용이 ${originalEducation.content || ''} → ${updatedEducation.content || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.content || '',
              updatedEducation.content || '',
              '요청내용',
              educationTitle
            );
          }

          // 5. 처리내용 변경
          if (originalEducation.responseContent !== updatedEducation.responseContent) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 처리내용이 ${originalEducation.responseContent || ''} → ${updatedEducation.responseContent || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.responseContent || '',
              updatedEducation.responseContent || '',
              '처리내용',
              educationTitle
            );
          }

          // 6. 우선순위 변경
          if (originalEducation.priority !== updatedEducation.priority) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 우선순위가 ${originalEducation.priority || ''} → ${updatedEducation.priority || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.priority || '',
              updatedEducation.priority || '',
              '우선순위',
              educationTitle
            );
          }

          // 7. 상태 변경
          if (originalEducation.status !== updatedEducation.status) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 상태가 ${originalEducation.status || ''} → ${updatedEducation.status || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.status || '',
              updatedEducation.status || '',
              '상태',
              educationTitle
            );
          }

          // 8. 담당자 변경
          if (originalEducation.assignee !== updatedEducation.assignee) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 담당자가 ${originalEducation.assignee || ''} → ${updatedEducation.assignee || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.assignee || '',
              updatedEducation.assignee || '',
              '담당자',
              educationTitle
            );
          }

          // 9. 팀 변경
          if (originalEducation.team !== updatedEducation.team) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 팀이 ${originalEducation.team || ''} → ${updatedEducation.team || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.team || '',
              updatedEducation.team || '',
              '팀',
              educationTitle
            );
          }

          // 10. 접수일 변경
          if (originalEducation.receptionDate !== updatedEducation.receptionDate) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 접수일이 ${originalEducation.receptionDate || ''} → ${updatedEducation.receptionDate || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.receptionDate || '',
              updatedEducation.receptionDate || '',
              '접수일',
              educationTitle
            );
          }

          // 11. 완료일 변경
          if (originalEducation.resolutionDate !== updatedEducation.resolutionDate) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 완료일이 ${originalEducation.resolutionDate || ''} → ${updatedEducation.resolutionDate || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.resolutionDate || '',
              updatedEducation.resolutionDate || '',
              '완료일',
              educationTitle
            );
          }

          // 12. 채널 변경
          if (originalEducation.channel !== updatedEducation.channel) {
            addChangeLog(
              '수정',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode}) 정보의 개요탭 채널이 ${originalEducation.channel || ''} → ${updatedEducation.channel || ''} 로 수정 되었습니다.`,
              updatedEducation.team || '미분류',
              originalEducation.channel || '',
              updatedEducation.channel || '',
              '채널',
              educationTitle
            );
          }
        }

        // DB 업데이트 (변경로그 추가 후)
        const dbEducationData = convertToDbEducationData(updatedEducation);
        const success = await updateEducation(updatedEducation.id, dbEducationData);

        if (success) {
          // 불변성을 유지하면서 배열 업데이트 (.map() 사용)
          const updatedData = data.map((edu) => (edu.id === updatedEducation.id ? { ...updatedEducation } : edu));
          setData(updatedData);

          // 부모 컴포넌트로 동기화
          if (setEducations) {
            setEducations(updatedData);
          }

          console.log('✅ 기존 개인교육관리 업데이트 완료');
        } else {
          throw new Error('개인교육관리 업데이트 실패');
        }
      } else {
        // 새 Education 추가
        const dbEducationData = convertToDbEducationData(updatedEducation);
        const createdEducation = await createEducation(dbEducationData);

        if (createdEducation) {
          const newEducationData = convertToEducationData(createdEducation);
          const newData = [newEducationData, ...data];
          setData(newData);

          // 부모 컴포넌트로 동기화
          if (setEducations) {
            setEducations(newData);
          }

          // 변경로그 추가 - 새 개인교육관리 생성
          if (addChangeLog) {
            const educationCode = `MAIN-EDU-${new Date(createdEducation.registration_date).getFullYear().toString().slice(-2)}-${String(createdEducation.no).padStart(3, '0')}`;
            const educationTitle = newEducationData.title || '새 개인교육관리';
            addChangeLog(
              '추가',
              educationCode,
              `개인교육관리 ${educationTitle}(${educationCode})이 신규 등록되었습니다.`,
              newEducationData.team || '미분류',
              undefined,
              undefined,
              undefined,
              educationTitle
            );
          }

          console.log('✅ 새 개인교육관리 추가 완료:', newEducationData);
        } else {
          console.error('❌ 개인교육관리 생성 실패 - createEducation이 null 반환');
          console.error('❌ 브라우저 콘솔에서 상세 에러를 확인하세요 (🚀 createEducation 시작 ~ ❌ Supabase 생성 오류)');
          throw new Error('개인교육관리 생성 실패: Supabase에서 에러가 발생했습니다. 콘솔 로그를 확인하세요.');
        }
      }

      handleEditDialogClose();
    } catch (error) {
      console.error('❌ 개인교육관리 저장 실패:', error);
      alert(`개인교육관리 저장 중 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 새 Education 추가
  const addNewEducation = () => {
    // 바로 편집 팝업 열기
    setEditingEducation(null);
    setEditDialog(true);
  };

  // 편집 핸들러 (IT교육관리 스타일)
  const handleEditEducation = (education: EducationData) => {
    setEditingEducation(education);
    setEditDialog(true);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 로딩 상태 표시 */}
      {(loading || isInitialLoading) && (
        <Box sx={{ width: '100%', mb: 1 }}>
          <LinearProgress />
        </Box>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="error" sx={{ fontSize: '13px' }}>
            {error}
          </Typography>
        </Box>
      )}

      {/* 초기 로딩 중일 때는 아래 내용 숨기기 */}
      {isInitialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            데이터를 불러오는 중...
          </Typography>
        </Box>
      ) : (
        <>
          {/* 상단 정보 및 액션 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
            <Typography variant="body2" color="text.secondary">
              총 {filteredData.length}건
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DocumentDownload size={16} />}
                size="small"
                onClick={handleExcelDownload}
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
              <Button variant="contained" startIcon={<Add size={16} />} size="small" onClick={addNewEducation} sx={{ px: 2 }}>
                추가
              </Button>
              <Button
                variant="outlined"
                startIcon={<Trash size={16} />}
                size="small"
                color="error"
                disabled={selected.length === 0}
                onClick={handleDeleteSelected}
                sx={{
                  px: 2,
                  borderColor: selected.length > 0 ? 'error.main' : 'grey.300',
                  color: selected.length > 0 ? 'error.main' : 'grey.500'
                }}
              >
                삭제 {selected.length > 0 && `(${selected.length})`}
              </Button>
            </Box>
          </Box>

          {/* 테이블 */}
          <TableContainer
            sx={{
              flex: 1,
              border: 'none',
              borderRadius: 0,
              overflowX: 'auto',
              overflowY: 'auto',
              boxShadow: 'none',
              minHeight: 0,
              '& .MuiTable-root': {
                minWidth: 1400
              },
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
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                      checked={paginatedData.length > 0 && selected.length === paginatedData.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
                  <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
                  <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
                  <TableCell sx={{ width: columnWidths.educationType, fontWeight: 600 }}>교육방식</TableCell>
                  <TableCell sx={{ width: columnWidths.title, fontWeight: 600 }}>제목</TableCell>
                  <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
                  <TableCell sx={{ width: columnWidths.assignee, fontWeight: 600 }}>담당자</TableCell>
                  <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
                  <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
                  <TableCell sx={{ width: columnWidths.completionDate, fontWeight: 600 }}>완료일</TableCell>
                  <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((education) => (
                    <TableRow
                      key={education.id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(education.id)}
                          onChange={(event) => {
                            const selectedIndex = selected.indexOf(education.id);
                            let newSelected: number[] = [];

                            if (selectedIndex === -1) {
                              newSelected = newSelected.concat(selected, education.id);
                            } else if (selectedIndex === 0) {
                              newSelected = newSelected.concat(selected.slice(1));
                            } else if (selectedIndex === selected.length - 1) {
                              newSelected = newSelected.concat(selected.slice(0, -1));
                            } else if (selectedIndex > 0) {
                              newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
                            }
                            setSelected(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.registrationDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          MAIN-EDU-{new Date(education.registrationDate).getFullYear().toString().slice(-2)}-
                          {String(education.no).padStart(3, '0')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.educationType || '미분류'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.title || '제목 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.team || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {education.assignee ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={userMap.get(education.assignee)?.profile_image_url || userMap.get(education.assignee)?.avatar_url}
                              sx={{ width: 24, height: 24 }}
                            >
                              {education.assignee.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                              {education.assignee}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={education.status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(education.status).bgcolor,
                            color: getStatusColor(education.status).color,
                            fontSize: '13px',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.receptionDate || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                          {education.resolutionDate || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="팝업편집">
                          <IconButton size="small" onClick={() => handleEditEducation(education)} sx={{ color: 'primary.main' }}>
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        검색 결과가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
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

            {/* 오른쪽: 페이지 네비게이션 */}
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
                  }}
                />
              )}
            </Box>
          </Box>
        </>
      )}

      {/* Education 편집 다이얼로그 */}
      {editDialog && (
        <EducationEditDialog
          open={editDialog}
          onClose={handleEditDialogClose}
          education={editingEducation}
          onSave={handleEditEducationSave}
          assignees={assignees}
          assigneeAvatars={assigneeAvatars}
          statusOptions={educationStatusOptions}
          statusColors={educationStatusColors}
          teams={teams}
        />
      )}
    </Box>
  );
}
