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
  Autocomplete
} from '@mui/material';
import QRCode from 'react-qr-code';
import Grid from '@mui/material/Grid';
import { HardwareRecord, assetCategoryOptions, statusOptions, assigneeOptions, currentUserOptions } from 'types/hardware';

// 하드웨어 편집 상태 관리
interface HardwareEditState {
  id: string;
  no: number;
  registrationDate: string;
  code: string;
  assetCategory: string;
  assetName: string;
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
  assignee: string;
  images: string[];
}

// 사용자 이력 인터페이스
interface UserHistory {
  id: string;
  userId: string;
  userName: string;
  department: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'active' | 'inactive';
  notes?: string;
}

// 구매/수리 이력 인터페이스
interface MaintenanceHistory {
  id: string;
  type: 'purchase' | 'repair' | 'maintenance';
  date: string;
  description: string;
  cost: number;
  vendor: string;
  status: string;
  notes: string;
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
  return (
    <div role="tabpanel" hidden={value !== index} id={`hardware-tabpanel-${index}`} aria-labelledby={`hardware-tab-${index}`} {...other}>
      {value === index && children}
    </div>
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
    assetCategories
  }: {
    hardwareState: HardwareEditState;
    onFieldChange: (field: keyof HardwareEditState, value: string | number | string[]) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: string[];
    statusColors: Record<string, any>;
    assetCategories: string[];
  }) => {
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreview, setImagePreview] = useState<string[]>([]);

    const handleImageUpload = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const newFiles = [...imageFiles];
        const newPreviews = [...imagePreview];

        newFiles[index] = file;
        newPreviews[index] = URL.createObjectURL(file);

        setImageFiles(newFiles);
        setImagePreview(newPreviews);

        // 상위 컴포넌트로 이미지 정보 전달
        const imageNames = newFiles.map((f) => f?.name || '');
        onFieldChange('images', imageNames);
      }
    };

    const handleImageRemove = (index: number) => {
      const newFiles = [...imageFiles];
      const newPreviews = [...imagePreview];

      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
      }

      newFiles[index] = null as any;
      newPreviews[index] = '';

      setImageFiles(newFiles);
      setImagePreview(newPreviews);

      // 상위 컴포넌트로 이미지 정보 전달
      const imageNames = newFiles.map((f) => f?.name || '');
      onFieldChange('images', imageNames);
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
              label="구매처"
              value={hardwareState.vendor}
              onChange={(e) => onFieldChange('vendor', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 자산분류-상태-시리얼넘버 (3열) */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>자산분류</InputLabel>
              <Select value={hardwareState.assetCategory} onChange={(e) => onFieldChange('assetCategory', e.target.value)} label="자산분류">
                {assetCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select value={hardwareState.status} onChange={(e) => onFieldChange('status', e.target.value)} label="상태">
                {statusOpts.map((status) => (
                  <MenuItem key={status} value={status}>
                    <Chip label={status} color={statusColors[status] as any} size="small" />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="시리얼넘버"
              value={hardwareState.serialNumber}
              onChange={(e) => onFieldChange('serialNumber', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* 현재사용자-위치-담당자 (3열) */}
          <Stack direction="row" spacing={2}>
            <Autocomplete
              fullWidth
              options={currentUserOptions}
              getOptionLabel={(option) => option.name}
              value={currentUserOptions.find((u) => u.name === hardwareState.currentUser) || null}
              onChange={(_, value) => onFieldChange('currentUser', value?.name || '')}
              renderInput={(params) => <TextField {...params} label="현재사용자" InputLabelProps={{ shrink: true }} />}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Avatar src={option.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
                    {option.name} ({option.department})
                  </Box>
                );
              }}
            />
            <TextField
              fullWidth
              label="위치"
              value={hardwareState.location}
              onChange={(e) => onFieldChange('location', e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <Autocomplete
              fullWidth
              options={assigneeOptions}
              getOptionLabel={(option) => option.name}
              value={assigneeOptions.find((u) => u.name === hardwareState.assignee) || null}
              onChange={(_, value) => onFieldChange('assignee', value?.name || '')}
              renderInput={(params) => <TextField {...params} label="담당자" InputLabelProps={{ shrink: true }} />}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Avatar src={option.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
                    {option.name} ({option.department})
                  </Box>
                );
              }}
            />
          </Stack>

          {/* 구매일-보증종료일 (2열) */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="구매일"
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

          {/* 사진1-사진2 (2열) */}
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
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': { borderColor: 'primary.main' },
                        position: 'relative'
                      }}
                    >
                      {imagePreview[index] ? (
                        <>
                          <img
                            src={imagePreview[index]}
                            alt={`Preview ${index + 1}`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100px',
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

          {/* 비고(상세스펙 설명) - 전체 너비 */}
          <TextField
            fullWidth
            label="비고(상세스펙 설명)"
            multiline
            rows={4}
            value={hardwareState.detailSpec}
            onChange={(e) => onFieldChange('detailSpec', e.target.value)}
            variant="outlined"
            placeholder="하드웨어 상세 스펙 및 비고사항을 입력해주세요."
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Box>
    );
  }
);

// 사용자 이력 탭 컴포넌트
const UserHistoryTab = memo(() => {
  const [userHistories, setUserHistories] = useState<UserHistory[]>([
    {
      id: '1',
      userId: 'user1',
      userName: '김철수',
      department: 'IT팀',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      reason: '부서 이동',
      status: 'inactive'
    },
    {
      id: '2',
      userId: 'user2',
      userName: '이영희',
      department: '개발팀',
      startDate: '2024-07-01',
      endDate: '',
      reason: '신규 배정',
      status: 'active'
    }
  ]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const handleCellClick = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleAddHistory = () => {
    const newHistory: UserHistory = {
      id: Date.now().toString(),
      userId: '',
      userName: '',
      department: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      reason: '',
      status: 'active'
    };
    setUserHistories([newHistory, ...userHistories]);
  };

  const handleDeleteSelected = () => {
    setUserHistories(userHistories.filter((h) => !selectedRows.includes(h.id)));
    setSelectedRows([]);
  };

  const handleEditHistory = (id: string, field: keyof UserHistory, value: string) => {
    setUserHistories(userHistories.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
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
      setSelectedRows(userHistories.map((h) => h.id));
    } else {
      setSelectedRows([]);
    }
  };

  const statusOptions = ['사용중', '종료', '수리중'];
  const statusColors: Record<string, string> = {
    사용중: 'success',
    종료: 'default',
    수리중: 'warning'
  };

  // 컬럼 너비 및 높이 정의 (편집/읽기 모드 공통)
  const columnWidths = {
    checkbox: 50,
    no: 60,
    userName: 120,
    department: 100,
    startDate: 120,
    endDate: 120,
    reason: 150,
    status: 100,
    notes: 120
  };

  const cellHeight = 56; // 고정 셀 높이

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (history: UserHistory, field: string, value: string, options?: string[]) => {
    const isEditing = editingCell?.id === history.id && editingCell?.field === field;
    const fieldWidth = columnWidths[field as keyof typeof columnWidths] || 100;

    if (isEditing) {
      if (options) {
        return (
          <Select
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              if (field === 'status') {
                const newStatus = newValue === '사용중' ? 'active' : newValue === '종료' ? 'inactive' : 'repair';
                handleEditHistory(history.id, 'status', newStatus);
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
                {field === 'status' ? <Chip label={option} color={statusColors[option] as any} size="small" /> : option}
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
            label={value}
            color={statusColors[value] as any}
            size="small"
            sx={{
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
    <Box sx={{ height: '650px', overflowY: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
          사용자 이력 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selectedRows.length === 0} size="small">
            삭제({selectedRows.length})
          </Button>
          <Button variant="contained" onClick={handleAddHistory} size="small" sx={{ fontSize: '12px' }}>
            추가
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: 800
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <input
                  type="checkbox"
                  checked={selectedRows.length === userHistories.length && userHistories.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.userName, fontWeight: 600 }}>사용자</TableCell>
              <TableCell sx={{ width: columnWidths.department, fontWeight: 600 }}>부서</TableCell>
              <TableCell sx={{ width: columnWidths.startDate, fontWeight: 600 }}>시작일</TableCell>
              <TableCell sx={{ width: columnWidths.endDate, fontWeight: 600 }}>종료일</TableCell>
              <TableCell sx={{ width: columnWidths.reason, fontWeight: 600 }}>사유</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.notes, fontWeight: 600 }}>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userHistories.map((history, index) => (
              <TableRow
                key={history.id}
                hover
                sx={{
                  height: cellHeight,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <input type="checkbox" checked={selectedRows.includes(history.id)} onChange={() => handleSelectRow(history.id)} />
                </TableCell>
                <TableCell sx={{ width: columnWidths.no }}>{userHistories.length - index}</TableCell>
                <TableCell sx={{ width: columnWidths.userName }} onClick={() => handleCellClick(history.id, 'userName')}>
                  {renderEditableCell(history, 'userName', history.userName)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.department }} onClick={() => handleCellClick(history.id, 'department')}>
                  {renderEditableCell(history, 'department', history.department)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.startDate }} onClick={() => handleCellClick(history.id, 'startDate')}>
                  {renderEditableCell(history, 'startDate', history.startDate)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.endDate }} onClick={() => handleCellClick(history.id, 'endDate')}>
                  {renderEditableCell(history, 'endDate', history.endDate)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.reason }} onClick={() => handleCellClick(history.id, 'reason')}>
                  {renderEditableCell(history, 'reason', history.reason)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.status }} onClick={() => handleCellClick(history.id, 'status')}>
                  {renderEditableCell(
                    history,
                    'status',
                    history.status === 'active' ? '사용중' : history.status === 'inactive' ? '종료' : '수리중',
                    statusOptions
                  )}
                </TableCell>
                <TableCell sx={{ width: columnWidths.notes }} onClick={() => handleCellClick(history.id, 'notes')}>
                  {renderEditableCell(history, 'notes', history.notes || '')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// 구매/수리 이력 탭 컴포넌트
const MaintenanceHistoryTab = memo(() => {
  const [maintenanceHistories, setMaintenanceHistories] = useState<MaintenanceHistory[]>([
    {
      id: '1',
      type: 'purchase',
      date: '2024-01-15',
      description: '초기 구매',
      cost: 1500000,
      vendor: 'Dell Korea',
      status: '완료',
      notes: '3년 보증 포함'
    },
    {
      id: '2',
      type: 'repair',
      date: '2024-06-20',
      description: 'HDD 교체',
      cost: 200000,
      vendor: 'IT서비스센터',
      status: '완료',
      notes: '1TB SSD로 업그레이드'
    }
  ]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const handleCellClick = (id: string, field: string) => {
    setEditingCell({ id, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleAddHistory = () => {
    const newHistory: MaintenanceHistory = {
      id: Date.now().toString(),
      type: 'purchase',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      vendor: '',
      status: '대기',
      notes: ''
    };
    setMaintenanceHistories([newHistory, ...maintenanceHistories]);
  };

  const handleDeleteSelected = () => {
    setMaintenanceHistories(maintenanceHistories.filter((h) => !selectedRows.includes(h.id)));
    setSelectedRows([]);
  };

  const handleEditHistory = (id: string, field: keyof MaintenanceHistory, value: string | number) => {
    setMaintenanceHistories(maintenanceHistories.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
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
        return 'primary';
      case 'repair':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return '구매';
      case 'repair':
        return '수리';
      default:
        return type;
    }
  };

  const typeOptions = ['구매', '수리'];
  const statusOptions = ['대기', '진행', '완료', '취소'];
  const statusColors: Record<string, string> = {
    대기: 'warning',
    진행: 'info',
    완료: 'success',
    취소: 'error'
  };

  // 컬럼 너비 및 높이 정의 (편집/읽기 모드 공통)
  const columnWidths = {
    checkbox: 50,
    no: 60,
    type: 100,
    date: 120,
    description: 200,
    cost: 120,
    vendor: 120,
    status: 100,
    notes: 120
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
                {field === 'type' ? (
                  <Chip label={option} color={getTypeColor(option === '구매' ? 'purchase' : 'repair') as any} size="small" />
                ) : field === 'status' ? (
                  <Chip label={option} color={statusColors[option] as any} size="small" />
                ) : (
                  option
                )}
              </MenuItem>
            ))}
          </Select>
        );
      }

      if (field === 'date') {
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

      if (field === 'cost') {
        return (
          <TextField
            type="number"
            value={value as number}
            onChange={(e) => handleEditHistory(history.id, field as keyof MaintenanceHistory, Number(e.target.value))}
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
            cursor: 'pointer'
          }}
        >
          <Chip
            label={getTypeLabel(history.type)}
            color={getTypeColor(history.type) as any}
            size="small"
            sx={{
              '&:hover': { opacity: 0.8 },
              fontSize: '12px'
            }}
          />
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
            color={statusColors[value as string] as any}
            size="small"
            sx={{
              '&:hover': { opacity: 0.8 },
              fontSize: '12px'
            }}
          />
        </Box>
      );
    }

    if (field === 'cost') {
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
    <Box sx={{ height: '650px', overflowY: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
          구매/수리 이력
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selectedRows.length === 0} size="small">
            취소({selectedRows.length})
          </Button>
          <Button variant="contained" onClick={handleAddHistory} size="small" sx={{ fontSize: '12px' }}>
            추가
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: 1000
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                <input
                  type="checkbox"
                  checked={selectedRows.length === maintenanceHistories.length && maintenanceHistories.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ width: columnWidths.no, fontWeight: 600 }}>NO</TableCell>
              <TableCell sx={{ width: columnWidths.type, fontWeight: 600 }}>유형</TableCell>
              <TableCell sx={{ width: columnWidths.date, fontWeight: 600 }}>일자</TableCell>
              <TableCell sx={{ width: columnWidths.description, fontWeight: 600 }}>내용</TableCell>
              <TableCell sx={{ width: columnWidths.cost, fontWeight: 600 }}>비용</TableCell>
              <TableCell sx={{ width: columnWidths.vendor, fontWeight: 600 }}>업체</TableCell>
              <TableCell sx={{ width: columnWidths.status, fontWeight: 600 }}>상태</TableCell>
              <TableCell sx={{ width: columnWidths.notes, fontWeight: 600 }}>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maintenanceHistories.map((history, index) => (
              <TableRow
                key={history.id}
                hover
                sx={{
                  height: cellHeight,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox }}>
                  <input type="checkbox" checked={selectedRows.includes(history.id)} onChange={() => handleSelectRow(history.id)} />
                </TableCell>
                <TableCell sx={{ width: columnWidths.no }}>{maintenanceHistories.length - index}</TableCell>
                <TableCell sx={{ width: columnWidths.type }} onClick={() => handleCellClick(history.id, 'type')}>
                  {renderEditableCell(history, 'type', getTypeLabel(history.type), typeOptions)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.date }} onClick={() => handleCellClick(history.id, 'date')}>
                  {renderEditableCell(history, 'date', history.date)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.description }} onClick={() => handleCellClick(history.id, 'description')}>
                  {renderEditableCell(history, 'description', history.description)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.cost }} onClick={() => handleCellClick(history.id, 'cost')}>
                  {renderEditableCell(history, 'cost', history.cost)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.vendor }} onClick={() => handleCellClick(history.id, 'vendor')}>
                  {renderEditableCell(history, 'vendor', history.vendor)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.status }} onClick={() => handleCellClick(history.id, 'status')}>
                  {renderEditableCell(history, 'status', history.status, statusOptions)}
                </TableCell>
                <TableCell sx={{ width: columnWidths.notes }} onClick={() => handleCellClick(history.id, 'notes')}>
                  {renderEditableCell(history, 'notes', history.notes)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// QR 출력 탭 컴포넌트
const QROutputTab = memo(({ hardwareState }: { hardwareState: HardwareEditState }) => {
  const [qrSize, setQrSize] = useState(200);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;

      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // 페이지 복원
    }
  };

  // QR 코드에 포함될 데이터 - 자산코드만 포함
  const qrData = hardwareState.code;

  // QR 크기에 비례한 텍스트 크기 계산
  const getTextSize = (baseSize: number) => {
    const ratio = qrSize / 200; // 기본 크기 200px을 기준으로 비율 계산
    return Math.round(baseSize * ratio);
  };

  return (
    <Box sx={{ height: '650px', overflowY: 'auto', p: 3 }}>
      <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, mb: 3 }}>
        QR 코드 출력
      </Typography>

      <Card>
        <CardContent>
          {/* 출력될 QR 코드 영역 */}
          <div ref={printRef}>
            <Box
              sx={{
                border: '2px solid #333',
                borderRadius: 2,
                padding: 3,
                backgroundColor: 'white',
                '@media print': {
                  margin: 0,
                  padding: '20px',
                  border: '2px solid #000'
                }
              }}
            >
              <Stack direction="row" spacing={4} alignItems="flex-start">
                {/* QR 코드 영역 */}
                <Box
                  sx={{
                    flex: '0 0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box
                    sx={{
                      width: qrSize,
                      height: qrSize,
                      padding: 2,
                      backgroundColor: 'white',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <QRCode
                      value={qrData}
                      size={qrSize - 16} // 패딩 고려
                      level="M"
                      style={{
                        height: 'auto',
                        maxWidth: '100%',
                        width: '100%'
                      }}
                    />
                  </Box>
                </Box>

                {/* 하드웨어 정보 영역 */}
                <Box sx={{ flex: 1, pl: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: `${getTextSize(24)}px`,
                        lineHeight: 1.2
                      }}
                    >
                      {hardwareState.assetName}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: `${getTextSize(16)}px`,
                        lineHeight: 1.4
                      }}
                    >
                      자산코드: {hardwareState.code}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: `${getTextSize(16)}px`,
                        lineHeight: 1.4
                      }}
                    >
                      분류: {hardwareState.assetCategory}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: `${getTextSize(16)}px`,
                        lineHeight: 1.4
                      }}
                    >
                      모델: {hardwareState.model}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </div>

          <Divider sx={{ my: 3 }} />

          {/* 출력 설정 */}
          <Stack spacing={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              출력 설정
            </Typography>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                QR 코드 크기: {qrSize}px
              </Typography>
              <Box sx={{ px: 2 }}>
                <input
                  type="range"
                  min="100"
                  max="300"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                * 크기 변경 시 오른쪽 텍스트도 자동으로 조정됩니다
              </Typography>
            </Box>

            <Button variant="contained" onClick={handlePrint} sx={{ width: 200 }}>
              QR 코드 출력
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});

// 기록 탭 컴포넌트
const RecordTab = memo(() => {
  const [comments, setComments] = useState<HardwareLogRecord[]>([
    {
      id: '1',
      date: '2024-01-15',
      author: '김철수',
      content: '하드웨어 초기 설정 완료',
      type: 'info'
    },
    {
      id: '2',
      date: '2024-06-20',
      author: '이영희',
      content: 'HDD 교체 작업 완료. 성능 개선 확인됨.',
      type: 'info'
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleAddComment = useCallback(() => {
    if (newComment.trim()) {
      const comment: HardwareLogRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        author: '현재사용자', // 실제로는 로그인한 사용자
        content: newComment,
        type: 'info'
      };
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    }
  }, [newComment]);

  const handleEditComment = useCallback((commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  }, []);

  const handleSaveEditComment = useCallback(() => {
    if (editingCommentId && editingCommentText.trim()) {
      setComments((prev) =>
        prev.map((comment) => (comment.id === editingCommentId ? { ...comment, content: editingCommentText } : comment))
      );
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  }, [editingCommentId, editingCommentText]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  }, []);

  const handleCommentKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAddComment();
      }
    },
    [handleAddComment]
  );

  return (
    <Box sx={{ height: '650px', px: '5%' }}>
      {/* 새 기록 등록 - 좌우 배치 */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3, pt: 2 }}>
        <Avatar sx={{ width: 32, height: 32, mt: 0.5 }}>U</Avatar>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="새 기록을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={handleCommentKeyPress}
          variant="outlined"
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          sx={{ minWidth: '80px', height: '40px', mt: 0.5 }}
        >
          등록
        </Button>
      </Box>

      {/* 기록 항목들 */}
      <Box sx={{ height: 'calc(100% - 140px)', overflowY: 'auto' }}>
        <Stack spacing={2}>
          {comments.map((comment) => (
            <Paper
              key={comment.id}
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
                <Avatar sx={{ width: 32, height: 32 }}>{comment.author.charAt(0)}</Avatar>

                {/* 기록 내용 영역 */}
                <Box sx={{ flex: 1 }}>
                  {/* 사용자 정보 및 시간 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {comment.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.date}
                    </Typography>
                  </Box>

                  {/* 기록 내용 */}
                  {editingCommentId === comment.id ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) handleSaveEditComment();
                        if (e.key === 'Escape') handleCancelEditComment();
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
                      onClick={() => handleEditComment(comment.id, comment.content)}
                    >
                      {comment.content}
                    </Typography>
                  )}
                </Box>

                {/* 액션 버튼들 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {editingCommentId === comment.id ? (
                    <>
                      <IconButton size="small" onClick={handleSaveEditComment} sx={{ color: 'success.main' }}>
                        <Typography fontSize="16px">✓</Typography>
                      </IconButton>
                      <IconButton size="small" onClick={handleCancelEditComment} sx={{ color: 'error.main' }}>
                        <Typography fontSize="16px">✕</Typography>
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleEditComment(comment.id, comment.content)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Typography fontSize="14px">✏️</Typography>
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteComment(comment.id)} sx={{ color: 'error.main' }}>
                        <Typography fontSize="14px">🗑️</Typography>
                      </IconButton>
                    </>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}

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
}

export default function HardwareDialog({ open, onClose, onSave, data, mode }: HardwareDialogProps) {
  const [value, setValue] = useState(0);
  const [validationError, setValidationError] = useState('');

  // 초기 상태
  const initialState: HardwareEditState = {
    id: data?.id || '',
    no: data?.no || 0,
    registrationDate: data?.registrationDate || new Date().toISOString().split('T')[0],
    code: data?.code || '',
    assetCategory: data?.assetCategory || '',
    assetName: data?.assetName || '',
    model: data?.model || '',
    manufacturer: data?.manufacturer || '',
    vendor: data?.vendor || '',
    detailSpec: data?.detailSpec || '',
    status: data?.status || '예비',
    purchaseDate: data?.purchaseDate || '',
    warrantyEndDate: data?.warrantyEndDate || '',
    serialNumber: data?.serialNumber || '',
    currentUser: data?.currentUser || '',
    location: data?.location || '',
    assignee: data?.assignee || '',
    images: data?.images || []
  };

  const [hardwareState, dispatchHardware] = useReducer(editHardwareReducer, initialState);

  // 필드 변경 핸들러
  const handleFieldChange = useCallback((field: keyof HardwareEditState, value: string | number | string[]) => {
    dispatchHardware({ type: 'SET_FIELD', field, value });
  }, []);

  // 탭 변경 핸들러
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!hardwareState.assetName) {
      setValidationError('자산명을 입력해주세요.');
      return;
    }

    setValidationError('');
    onSave(hardwareState);
    handleClose(); // 저장 후 팝업창 닫기
  };

  // 닫기 핸들러
  const handleClose = () => {
    setValue(0);
    setValidationError('');
    onClose();
  };

  // 데이터 변경 시 상태 업데이트
  useEffect(() => {
    if (data) {
      dispatchHardware({ type: 'SET_ALL', data });
    } else {
      dispatchHardware({ type: 'RESET', initialState });
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

  const statusColors = {
    예비: 'default',
    사용: 'success',
    수리: 'warning',
    불량: 'error',
    폐기: 'default'
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
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontSize: '18px', fontWeight: 600 }}>
          {mode === 'add' ? '하드웨어 자산 추가' : '하드웨어 자산 수정'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} variant="outlined" size="small">
            취소
          </Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={!hardwareState.assetName}>
            저장
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {validationError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {validationError}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="하드웨어 관리 탭">
            <Tab label="개요" {...a11yProps(0)} />
            <Tab label="사용자이력" {...a11yProps(1)} />
            <Tab label="구매/수리이력" {...a11yProps(2)} />
            <Tab label="QR출력" {...a11yProps(3)} />
            <Tab label="기록" {...a11yProps(4)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <OverviewTab
            hardwareState={hardwareState}
            onFieldChange={handleFieldChange}
            assignees={assignees}
            assigneeAvatars={assigneeAvatars}
            statusOptions={[...statusOptions]}
            statusColors={statusColors}
            assetCategories={[...assetCategoryOptions]}
          />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <UserHistoryTab />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <MaintenanceHistoryTab />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <QROutputTab hardwareState={hardwareState} />
        </TabPanel>

        <TabPanel value={value} index={4}>
          <RecordTab />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
}
