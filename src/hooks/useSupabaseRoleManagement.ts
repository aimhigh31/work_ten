import { useState, useEffect, useCallback } from 'react';

// 역할 데이터 타입
export interface Role {
  id: number;
  created_at: string;
  updated_at: string;
  role_code: string;
  role_name: string;
  role_description?: string;
  permissions: Record<string, string>; // 카테고리별 권한 (읽기/쓰기/전체)
  is_active: boolean;
  is_system: boolean;
  display_order: number;
  created_by: string;
  updated_by: string;
  metadata?: any;
}

// 역할 생성 요청 타입
export interface CreateRoleRequest {
  role_code: string;
  role_name: string;
  role_description?: string;
  permissions?: Record<string, string>;
  display_order?: number;
}

// 역할 수정 요청 타입
export interface UpdateRoleRequest extends CreateRoleRequest {
  id: number;
}

// 권한 카테고리 정의
export const PERMISSION_CATEGORIES = {
  dashboard: '대시보드',
  user_management: '사용자관리',
  role_management: '역할관리',
  department_management: '부서관리',
  master_code: '마스터코드관리',
  task_management: '업무관리',
  cost_management: '비용관리'
} as const;

// 권한 레벨 정의
export const PERMISSION_LEVELS = {
  읽기: '읽기',
  쓰기: '쓰기',
  전체: '전체'
} as const;

export function useSupabaseRoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 역할 목록 조회
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/roles');
      const result = await response.json();

      if (result.success) {
        setRoles(result.data);
      } else {
        setError(result.error || '역할 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('역할 목록 조회 실패:', err);
      setError('역할 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 역할 생성
  const createRole = useCallback(
    async (roleData: CreateRoleRequest): Promise<boolean> => {
      try {
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleData)
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchRoles();
          return true;
        } else {
          console.error('역할 생성 실패:', result.error);
          alert(result.error || '역할 생성에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('역할 생성 실패:', err);
        alert('역할 생성에 실패했습니다.');
        return false;
      }
    },
    [fetchRoles]
  );

  // 역할 수정
  const updateRole = useCallback(
    async (roleData: UpdateRoleRequest): Promise<boolean> => {
      try {
        const response = await fetch('/api/roles', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleData)
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchRoles();
          return true;
        } else {
          console.error('역할 수정 실패:', result.error);
          alert(result.error || '역할 수정에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('역할 수정 실패:', err);
        alert('역할 수정에 실패했습니다.');
        return false;
      }
    },
    [fetchRoles]
  );

  // 역할 삭제
  const deleteRole = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await fetch(`/api/roles?id=${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchRoles();
          return true;
        } else {
          console.error('역할 삭제 실패:', result.error);
          alert(result.error || '역할 삭제에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('역할 삭제 실패:', err);
        alert('역할 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchRoles]
  );

  // 역할 상태 토글
  const toggleRoleStatus = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await fetch('/api/roles/toggle-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id })
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchRoles();
          return true;
        } else {
          console.error('역할 상태 변경 실패:', result.error);
          alert(result.error || '역할 상태 변경에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('역할 상태 변경 실패:', err);
        alert('역할 상태 변경에 실패했습니다.');
        return false;
      }
    },
    [fetchRoles]
  );

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    clearError,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    PERMISSION_CATEGORIES,
    PERMISSION_LEVELS
  };
}
