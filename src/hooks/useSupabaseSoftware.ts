import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  current_users?: string;          // current_user → current_users로 변경
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 소프트웨어 목록 조회
  const fetchSoftware = async () => {
    console.log('🔍 소프트웨어 데이터 조회 시작...');

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('it_software_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('❌ 소프트웨어 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ 소프트웨어 데이터 조회 성공:', data?.length + '개');
      setSoftware(data || []);
      setError(null);

    } catch (err: any) {
      console.warn('❌ fetchSoftware 오류:', err);
      setError(err.message || '데이터 조회 중 오류가 발생했습니다.');
      setSoftware([]);
    } finally {
      setLoading(false);
    }
  };

  // 소프트웨어 생성
  const createSoftware = async (softwareData: Omit<SoftwareData, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('🆕 소프트웨어 생성 시작:', softwareData);

    try {
      const { data, error } = await supabase
        .from('it_software_data')
        .insert([{
          ...softwareData,
          is_active: true,
          registration_date: new Date().toISOString().split('T')[0]  // YYYY-MM-DD 형식으로
        }])
        .select()
        .single();

      if (error) {
        console.warn('❌ 소프트웨어 생성 실패:', error);
        throw error;
      }

      console.log('✅ 소프트웨어 생성 성공:', data);
      await fetchSoftware();
      return data;

    } catch (err: any) {
      console.warn('❌ createSoftware 오류:', err);
      throw err;
    }
  };

  // 소프트웨어 수정
  const updateSoftware = async (id: number, softwareData: Partial<SoftwareData>) => {
    console.log('🔄 소프트웨어 수정 시작:', { id, softwareData });

    try {
      // null 값들을 제거하여 실제 업데이트할 데이터만 전송
      const cleanData = Object.fromEntries(
        Object.entries(softwareData).filter(([_, value]) => value !== null && value !== undefined)
      );

      console.log('📝 정제된 업데이트 데이터:', cleanData);
      console.log('🔍 Supabase 업데이트 쿼리 실행:', { table: 'it_software_data', id, cleanData });

      const { data, error } = await supabase
        .from('it_software_data')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      console.log('🔍 Supabase 업데이트 응답:', { data: !!data, error: !!error });

      if (error) {
        console.warn('❌ 소프트웨어 수정 실패 (Supabase 에러):', error);
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

      console.log('✅ 소프트웨어 수정 성공:', data);
      await fetchSoftware();
      return data;

    } catch (err: any) {
      console.warn('❌ updateSoftware 전체 오류:', {
        message: err.message,
        stack: err.stack,
        err
      });
      throw err;
    }
  };

  // 소프트웨어 삭제 (soft delete)
  const deleteSoftware = async (id: number) => {
    console.log('🗑️ 소프트웨어 삭제 시작:', id);

    try {
      const { data, error } = await supabase
        .from('it_software_data')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('❌ 소프트웨어 삭제 실패:', error);
        throw error;
      }

      console.log('✅ 소프트웨어 삭제 성공:', data);
      await fetchSoftware();
      return data;

    } catch (err: any) {
      console.warn('❌ deleteSoftware 오류:', err);
      throw err;
    }
  };

  // 여러 소프트웨어 삭제 (soft delete)
  const deleteMultipleSoftware = async (ids: number[]) => {
    console.log('🗑️ 여러 소프트웨어 삭제 시작:', ids);

    if (!ids || ids.length === 0) {
      console.warn('⚠️ 삭제할 소프트웨어 ID가 없습니다.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('it_software_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select();

      if (error) {
        console.warn('❌ 여러 소프트웨어 삭제 실패:', error);
        throw error;
      }

      console.log(`✅ ${ids.length}개 소프트웨어 삭제 성공:`, data);
      await fetchSoftware();
      return data;

    } catch (err: any) {
      console.warn('❌ deleteMultipleSoftware 오류:', err);
      throw err;
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchSoftware();
  }, []);

  return {
    software,
    loading,
    error,
    fetchSoftware,
    createSoftware,
    updateSoftware,
    deleteSoftware,
    deleteMultipleSoftware
  };
};