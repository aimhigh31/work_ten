/**
 * 권한 체크 미들웨어
 *
 * 역할 기반 권한 관리 시스템의 서버 사이드 로직
 * - 사용자의 역할에 따라 메뉴별 권한 확인
 * - 캐싱으로 성능 최적화 (1분 TTL)
 * - API 라우트에서 사용
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'utils/authOptions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ========================================
// 타입 정의
// ========================================

export type PermissionAction = 'read' | 'write' | 'full';

interface PermissionCacheEntry {
  data: {
    can_read: boolean;
    can_write: boolean;
    can_full: boolean;
  };
  timestamp: number;
}

interface PermissionCheckResult {
  hasPermission: boolean;
  roleId: number | null;
  error?: string;
}

// ========================================
// 권한 캐시 (메모리, 1분 TTL)
// ========================================

const permissionCache = new Map<string, PermissionCacheEntry>();
const CACHE_TTL = 60 * 1000; // 1분

/**
 * 캐시 클리어 (테스트용)
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
  console.log('🧹 권한 캐시 클리어됨');
}

// ========================================
// 핵심 권한 체크 함수
// ========================================

/**
 * 사용자의 특정 메뉴에 대한 권한 확인
 *
 * @param roleId - 역할 ID
 * @param menuUrl - 메뉴 URL (예: '/apps/education')
 * @param action - 'read' | 'write' | 'full'
 * @returns boolean - 권한 여부
 *
 * @example
 * const hasPermission = await checkPermission(1, '/apps/education', 'read');
 * if (hasPermission) {
 *   // 권한 있음
 * }
 */
export async function checkPermission(
  roleId: number,
  menuUrl: string,
  action: PermissionAction
): Promise<boolean> {
  try {
    // 캐시 키 생성
    const cacheKey = `${roleId}:${menuUrl}`;
    const cached = permissionCache.get(cacheKey);

    // 캐시 확인 (1분 이내)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`🔍 [권한체크-캐시] roleId=${roleId}, menuUrl=${menuUrl}, action=${action}, cached=true`);
      const permission = cached.data;
      if (action === 'read') return permission.can_read || false;
      if (action === 'write') return permission.can_write || false;
      if (action === 'full') return permission.can_full || false;
    }

    console.log(`🔍 [권한체크-DB] roleId=${roleId}, menuUrl=${menuUrl}, action=${action}`);

    // 1. 메뉴 ID 조회
    const { data: menu, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page')
      .eq('menu_url', menuUrl)
      .single();

    if (menuError || !menu) {
      console.warn(`⚠️ [권한체크] 메뉴를 찾을 수 없음: ${menuUrl}`, menuError?.message);
      return false;
    }

    // 2. 권한 조회
    const { data: permission, error: permError } = await supabase
      .from('admin_users_rules_permissions')
      .select('can_read, can_write, can_full')
      .eq('role_id', roleId)
      .eq('menu_id', menu.id)
      .single();

    if (permError || !permission) {
      console.warn(
        `⚠️ [권한체크] 권한이 설정되지 않음: roleId=${roleId}, menuUrl=${menuUrl}, menuPage=${menu.menu_page}`
      );
      return false;
    }

    // 캐시에 저장
    permissionCache.set(cacheKey, {
      data: permission,
      timestamp: Date.now()
    });

    // 3. 권한 확인
    let hasAccess = false;
    if (action === 'read') hasAccess = permission.can_read || false;
    if (action === 'write') hasAccess = permission.can_write || false;
    if (action === 'full') hasAccess = permission.can_full || false;

    console.log(`✅ [권한체크] roleId=${roleId}, menuUrl=${menuUrl}, action=${action}, result=${hasAccess}`);

    return hasAccess;
  } catch (error) {
    console.error('❌ [권한체크] 오류:', error);
    return false;
  }
}

// ========================================
// NextAuth 세션 관련 함수
// ========================================

/**
 * NextAuth 세션에서 현재 사용자의 역할 ID 가져오기
 *
 * @returns number | null - 역할 ID 또는 null
 */
export async function getCurrentUserRoleId(request?: NextRequest): Promise<number | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.roleId) {
      console.warn('⚠️ [getCurrentUserRoleId] 세션에 roleId 없음');
      return null;
    }

    console.log(`✅ [getCurrentUserRoleId] roleId=${session.user.roleId}, roleName=${session.user.roleName}`);

    return session.user.roleId;
  } catch (error) {
    console.error('❌ [getCurrentUserRoleId] 오류:', error);
    return null;
  }
}

// ========================================
// API 라우트용 래퍼 함수
// ========================================

/**
 * API 라우트용 권한 체크 래퍼
 *
 * 사용법:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const { hasPermission, error } = await requirePermission(
 *     request,
 *     '/apps/education',
 *     'write'
 *   );
 *
 *   if (!hasPermission) {
 *     return NextResponse.json({ error }, { status: 403 });
 *   }
 *
 *   // 권한 있음 - 로직 실행
 * }
 * ```
 *
 * @param request - NextRequest
 * @param menuUrl - 메뉴 URL
 * @param action - 권한 타입
 * @returns { hasPermission: boolean, roleId: number | null, error?: string }
 */
export async function requirePermission(
  request: NextRequest,
  menuUrl: string,
  action: PermissionAction
): Promise<PermissionCheckResult> {
  try {
    // 1. 세션에서 roleId 가져오기
    const roleId = await getCurrentUserRoleId(request);

    if (!roleId) {
      return {
        hasPermission: false,
        roleId: null,
        error: '로그인이 필요합니다.'
      };
    }

    // 2. 권한 확인
    const hasPermission = await checkPermission(roleId, menuUrl, action);

    if (!hasPermission) {
      return {
        hasPermission: false,
        roleId,
        error: `이 작업에 대한 권한이 없습니다. (필요 권한: ${action})`
      };
    }

    return {
      hasPermission: true,
      roleId
    };
  } catch (error: any) {
    console.error('❌ [requirePermission] 오류:', error);
    return {
      hasPermission: false,
      roleId: null,
      error: error.message || '권한 확인 중 오류가 발생했습니다.'
    };
  }
}

// ========================================
// 전체 메뉴 권한 조회 (프론트엔드용)
// ========================================

/**
 * 사용자의 전체 메뉴 권한 조회
 *
 * 프론트엔드에서 한 번에 모든 메뉴 권한을 가져올 때 사용
 *
 * @param roleId - 역할 ID
 * @returns 메뉴별 권한 맵
 *
 * @example
 * const permissions = await getAllMenuPermissions(1);
 * permissions.forEach((perm, menuUrl) => {
 *   console.log(`${menuUrl}: read=${perm.canRead}, write=${perm.canWrite}`);
 * });
 */
export async function getAllMenuPermissions(roleId: number): Promise<Map<string, any>> {
  try {
    console.log(`🔍 [getAllMenuPermissions] roleId=${roleId} 전체 권한 조회 시작`);

    const { data: permissions, error } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        can_read,
        can_write,
        can_full,
        admin_systemsetting_menu (
          menu_url,
          menu_page,
          menu_category
        )
      `)
      .eq('role_id', roleId);

    if (error) {
      console.error('❌ [getAllMenuPermissions] 조회 실패:', error);
      return new Map();
    }

    const permissionMap = new Map();

    for (const perm of permissions || []) {
      const menuUrl = perm.admin_systemsetting_menu?.menu_url;
      if (menuUrl) {
        permissionMap.set(menuUrl, {
          canRead: perm.can_read,
          canWrite: perm.can_write,
          canFull: perm.can_full,
          menuPage: perm.admin_systemsetting_menu?.menu_page,
          menuCategory: perm.admin_systemsetting_menu?.menu_category
        });
      }
    }

    console.log(`✅ [getAllMenuPermissions] roleId=${roleId}: ${permissionMap.size}개 메뉴 권한 로드 완료`);

    return permissionMap;
  } catch (error) {
    console.error('❌ [getAllMenuPermissions] 오류:', error);
    return new Map();
  }
}
