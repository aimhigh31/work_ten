import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 캐시 키
const CACHE_KEY = createCacheKey('kpi', 'data');

export interface KpiData {
  id: number;
  code: string;
  work_content: string;
  description?: string | null;
  selection_background?: string | null;
  impact?: string | null;
  evaluation_criteria_s?: string | null;
  evaluation_criteria_a?: string | null;
  evaluation_criteria_b?: string | null;
  evaluation_criteria_c?: string | null;
  evaluation_criteria_d?: string | null;
  management_category?: string | null;
  target_kpi?: string | null;
  current_kpi?: string | null;
  department?: string | null;
  progress?: number | null;
  status: string;
  start_date?: string | null;
  completed_date?: string | null;
  team?: string | null;
  assignee?: string | null;
  registration_date: string;
  created_at?: string;
  updated_at?: string;
}

export const useSupabaseKpi = () => {
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(false); // 즉시 UI 렌더링을 위해 false로 설정
  const [error, setError] = useState<string | null>(null);

  // KPI 목록 조회
  const fetchKpis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('main_kpi_data')
        .select('*')
        .order('id', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setKpis(data || []);

      // 캐시에 저장
      saveToCache(CACHE_KEY, data || []);
    } catch (err: any) {
      console.error('KPI 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // KPI 추가
  const addKpi = useCallback(async (kpiData: Omit<KpiData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('📝 KPI 추가 데이터:', kpiData);

      const { data, error: insertError } = await supabase
        .from('main_kpi_data')
        .insert([kpiData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Supabase Insert 오류:', insertError);
        throw insertError;
      }

      console.log('✅ KPI 추가 성공:', data);
      setKpis((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('KPI 추가 오류 상세:', {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });
      setError(err?.message || JSON.stringify(err));
      throw err;
    }
  }, []);

  // KPI 수정
  const updateKpi = useCallback(async (id: number, updates: Partial<KpiData>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('main_kpi_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setKpis((prev) => prev.map((kpi) => (kpi.id === id ? data : kpi)));
      return data;
    } catch (err: any) {
      console.error('KPI 수정 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // KPI 삭제
  const deleteKpi = useCallback(async (id: number) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_data').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setKpis((prev) => prev.filter((kpi) => kpi.id !== id));
    } catch (err: any) {
      console.error('KPI 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 여러 KPI 삭제
  const deleteKpis = useCallback(async (ids: number[]) => {
    try {
      const { error: deleteError } = await supabase.from('main_kpi_data').delete().in('id', ids);

      if (deleteError) {
        throw deleteError;
      }

      setKpis((prev) => prev.filter((kpi) => !ids.includes(kpi.id)));
    } catch (err: any) {
      console.error('KPI 일괄 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // 코드로 KPI 조회
  const getKpiByCode = useCallback(
    async (code: string) => {
      try {
        const { data, error: fetchError } = await supabase.from('main_kpi_data').select('*').eq('code', code).single();

        if (fetchError) {
          throw fetchError;
        }

        return data;
      } catch (err: any) {
        console.error('KPI 조회 오류:', err);
        return null;
      }
    },
    []
  );

  // 초기 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedKpis = loadFromCache<KpiData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);

    if (cachedKpis) {
      setKpis(cachedKpis);
      setLoading(false);
      console.log('⚡ [KPI] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchKpis();
  }, [fetchKpis]);

  return {
    kpis,
    loading,
    error,
    fetchKpis,
    addKpi,
    updateKpi,
    deleteKpi,
    deleteKpis,
    getKpiByCode
  };
};
