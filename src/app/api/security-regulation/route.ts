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

// GET: 폴더/파일 구조 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const type = searchParams.get('type');
    const all = searchParams.get('all');

    console.log('📥 GET /api/security-regulation 요청:', { parentId, type, all });

    let query = supabase.from('security_regulation_data').select('*').eq('is_active', true);

    // all=true이면 모든 데이터 조회 (트리 구조 생성용)
    if (all === 'true') {
      console.log('🔍 모든 데이터 조회 (트리 구조 생성용)');
      // parent_id 필터링 하지 않음
    } else {
      // 특정 부모 폴더의 하위 항목 조회
      if (parentId === 'root' || !parentId) {
        // 최상위 폴더들만 조회 (parent_id가 null인 항목)
        console.log('🔍 최상위 폴더 조회 (parent_id IS NULL)');
        query = query.is('parent_id', null);
      } else if (parentId) {
        // 특정 부모 ID의 하위 항목 조회
        console.log('🔍 하위 항목 조회 (parent_id =', parentId, ')');
        query = query.eq('parent_id', Number(parentId));
      }
    }

    // 타입별 필터링
    if (type) {
      query = query.eq('type', type);
    }

    // 정렬: type (폴더 우선) → sort_order → name
    // PostgreSQL에서 type='folder'를 먼저 오도록 하려면 CASE WHEN 사용 또는
    // 간단하게 type DESC (folder가 file보다 알파벳 순서상 뒤)를 활용
    query = query
      .order('type', { ascending: true }) // 'file' < 'folder' 이므로 folder가 나중에 오게 됨
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

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

    console.log('✅ 조회 성공:', data?.length || 0, '개 항목');

    // 폴더를 파일보다 먼저 오도록 정렬 (서버에서 처리 완료했지만 확실하게 한번 더)
    const sortedData =
      data?.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return 0;
      }) || [];

    return NextResponse.json({
      success: true,
      data: sortedData
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

// POST: 폴더/파일 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 POST /api/security-regulation 요청:', body);

    // 경로 자동 생성
    if (body.parent_id) {
      const { data: parentData, error: parentError } = await supabase
        .from('security_regulation_data')
        .select('path, level')
        .eq('id', body.parent_id)
        .single();

      if (parentError) {
        console.error('❌ 부모 폴더 조회 오류:', parentError);
        return NextResponse.json(
          {
            success: false,
            error: `부모 폴더를 찾을 수 없습니다: ${parentError.message}`
          },
          { status: 400 }
        );
      }

      if (parentData) {
        body.path = `${parentData.path}/${body.name}`;
        body.level = parentData.level + 1;
        console.log('🔍 부모 폴더 정보:', { path: parentData.path, level: parentData.level });
      }
    } else {
      body.path = `/${body.name}`;
      body.level = 0;
    }

    // 다음 정렬 순서 가져오기
    const { data: maxOrderData } = await supabase
      .from('security_regulation_data')
      .select('sort_order')
      .eq('parent_id', body.parent_id || null)
      .order('sort_order', { ascending: false })
      .limit(1);

    body.sort_order = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].sort_order + 1 : 0;
    console.log('🔢 정렬 순서:', body.sort_order);

    // 데이터 삽입
    const insertData = {
      ...body,
      created_by: 'user',
      updated_by: 'user'
    };
    console.log('💾 삽입할 데이터:', insertData);

    const { data, error } = await supabase.from('security_regulation_data').insert([insertData]).select().single();

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

// PUT: 폴더/파일 수정
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

    // 데이터 업데이트
    const { data, error } = await supabase
      .from('security_regulation_data')
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

// DELETE: 폴더/파일 삭제 (소프트 삭제)
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

    // 하위 항목도 함께 비활성화 (재귀적)
    const { error } = await supabase
      .from('security_regulation_data')
      .update({
        is_active: false,
        updated_by: 'user',
        updated_at: new Date().toISOString()
      })
      .or(`id.eq.${id},parent_id.eq.${id}`);

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
