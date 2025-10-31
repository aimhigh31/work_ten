/**
 * 권한 관리 훅
 *
 * 프론트엔드에서 사용자의 메뉴별 권한을 확인하는 훅
 * - 세션에서 role 정보를 가져와 권한 API 호출
 * - 메뉴 URL별로 read/write/full 권한 확인
 * - 컴포넌트에서 버튼 표시 여부 제어
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// ========================================
// 타입 정의
// ========================================

interface Permission {
  // 기존 3개 필드 (하위 호환성)
  canRead: boolean;
  canWrite: boolean;
  canFull: boolean;
  // 새로운 5개 필드 (세밀한 권한 제어)
  canViewCategory: boolean;
  canReadData: boolean;
  canCreateData: boolean;
  canEditOwn: boolean;
  canEditOthers: boolean;
  // 메뉴 정보
  menuPage?: string;
  menuCategory?: string;
}

interface PermissionsState {
  loading: boolean;
  error: string | null;
  roleId: number | null;
  roleName: string | null;
  permissions: Record<string, Permission>;
}

// ========================================
// usePermissions 훅 (전체 권한 조회)
// ========================================

/**
 * 현재 사용자의 전체 메뉴 권한을 가져오는 훅
 *
 * @returns PermissionsState & 유틸리티 함수들
 *
 * @example
 * const { permissions, hasPermission, loading } = usePermissions();
 *
 * if (loading) return <LoadingSpinner />;
 *
 * if (hasPermission('/apps/education', 'write')) {
 *   return <Button>추가</Button>;
 * }
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<PermissionsState>({
    loading: true,
    error: null,
    roleId: null,
    roleName: null,
    permissions: {}
  });

  useEffect(() => {
    console.log('🔍 [usePermissions] useEffect 실행:', { status, hasSession: !!session });

    if (status === 'loading') {
      console.log('⏳ [usePermissions] 세션 로딩 중...');
      setState((prev) => ({ ...prev, loading: true }));
      return;
    }

    if (status === 'unauthenticated' || !session) {
      console.log('⚠️ [usePermissions] 인증되지 않은 상태 또는 세션 없음:', { status, hasSession: !!session });
      setState({
        loading: false,
        error: null, // ✅ 로그인 전에는 에러로 표시하지 않음
        roleId: null,
        roleName: null,
        permissions: {}
      });
      return;
    }

    // ✅ 세션은 있지만 인증 상태가 불명확한 경우 대기
    if (status !== 'authenticated') {
      console.log('⏳ [usePermissions] 세션 인증 대기 중...', status);
      return;
    }

    console.log('✅ [usePermissions] 인증 완료, 권한 조회 시작');

    async function fetchPermissions() {
      try {
        console.log('🌐 [usePermissions] API 호출 시작: /api/check-permission');
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch('/api/check-permission');
        console.log('📡 [usePermissions] API 응답 받음:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText
        });

        // ✅ 응답 상태 체크 추가
        if (!response || !response.ok) {
          // 401은 인증 오류 (정상적인 로그아웃 상태일 수 있음)
          if (response?.status === 401) {
            console.log('⚠️ [usePermissions] 인증되지 않은 상태입니다.');
            setState({
              loading: false,
              error: null, // 에러로 표시하지 않음
              roleId: null,
              roleName: null,
              permissions: {}
            });
          } else {
            console.error('❌ [usePermissions] API 응답 실패:', response?.status);
            setState((prev) => ({
              ...prev,
              loading: false,
              error: `권한 조회 실패 (${response?.status || 'Network Error'})`
            }));
          }
          return;
        }

        const result = await response.json();
        console.log('📦 [usePermissions] API 응답 데이터:', {
          success: result.success,
          roleId: result.roleId,
          roleName: result.roleName,
          permissionsCount: Object.keys(result.permissions || {}).length,
          permissionsKeys: Object.keys(result.permissions || {}).slice(0, 10)
        });

        if (!result.success) {
          console.error('❌ [usePermissions] API 응답 success=false:', result.error);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: result.error || '권한 조회 실패'
          }));
          return;
        }

        setState({
          loading: false,
          error: null,
          roleId: result.roleId,
          roleName: result.roleName,
          permissions: result.permissions || {}
        });

        console.log('✅ [usePermissions] 권한 로드 완료:', {
          roleId: result.roleId,
          roleName: result.roleName,
          menuCount: Object.keys(result.permissions || {}).length
        });
      } catch (error: any) {
        console.error('❌ [usePermissions] 권한 조회 실패:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || '권한 조회 중 오류 발생'
        }));
      }
    }

    fetchPermissions();
  }, [session, status]);

  /**
   * 특정 메뉴 URL의 권한 확인
   *
   * @param menuUrl - 메뉴 URL (예: '/apps/education')
   * @returns Permission 객체
   */
  const getPermissionForMenu = (menuUrl: string): Permission => {
    // permissions 객체가 menuId를 키로 사용하므로, URL로 찾기
    const permissionArray = Object.values(state.permissions);
    const found = permissionArray.find((p: any) => p.menuUrl === menuUrl);

    return (
      found || {
        // 기존 3개 필드 (하위 호환성)
        canRead: false,
        canWrite: false,
        canFull: false,
        // 새로운 5개 필드
        canViewCategory: false,
        canReadData: false,
        canCreateData: false,
        canEditOwn: false,
        canEditOthers: false
      }
    );
  };

  /**
   * 특정 액션 권한 확인
   *
   * @param menuUrl - 메뉴 URL
   * @param action - 'read' | 'write' | 'full' | 'viewCategory' | 'readData' | 'createData' | 'editOwn' | 'editOthers'
   * @returns boolean - 권한 여부
   *
   * @example
   * const canEdit = hasPermission('/apps/education', 'write');
   * const canEditOwn = hasPermission('/apps/education', 'editOwn');
   * if (canEdit || canEditOwn) {
   *   // 편집 버튼 표시
   * }
   */
  const hasPermission = (
    menuUrl: string,
    action: 'read' | 'write' | 'full' | 'viewCategory' | 'readData' | 'createData' | 'editOwn' | 'editOthers'
  ): boolean => {
    const permission = getPermissionForMenu(menuUrl);
    // 기존 3개 (하위 호환성)
    if (action === 'read') return permission.canRead;
    if (action === 'write') return permission.canWrite;
    if (action === 'full') return permission.canFull;
    // 새로운 5개
    if (action === 'viewCategory') return permission.canViewCategory;
    if (action === 'readData') return permission.canReadData;
    if (action === 'createData') return permission.canCreateData;
    if (action === 'editOwn') return permission.canEditOwn;
    if (action === 'editOthers') return permission.canEditOthers;
    return false;
  };

  /**
   * 여러 액션 중 하나라도 권한 있는지 확인
   *
   * @param menuUrl - 메뉴 URL
   * @param actions - 권한 배열
   * @returns boolean - 하나라도 권한이 있으면 true
   *
   * @example
   * const canAccess = hasAnyPermission('/apps/education', ['read', 'write']);
   * const canEditAny = hasAnyPermission('/apps/education', ['editOwn', 'editOthers']);
   */
  const hasAnyPermission = (
    menuUrl: string,
    actions: Array<'read' | 'write' | 'full' | 'viewCategory' | 'readData' | 'createData' | 'editOwn' | 'editOthers'>
  ): boolean => {
    return actions.some((action) => hasPermission(menuUrl, action));
  };

  return {
    ...state,
    getPermissionForMenu,
    hasPermission,
    hasAnyPermission
  };
}

// ========================================
// useMenuPermission 훅 (특정 메뉴 권한만 조회)
// ========================================

/**
 * 특정 메뉴의 권한만 가져오는 경량 훅
 *
 * @param menuUrl - 메뉴 URL
 * @returns Permission & { loading, error }
 *
 * @example
 * const { canRead, canWrite, canFull, loading } = useMenuPermission('/apps/education');
 *
 * return (
 *   <>
 *     {canWrite && <Button>추가</Button>}
 *     {canFull && <Button>삭제</Button>}
 *   </>
 * );
 */
export function useMenuPermission(menuUrl: string) {
  const { permissions, loading, error } = usePermissions();

  // permissions 객체가 menuId를 키로 사용하므로, URL로 찾기
  const permissionArray = Object.values(permissions);
  const found = permissionArray.find((p: any) => p.menuUrl === menuUrl);

  const permission = found || {
    // 기존 3개 필드 (하위 호환성)
    canRead: false,
    canWrite: false,
    canFull: false,
    // 새로운 5개 필드
    canViewCategory: false,
    canReadData: false,
    canCreateData: false,
    canEditOwn: false,
    canEditOthers: false
  };

  return {
    ...permission,
    loading,
    error
  };
}
