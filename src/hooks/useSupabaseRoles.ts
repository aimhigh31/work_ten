'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadFromCache, saveToCache, createCacheKey, DEFAULT_CACHE_EXPIRY_MS } from '../utils/cacheUtils';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// 역할 데이터 타입
interface RoleData {
  id: number;
  no: number;
  registrationDate: string;
  code: string;
  role: string;
  description: string;
  userCount: number;
  permissionCount: number;
  status: '활성' | '비활성' | '대기';
  registeredBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
}

// DB 데이터를 프론트엔드 형식으로 변환
const transformDbToFrontend = (dbData: any): RoleData => ({
  id: dbData.id || 0,
  no: dbData.display_order || dbData.id || 0,
  registrationDate: dbData.created_at ? new Date(dbData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  code: dbData.role_code || '',
  role: dbData.role_name || '',
  description: dbData.role_description || '',
  userCount: 0, // 실제 사용자 수는 별도 계산 필요
  permissionCount: Array.isArray(dbData.permissions) ? dbData.permissions.length : 0,
  status: dbData.is_active ? '활성' : '비활성',
  registeredBy: dbData.created_by || '시스템',
  lastModifiedDate: dbData.updated_at ? new Date(dbData.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  lastModifiedBy: dbData.updated_by || '시스템'
});

// 프론트엔드 데이터를 DB 형식으로 변환
const transformFrontendToDb = (frontendData: RoleData) => ({
  role_code: frontendData.code,
  role_name: frontendData.role,
  role_description: frontendData.description,
  is_active: frontendData.status === '활성',
  display_order: frontendData.no,
  created_by: frontendData.registeredBy,
  updated_by: frontendData.lastModifiedBy
});

// Supabase 연결 테스트
const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('admin_usersettings_role').select('id').limit(1);
    return !error;
  } catch (err) {
    return false;
  }
};

// localStorage 키
const STORAGE_KEY = 'nexwork_roles_data';

// 캐시 키
const CACHE_KEY = createCacheKey('roles', 'data');

export const useSupabaseRoles = () => {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage에서 데이터 로드
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        setRoles(parsedData);
        console.log(`📱 로컬 스토리지에서 ${parsedData.length}개 역할 데이터 로드`);
      } else {
        // 기본 데이터 생성
        const defaultRoles = createDefaultRoles();
        setRoles(defaultRoles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRoles));
        console.log('📱 기본 역할 데이터 생성 및 저장');
      }
    } catch (err) {
      console.error('로컬 스토리지 로드 오류:', err);
      const defaultRoles = createDefaultRoles();
      setRoles(defaultRoles);
    }
  };

  // localStorage에 데이터 저장
  const saveToLocalStorage = (data: RoleData[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log(`💾 로컬 스토리지에 ${data.length}개 역할 데이터 저장`);
    } catch (err) {
      console.error('로컬 스토리지 저장 오류:', err);
    }
  };

  // 기본 역할 데이터 생성
  const createDefaultRoles = (): RoleData[] => [
    {
      id: 1,
      no: 1,
      registrationDate: '2025-09-01',
      code: 'RULE-25-001',
      role: '시스템관리자',
      description: '시스템 전체 관리 권한',
      userCount: 2,
      permissionCount: 15,
      status: '활성',
      registeredBy: '시스템',
      lastModifiedDate: '2025-09-01',
      lastModifiedBy: '시스템'
    },
    {
      id: 2,
      no: 2,
      registrationDate: '2025-09-02',
      code: 'RULE-25-002',
      role: '일반관리자',
      description: '일반 관리 업무 권한',
      userCount: 5,
      permissionCount: 8,
      status: '활성',
      registeredBy: '시스템',
      lastModifiedDate: '2025-09-02',
      lastModifiedBy: '시스템'
    },
    {
      id: 3,
      no: 3,
      registrationDate: '2025-09-03',
      code: 'RULE-25-003',
      role: '사용자',
      description: '기본 사용자 권한',
      userCount: 20,
      permissionCount: 3,
      status: '활성',
      registeredBy: '시스템',
      lastModifiedDate: '2025-09-03',
      lastModifiedBy: '시스템'
    },
    {
      id: 4,
      no: 4,
      registrationDate: '2025-09-04',
      code: 'RULE-25-004',
      role: '게스트',
      description: '제한적 조회 권한',
      userCount: 0,
      permissionCount: 1,
      status: '비활성',
      registeredBy: '시스템',
      lastModifiedDate: '2025-09-04',
      lastModifiedBy: '시스템'
    },
    {
      id: 5,
      no: 5,
      registrationDate: '2025-09-05',
      code: 'RULE-25-005',
      role: '검토자',
      description: '검토 및 승인 권한',
      userCount: 3,
      permissionCount: 5,
      status: '활성',
      registeredBy: '시스템',
      lastModifiedDate: '2025-09-05',
      lastModifiedBy: '시스템'
    }
  ];

  // 모든 역할 조회 - 내부 함수들을 직접 정의
  const fetchRoles = useCallback(async (): Promise<void> => {
    console.log('📡 역할 데이터 조회 시작...');

    try {
      setLoading(true);
      setError(null);

      // Supabase가 설정되지 않은 경우 기본 데이터 사용
      if (!isSupabaseConfigured || !supabase) {
        console.log('📱 로컬 모드: 기본 데이터 사용');
        const defaultRoles = [
          {
            id: 1,
            no: 1,
            registrationDate: '2025-09-01',
            code: 'RULE-25-001',
            role: '시스템관리자',
            description: '시스템 전체 관리 권한',
            userCount: 2,
            permissionCount: 15,
            status: '활성' as const,
            registeredBy: '시스템',
            lastModifiedDate: '2025-09-01',
            lastModifiedBy: '시스템'
          },
          {
            id: 2,
            no: 2,
            registrationDate: '2025-09-02',
            code: 'RULE-25-002',
            role: '일반관리자',
            description: '일반 관리 업무 권한',
            userCount: 5,
            permissionCount: 8,
            status: '활성' as const,
            registeredBy: '시스템',
            lastModifiedDate: '2025-09-02',
            lastModifiedBy: '시스템'
          }
        ];
        setRoles(defaultRoles);
        saveToCache(CACHE_KEY, defaultRoles); // 캐시에 저장
        return;
      }

      // 기본 데이터 사용 (테이블이 없는 경우)
      const defaultRoles = [
        {
          id: 1,
          no: 1,
          registrationDate: '2025-09-01',
          code: 'RULE-25-001',
          role: '시스템관리자',
          description: '시스템 전체 관리 권한',
          userCount: 2,
          permissionCount: 15,
          status: '활성' as const,
          registeredBy: '시스템',
          lastModifiedDate: '2025-09-01',
          lastModifiedBy: '시스템'
        },
        {
          id: 2,
          no: 2,
          registrationDate: '2025-09-02',
          code: 'RULE-25-002',
          role: '일반관리자',
          description: '일반 관리 업무 권한',
          userCount: 5,
          permissionCount: 8,
          status: '활성' as const,
          registeredBy: '시스템',
          lastModifiedDate: '2025-09-02',
          lastModifiedBy: '시스템'
        }
      ];
      setRoles(defaultRoles);
      saveToCache(CACHE_KEY, defaultRoles); // 캐시에 저장
    } catch (err: any) {
      console.error('역할 조회 오류:', err);
      setError('역할 데이터 조회 실패');

      // 오류 시 기본 데이터 사용
      const defaultRoles = [
        {
          id: 1,
          no: 1,
          registrationDate: '2025-09-01',
          code: 'RULE-25-001',
          role: '시스템관리자',
          description: '시스템 전체 관리 권한',
          userCount: 2,
          permissionCount: 15,
          status: '활성' as const,
          registeredBy: '시스템',
          lastModifiedDate: '2025-09-01',
          lastModifiedBy: '시스템'
        }
      ];
      setRoles(defaultRoles);
      saveToCache(CACHE_KEY, defaultRoles); // 캐시에 저장
    } finally {
      setLoading(false);
    }
  }, []);

  // 역할 추가
  const addRole = async (newRole: Omit<RoleData, 'id'>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const roleWithId = {
        ...newRole,
        id: Math.max(...roles.map((r) => r.id), 0) + 1
      };

      if (isSupabaseConfigured && supabase) {
        const isConnected = await testSupabaseConnection();
        if (isConnected) {
          const dbData = transformFrontendToDb(roleWithId);
          const { error: insertError } = await supabase.from('admin_usersettings_role').insert([dbData]);

          if (insertError) {
            throw insertError;
          }
          console.log('✅ DB에 역할 추가 성공');
        }
      }

      const updatedRoles = [...roles, roleWithId];
      setRoles(updatedRoles);
      saveToLocalStorage(updatedRoles);
      return true;
    } catch (err: any) {
      console.error('역할 추가 오류:', err);
      setError(`역할 추가 실패: ${err?.message || 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 역할 업데이트
  const updateRole = async (updatedRole: RoleData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured && supabase) {
        const isConnected = await testSupabaseConnection();
        if (isConnected) {
          const dbData = transformFrontendToDb(updatedRole);
          const { error: updateError } = await supabase.from('admin_usersettings_role').update(dbData).eq('id', updatedRole.id);

          if (updateError) {
            throw updateError;
          }
          console.log('✅ DB에서 역할 업데이트 성공');
        }
      }

      const updatedRoles = roles.map((role) => (role.id === updatedRole.id ? updatedRole : role));
      setRoles(updatedRoles);
      saveToLocalStorage(updatedRoles);
      return true;
    } catch (err: any) {
      console.error('역할 업데이트 오류:', err);
      setError(`역할 업데이트 실패: ${err?.message || 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 역할 삭제
  const deleteRole = async (roleId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured && supabase) {
        const isConnected = await testSupabaseConnection();
        if (isConnected) {
          const { error: deleteError } = await supabase.from('admin_usersettings_role').delete().eq('id', roleId);

          if (deleteError) {
            throw deleteError;
          }
          console.log('✅ DB에서 역할 삭제 성공');
        }
      }

      const updatedRoles = roles.filter((role) => role.id !== roleId);
      setRoles(updatedRoles);
      saveToLocalStorage(updatedRoles);
      return true;
    } catch (err: any) {
      console.error('역할 삭제 오류:', err);
      setError(`역할 삭제 실패: ${err?.message || 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 (캐시 우선 전략)
  useEffect(() => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    const cachedData = loadFromCache<RoleData[]>(CACHE_KEY, DEFAULT_CACHE_EXPIRY_MS);
    if (cachedData) {
      setRoles(cachedData);
      setLoading(false);
      console.log('⚡ [Roles] 캐시 데이터 즉시 표시 (깜빡임 방지)');
    }

    // 2. 백그라운드에서 최신 데이터 가져오기 (항상 실행)
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    addRole,
    updateRole,
    deleteRole,
    refreshData: fetchRoles
  };
};
