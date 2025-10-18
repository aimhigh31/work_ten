import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

console.log('Supabase 환경변수 확인:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 캐시 키
const CACHE_KEY = createCacheKey('it_education', 'data');

// IT교육 데이터 타입 정의 (비용관리 패턴: 핵심 필드는 required)
export interface ItEducationData {
  id: number;
  registration_date: string;      // 필수 (비용관리 패턴)
  code: string;                   // 필수 (비용관리 패턴)
  education_type: string;         // 필수
  education_name: string;         // 필수
  location: string;               // 필수
  execution_date: string;         // 필수
  status: string;                 // 필수 (비용관리 패턴)
  team: string;                   // 필수 (비용관리 패턴) - 손실 방지
  assignee: string;               // 필수 (비용관리 패턴)
  participant_count?: number;     // 옵셔널
  description?: string;           // 옵셔널
  // 교육실적보고 필드들 (옵셔널)
  achievements?: string;          // 성과
  improvements?: string;          // 개선사항
  education_feedback?: string;    // 교육소감
  report_notes?: string;          // 비고
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseItEducation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IT교육 데이터 조회
  const getItEducationData = useCallback(async (): Promise<ItEducationData[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<ItEducationData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [ItEducation] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('it_education_data')
        .select('*')
        .eq('is_active', true)
        .order('registration_date', { ascending: false });

      if (error) {
        console.error('IT교육 데이터 조회 실패:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }

      // 2. 캐시에 저장
      saveToCache(CACHE_KEY, data || []);

      return data || [];
    } catch (err) {
      console.error('IT교육 데이터 조회 오류 상세:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err)
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 데이터 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 ID로 IT교육 데이터 조회
  const getItEducationById = useCallback(async (id: number): Promise<ItEducationData | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('it_education_data')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('IT교육 데이터 조회 실패:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('IT교육 데이터 조회 오류 (ID별):', {
        id,
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err)
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 데이터 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // IT교육 데이터 추가
  const addItEducation = useCallback(async (item: Omit<ItEducationData, 'id' | 'created_at' | 'updated_at'>): Promise<ItEducationData | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('📤 IT교육 데이터 추가 시도:', item);

      const insertData = {
        ...item,
        registration_date: item.registration_date || new Date().toISOString().split('T')[0],
        status: item.status || '계획',
        is_active: true
      };

      console.log('📤 Supabase insert 데이터:', insertData);

      const { data, error } = await supabase
        .from('it_education_data')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ IT교육 데이터 추가 실패 (상세):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error)
        });
        throw error;
      }

      console.log('✅ IT교육 데이터 추가 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err) {
      console.error('❌ IT교육 데이터 추가 오류 (catch):', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 데이터 추가 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // IT교육 데이터 수정
  const updateItEducation = useCallback(async (id: number, updates: Partial<ItEducationData>): Promise<ItEducationData | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 IT교육 데이터 업데이트 시도:', { id, updates });

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      console.log('📤 Supabase 업데이트 데이터:', updateData);

      const { data, error } = await supabase
        .from('it_education_data')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('IT교육 데이터 수정 실패:', error);
        throw error;
      }

      console.log('✅ IT교육 데이터 업데이트 성공:', data);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'IT교육 데이터 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('IT교육 데이터 수정 오류:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // IT교육 데이터 삭제 (소프트 삭제 - is_active를 false로 설정)
  const deleteItEducation = useCallback(async (id: number): Promise<boolean> => {
    console.log(`🗑️ 삭제 시작 - ID: ${id}`);

    setLoading(true);
    setError(null);

    try {
      // 1. 먼저 데이터가 존재하는지 확인
      const { data: existingData, error: checkError } = await supabase
        .from('it_education_data')
        .select('id, education_name, is_active')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('❌ 데이터 존재 확인 실패:', checkError);
        setError('삭제할 데이터를 찾을 수 없습니다.');
        return false;
      }

      console.log(`📊 삭제 대상 확인 - ID: ${existingData.id}, 이름: ${existingData.education_name}, 활성: ${existingData.is_active}`);

      // 2. is_active를 false로 업데이트
      const { data: updateResult, error: updateError } = await supabase
        .from('it_education_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        setError(`삭제 실패: ${updateError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ 삭제 성공:', updateResult);

      // 캐시 무효화 (최신 데이터 보장)
      sessionStorage.removeItem(CACHE_KEY);

      return true;

    } catch (err) {
      console.error('❌ 삭제 중 예외 발생:', {
        id,
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        type: typeof err
      });

      setError('삭제 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
      console.log(`🏁 삭제 작업 완료 - ID: ${id}`);
    }
  }, []);

  // IT교육 코드 생성
  const generateItEducationCode = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('it_education_data')
        .select('code')
        .eq('is_active', true)
        .order('id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('IT교육 코드 조회 실패:', error);
      }

      const currentYear = new Date().getFullYear().toString().slice(-2);
      const currentData = data && data.length > 0 ? data[0] : null;

      if (currentData?.code) {
        const match = currentData.code.match(/IT-EDU-(\d{2})-(\d{3})/);
        if (match && match[1] === currentYear) {
          const nextNumber = parseInt(match[2]) + 1;
          return `IT-EDU-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
        }
      }

      return `IT-EDU-${currentYear}-001`;
    } catch (err) {
      console.error('IT교육 코드 생성 오류:', err);
      return `IT-EDU-${new Date().getFullYear().toString().slice(-2)}-001`;
    }
  }, []);

  return {
    loading,
    error,
    getItEducationData,
    getItEducationById,
    addItEducation,
    updateItEducation,
    deleteItEducation,
    generateItEducationCode
  };
}