import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 캐시 키
const CACHE_KEY = createCacheKey('software', 'data');

export interface SoftwareData {
  id?: number;
  registration_date?: string;
  code?: string;
  team?: string;
  department?: string;
  work_content?: string;
  status?: string;
  assignee?: string;
  start_date?: string;
  completed_date?: string;
  attachments?: string[];

  // 소프트웨어 특화 필드
  software_name?: string;
  description?: string;
  software_category?: string;
  spec?: string;
  current_users?: string; // current_user → current_users로 변경
  solution_provider?: string;
  user_count?: number;
  license_type?: string;
  license_key?: string;

  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSupabaseSoftware = () => {
  const [software, setSoftware] = useState<SoftwareData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 소프트웨어 목록 조회 (투자관리 방식: 캐시 우선 전략)
  const getSoftware = useCallback(async (): Promise<SoftwareData[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<SoftwareData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [Software] 캐시 데이터 반환 (깜빡임 방지)');
      setSoftware(cachedData); // ✅ 캐시 데이터로 상태 업데이트 (KPI 패턴)
      return cachedData;
    }

    // 2. 캐시 없으면 DB 조회
    try {
      console.log('📞 getSoftware 호출');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_software_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('❌ Supabase 조회 오류:', error);
        throw error;
      }

      console.log('✅ getSoftware 성공:', data?.length || 0, '개');

      // 3. 상태 업데이트 (KPI 패턴)
      setSoftware(data || []);

      // 4. 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      return data || [];
    } catch (err: any) {
      console.log('❌ getSoftware 실패:', err);
      setError(err.message || '소프트웨어 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 소프트웨어 생성
  const createSoftware = useCallback(async (softwareData: Omit<SoftwareData, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('🆕 소프트웨어 생성 시작:', softwareData);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_software_data')
        .insert([
          {
            ...softwareData,
            is_active: true,
            registration_date: new Date().toISOString().split('T')[0]
          }
        ])
        .select()
        .single();

      if (error) {
        console.log('❌ Supabase 생성 오류:', error);
        throw error;
      }

      console.log('✅ createSoftware 성공:', data);

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setSoftware((prev) => [data, ...prev]);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ createSoftware 실패:', err);
      setError(err.message || '소프트웨어 생성 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 소프트웨어 수정
  const updateSoftware = useCallback(async (id: number, softwareData: Partial<SoftwareData>) => {
    console.log('🔄 소프트웨어 수정 시작:', { id, softwareData });

    try {
      setLoading(true);
      setError(null);

      const cleanData = Object.fromEntries(Object.entries(softwareData).filter(([_, value]) => value !== null && value !== undefined));

      const { data, error } = await supabase.from('it_software_data').update(cleanData).eq('id', id).select().single();

      if (error) {
        console.log('❌ Supabase 수정 오류:', error);
        throw error;
      }

      if (!data) {
        throw new Error('수정된 데이터가 반환되지 않았습니다.');
      }

      console.log('✅ updateSoftware 성공:', data);

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setSoftware((prev) => prev.map((sw) => (sw.id === id ? data : sw)));

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ updateSoftware 실패:', err);
      setError(err.message || '소프트웨어 수정 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 소프트웨어 삭제 (soft delete)
  const deleteSoftware = useCallback(async (id: number) => {
    console.log('🗑️ 소프트웨어 삭제 시작:', id);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('it_software_data').update({ is_active: false }).eq('id', id).select().single();

      if (error) {
        console.log('❌ Supabase 삭제 오류:', error);
        throw error;
      }

      console.log('✅ deleteSoftware 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ deleteSoftware 실패:', err);
      setError(err.message || '소프트웨어 삭제 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 소프트웨어 조회
  const getSoftwareById = useCallback(async (id: number): Promise<SoftwareData | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.from('it_software_data').select('*').eq('id', id).eq('is_active', true).single();

      if (error) {
        console.error('소프트웨어 데이터 조회 실패:', error);
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('getSoftwareById 실패:', err);
      setError(err.message || '소프트웨어 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 여러 소프트웨어 삭제 (soft delete)
  const deleteMultipleSoftware = useCallback(async (ids: number[]) => {
    console.log('🗑️ 여러 소프트웨어 삭제 시작:', ids);

    if (!ids || ids.length === 0) {
      console.log('⚠️ 삭제할 소프트웨어 ID가 없습니다.');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_software_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select();

      if (error) {
        console.log('❌ Supabase 일괄삭제 오류:', error);
        throw error;
      }

      console.log(`✅ deleteMultipleSoftware 성공: ${ids.length}개`, data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ deleteMultipleSoftware 실패:', err);
      setError(err.message || '여러 소프트웨어 삭제 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    software,
    getSoftware,
    getSoftwareById,
    createSoftware,
    updateSoftware,
    deleteSoftware,
    deleteMultipleSoftware,
    loading,
    error
  };
};
