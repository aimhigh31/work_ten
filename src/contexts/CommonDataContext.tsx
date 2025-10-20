'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';
import { UserProfile } from 'hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement, Department } from 'hooks/useSupabaseDepartmentManagement';
import { useSupabaseMasterCode3, MasterCodeFlat } from 'hooks/useSupabaseMasterCode3';
import { cleanupExpiredCache } from 'utils/cacheUtils';

// 🏪 공용 데이터 타입 정의
interface CommonData {
  users: UserProfile[];
  departments: Department[];
  masterCodes: MasterCodeFlat[];
  isLoading: boolean;
  error: string | null;
  refreshCommonData: () => Promise<void>;
}

// Context 생성
const CommonDataContext = createContext<CommonData | undefined>(undefined);

// Provider Props
interface CommonDataProviderProps {
  children: ReactNode;
}

/**
 * 🏪 CommonDataProvider - 공용 재료 창고
 *
 * 레스토랑 오픈 시 공용 창고에 미리 재료를 채워두고,
 * 모든 요리사(페이지)가 이 창고에서 재료를 가져다 씁니다.
 *
 * 효과:
 * - 각 페이지마다 users, departments, masterCodes를 개별 로딩 ❌
 * - 앱 시작 시 한 번만 로딩 ✅
 * - 모든 페이지에서 즉시 사용 가능 ⚡
 */
export function CommonDataProvider({ children }: CommonDataProviderProps) {
  // Auto-loading 패턴으로 변경
  const { users: usersFromHook } = useSupabaseUsers();
  const { getDepartments } = useSupabaseDepartmentManagement();
  const { getAllMasterCodes, processAllData } = useSupabaseMasterCode3();

  // 🔍 디버깅: useSupabaseUsers에서 받은 데이터 확인
  React.useEffect(() => {
    console.log('🔍 [CommonDataContext] useSupabaseUsers에서 받은 users:', usersFromHook.length);
    if (usersFromHook.length > 0) {
      console.log('🔍 [CommonDataContext] 첫 번째 user 샘플:', {
        user_name: usersFromHook[0].user_name,
        user_account_id: usersFromHook[0].user_account_id,
        department: usersFromHook[0].department,
        position: usersFromHook[0].position,
        role: usersFromHook[0].role,
        phone: usersFromHook[0].phone,
        country: usersFromHook[0].country,
        address: usersFromHook[0].address,
        email: usersFromHook[0].email,
        avatar_url: usersFromHook[0].avatar_url,
        profile_image_url: usersFromHook[0].profile_image_url
      });
    }
  }, [usersFromHook]);

  // 공용 데이터 상태
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [masterCodes, setMasterCodes] = useState<MasterCodeFlat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🍽️ 공용 데이터 로딩 함수 (레스토랑 오픈 전 준비)
  const loadCommonData = useCallback(async () => {
    try {
      const startTime = performance.now();
      console.log('🏪 ========================================');
      console.log('🏪 공용 창고 준비 시작 (CommonData Loading)');
      console.log('🏪 시작 시각:', new Date().toISOString());
      console.log('🏪 ========================================');

      setIsLoading(true);
      setError(null);

      // 🍽️ 2명의 요리사가 동시에 공용 재료 준비! (users는 hook에서 자동 로딩)
      const t1 = performance.now();
      const [deptsData, codesData] = await Promise.all([
        getDepartments(), // 요리사 A: 부서 데이터
        getAllMasterCodes() // 요리사 B: 마스터코드 데이터
      ]);
      const t2 = performance.now();

      console.log(`⚡ 데이터 fetch 완료: ${(t2 - t1).toFixed(2)}ms`);

      // 공용 창고에 저장
      const t3 = performance.now();
      setUsers(usersFromHook); // hook에서 자동 로딩된 users 사용
      setDepartments(deptsData);
      setMasterCodes(codesData);
      processAllData(codesData); // MasterCode3 내부 상태도 업데이트
      const t4 = performance.now();

      console.log(`⚡ 상태 업데이트 완료: ${(t4 - t3).toFixed(2)}ms`);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('✅ 공용 창고 준비 완료!', {
        users: usersFromHook.length,
        departments: deptsData.length,
        masterCodes: codesData.length,
        총_소요시간: `${totalTime.toFixed(2)}ms`,
        fetch시간: `${(t2 - t1).toFixed(2)}ms`,
        상태업데이트: `${(t4 - t3).toFixed(2)}ms`
      });
      console.log('🏪 ========================================');
    } catch (err) {
      console.error('❌ 공용 데이터 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '공용 데이터 로딩 실패');
    } finally {
      setIsLoading(false);
    }
  }, [usersFromHook, getDepartments, getAllMasterCodes, processAllData]);

  // 🍽️ 레스토랑 오픈 시 한 번만 실행 (앱 시작 시)
  useEffect(() => {
    // 🧹 만료된 캐시 정리 (앱 시작 시)
    cleanupExpiredCache();

    // 🏪 공용 데이터 로드
    loadCommonData();
  }, [loadCommonData]);

  // Context 값
  const value: CommonData = {
    users,
    departments,
    masterCodes,
    isLoading,
    error,
    refreshCommonData: loadCommonData
  };

  return <CommonDataContext.Provider value={value}>{children}</CommonDataContext.Provider>;
}

/**
 * 🍽️ useCommonData - 공용 창고에서 재료 가져오기
 *
 * 각 페이지(요리사)에서 이 hook을 사용하면
 * 공용 창고에서 즉시 데이터를 가져올 수 있습니다.
 *
 * 사용 예시:
 * ```tsx
 * const { users, departments, masterCodes, isLoading } = useCommonData();
 * ```
 */
export function useCommonData() {
  const context = useContext(CommonDataContext);

  if (context === undefined) {
    throw new Error('useCommonData는 CommonDataProvider 내부에서만 사용할 수 있습니다.');
  }

  return context;
}
