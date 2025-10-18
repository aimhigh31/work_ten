import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface KpiRecordData {
  id: number;
  kpi_id: number;
  month: string;
  target_kpi?: string | null;
  actual_kpi?: string | null;
  traffic_light?: string;
  overall_progress?: string;
  plan_performance?: string | null;
  achievement_reflection?: string | null;
  attachments?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export const useSupabaseKpiRecord = (kpiId?: number) => {
  const [records, setRecords] = useState<KpiRecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 특정 KPI의 실적 목록 조회
  const fetchRecords = useCallback(async (targetKpiId?: number) => {
    const fetchKpiId = targetKpiId || kpiId;
    if (!fetchKpiId) {
      console.warn('KPI ID가 제공되지 않았습니다.');
      return;
    }

    // 1. 동적 캐시 키 생성
    const cacheKey = createCacheKey('kpi_record', `kpi_${fetchKpiId}`);
    const cachedData = loadFromCache<KpiRecordData[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [KpiRecord] 캐시 데이터 반환');
      setRecords(cachedData);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('main_kpi_record')
        .select('*')
        .eq('kpi_id', fetchKpiId)
        .order('month', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setRecords(data || []);

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

    } catch (err: any) {
      console.error('KPI Record 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [kpiId]);

  // 실적 추가
  const addRecord = useCallback(async (recordData: Omit<KpiRecordData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('📝 KPI Record 추가 데이터:', recordData);

      const { data, error: insertError } = await supabase
        .from('main_kpi_record')
        .insert([recordData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Supabase Insert 오류:', insertError);
        throw insertError;
      }

      console.log('✅ KPI Record 추가 성공:', data);
      setRecords((prev) => [...prev, data]);
      return data;
    } catch (err: any) {
      console.error('KPI Record 추가 오류:', err);
      setError(err?.message || JSON.stringify(err));
      throw err;
    }
  }, []);

  // 실적 수정
  const updateRecord = useCallback(async (id: number, updates: Partial<KpiRecordData>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('main_kpi_record')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setRecords((prev) => prev.map((record) => (record.id === id ? data : record)));
      return data;
    } catch (err: any) {
      console.error('KPI Record 수정 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 실적 삭제
  const deleteRecord = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_record').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setRecords((prev) => prev.filter((record) => record.id !== id));
    } catch (err: any) {
      console.error('KPI Record 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 여러 실적 삭제
  const deleteRecords = useCallback(async (ids: number[]) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_record').delete().in('id', ids);

      if (deleteError) {
        throw deleteError;
      }

      setRecords((prev) => prev.filter((record) => !ids.includes(record.id)));
    } catch (err: any) {
      console.error('KPI Record 일괄 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 특정 KPI의 모든 실적 삭제
  const deleteAllRecordsByKpiId = useCallback(async (targetKpiId: number) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_record').delete().eq('kpi_id', targetKpiId);

      if (deleteError) {
        throw deleteError;
      }

      if (targetKpiId === kpiId) {
        setRecords([]);
      }
    } catch (err: any) {
      console.error('KPI Record 전체 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, [kpiId]);

  // 초기 데이터 로드
  useEffect(() => {
    if (kpiId) {
      fetchRecords(kpiId);
    }
  }, [kpiId, fetchRecords]);

  return {
    records,
    loading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    deleteRecords,
    deleteAllRecordsByKpiId
  };
};
