require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDuplicateIssue() {
  try {
    console.log('🔍 중복 문제 분석 시작...\n');

    // 모든 체크리스트별로 현재 상황 확인
    const { data: allItems, error } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .order('checklist_id')
      .order('no');

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      return;
    }

    // 체크리스트별로 그룹화
    const byChecklist = {};
    allItems.forEach(item => {
      if (!byChecklist[item.checklist_id]) {
        byChecklist[item.checklist_id] = [];
      }
      byChecklist[item.checklist_id].push(item);
    });

    console.log('📊 체크리스트별 현황:\n');
    Object.keys(byChecklist).forEach(checklistId => {
      const items = byChecklist[checklistId];
      const nos = items.map(item => item.no);
      const duplicateNos = nos.filter((no, index) => nos.indexOf(no) !== index);

      console.log(`체크리스트 ID: ${checklistId}`);
      console.log(`  총 항목 수: ${items.length}`);
      console.log(`  No 값들: [${nos.join(', ')}]`);

      if (duplicateNos.length > 0) {
        console.log(`  ❌ 중복된 No: [${[...new Set(duplicateNos)].join(', ')}]`);
      } else {
        console.log(`  ✅ 중복 없음`);
      }

      console.log(`  다음 사용 가능한 No: ${Math.max(...nos) + 1}\n`);
    });

    // 테스트: 새 항목 추가 시뮬레이션
    console.log('🧪 새 항목 추가 시뮬레이션:\n');
    const testChecklistId = 24;

    if (byChecklist[testChecklistId]) {
      const existingNos = byChecklist[testChecklistId].map(item => item.no);
      const nextNo = Math.max(...existingNos) + 1;

      console.log(`체크리스트 ${testChecklistId}에 새 항목 추가 시:`);
      console.log(`  현재 No 값들: [${existingNos.join(', ')}]`);
      console.log(`  계산된 다음 No: ${nextNo}`);

      // 실제로 추가 시도
      const newItem = {
        checklist_id: testChecklistId,
        no: nextNo,
        major_category: '테스트',
        sub_category: '분석',
        title: `시뮬레이션 테스트 ${nextNo}`,
        description: '중복 분석을 위한 테스트',
        evaluation: '대기',
        score: 0
      };

      console.log('\n실제 추가 시도...');
      const { data: created, error: createError } = await supabase
        .from('admin_checklist_editor')
        .insert([newItem])
        .select();

      if (createError) {
        console.error(`❌ 추가 실패: ${createError.message}`);
        if (createError.message.includes('duplicate key')) {
          console.error('   → Unique constraint 위반 발생!');
          console.error('   → 데이터베이스에 (checklist_id, no) 조합에 대한 unique constraint가 있습니다.');
        }
      } else {
        console.log(`✅ 추가 성공! ID: ${created[0].id}`);

        // 테스트 항목 삭제
        await supabase
          .from('admin_checklist_editor')
          .delete()
          .eq('id', created[0].id);
        console.log('   → 테스트 항목 삭제 완료');
      }
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

analyzeDuplicateIssue();