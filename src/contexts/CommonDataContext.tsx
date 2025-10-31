'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';
import { UserProfile } from 'hooks/useSupabaseUserManagement';
import { useSupabaseDepartmentManagement, Department } from 'hooks/useSupabaseDepartmentManagement';
import { useSupabaseMasterCode3, MasterCodeFlat } from 'hooks/useSupabaseMasterCode3';
import { cleanupExpiredCache, clearCache } from 'utils/cacheUtils';

// 🏪 공용 데이터 타입 정의
interface CommonData {
  users: UserProfile[];
  departments: Department[];
  masterCodes: MasterCodeFlat[];
  isLoading: boolean;
  error: string | null;
  refreshCommonData: () => Promise<void>;
  getSubCodesByGroup: (groupCode: string) => Array<{
    id: number;
    group_code: string;
    subcode: string;
    subcode_name: string;
    subcode_description?: string;
    subcode_status: 'active' | 'inactive';
    subcode_remark?: string;
    subcode_order: number;
  }>;
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
  const { users: usersFromHook, refreshUsers } = useSupabaseUsers();
  const { getDepartments } = useSupabaseDepartmentManagement();
  const { getAllMasterCodes, processAllData } = useSupabaseMasterCode3();


  // 공용 데이터 상태
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [masterCodes, setMasterCodes] = useState<MasterCodeFlat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🍽️ 공용 데이터 로딩 함수 (레스토랑 오픈 전 준비)
  const loadCommonData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ users도 직접 fetch (부서관리와 동일한 패턴)
      await refreshUsers(); // 즉시 최신 사용자 데이터 가져오기

      // 🍽️ 부서 및 마스터코드 데이터 동시 로딩
      const [deptsData, codesData] = await Promise.all([
        getDepartments(),
        getAllMasterCodes()
      ]);

      // 공용 창고에 저장
      setDepartments(deptsData);
      setMasterCodes(codesData);
      processAllData(codesData); // MasterCode3 내부 상태도 업데이트
    } catch (err) {
      console.error('❌ 공용 데이터 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '공용 데이터 로딩 실패');
    } finally {
      setIsLoading(false);
    }
  }, [getDepartments, getAllMasterCodes, processAllData, refreshUsers, usersFromHook.length]);

  // 🔄 강제 새로고침 함수 (캐시 삭제 후 재로딩)
  const forceRefreshCommonData = useCallback(async () => {
    console.log('🔄 [CommonData] 강제 새로고침 시작 - 캐시 삭제');

    try {
      setIsLoading(true);
      setError(null);

      // 모든 캐시 삭제
      clearCache('nexwork_cache_v2_mastercode3_data');
      clearCache('nexwork_cache_v2_users_data');
      clearCache('nexwork_cache_v2_department_management_data');

      // ✅ users 즉시 최신 데이터 가져오기
      await refreshUsers();

      // 🍽️ 부서 및 마스터코드 데이터 동시 로딩 (skipCache=true로 캐시 우회)
      const [deptsData, codesData] = await Promise.all([
        getDepartments(),
        getAllMasterCodes(true) // 🔥 캐시 완전 우회
      ]);

      // 공용 창고에 저장
      setDepartments(deptsData);
      setMasterCodes(codesData);
      processAllData(codesData); // MasterCode3 내부 상태도 업데이트

      console.log('✅ [CommonData] 강제 새로고침 완료');
    } catch (err) {
      console.error('❌ 강제 새로고침 실패:', err);
      setError(err instanceof Error ? err.message : '강제 새로고침 실패');
    } finally {
      setIsLoading(false);
    }
  }, [getDepartments, getAllMasterCodes, processAllData, refreshUsers]);

  // 🍽️ usersFromHook 변경 시 users 상태 자동 업데이트
  useEffect(() => {
    if (usersFromHook.length > 0) {
      setUsers(usersFromHook);
    }
  }, [usersFromHook]);

  // 🍽️ 레스토랑 오픈 시 한 번만 실행 (앱 시작 시)
  useEffect(() => {
    // 🧹 만료된 캐시 정리 (앱 시작 시)
    cleanupExpiredCache();

    // 🏪 공용 데이터 로드
    loadCommonData();
  }, [loadCommonData]);

  // 특정 그룹의 서브코드만 가져오기
  const getSubCodesByGroup = useCallback((groupCode: string) => {
    return masterCodes
      .filter((item) => item.codetype === 'subcode' && item.group_code === groupCode)
      .map((item) => ({
        id: item.id,
        group_code: item.group_code,
        subcode: item.subcode,
        subcode_name: item.subcode_name,
        subcode_description: item.subcode_description,
        subcode_status: item.subcode_status,
        subcode_remark: item.subcode_remark,
        subcode_order: item.subcode_order
      }))
      .sort((a, b) => a.subcode_order - b.subcode_order);
  }, [masterCodes]);

  // Context 값
  const value: CommonData = {
    users,
    departments,
    masterCodes,
    isLoading,
    error,
    refreshCommonData: forceRefreshCommonData,
    getSubCodesByGroup
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
