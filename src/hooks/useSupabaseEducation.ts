import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { EducationData, DbEducationData } from '../types/education';

// Supabase 클라이언트 설정 (RLS 해지 후 ANON_KEY 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase Education 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface UseSupabaseEducationReturn {
  getEducations: () => Promise<DbEducationData[]>;
  getEducationById: (id: number) => Promise<DbEducationData | null>;
  createEducation: (education: Omit<DbEducationData, 'id' | 'created_at' | 'updated_at'>) => Promise<DbEducationData | null>;
  updateEducation: (id: number, education: Partial<DbEducationData>) => Promise<boolean>;
  deleteEducation: (id: number) => Promise<boolean>;
  convertToEducationData: (dbData: DbEducationData) => EducationData;
  convertToDbEducationData: (frontendData: EducationData) => Omit<DbEducationData, 'id' | 'created_at' | 'updated_at'>;
  loading: boolean;
  error: string | null;
}

export const useSupabaseEducation = (): UseSupabaseEducationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DB에서 모든 Education 데이터 조회 (created_at 기준 역순정렬)
  const getEducations = useCallback(async (): Promise<DbEducationData[]> => {
    try {
      console.log('📞 getEducations 호출');
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('main_education_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // 최신순 정렬

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getEducations 성공:', data?.length || 0, '개');
      return data || [];

    } catch (error) {
      console.log('❌ getEducations 실패:', error);
      setError(error instanceof Error ? error.message : 'Education 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 Education 조회
  const getEducationById = useCallback(async (id: number): Promise<DbEducationData | null> => {
    try {
      console.log('📞 getEducationById 호출:', id);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('main_education_data')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getEducationById 성공:', data);
      return data;

    } catch (error) {
      console.log('❌ getEducationById 실패:', error);
      setError(error instanceof Error ? error.message : 'Education 데이터 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 새 Education 생성
  const createEducation = useCallback(async (
    education: Omit<DbEducationData, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DbEducationData | null> => {
    try {
      console.log('🚀 createEducation 시작');
      console.log('📝 생성할 Education 데이터:', education);
      setLoading(true);
      setError(null);

      // 현재 최대 no 값 확인
      const { data: maxNoData, error: maxNoError } = await supabase
        .from('main_education_data')
        .select('no')
        .order('no', { ascending: false })
        .limit(1);

      if (maxNoError) {
        console.log('❌ 최대 no 조회 실패:', maxNoError);
        throw maxNoError;
      }

      const nextNo = maxNoData && maxNoData.length > 0 ? maxNoData[0].no + 1 : 1;
      console.log('📊 다음 no 값:', nextNo);

      const insertData = {
        ...education,
        no: nextNo, // 자동 증가 번호 설정
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 최종 삽입 데이터:', insertData);

      const { data, error: supabaseError } = await supabase
        .from('main_education_data')
        .insert([insertData])
        .select()
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 생성 오류:', supabaseError);
        console.log('❌ 오류 메시지:', supabaseError.message);
        console.log('❌ 상세 오류:', supabaseError.details);
        console.log('❌ 힌트:', supabaseError.hint);
        console.log('❌ 오류 코드:', supabaseError.code);
        setError(`개인교육관리 생성 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return null;
      }

      console.log('✅ createEducation 성공:', data);
      return data;

    } catch (error) {
      console.log('❌ createEducation 실패:', error);
      setError(error instanceof Error ? error.message : '개인교육관리 생성 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Education 업데이트
  const updateEducation = useCallback(async (
    id: number,
    education: Partial<DbEducationData>
  ): Promise<boolean> => {
    try {
      console.log('📞 updateEducation 호출:', id);
      setLoading(true);
      setError(null);

      const updateData = {
        ...education,
        updated_at: new Date().toISOString()
      };

      const { error: supabaseError } = await supabase
        .from('main_education_data')
        .update(updateData)
        .eq('id', id)
        .eq('is_active', true);

      if (supabaseError) {
        console.log('❌ Supabase 업데이트 오류:', supabaseError);
        setError(`Education 업데이트 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ updateEducation 성공');
      return true;

    } catch (error) {
      console.log('❌ updateEducation 실패:', error);
      setError(error instanceof Error ? error.message : 'Education 업데이트 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Education 삭제 (soft delete)
  const deleteEducation = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('📞 deleteEducation 호출:', id);
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('main_education_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (supabaseError) {
        console.log('❌ Supabase 삭제 오류:', supabaseError);
        setError(`Education 삭제 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ deleteEducation 성공');
      return true;

    } catch (error) {
      console.log('❌ deleteEducation 실패:', error);
      setError(error instanceof Error ? error.message : 'Education 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // DB 데이터를 프론트엔드 형식으로 변환
  const convertToEducationData = useCallback((dbData: any): EducationData => {
    return {
      id: dbData.id,
      no: dbData.no || dbData.id,
      registrationDate: dbData.registration_date,
      receptionDate: dbData.start_date || '',
      customerName: dbData.education_category || '',
      companyName: dbData.company_name || '',
      educationType: dbData.education_type || '',
      channel: dbData.channel || '',
      title: dbData.title,
      content: dbData.description || '',
      team: dbData.team || '',
      assignee: dbData.assignee_name || '',
      status: dbData.status,
      priority: dbData.priority || '보통',
      responseContent: dbData.response_content || '',
      resolutionDate: dbData.completion_date || '',
      satisfactionScore: dbData.satisfaction_score,
      attachments: dbData.attachments || []
    };
  }, []);

  // 프론트엔드 데이터를 DB 형식으로 변환
  const convertToDbEducationData = useCallback((
    frontendData: EducationData
  ): any => {
    // 코드 생성: MAIN-EDU-{YY}-{NNN}
    const year = new Date(frontendData.registrationDate || Date.now()).getFullYear().toString().slice(-2);
    const no = frontendData.no || 0;
    const code = `MAIN-EDU-${year}-${String(no).padStart(3, '0')}`;

    return {
      code: code,
      no: frontendData.no || 0, // createEducation에서 자동으로 설정됨
      registration_date: frontendData.registrationDate || new Date().toISOString().split('T')[0],
      start_date: frontendData.receptionDate || frontendData.registrationDate || new Date().toISOString().split('T')[0],
      education_category: frontendData.customerName || null,
      company_name: frontendData.companyName || null,
      education_type: frontendData.educationType || null,
      channel: frontendData.channel || null,
      title: frontendData.title || '',
      description: frontendData.content || null,
      team: frontendData.team || null,
      assignee_name: frontendData.assignee || null,
      status: frontendData.status || '진행',
      priority: frontendData.priority || '보통',
      response_content: frontendData.responseContent || null,
      completion_date: frontendData.resolutionDate || null,
      satisfaction_score: frontendData.satisfactionScore || null,
      attachments: frontendData.attachments || [],
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };
  }, []);

  return {
    getEducations,
    getEducationById,
    createEducation,
    updateEducation,
    deleteEducation,
    convertToEducationData,
    convertToDbEducationData,
    loading,
    error
  };
};

export default useSupabaseEducation;