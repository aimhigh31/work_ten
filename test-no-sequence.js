require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNoSequence() {
  try {
    console.log('🧪 No 값 시퀀스 테스트 시작...\n');

    const checklistId = 24;

    // 1. 현재 상태 확인
    const { data: current } = await supabase
      .from('admin_checklist_editor')
      .select('no')
      .eq('checklist_id', checklistId)
      .order('no');

    console.log(`📊 체크리스트 ${checklistId}의 현재 no 값들:`, current.map(item => item.no));

    // 2. 여러 개 연속 추가 테스트
    const testItems = [];
    for (let i = 0; i < 3; i++) {
      // 매번 최신 max no 값 조회
      const { data: latestItems } = await supabase
        .from('admin_checklist_editor')
        .select('no')
        .eq('checklist_id', checklistId)
        .order('no', { ascending: false })
        .limit(1);

      const nextNo = latestItems && latestItems.length > 0 ? latestItems[0].no + 1 : 1;

      console.log(`\n➕ 항목 ${i + 1} 추가 시도 (no: ${nextNo})...`);

      const { data: created, error } = await supabase
        .from('admin_checklist_editor')
        .insert([{
          checklist_id: checklistId,
          no: nextNo,
          major_category: '시퀀스테스트',
          sub_category: '번호',
          title: `시퀀스 테스트 항목 ${nextNo}`,
          description: `No ${nextNo} 테스트`,
          evaluation: '대기',
          score: 0
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ 추가 실패: ${error.message}`);
        break;
      } else {
        console.log(`✅ 추가 성공! ID: ${created.id}, No: ${created.no}`);
        testItems.push(created.id);
      }
    }

    // 3. 최종 상태 확인
    const { data: final } = await supabase
      .from('admin_checklist_editor')
      .select('no, title')
      .eq('checklist_id', checklistId)
      .order('no');

    console.log('\n📊 최종 상태:');
    final.forEach(item => {
      console.log(`   No ${item.no}: ${item.title}`);
    });

    // 4. 테스트 항목 삭제
    if (testItems.length > 0) {
      console.log('\n🗑️ 테스트 항목 삭제 중...');
      for (const id of testItems) {
        await supabase
          .from('admin_checklist_editor')
          .delete()
          .eq('id', id);
      }
      console.log('✅ 테스트 항목 모두 삭제 완료');
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

testNoSequence();