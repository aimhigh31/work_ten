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

// GET: 보안교육 데이터 조회
export async function GET(request: NextRequest) {
  try {
    // ✅ 권한 체크 추가
    const { hasPermission, error } = await requirePermission(request, '/security/education', 'read');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: error || '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 특정 교육 데이터 조회 (커리큘럼, 참석자 포함)
      const { data: educationData, error: educationError } = await supabase
        .from('security_education_data')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (educationError) {
        return NextResponse.json(
          {
            success: false,
            error: educationError.message
          },
          { status: 500 }
        );
      }

      // 커리큘럼 데이터 조회
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('security_education_curriculum')
        .select('*')
        .eq('education_id', id)
        .eq('is_active', true)
        .order('session_order');

      // 참석자 데이터 조회
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('security_education_attendee')
        .select('*')
        .eq('education_id', id)
        .eq('is_active', true)
        .order('user_name');

      return NextResponse.json({
        success: true,
        data: {
          education: educationData,
          curriculum: curriculumData || [],
          attendees: attendeeData || []
        }
      });
    } else {
      // 전체 교육 목록 조회
      const { data, error: queryError } = await supabase
        .from('security_education_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (queryError) {
        return NextResponse.json(
          {
            success: false,
            error: queryError.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || []
      });
    }
  } catch (error) {
    console.error('조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '데이터 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 보안교육 데이터 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 메인 교육 데이터 생성
    const { data, error } = await supabase
      .from('security_education_data')
      .insert([
        {
          ...body,
          created_by: 'user',
          updated_by: 'user'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('생성 오류:', error);
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
    console.error('생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 보안교육 데이터 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('security_education_data')
      .update({
        ...updateData,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('수정 오류:', error);
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
    console.error('수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 보안교육 데이터 삭제 (소프트 삭제)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 메인 데이터와 관련 데이터 모두 비활성화
    const { error: mainError } = await supabase
      .from('security_education_data')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    const { error: curriculumError } = await supabase
      .from('security_education_curriculum')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('education_id', id);

    const { error: attendeeError } = await supabase
      .from('security_education_attendee')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('education_id', id);

    if (mainError || curriculumError || attendeeError) {
      console.error('삭제 오류:', { mainError, curriculumError, attendeeError });
      return NextResponse.json(
        {
          success: false,
          error: '삭제에 실패했습니다.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '삭제되었습니다.'
    });
  } catch (error) {
    console.error('삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
