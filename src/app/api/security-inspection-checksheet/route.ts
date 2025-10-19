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

// GET: 점검 체크시트 항목 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inspectionId = searchParams.get('inspection_id');
    const checklistId = searchParams.get('checklist_id');

    if (!inspectionId) {
      return NextResponse.json(
        {
          success: false,
          error: '점검 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    let query = supabase.from('security_inspection_checksheet').select('*').eq('inspection_id', inspectionId).eq('is_active', true);

    // checklist_id가 제공되면 해당 체크리스트 항목만 조회
    if (checklistId) {
      query = query.eq('checklist_id', checklistId);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
      console.error('체크시트 조회 오류:', error);
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
    console.error('체크시트 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크시트 항목을 불러오는데 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 체크시트 항목 생성 (단일 또는 일괄)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 배열인지 확인 (일괄 생성)
    const items = Array.isArray(body) ? body : [body];

    // 필수 필드 검증
    for (const item of items) {
      if (!item.inspection_id) {
        return NextResponse.json(
          {
            success: false,
            error: '점검 ID가 필요합니다.'
          },
          { status: 400 }
        );
      }
    }

    // 데이터 삽입
    const insertData = items.map((item) => ({
      inspection_id: item.inspection_id,
      checklist_id: item.checklist_id || null,
      major_category: item.major_category || '',
      minor_category: item.minor_category || '',
      title: item.title || '',
      description: item.description || '',
      evaluation: item.evaluation || '',
      score: item.score || 0,
      attachments: item.attachments || [],
      created_by: 'user',
      updated_by: 'user',
      is_active: true
    }));

    const { data, error } = await supabase.from('security_inspection_checksheet').insert(insertData).select();

    if (error) {
      console.error('체크시트 생성 오류:', error);
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
    console.error('체크시트 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크시트 항목 생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 체크시트 항목 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '체크시트 항목 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 데이터 업데이트
    const { data, error } = await supabase
      .from('security_inspection_checksheet')
      .update({
        ...updateData,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('체크시트 수정 오류:', error);
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
    console.error('체크시트 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크시트 항목 수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 체크시트 항목 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const inspectionId = searchParams.get('inspection_id');

    if (id) {
      // 단일 삭제 (소프트 삭제)
      const { error } = await supabase
        .from('security_inspection_checksheet')
        .update({
          is_active: false,
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('체크시트 삭제 오류:', error);
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
        message: '체크시트 항목이 삭제되었습니다.'
      });
    } else if (inspectionId) {
      // 점검 ID에 해당하는 모든 항목 삭제 (소프트 삭제)
      const { error } = await supabase
        .from('security_inspection_checksheet')
        .update({
          is_active: false,
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('inspection_id', inspectionId);

      if (error) {
        console.error('체크시트 일괄 삭제 오류:', error);
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
        message: '체크시트 항목들이 삭제되었습니다.'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '체크시트 항목 ID 또는 점검 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('체크시트 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크시트 항목 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
