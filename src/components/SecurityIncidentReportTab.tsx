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
}

const SecurityIncidentReportTab = memo(
  ({
    incidentReport = {},
    onIncidentReportChange = () => {},
    responseStage = '사고탐지',
    onResponseStageChange = () => {},
    accidentId
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

    // 개선사항 Supabase 훅 사용
    const {
      items: improvementItems,
      loading: improvementLoading,
      error: improvementError,
      fetchImprovementsByAccidentId,
      createImprovement,
      updateImprovement,
      deleteImprovement,
      replaceAllImprovements
    } = useSupabaseImprovements();

    // 로컬 상태로 개선사항 관리 (임시 저장용)
    const [localImprovements, setLocalImprovements] = useState<any[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

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

    // accidentId가 있을 때 개선사항 데이터 로드 (수정 모드) - 안전성 강화
    useEffect(() => {
      let isMounted = true; // cleanup flag

      const loadImprovements = async () => {
        console.group('🔍 Step5 - 데이터 로드 프로세스');
        console.log('accidentId:', accidentId, '타입:', typeof accidentId);

        try {
          if (accidentId && accidentId > 0) {
            console.log('📊 수정 모드 - accidentId로 개선사항 데이터 로드:', accidentId);
            if (isMounted) {
              setIsEditMode(true);
              await fetchImprovementsByAccidentId(accidentId);
            }
          } else {
            console.log('📝 신규 모드 - sessionStorage에서 로드');
            if (isMounted) {
              setIsEditMode(false);

              // 임시 저장 키 확인 (신규는 일반 키, 수정은 accidentId 포함 키)
              const tempKey = 'tempSecurityImprovements';
              const savedImprovements = sessionStorage.getItem(tempKey);

              if (savedImprovements) {
                try {
                  const parsed = JSON.parse(savedImprovements);
                  console.log('📦 sessionStorage에서 로드된 데이터:', { key: tempKey, data: parsed });
                  if (isMounted) {
                    setLocalImprovements(Array.isArray(parsed) ? parsed : []);
                  }
                } catch (parseError) {
                  console.error('🔴 sessionStorage 파싱 오류:', parseError);
                  if (isMounted) {
                    setLocalImprovements([]);
                  }
                }
              } else {
                console.log('📦 sessionStorage에 데이터 없음, 빈 배열로 초기화');
                if (isMounted) {
                  setLocalImprovements([]);
                }
              }
            }
          }
        } catch (error) {
          console.error('🔴 데이터 로드 중 오류:', error);
          if (isMounted) {
            setLocalImprovements([]);
          }
        }

        console.groupEnd();
      };

      loadImprovements();

      return () => {
        isMounted = false; // cleanup
      };
    }, [accidentId, fetchImprovementsByAccidentId]);

    // Supabase에서 로드된 데이터를 로컬 상태에 동기화 (수정 모드) - 안전성 강화
    useEffect(() => {
      let isMounted = true;

      if (isEditMode && Array.isArray(improvementItems)) {
        console.log('🔄 Step5 - Supabase 데이터를 로컬에 동기화:', improvementItems);

        try {
          const formattedItems = improvementItems
            .map((item, index) => {
              if (!item || typeof item !== 'object') {
                console.warn(`⚠️ 잘못된 개선사항 데이터 [${index}]:`, item);
                return null;
              }

              return {
                id: item.id || Date.now() + index,
                plan: String(item.plan || ''),
                status: String(item.status || '미완료'),
                completionDate: String(item.completion_date || ''),
                assignee: String(item.assignee || '')
              };
            })
            .filter(Boolean); // null 제거

          if (isMounted) {
            setLocalImprovements(formattedItems);
          }
        } catch (error) {
          console.error('🔴 데이터 동기화 중 오류:', error);
          if (isMounted) {
            setLocalImprovements([]);
          }
        }
      }

      return () => {
        isMounted = false;
      };
    }, [improvementItems, isEditMode]);

    // 로컬 데이터 변경 시 sessionStorage에 임시 저장 (data_relation.md 패턴) - 안전성 강화
    useEffect(() => {
      try {
        // accidentId 기반 임시 저장 키 생성
        const tempKey = accidentId ? `tempSecurityImprovements_${accidentId}` : 'tempSecurityImprovements';

        if (Array.isArray(localImprovements) && localImprovements.length > 0) {
          // 데이터 유효성 검증
          const validData = localImprovements.filter(
            (item) =>
              item && typeof item === 'object' && (item.plan !== undefined || item.status !== undefined || item.assignee !== undefined)
          );

          if (validData.length > 0) {
            console.log('💾 Step5 - sessionStorage에 임시 저장:', { key: tempKey, data: validData });
            const jsonString = JSON.stringify(validData);
            sessionStorage.setItem(tempKey, jsonString);
          } else {
            console.log('🧹 Step5 - 유효하지 않은 데이터, sessionStorage 키 삭제:', tempKey);
            sessionStorage.removeItem(tempKey);
          }
        } else {
          // 빈 배열이거나 유효하지 않은 경우 해당 키 삭제
          console.log('🧹 Step5 - 빈 배열, sessionStorage 키 삭제:', tempKey);
          sessionStorage.removeItem(tempKey);
        }
      } catch (error) {
        console.error('🔴 sessionStorage 저장 중 오류:', error);
      }
    }, [localImprovements, accidentId]);

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

    // Step 5 재발방지 대책 상태 관리
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
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

    // Step5 개선사항 관리 함수들 (data_relation.md 패턴 적용)
    const handleAddImprovement = useCallback(() => {
      const newImprovement = {
        id: Date.now(), // 임시 ID
        plan: '',
        status: statusFromDB.length > 0 ? statusFromDB[0].subcode_name : '대기',
        completionDate: '',
        assignee: ''
      };

      console.log('📝 Step5 - 개선사항 추가 (임시저장):', newImprovement);
      // 항상 로컬 상태에만 추가 (신규/수정 모드 관계없이)
      setLocalImprovements((prev) => [...prev, newImprovement]);
    }, [statusFromDB]);

    const handleDeleteImprovement = useCallback((index: number) => {
      console.log('🗑️ Step5 - 개선사항 삭제 (임시저장):', index);
      // 항상 로컬 상태에서만 삭제 (DB는 저장버튼 클릭시에만 반영)
      setLocalImprovements((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleDeleteSelectedImprovements = useCallback(() => {
      const selectedIndices = selectedRows.map((row) => parseInt(row)).sort((a, b) => b - a);

      console.log('🗑️ Step5 - 선택된 개선사항 삭제 (임시저장):', selectedIndices);

      // 역순으로 삭제하여 인덱스 변화 방지
      for (const index of selectedIndices) {
        handleDeleteImprovement(index);
      }

      setSelectedRows([]);
    }, [selectedRows, handleDeleteImprovement]);

    const handleUpdateImprovementField = useCallback((index: number, field: string, value: string) => {
      console.log('✏️ Step5 - 필드 업데이트 (임시저장):', { index, field, value });
      // 항상 로컬 상태에만 업데이트 (DB는 저장버튼 클릭시에만 반영)
      setLocalImprovements((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    }, []);

    // 전체 개선사항 저장 함수 (data_relation.md 패턴: 삭제 후 재저장)
    const saveAllImprovements = useCallback(
      async (finalAccidentId: number) => {
        console.group('💾 Step5 - saveAllImprovements 실행');
        console.log('📋 입력 파라미터:', { finalAccidentId, type: typeof finalAccidentId });
        console.log('📋 현재 상태:', {
          localImprovements: localImprovements.length,
          isEditMode,
          improvementsData: localImprovements
        });

        try {
          // 입력값 검증
          if (!finalAccidentId || finalAccidentId <= 0) {
            console.error('🔴 잘못된 accidentId:', finalAccidentId);
            console.groupEnd();
            return false;
          }

          console.log('🟡 1단계: 기존 개선사항 데이터 삭제 시작');
          // 1단계: 기존 개선사항 데이터 삭제 (수정 모드의 경우)
          if (isEditMode && finalAccidentId) {
            console.log('🗑️ 기존 개선사항 삭제 중...');
            const deletePromise = supabase.from('security_accident_improvement').delete().eq('accident_id', finalAccidentId);

            const deleteResult = await deletePromise;
            console.log('🗑️ 삭제 결과:', deleteResult);

            if (deleteResult.error) {
              console.error('🔴 기존 개선사항 삭제 실패:', deleteResult.error);
              console.groupEnd();
              return false;
            }
            console.log('✅ 기존 개선사항 삭제 성공');
          }

          console.log('🟡 2단계: 새로운 개선사항 데이터 저장 시작');
          // 2단계: 새로운 개선사항 데이터 저장 (데이터가 있는 경우만)
          if (localImprovements.length > 0) {
            const improvementRequests: CreateImprovementRequest[] = localImprovements.map((item, index) => {
              console.log(`📝 변환 중 ${index + 1}/${localImprovements.length}:`, item);
              return {
                accident_id: finalAccidentId,
                plan: item.plan,
                status: item.status as '미완료' | '진행중' | '완료',
                completion_date: item.completionDate || undefined,
                assignee: item.assignee || undefined
              };
            });

            console.log('💾 삽입할 데이터:', improvementRequests);

            const insertPromise = supabase.from('security_accident_improvement').insert(improvementRequests).select();

            const insertResult = await insertPromise;
            console.log('💾 삽입 결과:', insertResult);

            if (insertResult.error) {
              console.error('🔴 새 개선사항 저장 실패:', insertResult.error);
              console.groupEnd();
              return false;
            }

            console.log('✅ 새 개선사항 저장 성공:', insertResult.data);
          } else {
            console.log('📝 저장할 개선사항이 없음');
          }

          console.log('🟡 3단계: 임시 저장 데이터 정리 시작');
          // 3단계: 임시 저장 데이터 정리
          const tempKey = finalAccidentId ? `tempSecurityImprovements_${finalAccidentId}` : 'tempSecurityImprovements';
          console.log('🧹 정리할 키:', tempKey);
          sessionStorage.removeItem(tempKey);

          // 캐시 무효화 (최신 데이터 보장) - createCacheKey 사용
          const cacheKey = createCacheKey('improvements', `accident_${finalAccidentId}`);
          sessionStorage.removeItem(cacheKey);
          console.log('🗑️ saveAllImprovements: 캐시 무효화 완료', cacheKey);

          console.log('🟡 4단계: 수정 모드로 전환 및 데이터 다시 로드 시작');
          // 4단계: 수정 모드로 전환 및 데이터 다시 로드
          setIsEditMode(true);
          if (finalAccidentId) {
            console.log('🔄 데이터 재로드 중...');
            const fetchPromise = fetchImprovementsByAccidentId(finalAccidentId);
            await fetchPromise;
            console.log('🔄 데이터 재로드 완료');
          }

          console.log('✅ 전체 저장 프로세스 완료');
          console.groupEnd();
          return true;
        } catch (error) {
          console.group('🔴 Step5 - saveAllImprovements 오류 상세 분석');
          console.error('오류 타입:', typeof error);
          console.error('오류 생성자:', error?.constructor?.name);
          console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
          console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack');
          console.error('전체 오류 객체:', error);
          console.groupEnd();
          console.groupEnd();

          // 에러를 상위로 전파하지 않고 false 반환
          return false;
        }
      },
      [localImprovements, isEditMode, fetchImprovementsByAccidentId]
    );

    // 사고보고 데이터 저장 함수 (data_relation2.md 패턴 적용)
    const saveIncidentReport = useCallback(
      async (finalAccidentId: number) => {
        console.group('💾 SecurityIncidentReportTab - saveIncidentReport 실행');
        console.log('📋 입력 파라미터:', { finalAccidentId, incidentReport });

        try {
          if (!finalAccidentId || finalAccidentId <= 0) {
            console.error('🔴 잘못된 accidentId:', finalAccidentId);
            console.groupEnd();
            return false;
          }

          // ✅ 핵심: sessionStorage에서 최신 데이터 우선 사용 (data_relation2.md 패턴)
          let finalIncidentReport = incidentReport;
          const tempKey = `incident_report_temp_${finalAccidentId}`;
          const tempData = sessionStorage.getItem(tempKey);

          if (tempData) {
            try {
              const parsedTempData = JSON.parse(tempData);
              finalIncidentReport = parsedTempData;
              console.log('🔍 sessionStorage 우선 사용:', { tempKey, data: parsedTempData });
            } catch (parseError) {
              console.error('🔴 sessionStorage 파싱 오류:', parseError);
            }
          } else {
            console.log('🔍 sessionStorage 데이터 없음, 현재 상태 사용');
          }

          // incident_report JSON 컬럼에 모든 데이터 저장
          const incidentReportData = {
            // Step 1 - 사고탐지
            discoveryDateTime: finalIncidentReport.discoveryDateTime || null,
            discoverer: finalIncidentReport.discoverer || null,
            discoveryMethod: finalIncidentReport.discoveryMethod || null,
            reportDateTime: finalIncidentReport.reportDateTime || null,
            reporter: finalIncidentReport.reporter || null,
            reportMethod: finalIncidentReport.reportMethod || null,

            // Step 2 - 현황분석
            incidentTarget: finalIncidentReport.incidentTarget || null,
            incidentCause: finalIncidentReport.incidentCause || null,
            affectedSystems: finalIncidentReport.affectedSystems || null,
            affectedData: finalIncidentReport.affectedData || null,
            serviceImpact: finalIncidentReport.serviceImpact || null,
            businessImpact: finalIncidentReport.businessImpact || null,
            situationDetails: finalIncidentReport.situationDetails || null,

            // Step 3 - 개선조치중
            responseMethod: finalIncidentReport.responseMethod || null,
            improvementExecutor: finalIncidentReport.improvementExecutor || null,
            expectedCompletionDate: finalIncidentReport.expectedCompletionDate || null,
            improvementDetails: finalIncidentReport.improvementDetails || null,

            // Step 4 - 즉시해결
            completionDate: finalIncidentReport.completionDate || null,
            completionApprover: finalIncidentReport.completionApprover || null,
            resolutionDetails: finalIncidentReport.resolutionDetails || null,

            // Step 5 - 근본개선2
            preventionDetails: finalIncidentReport.preventionDetails || null
          };

          // 사고보고 데이터 업데이트
          const updateData = {
            incident_report: incidentReportData, // JSON 컬럼에 저장
            discoverer: finalIncidentReport.discoverer || null, // 기존 컬럼 호환
            prevention_plan: finalIncidentReport.preventionDetails || null, // 기존 컬럼 호환
            completed_date: finalIncidentReport.completionDate || null, // 기존 컬럼 호환
            response_stage: responseStage,
            updated_at: new Date().toISOString(),
            updated_by: 'user'
          };

          console.log('🟡 최종 저장 데이터:', updateData);

          const { data, error } = await supabase.from('security_accident_data').update(updateData).eq('id', finalAccidentId).select();

          if (error) {
            console.error('🔴 사고보고 데이터 저장 실패:');
            console.error('- 에러 메시지:', error.message);
            console.error('- 에러 코드:', error.code);
            console.error('- 에러 힌트:', error.hint);
            console.error('- 에러 상세:', error.details);
            console.error('- 전체 에러 객체:', JSON.stringify(error, null, 2));
            console.groupEnd();
            return false;
          }

          // ✅ 저장 성공 후 sessionStorage 정리 (data_relation2.md 패턴)
          sessionStorage.removeItem(tempKey);
          console.log('🧹 임시 데이터 정리 완료:', tempKey);

          console.log('✅ 사고보고 데이터 저장 성공:', data);
          console.groupEnd();
          return true;
        } catch (error) {
          console.error('🔴 saveIncidentReport 오류:');
          console.error('- 오류 타입:', typeof error);
          console.error('- 오류 메시지:', error instanceof Error ? error.message : String(error));
          console.error('- 오류 스택:', error instanceof Error ? error.stack : 'No stack');
          console.error('- 전체 오류:', JSON.stringify(error, null, 2));
          console.groupEnd();
          return false;
        }
      },
      [incidentReport, responseStage]
    );

    // 전역 접근 가능하도록 설정 (다른 컴포넌트에서 호출용)
    useEffect(() => {
      // Promise rejection을 안전하게 처리하는 래퍼 함수 (개선된 진단 버전)
      const safeSaveAllImprovements = async (finalAccidentId: number) => {
        console.group('🛡️ Step5 - safeSaveAllImprovements 래퍼 실행');
        console.log('📋 래퍼 입력:', { finalAccidentId, type: typeof finalAccidentId });

        try {
          console.log('🔄 내부 saveAllImprovements 호출 시작');

          // Promise가 제대로 반환되는지 확인
          const savePromise = saveAllImprovements(finalAccidentId);
          console.log('🔄 Promise 생성됨:', typeof savePromise, savePromise);

          if (!savePromise || typeof savePromise.then !== 'function') {
            console.error('🔴 saveAllImprovements가 Promise를 반환하지 않음:', savePromise);
            console.groupEnd();
            return false;
          }

          const result = await savePromise;
          console.log('🔄 내부 함수 실행 완료, 결과:', result, '타입:', typeof result);
          console.groupEnd();
          return result;
        } catch (error) {
          console.group('🔴 Step5 - safeSaveAllImprovements 래퍼 오류 분석');
          console.error('래퍼 오류 타입:', typeof error);
          console.error('래퍼 오류 생성자:', error?.constructor?.name);
          console.error('래퍼 오류 메시지:', error instanceof Error ? error.message : String(error));
          console.error('래퍼 오류 스택:', error instanceof Error ? error.stack : 'No stack');
          console.error('전체 래퍼 오류 객체:', error);
          console.groupEnd();
          console.groupEnd();
          return false;
        }
      };

      // 사고보고 데이터 저장 래퍼 함수
      const safeSaveIncidentReport = async (finalAccidentId: number) => {
        console.group('🛡️ SecurityIncidentReportTab - safeSaveIncidentReport 래퍼 실행');
        console.log('📋 래퍼 입력:', { finalAccidentId, type: typeof finalAccidentId });

        try {
          const result = await saveIncidentReport(finalAccidentId);
          console.log('🔄 사고보고 저장 완료, 결과:', result);
          console.groupEnd();
          return result;
        } catch (error) {
          console.error('🔴 사고보고 저장 래퍼 오류:', error);
          console.groupEnd();
          return false;
        }
      };

      (window as any).saveSecurityImprovements = safeSaveAllImprovements;
      (window as any).saveSecurityIncidentReport = safeSaveIncidentReport;

      return () => {
        delete (window as any).saveSecurityImprovements;
        delete (window as any).saveSecurityIncidentReport;
      };
    }, [saveAllImprovements, saveIncidentReport]);

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
        setSelectedRows(localImprovements.map((_: any, index: number) => index.toString()));
      } else {
        setSelectedRows([]);
      }
    };

    // 페이지네이션 계산
    // 개선사항 데이터는 로컬 상태에서 가져오기 (최신 항목이 위로 오도록 역순 정렬)
    const preventionMeasures = [...localImprovements].reverse();
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
      const isEditing = editingCell?.id === localImprovements.indexOf(item) && editingCell?.field === field;

      if (isEditing) {
        if (type === 'select' && options) {
          return (
            <Box sx={{ width: '100%', height: '48px', position: 'relative' }}>
              <Select
                value={value}
                onChange={(e) => {
                  const index = localImprovements.indexOf(item);
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
                const index = localImprovements.indexOf(item);
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
            onClick={() => handleCellClick(localImprovements.indexOf(item), field)}
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
                            checked={localImprovements.length > 0 && (selectedRows || []).length === localImprovements.length}
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
