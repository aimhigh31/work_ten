import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SolutionData, DbSolutionData } from '../types/solution';

// Supabase 클라이언트 설정 (RLS 해지 후 ANON_KEY 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 환경 변수 확인
console.log('🔗 Supabase 환경 변수 확인:', {
  url: supabaseUrl ? '✅ 설정됨' : '❌ 없음',
  anonKey: supabaseKey ? '✅ 설정됨' : '❌ 없음',
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Supabase 클라이언트 상태 검증
console.log('🔗 Supabase 클라이언트 검증:', {
  clientExists: !!supabase,
  hasFrom: typeof supabase.from === 'function',
  url: supabaseUrl?.substring(0, 30) + '...',
  keyLength: supabaseKey?.length || 0
});

export interface UseSupabaseSolutionReturn {
  getSolutions: () => Promise<DbSolutionData[]>;
  getSolutionById: (id: number) => Promise<DbSolutionData | null>;
  createSolution: (solution: Omit<DbSolutionData, 'id' | 'created_at' | 'updated_at'>) => Promise<DbSolutionData | null>;
  updateSolution: (id: number, solution: Partial<DbSolutionData>) => Promise<boolean>;
  deleteSolution: (id: number) => Promise<boolean>;
  convertToSolutionData: (dbData: DbSolutionData) => SolutionData;
  convertToDbSolutionData: (frontendData: SolutionData) => Omit<DbSolutionData, 'id' | 'created_at' | 'updated_at'>;
  loading: boolean;
  error: string | null;
}

export const useSupabaseSolution = (): UseSupabaseSolutionReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DB에서 모든 솔루션 데이터 조회 (created_at 기준 역순정렬)
  const getSolutions = useCallback(async (): Promise<DbSolutionData[]> => {
    try {
      console.log('📞 getSolutions 호출');
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('it_solution_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // 최신순 정렬

      if (supabaseError) {
        console.error('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getSolutions 성공:', data?.length || 0, '개');
      return data || [];

    } catch (error) {
      console.error('❌ getSolutions 실패:', error);
      setError(error instanceof Error ? error.message : '솔루션 데이터 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 솔루션 조회
  const getSolutionById = useCallback(async (id: number): Promise<DbSolutionData | null> => {
    try {
      console.log('📞 getSolutionById 호출:', id);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('it_solution_data')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (supabaseError) {
        console.error('❌ Supabase 조회 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ getSolutionById 성공:', data);
      return data;

    } catch (error) {
      console.error('❌ getSolutionById 실패:', error);
      setError(error instanceof Error ? error.message : '솔루션 데이터 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);


  // 새 솔루션 생성
  const createSolution = useCallback(async (
    solution: Omit<DbSolutionData, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DbSolutionData | null> => {
    try {
      console.log('🚀 createSolution 시작');
      console.log('📋 입력 데이터:', JSON.stringify(solution, null, 2));
      console.log('🔗 Supabase 클라이언트 상태:', {
        url: supabaseUrl,
        hasAnonKey: !!supabaseKey,
        clientExists: !!supabase
      });

      setLoading(true);
      setError(null);

      // NO 필드는 DB에서 관리하지 않음 (프론트엔드 순서 표시용)
      const finalSolution = { ...solution };

      // 데이터 검증 (안전한 로깅)
      console.log('🔍 삽입할 데이터 검증:');
      try {
        console.log('  - code:', finalSolution.code || 'undefined');
        console.log('  - title:', finalSolution.title || 'undefined');
        console.log('  - solution_type:', finalSolution.solution_type || 'undefined');
        console.log('  - development_type:', finalSolution.development_type || 'undefined');
        console.log('  - team:', finalSolution.team || 'undefined');
        console.log('  - assignee:', finalSolution.assignee || 'undefined');
        console.log('  - status:', finalSolution.status || 'undefined');
      } catch (logError) {
        console.error('❌ 로깅 중 오류 발생:', logError);
        console.log('🔍 finalSolution 타입:', typeof finalSolution);
      }

      const insertData = {
        ...finalSolution,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📤 최종 INSERT 데이터 준비 완료');
      try {
        console.log('📄 데이터 미리보기:', JSON.stringify(insertData, null, 2));
      } catch (jsonError) {
        console.log('📄 데이터 미리보기 (JSON 변환 실패):', insertData);
      }
      console.log('🔄 Supabase INSERT 실행 중...');

      let data, supabaseError;
      try {
        console.log('🚀 Supabase INSERT 쿼리 실행 시작...');
        const result = await supabase
          .from('it_solution_data')
          .insert([insertData])
          .select()
          .single();

        data = result.data;
        supabaseError = result.error;

        console.log('🔍 Supabase INSERT 응답 분석:');
        console.log('  - data:', data);
        console.log('  - error:', supabaseError);
        console.log('  - error 타입:', typeof supabaseError);
        console.log('  - error 키들:', supabaseError ? Object.keys(supabaseError) : 'null');
        console.log('📤 Supabase INSERT 결과:', { data, error: supabaseError });
      } catch (insertError) {
        console.error('❌ INSERT 실행 중 예외 발생:', insertError);
        throw new Error(`INSERT 실행 실패: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }

      if (supabaseError) {
        // 빈 오류 객체 특별 처리
        if (typeof supabaseError === 'object' && supabaseError !== null && Object.keys(supabaseError).length === 0) {
          console.error('❌ 빈 오류 객체 감지 - 알 수 없는 생성 오류 발생');
          console.error('  - 가능한 원인: Supabase 연결 문제, 인증 오류, 네트워크 문제');
          const errorMessage = '솔루션 생성에 실패했습니다. 데이터베이스 연결을 확인해주세요.';
          setError(errorMessage);
          return null;
        }

        console.log('❌ Supabase 생성 오류 발생');
        console.log('  - message:', supabaseError?.message || 'undefined');
        console.log('  - details:', supabaseError?.details || 'undefined');
        console.log('  - hint:', supabaseError?.hint || 'undefined');
        console.log('  - code:', supabaseError?.code || 'undefined');
        try {
          console.log('  - fullError:', JSON.stringify(supabaseError));
        } catch (e) {
          console.log('  - fullError: [JSON 변환 실패]', supabaseError);
        }
        setError(`Supabase 생성 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return null;
      }

      if (!data) {
        console.error('❌ 생성 성공했으나 데이터가 null');
        throw new Error('생성된 데이터를 받지 못했습니다');
      }

      console.log('✅ createSolution 성공! 생성된 데이터:', data);
      return data;

    } catch (error) {
      console.log('❌ createSolution 실패 상세:', {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined,
        stringifiedError: JSON.stringify(error, null, 2),
        inputData: solution
      });

      // 다른 예외적인 오류들 처리
      if (error === null || error === undefined) {
        console.error('❌ null/undefined 오류 감지');
        const errorMessage = '예상치 못한 오류가 발생했습니다.';
        setError(errorMessage);
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : `솔루션 생성 실패: ${JSON.stringify(error)}`;
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 솔루션 업데이트
  const updateSolution = useCallback(async (
    id: number,
    solution: Partial<DbSolutionData>
  ): Promise<boolean> => {
    try {
      console.log('📞 updateSolution 호출:', id, solution);
      setLoading(true);
      setError(null);

      // Supabase 쿼리 준비 및 실행
      console.log('🔍 Supabase 쿼리 준비 중...');
      console.log('  - 테이블: it_solution_data');
      console.log('  - ID:', id);
      console.log('  - 업데이트 데이터:', JSON.stringify(solution, null, 2));

      const updateData = {
        ...solution,
        updated_at: new Date().toISOString()
      };

      console.log('  - 최종 업데이트 데이터:', JSON.stringify(updateData, null, 2));

      let supabaseResult;
      try {
        console.log('🚀 Supabase 쿼리 실행 시작...');
        supabaseResult = await supabase
          .from('it_solution_data')
          .update(updateData)
          .eq('id', id)
          .eq('is_active', true)
          .select();

        console.log('📋 Supabase 쿼리 실행 완료:', supabaseResult);
      } catch (queryError) {
        console.error('❌ Supabase 쿼리 실행 중 예외 발생:', queryError);
        throw queryError;
      }

      const { data, error: supabaseError } = supabaseResult;

      console.log('🔍 Supabase 응답 분석:');
      console.log('  - data:', data);
      console.log('  - error:', supabaseError);
      console.log('  - error 타입:', typeof supabaseError);
      console.log('  - error 키들:', supabaseError ? Object.keys(supabaseError) : 'null');

      if (supabaseError) {
        // 빈 오류 객체 특별 처리
        if (typeof supabaseError === 'object' && supabaseError !== null && Object.keys(supabaseError).length === 0) {
          console.log('❌ 빈 오류 객체 감지 - 알 수 없는 업데이트 오류 발생');
          console.log('  - 가능한 원인: Supabase 연결 문제, 인증 오류, 네트워크 문제');
          const errorMessage = '솔루션 업데이트에 실패했습니다. 데이터베이스 연결을 확인해주세요.';
          setError(errorMessage);
          return false;
        }

        console.log('❌ Supabase 업데이트 오류 발생');
        console.log('  - message:', supabaseError?.message || 'undefined');
        console.log('  - details:', supabaseError?.details || 'undefined');
        console.log('  - hint:', supabaseError?.hint || 'undefined');
        console.log('  - code:', supabaseError?.code || 'undefined');
        try {
          console.log('  - fullError:', JSON.stringify(supabaseError));
        } catch (e) {
          console.log('  - fullError: [JSON 변환 실패]', supabaseError);
        }
        setError(`Supabase 업데이트 오류: ${supabaseError.message || '알 수 없는 오류'}`);
        return false;
      }

      console.log('✅ updateSolution 성공:', data);
      return true;

    } catch (error) {
      console.log('❌ updateSolution 실패 상세:', {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined,
        stringifiedError: JSON.stringify(error, null, 2),
        inputId: id,
        inputSolution: solution
      });

      // 다른 예외적인 오류들 처리
      if (error === null || error === undefined) {
        console.error('❌ null/undefined 오류 감지');
        const errorMessage = '예상치 못한 오류가 발생했습니다.';
        setError(errorMessage);
        return false;
      }

      const errorMessage = error instanceof Error ? error.message : `솔루션 업데이트 실패: ${JSON.stringify(error)}`;
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 솔루션 삭제 (soft delete)
  const deleteSolution = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('📞 deleteSolution 호출:', id);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('it_solution_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (supabaseError) {
        console.error('❌ Supabase 삭제 오류:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ deleteSolution 성공:', data);
      return true;

    } catch (error) {
      console.error('❌ deleteSolution 실패:', error);
      setError(error instanceof Error ? error.message : '솔루션 삭제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // DB 데이터를 프론트엔드 형식으로 변환
  const convertToSolutionData = useCallback((dbData: DbSolutionData): SolutionData => {
    const result = {
      id: dbData.id,
      no: dbData.no,
      registrationDate: dbData.registration_date,
      startDate: dbData.start_date || '',
      code: dbData.code,
      solutionType: dbData.solution_type,
      developmentType: dbData.development_type,
      title: dbData.title,
      detailContent: dbData.detail_content,
      team: dbData.team,
      assignee: dbData.assignee,
      status: dbData.status,
      completedDate: dbData.completed_date || '',
      attachments: dbData.attachments || []
    };
    console.log('🔄 DB → Frontend 변환:', { input: dbData, output: result });
    return result;
  }, []);

  // 프론트엔드 데이터를 DB 형식으로 변환
  const convertToDbSolutionData = useCallback((
    frontendData: SolutionData
  ): Omit<DbSolutionData, 'id' | 'created_at' | 'updated_at'> => {
    // 필수 필드 검증 (빈 문자열도 허용)
    const requiredFields = ['solutionType', 'developmentType', 'status'];
    const missingFields = requiredFields.filter(field => !frontendData[field as keyof SolutionData]);

    if (missingFields.length > 0) {
      console.error('❌ 필수 필드 누락:', missingFields);
      throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
    }

    const result = {
      no: frontendData.no || 1, // 프론트엔드 표시용 (DB 관리 안함)
      registration_date: frontendData.registrationDate || new Date().toISOString().split('T')[0],
      start_date: frontendData.startDate || null,
      code: frontendData.code || '',
      solution_type: frontendData.solutionType,
      development_type: frontendData.developmentType,
      title: frontendData.title || '',
      detail_content: frontendData.detailContent || '',
      team: frontendData.team || '개발팀',
      assignee: frontendData.assignee || '',
      status: frontendData.status,
      completed_date: frontendData.completedDate || null,
      attachments: frontendData.attachments || [],
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };
    console.log('🔄 Frontend → DB 변환 성공:', {
      input: frontendData,
      output: result,
      validationPassed: '✅'
    });
    return result;
  }, []);

  return {
    getSolutions,
    getSolutionById,
    createSolution,
    updateSolution,
    deleteSolution,
    convertToSolutionData,
    convertToDbSolutionData,
    loading,
    error
  };
};

export default useSupabaseSolution;