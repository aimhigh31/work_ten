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
}

export function useSupabaseUsers() {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 조회
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('admin_users_userprofiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('⚠️ 사용자 조회 오류:', fetchError.message);
        throw fetchError;
      }

      // assigned_roles를 assignedRole로 변환
      const processedData = (data || []).map((row) => {
        let assignedRole = [];
        try {
          if (row.assigned_roles) {
            // 이미 배열인 경우 그대로 사용
            if (Array.isArray(row.assigned_roles)) {
              assignedRole = row.assigned_roles;
            }
            // 문자열인 경우 JSON 파싱 시도
            else if (typeof row.assigned_roles === 'string') {
              if (row.assigned_roles.startsWith('[') || row.assigned_roles.startsWith('{')) {
                assignedRole = JSON.parse(row.assigned_roles);
              } else {
                assignedRole = [row.assigned_roles];
              }
            }
            // 기타 타입인 경우 배열로 변환
            else {
              assignedRole = [row.assigned_roles];
            }
          }
        } catch (error) {
          console.warn('⚠️ assigned_roles 파싱 오류:', error);
          assignedRole = [];
        }

        return {
          ...row,
          assignedRole: Array.isArray(assignedRole) ? assignedRole : []
        };
      });

      setUsers(processedData);
      saveToCache(CACHE_KEY, processedData); // 변환된 데이터를 캐시에 저장
    } catch (err) {
      console.warn('⚠️ 사용자 목록 조회 실패:', err);
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

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
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
