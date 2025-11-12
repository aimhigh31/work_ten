import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Stack,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Pagination,
  Checkbox
} from '@mui/material';
import { AddCircle, Trash } from '@wandersonalwes/iconsax-react';
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import { useSupabaseImprovements, CreateImprovementRequest } from '../hooks/useSupabaseImprovements';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { createCacheKey } from '../utils/cacheUtils';

interface SecurityIncidentReportTabProps {
  incidentReport?: any;
  onIncidentReportChange?: (field: string, value: any) => void;
  responseStage?: string;
  onResponseStageChange?: (stage: string) => void;
  accidentId?: number;
  // 커리큘럼탭과 동일한 패턴: 부모 state
  improvementItems: any[];
  setImprovementItems: React.Dispatch<React.SetStateAction<any[]>>;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
}

const SecurityIncidentReportTab = memo(
  ({
    incidentReport = {},
    onIncidentReportChange = () => {},
    responseStage = '사고탐지',
    onResponseStageChange = () => {},
    accidentId,
    // 커리큘럼탭과 동일한 패턴: 부모 state
    improvementItems,
    setImprovementItems,
    selectedRows,
    setSelectedRows
  }: SecurityIncidentReportTabProps) => {
    // Step5 컴포넌트 초기화 로깅 (전역 오류 처리는 ProviderWrapper에서 담당)
    useEffect(() => {
      console.log('🚀 Step5 SecurityIncidentReportTab 초기화됨');
      console.log('📋 초기 상태:', { accidentId, incidentReport });
      console.log('📋 incidentReport 데이터 확인:', JSON.stringify(incidentReport, null, 2));

      return () => {
        console.log('🧹 Step5 SecurityIncidentReportTab 정리됨');

        // ✅ 컴포넌트 언마운트 시 sessionStorage 정리 (data_relation2.md 패턴)
        if (accidentId && accidentId > 0) {
          const tempKey = `incident_report_temp_${accidentId}`;
          sessionStorage.removeItem(tempKey);
          console.log('🧹 사고보고 임시 데이터 정리:', tempKey);
        }
      };
    }, [accidentId]);

    // 마스터코드 훅 사용
    const { getSubCodesByGroup } = useSupabaseMasterCode3();

    // 개선사항은 부모 컴포넌트(SecurityIncidentEditDialog)에서 props로 받아서 관리 (커리큘럼탭과 동일한 패턴)

    // incidentReport 객체 안정화 (useEffect 의존성 배열 오류 방지)
    const stableIncidentReport = useMemo(() => {
      return incidentReport && typeof incidentReport === 'object' ? { ...incidentReport } : {};
    }, [JSON.stringify(incidentReport)]);

    // 편집 모드 초기화 - 사고보고 데이터 로드 (data_relation2.md 패턴 적용)
    useEffect(() => {
      if (accidentId && accidentId > 0) {
        console.group('🔍 사고보고 - 편집 모드 초기화');
        console.log('accidentId:', accidentId);
        console.log('props incidentReport:', stableIncidentReport);

        // ✅ sessionStorage 우선 확인 (data_relation2.md 패턴)
        const tempKey = `incident_report_temp_${accidentId}`;
        const tempData = sessionStorage.getItem(tempKey);

        if (tempData) {
          try {
            const parsedTempData = JSON.parse(tempData);
            console.log('🔍 사고보고 임시 저장 데이터 복원:', { tempKey, data: parsedTempData });
            // sessionStorage 데이터가 있으면 상위 컴포넌트에 전달
            Object.keys(parsedTempData).forEach((field) => {
              if (parsedTempData[field] !== undefined && parsedTempData[field] !== '') {
                onIncidentReportChange(field, parsedTempData[field]);
              }
            });
          } catch (parseError) {
            console.error('🔴 sessionStorage 파싱 오류:', parseError);
          }
        } else {
          console.log('🔍 임시 저장 데이터 없음, props 데이터 확인');

          // ✅ props로 받은 incidentReport 데이터 확인 및 적용
          if (stableIncidentReport && Object.keys(stableIncidentReport).length > 0) {
            console.log('🔍 props에서 사고보고 데이터 발견:', stableIncidentReport);
            // props 데이터를 상위 컴포넌트에 다시 전달하여 동기화
            Object.keys(stableIncidentReport).forEach((field) => {
              const value = stableIncidentReport[field as keyof typeof stableIncidentReport];
              if (value !== undefined && value !== '') {
                console.log(`📤 필드 복원: ${field} = ${value}`);
                onIncidentReportChange(field, value);
              }
            });
          } else {
            console.log('🔍 props에도 사고보고 데이터 없음');
          }
        }

        console.groupEnd();
      }
    }, [accidentId, stableIncidentReport, onIncidentReportChange]);

    // 커리큘럼탭과 동일한 패턴: 부모 컴포넌트에서 데이터 관리하므로 여기서는 로드/저장 로직 불필요

    // Supabase 클라이언트 생성
    const supabaseClient = React.useMemo(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }, []);

    // DB에서 직접 가져온 마스터코드 목록 state
    const [responseStagesFromDB, setResponseStagesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [discoveryMethodsFromDB, setDiscoveryMethodsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [reportMethodsFromDB, setReportMethodsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [serviceImpactsFromDB, setServiceImpactsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [responseMethodsFromDB, setResponseMethodsFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    const [statusFromDB, setStatusFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog가 열릴 때 DB에서 직접 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        // GROUP010 대응단계 조회
        const { data: group010Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP010')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setResponseStagesFromDB(group010Data || []);

        // GROUP011 발견방법 조회
        const { data: group011Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP011')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setDiscoveryMethodsFromDB(group011Data || []);

        // GROUP014 보고방식 조회
        const { data: group014Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP014')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setReportMethodsFromDB(group014Data || []);

        // GROUP012 서비스/비즈니스영향도 조회
        const { data: group012Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP012')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setServiceImpactsFromDB(group012Data || []);

        // GROUP013 대응방식 조회
        const { data: group013Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP013')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setResponseMethodsFromDB(group013Data || []);

        // GROUP002 상태 조회
        const { data: group002Data } = await supabaseClient
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP002')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });
        setStatusFromDB(group002Data || []);
      };

      fetchMasterCodeData();
    }, [supabaseClient]);

    // GROUP010의 서브코드들 가져오기 (대응단계) - 폴백용
    const responseStageOptions = useMemo(() => {
      const group010SubCodes = getSubCodesByGroup('GROUP010');
      console.log('🔍 GROUP010 서브코드 (대응단계):', group010SubCodes);
      return group010SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // GROUP011의 서브코드들 가져오기 (발견방법)
    const discoveryMethodOptions = useMemo(() => {
      const group011SubCodes = getSubCodesByGroup('GROUP011');
      console.log('🔍 GROUP011 서브코드 (발견방법):', group011SubCodes);
      return group011SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // GROUP012의 서브코드들 가져오기 (서비스영향도)
    const serviceImpactOptions = useMemo(() => {
      const group012SubCodes = getSubCodesByGroup('GROUP012');
      console.log('🔍 GROUP012 서브코드 (서비스영향도):', group012SubCodes);
      return group012SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // GROUP013의 서브코드들 가져오기 (대응방식)
    const responseMethodOptions = useMemo(() => {
      const group013SubCodes = getSubCodesByGroup('GROUP013');
      console.log('🔍 GROUP013 서브코드 (대응방식):', group013SubCodes);
      return group013SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // GROUP014의 서브코드들 가져오기 (보고방식)
    const reportMethodOptions = useMemo(() => {
      const group014SubCodes = getSubCodesByGroup('GROUP014');
      console.log('🔍 GROUP014 서브코드 (보고방식):', group014SubCodes);
      return group014SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // 동적으로 생성된 stages 배열 (DB 데이터 사용)
    const stages = useMemo(() => {
      if (responseStagesFromDB.length > 0) {
        return responseStagesFromDB.map((option) => ({
          key: option.subcode,
          label: option.subcode_name
        }));
      } else if (responseStageOptions.length > 0) {
        return responseStageOptions.map((option) => ({
          key: option.subcode_name,
          label: option.subcode_name
        }));
      } else {
        // 기본 옵션들 (마스터코드 로딩 중일 때)
        return [
          { key: '사고탐지', label: '사고탐지' },
          { key: '현황분석', label: '현황분석' },
          { key: '개선조치중', label: '개선조치중' },
          { key: '즉시해결', label: '즉시해결' },
          { key: '근본개선2', label: '근본개선2' }
        ];
      }
    }, [responseStagesFromDB, responseStageOptions]);

    // 단계별 정보 (동적으로 생성)
    const stageInfo = useMemo(() => {
      const info: Record<string, { index: number; progress: number }> = {};
      stages.forEach((stage, index) => {
        info[stage.key] = {
          index,
          progress: ((index + 1) / stages.length) * 100
        };
      });
      return info;
    }, [stages]);

    const handleFieldChange = useCallback(
      (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
        const value = e.target.value;
        console.log(`🔥 사고보고 필드 입력 감지: field=${field}, value="${value}"`);

        // 상위 컴포넌트 상태 업데이트
        onIncidentReportChange(field, value);

        // sessionStorage 임시 저장 (accidentId가 있을 때만)
        if (accidentId && accidentId > 0) {
          const tempKey = `incident_report_temp_${accidentId}`;
          const currentReport = { ...incidentReport, [field]: value };
          sessionStorage.setItem(tempKey, JSON.stringify(currentReport));
          console.log(`💾 사고보고 임시 저장 완료: ${tempKey}`, currentReport);
        }
      },
      [onIncidentReportChange, incidentReport, accidentId]
    );

    // Step 5 재발방지 대책 상태 관리 (selectedRows는 props로 받음)
    const [editingCell, setEditingCell] = React.useState<{ id: number; field: string } | null>(null);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage] = React.useState(6);

    // 사고 대응 단계는 props로 받아서 사용
    const currentStage = responseStage;

    // 단계 변경 핸들러
    const handleStageChange = (newStage: string) => {
      onResponseStageChange(newStage);
    };

    // Step5 개선사항 관리 함수들 (커리큘럼탭과 동일한 패턴: 부모 state만 수정)
    const handleAddImprovement = useCallback(() => {
      const newImprovement = {
        id: Date.now(), // 임시 ID
        plan: '',
        status: statusFromDB.length > 0 ? statusFromDB[0].subcode_name : '대기',
        completionDate: '',
        assignee: ''
      };

      console.log('📝 Step5 - 개선사항 추가 (부모 state 업데이트):', newImprovement);
      // 커리큘럼탭과 동일: 부모 state만 업데이트 (DB 저장 안함)
      setImprovementItems((prev) => [...prev, newImprovement]);
    }, [statusFromDB, setImprovementItems]);

    const handleDeleteImprovement = useCallback((index: number) => {
      console.log('🗑️ Step5 - 개선사항 삭제 (부모 state 업데이트):', index);
      // 커리큘럼탭과 동일: 부모 state에서만 제거 (DB는 저장버튼 클릭시 처리)
      setImprovementItems((prev) => prev.filter((_, i) => i !== index));
    }, [setImprovementItems]);

    const handleDeleteSelectedImprovements = useCallback(() => {
      const selectedIndices = selectedRows.map((row) => parseInt(row)).sort((a, b) => b - a);

      console.log('🗑️ Step5 - 선택된 개선사항 삭제 (부모 state 업데이트):', selectedIndices);

      // 역순으로 삭제하여 인덱스 변화 방지
      for (const index of selectedIndices) {
        handleDeleteImprovement(index);
      }

      setSelectedRows([]);
    }, [selectedRows, handleDeleteImprovement, setSelectedRows]);

    const handleUpdateImprovementField = useCallback((index: number, field: string, value: string) => {
      console.log('✏️ Step5 - 필드 업데이트 (부모 state 업데이트):', { index, field, value });
      // 커리큘럼탭과 동일: 부모 state만 업데이트 (DB는 저장버튼 클릭시 처리)
      setImprovementItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    }, [setImprovementItems]);

    // 커리큘럼탭과 동일한 패턴: DB 저장 로직은 부모 컴포넌트(SecurityIncidentEditDialog)에서 처리

    // Step 5 재발방지 대책 행 추가/삭제 (기존 함수들을 새로운 Supabase 로직으로 감싸기)
    const handleAddPreventionRow = () => {
      handleAddImprovement();
    };

    const handleDeletePreventionRow = (index: number) => {
      handleDeleteImprovement(index);
    };

    const handleDeleteSelected = () => {
      handleDeleteSelectedImprovements();
    };

    const handlePreventionRowChange = (index: number, field: string, value: string) => {
      handleUpdateImprovementField(index, field, value);
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
        setSelectedRows(improvementItems.map((_: any, index: number) => index.toString()));
      } else {
        setSelectedRows([]);
      }
    };

    // 페이지네이션 계산
    // 개선사항 데이터는 로컬 상태에서 가져오기 (최신 항목이 위로 오도록 역순 정렬)
    const preventionMeasures = [...improvementItems].reverse();
    const totalPages = Math.ceil(preventionMeasures.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = preventionMeasures.slice(startIndex, endIndex);

    // 페이지 변경 핸들러
    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
    };

    const handleCellClick = (index: number, field: string) => {
      setEditingCell({ id: index, field });
    };

    const renderEditableCell = (item: any, field: string, value: string, type: string = 'text', options?: string[], placeholder?: string) => {
      const isEditing = editingCell?.id === improvementItems.indexOf(item) && editingCell?.field === field;

      if (isEditing) {
        if (type === 'select' && options) {
          return (
            <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
              <Select
                value={value}
                onChange={(e) => {
                  const index = improvementItems.indexOf(item);
                  handlePreventionRowChange(index, field, e.target.value);
                  setTimeout(() => setEditingCell(null), 0);
                }}
                size="small"
                fullWidth
                autoFocus
                onClose={() => setEditingCell(null)}
                displayEmpty
              >
                {options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          );
        } else {
          return (
            <TextField
              fullWidth
              size="small"
              type={type}
              value={value}
              onChange={(e) => {
                const index = improvementItems.indexOf(item);
                handlePreventionRowChange(index, field, e.target.value);
              }}
              onBlur={() => setEditingCell(null)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setEditingCell(null);
                }
              }}
              placeholder={placeholder}
              InputLabelProps={type === 'date' ? { shrink: true } : undefined}
              autoFocus
            />
          );
        }
      } else {
        return (
          <Box
            onClick={() => handleCellClick(improvementItems.indexOf(item), field)}
            sx={{
              width: '100%',
              padding: '8px 12px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'text',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '12px',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {value || (placeholder ? <span style={{ color: '#999' }}>{placeholder}</span> : '-')}
            </Typography>
          </Box>
        );
      }
    };

    return (
      <Box
        sx={{
          height: '650px',
          overflowY: 'auto',
          px: 3,
          py: 3,
          '& .MuiInputLabel-root': {
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            overflow: 'visible'
          },
          '& .MuiInputLabel-shrink': {
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            overflow: 'visible'
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderRadius: '8px'
            }
          }
        }}
      >
        {/* 사고 대응 단계 카드 */}
        <Paper
          sx={{
            p: 3,
            mb: 4.5,
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            boxShadow: 'none'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              사고 대응 단계
            </Typography>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel size="small">대응 단계 변경</InputLabel>
              <Select
                size="small"
                value={currentStage}
                label="대응 단계 변경"
                onChange={(e) => handleStageChange(e.target.value)}
                renderValue={(selected) => {
                  const stage = stages.find(s => s.key === selected);
                  return stage ? stage.label : selected;
                }}
              >
                {stages.map((stage) => (
                  <MenuItem key={stage.key} value={stage.key}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 5단계 프로세스 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            {stages.map((stage, index) => {
              const isActive = index === stageInfo[currentStage]?.index;
              const isCompleted = index < stageInfo[currentStage]?.index;
              return (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#2196F3' : isCompleted ? '#4CAF50' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: isActive || isCompleted ? 'white' : '#9e9e9e',
                          fontWeight: 600
                        }}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isActive ? '#2196F3' : isCompleted ? '#4CAF50' : '#9e9e9e',
                        fontWeight: isActive || isCompleted ? 600 : 400,
                        textAlign: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      {stage.label}
                    </Typography>
                  </Box>
                  {index < 4 && (
                    <Box
                      sx={{
                        height: 2,
                        flex: 1,
                        backgroundColor: isCompleted ? '#4CAF50' : '#e0e0e0',
                        mx: 1,
                        mt: -2
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>

          {/* 전체 진행률 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              전체 진행률
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${stageInfo[currentStage]?.progress || 20}%`,
                    height: '100%',
                    backgroundColor: '#2196F3',
                    borderRadius: 4,
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                {stageInfo[currentStage]?.progress || 20}%
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Stepper orientation="vertical" activeStep={-1}>
          {/* Step 1: 사고탐지 */}
          <Step expanded={true}>
            <StepLabel>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                Step 1. {stages[0]?.label || '사고탐지'}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2, backgroundColor: '#ffffff', border: 'none', boxShadow: 'none' }}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="발견일시"
                      type="datetime-local"
                      value={incidentReport.discoveryDateTime || ''}
                      onChange={handleFieldChange('discoveryDateTime')}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="발견자"
                      value={incidentReport.discoverer || ''}
                      onChange={handleFieldChange('discoverer')}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#ffffff'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>발견방법</InputLabel>
                      <Select
                        value={(() => {
                          // 서브코드면 서브코드명으로 변환
                          const current = incidentReport.discoveryMethod || '';
                          const item = discoveryMethodsFromDB.find(m => m.subcode === current || m.subcode_name === current);
                          return item ? item.subcode_name : current;
                        })()}
                        onChange={handleFieldChange('discoveryMethod')}
                        label="발견방법"
                        notched
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return '선택';
                          return selected;
                        }}
                      >
                        <MenuItem value="">선택</MenuItem>
                        {discoveryMethodsFromDB.map((option) => (
                          <MenuItem key={option.subcode} value={option.subcode_name}>
                            {option.subcode_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="보고일시"
                      type="datetime-local"
                      value={incidentReport.reportDateTime || ''}
                      onChange={handleFieldChange('reportDateTime')}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="보고자"
                      value={incidentReport.reporter || ''}
                      onChange={handleFieldChange('reporter')}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#ffffff'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>보고방식</InputLabel>
                      <Select
                        value={(() => {
                          // 서브코드면 서브코드명으로 변환
                          const current = incidentReport.reportMethod || '';
                          const item = reportMethodsFromDB.find(m => m.subcode === current || m.subcode_name === current);
                          return item ? item.subcode_name : current;
                        })()}
                        onChange={handleFieldChange('reportMethod')}
                        label="보고방식"
                        notched
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return '선택';
                          return selected;
                        }}
                      >
                        <MenuItem value="">선택</MenuItem>
                        {reportMethodsFromDB.map((option) => (
                          <MenuItem key={option.subcode} value={option.subcode_name}>
                            {option.subcode_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </StepContent>
          </Step>

          {/* Step 2: 현황분석 */}
          <Step expanded={true}>
            <StepLabel>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                Step 2. {stages[1]?.label || '현황분석'}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2, backgroundColor: '#ffffff', border: 'none', boxShadow: 'none' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="사고대상"
                      value={incidentReport.incidentTarget || ''}
                      onChange={handleFieldChange('incidentTarget')}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="사고원인"
                      value={incidentReport.incidentCause || ''}
                      onChange={handleFieldChange('incidentCause')}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="영향받은 시스템"
                      value={incidentReport.affectedSystems || ''}
                      onChange={handleFieldChange('affectedSystems')}
                      multiline
                      rows={2}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="영향받은 데이터"
                      value={incidentReport.affectedData || ''}
                      onChange={handleFieldChange('affectedData')}
                      multiline
                      rows={2}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>서비스 영향도</InputLabel>
                      <Select
                        value={(() => {
                          // 서브코드면 서브코드명으로 변환
                          const current = incidentReport.serviceImpact || '';
                          const item = serviceImpactsFromDB.find(m => m.subcode === current || m.subcode_name === current);
                          return item ? item.subcode_name : current;
                        })()}
                        onChange={handleFieldChange('serviceImpact')}
                        label="서비스 영향도"
                        notched
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return '선택';
                          return selected;
                        }}
                      >
                        <MenuItem value="">선택</MenuItem>
                        {serviceImpactsFromDB.map((option) => (
                          <MenuItem key={option.subcode} value={option.subcode_name}>
                            {option.subcode_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>비즈니스 영향도</InputLabel>
                      <Select
                        value={(() => {
                          // 서브코드면 서브코드명으로 변환
                          const current = incidentReport.businessImpact || '';
                          const item = serviceImpactsFromDB.find(m => m.subcode === current || m.subcode_name === current);
                          return item ? item.subcode_name : current;
                        })()}
                        onChange={handleFieldChange('businessImpact')}
                        label="비즈니스 영향도"
                        notched
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return '선택';
                          return selected;
                        }}
                      >
                        <MenuItem value="">선택</MenuItem>
                        {serviceImpactsFromDB.map((option) => (
                          <MenuItem key={option.subcode} value={option.subcode_name}>
                            {option.subcode_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="현황 상세"
                      value={incidentReport.situationDetails || ''}
                      onChange={handleFieldChange('situationDetails')}
                      multiline
                      rows={3}
                      placeholder="현재 상황에 대한 상세 설명을 입력하세요"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </StepContent>
          </Step>

          {/* Step 3: 개선조치중 */}
          <Step expanded={true}>
            <StepLabel>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                Step 3. {stages[2]?.label || '개선조치중'}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2, backgroundColor: '#ffffff', border: 'none', boxShadow: 'none' }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>대응방식</InputLabel>
                      <Select
                        value={(() => {
                          // 서브코드면 서브코드명으로 변환
                          const current = incidentReport.responseMethod || '';
                          const item = responseMethodsFromDB.find(m => m.subcode === current || m.subcode_name === current);
                          return item ? item.subcode_name : current;
                        })()}
                        onChange={handleFieldChange('responseMethod')}
                        label="대응방식"
                        notched
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return '선택';
                          return selected;
                        }}
                      >
                        <MenuItem value="">선택</MenuItem>
                        {responseMethodsFromDB.map((option) => (
                          <MenuItem key={option.subcode} value={option.subcode_name}>
                            {option.subcode_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="개선실행자"
                      value={incidentReport.improvementExecutor || ''}
                      onChange={handleFieldChange('improvementExecutor')}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="예상완료일"
                      type="date"
                      value={incidentReport.expectedCompletionDate || ''}
                      onChange={handleFieldChange('expectedCompletionDate')}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="개선안 상세"
                      value={incidentReport.improvementDetails || ''}
                      onChange={handleFieldChange('improvementDetails')}
                      multiline
                      rows={3}
                      placeholder="개선 조치 계획에 대한 상세 설명을 입력하세요"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </StepContent>
          </Step>

          {/* Step 4: 즉시해결 */}
          <Step expanded={true}>
            <StepLabel>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                Step 4. {stages[3]?.label || '즉시해결'}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2, backgroundColor: '#ffffff', border: 'none', boxShadow: 'none' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="완료일"
                      type="date"
                      value={incidentReport.completionDate || ''}
                      onChange={handleFieldChange('completionDate')}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="완료보고 전결"
                      value={incidentReport.completionApprover || ''}
                      onChange={handleFieldChange('completionApprover')}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="해결방식 상세"
                      value={incidentReport.resolutionDetails || ''}
                      onChange={handleFieldChange('resolutionDetails')}
                      multiline
                      rows={3}
                      placeholder="문제 해결 방법에 대한 상세 설명을 입력하세요"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </StepContent>
          </Step>

          {/* Step 5: 근본개선2 */}
          <Step expanded={true}>
            <StepLabel>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                Step 5. {stages[4]?.label || '근본개선2'}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2, backgroundColor: '#ffffff', border: 'none', boxShadow: 'none' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    재발 방지 계획
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" startIcon={<AddCircle size={18} />} onClick={handleAddPreventionRow}>
                      행 추가
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<Trash size={18} />}
                      onClick={handleDeleteSelected}
                      disabled={(selectedRows || []).length === 0}
                    >
                      선택 삭제
                    </Button>
                  </Box>
                </Box>

                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell padding="checkbox" sx={{ width: 50, minWidth: 50, maxWidth: 50 }}>
                          <Checkbox
                            checked={improvementItems.length > 0 && (selectedRows || []).length === improvementItems.length}
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
                        <TableCell sx={{ width: 60, minWidth: 60, maxWidth: 60, fontWeight: 600 }}>NO</TableCell>
                        <TableCell sx={{ width: 250, minWidth: 250, maxWidth: 250, fontWeight: 600 }}>실행안</TableCell>
                        <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120, fontWeight: 600 }}>상태</TableCell>
                        <TableCell sx={{ width: 140, minWidth: 140, maxWidth: 140, fontWeight: 600 }}>완료일</TableCell>
                        <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120, fontWeight: 600 }}>담당자</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preventionMeasures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              재발 방지 계획을 추가하세요
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((row: any, pageIndex: number) => {
                          const actualIndex = startIndex + pageIndex;
                          const displayNo = preventionMeasures.length - actualIndex;
                          return (
                            <TableRow key={actualIndex} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                              <TableCell sx={{ width: 50, minWidth: 50, maxWidth: 50, padding: 0, height: 48 }}>
                                <Box sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Checkbox
                                    checked={(selectedRows || []).includes(actualIndex.toString())}
                                    onChange={() => handleSelectRow(actualIndex.toString())}
                                    color="primary"
                                    size="small"
                                    sx={{
                                      transform: 'scale(0.7)',
                                      '&.Mui-checked': {
                                        color: '#1976d2'
                                      }
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell sx={{ width: 60, minWidth: 60, maxWidth: 60, padding: 0, height: 48 }}>
                                <Box sx={{ height: 48, display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>{displayNo}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ width: 250, minWidth: 250, maxWidth: 250, padding: 0, height: 48 }}>
                                {renderEditableCell(row, 'plan', row.plan || '', 'text', undefined, '클릭하여 실행안을 입력하세요')}
                              </TableCell>
                              <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120, padding: 0, height: 48 }}>
                                {renderEditableCell(row, 'status', row.status || '', 'select', statusFromDB.map(s => s.subcode_name))}
                              </TableCell>
                              <TableCell sx={{ width: 140, minWidth: 140, maxWidth: 140, padding: 0, height: 48 }}>
                                {renderEditableCell(row, 'completionDate', row.completionDate || '', 'date')}
                              </TableCell>
                              <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120, padding: 0, height: 48 }}>
                                {renderEditableCell(row, 'assignee', row.assignee || '')}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* 페이지네이션 */}
                {preventionMeasures.length > itemsPerPage && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                      px: 1,
                      position: 'relative',
                      left: '24px',
                      right: '24px'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {preventionMeasures.length > 0
                        ? `${startIndex + 1}-${Math.min(endIndex, preventionMeasures.length)} of ${preventionMeasures.length}`
                        : '0-0 of 0'}
                    </Typography>
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
                          fontSize: '0.75rem',
                          minWidth: '28px',
                          height: '28px'
                        }
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    label="재발 방지 대책 상세"
                    value={incidentReport.preventionDetails || ''}
                    onChange={handleFieldChange('preventionDetails')}
                    multiline
                    rows={3}
                    placeholder="재발 방지를 위한 종합적인 대책을 상세히 입력하세요"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Paper>
            </StepContent>
          </Step>
        </Stepper>
      </Box>
    );
  }
);

SecurityIncidentReportTab.displayName = 'SecurityIncidentReportTab';

export default SecurityIncidentReportTab;
