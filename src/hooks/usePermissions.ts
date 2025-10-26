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
  canRead: boolean;
  canWrite: boolean;
  canFull: boolean;
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
    if (status === 'loading') {
      setState((prev) => ({ ...prev, loading: true }));
      return;
    }

    if (status === 'unauthenticated' || !session) {
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

    async function fetchPermissions() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch('/api/check-permission');

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

        if (!result.success) {
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
    return (
      state.permissions[menuUrl] || {
        canRead: false,
        canWrite: false,
        canFull: false
      }
    );
  };

  /**
   * 특정 액션 권한 확인
   *
   * @param menuUrl - 메뉴 URL
   * @param action - 'read' | 'write' | 'full'
   * @returns boolean - 권한 여부
   *
   * @example
   * const canEdit = hasPermission('/apps/education', 'write');
   * if (canEdit) {
   *   // 편집 버튼 표시
   * }
   */
  const hasPermission = (menuUrl: string, action: 'read' | 'write' | 'full'): boolean => {
    const permission = getPermissionForMenu(menuUrl);
    if (action === 'read') return permission.canRead;
    if (action === 'write') return permission.canWrite;
    if (action === 'full') return permission.canFull;
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
   */
  const hasAnyPermission = (menuUrl: string, actions: Array<'read' | 'write' | 'full'>): boolean => {
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
  const permission = permissions[menuUrl] || {
    canRead: false,
    canWrite: false,
    canFull: false
  };

  return {
    ...permission,
    loading,
    error
  };
}
