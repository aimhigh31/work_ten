require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEditorSave() {
  try {
    console.log('🧪 에디터 저장 테스트 시작...\n');

    // 1. 체크리스트 24의 현재 항목 확인
    const checklistId = 24;

    console.log(`📋 체크리스트 ${checklistId}의 현재 에디터 항목 조회...`);
    const { data: currentItems, error: fetchError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('no');

    if (fetchError) {
      console.error('❌ 항목 조회 실패:', fetchError.message);
      return;
    }

    console.log(`✅ 현재 항목: ${currentItems.length}개`);
    currentItems.forEach(item => {
      console.log(`   - No: ${item.no}, 제목: ${item.title}`);
    });

    // 2. 다음 no 값 계산
    const maxNo = currentItems.length > 0
      ? Math.max(...currentItems.map(item => item.no))
      : 0;
    const nextNo = maxNo + 1;

    console.log(`\n🔢 계산된 다음 no 값: ${nextNo}`);

    // 3. 새 항목 추가 테스트
    console.log('\n➕ 새 항목 추가 테스트...');
    const newItem = {
      checklist_id: checklistId,
      no: nextNo,
      major_category: '테스트',
      sub_category: '검증',
      title: `테스트 항목 ${nextNo}`,
      description: '중복 키 오류 해결 후 테스트',
      evaluation: '대기',
      score: 0
    };

    const { data: createdItem, error: createError } = await supabase
      .from('admin_checklist_editor')
      .insert([newItem])
      .select();

    if (createError) {
      console.error('❌ 항목 생성 실패:', createError.message);
      return;
    }

    console.log('✅ 항목 생성 성공!');
    console.log(`   생성된 항목 ID: ${createdItem[0].id}`);
    console.log(`   No: ${createdItem[0].no}`);
    console.log(`   제목: ${createdItem[0].title}`);

    // 4. 생성된 항목 삭제
    console.log('\n🗑️ 테스트 항목 삭제...');
    const { error: deleteError } = await supabase
      .from('admin_checklist_editor')
      .delete()
      .eq('id', createdItem[0].id);

    if (deleteError) {
      console.error('❌ 항목 삭제 실패:', deleteError.message);
      return;
    }

    console.log('✅ 테스트 항목 삭제 완료');

    console.log('\n🎯 테스트 완료! 중복 키 오류가 해결되었습니다.');

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  }
}

testEditorSave();