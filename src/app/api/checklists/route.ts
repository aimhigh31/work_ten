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

// GET: 체크리스트 목록 조회
export async function GET() {
  try {
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
    const body = await request.json();

    // 다음 NO 값 가져오기
    const { data: maxNoData } = await supabase.from('admin_checklist_data').select('no').order('no', { ascending: false }).limit(1);

    const nextNo = maxNoData && maxNoData.length > 0 ? maxNoData[0].no + 1 : 1;

    // 데이터 삽입
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .insert([
        {
          ...body,
          no: body.no || nextNo,
          registration_date: body.registration_date || new Date().toISOString().split('T')[0],
          progress: body.progress || 0,
          created_by: 'user',
          updated_by: 'user',
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('체크리스트 생성 오류:', error);
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
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .update({
        ...updateData,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingData.id)
      .select()
      .single();

    if (error) {
      console.error('체크리스트 수정 오류:', error);
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
    const { error } = await supabase
      .from('admin_checklist_data')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('code', code);

    if (error) {
      console.error('체크리스트 삭제 오류:', error);
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
