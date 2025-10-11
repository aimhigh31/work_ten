require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestData() {
  try {
    console.log('🧹 미분류 테스트 데이터 정리 중...\n');

    // 미분류 데이터 찾기
    const { data: testItems, error: fetchError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .or('major_category.eq.미분류,sub_category.eq.미분류,title.like.체크리스트 항목%');

    if (fetchError) {
      console.error('❌ 조회 실패:', fetchError.message);
      return;
    }

    console.log(`📋 발견된 테스트 데이터: ${testItems.length}개`);

    if (testItems.length > 0) {
      console.log('\n삭제할 항목:');
      testItems.forEach(item => {
        console.log(`  - ID: ${item.id}, 제목: ${item.title}, 대분류: ${item.major_category}`);
      });

      console.log('\n🗑️ 테스트 데이터 삭제 중...');

      for (const item of testItems) {
        const { error: deleteError } = await supabase
          .from('admin_checklist_editor')
          .delete()
          .eq('id', item.id);

        if (deleteError) {
          console.error(`❌ ID ${item.id} 삭제 실패:`, deleteError.message);
        } else {
          console.log(`✅ ID ${item.id} 삭제 완료`);
        }
      }
    } else {
      console.log('✨ 정리할 테스트 데이터가 없습니다.');
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

cleanupTestData();