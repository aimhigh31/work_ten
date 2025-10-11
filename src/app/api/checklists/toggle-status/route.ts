import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// PUT: 체크리스트 상태 토글
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 코드가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 현재 체크리스트 상태 조회
    const { data: currentData, error: fetchError } = await supabase.from('admin_checklist_data').select('status').eq('code', code).single();

    if (fetchError || !currentData) {
      console.error('체크리스트 조회 오류:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트를 찾을 수 없습니다.'
        },
        { status: 404 }
      );
    }

    // 상태 토글 로직
    let newStatus = '대기';
    switch (currentData.status) {
      case '대기':
        newStatus = '진행';
        break;
      case '진행':
        newStatus = '완료';
        break;
      case '완료':
        newStatus = '홀딩';
        break;
      case '홀딩':
        newStatus = '대기';
        break;
    }

    // 상태 업데이트
    const updateData: any = {
      status: newStatus,
      updated_by: 'user',
      updated_at: new Date().toISOString()
    };

    // 완료 상태로 변경될 때 완료일 설정
    if (newStatus === '완료') {
      updateData.completed_date = new Date().toISOString().split('T')[0];
      updateData.progress = 100;
    } else if (currentData.status === '완료' && newStatus !== '완료') {
      // 완료 상태에서 다른 상태로 변경될 때 완료일 제거
      updateData.completed_date = null;
    }

    const { data, error } = await supabase.from('admin_checklist_data').update(updateData).eq('code', code).select().single();

    if (error) {
      console.error('체크리스트 상태 변경 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('체크리스트 상태 변경 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 상태 변경에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
