import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
        .select(
          `
          id,
          user_code,
          user_name,
          email,
          department,
          position,
          role,
          status,
          is_active,
          avatar_url,
          profile_image_url
        `
        )
        .eq('is_active', true)
        .eq('status', 'active')
        .order('user_name', { ascending: true });

      if (fetchError) {
        console.error('🔴 사용자 조회 오류:', fetchError);
        throw fetchError;
      }

      console.log('👥 사용자 목록 조회 성공:', data);
      setUsers(data || []);
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
