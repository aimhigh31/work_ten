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

// GET: 특정 파일의 리비전 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regulationId = searchParams.get('regulationId');

    console.log('📥 GET /api/security-regulation-revision 요청:', { regulationId });

    if (!regulationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'regulationId가 필요합니다.'
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('security_regulation_revision')
      .select('*')
      .eq('security_regulation_id', Number(regulationId))
      .eq('is_active', true)
      .order('revision', { ascending: false }); // 최신 리비전이 위로

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase 조회 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ 조회 성공:', data?.length || 0, '개 리비전');

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('❌ 조회 예외:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '데이터 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 새 리비전 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 POST /api/security-regulation-revision 요청:', body);

    const { security_regulation_id, file_name, file_size, file_description, file_path } = body;

    if (!security_regulation_id || !file_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'security_regulation_id와 file_name이 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 다음 리비전 번호 계산
    const { data: existingRevisions } = await supabase
      .from('security_regulation_revision')
      .select('revision')
      .eq('security_regulation_id', security_regulation_id)
      .eq('is_active', true)
      .order('revision', { ascending: false })
      .limit(1);

    let nextRevision = 'R1';
    if (existingRevisions && existingRevisions.length > 0) {
      const lastRevision = existingRevisions[0].revision;
      const revisionNumber = parseInt(lastRevision.replace('R', ''));
      nextRevision = `R${revisionNumber + 1}`;
    }

    console.log('🔢 다음 리비전:', nextRevision);

    // 데이터 삽입
    const insertData = {
      security_regulation_id,
      file_name,
      file_size: file_size || '',
      file_description: file_description || '',
      file_path: file_path || '',
      revision: nextRevision,
      upload_date: new Date().toISOString().split('T')[0],
      created_by: 'user',
      updated_by: 'user'
    };

    console.log('💾 삽입할 데이터:', insertData);

    const { data, error } = await supabase.from('security_regulation_revision').insert([insertData]).select().single();

    if (error) {
      console.error('❌ 생성 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ 생성 성공:', data);
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '생성에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 리비전 수정 (주로 파일 설명 수정)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    console.log('📥 PUT /api/security-regulation-revision 요청:', { id, updateData });

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 데이터 업데이트
    const { data, error } = await supabase
      .from('security_regulation_revision')
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

    console.log('✅ 수정 성공:', data);
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '수정에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 리비전 삭제 (소프트 삭제)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('📥 DELETE /api/security-regulation-revision 요청:', { id });

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('security_regulation_revision')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('삭제 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ 삭제 성공');
    return NextResponse.json({
      success: true,
      message: '삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
