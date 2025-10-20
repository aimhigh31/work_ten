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

// GET: 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 - user-settings 권한으로 통일
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'read');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    console.log('🔍 사용자 목록 조회 시작...');

    // admin_users_userprofiles 테이블에서 사용자 조회
    const { data, error: queryError } = await supabase.from('admin_users_userprofiles').select('*').order('created_at', { ascending: false });

    if (queryError) {
      console.error('❌ Supabase 조회 실패:', queryError);
      throw queryError;
    }

    console.log(`✅ 조회 성공: ${data?.length || 0}명`);

    // 첫 번째 사용자 데이터 샘플 확인
    if (data && data.length > 0) {
      console.log('📋 첫 번째 사용자 원본 데이터 샘플:', {
        user_account_id: data[0].user_account_id,
        phone: data[0].phone,
        country: data[0].country,
        address: data[0].address,
        email: data[0].email
      });
    }

    // assigned_roles를 JSON에서 배열로 파싱 (안전하게 처리)
    const processedData = data.map((row) => {
      let assignedRole = [];
      try {
        if (row.assigned_roles) {
          // 이미 배열인 경우 그대로 사용
          if (Array.isArray(row.assigned_roles)) {
            assignedRole = row.assigned_roles;
          }
          // 문자열인 경우 JSON 파싱 시도
          else if (typeof row.assigned_roles === 'string') {
            if (row.assigned_roles.startsWith('[') || row.assigned_roles.startsWith('{')) {
              assignedRole = JSON.parse(row.assigned_roles);
            } else {
              // 단순 문자열인 경우 배열로 변환
              assignedRole = [row.assigned_roles];
            }
          }
          // 기타 타입인 경우 배열로 변환
          else {
            assignedRole = [row.assigned_roles];
          }
        }
      } catch (error) {
        console.warn('assigned_roles 파싱 오류:', error, 'Raw data:', row.assigned_roles);
        // 파싱 실패 시 빈 배열 사용
        assignedRole = [];
      }

      return {
        ...row,
        assignedRole: Array.isArray(assignedRole) ? assignedRole : []
      };
    });

    // 첫 번째 처리된 데이터 샘플 확인
    if (processedData && processedData.length > 0) {
      console.log('📤 프론트엔드로 전송할 첫 번째 사용자 데이터:', {
        user_account_id: processedData[0].user_account_id,
        phone: processedData[0].phone,
        country: processedData[0].country,
        address: processedData[0].address,
        email: processedData[0].email
      });
    }

    return NextResponse.json({
      success: true,
      data: processedData
    });
  } catch (error: any) {
    console.error('❌ 사용자 목록 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사용자 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 사용자 생성
export async function POST(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (쓰기 권한 필요) - user-settings 권한으로 통일
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'write');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const userData = await request.json();

    const insertData: any = {
      user_code: userData.user_code,
      user_name: userData.user_name,
      email: userData.email,
      department: userData.department,
      position: userData.position,
      role: userData.role || 'user',
      status: userData.status || 'active',
      phone: userData.phone,
      hire_date: userData.hire_date,
      country: userData.country || null,
      address: userData.address || null,
      user_account_id: userData.user_account_id || null,
      rule: userData.rule || 'RULE-25-003'
    };

    if (userData.profile_image_url !== undefined) {
      insertData.profile_image_url = userData.profile_image_url || null;
    }

    const { data, error: insertError } = await supabase.from('admin_users_userprofiles').insert([insertData]).select().single();

    if (insertError) {
      console.error('사용자 생성 실패:', insertError);

      let errorMessage = '사용자 생성에 실패했습니다.';
      if (insertError.code === '23505') {
        errorMessage = '이미 존재하는 사용자 코드 또는 이메일입니다.';
      }

      throw new Error(errorMessage);
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('사용자 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사용자 생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 사용자 수정
export async function PUT(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (쓰기 권한 필요) - user-settings 또는 user-management 권한
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'write');

    if (!hasPermission) {
      console.error('❌ 권한 체크 실패:', error);
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const userData = await request.json();

    console.log('📝 받은 사용자 데이터:', {
      phone: userData.phone,
      country: userData.country,
      address: userData.address,
      department: userData.department,
      position: userData.position,
      role: userData.role
    });

    const updateData: any = {
      user_code: userData.user_code,
      user_name: userData.user_name,
      email: userData.email,
      department: userData.department,
      position: userData.position,
      role: userData.role,
      status: userData.status,
      phone: userData.phone,
      hire_date: userData.hire_date,
      country: userData.country || null,
      address: userData.address || null,
      user_account_id: userData.user_account_id || null,
      assigned_roles: userData.assignedRole || [],
      rule: userData.rule || 'RULE-25-003',
      updated_by: 'system'
    };

    if (userData.profile_image_url !== undefined) {
      updateData.profile_image_url = userData.profile_image_url || null;
    }

    console.log('🔄 Supabase 업데이트 데이터:', {
      phone: updateData.phone,
      country: updateData.country,
      address: updateData.address,
      department: updateData.department,
      position: updateData.position,
      role: updateData.role
    });

    const { data, error: updateError } = await supabase.from('admin_users_userprofiles').update(updateData).eq('id', userData.id).select().single();

    if (updateError) {
      console.error('❌ Supabase 업데이트 실패:', updateError);

      let errorMessage = '사용자 수정에 실패했습니다.';
      if (updateError.code === '23505') {
        errorMessage = '이미 존재하는 사용자 코드 또는 이메일입니다.';
      } else if (updateError.code === 'PGRST116') {
        errorMessage = '수정할 사용자를 찾을 수 없습니다.';
      } else {
        errorMessage = `사용자 수정 실패: ${updateError.message || updateError.code || '알 수 없는 오류'}`;
      }

      throw new Error(errorMessage);
    }

    if (!data) {
      console.error('❌ 수정된 데이터가 없음 (사용자를 찾을 수 없음)');
      return NextResponse.json(
        {
          success: false,
          error: '수정할 사용자를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    console.log('✅ 사용자 수정 성공:', {
      phone: data.phone,
      country: data.country,
      address: data.address,
      department: data.department,
      position: data.position,
      role: data.role
    });
    console.log('✅ DB에 저장된 전체 데이터:', data);

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('사용자 수정 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사용자 수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 사용자 삭제
export async function DELETE(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (전체 권한 필요) - user-settings 권한으로 통일
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/user-settings', 'full');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const { data, error: deleteError } = await supabase.from('admin_users_userprofiles').delete().eq('id', id).select().single();

    if (deleteError) {
      console.error('사용자 삭제 실패:', deleteError);

      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: '삭제할 사용자를 찾을 수 없습니다.'
          },
          { status: 404 }
        );
      }

      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('사용자 삭제 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사용자 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
