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

// PUT: 부서 활성화/비활성화 토글
export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '부서 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 먼저 현재 상태 조회
    const { data: currentData, error: fetchError } = await supabase
      .from('admin_users_department')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      return NextResponse.json(
        {
          success: false,
          error: '부서를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    // 상태 토글
    const { data, error } = await supabase
      .from('admin_users_department')
      .update({
        is_active: !currentData.is_active,
        updated_by: 'system'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('부서 상태 변경 실패:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('부서 상태 변경 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '부서 상태 변경에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
