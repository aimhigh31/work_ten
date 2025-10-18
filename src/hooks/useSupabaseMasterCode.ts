import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 캐시 키
const CACHE_KEY = createCacheKey('mastercode', 'data');

// 타입 정의
export interface MasterCodeItem {
  id: number;
  code_type: 'master' | 'sub';
  parent_id: number | null;
  code: string;
  code_name: string;
  code_description?: string;
  code_value1?: string;
  code_value2?: string;
  code_value3?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 마스터코드와 서브코드를 분리한 타입
export interface MasterCode {
  id: number;
  code: string;
  code_name: string;
  code_description?: string;
  display_order: number;
  is_active: boolean;
  subcodes_count: number;
  created_at: string;
  updated_at: string;
}

export interface SubCode {
  id: number;
  mastercode_id: number;
  code: string;
  code_name: string;
  code_description?: string;
  code_value1?: string;
  code_value2?: string;
  code_value3?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 훅 구현
export const useSupabaseMasterCode = () => {
  const [masterCodes, setMasterCodes] = useState<MasterCode[]>([]);
  const [subCodes, setSubCodes] = useState<SubCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 전체 데이터 로드
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('admin_mastercode_code')
        .select('*')
        .order('code_type', { ascending: false })
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      // 마스터코드와 서브코드 분리
      const masters: MasterCode[] = [];
      const subs: SubCode[] = [];

      data?.forEach((item) => {
        if (item.code_type === 'master') {
          // 서브코드 개수 계산
          const subcodesCount = data.filter((sub) => sub.code_type === 'sub' && sub.parent_id === item.id).length;

          masters.push({
            id: item.id,
            code: item.code,
            code_name: item.code_name,
            code_description: item.code_description,
            display_order: item.display_order,
            is_active: item.is_active,
            subcodes_count: subcodesCount,
            created_at: item.created_at,
            updated_at: item.updated_at
          });
        } else if (item.code_type === 'sub') {
          subs.push({
            id: item.id,
            mastercode_id: item.parent_id!,
            code: item.code,
            code_name: item.code_name,
            code_description: item.code_description,
            code_value1: item.code_value1,
            code_value2: item.code_value2,
            code_value3: item.code_value3,
            display_order: item.display_order,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at
          });
        }
      });

      setMasterCodes(masters);
      setSubCodes(subs);

      // 캐시에 저장 (마스터코드와 서브코드 함께)
      saveToCache(CACHE_KEY, { masters, subs });
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 마스터코드 생성
  const createMasterCode = useCallback(async (data: Omit<MasterCode, 'id' | 'subcodes_count' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: newData, error: insertError } = await supabase
        .from('admin_mastercode_code')
        .insert([
          {
            code_type: 'master',
            parent_id: null,
            code: data.code,
            code_name: data.code_name,
            code_description: data.code_description,
            display_order: data.display_order,
            is_active: data.is_active
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 상태 업데이트
      const newMasterCode: MasterCode = {
        id: newData.id,
        code: newData.code,
        code_name: newData.code_name,
        code_description: newData.code_description,
        display_order: newData.display_order,
        is_active: newData.is_active,
        subcodes_count: 0,
        created_at: newData.created_at,
        updated_at: newData.updated_at
      };

      setMasterCodes((prev) => [newMasterCode, ...prev]);
      return newMasterCode;
    } catch (err) {
      setError(err instanceof Error ? err.message : '마스터코드 생성 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 마스터코드 수정
  const updateMasterCode = useCallback(async (id: number, data: Partial<MasterCode>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedData, error: updateError } = await supabase
        .from('admin_mastercode_code')
        .update({
          code: data.code,
          code_name: data.code_name,
          code_description: data.code_description,
          display_order: data.display_order,
          is_active: data.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 상태 업데이트
      setMasterCodes((prev) => prev.map((mc) => (mc.id === id ? { ...mc, ...data, updated_at: updatedData.updated_at } : mc)));

      return updatedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : '마스터코드 수정 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 마스터코드 삭제
  const deleteMasterCode = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      // 먼저 해당 마스터코드의 서브코드들을 삭제
      const { error: deleteSubsError } = await supabase.from('admin_mastercode_code').delete().eq('parent_id', id);

      if (deleteSubsError) throw deleteSubsError;

      // 마스터코드 삭제
      const { error: deleteMasterError } = await supabase.from('admin_mastercode_code').delete().eq('id', id);

      if (deleteMasterError) throw deleteMasterError;

      // 상태 업데이트
      setMasterCodes((prev) => prev.filter((mc) => mc.id !== id));
      setSubCodes((prev) => prev.filter((sc) => sc.mastercode_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '마스터코드 삭제 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 서브코드 생성
  const createSubCode = useCallback(async (data: Omit<SubCode, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: newData, error: insertError } = await supabase
        .from('admin_mastercode_code')
        .insert([
          {
            code_type: 'sub',
            parent_id: data.mastercode_id,
            code: data.code,
            code_name: data.code_name,
            code_description: data.code_description,
            code_value1: data.code_value1,
            code_value2: data.code_value2,
            code_value3: data.code_value3,
            display_order: data.display_order,
            is_active: data.is_active
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 상태 업데이트
      const newSubCode: SubCode = {
        id: newData.id,
        mastercode_id: newData.parent_id,
        code: newData.code,
        code_name: newData.code_name,
        code_description: newData.code_description,
        code_value1: newData.code_value1,
        code_value2: newData.code_value2,
        code_value3: newData.code_value3,
        display_order: newData.display_order,
        is_active: newData.is_active,
        created_at: newData.created_at,
        updated_at: newData.updated_at
      };

      setSubCodes((prev) => [...prev, newSubCode]);

      // 마스터코드의 서브코드 개수 업데이트
      setMasterCodes((prev) => prev.map((mc) => (mc.id === data.mastercode_id ? { ...mc, subcodes_count: mc.subcodes_count + 1 } : mc)));

      return newSubCode;
    } catch (err) {
      setError(err instanceof Error ? err.message : '서브코드 생성 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 서브코드 수정
  const updateSubCode = useCallback(async (id: number, data: Partial<SubCode>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedData, error: updateError } = await supabase
        .from('admin_mastercode_code')
        .update({
          code: data.code,
          code_name: data.code_name,
          code_description: data.code_description,
          code_value1: data.code_value1,
          code_value2: data.code_value2,
          code_value3: data.code_value3,
          display_order: data.display_order,
          is_active: data.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 상태 업데이트
      setSubCodes((prev) => prev.map((sc) => (sc.id === id ? { ...sc, ...data, updated_at: updatedData.updated_at } : sc)));

      return updatedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : '서브코드 수정 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 서브코드 삭제
  const deleteSubCode = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        // 삭제할 서브코드 정보 가져오기 (마스터코드 개수 업데이트용)
        const subCodeToDelete = subCodes.find((sc) => sc.id === id);

        const { error: deleteError } = await supabase.from('admin_mastercode_code').delete().eq('id', id);

        if (deleteError) throw deleteError;

        // 상태 업데이트
        setSubCodes((prev) => prev.filter((sc) => sc.id !== id));

        // 마스터코드의 서브코드 개수 업데이트
        if (subCodeToDelete) {
          setMasterCodes((prev) =>
            prev.map((mc) => (mc.id === subCodeToDelete.mastercode_id ? { ...mc, subcodes_count: Math.max(0, mc.subcodes_count - 1) } : mc))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '서브코드 삭제 중 오류가 발생했습니다.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [subCodes]
  );

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<{ masters: MasterCode[]; subs: SubCode[] }>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setMasterCodes(cachedData.masters);
      setSubCodes(cachedData.subs);
      setLoading(false);
      console.log('⚡ [MasterCode] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchAllData();
  }, [fetchAllData]);

  return {
    masterCodes,
    subCodes,
    loading,
    error,
    refreshData: fetchAllData,
    createMasterCode,
    updateMasterCode,
    deleteMasterCode,
    createSubCode,
    updateSubCode,
    deleteSubCode
  };
};
