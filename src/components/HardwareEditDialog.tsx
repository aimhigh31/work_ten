'use client';

import React, { useState, useCallback, useMemo, useReducer, memo, useEffect, useRef, useImperativeHandle } from 'react';
import { useSession } from 'next-auth/react';
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
  Autocomplete,
  Pagination,
  Checkbox,
  CircularProgress
} from '@mui/material';
import QRCode from 'react-qr-code';
import Grid from '@mui/material/Grid';
import { HardwareRecord, assetCategoryOptions, assigneeOptions, currentUserOptions } from 'types/hardware';
import { useSupabaseHardwareHistory, HardwareHistory } from '../hooks/useSupabaseHardwareHistory';
import { useSupabaseHardwareUser, HardwareUserHistory } from '../hooks/useSupabaseHardwareUser';
import { useCommonData } from '../contexts/CommonDataContext';
import { useSupabaseImageUpload } from '../hooks/useSupabaseImageUpload';
import { useSupabaseFeedback } from '../hooks/useSupabaseFeedback';
import { PAGE_IDENTIFIERS, FeedbackData } from '../types/feedback';
import { useSupabaseFiles } from '../hooks/useSupabaseFiles';
import { FileData } from '../types/files';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 하드웨어 편집 상태 관리
interface HardwareEditState {
  id: string;
  no: number;
  registrationDate: string;
  code: string;
  assetCategory: string;
  assetName: string;
  assetDescription: string;
  model: string;
  manufacturer: string;
  vendor: string;
  detailSpec: string;
  status: string;
  purchaseDate: string;
  warrantyEndDate: string;
  serialNumber: string;
  currentUser: string;
  location: string;
  team: string;
  assignee: string;
  images: string[];
  image_1_url?: string;
  image_2_url?: string;
}

// 사용자 이력 인터페이스
interface UserHistory {
  id: string;
  registrationDate: string;
  userId: string;
  userName: string;
  department: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string; // GROUP044 subcode 값
}

// 구매/수리 이력 인터페이스
interface MaintenanceHistory {
  id: string;
  registrationDate: string;
  type: 'purchase' | 'repair' | 'other';
  content: string;
  vendor: string;
  amount: number;
  registrant: string;
  status: string; // GROUP002 subcode 값
  startDate: string;
  completionDate: string;
}

// 기록 인터페이스
interface HardwareLogRecord {
  id: string;
  date: string;
  author: string;
  content: string;
  type: 'info' | 'warning' | 'error';
}

// 상태 관리를 위한 reducer
const editHardwareReducer = (state: HardwareEditState, action: any): HardwareEditState => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value
      };
    case 'SET_ALL':
      return { ...action.data };
    case 'RESET':
      return action.initialState;
    case 'INIT_NEW_HARDWARE':
      return {
        ...state,
        code: action.code,
        registrationDate: action.registrationDate
      };
    default:
      return state;
  }
};

// 탭 패널 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // QR출력 탭(index 3)은 인쇄 시 표시, 나머지는 숨김
  const printStyle = index === 3 ? { '@media print': { display: 'block !important' } } : { '@media print': { display: 'none !important' } };

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`hardware-tabpanel-${index}`}
      aria-labelledby={`hardware-tab-${index}`}
      sx={printStyle}
      {...other}
    >
      {value === index && children}
    </Box>
  );
}

// 접근성 props
function a11yProps(index: number) {
  return {
    id: `hardware-tab-${index}`,
    'aria-controls': `hardware-tabpanel-${index}`
  };
}

// 개요 탭 컴포넌트
const OverviewTab = memo(
  ({
    hardwareState,
    onFieldChange,
    assignees,
    assigneeAvatars,
    statusOptions: statusOpts,
    statusColors,
    assetCategories,
    users
  }: {
    hardwareState: HardwareEditState;
    onFieldChange: (field: keyof HardwareEditState, value: string | number | string[]) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: string[];
    statusColors: Record<string, any>;
    assetCategories: string[];
    users: any[];
  }) => {
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreview, setImagePreview] = useState<string[]>([]);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const { uploadImage, uploading, error } = useSupabaseImageUpload();

    // Supabase 클라이언트 생성
    const supabaseClient = React.useMemo(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }, []);

    // DB에서 직접 가져온 마스터코드 목록 state
    const [assetCategoriesFromDB, setAssetCategoriesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog가 열릴 때 DB에서 직접 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        // GROUP018 자산분류 조회
        const { data: group018Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP018')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setAssetCategoriesFromDB(group018Data || []);

        // GROUP002 상태 조회
        const { data: group002Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP002')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setStatusTypesFromDB(group002Data || []);
      };

      fetchMasterCodeData();
    }, [supabaseClient]);

    // 기존 이미지 URL 로드
    useEffect(() => {
      const previews: string[] = [];
      if (hardwareState.image_1_url) {
        previews[0] = hardwareState.image_1_url;
      }
      if (hardwareState.image_2_url) {
        previews[1] = hardwareState.image_2_url;
      }
      if (previews.length > 0) {
        setImagePreview(previews);
      }
    }, [hardwareState.image_1_url, hardwareState.image_2_url]);

    const handleImageUpload = (index: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        console.log(`📤 이미지 ${index + 1} 선택됨:`, file.name);

        // 미리보기 먼저 표시
        const newPreviews = [...imagePreview];
        newPreviews[index] = URL.createObjectURL(file);
        setImagePreview(newPreviews);

        // Storage에 업로드
        setUploadingIndex(index);
        const uploadedUrl = await uploadImage(file, 'hardware');
        setUploadingIndex(null);

        if (uploadedUrl) {
          console.log(`✅ 이미지 ${index + 1} 업로드 성공:`, uploadedUrl);

          // 업로드된 URL을 상위 컴포넌트로 전달
          const fieldName = index === 0 ? 'image_1_url' : 'image_2_url';
          onFieldChange(fieldName, uploadedUrl);

          // 미리보기 업데이트
          const newPreviews = [...imagePreview];
          newPreviews[index] = uploadedUrl;
          setImagePreview(newPreviews);
        } else {
          console.error(`❌ 이미지 ${index + 1} 업로드 실패`);
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        }
      }
    };

    const handleImageRemove = (index: number) => {
      const newPreviews = [...imagePreview];

      if (newPreviews[index]) {
        // blob URL인 경우에만 revoke
        if (newPreviews[index].startsWith('blob:')) {
          URL.revokeObjectURL(newPreviews[index]);
        }
      }

      newPreviews[index] = '';
      setImagePreview(newPreviews);

      // 상위 컴포넌트로 빈 문자열 전달
      const fieldName = index === 0 ? 'image_1_url' : 'image_2_url';
      onFieldChange(fieldName, '');
    };

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 자산명 - 전체 너비 */}
          <TextField
            fullWidth
            label={
              <span>
                자산명 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            value={hardwareState.assetName}
            onChange={(e) => onFieldChange('assetName', e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />

          {/* 자산설명 - 전체 너비 */}
          <TextField
            fullWidth
            label="자산설명"
            multiline
            rows={3}
            value={hardwareState.assetDescription}
            onChange={(e) => onFieldChange('assetDescription', e.target.value)}
            variant="outlined"
            placeholder="자산에 대한 설명을 입력해주세요."
            InputLabelProps={{ shrink: true }}
          />

          {/* 모델-제조사-구매처 (3열) */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="모델"
              value={hardwareState.model}
              onChange={(e) => onFieldChange('model', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="제조사"
              value={hardwareState.manufacturer}
              onChange={(e) => onFieldChange('manufacturer', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={
                <span>
                  구매처 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={hardwareState.vendor}
              onChange={(e) => onFieldChange('vendor', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 자산분류-현재사용자-상태 (3열) */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                자산분류 <span style={{ color: 'red' }}>*</span>
              </InputLabel>
              <Select
                value={hardwareState.assetCategory}
                onChange={(e) => onFieldChange('assetCategory', e.target.value)}
                label="자산분류"
                displayEmpty
                notched
                renderValue={(selected) => {
                  if (!selected) return '선택';
                  const item = assetCategoriesFromDB.find(c => c.subcode === selected);
                  return item ? item.subcode_name : selected;
                }}
              >
                <MenuItem value="">선택</MenuItem>
                {assetCategoriesFromDB.map((option) => (
                  <MenuItem key={option.subcode} value={option.subcode}>
                    {option.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="현재사용자"
              value={hardwareState.currentUser}
              onChange={(e) => onFieldChange('currentUser', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={hardwareState.status}
                onChange={(e) => onFieldChange('status', e.target.value)}
                label="상태"
                notched
                renderValue={(selected) => {
                  const item = statusTypesFromDB.find(s => s.subcode === selected);
                  return item ? item.subcode_name : selected;
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

          {/* 자산위치-구매일-보증종료일 (3열) */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="자산위치"
              value={hardwareState.location}
              onChange={(e) => onFieldChange('location', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={
                <span>
                  구매일 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              type="date"
              value={hardwareState.purchaseDate}
              onChange={(e) => onFieldChange('purchaseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="보증종료일"
              type="date"
              value={hardwareState.warrantyEndDate}
              onChange={(e) => onFieldChange('warrantyEndDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Stack>

          {/* 팀-담당자 (2열) */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              value={hardwareState.team}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
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
              label="담당자"
              value={hardwareState.assignee || '담당자 미지정'}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment: hardwareState.assignee ? (
                  <Avatar
                    src={(() => {
                      console.log('🔍 [하드웨어 담당자 프로필] assignee:', hardwareState.assignee);
                      console.log('🔍 [하드웨어 담당자 프로필] users 개수:', users?.length);
                      const user = users.find((u) => u.user_name === hardwareState.assignee);
                      console.log('🔍 [하드웨어 담당자 프로필] 찾은 user:', user ? {
                        user_name: user.user_name,
                        avatar_url: user.avatar_url,
                        profile_image_url: user.profile_image_url
                      } : '없음');
                      return user?.profile_image_url || user?.avatar_url;
                    })()}
                    alt={hardwareState.assignee}
                    sx={{ width: 24, height: 24, mr: 0.5 }}
                  >
                    {hardwareState.assignee?.charAt(0)}
                  </Avatar>
                ) : null
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

          {/* 등록일-코드 (2열, 읽기 전용) */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={hardwareState.registrationDate}
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
              value={hardwareState.code}
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

          {/* 이미지 사진 등록 (최대 2장) */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              이미지 사진 등록 (최대 2장)
            </Typography>
            <Stack direction="row" spacing={2}>
              {[0, 1].map((index) => (
                <Box key={index} sx={{ flex: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id={`image-upload-${index}`}
                    type="file"
                    onChange={handleImageUpload(index)}
                  />
                  <label htmlFor={`image-upload-${index}`}>
                    <Box
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 1,
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        minHeight: 240,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': { borderColor: 'primary.main' },
                        position: 'relative'
                      }}
                    >
                      {uploadingIndex === index ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <CircularProgress />
                          <Typography variant="body2" color="text.secondary">
                            업로드 중...
                          </Typography>
                        </Box>
                      ) : imagePreview[index] ? (
                        <>
                          <img
                            src={imagePreview[index]}
                            alt={`Preview ${index + 1}`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              handleImageRemove(index);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.7)'
                              }
                            }}
                          >
                            ✕
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            이미지 {index + 1} 업로드
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            클릭하여 파일 선택
                          </Typography>
                        </>
                      )}
                    </Box>
                  </label>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }
);

// 사용자 이력 탭 컴포넌트
interface UserHistoryTabProps {
  mode: 'add' | 'edit';
  hardwareId?: string;
  userHistories: UserHistory[];
  onUserHistoriesChange: (histories: UserHistory[]) => void;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

interface UserHistoryTabRef {
  clearTempData: () => void;
}

interface MaintenanceHistoryTabRef {
  clearMaintenanceTempData: () => void;
}

const UserHistoryTab = memo(
  React.forwardRef<UserHistoryTabRef, UserHistoryTabProps>(
    ({ mode, hardwareId, userHistories: initialUserHistories, onUserHistoriesChange, canEditOwn = true, canEditOthers = true }, ref) => {
      const { getUserHistories, convertToUserHistory } = useSupabaseHardwareUser();

      // 사용자 액션 추적을 위한 ref들을 컴포넌트 최상단에 선언
      const userActionRef = useRef(false);
      const loadedRef = useRef(false);
      const initializedRef = useRef(false);
      const prevUserHistoriesRef = useRef<UserHistory[]>([]);
      const prevTempDataRef = useRef<string>('');

      // 임시저장 키 생성
      const tempStorageKey = useMemo(() => {
        return `hardware_user_history_${mode}_${hardwareId || 'new'}`;
      }, [mode, hardwareId]);

      // 로컬 사용자이력 상태 - DB 연동을 위해 초기값으로 props 사용
      const [userHistories, setUserHistories] = useState<UserHistory[]>(initialUserHistories);

      // DB에서 직접 조회한 마스터코드 데이터
      const [statusFromDB, setStatusFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

      // 하드웨어 ID가 변경되면 모든 상태 초기화
      useEffect(() => {
        console.log('🔄 하드웨어 ID 변경됨, 모든 상태 초기화:', hardwareId);
        loadedRef.current = false;
        initializedRef.current = false;
        userActionRef.current = false;
        // 편집 모드에서는 UI 초기화
        if (mode === 'edit') {
          setUserHistories([]);
        }
      }, [hardwareId, mode]);

      // DB에서 사용자이력 로드 (편집 모드인 경우)
      useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const loadUserHistories = async () => {
          // 사용자 액션 중인 경우 건너뛰기
          if (userActionRef.current) {
            console.log('⏸️ 사용자 액션 중이므로 DB 로드 건너뛰기');
            return;
          }

          if (mode === 'edit' && hardwareId && !loadedRef.current && isMounted) {
            console.log('🔍 하드웨어 사용자 이력 조회 시작:', hardwareId);
            loadedRef.current = true; // 로드 시작 표시

            try {
              const hardwareIdNum = parseInt(hardwareId);
              console.log('📞 getUserHistories 호출 전');
              const userData = await getUserHistories(hardwareIdNum);
              console.log('📞 getUserHistories 응답:', userData?.length || 0, '개');

              if (isMounted && !userActionRef.current) {
                const convertedData = userData.map(convertToUserHistory);
                console.log('🔄 DB에서 로드한 사용자이력:', convertedData.length, '개');
                console.log('📋 변환된 데이터 상세:', convertedData);

                // 상태 업데이트
                setUserHistories(convertedData);
                console.log('✅ setUserHistories 호출 완료');

                // 부모에게 알림
                onUserHistoriesChange(convertedData);
                console.log('✅ onUserHistoriesChange 호출 완료');
              }
            } catch (error) {
              if (isMounted) {
                console.warn('⚠️ 사용자이력 로드 중 오류:', error);
                setUserHistories([]);
              }
            }
          } else if (mode === 'add' && isMounted && !loadedRef.current) {
            loadedRef.current = true;
            // add 모드에서는 임시저장 데이터 복원 시도
            try {
              const tempData = localStorage.getItem(tempStorageKey);
              if (tempData) {
                const parsedData = JSON.parse(tempData);
                console.log('📋 사용자이력 임시저장 데이터 복원:', parsedData);
                setUserHistories(parsedData);
              }
            } catch (error) {
              console.warn('사용자이력 임시저장 데이터 복원 실패:', error);
            }
          }
        };

        // 약간의 지연을 주어 컴포넌트가 완전히 마운트된 후 실행
        timeoutId = setTimeout(() => {
          loadUserHistories();
        }, 100);

        return () => {
          isMounted = false;
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        };
      }, [mode, hardwareId]); // 하드웨어 ID 변경 시 다시 로드

      // GROUP044 상태 데이터 조회 (Dialog가 열릴 때마다)
      useEffect(() => {
        const fetchStatusData = async () => {
          try {
            const { data: group044Data } = await supabase
              .from('admin_mastercode_data')
              .select('subcode, subcode_name, subcode_order')
              .eq('codetype', 'subcode')
              .eq('group_code', 'GROUP044')
              .eq('is_active', true)
              .order('subcode_order', { ascending: true });

            if (group044Data) {
              setStatusFromDB(group044Data);
              console.log('✅ [UserHistoryTab] GROUP044 상태 DB 조회 완료:', group044Data.length, '개');
            }
          } catch (error) {
            console.error('❌ [UserHistoryTab] GROUP044 조회 실패:', error);
          }
        };

        fetchStatusData();
      }, []);

      // 이력 변경 시 부모 컴포넌트에 알림 - 사용자 액션에서만
      useEffect(() => {
        // 사용자 액션으로 인한 변경이고, 실제로 데이터가 변경된 경우에만 부모에게 알림
        if (userActionRef.current && JSON.stringify(userHistories) !== JSON.stringify(prevUserHistoriesRef.current)) {
          console.log('📤 부모 컴포넌트에 사용자이력 변경 알림');
          onUserHistoriesChange(userHistories);
          userActionRef.current = false;
          prevUserHistoriesRef.current = [...userHistories];
        }
      }, [userHistories]); // onUserHistoriesChange 제거하여 순환 의존성 방지

      const [selectedRows, setSelectedRows] = useState<string[]>([]);
      const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
      const [statusWarning, setStatusWarning] = useState<string>('');

      // 페이지네이션 상태
      const [currentPage, setCurrentPage] = useState(1);
      const [itemsPerPage] = useState(7);

      // 페이지네이션 계산
      const totalPages = Math.ceil(userHistories.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = userHistories.slice(startIndex, endIndex);

      // 사용자이력 임시저장 - 사용자 액션이 있을 때만 저장
      useEffect(() => {
        // 사용자 액션이 있거나 add 모드일 때만 임시저장
        if (mode === 'add' || userActionRef.current) {
          const dataString = JSON.stringify(userHistories);
          if (dataString !== prevTempDataRef.current) {
            try {
              localStorage.setItem(tempStorageKey, dataString);
              prevTempDataRef.current = dataString;
              console.log('💾 사용자이력 임시저장 완료:', userHistories.length + '개');
            } catch (error) {
              console.warn('사용자이력 임시저장 실패:', error);
            }
          }
        }
      }, [userHistories, tempStorageKey, mode]);

      // ref를 통해 임시저장 삭제 함수 노출
      React.useImperativeHandle(
        ref,
        () => ({
          clearTempData: () => {
            try {
              localStorage.removeItem(tempStorageKey);
              console.log('💾 사용자이력 임시저장 데이터 삭제 완료');
            } catch (error) {
              console.warn('사용자이력 임시저장 데이터 삭제 실패:', error);
            }
          }
        }),
        [tempStorageKey]
      );

      // 페이지 변경 핸들러 (MUI Pagination 형식에 맞게 수정)
      const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
      };

      const handleCellClick = (id: string, field: string) => {
        setEditingCell({ id, field });
      };

      const handleCellBlur = () => {
        setEditingCell(null);
      };

      const handleAddHistory = useCallback(() => {
        // "대기" 상태의 subcode 찾기
        const daegiStatus = statusFromDB.find((s) => s.subcode_name === '대기');
        const defaultStatus = daegiStatus ? daegiStatus.subcode : '';

        const newHistory: UserHistory = {
          id: Date.now().toString(),
          registrationDate: new Date().toISOString().split('T')[0],
          userId: '',
          userName: '',
          department: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          reason: '',
          status: defaultStatus
        };
        setUserHistories((prev) => {
          const newList = [newHistory, ...prev];
          console.log('📝 행 추가:', newHistory.id, '총 개수:', newList.length);
          userActionRef.current = true; // 사용자 액션 플래그 설정
          return newList;
        });
      }, [statusFromDB]);

      const handleDeleteSelected = useCallback(() => {
        setUserHistories((prev) => {
          const filtered = prev.filter((h) => !selectedRows.includes(h.id));
          console.log('🗑️ 행 삭제:', selectedRows.length, '개, 남은 개수:', filtered.length);
          userActionRef.current = true; // 사용자 액션 플래그 설정
          return filtered;
        });
        setSelectedRows([]);
      }, [selectedRows]);

      const handleEditHistory = useCallback((id: string, field: keyof UserHistory, value: string) => {
        setUserHistories((prev) => {
          // 상태를 '사용중'으로 변경하려는 경우 검증
          if (field === 'status' && value === 'active') {
            const hasActiveUser = prev.some((h) => h.id !== id && h.status === 'active');
            if (hasActiveUser) {
              setStatusWarning('이미 다른 사용자가 사용중입니다. 사용중인 항목은 하나만 선택 가능합니다.');
              setTimeout(() => setStatusWarning(''), 3000);
              return prev; // 상태 변경하지 않고 기존 상태 반환
            }
          }

          setStatusWarning('');
          const updated = prev.map((h) => (h.id === id ? { ...h, [field]: value } : h));
          console.log('✏️ 행 편집:', id, field, value);
          userActionRef.current = true; // 사용자 액션 플래그 설정
          return updated;
        });
      }, []);

      const handleSelectRow = (id: string) => {
        if (selectedRows.includes(id)) {
          setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
        } else {
          setSelectedRows([...selectedRows, id]);
        }
      };

      const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
          setSelectedRows(userHistories.map((h) => h.id));
        } else {
          setSelectedRows([]);
        }
      };

      // DB에서 가져온 상태 옵션 (subcode_name 목록, "대기"가 먼저 오도록 정렬)
      const statusOptions = useMemo(() => {
        const options = statusFromDB.map((s) => s.subcode_name);
        // "대기"를 맨 앞으로 이동
        const daegiIndex = options.indexOf('대기');
        if (daegiIndex > 0) {
          options.splice(daegiIndex, 1);
          options.unshift('대기');
        }
        return options;
      }, [statusFromDB]);

      // 상태별 색상 매핑 (동적 생성)
      const statusColors: Record<string, { bgColor: string; color: string }> = useMemo(() => {
        const colors: Record<string, { bgColor: string; color: string }> = {};
        statusFromDB.forEach((s) => {
          switch (s.subcode_name) {
            case '대기':
              colors[s.subcode_name] = { bgColor: '#F5F5F5', color: '#757575' };
              break;
            case '활성':
            case '사용중':
              colors[s.subcode_name] = { bgColor: '#E3F2FD', color: '#1976D2' };
              break;
            case '비활성':
            case '종료':
              colors[s.subcode_name] = { bgColor: '#fff8e1', color: '#f57c00' };
              break;
            case '취소':
            case '홀딩':
              colors[s.subcode_name] = { bgColor: '#FFEBEE', color: '#D32F2F' };
              break;
            default:
              colors[s.subcode_name] = { bgColor: '#F5F5F5', color: '#757575' };
          }
        });
        return colors;
      }, [statusFromDB]);

      // 컬럼 너비 및 높이 정의 (편집/읽기 모드 공통)
      const columnWidths = {
        checkbox: 50,
        no: 60,
        registrationDate: 100,
        team: 80,
        userName: 100,
        reason: 150,
        status: 120,
        startDate: 120,
        endDate: 120
      };

      const cellHeight = 56; // 고정 셀 높이

      // 편집 가능한 셀 렌더링
      const renderEditableCell = (history: UserHistory, field: string, value: string, options?: string[]) => {
        const isEditing = editingCell?.id === history.id && editingCell?.field === field;
        const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

        if (isEditing) {
          if (options) {
            // 빈 값일 경우 "대기"를 기본값으로 설정
            const displayValue = value || '대기';

            return (
              <Select
                value={displayValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // subcode_name을 subcode로 변환하여 저장
                  if (field === 'status') {
                    const statusItem = statusFromDB.find((s) => s.subcode_name === newValue);
                    const subcodeValue = statusItem ? statusItem.subcode : newValue;
                    handleEditHistory(history.id, 'status', subcodeValue);
                  } else {
                    handleEditHistory(history.id, field as keyof UserHistory, newValue);
                  }
                }}
                onBlur={handleCellBlur}
                size="small"
                autoFocus
                sx={{
                  width: fieldWidth - 16,
                  minWidth: fieldWidth - 16,
                  height: 40, // 고정 높이
                  '& .MuiSelect-select': {
                    padding: '8px 14px',
                    fontSize: '12px',
                    lineHeight: '1.4'
                  }
                }}
              >
                {options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {field === 'status' ? (
                      <Chip
                        label={option}
                        size="small"
                        sx={{
                          bgcolor: statusColors[option]?.bgColor || '#F5F5F5',
                          color: statusColors[option]?.color || '#757575',
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />
                    ) : (
                      option
                    )}
                  </MenuItem>
                ))}
              </Select>
            );
          }

          if (field === 'startDate' || field === 'endDate') {
            return (
              <TextField
                type="date"
                value={value || ''}
                onChange={(e) => handleEditHistory(history.id, field as keyof UserHistory, e.target.value)}
                onBlur={handleCellBlur}
                size="small"
                autoFocus
                InputLabelProps={{
                  shrink: true
                }}
                sx={{
                  width: fieldWidth - 16,
                  height: 40, // 고정 높이
                  '& .MuiInputBase-root': {
                    height: 40
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '12px',
                    padding: '8px 14px'
                  }
                }}
              />
            );
          }

          return (
            <TextField
              value={value}
              onChange={(e) => handleEditHistory(history.id, field as keyof UserHistory, e.target.value)}
              onBlur={handleCellBlur}
              size="small"
              autoFocus
              InputLabelProps={{ shrink: true }}
              sx={{
                width: fieldWidth - 16,
                height: 40, // 고정 높이
                '& .MuiInputBase-root': {
                  height: 40
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  padding: '8px 14px'
                }
              }}
            />
          );
        }

        // 읽기 모드
        if (field === 'status') {
          // 빈 값일 경우 "대기" 표시
          const displayValue = value || '대기';

          return (
            <Box
              sx={{
                height: 40, // 고정 높이
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <Chip
                label={displayValue || '-'}
                size="small"
                sx={{
                  bgcolor: statusColors[displayValue]?.bgColor || '#F5F5F5',
                  color: statusColors[displayValue]?.color || '#757575',
                  fontWeight: 500,
                  border: 'none',
                  '&:hover': { opacity: 0.8 },
                  fontSize: '12px'
                }}
              />
            </Box>
          );
        }

        return (
          <Box
            sx={{
              height: 40, // 고정 높이
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.50' },
              p: 0.5,
              borderRadius: 1
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px'
              }}
            >
              {value || '-'}
            </Typography>
          </Box>
        );
      };

      return (
        <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
              사용자 이력 관리
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteSelected}
                disabled={selectedRows.length === 0 || !(canEditOwn || canEditOthers)}
                size="small"
                sx={{
                  '&.Mui-disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                삭제({selectedRows.length})
              </Button>
              <Button
                variant="contained"
                onClick={handleAddHistory}
                disabled={!(canEditOwn || canEditOthers)}
                size="small"
                sx={{
                  fontSize: '12px',
                  '&.Mui-disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                추가
              </Button>
            </Box>
          </Box>

          <TableContainer
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: 800
              }
            }}
          >
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                    <Checkbox
                      checked={selectedRows.length === userHistories.length && userHistories.length > 0}
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
                  <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
                  <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
                  <TableCell sx={{ width: columnWidths.team, fontWeight: 600 }}>팀</TableCell>
                  <TableCell sx={{ width: columnWidths.userName, fontWeight: 600 }}>사용자</TableCell>
                  <TableCell sx={{ width: columnWidths.reason, fontWeight: 600 }}>사유</TableCell>
                  <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>사용상태</TableCell>
                  <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
                  <TableCell sx={{ width: columnWidths.endDate, fontWeight: 600 }}>종료일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.map((history, index) => (
                  <TableRow
                    key={history.id}
                    hover
                    sx={{
                      height: cellHeight,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                      <Checkbox
                        checked={selectedRows.includes(history.id)}
                        onChange={() => handleSelectRow(history.id)}
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
                    <TableCell sx={{ width: columnWidths.no }}>{userHistories.length - startIndex - index}</TableCell>
                    <TableCell sx={{ width: columnWidths.registrationDate }}>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {history.registrationDate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: columnWidths.team }} onClick={() => handleCellClick(history.id, 'department')}>
                      {renderEditableCell(history, 'department', history.department)}
                    </TableCell>
                    <TableCell sx={{ width: columnWidths.userName }} onClick={() => handleCellClick(history.id, 'userName')}>
                      {renderEditableCell(history, 'userName', history.userName)}
                    </TableCell>
                    <TableCell sx={{ width: columnWidths.reason }} onClick={() => handleCellClick(history.id, 'reason')}>
                      {renderEditableCell(history, 'reason', history.reason)}
                    </TableCell>
                    <TableCell sx={{ width: columnWidths.status }} onClick={() => handleCellClick(history.id, 'status')}>
                      {(() => {
                        // subcode를 subcode_name으로 변환 (빈 값이면 "대기")
                        let statusName = history.status ? statusFromDB.find((s) => s.subcode === history.status)?.subcode_name : '';
                        if (!statusName) {
                          statusName = '대기';
                        }
                        return renderEditableCell(history, 'status', statusName, statusOptions);
                      })()}
                    </TableCell>
                    <TableCell sx={{ width: columnWidths.startDate }} onClick={() => handleCellClick(history.id, 'startDate')}>
                      {renderEditableCell(history, 'startDate', history.startDate)}
                    </TableCell>
                    <TableCell sx={{ width: columnWidths.endDate }} onClick={() => handleCellClick(history.id, 'endDate')}>
                      {renderEditableCell(history, 'endDate', history.endDate)}
                    </TableCell>
                  </TableRow>
                ))}
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
              px: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              position: 'sticky',
              bottom: 0
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {userHistories.length > 0
                ? `${startIndex + 1}-${Math.min(endIndex, userHistories.length)} of ${userHistories.length}`
                : '0-0 of 0'}
            </Typography>
            {totalPages > 1 && (
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

          {/* 경고 메시지 */}
          {statusWarning && (
            <Alert
              severity="warning"
              sx={{
                mt: 2,
                mx: 3,
                mb: 2,
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              {statusWarning}
            </Alert>
          )}
        </Box>
      );
    }
  )
);

// useImperativeHandle을 사용하여 ref 함수 노출
UserHistoryTab.displayName = 'UserHistoryTab';

// 구매/수리 이력 탭 컴포넌트
const MaintenanceHistoryTab = memo(
  React.forwardRef<
    MaintenanceHistoryTabRef,
    {
      hardwareId: number;
      mode: 'add' | 'edit';
      maintenanceHistories: MaintenanceHistory[];
      onMaintenanceHistoriesChange: (histories: MaintenanceHistory[]) => void;
      canEditOwn?: boolean;
      canEditOthers?: boolean;
    }
  >(({ hardwareId, mode, maintenanceHistories: initialHistories, onMaintenanceHistoriesChange, canEditOwn = true, canEditOthers = true }, ref) => {
    const { getMaintenanceHistories, convertToMaintenanceHistory } = useSupabaseHardwareHistory();

    // 사용자 액션 추적을 위한 ref들을 컴포넌트 최상단에 선언
    const userActionRef = useRef(false);
    const loadedRef = useRef(false);
    const initializedRef = useRef(false);
    const prevMaintenanceHistoriesRef = useRef<MaintenanceHistory[]>([]);
    const prevTempDataRef = useRef<string>('');

    // 임시저장 키 생성
    const tempMaintenanceKey = useMemo(() => {
      return `hardware_maintenance_history_${mode}_${hardwareId || 'new'}`;
    }, [mode, hardwareId]);

    // 로컬 구매/수리이력 상태 - DB 연동을 위해 초기값으로 props 사용
    const [maintenanceHistories, setMaintenanceHistories] = useState<MaintenanceHistory[]>(initialHistories);

    // DB에서 직접 조회한 마스터코드 데이터
    const [statusFromDB, setStatusFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // 하드웨어 ID가 변경되면 모든 상태 초기화
    useEffect(() => {
      console.log('🔄 하드웨어 ID 변경됨, 모든 상태 초기화:', hardwareId);
      loadedRef.current = false;
      initializedRef.current = false;
      userActionRef.current = false;
      // 편집 모드에서는 UI 초기화
      if (mode === 'edit') {
        setMaintenanceHistories([]);
      }
    }, [hardwareId, mode]);

    // DB에서 구매/수리이력 로드 (편집 모드인 경우)
    useEffect(() => {
      let isMounted = true;
      let timeoutId: NodeJS.Timeout;

      const loadMaintenanceHistories = async () => {
        // 사용자 액션 중인 경우 건너뛰기
        if (userActionRef.current) {
          console.log('⏸️ 사용자 액션 중이므로 DB 로드 건너뛰기');
          return;
        }

        if (mode === 'edit' && hardwareId && !loadedRef.current && isMounted) {
          console.log('🔍 하드웨어 구매/수리 이력 조회 시작:', hardwareId);
          loadedRef.current = true; // 로드 시작 표시

          try {
            console.log('📞 getMaintenanceHistories 호출 전');
            const historyData = await getMaintenanceHistories(hardwareId);
            console.log('📞 getMaintenanceHistories 응답:', historyData?.length || 0, '개');

            if (isMounted && !userActionRef.current) {
              const convertedData = historyData.map(convertToMaintenanceHistory);
              console.log('🔄 DB에서 로드한 구매/수리이력:', convertedData.length, '개');
              console.log('📋 변환된 데이터 상세:', convertedData);

              // 상태 업데이트
              setMaintenanceHistories(convertedData);
              console.log('✅ setMaintenanceHistories 호출 완료');

              // 부모에게 알림
              onMaintenanceHistoriesChange(convertedData);
              console.log('✅ onMaintenanceHistoriesChange 호출 완료');
            }
          } catch (error) {
            if (isMounted) {
              console.warn('⚠️ 구매/수리이력 로드 중 오류:', error);
              setMaintenanceHistories([]);
            }
          }
        } else if (mode === 'add' && isMounted && !loadedRef.current) {
          loadedRef.current = true;
          // add 모드에서는 임시저장 데이터 복원 시도
          try {
            const tempData = localStorage.getItem(tempStorageKey);
            if (tempData) {
              const parsedData = JSON.parse(tempData);
              console.log('📋 구매/수리이력 임시저장 데이터 복원:', parsedData);
              setMaintenanceHistories(parsedData);
            }
          } catch (error) {
            console.warn('구매/수리이력 임시저장 데이터 복원 실패:', error);
          }
        }
      };

      // 약간의 지연을 주어 컴포넌트가 완전히 마운트된 후 실행
      timeoutId = setTimeout(() => {
        loadMaintenanceHistories();
      }, 100);

      return () => {
        isMounted = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [mode, hardwareId]); // 하드웨어 ID 변경 시 다시 로드

    // GROUP002 상태 데이터 조회 (Dialog가 열릴 때마다)
    useEffect(() => {
      const fetchStatusData = async () => {
        try {
          const { data: group002Data } = await supabase
            .from('admin_mastercode_data')
            .select('subcode, subcode_name, subcode_order')
            .eq('codetype', 'subcode')
            .eq('group_code', 'GROUP002')
            .eq('is_active', true)
            .order('subcode_order', { ascending: true });

          if (group002Data) {
            setStatusFromDB(group002Data);
            console.log('✅ [MaintenanceHistoryTab] GROUP002 상태 DB 조회 완료:', group002Data.length, '개');
          }
        } catch (error) {
          console.error('❌ [MaintenanceHistoryTab] GROUP002 조회 실패:', error);
        }
      };

      fetchStatusData();
    }, []);

    // 이력 변경 시 부모 컴포넌트에 알림 - 사용자 액션에서만
    useEffect(() => {
      // 사용자 액션으로 인한 변경이고, 실제로 데이터가 변경된 경우에만 부모에게 알림
      if (userActionRef.current && JSON.stringify(maintenanceHistories) !== JSON.stringify(prevMaintenanceHistoriesRef.current)) {
        console.log('📤 부모 컴포넌트에 구매/수리이력 변경 알림');
        onMaintenanceHistoriesChange(maintenanceHistories);
        userActionRef.current = false;
        prevMaintenanceHistoriesRef.current = [...maintenanceHistories];
      }
    }, [maintenanceHistories]); // onMaintenanceHistoriesChange 제거하여 순환 의존성 방지

    // 구매/수리이력 임시저장 - 사용자 액션이 있을 때만 저장
    useEffect(() => {
      // 사용자 액션이 있거나 add 모드일 때만 임시저장
      if (userActionRef.current || mode === 'add') {
        try {
          if (maintenanceHistories.length > 0) {
            localStorage.setItem(tempMaintenanceKey, JSON.stringify(maintenanceHistories));
            console.log('💾 구매/수리이력 임시저장 완료:', maintenanceHistories.length + '개');
          }
        } catch (error) {
          console.warn('구매/수리이력 임시저장 실패:', error);
        }
      }
    }, [maintenanceHistories, tempMaintenanceKey, mode]);

    // ref를 통해 임시저장 삭제 함수 노출
    useImperativeHandle(
      ref,
      () => ({
        ...((ref as any)?.current || {}),
        clearMaintenanceTempData: () => {
          try {
            localStorage.removeItem(tempMaintenanceKey);
            console.log('💾 구매/수리이력 임시저장 데이터 삭제 완료');
          } catch (error) {
            console.warn('구매/수리이력 임시저장 데이터 삭제 실패:', error);
          }
        }
      }),
      [tempMaintenanceKey]
    );

    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    // 페이지네이션 계산
    const totalPages = Math.ceil(maintenanceHistories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = maintenanceHistories.slice(startIndex, endIndex);

    // 페이지 변경 핸들러 (MUI Pagination 형식에 맞게 수정)
    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
    };

    const handleCellClick = (id: string, field: string) => {
      setEditingCell({ id, field });
    };

    const handleCellBlur = () => {
      setEditingCell(null);
    };

    const handleAddHistory = () => {
      // 기본 상태로 "대기" 또는 "예비" 찾기
      const defaultStatusItem = statusFromDB.find((s) => s.subcode_name === '대기' || s.subcode_name === '예비');
      const defaultStatus = defaultStatusItem ? defaultStatusItem.subcode : '';

      const newHistory: MaintenanceHistory = {
        id: Date.now().toString(),
        registrationDate: new Date().toISOString().split('T')[0],
        type: 'purchase',
        content: '',
        vendor: '',
        amount: 0,
        registrant: '',
        status: defaultStatus,
        startDate: new Date().toISOString().split('T')[0],
        completionDate: ''
      };
      setMaintenanceHistories((prev) => {
        const newList = [newHistory, ...prev];
        userActionRef.current = true; // 사용자 액션 플래그 설정
        return newList;
      });
    };

    const handleDeleteSelected = () => {
      setMaintenanceHistories((prev) => {
        const newList = prev.filter((h) => !selectedRows.includes(h.id));
        userActionRef.current = true; // 사용자 액션 플래그 설정
        return newList;
      });
      setSelectedRows([]);
    };

    const handleEditHistory = (id: string, field: keyof MaintenanceHistory, value: string | number) => {
      setMaintenanceHistories((prev) => {
        const newList = prev.map((h) => (h.id === id ? { ...h, [field]: value } : h));
        userActionRef.current = true; // 사용자 액션 플래그 설정
        return newList;
      });
    };

    const handleSelectRow = (id: string) => {
      if (selectedRows.includes(id)) {
        setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      } else {
        setSelectedRows([...selectedRows, id]);
      }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        setSelectedRows(maintenanceHistories.map((h) => h.id));
      } else {
        setSelectedRows([]);
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'purchase':
          return { backgroundColor: '#E3F2FD', color: '#000000' }; // 파스텔 블루
        case 'repair':
          return { backgroundColor: '#FFEBEE', color: '#000000' }; // 파스텔 레드
        case 'other':
          return { backgroundColor: '#F3E5F5', color: '#000000' }; // 파스텔 퍼플
        default:
          return { backgroundColor: '#F5F5F5', color: '#000000' }; // 연한 그레이
      }
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'purchase':
          return '구매';
        case 'repair':
          return '수리';
        case 'other':
          return '기타';
        default:
          return type;
      }
    };

    const typeOptions = ['구매', '수리', '기타'];

    // DB에서 가져온 상태 옵션 (subcode_name 목록)
    const statusOptions = useMemo(() => statusFromDB.map((s) => s.subcode_name), [statusFromDB]);

    // 상태별 색상 매핑 (동적 생성) - Material-UI color
    const statusColors: Record<string, string> = useMemo(() => {
      const colors: Record<string, string> = {};
      statusFromDB.forEach((s) => {
        switch (s.subcode_name) {
          case '대기':
          case '예비':
            colors[s.subcode_name] = 'warning';
            break;
          case '진행':
          case '진행중':
          case '사용중':
            colors[s.subcode_name] = 'info';
            break;
          case '완료':
          case '보관':
            colors[s.subcode_name] = 'success';
            break;
          case '취소':
          case '폐기':
            colors[s.subcode_name] = 'error';
            break;
          default:
            colors[s.subcode_name] = 'default';
        }
      });
      return colors;
    }, [statusFromDB]);

    // 상태별 배경/글자 색상 (Chip용)
    const getStatusColor = useCallback(
      (status: string) => {
        const statusItem = statusFromDB.find((s) => s.subcode === status || s.subcode_name === status);
        const statusName = statusItem ? statusItem.subcode_name : status;

        switch (statusName) {
          case '대기':
          case '예비':
            return { backgroundColor: '#F5F5F5', color: '#757575' };
          case '진행':
          case '진행중':
          case '사용중':
            return { backgroundColor: '#E3F2FD', color: '#1976D2' };
          case '완료':
          case '보관':
            return { backgroundColor: '#E8F5E9', color: '#388E3C' };
          case '취소':
          case '폐기':
          case '홀딩':
            return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
          default:
            return { backgroundColor: '#F5F5F5', color: '#757575' };
        }
      },
      [statusFromDB]
    );

    // 컬럼 너비 및 높이 정의 (편집/읽기 모드 공통)
    const columnWidths = {
      checkbox: 50,
      no: 60,
      registrationDate: 100,
      type: 100,
      content: 180,
      vendor: 120,
      amount: 120,
      registrant: 80,
      status: 120,
      startDate: 120,
      completionDate: 120
    };

    const cellHeight = 56; // 고정 셀 높이

    // 편집 가능한 셀 렌더링
    const renderEditableCell = (history: MaintenanceHistory, field: string, value: string | number, options?: string[]) => {
      const isEditing = editingCell?.id === history.id && editingCell?.field === field;
      const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

      if (isEditing) {
        if (options) {
          return (
            <Select
              value={field === 'type' ? getTypeLabel(history.type) : value}
              onChange={(e) => {
                const newValue = e.target.value;
                if (field === 'type') {
                  const newType = newValue === '구매' ? 'purchase' : 'repair';
                  handleEditHistory(history.id, 'type', newType);
                } else if (field === 'status') {
                  // subcode_name을 subcode로 변환하여 저장
                  const statusItem = statusFromDB.find((s) => s.subcode_name === newValue);
                  const subcodeValue = statusItem ? statusItem.subcode : newValue;
                  handleEditHistory(history.id, 'status', subcodeValue);
                } else {
                  handleEditHistory(history.id, field as keyof MaintenanceHistory, newValue);
                }
              }}
              onBlur={handleCellBlur}
              size="small"
              autoFocus
              sx={{
                width: fieldWidth - 16,
                minWidth: fieldWidth - 16,
                height: 40, // 고정 높이
                '& .MuiSelect-select': {
                  padding: '8px 14px',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }
              }}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {field === 'status' ? (
                    <Chip
                      label={option}
                      size="small"
                      sx={{
                        ...getStatusColor(option),
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  ) : (
                    option
                  )}
                </MenuItem>
              ))}
            </Select>
          );
        }

        if (field === 'date' || field === 'startDate' || field === 'completionDate' || field === 'registrationDate') {
          return (
            <TextField
              type="date"
              value={(value as string) || ''}
              onChange={(e) => handleEditHistory(history.id, field as keyof MaintenanceHistory, e.target.value)}
              onBlur={handleCellBlur}
              size="small"
              autoFocus
              InputLabelProps={{
                shrink: true
              }}
              sx={{
                width: fieldWidth - 16,
                height: 40, // 고정 높이
                '& .MuiInputBase-root': {
                  height: 40
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  padding: '8px 14px'
                }
              }}
            />
          );
        }

        if (field === 'amount' || field === 'cost') {
          return (
            <TextField
              type="number"
              value={value as number}
              onChange={(e) => handleEditHistory(history.id, field as keyof MaintenanceHistory, Number(e.target.value))}
              onBlur={handleCellBlur}
              size="small"
              autoFocus
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    원
                  </Typography>
                )
              }}
              sx={{
                width: fieldWidth - 16,
                height: 40, // 고정 높이
                '& .MuiInputBase-root': {
                  height: 40
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  padding: '8px 14px'
                }
              }}
            />
          );
        }

        return (
          <TextField
            value={value as string}
            onChange={(e) => handleEditHistory(history.id, field as keyof MaintenanceHistory, e.target.value)}
            onBlur={handleCellBlur}
            size="small"
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{
              width: fieldWidth - 16,
              height: 40, // 고정 높이
              '& .MuiInputBase-root': {
                height: 40
              },
              '& .MuiInputBase-input': {
                fontSize: '12px',
                padding: '8px 14px'
              }
            }}
          />
        );
      }

      // 읽기 모드
      if (field === 'type') {
        return (
          <Box
            sx={{
              height: 40, // 고정 높이
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.50' },
              p: 0.5,
              borderRadius: 1
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px'
              }}
            >
              {getTypeLabel(history.type)}
            </Typography>
          </Box>
        );
      }

      if (field === 'status') {
        return (
          <Box
            sx={{
              height: 40, // 고정 높이
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <Chip
              label={value as string}
              size="small"
              sx={{
                ...getStatusColor(value as string),
                '&:hover': { opacity: 0.8 },
                fontSize: '12px',
                fontWeight: 500
              }}
            />
          </Box>
        );
      }

      if (field === 'amount' || field === 'cost') {
        return (
          <Box
            sx={{
              height: 40, // 고정 높이
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.50' },
              p: 0.5,
              borderRadius: 1
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px'
              }}
            >
              {(value as number).toLocaleString()}원
            </Typography>
          </Box>
        );
      }

      return (
        <Box
          sx={{
            height: 40, // 고정 높이
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'grey.50' },
            p: 0.5,
            borderRadius: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px'
            }}
          >
            {value || '-'}
          </Typography>
        </Box>
      );
    };

    return (
      <Box sx={{ height: '650px', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            구매/수리 이력
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteSelected}
              disabled={selectedRows.length === 0 || !(canEditOwn || canEditOthers)}
              size="small"
              sx={{
                '&.Mui-disabled': {
                  borderColor: 'grey.300',
                  color: 'grey.500'
                }
              }}
            >
              취소({selectedRows.length})
            </Button>
            <Button
              variant="contained"
              onClick={handleAddHistory}
              disabled={!(canEditOwn || canEditOthers)}
              size="small"
              sx={{
                fontSize: '12px',
                '&.Mui-disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500'
                }
              }}
            >
              추가
            </Button>
          </Box>
        </Box>

        <TableContainer
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: 1000
            }
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <Checkbox
                    checked={selectedRows.length === maintenanceHistories.length && maintenanceHistories.length > 0}
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
                <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
                <TableCell sx={{ width: columnWidths.registrationDate, fontWeight: 600 }}>등록일</TableCell>
                <TableCell sx={{ width: columnWidths.type, fontWeight: 600 }}>구매/수리</TableCell>
                <TableCell sx={{ width: columnWidths.content, fontWeight: 600 }}>내용</TableCell>
                <TableCell sx={{ width: columnWidths.vendor, fontWeight: 600 }}>업체</TableCell>
                <TableCell sx={{ width: columnWidths.amount, fontWeight: 600 }}>금액</TableCell>
                <TableCell sx={{ width: columnWidths.registrant, fontWeight: 600 }}>등록자</TableCell>
                <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
                <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
                <TableCell sx={{ width: columnWidths.completionDate, fontWeight: 600 }}>완료일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentItems.map((history, index) => (
                <TableRow
                  key={history.id}
                  hover
                  sx={{
                    height: cellHeight,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                    <Checkbox
                      checked={selectedRows.includes(history.id)}
                      onChange={() => handleSelectRow(history.id)}
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
                  <TableCell sx={{ width: columnWidths.no }}>{maintenanceHistories.length - startIndex - index}</TableCell>
                  <TableCell sx={{ width: columnWidths.registrationDate }}>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      {history.registrationDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.type }} onClick={() => handleCellClick(history.id, 'type')}>
                    {renderEditableCell(history, 'type', getTypeLabel(history.type), typeOptions)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.content }} onClick={() => handleCellClick(history.id, 'content')}>
                    {renderEditableCell(history, 'content', history.content)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.vendor }} onClick={() => handleCellClick(history.id, 'vendor')}>
                    {renderEditableCell(history, 'vendor', history.vendor)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.amount }} onClick={() => handleCellClick(history.id, 'amount')}>
                    {renderEditableCell(history, 'amount', history.amount)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.registrant }} onClick={() => handleCellClick(history.id, 'registrant')}>
                    {renderEditableCell(history, 'registrant', history.registrant)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.status }} onClick={() => handleCellClick(history.id, 'status')}>
                    {(() => {
                      // subcode를 subcode_name으로 변환
                      const statusName = statusFromDB.find((s) => s.subcode === history.status)?.subcode_name || history.status;
                      return renderEditableCell(history, 'status', statusName, statusOptions);
                    })()}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.startDate }} onClick={() => handleCellClick(history.id, 'startDate')}>
                    {renderEditableCell(history, 'startDate', history.startDate)}
                  </TableCell>
                  <TableCell sx={{ width: columnWidths.completionDate }} onClick={() => handleCellClick(history.id, 'completionDate')}>
                    {renderEditableCell(history, 'completionDate', history.completionDate)}
                  </TableCell>
                </TableRow>
              ))}
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
            px: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'sticky',
            bottom: 0
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {maintenanceHistories.length > 0
              ? `${startIndex + 1}-${Math.min(endIndex, maintenanceHistories.length)} of ${maintenanceHistories.length}`
              : '0-0 of 0'}
          </Typography>
          {totalPages > 1 && (
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
  })
);

// displayName 설정
MaintenanceHistoryTab.displayName = 'MaintenanceHistoryTab';

// QR 출력 탭 컴포넌트
const QROutputTab = memo(({ hardwareState }: { hardwareState: HardwareEditState }) => {
  const [layoutScale, setLayoutScale] = useState(1); // 전체 레이아웃 스케일
  const [labelText, setLabelText] = useState('하드웨어 자산라벨'); // QR 하단 제목 텍스트
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // QR 코드에 포함될 데이터 - 자산코드만 포함
  const qrData = hardwareState.code;

  // 전체 레이아웃 크기 계산
  const baseQRSize = 150;
  const baseLayoutWidth = 450;
  const baseLayoutHeight = 250;

  const scaledQRSize = Math.round(baseQRSize * layoutScale);
  const scaledLayoutWidth = Math.round(baseLayoutWidth * layoutScale);
  const scaledLayoutHeight = Math.round(baseLayoutHeight * layoutScale);

  // 스케일에 비례한 텍스트 크기 계산
  const getTextSize = (baseSize: number) => {
    return Math.round(baseSize * layoutScale);
  };

  return (
    <Box
      sx={{
        height: '650px',
        overflowY: 'auto',
        p: 3,
        '@media print': {
          height: 'auto',
          overflow: 'visible',
          p: 0
        }
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          mb: 3,
          '@media print': {
            display: 'none'
          }
        }}
      >
        QR 코드 출력
      </Typography>

      <Grid container spacing={3}>
        {/* 왼쪽: 출력 설정 영역 */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            '@media print': {
              display: 'none'
            }
          }}
        >
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  출력 설정
                </Typography>

                {/* 제목 설정 */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    제목 설정
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    placeholder="하드웨어 자산라벨"
                    variant="outlined"
                  />
                </Box>

                {/* 출력 사이즈 */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    출력 사이즈: {Math.round(layoutScale * 100)}% (전체 {scaledLayoutWidth}×{scaledLayoutHeight}px)
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={layoutScale}
                      onChange={(e) => setLayoutScale(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    * 외곽 테두리를 포함한 전체 레이아웃 크기가 조절됩니다 (50%~200%)
                  </Typography>
                </Box>

                <Button variant="contained" onClick={handlePrint} fullWidth>
                  QR 코드 출력
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 오른쪽: QR 코드 미리보기 */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{
            '@media print': {
              display: 'block',
              width: '100%',
              maxWidth: 'none'
            }
          }}
        >
          <Card
            sx={{
              '@media print': {
                boxShadow: 'none',
                border: 'none'
              }
            }}
          >
            <CardContent
              sx={{
                '@media print': {
                  p: 0
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, '@media print': { display: 'none' } }}>
                QR 코드 미리보기
              </Typography>

              {/* 출력될 QR 코드 영역 */}
              <Box
                ref={printRef}
                sx={{
                  '@media print': {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${layoutScale})`,
                    width: 'auto',
                    height: 'auto'
                  }
                }}
              >
                <Box
                  sx={{
                    border: '2px solid #333',
                    borderRadius: '2px',
                    padding: '3px',
                    backgroundColor: 'white',
                    width: baseLayoutWidth,
                    height: baseLayoutHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    '@media print': {
                      margin: 0,
                      padding: `${Math.round(20 * layoutScale)}px`,
                      border: `${Math.round(2 * layoutScale)}px solid #000`
                    }
                  }}
                >
                  <Stack direction="row" spacing={4} alignItems="flex-start" sx={{ flex: 1 }}>
                    {/* QR 코드 영역 */}
                    <Box
                      sx={{
                        flex: '0 0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        height: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: baseQRSize,
                          height: baseQRSize,
                          padding: '2px',
                          backgroundColor: 'white',
                          borderRadius: '1px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <QRCode
                          value={qrData}
                          size={baseQRSize - 16}
                          level="M"
                          style={{
                            height: 'auto',
                            maxWidth: '100%',
                            width: '100%'
                          }}
                        />
                      </Box>
                      {/* QR 코드 아래 자산코드 표시 */}
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: '#333',
                          textAlign: 'center',
                          mt: 1
                        }}
                      >
                        {hardwareState.code || ''}
                      </Typography>
                    </Box>

                    {/* 하드웨어 정보 영역 */}
                    <Box
                      sx={{
                        flex: 1,
                        pl: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Stack spacing={0.8}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '24px',
                            lineHeight: 1.1,
                            mb: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {hardwareState.assetName || '자산명'}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '16px',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          자산분류 : {hardwareState.assetCategory || '-'}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '16px',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          자산코드 : {hardwareState.code || '-'}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '16px',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          시리얼넘버 : {hardwareState.serialNumber || '-'}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '16px',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          구매일 : {hardwareState.purchaseDate || '-'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  {/* 하드웨어 자산라벨 - 네모박스 하단 중앙 */}
                  <Typography
                    sx={{
                      fontSize: '11px',
                      color: '#666',
                      textAlign: 'center',
                      mt: 0.5,
                      pt: 0.8
                    }}
                  >
                    {labelText}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});

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
  } = useSupabaseFiles(PAGE_IDENTIFIERS.HARDWARE, recordId);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialText, setEditingMaterialText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = event.target.files;
      if (!uploadedFiles || uploadedFiles.length === 0) return;

      // recordId가 없으면 업로드 불가
      if (!recordId) {
        alert('파일을 업로드하려면 먼저 하드웨어를 저장해주세요.');
        return;
      }

      // 각 파일을 순차적으로 업로드
      for (const file of Array.from(uploadedFiles)) {
        const result = await uploadFile(file, {
          page: PAGE_IDENTIFIERS.HARDWARE,
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

// 메인 다이얼로그 컴포넌트
interface HardwareDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<HardwareRecord>) => void;
  data?: HardwareRecord | null;
  mode: 'add' | 'edit';
  statusOptions?: string[];
  statusColors?: Record<string, any>;
  canCreateData?: boolean;
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

export default function HardwareDialog({
  open,
  onClose,
  onSave,
  data,
  mode,
  statusOptions: propStatusOptions,
  statusColors: propStatusColors,
  canCreateData = true,
  canEditOwn = true,
  canEditOthers = true
}: HardwareDialogProps) {
  const [value, setValue] = useState(0);
  const [validationError, setValidationError] = useState('');

  // data props 확인
  React.useEffect(() => {
    if (data) {
      console.log('🔍 HardwareDialog - data props:', {
        assetName: data.assetName,
        assetDescription: data.assetDescription
      });
    }
  }, [data]);

  // 세션 정보
  const { data: session } = useSession();

  // ✅ 공용 창고에서 사용자 데이터와 마스터코드 가져오기
  const { users, masterCodes } = useCommonData();

  console.log('🔍 HardwareDialog - masterCodes 전체:', masterCodes?.length, '개');

  // 현재 로그인한 사용자 정보
  const currentUser = React.useMemo(() => {
    console.log('🔍 HardwareDialog - session:', session?.user?.email);
    console.log('🔍 HardwareDialog - users 개수:', users.length);
    if (!session?.user?.email || users.length === 0) return null;
    const found = users.find((u) => u.email === session.user.email);
    console.log('🔍 HardwareDialog - currentUser:', found ? found.user_name : '없음');
    return found;
  }, [session, users]);

  const currentUserCode = currentUser?.user_code || '';

  // 🔐 권한 체크: 데이터 소유자 확인
  const isOwner = React.useMemo(() => {
    if (!data || mode === 'add') return true; // 신규 생성인 경우 true
    const currentUserName = currentUser?.user_name;
    // HardwareData는 createdBy와 assignee 둘 다 체크
    const hardwareData = data as any; // HardwareData로 타입 캐스팅
    const isOwnerResult =
      hardwareData.createdBy === currentUserName ||
      hardwareData.assignee === currentUserName ||
      data.assignee === currentUserName;
    return isOwnerResult;
  }, [data, mode, currentUser]);

  // 활성화된 사용자 목록
  const activeUsers = React.useMemo(() => {
    const filtered = users.filter((user) => user.is_active && user.status === 'active');
    console.log('🔍 HardwareDialog - activeUsers 개수:', filtered.length);
    return filtered;
  }, [users]);

  // DB 훅들
  const { saveUserHistories } = useSupabaseHardwareUser();
  const { saveMaintenanceHistories } = useSupabaseHardwareHistory();

  // 피드백 훅
  const {
    feedbacks,
    loading: feedbackLoading,
    error: feedbackError,
    addFeedback,
    updateFeedback,
    deleteFeedback
  } = useSupabaseFeedback(PAGE_IDENTIFIERS.HARDWARE, data?.id?.toString());

  // 🔄 임시 저장: 로컬 state로 기록 관리
  const [pendingFeedbacks, setPendingFeedbacks] = useState<FeedbackData[]>([]);
  const [initialFeedbacks, setInitialFeedbacks] = useState<FeedbackData[]>([]);

  // 초기화 여부를 추적 (무한 루프 방지)
  const feedbacksInitializedRef = useRef(false);
  const feedbacksRef = useRef<FeedbackData[]>([]);

  // 구매/수리 이력 상태 관리
  const [maintenanceHistories, setMaintenanceHistories] = useState<MaintenanceHistory[]>([]);

  // 사용자이력 상태 관리
  const [userHistories, setUserHistories] = useState<UserHistory[]>([]);

  // feedbacks를 ref에 저장 (dependency 문제 방지)
  useEffect(() => {
    feedbacksRef.current = feedbacks;
  }, [feedbacks]);

  // DB에서 가져온 feedbacks를 pendingFeedbacks로 초기화
  useEffect(() => {
    if (open && data?.id && !feedbacksInitializedRef.current) {
      // feedbacks 데이터가 로드될 때까지 기다렸다가 초기화
      if (feedbacks.length > 0) {
        setPendingFeedbacks(feedbacks);
        setInitialFeedbacks(feedbacks);
        feedbacksInitializedRef.current = true;
        console.log('✅ 하드웨어관리 기록 초기화:', feedbacks.length, '개');
      }
    }

    // 다이얼로그 닫힐 때 초기화 플래그 리셋
    if (!open) {
      feedbacksInitializedRef.current = false;
      setPendingFeedbacks([]);
      setInitialFeedbacks([]);
    }
  }, [open, data?.id, feedbacks]);

  // 코멘트 상태 - pendingFeedbacks에서 변환
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
        position: feedback.user_position || feedbackUser?.position || '',
        role: feedback.metadata?.role || feedbackUser?.role || ''
      };
    });
  }, [pendingFeedbacks, users]);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // UserHistoryTab ref
  const userHistoryTabRef = useRef<UserHistoryTabRef>(null);
  const maintenanceHistoryTabRef = useRef<MaintenanceHistoryTabRef>(null);

  // 임시저장 키 생성
  const tempStorageKey = useMemo(() => {
    return `hardware_temp_${mode}_${data?.id || 'new'}`;
  }, [mode, data?.id]);

  // 코드 자동 생성 함수 (IT-HW-YY-NNN 형식)
  const generateHardwareCode = useCallback(async () => {
    const currentYear = new Date().getFullYear();
    const currentYearStr = currentYear.toString().slice(-2); // 연도 뒤 2자리

    try {
      // Supabase에서 현재 연도의 최대 일련번호 조회
      const { data: codeData, error } = await supabase
        .from('it_hardware_data')
        .select('code')
        .like('code', `IT-HW-${currentYearStr}-%`)
        .order('code', { ascending: false })
        .limit(1);

      let nextSequence = 1;

      if (codeData && codeData.length > 0 && codeData[0].code) {
        // 기존 코드에서 일련번호 추출 (IT-HW-25-001 -> 001)
        const lastCode = codeData[0].code;
        const sequencePart = lastCode.split('-')[3];
        if (sequencePart) {
          nextSequence = parseInt(sequencePart) + 1;
        }
      }

      // 일련번호를 3자리로 포맷 (001, 002, ...)
      const formattedSequence = nextSequence.toString().padStart(3, '0');

      return `IT-HW-${currentYearStr}-${formattedSequence}`;
    } catch (error) {
      console.error('❌ 코드 생성 중 오류:', error);
      // 오류 시 임시 코드 생성
      const sequence = String(Date.now()).slice(-3);
      return `IT-HW-${currentYearStr}-${sequence}`;
    }
  }, []);

  // 현재 날짜 생성 함수
  const getCurrentDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  }, []);

  // 초기 상태 (임시저장 데이터 확인)
  const getInitialState = (): HardwareEditState => {
    const baseState = {
      id: data?.id || '',
      no: data?.no || 0,
      registrationDate: data?.registrationDate || new Date().toISOString().split('T')[0],
      code: data?.code || '',
      assetCategory: data?.assetCategory || '',
      assetName: data?.assetName || '',
      assetDescription: data?.assetDescription || '',
      model: data?.model || '',
      manufacturer: data?.manufacturer || '',
      vendor: data?.vendor || '',
      detailSpec: data?.detailSpec || '',
      status: data?.status || '대기',
      purchaseDate: data?.purchaseDate || '',
      warrantyEndDate: data?.warrantyEndDate || '',
      serialNumber: data?.serialNumber || '',
      currentUser: data?.currentUser || '',
      location: data?.location || '',
      team: data?.team || '',
      assignee: data?.assignee || '',
      images: data?.images || [],
      image_1_url: (data as any)?.image_1_url || '',
      image_2_url: (data as any)?.image_2_url || ''
    };

    // 편집 모드가 아니고 임시저장 데이터가 있으면 복원
    if (mode === 'add') {
      try {
        const tempData = localStorage.getItem(tempStorageKey);
        if (tempData) {
          const parsedData = JSON.parse(tempData);
          console.log('📋 임시저장 데이터 복원:', parsedData);
          return { ...baseState, ...parsedData };
        }
      } catch (error) {
        console.warn('임시저장 데이터 복원 실패:', error);
      }
    }

    return baseState;
  };

  const [hardwareState, dispatchHardware] = useReducer(editHardwareReducer, getInitialState());

  // 필드 변경 핸들러
  const handleFieldChange = useCallback((field: keyof HardwareEditState, value: string | number | string[]) => {
    dispatchHardware({ type: 'SET_FIELD', field, value });
  }, []);

  // 개요탭 임시저장 (add 모드에서만)
  useEffect(() => {
    if (mode === 'add' && open) {
      try {
        const tempData = { ...hardwareState };
        // id 제외하고 저장
        delete tempData.id;
        localStorage.setItem(tempStorageKey, JSON.stringify(tempData));
        console.log('💾 개요탭 임시저장 완료');
      } catch (error) {
        console.warn('임시저장 실패:', error);
      }
    }
  }, [hardwareState, mode, open, tempStorageKey]);

  // 탭 변경 핸들러
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // 🔄 기록탭 핸들러 함수들 - 로컬 state만 변경 (임시 저장)
  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !data?.id) return;

    const currentUserName = currentUser?.user_name || '현재 사용자';
    const currentTeam = currentUser?.department || '';
    const currentPosition = currentUser?.position || '';
    const currentProfileImage = currentUser?.profile_image_url || '';
    const currentRole = currentUser?.role || '';

    // 로컬 임시 ID 생성
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newFeedback: FeedbackData = {
      id: tempId,
      page: PAGE_IDENTIFIERS.HARDWARE,
      record_id: data.id.toString(),
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
  }, [newComment, data?.id, currentUser]);

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

  // 저장 핸들러
  const handleSave = async () => {
    // 필수 입력 검증
    if (!hardwareState.assetName || !hardwareState.assetName.trim()) {
      setValidationError('자산명은 필수 입력 항목입니다.');
      return;
    }

    if (!hardwareState.assetCategory || !hardwareState.assetCategory.trim()) {
      setValidationError('자산분류는 필수 입력 항목입니다.');
      return;
    }

    if (!hardwareState.purchaseDate || !hardwareState.purchaseDate.trim()) {
      setValidationError('구매일은 필수 입력 항목입니다.');
      return;
    }

    if (!hardwareState.vendor || !hardwareState.vendor.trim()) {
      setValidationError('구매처는 필수 입력 항목입니다.');
      return;
    }

    // 에러 초기화
    setValidationError('');

    try {
      // 하드웨어 기본 정보 저장
      onSave(hardwareState);

      // 사용자이력이 있고 하드웨어 ID가 있는 경우 DB에 저장
      if (userHistories.length > 0 && data?.id) {
        const hardwareId = parseInt(data.id);

        // UserHistory를 HardwareUserHistory 형식으로 변환
        const convertedHistories: HardwareUserHistory[] = userHistories.map((history) => ({
          id: parseInt(history.id) || 0,
          hardware_id: hardwareId,
          user_name: history.userName?.trim() || '',
          department: history.department?.trim() || '',
          start_date: history.startDate?.trim() || new Date().toISOString().split('T')[0],
          end_date: history.endDate?.trim() && history.endDate.trim() !== '' ? history.endDate.trim() : null,
          reason: history.reason?.trim() || '',
          status: history.status as 'active' | 'inactive',
          registration_date: history.registrationDate?.trim() || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system',
          updated_by: 'system',
          is_active: true
        }));

        console.log('🔄 사용자이력 변환:', { original: userHistories, converted: convertedHistories });

        const success = await saveUserHistories(hardwareId, convertedHistories);
        if (success) {
          console.log('✅ 사용자이력 DB 저장 완료');
        } else {
          console.warn('⚠️ 사용자이력 DB 저장 실패');
        }
      }

      // 구매/수리이력이 있고 하드웨어 ID가 있는 경우 DB에 저장
      if (maintenanceHistories.length > 0 && data?.id) {
        const hardwareId = parseInt(data.id);

        const success = await saveMaintenanceHistories(hardwareId, maintenanceHistories);
        if (success) {
          console.log('✅ 구매/수리이력 DB 저장 완료');
        } else {
          console.warn('⚠️ 구매/수리이력 DB 저장 실패');
        }
      }

      // 🔄 기록 탭 변경사항 DB 저장
      console.log('💾 기록 탭 변경사항 저장 시작');
      console.time('⏱️ 기록 저장 Total');

      if (data?.id) {
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

        // 추가 (역순으로 저장)
        const reversedAddedFeedbacks = [...addedFeedbacks].reverse();
        for (const feedback of reversedAddedFeedbacks) {
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

      // 저장 성공 시 임시저장 데이터 삭제
      if (mode === 'add') {
        try {
          localStorage.removeItem(tempStorageKey);
          console.log('💾 개요탭 임시저장 데이터 삭제 완료');
        } catch (error) {
          console.warn('개요탭 임시저장 데이터 삭제 실패:', error);
        }

        // 사용자이력탭 임시저장 데이터 삭제
        if (userHistoryTabRef.current) {
          userHistoryTabRef.current.clearTempData();
        }

        // 구매/수리이력탭 임시저장 데이터 삭제
        if (maintenanceHistoryTabRef.current) {
          maintenanceHistoryTabRef.current.clearMaintenanceTempData();
        }
      }

      handleClose(); // 저장 후 팝업창 닫기
    } catch (error) {
      console.error('❌ 저장 중 오류 발생:', error);
      setValidationError('저장 중 오류가 발생했습니다.');
    }
  };

  // 닫기 핸들러 (임시저장은 유지)
  const handleClose = () => {
    setValue(0);
    setValidationError('');
    // 🔄 기록 탭 임시 데이터 초기화
    setPendingFeedbacks([]);
    setInitialFeedbacks([]);
    onClose();
  };

  // 데이터 변경 시 상태 업데이트
  useEffect(() => {
    if (data) {
      dispatchHardware({ type: 'SET_ALL', data });
    } else {
      const initialState = getInitialState();
      // 신규 생성 시 팀과 담당자 자동 설정
      if (currentUser && open) {
        if (currentUser.department) {
          initialState.team = currentUser.department;
        }
        if (currentUser.user_name) {
          initialState.assignee = currentUser.user_name;
        }
      }
      dispatchHardware({ type: 'RESET', initialState });
    }
  }, [data, open, currentUser]);

  // 하드웨어 변경 시 상태 업데이트
  React.useEffect(() => {
    if (data) {
      dispatchHardware({ type: 'SET_ALL', data });
    } else if (open) {
      // 새 하드웨어 생성 시 자동으로 코드와 등록일 설정
      const initializeNewHardware = async () => {
        try {
          console.log('🆕 새 하드웨어 코드 생성 시작...');
          const newCode = await generateHardwareCode();
          const newRegistrationDate = getCurrentDate();
          console.log('✅ 생성된 하드웨어 코드:', newCode);
          dispatchHardware({ type: 'INIT_NEW_HARDWARE', code: newCode, registrationDate: newRegistrationDate });
        } catch (error) {
          console.error('❌ 하드웨어 코드 생성 실패:', error);
          // 실패 시 임시 코드 사용
          const currentYear = new Date().getFullYear().toString().slice(-2);
          const tempCode = `IT-HW-${currentYear}-TMP`;
          const newRegistrationDate = getCurrentDate();
          dispatchHardware({ type: 'INIT_NEW_HARDWARE', code: tempCode, registrationDate: newRegistrationDate });
        }
      };

      initializeNewHardware();
    }
  }, [data, open]);

  // 담당자 관련 데이터
  const assignees = assigneeOptions.map((a) => a.name);
  const assigneeAvatars = assigneeOptions.reduce(
    (acc, a) => {
      acc[a.name] = a.avatar;
      return acc;
    },
    {} as Record<string, string>
  );

  // ✅ 마스터코드에서 상태 옵션 가져오기 (GROUP002)
  const statusOptionsFromMasterCode = React.useMemo(() => {
    if (!masterCodes || masterCodes.length === 0) {
      console.log('⚠️ [HardwareDialog] masterCodes가 아직 로드되지 않음');
      return propStatusOptions || ['예비', '사용중', '보관', '폐기'];
    }
    console.log('🔍 [HardwareDialog] GROUP002 상태 로딩 시작...');
    const group002SubCodes = masterCodes.filter(
      (code) => code.group_code === 'GROUP002' && code.is_active && code.subcode && code.subcode_name
    );
    console.log('🔍 [HardwareDialog] GROUP002 서브코드:', group002SubCodes.length, '개', group002SubCodes);

    if (group002SubCodes.length === 0) {
      console.log('⚠️ [HardwareDialog] GROUP002 서브코드 없음, 기본값 사용');
      return propStatusOptions || ['예비', '사용중', '보관', '폐기'];
    }

    const statusNames = group002SubCodes.map((code) => code.subcode_name);
    console.log('✅ [HardwareDialog] 상태 옵션:', statusNames);
    return statusNames;
  }, [masterCodes, propStatusOptions]);

  const statusOptionsToUse = statusOptionsFromMasterCode;
  const statusColors = propStatusColors || {
    예비: 'default',
    대기: 'default',
    사용중: 'success',
    진행: 'success',
    보관: 'warning',
    완료: 'success',
    폐기: 'error',
    홀딩: 'error'
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          '@media print': {
            height: 'auto',
            maxHeight: 'none',
            boxShadow: 'none',
            margin: 0
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          '@media print': {
            display: 'none'
          }
        }}
      >
        <Box>
          <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
            하드웨어관리 편집
          </Typography>
          {mode === 'edit' && hardwareState.assetName && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
              {hardwareState.assetName} ({hardwareState.code})
            </Typography>
          )}
        </Box>
        {/* 🔐 권한 체크: 새 하드웨어(mode='add')는 canCreateData 또는 canEditOwn, 기존 하드웨어는 isOwner 확인 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={mode === 'add' ? !(canCreateData || canEditOwn) : !(canEditOthers || (canEditOwn && isOwner))}
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
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={mode === 'add' ? !(canCreateData || canEditOwn) : !(canEditOthers || (canEditOwn && isOwner))}
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
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          overflow: 'hidden',
          '@media print': {
            overflow: 'visible'
          }
        }}
      >
        <Box
          sx={{
            '@media print': {
              display: 'none'
            }
          }}
        >
          <Tabs value={value} onChange={handleChange} aria-label="하드웨어 관리 탭" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="개요" {...a11yProps(0)} />
            <Tab label="사용자이력" {...a11yProps(1)} />
            <Tab label="구매/수리이력" {...a11yProps(2)} />
            <Tab label="QR출력" {...a11yProps(3)} />
            <Tab label="기록" {...a11yProps(4)} />
            <Tab label="자료" {...a11yProps(5)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <OverviewTab
            hardwareState={hardwareState}
            onFieldChange={handleFieldChange}
            assignees={assignees}
            assigneeAvatars={assigneeAvatars}
            statusOptions={statusOptionsToUse}
            statusColors={statusColors}
            assetCategories={[...assetCategoryOptions]}
            users={users}
          />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <UserHistoryTab
            ref={userHistoryTabRef}
            mode={mode}
            hardwareId={data?.id}
            userHistories={userHistories}
            onUserHistoriesChange={setUserHistories}
            canEditOwn={canEditOwn && isOwner}
            canEditOthers={canEditOthers}
          />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <MaintenanceHistoryTab
            ref={maintenanceHistoryTabRef}
            hardwareId={data?.id ? parseInt(data.id) : 0}
            mode={mode}
            maintenanceHistories={maintenanceHistories}
            onMaintenanceHistoriesChange={setMaintenanceHistories}
            canEditOwn={canEditOwn && isOwner}
            canEditOthers={canEditOthers}
          />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <QROutputTab hardwareState={hardwareState} />
        </TabPanel>

        <TabPanel value={value} index={4}>
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
        </TabPanel>

        <TabPanel value={value} index={5}>
          <MaterialTab recordId={data?.id} currentUser={currentUser} canEditOwn={canEditOwn && isOwner} canEditOthers={canEditOthers} />
        </TabPanel>
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
