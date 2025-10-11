const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  console.log('🔄 it_education_data 테이블 RLS 비활성화 시작...');

  try {
    // 1. 기존 RLS 정책들 모두 삭제
    console.log('기존 RLS 정책 삭제 중...');

    const policies = [
      'it_education_data_select_policy',
      'it_education_data_insert_policy',
      'it_education_data_update_policy',
      'it_education_data_delete_policy'
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('exec', {
          sql: `DROP POLICY IF EXISTS "${policy}" ON it_education_data;`
        });
        console.log(`✅ ${policy} 삭제 완료`);
      } catch (error) {
        console.log(`ℹ️ ${policy} 삭제 스킵:`, error.message);
      }
    }

    // 2. RLS 비활성화
    console.log('RLS 비활성화 중...');
    const { error: disableError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE it_education_data DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.error('❌ RLS 비활성화 실패:', disableError);
    } else {
      console.log('✅ RLS 비활성화 완료');
    }

    // 3. 테스트용 업데이트 실행
    console.log('\n🔧 RLS 비활성화 후 업데이트 테스트...');

    // Anon Key로 테스트
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 테스트할 데이터 찾기
    const { data: testData, error: findError } = await anonSupabase
      .from('it_education_data')
      .select('id, education_name, is_active')
      .limit(1);

    if (findError) {
      console.error('❌ 테스트 데이터 조회 실패:', findError);
      return;
    }

    if (testData && testData.length > 0) {
      const testId = testData[0].id;
      console.log(`테스트 대상: ID ${testId}, 이름: ${testData[0].education_name}, 활성: ${testData[0].is_active}`);

      // 업데이트 테스트
      const { data: updateData, error: updateError } = await anonSupabase
        .from('it_education_data')
        .update({
          is_active: !testData[0].is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select();

      if (updateError) {
        console.error('❌ 업데이트 실패:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
      } else {
        console.log('✅ 업데이트 성공:', updateData);

        // 원상복구
        await anonSupabase
          .from('it_education_data')
          .update({
            is_active: testData[0].is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', testId);

        console.log('✅ 원상복구 완료');
      }
    }

    console.log('\n🎉 RLS 비활성화 완료! 이제 권한 문제 없이 데이터를 수정할 수 있습니다.');

  } catch (err) {
    console.error('❌ RLS 비활성화 중 오류:', err);
  }
}

disableRLS();