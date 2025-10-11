import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { VocData, DbVocData } from '../types/voc';

// Supabase 클라이언트 설정 (RLS 해지 후 ANON_KEY 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase VOC 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface UseSupabaseVocReturn {
  getVocs: () => Promise<DbVocData[]>;
  getVocById: (id: number) => Promise<DbVocData | null>;
  createVoc: (voc: Omit<DbVocData, 'id' | 'created_at' | 'updated_at'>) => Promise<DbVocData | null>;
  updateVoc: (id: number, voc: Partial<DbVocData>) => Promise<boolean>;
  deleteVoc: (id: number) => Promise<boolean>;
  convertToVocData: (dbData: DbVocData) => VocData;
  convertToDbVocData: (frontendData: VocData) => Omit<DbVocData, 'id' | 'created_at' | 'updated_at'>;
  loading: boolean;
  error: string | null;
}

export const useSupabaseVoc = (): UseSupabaseVocReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DB에서 모든 VOC 데이터 조회 (created_at 기준 역순정렬)
  const getVocs = useCallback(async (): Promise<DbVocData[]> => {
    try {
      console.log('📞 getVocs 호출');
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('it_voc_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // 최신순 정렬

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getVocs 성공:', data?.length || 0, '개');
      return data || [];

    } catch (error) {
      console.log('❌ getVocs 실패:', error);
      setError(error instanceof Error ? error.message : 'VOC 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 VOC 조회
  const getVocById = useCallback(async (id: number): Promise<DbVocData | null> => {
    try {
      console.log('📞 getVocById 호출:', id);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('it_voc_data')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getVocById 성공:', data);
      return data;

    } catch (error) {
      console.log('❌ getVocById 실패:', error);
      setError(error instanceof Error ? error.message : 'VOC 데이터 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 새 VOC 생성
  const createVoc = useCallback(async (
    voc: Omit<DbVocData, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DbVocData | null> => {
    try {
      console.log('🚀 createVoc 시작');
      console.log('📝 생성할 VOC 데이터:', voc);
      setLoading(true);
      setError(null);

      // 현재 최대 no 값 확인
      const { data: maxNoData, error: maxNoError } = await supabase
        .from('it_voc_data')
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
        ...voc,
        no: nextNo, // 자동 증가 번호 설정
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 최종 삽입 데이터:', insertData);

      const { data, error: supabaseError } = await supabase
        .from('it_voc_data')
        .insert([insertData])
        .select()
        .single();

      if (supabaseError) {
        console.log('❌ Supabase 생성 오류:', supabaseError);
        console.log('❌ 상세 오류:', supabaseError.details);
        console.log('❌ 힌트:', supabaseError.hint);
        setError(`VOC 생성 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return null;
      }

      console.log('✅ createVoc 성공:', data);
      return data;

    } catch (error) {
      console.log('❌ createVoc 실패:', error);
      setError(error instanceof Error ? error.message : 'VOC 생성 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // VOC 업데이트
  const updateVoc = useCallback(async (
    id: number,
    voc: Partial<DbVocData>
  ): Promise<boolean> => {
    try {
      console.log('📞 updateVoc 호출:', id);
      setLoading(true);
      setError(null);

      const updateData = {
        ...voc,
        updated_at: new Date().toISOString()
      };

      const { error: supabaseError } = await supabase
        .from('it_voc_data')
        .update(updateData)
        .eq('id', id)
        .eq('is_active', true);

      if (supabaseError) {
        console.log('❌ Supabase 업데이트 오류:', supabaseError);
        setError(`VOC 업데이트 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ updateVoc 성공');
      return true;

    } catch (error) {
      console.log('❌ updateVoc 실패:', error);
      setError(error instanceof Error ? error.message : 'VOC 업데이트 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // VOC 삭제 (soft delete)
  const deleteVoc = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('📞 deleteVoc 호출:', id);
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('it_voc_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (supabaseError) {
        console.log('❌ Supabase 삭제 오류:', supabaseError);
        setError(`VOC 삭제 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ deleteVoc 성공');
      return true;

    } catch (error) {
      console.log('❌ deleteVoc 실패:', error);
      setError(error instanceof Error ? error.message : 'VOC 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // DB 데이터를 프론트엔드 형식으로 변환
  const convertToVocData = useCallback((dbData: DbVocData): VocData => {
    return {
      id: dbData.id,
      no: dbData.no,
      registrationDate: dbData.registration_date,
      receptionDate: dbData.reception_date || '',
      customerName: dbData.customer_name || '',
      companyName: dbData.company_name || '',
      vocType: dbData.voc_type || '',
      channel: dbData.channel || '',
      title: dbData.title,
      content: dbData.content || '',
      team: dbData.team || '',
      assignee: dbData.assignee || '',
      status: dbData.status,
      priority: dbData.priority,
      responseContent: dbData.response_content || '',
      resolutionDate: dbData.resolution_date || '',
      satisfactionScore: dbData.satisfaction_score,
      attachments: dbData.attachments || []
    };
  }, []);

  // 프론트엔드 데이터를 DB 형식으로 변환
  const convertToDbVocData = useCallback((
    frontendData: VocData
  ): Omit<DbVocData, 'id' | 'created_at' | 'updated_at'> => {
    return {
      no: frontendData.no || 0, // createVoc에서 자동으로 설정됨
      registration_date: frontendData.registrationDate || new Date().toISOString().split('T')[0],
      reception_date: frontendData.receptionDate || frontendData.registrationDate || new Date().toISOString().split('T')[0],
      customer_name: frontendData.customerName || null,
      company_name: frontendData.companyName || null,
      voc_type: frontendData.vocType || null,
      channel: frontendData.channel || null,
      title: frontendData.title || '',
      content: frontendData.content || null,
      team: frontendData.team || null,
      assignee: frontendData.assignee || null,
      status: frontendData.status || '대기',
      priority: frontendData.priority || '보통',
      response_content: frontendData.responseContent || null,
      resolution_date: frontendData.resolutionDate || null,
      satisfaction_score: frontendData.satisfactionScore || null,
      attachments: frontendData.attachments || [],
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };
  }, []);

  return {
    getVocs,
    getVocById,
    createVoc,
    updateVoc,
    deleteVoc,
    convertToVocData,
    convertToDbVocData,
    loading,
    error
  };
};

export default useSupabaseVoc;