import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCommonData } from 'contexts/CommonDataContext';

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
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  Grid,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import { Add, Minus, Edit, SearchNormal1, DocumentUpload, DocumentDownload, Trash, Eye } from '@wandersonalwes/iconsax-react';

// Types
interface SalesRecord {
  id: number;
  registrationDate: string;
  code: string;
  customerName: string;
  salesType: string; // 개발, 양산, 상품, 설비, 기타
  businessUnit: string; // 사업부
  modelCode: string; // 모델코드 (기존 projectCode)
  itemCode: string; // 품목코드 (기존 productCode)
  itemName: string; // 품목명 (기존 productName)
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  team: string; // 팀
  registrant: string; // 담당자 -> 등록자로 변경
  deliveryDate: string;
  status: string; // 대기, 진행, 완료, 홀딩
  notes: string;
  isNew?: boolean;
  // 기록 및 자료 데이터 추가
  comments?: Array<{ id: number; author: string; content: string; timestamp: string; avatar?: string }>;
  materials?: Array<{ id: number; name: string; type: string; size: string; file?: File; uploadDate: string }>;
}

interface SalesDataTableProps {
  selectedYear: string;
  selectedTeam: string;
  selectedStatus: string;
  selectedAssignee: string;
  sales: SalesRecord[];
  setSales: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  addChangeLog: (
    action: string,
    target: string,
    description: string,
    team?: string,
    beforeValue?: string,
    afterValue?: string,
    changedField?: string,
    title?: string
  ) => void;
  // 외부에서 편집 다이얼로그 제어용 props
  isEditDialogOpen?: boolean;
  onEditDialogClose?: () => void;
  editingRecord?: SalesRecord | null;
  onEditClick?: (record: SalesRecord) => void; // 편집 버튼 클릭 시 호출
  onAddClick?: () => void; // 추가 버튼 클릭 시 호출
  users?: any[];
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

const SalesDataTable: React.FC<SalesDataTableProps> = ({
  selectedYear,
  selectedTeam,
  selectedStatus,
  selectedAssignee,
  sales,
  setSales,
  addChangeLog,
  isEditDialogOpen = false,
  onEditDialogClose,
  editingRecord = null,
  onEditClick,
  onAddClick,
  users,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}) => {
  const theme = useTheme();
  const { data: session } = useSession();
  const { masterCodes } = useCommonData();

  // 코드를 코드명으로 변환하는 함수
  const getCodeName = useMemo(() => {
    return (groupCode: string, subCode: string) => {
      if (!masterCodes || masterCodes.length === 0) return subCode;

      const masterCode = masterCodes.find(
        (mc) => mc.group_code === groupCode && mc.subcode === subCode && mc.is_active
      );

      return masterCode?.subcode_name || subCode;
    };
  }, [masterCodes]);

  // 현재 로그인한 사용자 정보 조회
  const currentUser = useMemo(() => {
    if (!session?.user?.email || !users || users.length === 0) {
      console.log('🔍 [SalesDataTable] currentUser: 없음 (세션 또는 users 없음)');
      return null;
    }
    const found = users.find((u) => u.email === session.user.email);
    console.log('🔍 [SalesDataTable] currentUser:', found ? found.user_name : '없음');
    return found;
  }, [session, users]);

  // 데이터 소유자 확인 (생성자 또는 담당자)
  const isDataOwner = (sales: SalesRecord) => {
    if (!currentUser) return false;

    const currentUserName = currentUser.user_name;

    // createdBy로 확인 (우선순위 1)
    const isCreator = sales.createdBy === currentUserName;

    // registrant로 확인 (우선순위 2)
    // registrant가 "홍길동 팀장" 형식일 수 있으므로, startsWith도 체크
    const registrantStartsWith = sales.registrant?.startsWith(currentUserName);
    const isAssignee = sales.registrant === currentUserName || registrantStartsWith;

    const result = isCreator || isAssignee;

    console.log('🔍 [SalesDataTable] 소유자 확인:', {
      salesId: sales.id,
      salesCode: sales.code,
      createdBy: sales.createdBy,
      registrant: sales.registrant,
      currentUserName,
      isCreator,
      registrantStartsWith,
      isAssignee,
      isDataOwner: result
    });

    return result;
  };

  // 편집 권한 확인
  const canEditData = (sales: SalesRecord) => {
    const result = canEditOthers || (canEditOwn && isDataOwner(sales));
    console.log('🔍 [SalesDataTable] 편집 권한:', {
      salesId: sales.id,
      canEditOthers,
      canEditOwn,
      canEditData: result
    });
    return result;
  };

  // 기본 데이터 (초기 로드시에만 사용)
  const initialData: SalesRecord[] = [
    {
      id: 1,
      registrationDate: '2024-08-05',
      code: 'SALES-25-001',
      customerName: '삼성전자',
      salesType: '개발',
      status: '진행',
      businessUnit: '전기차배터리',
      modelCode: 'PRJ-2024-001',
      itemCode: 'PROD-SEC-001',
      itemName: '통합보안솔루션 A',
      quantity: 5,
      unitPrice: 10000000,
      totalAmount: 50000000,
      team: '영업팀',
      registrant: '김영업',
      deliveryDate: '2024-08-15',
      notes: '초기 계약 완료',
      comments: [
        {
          id: 1,
          author: '김영업',
          content: '고객과 첫 미팅을 진행했습니다. 요구사항을 확인했고 견적서를 제출했습니다.',
          timestamp: '2024-08-05 09:30:00'
        },
        {
          id: 2,
          author: '김영업',
          content: '계약이 완료되었습니다. 납기일을 8월 15일로 확정했습니다.',
          timestamp: '2024-08-05 14:20:00'
        }
      ],
      materials: [
        {
          id: 1,
          name: '계약서_삼성전자_통합보안솔루션A.pdf',
          type: 'application/pdf',
          size: '2.5 MB',
          uploadDate: '2024-08-05'
        },
        {
          id: 2,
          name: '요구사항명세서_삼성전자.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: '1.8 MB',
          uploadDate: '2024-08-05'
        }
      ]
    },
    {
      id: 2,
      registrationDate: '2024-08-04',
      code: 'SALES-25-002',
      customerName: 'LG전자',
      salesType: '양산',
      status: '대기',
      businessUnit: '수소연료전지',
      modelCode: 'PRJ-2024-002',
      itemCode: 'PROD-NET-001',
      itemName: '네트워크보안솔루션 B',
      quantity: 3,
      unitPrice: 8000000,
      totalAmount: 24000000,
      team: '영업팀',
      registrant: '이영업',
      deliveryDate: '',
      notes: '가격 협상 진행중',
      comments: [
        {
          id: 1,
          author: '이영업',
          content: 'LG전자 담당자와 가격 협상을 진행중입니다. 10% 할인을 요청받았습니다.',
          timestamp: '2024-08-04 15:45:00'
        }
      ],
      materials: [
        {
          id: 1,
          name: '견적서_LG전자_네트워크보안솔루션B.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: '856 KB',
          uploadDate: '2024-08-04'
        }
      ]
    },
    {
      id: 3,
      registrationDate: '2024-08-03',
      code: 'SALES-25-003',
      customerName: '현대자동차',
      salesType: '상품',
      status: '완료',
      businessUnit: '폴더블',
      modelCode: 'PRJ-2024-003',
      itemCode: 'PROD-MOB-001',
      itemName: '차량보안시스템',
      quantity: 1,
      unitPrice: 35000000,
      totalAmount: 35000000,
      team: '개발팀',
      registrant: '박개발',
      deliveryDate: '2024-12-31',
      notes: '커스텀 개발 프로젝트',
      comments: [
        {
          id: 1,
          author: '박개발',
          content: '현대자동차와 커스텀 개발 프로젝트를 시작합니다. 차량용 보안시스템 개발이 주요 내용입니다.',
          timestamp: '2024-08-03 11:00:00'
        },
        {
          id: 2,
          author: '박개발',
          content: '개발 일정을 검토했습니다. 12월 말까지 완료 예정입니다.',
          timestamp: '2024-08-03 16:30:00'
        }
      ],
      materials: [
        {
          id: 1,
          name: '기술사양서_현대자동차_차량보안시스템.pdf',
          type: 'application/pdf',
          size: '4.2 MB',
          uploadDate: '2024-08-03'
        },
        {
          id: 2,
          name: '개발일정표_현대자동차.mpp',
          type: 'application/vnd.ms-project',
          size: '1.1 MB',
          uploadDate: '2024-08-03'
        },
        {
          id: 3,
          name: '계약서_현대자동차_차량보안시스템.pdf',
          type: 'application/pdf',
          size: '3.1 MB',
          uploadDate: '2024-08-03'
        }
      ]
    },
    {
      id: 4,
      registrationDate: '2024-08-02',
      code: 'SALES-25-004',
      customerName: 'SK텔레콤',
      salesType: '설비',
      status: '홀딩',
      businessUnit: '전기차배터리',
      modelCode: 'PRJ-2024-004',
      itemCode: 'PROD-TEL-001',
      itemName: '통신보안솔루션',
      quantity: 2,
      unitPrice: 15000000,
      totalAmount: 30000000,
      team: '기획팀',
      registrant: '이기획',
      deliveryDate: '2024-10-15',
      notes: '추가 검토 필요',
      comments: [
        {
          id: 1,
          author: '이기획',
          content: '기술적 검토가 필요하여 일시 보류되었습니다.',
          timestamp: '2024-08-02 10:00:00'
        }
      ],
      materials: []
    },
    {
      id: 5,
      registrationDate: '2024-08-01',
      code: 'SALES-25-005',
      customerName: 'KT',
      salesType: '기타',
      status: '대기',
      businessUnit: '수소연료전지',
      modelCode: 'PRJ-2024-005',
      itemCode: 'PROD-KT-001',
      itemName: 'AI보안솔루션',
      quantity: 4,
      unitPrice: 12000000,
      totalAmount: 48000000,
      team: '영업팀',
      registrant: '김영업',
      deliveryDate: '',
      notes: '견적서 제출 대기중',
      comments: [],
      materials: []
    }
  ];

  // records 상태를 제거하고 sales props를 직접 사용

  // sales props를 직접 사용하여 불필요한 동기화 제거
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [goToPage, setGoToPage] = useState('');

  // 다이얼로그 상태
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit' | 'view';
    recordId?: number;
  }>({
    open: false,
    mode: 'add'
  });

  // 매출편집 팝업창 탭 상태
  const [tabValue, setTabValue] = useState(0);

  // 기록 탭을 위한 상태
  const [comments, setComments] = useState<Array<{ id: number; author: string; content: string; timestamp: string; avatar?: string }>>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');

  // 자료 탭을 위한 상태
  const [materials, setMaterials] = useState<
    Array<{ id: number; name: string; type: string; size: string; file?: File; uploadDate: string }>
  >([]);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState<string>('');

  // 상위 컴포넌트와 데이터 동기화 로직 제거 - sales props를 직접 사용

  // 외부에서 편집 다이얼로그 제어 - 초기화 플래그 추가
  useEffect(() => {
    if (isEditDialogOpen && editingRecord) {
      setDialog({ open: true, mode: 'edit', recordId: editingRecord.id });

      // 기록과 자료 데이터 로드
      if (editingRecord.comments) {
        setComments(editingRecord.comments);
      }
      if (editingRecord.materials) {
        setMaterials(editingRecord.materials);
      }
    } else if (!isEditDialogOpen) {
      setDialog({ open: false, mode: 'add' });
    }
  }, [isEditDialogOpen, editingRecord?.id]); // 의존성 최소화

  // 외부 제어 모드일 때 records 변경을 sales에 반영 - 제거
  // 이 useEffect는 무한 루프를 유발하므로 제거

  // 현재 편집 중인 레코드 가져오기 - 안정화
  const getCurrentEditingRecord = React.useMemo((): SalesRecord | null => {
    // 외부에서 제어하는 경우
    if (isEditDialogOpen && editingRecord) {
      return editingRecord;
    }
    // 내부에서 제어하는 경우
    if (dialog.mode === 'edit' && dialog.recordId) {
      return sales.find((record) => record.id === dialog.recordId) || null;
    }
    return null;
  }, [isEditDialogOpen, editingRecord, dialog.mode, dialog.recordId, sales]);

  // 옵션들
  const salesTypeOptions = ['개발', '양산', '상품', '설비', '기타'];
  const statusOptions = ['대기', '진행', '완료', '홀딩'];
  const businessUnitOptions = ['전기차배터리', '수소연료전지', '폴더블', '기타'];

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
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

  const assigneeList = [
    { id: 1, name: '김영업', team: '영업팀', avatarUrl: '' },
    { id: 2, name: '이영업', team: '영업팀', avatarUrl: '' },
    { id: 3, name: '박마케팅', team: '마케팅팀', avatarUrl: '' },
    { id: 4, name: '최기술', team: '기술팀', avatarUrl: '' }
  ];

  // 컬럼 너비 정의
  const columnWidths = {
    checkbox: 50,
    no: 60,
    registrationDate: 90,
    code: 120,
    customerName: 120,
    salesType: 80,
    businessUnit: 120,
    projectCode: 100,
    productCode: 100,
    productName: 150,
    quantity: 70,
    unitPrice: 100,
    totalAmount: 120,
    team: 80,
    registrant: 100,
    deliveryDate: 100,
    action: 70
  };

  // 필터링된 레코드
  const filteredRecords = useMemo(() => {
    return sales.filter((record) => {
      const matchesSearch =
        searchTerm === '' ||
        record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.code.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [sales, searchTerm]);

  // 선택된 모든 항목의 편집 가능 여부
  const canEditAllSelected = useMemo(() => {
    if (selectedRecords.length === 0) return false;
    return selectedRecords.every((id) => {
      const salesRecord = filteredRecords.find((item) => item.id === id);
      return salesRecord && canEditData(salesRecord);
    });
  }, [selectedRecords, filteredRecords, canEditOthers, canEditOwn, currentUser]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // 코드 생성
  const generateCode = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const lastRecord = sales[sales.length - 1];
    const lastNumber = lastRecord ? parseInt(lastRecord.code.split('-')[2]) : 0;
    return `SALES-${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`;
  };

  // 등록일 생성
  const generateRegistrationDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 새 행 추가
  const handleAddRecord = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      setDialog({ open: true, mode: 'add' });
    }
  };

  // 레코드 편집
  const handleEditRecord = (recordId: number) => {
    const record = sales.find((s) => s.id === recordId);
    if (record) {
      // 외부에서 제어하는 경우 (칸반뷰와 공유)
      if (onEditClick) {
        onEditClick(record);
      } else {
        // 내부 제어 (독립 실행)
        setDialog({ open: true, mode: 'edit', recordId });
      }
    }
  };

  // 팝업창 닫기
  const handleCloseDialog = () => {
    // 상태 초기화
    setTabValue(0);
    setComments([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setMaterials([]);
    setEditingMaterialId(null);
    setEditingMaterialText('');

    // 다이얼로그 닫기
    if (onEditDialogClose) {
      onEditDialogClose();
    } else {
      setDialog({ open: false, mode: 'add' });
    }
  };

  // 레코드 저장
  const handleSaveRecord = () => {
    const currentRecord = getCurrentEditingRecord;

    if (dialog.mode === 'add') {
      const newRecord: SalesRecord = {
        id: Date.now(),
        registrationDate: generateRegistrationDate(),
        code: generateCode(),
        customerName: '',
        salesType: '개발',
        status: '대기',
        businessUnit: '',
        team: '',
        modelCode: '',
        itemCode: '',
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        totalAmount: 0,
        registrant: '',
        deliveryDate: '',
        notes: '',
        isNew: true
      };

      // 부모 컴포넌트의 sales 상태 업데이트
      setSales((prev) => [newRecord, ...prev]);

      // 변경로그 추가
      addChangeLog('매출 추가', newRecord.code, `새로운 매출 정보가 추가되었습니다.`, newRecord.businessUnit || '미분류');
    } else if (currentRecord && (dialog.mode === 'edit' || isEditDialogOpen)) {
      // 편집 모드: 현재 편집 중인 레코드를 저장

      // 부모 컴포넌트의 sales 상태 업데이트
      setSales((prev) => prev.map((sale) => (sale.id === currentRecord.id ? currentRecord : sale)));

      // 변경로그 추가
      const salesCode = currentRecord.code || `SALES-${currentRecord.id}`;
      addChangeLog('매출 수정', salesCode, `매출 정보가 수정되었습니다.`, currentRecord.businessUnit || '미분류');
    }

    handleCloseDialog();
  };

  // 선택된 행 삭제
  const handleDeleteRecords = async () => {
    if (window.confirm(`선택된 ${selectedRecords.length}개 항목을 삭제하시겠습니까?`)) {
      // 삭제될 레코드들의 정보를 먼저 저장
      const recordsToDelete = sales.filter((record) => selectedRecords.includes(record.id));

      // 각 레코드에 대해 변경로그 추가
      for (const record of recordsToDelete) {
        const salesCode = record.code || `SALES-${record.id}`;
        const salesTitle = record.itemName || '매출';
        await addChangeLog(
          '삭제',
          salesCode,
          `매출관리 ${salesTitle}(${salesCode}) 정보의 데이터탭 데이터가 삭제 되었습니다.`,
          record.businessUnit || '미분류',
          `${record.customerName} - ${record.itemName} (${Number(record.totalAmount).toLocaleString()}원)`,
          '',
          '데이터탭',
          salesTitle
        );
      }

      setSales((prev) => prev.filter((record) => !selectedRecords.includes(record.id)));
      setSelectedRecords([]);
    }
  };

  // 전체 선택
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRecords(paginatedRecords.map((record) => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // 개별 선택
  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords((prev) => (prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]));
  };

  // 페이지 변경
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  // Excel 다운로드 함수
  const handleExcelDownload = () => {
    // Excel 다운로드 로직 구현
    console.log('Excel 다운로드');
  };

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 기록 탭 핸들러들
  const handleAddComment = () => {
    if (!newComment?.trim()) return;

    const comment = {
      id: Date.now(),
      author: '관리자',
      content: newComment.trim(),
      timestamp: new Date().toLocaleString('ko-KR'),
      avatar: ''
    };

    setComments((prev) => [...prev, comment]);
    setNewComment('');
  };

  const handleEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  };

  const handleSaveEditComment = () => {
    if (!editingCommentText?.trim()) return;

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === editingCommentId
          ? { ...comment, content: editingCommentText.trim(), timestamp: new Date().toLocaleString('ko-KR') + ' (수정됨)' }
          : comment
      )
    );
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }
  };

  // 자료 탭 핸들러들
  const handleAddMaterial = (material: any) => {
    setMaterials((prev) => [...prev, material]);
  };

  const handleEditMaterial = (materialId: number, name: string) => {
    setEditingMaterialId(materialId);
    setEditingMaterialText(name);
  };

  const handleSaveEditMaterial = () => {
    if (!editingMaterialText.trim() || !editingMaterialId) return;

    setMaterials((prev) =>
      prev.map((material) => (material.id === editingMaterialId ? { ...material, name: editingMaterialText.trim() } : material))
    );

    setEditingMaterialId(null);
    setEditingMaterialText('');
  };

  const handleCancelEditMaterial = () => {
    setEditingMaterialId(null);
    setEditingMaterialText('');
  };

  const handleDeleteMaterial = (materialId: number) => {
    if (window.confirm('이 파일을 삭제하시겠습니까?')) {
      setMaterials((prev) => prev.filter((material) => material.id !== materialId));
    }
  };

  const handleDownloadMaterial = (material: any) => {
    if (material.file) {
      const url = URL.createObjectURL(material.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('다운로드할 파일이 없습니다.');
    }
  };

  // 파일 크기 포맷 함수
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 정보 및 액션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 3, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredRecords.length}건
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
          <Button
            variant="contained"
            startIcon={<Add size={16} />}
            size="small"
            onClick={handleAddRecord}
            disabled={!canCreateData}
            sx={{
              px: 2,
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            추가
          </Button>
          <Button
            variant="outlined"
            startIcon={<Trash size={16} />}
            size="small"
            color="error"
            disabled={!canEditAllSelected}
            onClick={handleDeleteRecords}
            sx={{
              px: 2,
              borderColor: canEditAllSelected ? 'error.main' : 'grey.300',
              color: canEditAllSelected ? 'error.main' : 'grey.500',
              '&.Mui-disabled': {
                borderColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            삭제 {selectedRecords.length > 0 && `(${selectedRecords.length})`}
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
            minWidth: 1300
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
                  indeterminate={selectedRecords.length > 0 && selectedRecords.length < paginatedRecords.length}
                  checked={paginatedRecords.length > 0 && selectedRecords.length === paginatedRecords.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
              <TableCell sx={{ width: columnWidths.code, fontWeight: 600 }}>코드</TableCell>
              <TableCell sx={{ width: columnWidths.customerName, fontWeight: 600 }}>고객명</TableCell>
              <TableCell sx={{ width: columnWidths.salesType, fontWeight: 600 }}>판매유형</TableCell>
              <TableCell sx={{ width: columnWidths.businessUnit, fontWeight: 600 }}>사업부</TableCell>
              <TableCell sx={{ width: columnWidths.projectCode, fontWeight: 600 }}>모델코드</TableCell>
              <TableCell sx={{ width: columnWidths.productCode, fontWeight: 600 }}>품목코드</TableCell>
              <TableCell sx={{ width: columnWidths.productName, fontWeight: 600 }}>품목명</TableCell>
              <TableCell sx={{ width: columnWidths.quantity, fontWeight: 600 }}>수량</TableCell>
              <TableCell sx={{ width: columnWidths.unitPrice, fontWeight: 600 }}>단가</TableCell>
              <TableCell sx={{ width: columnWidths.totalAmount, fontWeight: 600 }}>총금액</TableCell>
              <TableCell sx={{ width: 80, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.deliveryDate, fontWeight: 600 }}>배송일</TableCell>
              <TableCell sx={{ width: columnWidths.action, fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRecords.map((record, index) => (
              <TableRow
                key={record.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  backgroundColor: record.isNew ? 'action.selected' : 'inherit'
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    disabled={!canEditData(record)}
                    onChange={() => handleSelectRecord(record.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {filteredRecords.length - (page * rowsPerPage + index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {record.registrationDate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {record.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {getCodeName('GROUP039', record.customerName) || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {getCodeName('GROUP036', record.salesType)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {getCodeName('GROUP035', record.businessUnit) || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {record.modelCode || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', whiteSpace: 'nowrap' }}>
                    {record.itemCode || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      color: 'text.primary',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px'
                    }}
                  >
                    {record.itemName || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.quantity}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.unitPrice.toLocaleString()}원
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.totalAmount.toLocaleString()}원
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getCodeName('GROUP002', record.status)}
                    size="small"
                    sx={{
                      ...getStatusColor(getCodeName('GROUP002', record.status)),
                      fontSize: '13px',
                      fontWeight: 500,
                      border: 'none'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary' }}>
                    {record.deliveryDate || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEditRecord(record.id)} sx={{ color: 'primary.main' }}>
                    <Edit size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
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
                  const pageNumber = parseInt(goToPage, 10);
                  if (pageNumber >= 1 && pageNumber <= totalPages) {
                    setPage(pageNumber - 1);
                  }
                  setGoToPage('');
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
              onClick={() => {
                const pageNumber = parseInt(goToPage, 10);
                if (pageNumber >= 1 && pageNumber <= totalPages) {
                  setPage(pageNumber - 1);
                }
                setGoToPage('');
              }}
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
            {filteredRecords.length > 0
              ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredRecords.length)} of ${filteredRecords.length}`
              : '0-0 of 0'}
          </Typography>
          {totalPages > 0 && (
            <Pagination
              count={totalPages}
              page={page + 1}
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
    </Box>
  );
};

export default SalesDataTable;
