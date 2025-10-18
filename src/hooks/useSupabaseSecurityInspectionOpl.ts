import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// 현재 OPL 탭 구조와 정확히 일치하는 데이터 타입
export interface OPLItem {
  id: number;
  inspection_id?: number;
  registration_date?: string;
  code?: string;
  before?: string;
  before_image?: string | null;
  after?: string;
  after_image?: string | null;
  completion_date?: string | null;
  assignee?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseSecurityInspectionOpl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OPL 항목 조회 (특정 점검 ID)
  const getOplItemsByInspectionId = useCallback(async (inspectionId: number): Promise<OPLItem[]> => {
    // 1. 동적 캐시 키 생성 (점검 ID별로 별도 캐시)
    const cacheKey = createCacheKey('security_opl', `inspection_${inspectionId}`);
    const cachedData = loadFromCache<OPLItem[]>(cacheKey, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [SecurityOpl] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('security_inspection_opl')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('registration_date', { ascending: false });

      if (error) {
        console.error('OPL 항목 조회 실패:', error);
        throw error;
      }

      // 2. 캐시에 저장
      saveToCache(cacheKey, data || []);

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OPL 항목 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('OPL 항목 조회 오류:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // OPL 항목 추가
  const addOplItem = useCallback(async (item: Omit<OPLItem, 'id' | 'created_at' | 'updated_at'>): Promise<OPLItem | null> => {
    setLoading(true);
    setError(null);

    console.log('OPL 항목 추가 시도:', {
      inputItem: item,
      inspection_id: item.inspection_id,
      registration_date: item.registration_date,
      status: item.status
    });

    try {
      const { data, error } = await supabase
        .from('security_inspection_opl')
        .insert([
          {
            ...item,
            registration_date: item.registration_date || new Date().toISOString().split('T')[0],
            status: item.status || '대기'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('OPL 항목 추가 실패:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }

      return data;
    } catch (err) {
      console.error('OPL 항목 추가 catch 오류:', {
        error: err,
        type: typeof err,
        isError: err instanceof Error,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        stringified: JSON.stringify(err, null, 2)
      });
      const errorMessage = err instanceof Error ? err.message : 'OPL 항목 추가 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // OPL 항목 수정
  const updateOplItem = useCallback(async (id: number, updates: Partial<OPLItem>): Promise<OPLItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('security_inspection_opl')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('OPL 항목 수정 실패:', error);
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OPL 항목 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('OPL 항목 수정 오류:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // OPL 항목 삭제
  const deleteOplItem = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from('security_inspection_opl').delete().eq('id', id);

      if (error) {
        console.error('OPL 항목 삭제 실패:', error);
        throw error;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OPL 항목 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('OPL 항목 삭제 오류:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 여러 OPL 항목 삭제
  const deleteOplItems = useCallback(async (ids: number[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from('security_inspection_opl').delete().in('id', ids);

      if (error) {
        console.error('OPL 항목들 삭제 실패:', error);
        throw error;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OPL 항목들 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('OPL 항목들 삭제 오류:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // OPL 코드 생성
  const generateOplCode = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase.from('security_inspection_opl').select('code').order('id', { ascending: false }).limit(1);

      if (error) {
        console.error('OPL 코드 조회 실패:', error);
      }

      const currentYear = new Date().getFullYear().toString().slice(-2);
      const currentData = data && data.length > 0 ? data[0] : null;

      if (currentData?.code) {
        const match = currentData.code.match(/OPL-(\d{2})-(\d{3})/);
        if (match && match[1] === currentYear) {
          const nextNumber = parseInt(match[2]) + 1;
          return `OPL-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
        }
      }

      return `OPL-${currentYear}-001`;
    } catch (err) {
      console.error('OPL 코드 생성 오류:', err);
      return `OPL-${new Date().getFullYear().toString().slice(-2)}-001`;
    }
  }, []);

  // OPL 이미지 업로드 (Supabase Storage)
  const uploadOplImage = useCallback(async (file: File, type: 'before' | 'after'): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // 파일명 생성 (고유성을 위해 타임스탬프 추가)
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${type}_${timestamp}.${fileExtension}`;
      const filePath = `opl/${fileName}`;

      console.log('📤 이미지 업로드 시작:', { fileName, fileSize: file.size, fileType: file.type });

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage.from('opl-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        console.error('❌ 이미지 업로드 실패:', error);
        throw error;
      }

      // 퍼블릭 URL 생성
      const { data: publicUrlData } = supabase.storage.from('opl-images').getPublicUrl(filePath);

      console.log('✅ 이미지 업로드 성공:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 이미지 업로드 오류:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getOplItemsByInspectionId,
    addOplItem,
    updateOplItem,
    deleteOplItem,
    deleteOplItems,
    generateOplCode,
    uploadOplImage
  };
}
