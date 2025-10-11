import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// 보안점검 데이터 타입
export interface SecurityInspectionData {
  id?: number;
  no?: number;
  registration_date?: string;
  code: string;
  inspection_type: '보안점검' | '취약점점검' | '침투테스트' | '컴플라이언스점검';
  inspection_target: '고객사' | '내부' | '파트너사';
  inspection_content: string;
  inspection_date?: string | null;
  team: string;
  assignee: string;
  status: '대기' | '진행' | '완료' | '홀딩';
  details?: string;
  progress?: number;
  attachments?: string[];
  performance?: string; // 점검성과보고 - 성과
  improvements?: string; // 점검성과보고 - 개선사항
  thoughts?: string; // 점검성과보고 - 점검소감
  notes?: string; // 점검성과보고 - 비고
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export function useSupabaseSecurityInspection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모든 보안점검 데이터 조회
  const fetchAllInspections = useCallback(async (): Promise<SecurityInspectionData[]> => {
    try {
      console.log('📋 보안점검 데이터 조회 시작');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('security_inspection_data')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false });

      if (error) {
        console.error('🔴 보안점검 데이터 조회 실패:', error);
        setError(error.message);
        return [];
      }

      console.log('✅ 보안점검 데이터 조회 성공:', data);
      return data || [];
    } catch (err) {
      console.error('🔴 예상치 못한 오류:', err);
      setError('보안점검 데이터 조회 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ID로 특정 보안점검 데이터 조회
  const fetchInspectionById = useCallback(async (id: number): Promise<SecurityInspectionData | null> => {
    try {
      console.log('🔍 보안점검 데이터 조회 시작:', id);
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('security_inspection_data').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ 보안점검 데이터 없음');
          return null;
        }
        console.error('🔴 보안점검 데이터 조회 실패:', error);
        setError(error.message);
        return null;
      }

      console.log('✅ 보안점검 데이터 조회 성공:', data);
      return data;
    } catch (err) {
      console.error('🔴 예상치 못한 오류:', err);
      setError('보안점검 데이터 조회 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 새로운 보안점검 데이터 생성
  const createInspection = useCallback(
    async (
      inspectionData: Omit<SecurityInspectionData, 'id' | 'no' | 'created_at' | 'updated_at'>
    ): Promise<SecurityInspectionData | null> => {
      try {
        console.log('➕ 보안점검 데이터 생성 시작:', inspectionData);
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('security_inspection_data')
          .insert([
            {
              ...inspectionData,
              is_active: true,
              created_at: new Date().toISOString(),
              created_by: 'user'
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('🔴 보안점검 데이터 생성 실패 - Full Object:', error);
          console.error('🔴 보안점검 데이터 생성 실패 - Stringified:', JSON.stringify(error, null, 2));
          console.error('🔴 보안점검 데이터 생성 실패 - toString:', error.toString());
          console.error('🔴 보안점검 데이터 생성 실패 - Keys:', Object.keys(error));
          console.error('🔴 보안점검 데이터 생성 실패 - All Keys (with proto):', Object.getOwnPropertyNames(error));
          console.error('🔴 보안점검 데이터 생성 실패 - Message:', error?.message);
          console.error('🔴 보안점검 데이터 생성 실패 - Details:', error?.details);
          console.error('🔴 보안점검 데이터 생성 실패 - Hint:', error?.hint);
          console.error('🔴 보안점검 데이터 생성 실패 - Code:', error?.code);
          console.error('🔴 보안점검 데이터 생성 실패 - Constructor:', error?.constructor?.name);

          // 모든 속성 순회
          console.error('🔴 보안점검 데이터 생성 실패 - All Properties:');
          for (const key in error) {
            console.error(`  ${key}:`, (error as any)[key]);
          }

          setError(error.message || error.toString() || '보안점검 데이터 생성에 실패했습니다.');
          return null;
        }

        console.log('✅ 보안점검 데이터 생성 성공:', data);
        return data;
      } catch (err: any) {
        console.error('🔴 보안점검 데이터 생성 실패 (catch) - Full Object:', err);
        console.error('🔴 보안점검 데이터 생성 실패 (catch) - Stringified:', JSON.stringify(err, null, 2));
        console.error('🔴 보안점검 데이터 생성 실패 (catch) - Keys:', Object.keys(err || {}));
        console.error('🔴 보안점검 데이터 생성 실패 (catch) - Message:', err?.message);
        console.error('🔴 보안점검 데이터 생성 실패 (catch) - Stack:', err?.stack);
        setError(err.message || '보안점검 데이터 생성 중 오류가 발생했습니다.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 기존 보안점검 데이터 수정
  const updateInspection = useCallback(
    async (id: number, inspectionData: Partial<SecurityInspectionData>): Promise<SecurityInspectionData | null> => {
      try {
        console.log('🔄 보안점검 데이터 수정 시작:', id, inspectionData);
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('security_inspection_data')
          .update({
            ...inspectionData,
            updated_at: new Date().toISOString(),
            updated_by: 'user'
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('🔴 보안점검 데이터 수정 실패:', error);
          setError(error.message);
          return null;
        }

        console.log('✅ 보안점검 데이터 수정 성공:', data);
        return data;
      } catch (err: any) {
        console.error('🔴 보안점검 데이터 수정 실패:', err);
        setError(err.message || '보안점검 데이터 수정 중 오류가 발생했습니다.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 보안점검 데이터 삭제 (소프트 삭제)
  const deleteInspection = useCallback(async (id: number): Promise<boolean> => {
    try {
      console.log('🗑️ 보안점검 데이터 삭제 시작 (소프트 삭제):', id);
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('security_inspection_data')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          updated_by: 'user'
        })
        .eq('id', id);

      if (error) {
        console.error('🔴 보안점검 데이터 삭제 실패:', error);
        setError(error.message);
        return false;
      }

      console.log('✅ 보안점검 데이터 삭제 성공 (is_active = false)');
      return true;
    } catch (err: any) {
      console.error('🔴 보안점검 데이터 삭제 실패:', err);
      setError(err.message || '보안점검 데이터 삭제 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 상태별 통계 조회
  const fetchInspectionStats = useCallback(async (): Promise<{ [key: string]: number }> => {
    try {
      console.log('📊 보안점검 통계 조회 시작');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from('security_inspection_data').select('status').eq('is_active', true);

      if (error) {
        console.error('🔴 보안점검 통계 조회 실패:', error);
        setError(error.message);
        return {};
      }

      const stats =
        data?.reduce((acc: { [key: string]: number }, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {}) || {};

      console.log('✅ 보안점검 통계 조회 성공:', stats);
      return stats;
    } catch (err: any) {
      console.error('🔴 예상치 못한 오류:', err);
      setError('보안점검 통계 조회 중 오류가 발생했습니다.');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // 코드 생성 (자동 생성용)
  const generateInspectionCode = useCallback(async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 25

    try {
      // 현재 연도의 최대 일련번호 조회
      const { data, error } = await supabase
        .from('security_inspection_data')
        .select('code')
        .like('code', `SEC-INS-${year}-%`)
        .order('code', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (data && data.length > 0) {
        // 코드에서 일련번호 추출
        const lastCode = data[0].code;
        const match = lastCode.match(/SEC-INS-\d{2}-(\d{3})/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // 일련번호를 3자리로 포맷 (001, 002, ...)
      const formattedNumber = String(nextNumber).padStart(3, '0');

      return `SEC-INS-${year}-${formattedNumber}`;
    } catch (err) {
      console.error('코드 생성 중 오류:', err);
      // 오류 시 시간 기반 임시 코드 생성
      const time = String(Date.now()).slice(-3);
      return `SEC-INS-${year}-${time}`;
    }
  }, []);

  return {
    loading,
    error,
    fetchAllInspections,
    fetchInspectionById,
    createInspection,
    updateInspection,
    deleteInspection,
    fetchInspectionStats,
    generateInspectionCode
  };
}
