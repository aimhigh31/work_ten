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

export type PermissionAction =
  | 'read' | 'write' | 'full'  // 기존 3개 (하위 호환성)
  | 'viewCategory'             // 카테고리 보기
  | 'readData'                 // 데이터 조회
  | 'createData'               // 데이터 새로쓰기
  | 'editOwn'                  // 나의 데이터 편집
  | 'editOthers';              // 타인 데이터 편집

interface PermissionCacheEntry {
  data: {
    // 기존 3개 (하위 호환성)
    can_read: boolean;
    can_write: boolean;
    can_full: boolean;
    // 새로운 필드
    can_view_category: boolean;
    can_read_data: boolean;
    can_manage_own: boolean; // ✅ 통합된 필드 (can_create_data + can_edit_own)
    can_edit_others: boolean;
  };
  timestamp: number;
}

interface PermissionCheckResult {
  hasPermission: boolean;
  roleCodes: string[];
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
      // 기존 3개 (하위 호환성)
      if (action === 'read') return permission.can_read || false;
      if (action === 'write') return permission.can_write || false;
      if (action === 'full') return permission.can_full || false;
      // 새로운 필드
      if (action === 'viewCategory') return permission.can_view_category || false;
      if (action === 'readData') return permission.can_read_data || false;
      // ✅ createData와 editOwn은 통합된 can_manage_own 사용
      if (action === 'createData') return permission.can_manage_own || false;
      if (action === 'editOwn') return permission.can_manage_own || false;
      if (action === 'editOthers') return permission.can_edit_others || false;
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
      .select('can_read, can_write, can_full, can_view_category, can_read_data, can_manage_own, can_edit_others')
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
    // 기존 3개 (하위 호환성)
    if (action === 'read') hasAccess = permission.can_read || false;
    if (action === 'write') hasAccess = permission.can_write || false;
    if (action === 'full') hasAccess = permission.can_full || false;
    // 새로운 필드
    if (action === 'viewCategory') hasAccess = permission.can_view_category || false;
    if (action === 'readData') hasAccess = permission.can_read_data || false;
    // ✅ createData와 editOwn은 통합된 can_manage_own 사용
    if (action === 'createData') hasAccess = permission.can_manage_own || false;
    if (action === 'editOwn') hasAccess = permission.can_manage_own || false;
    if (action === 'editOthers') hasAccess = permission.can_edit_others || false;

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
 * NextAuth 세션에서 현재 사용자의 역할 코드 배열 가져오기
 *
 * @returns string[] - 역할 코드 배열 (예: ["ROLE-25-001", "ROLE-25-002"])
 */
export async function getCurrentUserRoleCodes(request?: NextRequest): Promise<string[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.warn('⚠️ [getCurrentUserRoleCodes] 세션 없음');
      return [];
    }

    // 세션에 assignedRoles가 있으면 바로 반환
    if (session.user.assignedRoles && Array.isArray(session.user.assignedRoles)) {
      console.log(`✅ [getCurrentUserRoleCodes] 세션에서 역할 코드=${session.user.assignedRoles.join(', ')}`);
      return session.user.assignedRoles;
    }

    // 세션에 assignedRoles가 없으면 DB에서 조회 (하위 호환성)
    console.warn('⚠️ [getCurrentUserRoleCodes] 세션에 assignedRoles 없음 - DB에서 조회');

    if (!session.user.email) {
      console.warn('⚠️ [getCurrentUserRoleCodes] 세션에 이메일 없음');
      return [];
    }

    const { data: user, error } = await supabase
      .from('admin_users_userprofiles')
      .select('assigned_roles')
      .eq('email', session.user.email)
      .single();

    if (error || !user) {
      console.error('❌ [getCurrentUserRoleCodes] DB 조회 실패:', error);
      return [];
    }

    // assigned_roles 파싱
    let assignedRoles: string[] = [];
    try {
      if (user.assigned_roles) {
        if (Array.isArray(user.assigned_roles)) {
          assignedRoles = user.assigned_roles;
        } else if (typeof user.assigned_roles === 'string') {
          assignedRoles = JSON.parse(user.assigned_roles);
        }
      }
    } catch (parseError) {
      console.error('❌ [getCurrentUserRoleCodes] assigned_roles 파싱 실패:', parseError);
      return [];
    }

    console.log(`✅ [getCurrentUserRoleCodes] DB에서 역할 코드=${assignedRoles.join(', ')} 조회 성공`);
    return assignedRoles;
  } catch (error) {
    console.error('❌ [getCurrentUserRoleCodes] 오류:', error);
    return [];
  }
}

// ========================================
// API 라우트용 래퍼 함수
// ========================================

/**
 * API 라우트용 권한 체크 래퍼
 *
 * 사용자가 가진 모든 역할을 체크하여 하나라도 권한이 있으면 허용
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
 * @returns { hasPermission: boolean, roleCodes: string[], error?: string }
 */
export async function requirePermission(
  request: NextRequest,
  menuUrl: string,
  action: PermissionAction
): Promise<PermissionCheckResult> {
  try {
    // 1. 세션에서 역할 코드들 가져오기
    const roleCodes = await getCurrentUserRoleCodes(request);

    if (!roleCodes || roleCodes.length === 0) {
      return {
        hasPermission: false,
        roleCodes: [],
        error: '로그인이 필요하거나 역할이 할당되지 않았습니다.'
      };
    }

    console.log(`🔍 [requirePermission] 사용자 역할: ${roleCodes.join(', ')}`);

    // 2. 역할 코드들로 역할 ID 조회
    const { data: roles, error: rolesError } = await supabase
      .from('admin_users_rules')
      .select('id, role_code')
      .in('role_code', roleCodes)
      .eq('is_active', true);

    if (rolesError || !roles || roles.length === 0) {
      console.error('❌ [requirePermission] 역할 조회 실패:', rolesError);
      return {
        hasPermission: false,
        roleCodes,
        error: '유효한 역할을 찾을 수 없습니다.'
      };
    }

    console.log(`✅ [requirePermission] ${roles.length}개 역할 조회됨`);

    // 3. 각 역할에 대해 권한 확인 (OR 조건 - 하나라도 권한 있으면 true)
    for (const role of roles) {
      const hasPermission = await checkPermission(role.id, menuUrl, action);
      if (hasPermission) {
        console.log(`✅ [requirePermission] 역할 ${role.role_code}로 권한 있음`);
        return {
          hasPermission: true,
          roleCodes
        };
      }
    }

    // 모든 역할에 권한 없음
    console.warn(`⚠️ [requirePermission] 모든 역할에 권한 없음: ${roleCodes.join(', ')}`);
    return {
      hasPermission: false,
      roleCodes,
      error: `이 작업에 대한 권한이 없습니다. (필요 권한: ${action})`
    };
  } catch (error: any) {
    console.error('❌ [requirePermission] 오류:', error);
    return {
      hasPermission: false,
      roleCodes: [],
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
 * 사용자가 가진 모든 역할의 권한을 합쳐서 반환 (OR 조건)
 *
 * @param roleCodes - 역할 코드 배열
 * @returns 메뉴별 권한 맵
 *
 * @example
 * const permissions = await getAllMenuPermissions(["ROLE-25-001", "ROLE-25-002"]);
 * permissions.forEach((perm, menuId) => {
 *   console.log(`menuId=${menuId}: read=${perm.canRead}, write=${perm.canWrite}`);
 * });
 */
export async function getAllMenuPermissions(roleCodes: string[]): Promise<Map<string, any>> {
  try {
    if (!roleCodes || roleCodes.length === 0) {
      console.warn('⚠️ [getAllMenuPermissions] 역할 코드 없음');
      return new Map();
    }

    console.log(`🔍 [getAllMenuPermissions] 역할 코드=${roleCodes.join(', ')} 전체 권한 조회 시작`);

    // 1. 역할 코드들로 역할 ID 조회
    const { data: roles, error: rolesError } = await supabase
      .from('admin_users_rules')
      .select('id, role_code')
      .in('role_code', roleCodes)
      .eq('is_active', true);

    if (rolesError || !roles || roles.length === 0) {
      console.error('❌ [getAllMenuPermissions] 역할 조회 실패:', rolesError);
      return new Map();
    }

    const roleIds = roles.map(r => r.id);
    console.log(`✅ [getAllMenuPermissions] ${roleIds.length}개 역할 ID 조회: ${roleIds.join(', ')}`);

    // 2. 모든 역할의 권한 조회
    const { data: permissions, error } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        menu_id,
        can_read,
        can_write,
        can_full,
        can_view_category,
        can_read_data,
        can_manage_own,
        can_edit_others,
        admin_systemsetting_menu (
          menu_url,
          menu_page,
          menu_category
        )
      `)
      .in('role_id', roleIds);

    if (error) {
      console.error('❌ [getAllMenuPermissions] 조회 실패:', error);
      return new Map();
    }

    // 3. 메뉴별로 권한 병합 (OR 조건 - 하나라도 true면 true)
    const permissionMap = new Map();

    for (const perm of permissions || []) {
      const menuId = perm.menu_id;
      if (!menuId) continue;

      const existing = permissionMap.get(menuId);

      if (existing) {
        // 기존 권한과 병합 (OR 조건)
        permissionMap.set(menuId, {
          menuId: menuId,
          menuUrl: perm.admin_systemsetting_menu?.menu_url || existing.menuUrl,
          // 기존 3개 (하위 호환성) - OR 조건
          canRead: existing.canRead || perm.can_read,
          canWrite: existing.canWrite || perm.can_write,
          canFull: existing.canFull || perm.can_full,
          // 새로운 필드 - OR 조건
          canViewCategory: existing.canViewCategory || perm.can_view_category,
          canReadData: existing.canReadData || perm.can_read_data,
          canCreateData: existing.canCreateData || perm.can_manage_own,
          canEditOwn: existing.canEditOwn || perm.can_manage_own,
          canEditOthers: existing.canEditOthers || perm.can_edit_others,
          // 메뉴 정보
          menuPage: perm.admin_systemsetting_menu?.menu_page || existing.menuPage,
          menuCategory: perm.admin_systemsetting_menu?.menu_category || existing.menuCategory
        });
      } else {
        // 새 권한 추가
        permissionMap.set(menuId, {
          menuId: menuId,
          menuUrl: perm.admin_systemsetting_menu?.menu_url,
          // 기존 3개 (하위 호환성)
          canRead: perm.can_read,
          canWrite: perm.can_write,
          canFull: perm.can_full,
          // 새로운 필드
          canViewCategory: perm.can_view_category,
          canReadData: perm.can_read_data,
          canCreateData: perm.can_manage_own,
          canEditOwn: perm.can_manage_own,
          canEditOthers: perm.can_edit_others,
          // 메뉴 정보
          menuPage: perm.admin_systemsetting_menu?.menu_page,
          menuCategory: perm.admin_systemsetting_menu?.menu_category
        });
      }
    }

    console.log(`✅ [getAllMenuPermissions] 역할 코드=${roleCodes.join(', ')}: ${permissionMap.size}개 메뉴 권한 로드 완료`);

    return permissionMap;
  } catch (error) {
    console.error('❌ [getAllMenuPermissions] 오류:', error);
    return new Map();
  }
}
