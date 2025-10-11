import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

export interface EducationRecord {
  id: string;
  code: string;
  registration_date: string;
  start_date: string | null;
  completion_date: string | null;
  education_category: string | null;
  title: string | null;
  description: string | null;
  education_type: string | null;
  team: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EducationInput {
  code: string;
  registration_date: string;
  start_date?: string;
  completion_date?: string;
  education_category?: string;
  title?: string;
  description?: string;
  education_type?: string;
  team?: string;
  assignee_id?: string;
  assignee_name?: string;
  status?: string;
}

export const useSupabaseEducation = () => {
  const [educations, setEducations] = useState<EducationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 교육 데이터 조회
  const fetchEducations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('main_education_data')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false }); // ID 기준 내림차순 (최신순)

      if (supabaseError) {
        console.error('❌ 교육 데이터 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ 교육 데이터 조회 성공:', data?.length, '건');
      setEducations(data || []);
    } catch (err: any) {
      console.error('❌ fetchEducations 실패:', err);
      setError(err.message || '교육 데이터를 불러오는데 실패했습니다.');
      setEducations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 교육 데이터 추가
  const addEducation = useCallback(async (education: EducationInput): Promise<EducationRecord | null> => {
    try {
      console.log('📝 교육 데이터 추가 시작:', education);

      const { data, error: supabaseError } = await supabase
        .from('main_education_data')
        .insert([
          {
            code: education.code,
            registration_date: education.registration_date,
            start_date: education.start_date || null,
            completion_date: education.completion_date || null,
            education_category: education.education_category || null,
            title: education.title || null,
            description: education.description || null,
            education_type: education.education_type || null,
            team: education.team || null,
            assignee_id: education.assignee_id || null,
            assignee_name: education.assignee_name || null,
            status: education.status || '예정',
            is_active: true
          }
        ])
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ 교육 데이터 추가 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ 교육 데이터 추가 성공:', data);
      await fetchEducations();
      return data;
    } catch (err: any) {
      console.error('❌ addEducation 실패:', err);
      setError(err.message || '교육 데이터 추가에 실패했습니다.');
      return null;
    }
  }, [fetchEducations]);

  // 교육 데이터 수정
  const updateEducation = useCallback(
    async (id: string, updates: Partial<EducationInput>): Promise<boolean> => {
      try {
        console.log('📝 교육 데이터 수정 시작:', id, updates);

        const { error: supabaseError } = await supabase
          .from('main_education_data')
          .update({
            start_date: updates.start_date,
            completion_date: updates.completion_date,
            education_category: updates.education_category,
            title: updates.title,
            description: updates.description,
            education_type: updates.education_type,
            team: updates.team,
            assignee_id: updates.assignee_id,
            assignee_name: updates.assignee_name,
            status: updates.status
          })
          .eq('id', id);

        if (supabaseError) {
          console.error('❌ 교육 데이터 수정 오류:', supabaseError);
          throw supabaseError;
        }

        console.log('✅ 교육 데이터 수정 성공');
        await fetchEducations();
        return true;
      } catch (err: any) {
        console.error('❌ updateEducation 실패:', err);
        setError(err.message || '교육 데이터 수정에 실패했습니다.');
        return false;
      }
    },
    [fetchEducations]
  );

  // 교육 데이터 삭제 (논리적 삭제)
  const deleteEducation = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        console.log('🗑️ 교육 데이터 삭제 시작:', id);

        const { error: supabaseError } = await supabase
          .from('main_education_data')
          .update({ is_active: false })
          .eq('id', id);

        if (supabaseError) {
          console.error('❌ 교육 데이터 삭제 오류:', supabaseError);
          throw supabaseError;
        }

        console.log('✅ 교육 데이터 삭제 성공');
        await fetchEducations();
        return true;
      } catch (err: any) {
        console.error('❌ deleteEducation 실패:', err);
        setError(err.message || '교육 데이터 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchEducations]
  );

  // 코드 중복 체크
  const checkCodeExists = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('main_education_data')
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

  // 초기 데이터 로드
  useEffect(() => {
    fetchEducations();
  }, [fetchEducations]);

  return {
    educations,
    loading,
    error,
    fetchEducations,
    addEducation,
    updateEducation,
    deleteEducation,
    checkCodeExists
  };
};
