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

// GET: 사용자 목록 조회
export async function GET() {
  try {
    console.log('🔍 사용자 목록 조회 시작...');

    // admin_users_userprofiles 테이블에서 사용자 조회
    const { data, error } = await supabase.from('admin_users_userprofiles').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase 조회 실패:', error);
      throw error;
    }

    console.log(`✅ 조회 성공: ${data?.length || 0}명`);

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

    const { data, error } = await supabase.from('admin_users_userprofiles').insert([insertData]).select().single();

    if (error) {
      console.error('사용자 생성 실패:', error);

      let errorMessage = '사용자 생성에 실패했습니다.';
      if (error.code === '23505') {
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
    const userData = await request.json();

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

    const { data, error } = await supabase.from('admin_users_userprofiles').update(updateData).eq('id', userData.id).select().single();

    if (error) {
      console.error('사용자 수정 실패:', error);

      let errorMessage = '사용자 수정에 실패했습니다.';
      if (error.code === '23505') {
        errorMessage = '이미 존재하는 사용자 코드 또는 이메일입니다.';
      } else if (error.code === 'PGRST116') {
        errorMessage = '수정할 사용자를 찾을 수 없습니다.';
      }

      throw new Error(errorMessage);
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: '수정할 사용자를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

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

    const { data, error } = await supabase.from('admin_users_userprofiles').delete().eq('id', id).select().single();

    if (error) {
      console.error('사용자 삭제 실패:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: '삭제할 사용자를 찾을 수 없습니다.'
          },
          { status: 404 }
        );
      }

      throw error;
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
