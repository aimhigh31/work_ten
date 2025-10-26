import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 캐시 키
const CACHE_KEY = createCacheKey('hardware', 'data');

export interface HardwareData {
  id?: number;
  registration_date?: string;
  code?: string;
  team?: string;
  department?: string;
  work_content?: string;
  status?: string;
  assignee?: string;
  registrant?: string; // 등록자
  start_date?: string;
  completed_date?: string;
  attachments?: string[];

  // 하드웨어 특화 필드
  asset_category?: string; // 자산 분류
  asset_name?: string; // 자산명
  model?: string; // 모델명
  manufacturer?: string; // 제조사
  vendor?: string; // 공급업체
  detail_spec?: string; // 상세 스펙
  purchase_date?: string; // 구매일
  warranty_end_date?: string; // 보증 종료일
  serial_number?: string; // 시리얼 번호
  assigned_user?: string; // 할당된 사용자
  location?: string; // 위치/장소
  images?: string[]; // 이미지 파일 배열

  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSupabaseHardware = () => {
  const [hardware, setHardware] = useState<HardwareData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 하드웨어 목록 조회 (투자관리 방식: 캐시 우선 전략)
  const getHardware = useCallback(async (): Promise<HardwareData[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<HardwareData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [Hardware] 캐시 데이터 반환 (깜빡임 방지)');
      setHardware(cachedData); // ✅ 캐시 데이터로 상태 업데이트 (KPI 패턴)
      return cachedData;
    }

    // 2. 캐시 없으면 DB 조회
    try {
      console.log('📞 getHardware 호출');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_hardware_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('❌ Supabase 조회 오류:', error);
        throw error;
      }

      console.log('✅ getHardware 성공:', data?.length || 0, '개');

      // 3. 상태 업데이트 (KPI 패턴)
      setHardware(data || []);

      // 4. 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      return data || [];
    } catch (err: any) {
      console.log('❌ getHardware 실패:', err);
      setError(err.message || '하드웨어 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 하드웨어 생성
  const createHardware = useCallback(async (hardwareData: Omit<HardwareData, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('🆕 하드웨어 생성 시작:', hardwareData);

    const insertData = {
      ...hardwareData,
      is_active: true,
      registration_date: new Date().toISOString().split('T')[0]
    };

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('it_hardware_data').insert([insertData]).select().single();

      if (error) {
        console.log('❌ Supabase 생성 오류:', error);
        throw error;
      }

      console.log('✅ createHardware 성공:', data);

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setHardware((prev) => [data, ...prev]);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ createHardware 실패:', err);
      setError(err.message || '하드웨어 생성 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 하드웨어 수정
  const updateHardware = useCallback(async (id: number, hardwareData: Partial<HardwareData>) => {
    console.log('🔄 하드웨어 수정 시작:', { id, hardwareData });

    try {
      setLoading(true);
      setError(null);

      // null 값들을 제거하여 실제 업데이트할 데이터만 전송
      const cleanData = Object.fromEntries(Object.entries(hardwareData).filter(([_, value]) => value !== null && value !== undefined));

      console.log('📝 정제된 업데이트 데이터:', cleanData);
      console.log('📝 정제된 데이터 키들:', Object.keys(cleanData));
      console.log('🖼️ 정제된 데이터의 이미지 URL:', {
        image_1_url: cleanData.image_1_url,
        image_2_url: cleanData.image_2_url
      });
      console.log('🔍 Supabase 업데이트 쿼리 실행:', { table: 'it_hardware_data', id, cleanData });
      console.log('🔍 실제 전송되는 데이터:', JSON.stringify(cleanData, null, 2));

      const { data, error } = await supabase.from('it_hardware_data').update(cleanData).eq('id', id).select().single();

      console.log('🔍 Supabase 업데이트 응답:', { data: !!data, error: !!error });

      if (error) {
        console.warn('❌ 하드웨어 수정 실패 (Supabase 에러):', error);
        console.warn('❌ 에러 상세:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          keys: Object.keys(error || {}),
          errorString: JSON.stringify(error, null, 2)
        });
        console.warn('❌ 수정 시도 데이터:', { id, cleanData });
        throw new Error(`DB 수정 실패: ${error?.message || 'Unknown error'}`);
      }

      if (!data) {
        throw new Error('수정된 데이터가 반환되지 않았습니다.');
      }

      console.log('✅ updateHardware 성공:', data);

      // ✅ 로컬 상태 즉시 업데이트 (KPI 패턴)
      setHardware((prev) => prev.map((hw) => (hw.id === id ? data : hw)));

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ updateHardware 실패:', err);
      setError(err.message || '하드웨어 수정 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 하드웨어 삭제 (soft delete)
  const deleteHardware = useCallback(async (id: number) => {
    console.log('🗑️ 하드웨어 삭제 시작:', id);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('it_hardware_data').update({ is_active: false }).eq('id', id).select().single();

      if (error) {
        console.log('❌ Supabase 삭제 오류:', error);
        throw error;
      }

      console.log('✅ deleteHardware 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ deleteHardware 실패:', err);
      setError(err.message || '하드웨어 삭제 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 여러 하드웨어 삭제 (soft delete)
  const deleteMultipleHardware = useCallback(async (ids: number[]) => {
    console.log('🗑️ 여러 하드웨어 삭제 시작:', ids);

    if (!ids || ids.length === 0) {
      console.log('⚠️ 삭제할 하드웨어 ID가 없습니다.');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('it_hardware_data')
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

      console.log(`✅ deleteMultipleHardware 성공: ${ids.length}개`, data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err: any) {
      console.log('❌ deleteMultipleHardware 실패:', err);
      setError(err.message || '여러 하드웨어 삭제 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hardware,
    getHardware,
    createHardware,
    updateHardware,
    deleteHardware,
    deleteMultipleHardware,
    loading,
    error
  };
};
