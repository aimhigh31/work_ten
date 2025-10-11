import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

console.log('Supabase 환경변수 확인:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// IT교육 커리큘럼 데이터 타입 정의
export interface ItEducationCurriculumData {
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

// 프론트엔드용 커리큘럼 아이템 타입 (기존 컴포넌트와 호환)
export interface CurriculumItem {
  id: string;
  educationDate: string;
  time: string;
  instructor: string;
  title: string;
  content: string;
  notes: string;
  attachments: number;
}

export function useSupabaseItEducationCurriculum() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IT교육 커리큘럼 데이터 조회 (교육 ID별)
  const getCurriculumByEducationId = useCallback(async (educationId: number): Promise<ItEducationCurriculumData[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 커리큘럼 데이터 조회 중:', { educationId });

      const { data, error } = await supabase
        .from('it_education_curriculum')
        .select('*')
        .eq('education_id', educationId)
        .eq('is_active', true)
        .order('session_order', { ascending: true });

      if (error) {
        console.error('❌ IT교육 커리큘럼 조회 실패:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          educationId,
          fullError: error
        });
        throw error;
      }

      console.log('✅ 커리큘럼 데이터 조회 성공:', { educationId, count: data?.length || 0 });
      return data || [];
    } catch (err) {
      console.error('❌ 커리큘럼 데이터 조회 오류 상세:', {
        educationId,
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err)
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 커리큘럼 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // IT교육 커리큘럼 데이터 저장 (교육 ID별 일괄 저장)
  const saveCurriculumByEducationId = useCallback(async (educationId: number, curriculumItems: Partial<ItEducationCurriculumData>[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('💾 커리큘럼 데이터 저장 시작:', { educationId, itemCount: curriculumItems.length });

      // 1. 기존 활성 커리큘럼 데이터 삭제 (소프트 삭제)
      const { error: deleteError } = await supabase
        .from('it_education_curriculum')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('education_id', educationId)
        .eq('is_active', true);

      if (deleteError) {
        console.error('❌ 기존 커리큘럼 삭제 실패:', deleteError);
        throw deleteError;
      }

      // 2. 새 커리큘럼 데이터 저장
      if (curriculumItems.length > 0) {
        const curriculumDataToSave = curriculumItems.map((item, index) => ({
          education_id: educationId,
          session_order: item.session_order || (index + 1),
          session_title: item.session_title || `세션 ${index + 1}`,
          session_description: item.session_description || '',
          duration_minutes: item.duration_minutes || 0,
          instructor: item.instructor || '',
          session_type: item.session_type || '강의',
          materials: item.materials || '',
          objectives: item.objectives || '',
          is_active: true,
          created_by: 'user',
          updated_by: 'user'
        }));

        const { error: insertError } = await supabase
          .from('it_education_curriculum')
          .insert(curriculumDataToSave);

        if (insertError) {
          console.error('❌ 새 커리큘럼 저장 실패:', insertError);
          throw insertError;
        }
      }

      console.log('✅ 커리큘럼 데이터 저장 성공:', { educationId, itemCount: curriculumItems.length });
      return true;
    } catch (err) {
      console.error('❌ 커리큘럼 저장 오류 상세:', {
        educationId,
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err)
      });

      const errorMessage = err instanceof Error ? err.message : 'IT교육 커리큘럼 저장 중 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 커리큘럼 항목 수정
  const updateCurriculumItem = useCallback(async (id: number, updates: Partial<ItEducationCurriculumData>): Promise<ItEducationCurriculumData | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('it_education_curriculum')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ 커리큘럼 항목 수정 실패:', error);
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'IT교육 커리큘럼 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 커리큘럼 항목 수정 오류:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 커리큘럼 항목 삭제 (소프트 삭제)
  const deleteCurriculumItem = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('it_education_curriculum')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ 커리큘럼 항목 삭제 실패:', error);
        throw error;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'IT교육 커리큘럼 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 커리큘럼 항목 삭제 오류:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 데이터 변환 함수들
  const convertSupabaseToCurriculumItem = useCallback((supabaseData: ItEducationCurriculumData): CurriculumItem => {
    return {
      id: supabaseData.id.toString(),
      educationDate: supabaseData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      time: `${supabaseData.duration_minutes || 60}분`,
      instructor: supabaseData.instructor || '',
      title: supabaseData.session_title,
      content: supabaseData.session_description || '',
      notes: supabaseData.objectives || '',
      attachments: 0 // 추후 첨부파일 기능 추가 시 사용
    };
  }, []);

  const convertCurriculumItemToSupabase = useCallback((item: CurriculumItem, sessionOrder: number): Partial<ItEducationCurriculumData> => {
    const durationMatch = item.time.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;

    return {
      session_order: sessionOrder,
      session_title: item.title,
      session_description: item.content,
      duration_minutes: durationMinutes,
      instructor: item.instructor,
      session_type: '강의',
      materials: '',
      objectives: item.notes
    };
  }, []);

  return {
    loading,
    error,
    getCurriculumByEducationId,
    saveCurriculumByEducationId,
    updateCurriculumItem,
    deleteCurriculumItem,
    convertSupabaseToCurriculumItem,
    convertCurriculumItemToSupabase
  };
}