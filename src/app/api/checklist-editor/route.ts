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

// GET: 체크리스트 에디터 항목 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checklistId = searchParams.get('checklist_id');

    if (!checklistId) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .eq('checklist_id', checklistId)
      .eq('is_active', true)
      .order('no', { ascending: true });

    if (error) {
      console.error('체크리스트 에디터 조회 오류:', error);

      // 테이블이 존재하지 않는 경우 더 친화적인 메시지
      if (error.message.includes('Could not find the table')) {
        return NextResponse.json(
          {
            success: false,
            error: 'admin_checklist_editor 테이블이 아직 생성되지 않았습니다. Supabase Dashboard에서 테이블을 생성해주세요.',
            table_missing: true
          },
          { status: 404 }
        );
      }

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
    console.error('체크리스트 에디터 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 에디터 항목을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 체크리스트 에디터 항목 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.checklist_id || !body.major_category || !body.sub_category || !body.title) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.'
        },
        { status: 400 }
      );
    }

    // 다음 NO 값 가져오기 (body.no가 없을 때만)
    let finalNo = body.no;

    if (!finalNo) {
      const { data: maxNoData } = await supabase
        .from('admin_checklist_editor')
        .select('no')
        .eq('checklist_id', body.checklist_id)
        .order('no', { ascending: false })
        .limit(1);

      finalNo = maxNoData && maxNoData.length > 0 ? maxNoData[0].no + 1 : 1;
      console.log(`🔢 자동 계산된 no 값: 체크리스트 ${body.checklist_id}, no = ${finalNo}`);
    }

    // 데이터 삽입
    const { data, error } = await supabase
      .from('admin_checklist_editor')
      .insert([
        {
          ...body,
          no: finalNo,
          evaluation: body.evaluation || '대기',
          score: body.score || 0,
          created_by: 'user',
          updated_by: 'user',
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('체크리스트 에디터 생성 오류:', error);

      // 중복 키 오류 처리
      if (error.message.includes('duplicate key')) {
        // 재시도: 최신 no 값 다시 조회
        const { data: retryMaxNoData } = await supabase
          .from('admin_checklist_editor')
          .select('no')
          .eq('checklist_id', body.checklist_id)
          .order('no', { ascending: false })
          .limit(1);

        const retryNo = retryMaxNoData && retryMaxNoData.length > 0 ? retryMaxNoData[0].no + 1 : 1;
        console.log(`🔄 중복 키 오류 - 재시도 with no = ${retryNo}`);

        const { data: retryData, error: retryError } = await supabase
          .from('admin_checklist_editor')
          .insert([
            {
              ...body,
              no: retryNo,
              evaluation: body.evaluation || '대기',
              score: body.score || 0,
              created_by: 'user',
              updated_by: 'user',
              is_active: true
            }
          ])
          .select()
          .single();

        if (!retryError) {
          return NextResponse.json({
            success: true,
            data: retryData
          });
        }
      }

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
    console.error('체크리스트 에디터 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 에디터 항목 생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 체크리스트 에디터 항목 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 에디터 항목 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 데이터 업데이트
    const { data, error } = await supabase
      .from('admin_checklist_editor')
      .update({
        ...updateData,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('체크리스트 에디터 수정 오류:', error);
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
    console.error('체크리스트 에디터 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 에디터 항목 수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 체크리스트 에디터 항목 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 에디터 항목 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 소프트 삭제 (is_active를 false로 설정)
    const { error } = await supabase
      .from('admin_checklist_editor')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('체크리스트 에디터 삭제 오류:', error);
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
      message: '체크리스트 에디터 항목이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('체크리스트 에디터 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 에디터 항목 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
