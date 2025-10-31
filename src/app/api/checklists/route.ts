import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requirePermission } from 'lib/authMiddleware'; // ✅ 추가

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET: 체크리스트 목록 조회
export async function GET(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가
    const { hasPermission, error: permError } = await requirePermission(request, '/admin-panel/checklist-management', 'read');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: permError || '권한이 없습니다.' }, { status: 403 });
    }

    const { data, error } = await supabase.from('admin_checklist_data').select('*').eq('is_active', true).order('no', { ascending: false });

    if (error) {
      console.error('체크리스트 조회 오류:', error);
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
      data: data || []
    });
  } catch (error) {
    console.error('체크리스트 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 목록을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 체크리스트 생성
export async function POST(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/checklist-management', 'write');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();

    // 다음 NO 값 가져오기
    const { data: maxNoData } = await supabase.from('admin_checklist_data').select('no').order('no', { ascending: false }).limit(1);

    const nextNo = maxNoData && maxNoData.length > 0 ? maxNoData[0].no + 1 : 1;

    // 코드가 제공되지 않았거나 비어있으면 서버에서 생성
    let code = body.code;
    if (!code || code.trim() === '') {
      const currentYear = new Date().getFullYear().toString().slice(-2);

      // DB에서 현재 연도의 최대 코드 번호 조회
      const { data: existingCodes } = await supabase
        .from('admin_checklist_data')
        .select('code')
        .like('code', `ADMIN-CHECK-${currentYear}-%`)
        .order('code', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingCodes && existingCodes.length > 0) {
        const lastCode = existingCodes[0].code;
        const match = lastCode.match(/ADMIN-CHECK-\d{2}-(\d{3})/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      code = `ADMIN-CHECK-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
      console.log('🔢 서버에서 생성된 코드:', code);
    }

    // 데이터 삽입
    const { data, error: insertError } = await supabase
      .from('admin_checklist_data')
      .insert([
        {
          ...body,
          code,
          no: body.no || nextNo,
          registration_date: body.registration_date || new Date().toISOString().split('T')[0],
          progress: body.progress || 0,
          created_by: body.created_by || body.assignee || 'unknown',
          updated_by: body.updated_by || body.created_by || body.assignee || 'unknown',
          is_active: true
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('체크리스트 생성 오류:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('체크리스트 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 체크리스트 수정
export async function PUT(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/checklist-management', 'write');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { code, ...updateData } = body;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 코드가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 코드로 체크리스트 찾기
    const { data: existingData, error: findError } = await supabase.from('admin_checklist_data').select('id').eq('code', code).single();

    if (findError || !existingData) {
      // 체크리스트가 없으면 새로 생성
      return POST(request);
    }

    // 데이터 업데이트
    const { data, error: updateError } = await supabase
      .from('admin_checklist_data')
      .update({
        ...updateData,
        updated_by: updateData.updated_by || 'unknown',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingData.id)
      .select()
      .single();

    if (updateError) {
      console.error('체크리스트 수정 오류:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('체크리스트 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 체크리스트 삭제
export async function DELETE(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가
    const { hasPermission, error } = await requirePermission(request, '/admin-panel/checklist-management', 'full');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 코드가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 소프트 삭제 (is_active를 false로 설정)
    const { error: deleteError } = await supabase
      .from('admin_checklist_data')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('code', code);

    if (deleteError) {
      console.error('체크리스트 삭제 오류:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '체크리스트가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('체크리스트 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
