import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 보안사고 개선사항 데이터 타입
export interface SecurityImprovementItem {
  id: number;
  accident_id: number;
  plan: string;
  status: '미완료' | '진행중' | '완료';
  completion_date?: string;
  assignee?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
}

// 개선사항 생성/수정 요청 타입
export interface CreateImprovementRequest {
  accident_id: number;
  plan: string;
  status?: '미완료' | '진행중' | '완료';
  completion_date?: string;
  assignee?: string;
}

export function useSupabaseImprovements() {
  const [items, setItems] = useState<SecurityImprovementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 특정 사고 ID의 개선사항 목록 조회
  const fetchImprovementsByAccidentId = useCallback(async (accidentId: number) => {
    try {
      console.log('🟡 fetchImprovementsByAccidentId 시작, accidentId:', accidentId, '타입:', typeof accidentId);
      setLoading(true);
      setError(null);

      // 연결 테스트
      console.log('🔗 Supabase 연결 테스트 중...');
      const { count, error: testError } = await supabase.from('security_accident_improvement').select('*', { count: 'exact', head: true });
      console.log('🔗 연결 테스트 결과:', { count, error: testError });

      console.log('🔍 쿼리 실행 중...');
      const { data, error } = await supabase
        .from('security_accident_improvement')
        .select('*')
        .eq('accident_id', accidentId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      console.log('🔍 쿼리 결과 - data:', data);
      console.log('🔍 쿼리 결과 - error:', error);

      if (error) {
        console.error('🔴 개선사항 조회 에러:', error);
        console.error('🔴 Error 상세:', JSON.stringify(error, null, 2));
        setError('개선사항 조회에 실패했습니다.');
        return [];
      }

      console.log('🟡 fetchImprovementsByAccidentId 응답:', data, '개수:', data?.length);
      setItems(data || []);
      return data || [];
    } catch (error) {
      console.error('🔴 fetchImprovementsByAccidentId catch 오류:', error);
      setError('개선사항 조회에 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 개선사항 생성
  const createImprovement = useCallback(
    async (improvementData: CreateImprovementRequest): Promise<SecurityImprovementItem | null> => {
      try {
        console.log('🟢 createImprovement 시작');
        console.log('🟢 Supabase 객체 상태:', !!supabase);
        console.log('🟢 요청 데이터:', JSON.stringify(improvementData, null, 2));
        console.log('🟢 요청 데이터 키:', Object.keys(improvementData));
        console.log('🟢 요청 데이터 값들:');
        Object.entries(improvementData).forEach(([key, value]) => {
          console.log(`  ${key}: ${value} (${typeof value})`);
        });

        setError(null);

        // 연결 테스트
        console.log('🔗 Supabase 연결 테스트 중...');
        const { count, error: testError } = await supabase.from('security_accident_improvement').select('*', { count: 'exact', head: true });
        console.log('🔗 연결 테스트 결과:', { count, error: testError });

        const { data, error } = await supabase.from('security_accident_improvement').insert(improvementData).select().single();

        console.log('🔗 INSERT 결과 - data:', data);
        console.log('🔗 INSERT 결과 - error:', error);

        if (error) {
          console.error('🔴 개선사항 생성 실패:', error);
          const errorMessage = error.message || '개선사항 생성에 실패했습니다.';
          setError(errorMessage);
          throw new Error(`생성 실패: ${errorMessage}`);
        }

        console.log('🟢 개선사항 생성 성공:', data);

        // 해당 사고의 개선사항 목록 재조회
        await fetchImprovementsByAccidentId(improvementData.accident_id);

        return data;
      } catch (error) {
        console.error('🔴 createImprovement catch 블록:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('알 수 없는 오류가 발생했습니다.');
        }
        return null;
      }
    },
    [fetchImprovementsByAccidentId]
  );

  // 개선사항 수정
  const updateImprovement = useCallback(
    async (id: number, updateData: Partial<SecurityImprovementItem>): Promise<boolean> => {
      try {
        setError(null);
        console.log('🔵 updateImprovement 시작');
        console.log('🔵 ID:', id, '타입:', typeof id);
        console.log('🔵 updateData:', updateData);

        const { data, error } = await supabase
          .from('security_accident_improvement')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        console.log('🔵 Supabase 쿼리 결과:', { data, error });

        if (error) {
          console.error('개선사항 수정 실패:', error);
          setError(error.message || '개선사항 수정에 실패했습니다.');
          return false;
        }

        // 해당 사고의 개선사항 목록 재조회
        if (data?.accident_id) {
          await fetchImprovementsByAccidentId(data.accident_id);
        }

        return true;
      } catch (error) {
        console.error('개선사항 수정 오류:', error);
        setError(error instanceof Error ? error.message : '개선사항 수정에 실패했습니다.');
        return false;
      }
    },
    [fetchImprovementsByAccidentId]
  );

  // 개선사항 삭제 (논리 삭제)
  const deleteImprovement = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);
        console.log('🔴 deleteImprovement 시작, ID:', id);

        // 먼저 해당 개선사항 정보 조회 (accident_id 확인용)
        const { data: improvementData, error: selectError } = await supabase
          .from('security_accident_improvement')
          .select('accident_id')
          .eq('id', id)
          .single();

        if (selectError) {
          console.error('개선사항 조회 실패:', selectError);
          setError('개선사항 조회에 실패했습니다.');
          return false;
        }

        // 논리 삭제 (is_active = false)
        const { error } = await supabase
          .from('security_accident_improvement')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error('개선사항 삭제 실패:', error);
          setError(error.message || '개선사항 삭제에 실패했습니다.');
          return false;
        }

        // 해당 사고의 개선사항 목록 재조회
        await fetchImprovementsByAccidentId(improvementData.accident_id);
        return true;
      } catch (error) {
        console.error('개선사항 삭제 오류:', error);
        setError('개선사항 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchImprovementsByAccidentId]
  );

  // 특정 사고의 모든 개선사항 삭제 (사고 삭제 시 사용)
  const deleteAllImprovementsByAccidentId = useCallback(
    async (accidentId: number): Promise<boolean> => {
      try {
        setError(null);
        console.log('🔴 deleteAllImprovementsByAccidentId 시작, accidentId:', accidentId);

        const { error } = await supabase
          .from('security_accident_improvement')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('accident_id', accidentId);

        if (error) {
          console.error('개선사항 일괄 삭제 실패:', error);
          setError(error.message || '개선사항 일괄 삭제에 실패했습니다.');
          return false;
        }

        // 목록 재조회
        await fetchImprovementsByAccidentId(accidentId);
        return true;
      } catch (error) {
        console.error('개선사항 일괄 삭제 오류:', error);
        setError('개선사항 일괄 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchImprovementsByAccidentId]
  );

  // data_relation.md 패턴에 따른 일괄 업데이트 (삭제 후 재생성)
  const replaceAllImprovements = useCallback(
    async (accidentId: number, newImprovements: CreateImprovementRequest[]): Promise<boolean> => {
      try {
        setError(null);
        console.log('🔄 replaceAllImprovements 시작');
        console.log('🔄 accidentId:', accidentId);
        console.log('🔄 newImprovements:', newImprovements);

        // 1. 기존 개선사항 모두 논리 삭제
        const { error: deleteError } = await supabase
          .from('security_accident_improvement')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('accident_id', accidentId);

        if (deleteError) {
          console.error('기존 개선사항 삭제 실패:', deleteError);
          setError('기존 개선사항 삭제에 실패했습니다.');
          return false;
        }

        // 2. 새로운 개선사항들 생성
        if (newImprovements.length > 0) {
          const { data, error: insertError } = await supabase.from('security_accident_improvement').insert(newImprovements).select();

          if (insertError) {
            console.error('새 개선사항 생성 실패:', insertError);
            setError('새 개선사항 생성에 실패했습니다.');
            return false;
          }

          console.log('🟢 새 개선사항 생성 성공:', data);
        }

        // 3. 목록 재조회
        await fetchImprovementsByAccidentId(accidentId);
        return true;
      } catch (error) {
        console.error('개선사항 일괄 업데이트 오류:', error);
        setError('개선사항 일괄 업데이트에 실패했습니다.');
        return false;
      }
    },
    [fetchImprovementsByAccidentId]
  );

  return {
    items,
    loading,
    error,
    clearError,
    fetchImprovementsByAccidentId,
    createImprovement,
    updateImprovement,
    deleteImprovement,
    deleteAllImprovementsByAccidentId,
    replaceAllImprovements
  };
}
