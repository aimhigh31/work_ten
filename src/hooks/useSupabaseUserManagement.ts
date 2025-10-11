import { useState, useEffect, useCallback } from 'react';

// 사용자 데이터 타입
export interface UserProfile {
  id: number;
  created_at: string;
  updated_at: string;
  user_code: string;
  user_name: string;
  email: string;
  department?: string;
  position?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  last_login?: string;
  avatar_url?: string;
  profile_image_url?: string;
  phone?: string;
  hire_date?: string;
  country?: string;
  address?: string;
  user_account_id?: string;
  is_active: boolean;
  is_system: boolean;
  created_by: string;
  updated_by: string;
  metadata?: any;
  assignedRole?: string[];
  rule?: string;
}

// 사용자 생성 요청 타입
export interface CreateUserProfileRequest {
  user_code: string;
  user_name: string;
  email: string;
  department?: string;
  position?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'pending';
  profile_image_url?: string;
  phone?: string;
  hire_date?: string;
  country?: string;
  address?: string;
  user_account_id?: string;
  assignedRole?: string[];
  rule?: string;
}

// 사용자 수정 요청 타입
export interface UpdateUserProfileRequest extends CreateUserProfileRequest {
  id: number;
}

// API 기반 데이터 처리

// 캐시 키
const USERS_CACHE_KEY = 'nexwork_users_cache';
const CACHE_TIMESTAMP_KEY = 'nexwork_users_cache_timestamp';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5분

export function useSupabaseUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = sessionStorage.getItem(USERS_CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // 캐시가 유효한 경우
        if (now - timestamp < CACHE_EXPIRY_MS) {
          const parsedData = JSON.parse(cachedData) as UserProfile[];
          console.log('✅ 캐시에서 사용자 데이터 로드:', parsedData.length, '명');
          setUsers(parsedData);
          return true;
        } else {
          console.log('⏰ 캐시 만료됨');
        }
      }
      return false;
    } catch (err) {
      console.error('❌ 캐시 로드 실패:', err);
      return false;
    }
  }, []);

  // 캐시에 데이터 저장
  const saveToCache = useCallback((data: UserProfile[]) => {
    try {
      sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 사용자 데이터 캐시 저장:', data.length, '명');
    } catch (err) {
      console.error('❌ 캐시 저장 실패:', err);
    }
  }, []);

  // 사용자 목록 조회
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        saveToCache(result.data); // 캐시에 저장
      } else {
        setError(result.error || '사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [saveToCache]);

  // 사용자 생성
  const createUser = useCallback(
    async (userData: CreateUserProfileRequest): Promise<boolean> => {
      try {
        // 생성 과정에서는 에러 클리어하지 않음 (별도 처리)
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchUsers();
          return true;
        } else {
          console.error('사용자 생성 실패:', result.error);
          // UI에서 직접 알림 표시하도록 변경
          alert(result.error || '사용자 생성에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('사용자 생성 실패:', err);
        alert('사용자 생성에 실패했습니다.');
        return false;
      }
    },
    [fetchUsers]
  );

  // 사용자 수정
  const updateUser = useCallback(
    async (userData: UpdateUserProfileRequest): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchUsers();
          return true;
        } else {
          setError(result.error || '사용자 수정에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('사용자 수정 실패:', err);
        setError('사용자 수정에 실패했습니다.');
        return false;
      }
    },
    [fetchUsers]
  );

  // 사용자 삭제
  const deleteUser = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/users?id=${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchUsers();
          return true;
        } else {
          setError(result.error || '사용자 삭제에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('사용자 삭제 실패:', err);
        setError('사용자 삭제에 실패했습니다.');
        return false;
      }
    },
    [fetchUsers]
  );

  // 사용자 상태 토글
  const toggleUserStatus = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch('/api/users/toggle-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id })
        });

        const result = await response.json();

        if (result.success) {
          // 목록 새로고침
          await fetchUsers();
          return true;
        } else {
          setError(result.error || '사용자 상태 변경에 실패했습니다.');
          return false;
        }
      } catch (err) {
        console.error('사용자 상태 변경 실패:', err);
        setError('사용자 상태 변경에 실패했습니다.');
        return false;
      }
    },
    [fetchUsers]
  );

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const hasCachedData = loadFromCache();

    if (hasCachedData) {
      // 캐시 데이터가 있으면 로딩 상태 해제
      setLoading(false);
      console.log('⚡ 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchUsers();
  }, [fetchUsers, loadFromCache]);

  return {
    users,
    loading,
    error,
    clearError,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  };
}
