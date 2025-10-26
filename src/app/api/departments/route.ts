import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requirePermission } from 'lib/authMiddleware'; // ✅ 추가
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions';

// Supabase 클라이언트 (Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET: 부서 목록 조회
export async function GET(request: NextRequest) {
  try {
    // ✅ 세션 체크만 수행 (모든 로그인 사용자가 부서 목록 조회 가능)
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    console.log('🔍 부서 목록 조회 시작...');

    const { data, error } = await supabase
      .from('admin_users_department')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ Supabase 조회 실패:', error);
      throw error;
    }

    console.log(`✅ 조회 성공: ${data?.length || 0}개 부서`);

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('❌ 부서 목록 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '부서 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 부서 생성
export async function POST(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (쓰기 권한 필요)
    const { hasPermission, error: permError } = await requirePermission(request, '/admin-panel/user-settings', 'write');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: permError || '권한이 없습니다.' }, { status: 403 });
    }

    const departmentData = await request.json();

    const insertData = {
      department_code: departmentData.department_code,
      department_name: departmentData.department_name,
      parent_department_id: departmentData.parent_department_id || null,
      department_level: departmentData.department_level || 1,
      display_order: departmentData.display_order || 0,
      manager_name: departmentData.manager_name,
      manager_email: departmentData.manager_email,
      phone: departmentData.phone,
      location: departmentData.location,
      description: departmentData.description,
      created_by: departmentData.created_by || 'system'
    };

    const { data, error } = await supabase.from('admin_users_department').insert([insertData]).select().single();

    if (error) {
      console.error('부서 생성 실패:', error);

      let errorMessage = '부서 생성에 실패했습니다.';
      if (error.code === '23505') {
        errorMessage = '이미 존재하는 부서 코드입니다.';
      }

      throw new Error(errorMessage);
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('부서 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '부서 생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 부서 수정
export async function PUT(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (쓰기 권한 필요)
    const { hasPermission, error: permError } = await requirePermission(request, '/admin-panel/user-settings', 'write');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: permError || '권한이 없습니다.' }, { status: 403 });
    }

    const departmentData = await request.json();

    const updateData = {
      department_code: departmentData.department_code,
      department_name: departmentData.department_name,
      parent_department_id: departmentData.parent_department_id || null,
      department_level: departmentData.department_level,
      display_order: departmentData.display_order,
      manager_name: departmentData.manager_name,
      manager_email: departmentData.manager_email,
      phone: departmentData.phone,
      location: departmentData.location,
      description: departmentData.description,
      updated_by: 'system'
    };

    const { data, error } = await supabase.from('admin_users_department').update(updateData).eq('id', departmentData.id).select().single();

    if (error) {
      console.error('부서 수정 실패:', error);

      let errorMessage = '부서 수정에 실패했습니다.';
      if (error.code === '23505') {
        errorMessage = '이미 존재하는 부서 코드입니다.';
      } else if (error.code === 'PGRST116') {
        errorMessage = '수정할 부서를 찾을 수 없습니다.';
      }

      throw new Error(errorMessage);
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: '수정할 부서를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('부서 수정 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '부서 수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 부서 삭제
export async function DELETE(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가 (전체 권한 필요)
    const { hasPermission, error: permError } = await requirePermission(request, '/admin-panel/user-settings', 'full');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: permError || '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '부서 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 하위 부서가 있는지 확인
    const { count } = await supabase
      .from('admin_users_department')
      .select('*', { count: 'exact', head: true })
      .eq('parent_department_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '하위 부서가 존재하는 부서는 삭제할 수 없습니다.'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from('admin_users_department').delete().eq('id', id).select().single();

    if (error) {
      console.error('부서 삭제 실패:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: '삭제할 부서를 찾을 수 없습니다.'
          },
          { status: 404 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '부서가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('부서 삭제 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '부서 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
