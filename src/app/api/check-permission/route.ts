/**
 * 권한 조회 API
 *
 * 프론트엔드에서 현재 사용자의 전체 메뉴 권한을 조회할 때 사용
 * usePermissions 훅이 이 API를 호출함
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'utils/authOptions';
import { getAllMenuPermissions, getCurrentUserRoleCodes } from 'lib/authMiddleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * GET: 현재 사용자의 전체 메뉴 권한 조회
 *
 * 응답 예시:
 * {
 *   success: true,
 *   roleCodes: ["ROLE-25-001", "ROLE-25-002"],
 *   permissions: {
 *     "/apps/education": {
 *       // 기존 3개 필드 (하위 호환성)
 *       canRead: true,
 *       canWrite: true,
 *       canFull: true,
 *       // 새로운 5개 필드 (세밀한 권한 제어)
 *       canViewCategory: true,
 *       canReadData: true,
 *       canCreateData: true,
 *       canEditOwn: true,
 *       canEditOthers: true,
 *       // 메뉴 정보
 *       menuPage: "개인교육관리",
 *       menuCategory: "메인메뉴"
 *     },
 *     ...
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [check-permission API] 권한 조회 요청');

    // 1. 세션 확인
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.warn('⚠️ [check-permission API] 세션 없음');
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.'
        },
        { status: 401 }
      );
    }

    // 2. assignedRoles 가져오기 (세션 또는 DB)
    let roleCodes = session.user.assignedRoles || [];

    if (!roleCodes || roleCodes.length === 0) {
      console.warn('⚠️ [check-permission API] 세션에 assignedRoles 없음 - DB에서 조회');

      // DB에서 assignedRoles 조회
      roleCodes = await getCurrentUserRoleCodes(request);

      if (!roleCodes || roleCodes.length === 0) {
        console.error('❌ [check-permission API] DB에서도 assignedRoles 조회 실패');
        return NextResponse.json(
          {
            success: false,
            error: '사용자 역할 정보를 찾을 수 없습니다.'
          },
          { status: 401 }
        );
      }

      console.log(`✅ [check-permission API] DB에서 조회: roleCodes=${roleCodes.join(', ')}`);
    }

    console.log(`✅ [check-permission API] 사용자 확인: roleCodes=${roleCodes.join(', ')}`);

    // 3. 전체 메뉴 권한 조회 (모든 역할의 권한을 OR 조건으로 병합)
    console.log(`🔄 [check-permission API] getAllMenuPermissions 호출 시작...`);
    const permissionMap = await getAllMenuPermissions(roleCodes);
    console.log(`📊 [check-permission API] Map 결과:`, {
      type: permissionMap.constructor.name,
      size: permissionMap.size,
      keys: Array.from(permissionMap.keys()).slice(0, 5)
    });

    // Map을 객체로 변환
    const permissions: Record<string, any> = {};
    permissionMap.forEach((value, key) => {
      permissions[key] = value;
    });

    console.log(`✅ [check-permission API] 응답 전송:`, {
      permissionsCount: Object.keys(permissions).length,
      permissionsKeys: Object.keys(permissions).slice(0, 10)
    });

    return NextResponse.json({
      success: true,
      roleCodes: roleCodes,
      roleId: null, // ✅ 하위 호환성을 위해 null로 유지
      roleName: roleCodes.length > 0 ? roleCodes.join(', ') : '역할 미지정', // ✅ 하위 호환성
      permissions
    });
  } catch (error: any) {
    console.error('❌ [check-permission API] 권한 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '권한 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
