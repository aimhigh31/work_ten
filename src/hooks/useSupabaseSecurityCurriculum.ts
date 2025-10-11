import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SecurityCurriculumItem {
  id: number;
  education_id: number;
  session_order: number;
  session_title: string;
  session_description?: string;
  duration_minutes?: number;
  instructor?: string;
  session_type?: string;
  materials?: string;
  objectives?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_active?: boolean;
}

export const useSupabaseSecurityCurriculum = () => {
  const [data, setData] = useState<SecurityCurriculumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: curriculum, error: fetchError } = await supabase
        .from('security_education_curriculum')
        .select('*')
        .order('id', { ascending: true });

      if (fetchError) {
        console.error('커리큘럼 데이터 조회 실패:', fetchError);
        setError(fetchError.message);
        return;
      }

      setData(curriculum || []);
    } catch (err) {
      console.error('커리큘럼 데이터 조회 중 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCurriculum = useCallback(
    async (curriculum: Omit<SecurityCurriculumItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
      try {
        setLoading(true);
        setError(null);

        const { data: newCurriculum, error: addError } = await supabase.from('security_education_curriculum').insert([curriculum]).select();

        if (addError) {
          console.error('커리큘럼 추가 실패:', addError);
          setError(addError.message);
          return null;
        }

        await fetchData();
        return newCurriculum && newCurriculum[0] ? newCurriculum[0] : null;
      } catch (err) {
        console.error('커리큘럼 추가 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const updateCurriculum = useCallback(
    async (id: number, updates: Partial<SecurityCurriculumItem>) => {
      setLoading(true);
      setError(null);

      console.log('🔵 커리큘럼 수정 시작:', { id, updates });

      // 안전한 업데이트 객체 생성
      const cleanUpdates: any = {};

      // 허용된 필드만 복사
      const allowedFields = [
        'session_title',
        'session_description',
        'duration_minutes',
        'instructor',
        'session_type',
        'materials',
        'objectives',
        'session_order',
        'is_active'
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      console.log('🔵 정리된 업데이트 데이터:', cleanUpdates);

      try {
        const { data: updatedCurriculum, error: updateError } = await supabase
          .from('security_education_curriculum')
          .update(cleanUpdates)
          .eq('id', id)
          .select();

        if (updateError) {
          console.error('❌ 커리큘럼 수정 실패:', updateError.message || 'Unknown error');
          setError(updateError.message || 'Database update failed');
          setLoading(false);
          return null;
        }

        console.log('✅ 커리큘럼 수정 성공:', updatedCurriculum);
        await fetchData();
        return updatedCurriculum && updatedCurriculum[0] ? updatedCurriculum[0] : null;
      } catch (err) {
        console.error('❌ 커리큘럼 수정 중 예외:', err);
        setError('Network or system error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const deleteCurriculum = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase.from('security_education_curriculum').delete().eq('id', id);

        if (deleteError) {
          console.error('커리큘럼 삭제 실패:', deleteError);
          setError(deleteError.message);
          return false;
        }

        await fetchData();
        return true;
      } catch (err) {
        console.error('커리큘럼 삭제 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    addCurriculum,
    updateCurriculum,
    deleteCurriculum
  };
};
