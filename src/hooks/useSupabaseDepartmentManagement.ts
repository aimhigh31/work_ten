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

// 캐시 키
const DEPARTMENTS_CACHE_KEY = 'nexwork_departments_cache';
const CACHE_TIMESTAMP_KEY = 'nexwork_departments_cache_timestamp';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30분 (성능 최적화)

export function useSupabaseDepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = sessionStorage.getItem(DEPARTMENTS_CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // 캐시가 유효한 경우
        if (now - timestamp < CACHE_EXPIRY_MS) {
          const parsedData = JSON.parse(cachedData) as Department[];
          console.log('✅ 캐시에서 부서 데이터 로드:', parsedData.length, '개');
          setDepartments(parsedData);
          return true;
        } else {
          console.log('⏰ 부서 캐시 만료됨');
        }
      }
      return false;
    } catch (err) {
      console.error('❌ 부서 캐시 로드 실패:', err);
      return false;
    }
  }, []);

  // 캐시에 데이터 저장
  const saveToCache = useCallback((data: Department[]) => {
    try {
      sessionStorage.setItem(DEPARTMENTS_CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 부서 데이터 캐시 저장:', data.length, '개');
    } catch (err) {
      console.error('❌ 부서 캐시 저장 실패:', err);
    }
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
        saveToCache(result.data); // 캐시에 저장
      } else {
        setError(result.error || '부서 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('부서 목록 조회 실패:', err);
      setError('부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [saveToCache]);

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

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const hasCachedData = loadFromCache();

    if (hasCachedData) {
      // 캐시 데이터가 있으면 로딩 상태 해제
      setLoading(false);
      console.log('⚡ 부서 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchDepartments();
  }, [fetchDepartments, loadFromCache]);

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
