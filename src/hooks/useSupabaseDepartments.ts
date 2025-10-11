import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// 부서 데이터 타입 (기본 정보만)
export interface SimpleDepartment {
  id: number;
  department_code: string;
  department_name: string;
  is_active: boolean;
  display_order: number;
}

export function useSupabaseDepartments() {
  const [departments, setDepartments] = useState<SimpleDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 부서 목록 조회 (활성화된 부서만)
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏢 부서 목록 조회 시작');

      const { data, error: fetchError } = await supabase
        .from('admin_users_department')
        .select('id, department_code, department_name, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('🔴 부서 조회 오류:', fetchError);
        throw fetchError;
      }

      console.log('🏢 부서 목록 조회 성공:', data);
      setDepartments(data || []);
    } catch (err) {
      console.error('🔴 부서 목록 조회 실패:', err);
      setError(err instanceof Error ? err.message : '부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 활성화된 부서명 목록 조회
  const getActiveDepartmentNames = useCallback(async (): Promise<string[]> => {
    try {
      console.log('🏢 활성화된 부서명 조회 시작');

      const { data, error: fetchError } = await supabase
        .from('admin_users_department')
        .select('department_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('🔴 부서명 조회 오류:', fetchError);
        throw fetchError;
      }

      const names = data?.map(d => d.department_name) || [];
      console.log('🏢 활성화된 부서명 조회 성공:', names);
      return names;
    } catch (err) {
      console.error('🔴 부서명 조회 실패:', err);
      return [];
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    refreshDepartments: fetchDepartments,
    getActiveDepartmentNames
  };
}
