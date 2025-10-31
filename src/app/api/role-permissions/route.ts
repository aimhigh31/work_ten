import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requirePermission } from 'lib/authMiddleware'; // ✅ 추가

// Supabase 클라이언트 (Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET: 역할별 권한 조회
export async function GET(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (사용자설정 페이지에서도 접근 가능하도록 user-settings 권한 사용)
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'read');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleCode = searchParams.get('roleCode');

    const startTime = performance.now();
    console.log('🔍 역할 권한 조회 시작...', roleCode ? `roleCode: ${roleCode}` : '전체');

    // ⚡ 성능 개선 1: 역할 조회와 메뉴 조회를 병렬로 실행
    let rolesQuery = supabase.from('admin_users_rules').select('*').eq('is_active', true).order('display_order', { ascending: true });

    if (roleCode) {
      rolesQuery = rolesQuery.eq('role_code', roleCode);
    }

    const [{ data: roles, error: rolesError }, { data: menus, error: menuError }] = await Promise.all([
      rolesQuery,
      supabase
        .from('admin_systemsetting_menu')
        .select('id, menu_category, menu_page, menu_description, menu_icon, menu_url, menu_level')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true })
    ]);

    const t1 = performance.now();
    console.log(`⚡ 역할+메뉴 병렬 조회 완료: ${(t1 - startTime).toFixed(2)}ms`);

    if (rolesError) {
      console.error('❌ 역할 조회 실패:', rolesError);
      throw rolesError;
    }

    if (menuError) {
      console.error('❌ 메뉴 조회 실패:', menuError);
      throw menuError;
    }

    console.log(`✅ 역할 조회 성공: ${roles?.length || 0}개`);
    console.log(`✅ 메뉴 조회 성공: ${menus?.length || 0}개`);

    // ⚡ 성능 개선 2: 모든 역할의 권한을 한 번에 조회 (N+1 문제 해결)
    const roleIds = (roles || []).map((r) => r.id);

    if (roleIds.length > 0) {
      const { data: allPermissions, error: permError } = await supabase
        .from('admin_users_rules_permissions')
        .select(
          `
          role_id,
          menu_id,
          can_read,
          can_write,
          can_full,
          can_view_category,
          can_read_data,
          can_manage_own,
          can_edit_others,
          admin_systemsetting_menu (
            menu_category,
            menu_page,
            menu_description
          )
        `
        )
        .in('role_id', roleIds)
        .order('menu_id', { ascending: true });

      const t2 = performance.now();

      if (permError) {
        console.error('❌ 권한 조회 실패:', permError);
        // 에러 발생 시 모든 역할에 빈 배열 할당
        for (let role of roles || []) {
          role.detailed_permissions = [];
        }
      } else {
        // 역할별로 권한 그룹핑
        const permissionsByRole = (allPermissions || []).reduce((acc: any, p: any) => {
          if (!acc[p.role_id]) {
            acc[p.role_id] = [];
          }
          acc[p.role_id].push({
            menu_id: p.menu_id,
            // 기존 3개 필드 (하위 호환성)
            can_read: p.can_read,
            can_write: p.can_write,
            can_full: p.can_full,
            // 새로운 5개 필드
            can_view_category: p.can_view_category,
            can_read_data: p.can_read_data,
            // ✅ 통합된 can_manage_own을 두 필드로 제공 (하위 호환성)
            can_create_data: p.can_manage_own,
            can_edit_own: p.can_manage_own,
            can_edit_others: p.can_edit_others,
            menu_category: p.admin_systemsetting_menu?.menu_category,
            menu_page: p.admin_systemsetting_menu?.menu_page,
            menu_description: p.admin_systemsetting_menu?.menu_description
          });
          return acc;
        }, {});

        // 각 역할에 권한 할당
        for (let role of roles || []) {
          role.detailed_permissions = permissionsByRole[role.id] || [];
        }

        console.log(`⚡ 권한 조회 성공: ${allPermissions?.length || 0}개 (${(t2 - t1).toFixed(2)}ms)`);
      }
    } else {
      // 역할이 없으면 빈 배열
      for (let role of roles || []) {
        role.detailed_permissions = [];
      }
    }

    const endTime = performance.now();
    console.log(`✅ 전체 조회 완료: ${(endTime - startTime).toFixed(2)}ms`);

    return NextResponse.json({
      success: true,
      roles: roles || [],
      menus: menus || []
    });
  } catch (error: any) {
    console.error('❌ 역할 권한 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '역할 권한을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 역할 생성 및 권한 업데이트
export async function POST(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (쓰기 권한 필요)
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'write');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, roleId, permissions, roleData } = body;

    console.log('POST 요청:', { action, roleId, permissions, roleData });

    if (action === 'create') {
      // 새 역할 생성
      if (!roleData || !roleData.role_name) {
        return NextResponse.json(
          {
            success: false,
            error: '역할 이름이 필요합니다.'
          },
          { status: 400 }
        );
      }

      // 고유한 role_code 생성
      let roleCode = roleData.role_code;
      if (!roleCode) {
        // 기존 역할 코드들 확인하여 중복되지 않는 코드 생성
        const { data: existingCodes, error: codesError } = await supabase
          .from('admin_users_rules')
          .select('role_code')
          .like('role_code', 'ROLE-25-%')
          .order('role_code', { ascending: false });

        if (codesError) {
          console.error('역할 코드 조회 실패:', codesError);
          throw codesError;
        }

        // 최대 번호 찾기
        let maxNumber = 0;
        for (const row of existingCodes || []) {
          const match = row.role_code.match(/ROLE-25-(\d+)/);
          if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }

        roleCode = `ROLE-25-${String(maxNumber + 1).padStart(3, '0')}`;
      }

      console.log(`🆕 새 역할 생성: ${roleCode} - ${roleData.role_name}`);

      // 최대 display_order 찾기
      const { data: maxOrderData } = await supabase
        .from('admin_users_rules')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const nextDisplayOrder = (maxOrderData?.display_order || 0) + 1;

      const { data: newRole, error: insertError } = await supabase
        .from('admin_users_rules')
        .insert([
          {
            role_code: roleCode,
            role_name: roleData.role_name,
            role_description: roleData.role_description || '',
            permissions: {},
            is_active: true,
            created_by: 'system',
            updated_by: 'system',
            display_order: nextDisplayOrder
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('역할 생성 실패:', insertError);
        throw insertError;
      }

      return NextResponse.json({
        success: true,
        message: '역할이 성공적으로 생성되었습니다.',
        roleId: newRole.id,
        roleCode: roleCode
      });
    } else if (action === 'update') {
      // 역할 정보 업데이트
      if (!roleId) {
        return NextResponse.json(
          {
            success: false,
            error: '역할 ID가 필요합니다.'
          },
          { status: 400 }
        );
      }

      if (roleData) {
        const { error: updateError } = await supabase
          .from('admin_users_rules')
          .update({
            role_name: roleData.role_name,
            role_description: roleData.role_description || '',
            is_active: roleData.is_active !== false,
            updated_by: 'system'
          })
          .eq('id', roleId);

        if (updateError) {
          console.error('역할 업데이트 실패:', updateError);
          throw updateError;
        }
      }

      return NextResponse.json({
        success: true,
        message: '역할이 성공적으로 업데이트되었습니다.'
      });
    } else if (action === 'permissions') {
      // 권한 업데이트 로직
      if (!roleId) {
        return NextResponse.json(
          {
            success: false,
            error: '역할 ID가 필요합니다.'
          },
          { status: 400 }
        );
      }

      if (!permissions || !Array.isArray(permissions)) {
        return NextResponse.json(
          {
            success: false,
            error: '권한 데이터가 필요합니다.'
          },
          { status: 400 }
        );
      }

      console.log(`🔄 역할 ID ${roleId}의 권한을 업데이트 시작:`, permissions);

      // 1. 기존 권한 삭제
      const { error: deleteError } = await supabase.from('admin_users_rules_permissions').delete().eq('role_id', roleId);

      if (deleteError) {
        console.error('기존 권한 삭제 실패:', deleteError);
        throw deleteError;
      }

      console.log(`🗑️ 기존 권한 삭제 완료`);

      // 2. 새로운 권한 추가 (권한이 설정된 메뉴만 저장)
      let insertedCount = 0;
      const permissionsToInsert = [];

      for (const permission of permissions) {
        const {
          menuId,
          // 기존 3개 필드 (하위 호환성)
          canRead,
          canWrite,
          canFull,
          // 새로운 5개 필드
          canViewCategory,
          canReadData,
          canCreateData,
          canEditOwn,
          canEditOthers
        } = permission;

        // menuId가 유효한지 확인
        if (!menuId || menuId === null || menuId === undefined) {
          console.warn(`⚠️ 잘못된 menuId: ${menuId}, 건너뜀`);
          continue;
        }

        // ✅ can_create_data와 can_edit_own을 can_manage_own으로 통합
        const canManageOwn = canCreateData || canEditOwn;

        // 적어도 하나의 권한이라도 true인 경우에만 저장
        if (canRead || canWrite || canFull || canViewCategory || canReadData || canManageOwn || canEditOthers) {
          permissionsToInsert.push({
            role_id: roleId,
            menu_id: menuId,
            // 기존 3개 필드 (하위 호환성)
            can_read: canRead || false,
            can_write: canWrite || false,
            can_full: canFull || false,
            // 새로운 필드 (세밀한 권한 제어)
            can_view_category: canViewCategory || false,
            can_read_data: canReadData || false,
            can_manage_own: canManageOwn || false, // ✅ 통합된 필드
            can_edit_others: canEditOthers || false,
            created_by: 'system',
            updated_by: 'system'
          });
          console.log(`✅ 메뉴 ${menuId} 권한 저장: read=${canRead}, write=${canWrite}, full=${canFull}, viewCategory=${canViewCategory}, readData=${canReadData}, manageOwn=${canManageOwn}, editOthers=${canEditOthers}`);
        } else {
          console.log(`⏩ 메뉴 ${menuId}: 권한 없음, 건너뜀`);
        }
      }

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('admin_users_rules_permissions').insert(permissionsToInsert);

        if (insertError) {
          console.error('권한 추가 실패:', insertError);
          throw insertError;
        }

        insertedCount = permissionsToInsert.length;
      }

      console.log(`✅ 역할 ID ${roleId}의 권한을 성공적으로 업데이트했습니다. (${insertedCount}개 권한 저장)`);

      return NextResponse.json({
        success: true,
        message: '권한이 성공적으로 업데이트되었습니다.',
        updatedCount: insertedCount
      });
    }
  } catch (error: any) {
    console.error('역할 처리 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '역할 처리에 실패했습니다: ' + (error.message || '')
      },
      { status: 500 }
    );
  }
}

// DELETE: 역할 삭제
export async function DELETE(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (전체 권한 필요)
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'full');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleIds = searchParams.get('roleIds');

    if (!roleIds) {
      return NextResponse.json(
        {
          success: false,
          error: '삭제할 역할 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const ids = roleIds.split(',').map((id) => parseInt(id.trim()));
    console.log('삭제할 역할 IDs:', ids);

    // 1. 먼저 해당 역할들의 권한 삭제
    const { error: deletePermError } = await supabase.from('admin_users_rules_permissions').delete().in('role_id', ids);

    if (deletePermError) {
      console.error('권한 삭제 실패:', deletePermError);
      throw deletePermError;
    }

    // 2. 역할 삭제 (실제로는 is_active를 false로 변경)
    const { data: deletedRoles, error: deleteRolesError } = await supabase
      .from('admin_users_rules')
      .update({
        is_active: false,
        updated_by: 'system'
      })
      .in('id', ids)
      .select('id, role_code, role_name');

    if (deleteRolesError) {
      console.error('역할 삭제 실패:', deleteRolesError);
      throw deleteRolesError;
    }

    console.log(`${deletedRoles?.length || 0}개의 역할을 성공적으로 삭제했습니다.`);

    return NextResponse.json({
      success: true,
      message: `${deletedRoles?.length || 0}개의 역할이 성공적으로 삭제되었습니다.`,
      deletedRoles: deletedRoles || []
    });
  } catch (error: any) {
    console.error('역할 삭제 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '역할 삭제에 실패했습니다: ' + (error.message || '')
      },
      { status: 500 }
    );
  }
}
