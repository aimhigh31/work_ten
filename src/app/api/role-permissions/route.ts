import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { searchParams } = new URL(request.url);
    const roleCode = searchParams.get('roleCode');

    console.log('🔍 역할 권한 조회 시작...', roleCode ? `roleCode: ${roleCode}` : '전체');

    // 역할 조회
    let rolesQuery = supabase.from('admin_users_rules').select('*').eq('is_active', true).order('display_order', { ascending: true });

    if (roleCode) {
      rolesQuery = rolesQuery.eq('role_code', roleCode);
    }

    const { data: roles, error: rolesError } = await rolesQuery;

    if (rolesError) {
      console.error('❌ 역할 조회 실패:', rolesError);
      throw rolesError;
    }

    console.log(`✅ 역할 조회 성공: ${roles?.length || 0}개`);

    // 각 역할에 대한 상세 권한 정보도 가져오기
    for (let role of roles || []) {
      const { data: permissions, error: permError } = await supabase
        .from('admin_users_rules_permissions')
        .select(
          `
          menu_id,
          can_read,
          can_write,
          can_full,
          admin_systemsetting_menu (
            menu_category,
            menu_page,
            menu_description
          )
        `
        )
        .eq('role_id', role.id)
        .order('menu_id', { ascending: true });

      if (permError) {
        console.error(`❌ 역할 ID ${role.id} 권한 조회 실패:`, permError);
        role.detailed_permissions = [];
      } else {
        // 데이터 구조 평탄화
        role.detailed_permissions = (permissions || []).map((p: any) => ({
          menu_id: p.menu_id,
          can_read: p.can_read,
          can_write: p.can_write,
          can_full: p.can_full,
          menu_category: p.admin_systemsetting_menu?.menu_category,
          menu_page: p.admin_systemsetting_menu?.menu_page,
          menu_description: p.admin_systemsetting_menu?.menu_description
        }));
      }
    }

    // 메뉴 목록도 함께 가져오기
    const { data: menus, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_category, menu_page, menu_description, menu_icon, menu_url, menu_level')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true });

    if (menuError) {
      console.error('❌ 메뉴 조회 실패:', menuError);
      throw menuError;
    }

    console.log(`✅ 메뉴 조회 성공: ${menus?.length || 0}개`);

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
        const { menuId, canRead, canWrite, canFull } = permission;

        // menuId가 유효한지 확인
        if (!menuId || menuId === null || menuId === undefined) {
          console.warn(`⚠️ 잘못된 menuId: ${menuId}, 건너뜀`);
          continue;
        }

        // 적어도 하나의 권한이라도 true인 경우에만 저장
        if (canRead || canWrite || canFull) {
          permissionsToInsert.push({
            role_id: roleId,
            menu_id: menuId,
            can_read: canRead || false,
            can_write: canWrite || false,
            can_full: canFull || false,
            created_by: 'system',
            updated_by: 'system'
          });
          console.log(`✅ 메뉴 ${menuId} 권한 저장: read=${canRead}, write=${canWrite}, full=${canFull}`);
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
