import { useState, useEffect, useCallback } from 'react';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 부서 데이터 타입
export interface Department {
  id: number;
  created_at: string;
  updated_at: string;
  department_code: string;
  department_name: string;
  parent_department_id?: number;
  department_level: number;
  display_order: number;
  manager_name?: string;
  manager_email?: string;
  phone?: string;
  location?: string;
  description?: string;
  is_active: boolean;
  is_system: boolean;
  created_by: string;
  updated_by: string;
  metadata?: any;
}

// 부서 생성 요청 타입
export interface CreateDepartmentRequest {
  department_code: string;
  department_name: string;
  parent_department_id?: number;
  department_level?: number;
  display_order?: number;
  manager_name?: string;
  manager_email?: string;
  phone?: string;
  location?: string;
  description?: string;
  created_by?: string;
}

// 부서 수정 요청 타입
export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: number;
}

// 캐시 키
const CACHE_KEY = createCacheKey('department_management', 'data');

export function useSupabaseDepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false); // Investment 패턴: 초기값 false (수동 로딩)
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 부서 목록 조회 (Investment 패턴 - 데이터 직접 반환)
  const getDepartments = useCallback(async (): Promise<Department[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/departments');
      const result = await response.json();

      if (result.success) {
        console.log('✅ [DepartmentManagement] API에서 최신 데이터 가져옴:', result.data?.length || 0);
        saveToCache(CACHE_KEY, result.data); // 캐시에 저장
        return result.data || [];
      } else {
        setError(result.error || '부서 목록을 불러오는데 실패했습니다.');
        return [];
      }
    } catch (err) {
      console.error('부서 목록 조회 실패:', err);
      setError('부서 목록을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 부서 목록 조회 (내부 상태 업데이트용 - 후방 호환성)
  const fetchDepartments = useCallback(async () => {
    const data = await getDepartments();
    setDepartments(data);
  }, [getDepartments]);

  // 부서 생성
  const createDepartment = useCallback(async (departmentData: CreateDepartmentRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(departmentData)
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        // 정상적인 검증 오류 (중복 등)는 warn으로 표시
        console.warn('⚠️ 부서 생성 검증 실패:', result.error);
        return { success: false, error: result.error || '부서 생성에 실패했습니다.' };
      }
    } catch (err) {
      console.error('🔴 부서 생성 예외 발생:', err);
      return { success: false, error: '부서 생성에 실패했습니다.' };
    }
  }, []);

  // 부서 수정
  const updateDepartment = useCallback(async (departmentData: UpdateDepartmentRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(departmentData)
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        console.error('부서 수정 실패:', result.error);
        return { success: false, error: result.error || '부서 수정에 실패했습니다.' };
      }
    } catch (err) {
      console.error('부서 수정 실패:', err);
      return { success: false, error: '부서 수정에 실패했습니다.' };
    }
  }, []);

  // 부서 삭제
  const deleteDepartment = useCallback(async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/departments?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        console.error('부서 삭제 실패:', result.error);
        return { success: false, error: result.error || '부서 삭제에 실패했습니다.' };
      }
    } catch (err) {
      console.error('부서 삭제 실패:', err);
      return { success: false, error: '부서 삭제에 실패했습니다.' };
    }
  }, []);

  // 부서 상태 토글
  const toggleDepartmentStatus = useCallback(async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/departments/toggle-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        console.error('부서 상태 변경 실패:', result.error);
        return { success: false, error: result.error || '부서 상태 변경에 실패했습니다.' };
      }
    } catch (err) {
      console.error('부서 상태 변경 실패:', err);
      return { success: false, error: '부서 상태 변경에 실패했습니다.' };
    }
  }, []);

  // Investment 패턴: 자동 로딩 제거 (페이지에서 수동 호출)
  // useEffect 제거로 병렬 로딩 가능

  return {
    departments,
    loading,
    error,
    clearError,
    getDepartments, // ⭐ Investment 패턴: 데이터 직접 반환
    fetchDepartments, // 후방 호환성: 내부 상태 업데이트
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus
  };
}
