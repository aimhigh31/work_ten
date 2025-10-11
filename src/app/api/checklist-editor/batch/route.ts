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

// POST: 체크리스트 에디터 항목 일괄 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checklist_id, items } = body;

    if (!checklist_id) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    console.log('🔄 체크리스트 에디터 일괄 저장 시작:', { checklist_id, itemCount: items?.length || 0 });

    // 먼저 해당 체크리스트의 기존 항목들을 모두 삭제
    const { error: deleteError } = await supabase.from('admin_checklist_editor').delete().eq('checklist_id', checklist_id);

    if (deleteError) {
      console.error('기존 항목 삭제 실패:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: '기존 항목 삭제에 실패했습니다: ' + deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('🗑️ 기존 항목 삭제 완료');

    // items가 없거나 빈 배열이면 삭제만 하고 종료
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('✅ 모든 항목이 삭제되었습니다.');
      return NextResponse.json({
        success: true,
        data: [],
        message: '모든 항목이 삭제되었습니다.'
      });
    }

    console.log('➕ 새 항목 생성 시작:', { checklist_id, itemCount: items.length });

    // 새 항목들을 일괄 생성
    const insertItems = items.map((item, index) => ({
      checklist_id: checklist_id,
      no: item.no || index + 1,
      major_category: item.major_category || '',
      sub_category: item.sub_category || '',
      title: item.title || '',
      description: item.description || '',
      evaluation: item.evaluation || '대기',
      score: item.score || 0,
      created_by: 'user',
      updated_by: 'user',
      is_active: true
    }));

    console.log('📝 생성할 항목들:', insertItems);

    const { data, error } = await supabase.from('admin_checklist_editor').insert(insertItems).select();

    if (error) {
      console.error('항목 생성 실패:', error);
      return NextResponse.json(
        {
          success: false,
          error: '항목 생성에 실패했습니다: ' + error.message
        },
        { status: 500 }
      );
    }

    console.log('✅ 체크리스트 에디터 일괄 저장 완료:', data?.length || 0, '개 항목');

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `${data?.length || 0}개 항목이 성공적으로 저장되었습니다.`
    });
  } catch (error) {
    console.error('체크리스트 에디터 일괄 저장 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 에디터 항목 일괄 저장에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
