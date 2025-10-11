require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log('🔍 admin_checklist_data 테이블 스키마 확인 중...\n');

    // 테이블에 데이터 하나만 조회해서 컬럼 확인
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      console.error('상세 에러:', error);
      return;
    }

    console.log('📋 테이블 존재 확인: ✅');

    if (data && data.length > 0) {
      console.log('\n📊 컬럼 목록:');
      Object.keys(data[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof data[0][column]} (값: ${data[0][column]})`);
      });
    } else {
      console.log('\n⚠️ 테이블은 존재하지만 데이터가 없습니다.');

      // 빈 데이터로 테스트 삽입 시도
      console.log('\n🧪 테스트 삽입으로 스키마 확인...');
      const testData = {
        registration_date: new Date().toISOString().split('T')[0],
        code: 'TEST001',
        work_content: '테스트 체크리스트',
        description: '스키마 확인용 테스트',
        status: '대기',
        team: '테스트팀',
        assignee: 'TEST',
        department: 'TEST'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('admin_checklist_data')
        .insert([testData])
        .select();

      if (insertError) {
        console.error('❌ 삽입 실패:', insertError.message);

        // snake_case가 아닌 camelCase로 시도
        console.log('\n🔄 다른 형식으로 재시도...');
        const testData2 = {
          work_content: '테스트 체크리스트',
          status: '대기'
        };

        const { data: insertData2, error: insertError2 } = await supabase
          .from('admin_checklist_data')
          .insert([testData2])
          .select();

        if (insertError2) {
          console.error('❌ 재시도도 실패:', insertError2.message);
        } else {
          console.log('✅ 삽입 성공! 컬럼 확인:');
          Object.keys(insertData2[0]).forEach(column => {
            console.log(`   - ${column}`);
          });

          // 테스트 데이터 삭제
          await supabase
            .from('admin_checklist_data')
            .delete()
            .eq('id', insertData2[0].id);
          console.log('🗑️ 테스트 데이터 삭제 완료');
        }
      } else {
        console.log('✅ 삽입 성공! 컬럼 확인:');
        Object.keys(insertData[0]).forEach(column => {
          console.log(`   - ${column}`);
        });

        // 테스트 데이터 삭제
        await supabase
          .from('admin_checklist_data')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

checkSchema();