import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// 캐시 키
const CACHE_KEY = createCacheKey('users', 'data');

// 사용자 데이터 타입 (기본 정보만)
export interface SimpleUser {
  id: number;
  user_code: string;
  user_name: string;
  email: string;
  department?: string;
  position?: string;
  role?: string;
  status: 'active' | 'inactive' | 'pending';
  is_active: boolean;
  avatar_url?: string;
  profile_image_url?: string;
  user_account_id?: string;
  phone?: string;
  country?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  hire_date?: string;
  is_system?: boolean;
  created_by?: string;
  updated_by?: string;
  metadata?: any;
  assignedRole?: string[];
  assigned_roles?: any;
  rule?: string;
}

export function useSupabaseUsers() {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 조회 (활성화된 사용자만)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👥 사용자 목록 조회 시작');

      const { data, error: fetchError } = await supabase
        .from('admin_users_userprofiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('🔴 사용자 조회 오류:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
          full: fetchError
        });
        throw fetchError;
      }

      console.log('👥 사용자 목록 조회 성공:', data);
      if (data && data.length > 0) {
        console.log('👥 첫 번째 사용자 샘플 데이터:', {
          user_name: data[0].user_name,
          user_account_id: data[0].user_account_id,
          department: data[0].department,
          position: data[0].position,
          phone: data[0].phone,
          country: data[0].country,
          address: data[0].address
        });
      }
      setUsers(data || []);
      saveToCache(CACHE_KEY, data || []); // 캐시에 저장
    } catch (err) {
      console.error('🔴 사용자 목록 조회 실패:', err);
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 활성 사용자 이름 목록만 반환
  const getActiveUserNames = useCallback(() => {
    return users.filter((user) => user.is_active && user.status === 'active').map((user) => user.user_name);
  }, [users]);

  // 사용자 아바타 매핑 반환
  const getUserAvatars = useCallback(() => {
    const avatarMap: Record<string, string> = {};
    users.forEach((user) => {
      if (user.avatar_url || user.profile_image_url) {
        avatarMap[user.user_name] = user.avatar_url || user.profile_image_url || '';
      }
    });
    return avatarMap;
  }, [users]);

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<SimpleUser[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setUsers(cachedData);
      setLoading(false);
      console.log('⚡ [Users] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
    getActiveUserNames,
    getUserAvatars
  };
}
