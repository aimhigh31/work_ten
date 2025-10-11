import { useState, useEffect, useCallback } from 'react';

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
}

// 부서 수정 요청 타입
export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: number;
}

export function useSupabaseDepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 부서 목록 조회
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/departments');
      const result = await response.json();

      if (result.success) {
        setDepartments(result.data);
      } else {
        setError(result.error || '부서 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('부서 목록 조회 실패:', err);
      setError('부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 부서 생성
  const createDepartment = useCallback(
    async (departmentData: CreateDepartmentRequest): Promise<boolean> => {
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
          // 목록 새로고침
          await fetchDepartments();
          return true;
        } else {
          console.error('부서 생성 실패:', result.error);
          alert(result.error || '부서 생성에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('부서 생성 실패:', err);
        alert('부서 생성에 실패했습니다.');
        return false;
      }
    },
    [fetchDepartments]
  );

  // 부서 수정
  const updateDepartment = useCallback(
    async (departmentData: UpdateDepartmentRequest): Promise<boolean> => {
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
          // 목록 새로고침
          await fetchDepartments();
          return true;
        } else {
          console.error('부서 수정 실패:', result.error);
          alert(result.error || '부서 수정에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('부서 수정 실패:', err);
        alert('부서 수정에 실패했습니다.');
        return false;
      }
    },
    [fetchDepartments]
  );

  // 부서 삭제
  const deleteDepartment = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await fetch(`/api/departments?id=${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchDepartments();
          return true;
        } else {
          console.error('부서 삭제 실패:', result.error);
          alert(result.error || '부서 삭제에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('부서 삭제 실패:', err);
        alert('부서 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchDepartments]
  );

  // 부서 상태 토글
  const toggleDepartmentStatus = useCallback(
    async (id: number): Promise<boolean> => {
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
          // 목록 새로고침
          await fetchDepartments();
          return true;
        } else {
          console.error('부서 상태 변경 실패:', result.error);
          alert(result.error || '부서 상태 변경에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('부서 상태 변경 실패:', err);
        alert('부서 상태 변경에 실패했습니다.');
        return false;
      }
    },
    [fetchDepartments]
  );

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    clearError,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus
  };
}
