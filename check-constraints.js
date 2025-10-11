require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  try {
    console.log('🔄 데이터베이스 제약 조건 확인 중...');

    // 현재 데이터 확인
    const { data: currentData, error: selectError } = await supabase
      .from('admin_checklist_editor')
      .select('checklist_id, no, id, title')
      .order('checklist_id')
      .order('no');

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError.message);
      return;
    }

    console.log('\n📋 현재 에디터 데이터:');
    currentData.forEach(item => {
      console.log(`  ID: ${item.id}, 체크리스트: ${item.checklist_id}, No: ${item.no}, 제목: ${item.title}`);
    });

    // 중복 확인
    const duplicates = {};
    currentData.forEach(item => {
      const key = `${item.checklist_id}-${item.no}`;
      if (duplicates[key]) {
        duplicates[key].push(item);
      } else {
        duplicates[key] = [item];
      }
    });

    console.log('\n🔍 중복 체크:');
    let hasDuplicates = false;
    Object.keys(duplicates).forEach(key => {
      if (duplicates[key].length > 1) {
        hasDuplicates = true;
        console.log(`❌ 중복 발견: ${key}`);
        duplicates[key].forEach(item => {
          console.log(`    ID: ${item.id}, 제목: ${item.title}`);
        });
      }
    });

    if (!hasDuplicates) {
      console.log('✅ 중복 데이터 없음');
    }

    // 각 체크리스트의 다음 no 값 계산
    const nextNoByChecklist = {};
    currentData.forEach(item => {
      if (!nextNoByChecklist[item.checklist_id] || nextNoByChecklist[item.checklist_id] <= item.no) {
        nextNoByChecklist[item.checklist_id] = item.no + 1;
      }
    });

    console.log('\n📈 각 체크리스트의 다음 no 값:');
    Object.keys(nextNoByChecklist).forEach(checklistId => {
      console.log(`  체크리스트 ${checklistId}: 다음 no = ${nextNoByChecklist[checklistId]}`);
    });

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  }
}

checkConstraints();