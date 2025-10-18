import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CostRecord } from '../types/cost';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 캐시 키
const CACHE_KEY = createCacheKey('cost', 'data');

// Supabase DB 타입
export interface DbCostData {
  id: number;
  no: number;
  registration_date: string;
  code: string;
  cost_type: string;
  title: string;
  content: string;
  amount: number;
  team: string;
  assignee: string;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  attachments: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// DB → Frontend 변환
function convertToFrontendData(dbData: DbCostData, isNew = false): CostRecord {
  return {
    id: dbData.id.toString(),
    no: dbData.id, // NO 필드에 ID 사용
    registration_date: dbData.registration_date,
    registrationDate: dbData.registration_date,
    start_date: dbData.start_date || '',
    startDate: dbData.start_date || '',
    code: dbData.code,
    team: dbData.team,
    assignee_id: null,
    assignee: dbData.assignee,
    costType: dbData.cost_type as any,
    title: dbData.title,
    content: dbData.content,
    quantity: 0,
    unitPrice: 0,
    amount: dbData.amount,
    status: dbData.status as any,
    completion_date: dbData.completion_date,
    completionDate: dbData.completion_date,
    attachment: false,
    attachmentCount: 0,
    attachments: Array.isArray(dbData.attachments) ? dbData.attachments : [],
    amountDetails: [],
    comments: [],
    isNew
  };
}

// Frontend → DB 변환
function convertToDbData(frontendData: Partial<CostRecord>): Partial<DbCostData> {
  const dbData: any = {};

  if (frontendData.no !== undefined) dbData.no = frontendData.no;
  if (frontendData.registration_date || frontendData.registrationDate) {
    dbData.registration_date = frontendData.registration_date || frontendData.registrationDate;
  }
  if (frontendData.code) dbData.code = frontendData.code;
  if (frontendData.costType) dbData.cost_type = frontendData.costType;
  if (frontendData.title !== undefined) dbData.title = frontendData.title;
  if (frontendData.content !== undefined) dbData.content = frontendData.content;
  if (frontendData.amount !== undefined) dbData.amount = frontendData.amount;
  if (frontendData.team) dbData.team = frontendData.team;
  if (frontendData.assignee) dbData.assignee = frontendData.assignee;
  if (frontendData.status) dbData.status = frontendData.status;
  if (frontendData.start_date || frontendData.startDate) {
    dbData.start_date = frontendData.start_date || frontendData.startDate;
  }
  if (frontendData.completion_date || frontendData.completionDate) {
    dbData.completion_date = frontendData.completion_date || frontendData.completionDate;
  }
  if (frontendData.attachments !== undefined) {
    dbData.attachments = frontendData.attachments;
  }

  return dbData;
}

export function useSupabaseCost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 코드 존재 여부 확인 (is_active 무관)
  const checkCodeExists = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('main_cost_data')
        .select('id')
        .eq('code', code)
        .limit(1);

      if (supabaseError) {
        console.error('❌ 코드 확인 오류:', supabaseError);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (err) {
      console.error('❌ checkCodeExists 실패:', err);
      return false;
    }
  }, []);

  // 모든 비용 데이터 조회
  const getCosts = useCallback(async (): Promise<CostRecord[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<CostRecord[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [Cost] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    try {
      console.log('📞 getCosts 호출');
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('main_cost_data')
        .select('*')
        .eq('is_active', true)
        .order('registration_date', { ascending: false });

      if (supabaseError) {
        console.error('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getCosts 성공:', data?.length || 0, '개');
      const result = (data || []).map(convertToFrontendData);

      // 2. 캐시에 저장
      saveToCache(CACHE_KEY, result);

      return result;

    } catch (err) {
      console.error('❌ getCosts 실패:', err);
      setError(err instanceof Error ? err.message : '비용 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 비용 데이터 생성
  const createCost = useCallback(async (costData: Partial<CostRecord>): Promise<CostRecord | null> => {
    try {
      console.log('📞 createCost 호출:', costData);
      setLoading(true);
      setError(null);

      const dbData = convertToDbData(costData);
      console.log('🔄 변환된 DB 데이터:', dbData);

      const insertData = {
        ...dbData,
        is_active: true,
        created_by: 'user',
        updated_by: 'user'
      };
      console.log('📤 삽입할 데이터:', insertData);

      const { data, error: supabaseError } = await supabase
        .from('main_cost_data')
        .insert([insertData])
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ Supabase 생성 오류 상세:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
          fullError: JSON.stringify(supabaseError, null, 2)
        });

        // 409 Conflict - UNIQUE 제약 조건 위반
        if (supabaseError.code === '23505') {
          throw new Error(`코드 중복 오류: ${insertData.code} 코드가 이미 존재합니다.`);
        }

        throw new Error(supabaseError.message || '비용 데이터 생성 실패');
      }

      console.log('✅ createCost 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return convertToFrontendData(data, true);

    } catch (err) {
      console.error('❌ createCost 실패 상세:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : '비용 데이터 생성 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 비용 데이터 수정
  const updateCost = useCallback(async (id: string, updates: Partial<CostRecord>): Promise<CostRecord | null> => {
    try {
      console.log('📞 updateCost 호출:', id, updates);
      setLoading(true);
      setError(null);

      const dbData = convertToDbData(updates);

      const { data, error: supabaseError } = await supabase
        .from('main_cost_data')
        .update({
          ...dbData,
          updated_at: new Date().toISOString(),
          updated_by: 'user'
        })
        .eq('id', parseInt(id))
        .eq('is_active', true)
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ Supabase 수정 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ updateCost 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return convertToFrontendData(data);

    } catch (err) {
      console.error('❌ updateCost 실패:', err);
      setError(err instanceof Error ? err.message : '비용 데이터 수정 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 비용 데이터 삭제 (soft delete)
  const deleteCost = useCallback(async (id: string): Promise<boolean> => {
    try {
      console.log('📞 deleteCost 호출:', id);
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('main_cost_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          updated_by: 'user'
        })
        .eq('id', parseInt(id));

      if (supabaseError) {
        console.error('❌ Supabase 삭제 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ deleteCost 성공');

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return true;

    } catch (err) {
      console.error('❌ deleteCost 실패:', err);
      setError(err instanceof Error ? err.message : '비용 데이터 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getCosts,
    createCost,
    updateCost,
    deleteCost,
    checkCodeExists,
    loading,
    error
  };
}
