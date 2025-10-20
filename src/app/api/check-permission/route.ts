/**
 * 권한 조회 API
 *
 * 프론트엔드에서 현재 사용자의 전체 메뉴 권한을 조회할 때 사용
 * usePermissions 훅이 이 API를 호출함
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'utils/authOptions';
import { getAllMenuPermissions } from 'lib/authMiddleware';

/**
 * GET: 현재 사용자의 전체 메뉴 권한 조회
 *
 * 응답 예시:
 * {
 *   success: true,
 *   roleId: 1,
 *   roleName: "시스템관리자",
 *   permissions: {
 *     "/apps/education": {
 *       canRead: true,
 *       canWrite: true,
 *       canFull: true,
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

    if (!session?.user?.roleId) {
      console.warn('⚠️ [check-permission API] 세션 없음 또는 roleId 없음');
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.'
        },
        { status: 401 }
      );
    }

    const { roleId, roleName } = session.user;

    console.log(`✅ [check-permission API] 사용자 확인: roleId=${roleId}, roleName=${roleName}`);

    // 2. 전체 메뉴 권한 조회
    const permissionMap = await getAllMenuPermissions(roleId);

    // Map을 객체로 변환
    const permissions: Record<string, any> = {};
    permissionMap.forEach((value, key) => {
      permissions[key] = value;
    });

    console.log(`✅ [check-permission API] 응답 전송: ${Object.keys(permissions).length}개 메뉴 권한`);

    return NextResponse.json({
      success: true,
      roleId,
      roleName,
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
