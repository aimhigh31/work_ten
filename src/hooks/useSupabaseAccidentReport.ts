import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 사고보고 데이터 타입
export interface AccidentReport {
  id?: number;
  accident_id: number;

  // Step 1: 사고탐지
  discovery_datetime?: string | null;
  discoverer?: string | null;
  discovery_method?: string | null;
  report_datetime?: string | null;
  reporter?: string | null;
  report_method?: string | null;

  // Step 2: 현황분석
  incident_target?: string | null;
  incident_cause?: string | null;
  affected_systems?: string | null;
  affected_data?: string | null;
  service_impact?: string | null;
  business_impact?: string | null;
  situation_details?: string | null;

  // Step 3: 개선조치중
  response_method?: string | null;
  improvement_executor?: string | null;
  expected_completion_date?: string | null;
  improvement_details?: string | null;

  // Step 4: 즉시해결
  completion_date?: string | null;
  completion_approver?: string | null;
  resolution_details?: string | null;

  // Step 5: 근본개선
  prevention_details?: string | null;

  // 메타데이터
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export function useSupabaseAccidentReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사고보고 조회 (accident_id 기준)
  const fetchReportByAccidentId = useCallback(async (accidentId: number): Promise<AccidentReport | null> => {
    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('accident_report', `accident_${accidentId}`);
    const cachedData = loadFromCache<AccidentReport>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [AccidentReport] 캐시 데이터 반환');
      return cachedData;
    }

    try {
      console.log('📋 사고보고 조회 시작:', accidentId);
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('security_accident_report').select('*').eq('accident_id', accidentId).single();

      if (error) {
        // 데이터가 없는 경우는 에러가 아님
        if (error.code === 'PGRST116') {
          console.log('ℹ️ 사고보고 데이터 없음');
          return null;
        }
        console.error('🔴 사고보고 조회 실패:', error);
        setError(error.message);
        return null;
      }

      console.log('✅ 사고보고 조회 성공:', data);

      // 2. 캐시에 저장
      if (data) {
        saveToCache(cacheKey, data);
      }

      return data;
    } catch (err) {
      console.error('🔴 예상치 못한 오류:', err);
      setError('사고보고 조회 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 사고보고 생성 또는 업데이트
  const saveReport = useCallback(async (report: Partial<AccidentReport>): Promise<AccidentReport | null> => {
    try {
      console.log('💾 사고보고 저장 시작:', report);
      setLoading(true);
      setError(null);

      if (!report.accident_id) {
        throw new Error('accident_id가 필요합니다.');
      }

      // 기존 데이터 확인 (직접 supabase 호출로 무한 루프 방지)
      console.log('🔍 기존 데이터 확인 중...');
      const { data: existingData, error: fetchError } = await supabase
        .from('security_accident_report')
        .select('*')
        .eq('accident_id', report.accident_id)
        .single();

      let existing = null;
      if (!fetchError || fetchError.code !== 'PGRST116') {
        if (fetchError) {
          console.error('🔴 기존 데이터 확인 실패:', fetchError);
          throw new Error(`기존 데이터 확인 실패: ${fetchError.message}`);
        }
        existing = existingData;
      }

      console.log('📊 기존 데이터:', existing ? '있음' : '없음');

      let result;
      if (existing) {
        // 업데이트
        console.log('🔄 기존 데이터 업데이트');
        const { data, error } = await supabase
          .from('security_accident_report')
          .update({
            ...report,
            updated_at: new Date().toISOString(),
            updated_by: 'user'
          })
          .eq('accident_id', report.accident_id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // 새로 생성
        console.log('➕ 새 데이터 생성');
        const { data, error } = await supabase
          .from('security_accident_report')
          .insert([
            {
              ...report,
              created_at: new Date().toISOString(),
              created_by: 'user'
            }
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('✅ 사고보고 저장 성공:', result);
      return result;
    } catch (err: any) {
      console.error('🔴 사고보고 저장 실패:', err);
      console.error('🔴 에러 타입:', typeof err);
      console.error('🔴 에러 구조:', JSON.stringify(err, null, 2));

      const errorMessage = err?.message || err?.toString() || '사고보고 저장 중 오류가 발생했습니다.';
      console.error('🔴 최종 에러 메시지:', errorMessage);

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // fetchReportByAccidentId 의존성 제거로 무한 루프 방지

  // 사고보고 삭제
  const deleteReport = useCallback(async (accidentId: number): Promise<boolean> => {
    try {
      console.log('🗑️ 사고보고 삭제 시작:', accidentId);
      setLoading(true);
      setError(null);

      const { error } = await supabase.from('security_accident_report').delete().eq('accident_id', accidentId);

      if (error) throw error;

      console.log('✅ 사고보고 삭제 성공');
      return true;
    } catch (err: any) {
      console.error('🔴 사고보고 삭제 실패:', err);
      setError(err.message || '사고보고 삭제 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchReportByAccidentId,
    saveReport,
    deleteReport
  };
}
