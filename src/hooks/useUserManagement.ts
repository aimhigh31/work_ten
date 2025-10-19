import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 사용자 정보 인터페이스 (실제 DB 구조와 맞춤)
export interface UserInfo {
  id: string;
  name: string;
  department: string;
  avatar?: string;
  email?: string;
  user_code?: string;
  position?: string;
  status?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    console.log('🔍 사용자설정 사용자관리 데이터 조회...');

    try {
      setLoading(true);

      // 실제 사용자설정 테이블에서 데이터 조회
      const { data, error } = await supabase
        .from('admin_users_userprofiles')
        .select('id, user_code, user_name, department, email, position, status, profile_image_url')
        .eq('is_active', true)
        .in('status', ['active', 'pending']) // 활성 사용자만
        .order('user_name', { ascending: true });

      if (error) {
        console.error('❌ 사용자 데이터 조회 실패:', error);
        throw error;
      }

      console.log('✅ 사용자설정 데이터 조회 성공:', data?.length + '명');

      // UserInfo 형식으로 변환
      const convertedUsers: UserInfo[] =
        data?.map((user) => ({
          id: user.id.toString(),
          name: user.user_name,
          department: user.department || '부서없음',
          email: user.email,
          user_code: user.user_code,
          position: user.position,
          status: user.status,
          avatar: user.profile_image_url || `/assets/images/users/avatar-${(user.id % 10) + 1}.png`
        })) || [];

      setUsers(convertedUsers);
      setUserNames(convertedUsers.map((user) => user.name));

      console.log(
        '👥 사용자 목록:',
        convertedUsers.map((u) => `${u.name} (${u.department})`)
      );
      setError(null);
    } catch (err: any) {
      console.error('❌ fetchUsers 오류:', err);
      setError(err.message || '사용자 데이터 조회 중 오류가 발생했습니다.');
      setUsers([]);
      setUserNames([]);
    } finally {
      setLoading(false);
    }
  };

  // 사용자명으로 사용자 정보 찾기
  const findUserByName = (name: string): UserInfo | null => {
    return users.find((user) => user.name === name) || null;
  };

  // ID로 사용자 정보 찾기
  const findUserById = (id: string): UserInfo | null => {
    return users.find((user) => user.id === id) || null;
  };

  // 부서별 사용자 조회
  const getUsersByDepartment = (department: string): UserInfo[] => {
    return users.filter((user) => user.department === department);
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users, // UserInfo[] - 전체 사용자 정보
    userNames, // string[] - 사용자명 배열
    loading,
    error,
    fetchUsers,
    findUserByName, // 사용자명 → 사용자 정보
    findUserById, // ID → 사용자 정보
    getUsersByDepartment // 부서별 사용자 조회
  };
};
