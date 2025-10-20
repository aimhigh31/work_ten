import { useState, useEffect, useCallback } from 'react';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS, clearCache } from '../utils/cacheUtils';

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
const CACHE_KEY = createCacheKey('user_management', 'data');

export function useSupabaseUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 사용자 목록 조회 (Investment 패턴 - 데이터 직접 반환)
  const getUsers = useCallback(async (): Promise<UserProfile[]> => {
    // 1. 캐시 확인 (캐시가 있으면 즉시 반환)
    const cachedData = loadFromCache<UserProfile[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      console.log('⚡ [UserManagement] 캐시 데이터 반환 (깜빡임 방지)');
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users');
      const result = await response.json();

      if (result.success) {
        saveToCache(CACHE_KEY, result.data); // 캐시에 저장
        return result.data || [];
      } else {
        setError(result.error || '사용자 목록을 불러오는데 실패했습니다.');
        return [];
      }
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      setError('사용자 목록을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 사용자 목록 조회 (내부 상태 업데이트용 - 후방 호환성)
  const fetchUsers = useCallback(async () => {
    const data = await getUsers();
    setUsers(data);
  }, [getUsers]);

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
          // 캐시 무효화 (최신 데이터 반영)
          clearCache(CACHE_KEY);
          console.log('🗑️ 사용자 캐시 무효화');

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

        console.log('🔄 사용자 수정 요청 데이터:', userData);

        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        const result = await response.json();

        console.log('📡 사용자 수정 응답:', result);

        if (result.success) {
          // 캐시 무효화 (최신 데이터 반영)
          clearCache(CACHE_KEY);
          console.log('🗑️ 사용자 캐시 무효화');

          // 목록 새로고침
          await fetchUsers();
          return true;
        } else {
          console.error('❌ 사용자 수정 실패:', result.error);
          setError(result.error || '사용자 수정에 실패했습니다.');
          alert(`사용자 수정 실패: ${result.error || '알 수 없는 오류'}`);
          return false;
        }
      } catch (err) {
        console.error('사용자 수정 실패:', err);
        setError('사용자 수정에 실패했습니다.');
        alert('사용자 수정 중 오류가 발생했습니다.');
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
          // 캐시 무효화 (최신 데이터 반영)
          clearCache(CACHE_KEY);
          console.log('🗑️ 사용자 캐시 무효화');

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
          // 캐시 무효화 (최신 데이터 반영)
          clearCache(CACHE_KEY);
          console.log('🗑️ 사용자 캐시 무효화');

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

  // Investment 패턴: 자동 로딩 제거 (페이지에서 수동 호출)
  // useEffect 제거로 병렬 로딩 가능

  return {
    users,
    loading,
    error,
    clearError,
    getUsers, // ⭐ Investment 패턴: 데이터 직접 반환
    fetchUsers, // 후방 호환성: 내부 상태 업데이트
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  };
}
