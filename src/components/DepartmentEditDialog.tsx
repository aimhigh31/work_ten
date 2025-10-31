import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Chip,
  Alert,
  Avatar
} from '@mui/material';
import { CloseSquare } from '@wandersonalwes/iconsax-react';
import { useSession } from 'next-auth/react';
import { useCommonData } from 'contexts/CommonDataContext';

// 부서 데이터 타입
interface DepartmentData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  departmentName: string;
  departmentDescription: string;
  status: '활성' | '비활성' | '대기' | '취소';
  lastModifiedDate: string;
  modifier: string;
  team?: string;
}

// TabPanel 컴포넌트
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
      id={`department-tabpanel-${index}`}
      aria-labelledby={`department-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `department-tab-${index}`,
    'aria-controls': `department-tabpanel-${index}`
  };
}

interface DepartmentEditDialogProps {
  open: boolean;
  onClose: () => void;
  department: DepartmentData | null;
  onSave: (department: DepartmentData) => void;
  existingDepartments: DepartmentData[];
  canEditOwn?: boolean;
  canEditOthers?: boolean;
}

export default function DepartmentEditDialog({ open, onClose, department, onSave, existingDepartments, canEditOwn = true, canEditOthers = true }: DepartmentEditDialogProps) {
  const { data: session } = useSession();
  const { users } = useCommonData();
  const [tabValue, setTabValue] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const [formData, setFormData] = useState<DepartmentData>({
    id: 0,
    no: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    code: '',
    departmentName: '',
    departmentDescription: '',
    status: '활성',
    lastModifiedDate: new Date().toISOString().split('T')[0],
    modifier: session?.user?.name || 'system',
    team: ''
  });

  // 등록자 프로필 이미지 찾기
  const getUserProfileImage = useCallback(
    (userName: string) => {
      if (!userName || users.length === 0) return null;
      const user = users.find((u) => u.user_name === userName);
      return user?.profile_image_url || user?.avatar_url || null;
    },
    [users]
  );

  // 중복되지 않는 부서 코드 생성
  const generateUniqueCode = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);

    console.log(
      '기존 부서들:',
      existingDepartments.map((d) => ({ id: d.id, code: d.code }))
    );

    // 기존 부서 코드들에서 같은 년도의 코드들을 찾아서 가장 큰 번호를 찾음
    const currentYearCodes = existingDepartments.map((dept) => dept.code).filter((code) => code && code.startsWith(`DEPT-${yearSuffix}-`));

    console.log('현재 년도 코드들:', currentYearCodes);

    const existingNumbers = currentYearCodes.map((code) => {
      const match = code.match(/DEPT-\d{2}-(\d{3})$/);
      return match ? parseInt(match[1]) : 0;
    });

    console.log('기존 번호들:', existingNumbers);

    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');

    const newCode = `DEPT-${yearSuffix}-${paddedNumber}`;
    console.log('새로 생성된 코드:', newCode);

    return newCode;
  }, [existingDepartments]);

  // department가 변경될 때 formData 업데이트
  useEffect(() => {
    if (department) {
      setFormData({ ...department });
    } else {
      // 새 부서 생성시 초기값
      const currentDate = new Date().toISOString().split('T')[0];

      setFormData({
        id: Date.now(),
        no: 0,
        registrationDate: currentDate,
        code: generateUniqueCode(),
        departmentName: '',
        departmentDescription: '',
        status: '활성',
        lastModifiedDate: currentDate,
        modifier: session?.user?.name || 'system',
        team: ''
      });
    }
  }, [department, generateUniqueCode, session]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: keyof DepartmentData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSelectChange = (field: keyof DepartmentData) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSave = () => {
    // 필수값 검증
    if (!formData.departmentName || !formData.departmentName.trim()) {
      setValidationError('부서명은 필수 입력 항목입니다.');
      return;
    }

    // 검증 통과 시 에러 초기화 후 저장
    setValidationError('');
    onSave(formData);
  };

  const handleClose = () => {
    setTabValue(0);
    setValidationError('');
    onClose();
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
          maxHeight: '800px',
          width: '90vw',
          maxWidth: '1200px'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 1
        }}
      >
        <Box>
          <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
            부서관리 편집
          </Typography>
          {department && (
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500, mt: 0.5 }}>
              {department.departmentName} ({department.code})
            </Typography>
          )}
        </Box>

        {/* 취소, 저장 버튼을 오른쪽 상단으로 이동 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            disabled={!(canEditOwn || canEditOthers)}
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
            disabled={!(canEditOwn || canEditOthers)}
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

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        {/* 개요 - TaskEditDialog와 동일한 레이아웃 */}
        <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
          <Stack spacing={3}>
            {/* 부서명 - 전체 너비 */}
            <TextField
              fullWidth
              label={
                <span>
                  부서명 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={formData.departmentName}
              onChange={handleInputChange('departmentName')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            {/* 설명 - 전체 너비 */}
            <TextField
              fullWidth
              label="설명"
              multiline
              rows={4}
              value={formData.departmentDescription}
              onChange={handleInputChange('departmentDescription')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            {/* 마지막수정일, 등록자, 상태 - 3등분 배치 */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="마지막수정일"
                value={formData.lastModifiedDate}
                onChange={handleInputChange('lastModifiedDate')}
                variant="outlined"
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled
              />

              <TextField
                fullWidth
                disabled
                label="등록자"
                value={formData.modifier}
                InputLabelProps={{
                  shrink: true
                }}
                InputProps={{
                  startAdornment: (
                    <Avatar
                      src={getUserProfileImage(formData.modifier) || ''}
                      alt={formData.modifier}
                      sx={{ width: 24, height: 24, mr: 0.25 }}
                    >
                      {formData.modifier?.charAt(0)}
                    </Avatar>
                  )
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

              <FormControl fullWidth>
                <InputLabel shrink>상태</InputLabel>
                <Select
                  value={formData.status}
                  label="상태"
                  onChange={handleSelectChange('status')}
                  renderValue={(selected) => {
                    const statusConfig = {
                      대기: { bgColor: '#F5F5F5', color: '#757575' },
                      활성: { bgColor: '#E8F5E9', color: '#388E3C' },
                      비활성: { bgColor: '#FFEBEE', color: '#D32F2F' },
                      취소: { bgColor: '#FFEBEE', color: '#D32F2F' }
                    };
                    const config = statusConfig[selected as keyof typeof statusConfig];
                    return (
                      <Chip
                        label={selected}
                        size="small"
                        sx={{
                          bgcolor: config?.bgColor,
                          color: config?.color,
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />
                    );
                  }}
                >
                  <MenuItem value="대기">
                    <Chip
                      label="대기"
                      size="small"
                      sx={{
                        bgcolor: '#F5F5F5',
                        color: '#757575',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </MenuItem>
                  <MenuItem value="활성">
                    <Chip
                      label="활성"
                      size="small"
                      sx={{
                        bgcolor: '#E8F5E9',
                        color: '#388E3C',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </MenuItem>
                  <MenuItem value="비활성">
                    <Chip
                      label="비활성"
                      size="small"
                      sx={{
                        bgcolor: '#FFEBEE',
                        color: '#D32F2F',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </MenuItem>
                  <MenuItem value="취소">
                    <Chip
                      label="취소"
                      size="small"
                      sx={{
                        bgcolor: '#FFEBEE',
                        color: '#D32F2F',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* 등록일, 코드 - 2등분 배치 */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="등록일"
                value={formData.registrationDate}
                onChange={handleInputChange('registrationDate')}
                variant="outlined"
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled
              />

              <TextField
                fullWidth
                label="코드"
                value={formData.code}
                onChange={handleInputChange('code')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Stack>
          </Stack>
        </Box>
      </DialogContent>

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
