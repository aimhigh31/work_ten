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

// 플랫 데이터를 구조화된 객체로 변환
function flatToStructured(flatData: any[]) {
  const result: any = {
    overview: {},
    editorItems: []
  };

  // checklist_id별로 그룹화
  const groupedData: any = {};

  flatData.forEach((row) => {
    if (!groupedData[row.checklist_id]) {
      groupedData[row.checklist_id] = {
        overview: {},
        editorItems: {}
      };
    }

    if (row.data_type === 'overview') {
      groupedData[row.checklist_id].overview[row.field_name] = row.field_value;
    } else if (row.data_type === 'editor_item') {
      if (!groupedData[row.checklist_id].editorItems[row.item_no]) {
        groupedData[row.checklist_id].editorItems[row.item_no] = {};
      }
      groupedData[row.checklist_id].editorItems[row.item_no][row.field_name] = row.field_value;
    }
  });

  // 첫 번째 checklist_id의 데이터 반환 (단일 체크리스트 조회용)
  const checklistIds = Object.keys(groupedData);
  if (checklistIds.length > 0) {
    const firstId = checklistIds[0];
    result.overview = groupedData[firstId].overview;

    // editorItems를 배열로 변환
    const editorItemsObj = groupedData[firstId].editorItems;
    result.editorItems = Object.keys(editorItemsObj)
      .sort((a, b) => Number(a) - Number(b))
      .map((itemNo) => ({
        item_no: Number(itemNo),
        ...editorItemsObj[itemNo]
      }));
  }

  return result;
}

// 구조화된 데이터를 플랫 구조로 변환
function structuredToFlat(checklistId: number, data: any) {
  const flatData: any[] = [];

  // 개요 데이터 변환
  if (data.overview) {
    Object.entries(data.overview).forEach(([field_name, field_value], index) => {
      flatData.push({
        checklist_id: checklistId,
        data_type: 'overview',
        item_no: null,
        field_name,
        field_value: String(field_value || ''),
        sequence_no: index
      });
    });
  }

  // 에디터 항목 데이터 변환
  if (data.editorItems && Array.isArray(data.editorItems)) {
    data.editorItems.forEach((item: any, itemIndex: number) => {
      const item_no = item.item_no || itemIndex + 1;

      Object.entries(item).forEach(([field_name, field_value], fieldIndex) => {
        if (field_name !== 'item_no') {
          flatData.push({
            checklist_id: checklistId,
            data_type: 'editor_item',
            item_no,
            field_name,
            field_value: String(field_value || ''),
            sequence_no: fieldIndex
          });
        }
      });
    });
  }

  return flatData;
}

// GET: 체크리스트 데이터 조회
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

    console.log('📊 체크리스트 데이터 조회:', checklistId);

    const { data, error } = await supabase
      .from('admin_checklist_data')
      .select('*')
      .eq('checklist_id', checklistId)
      .eq('is_active', true)
      .order('data_type', { ascending: true })
      .order('item_no', { ascending: true })
      .order('sequence_no', { ascending: true });

    if (error) {
      console.error('조회 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    // 플랫 데이터를 구조화된 형태로 변환
    const structuredData = flatToStructured(data || []);

    return NextResponse.json({
      success: true,
      data: structuredData
    });
  } catch (error) {
    console.error('체크리스트 데이터 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 데이터 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// POST: 체크리스트 데이터 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checklist_id, data } = body;

    if (!checklist_id) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 ID가 필요합니다.'
        },
        { status: 400 }
      );
    }

    console.log('💾 체크리스트 데이터 저장 시작:', checklist_id);

    // 1. 기존 데이터 삭제
    const { error: deleteError } = await supabase.from('admin_checklist_data').delete().eq('checklist_id', checklist_id);

    if (deleteError) {
      console.error('기존 데이터 삭제 실패:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: '기존 데이터 삭제에 실패했습니다.'
        },
        { status: 500 }
      );
    }

    // 2. 구조화된 데이터를 플랫 구조로 변환
    const flatData = structuredToFlat(checklist_id, data);

    if (flatData.length === 0) {
      console.log('저장할 데이터가 없습니다.');
      return NextResponse.json({
        success: true,
        message: '데이터가 삭제되었습니다.'
      });
    }

    // 3. 새 데이터 삽입
    const insertData = flatData.map((row) => ({
      ...row,
      created_by: 'user',
      updated_by: 'user',
      is_active: true
    }));

    console.log(`📝 ${insertData.length}개 필드 저장 중...`);

    const { data: savedData, error: insertError } = await supabase.from('admin_checklist_data').insert(insertData).select();

    if (insertError) {
      console.error('데이터 삽입 실패:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: '데이터 저장에 실패했습니다.'
        },
        { status: 500 }
      );
    }

    console.log('✅ 체크리스트 데이터 저장 완료');

    return NextResponse.json({
      success: true,
      data: savedData,
      message: `${savedData?.length || 0}개 필드가 저장되었습니다.`
    });
  } catch (error) {
    console.error('체크리스트 데이터 저장 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 데이터 저장에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// PUT: 체크리스트 데이터 부분 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { checklist_id, field_updates } = body;

    if (!checklist_id || !field_updates) {
      return NextResponse.json(
        {
          success: false,
          error: '체크리스트 ID와 업데이트 필드가 필요합니다.'
        },
        { status: 400 }
      );
    }

    console.log('🔄 체크리스트 필드 업데이트:', checklist_id);

    const updates = [];

    for (const update of field_updates) {
      const { data_type, item_no, field_name, field_value } = update;

      const { error } = await supabase
        .from('admin_checklist_data')
        .update({
          field_value: String(field_value || ''),
          updated_by: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('checklist_id', checklist_id)
        .eq('data_type', data_type)
        .eq('field_name', field_name)
        .eq(item_no ? 'item_no' : 'checklist_id', item_no || checklist_id);

      if (error) {
        console.error(`필드 업데이트 실패 (${field_name}):`, error);
      } else {
        updates.push({ field_name, success: true });
      }
    }

    return NextResponse.json({
      success: true,
      updates,
      message: `${updates.length}개 필드가 업데이트되었습니다.`
    });
  } catch (error) {
    console.error('체크리스트 데이터 업데이트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 데이터 업데이트에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

// DELETE: 체크리스트 데이터 삭제
export async function DELETE(request: NextRequest) {
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

    console.log('🗑️ 체크리스트 데이터 삭제:', checklistId);

    const { error } = await supabase.from('admin_checklist_data').delete().eq('checklist_id', checklistId);

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

    console.log('✅ 체크리스트 데이터 삭제 완료');

    return NextResponse.json({
      success: true,
      message: '체크리스트 데이터가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('체크리스트 데이터 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '체크리스트 데이터 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}
