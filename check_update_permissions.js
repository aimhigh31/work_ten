const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('환경변수 확인:', {
  url: supabaseUrl,
  serviceKeyExists: !!supabaseServiceKey
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUpdatePermissions() {
  console.log('🔄 업데이트 권한 및 RLS 정책 확인 시작...');

  try {
    // 1. 현재 RLS 정책 확인
    console.log('\n📊 현재 RLS 정책 확인...');
    const { data: policies, error: policyError } = await supabase.rpc('exec', {
      sql: `
        SELECT
          schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE tablename = 'it_education_data';
      `
    });

    if (policyError) {
      console.error('❌ 정책 조회 실패:', policyError);
    } else {
      console.log('현재 RLS 정책들:', policies);
    }

    // 2. 직접 업데이트 테스트 (Service Role로)
    console.log('\n🔧 Service Role로 직접 업데이트 테스트...');

    // 테스트할 데이터 찾기
    const { data: testData, error: findError } = await supabase
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

      // 업데이트 시도
      const { data: updateData, error: updateError } = await supabase
        .from('it_education_data')
        .update({
          is_active: !testData[0].is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select();

      if (updateError) {
        console.error('❌ Service Role 업데이트 실패:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
      } else {
        console.log('✅ Service Role 업데이트 성공:', updateData);

        // 원상복구
        await supabase
          .from('it_education_data')
          .update({
            is_active: testData[0].is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', testId);

        console.log('✅ 원상복구 완료');
      }
    }

    // 3. Anon Key로 테스트
    console.log('\n🔧 Anon Key로 업데이트 테스트...');
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (testData && testData.length > 0) {
      const testId = testData[0].id;

      const { data: anonUpdateData, error: anonUpdateError } = await anonSupabase
        .from('it_education_data')
        .update({
          is_active: !testData[0].is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select();

      if (anonUpdateError) {
        console.error('❌ Anon Key 업데이트 실패:', {
          message: anonUpdateError.message,
          details: anonUpdateError.details,
          hint: anonUpdateError.hint,
          code: anonUpdateError.code
        });

        // RLS 정책 재설정 시도
        console.log('\n🔧 RLS 정책 재설정 중...');

        // 기존 정책 삭제
        await supabase.rpc('exec', {
          sql: `DROP POLICY IF EXISTS "it_education_data_update_policy" ON it_education_data;`
        });

        // 새로운 업데이트 정책 생성
        const newUpdatePolicySQL = `
          CREATE POLICY "it_education_data_update_policy"
          ON it_education_data
          FOR UPDATE
          TO public
          USING (true)
          WITH CHECK (true);
        `;

        const { error: newPolicyError } = await supabase.rpc('exec', { sql: newUpdatePolicySQL });

        if (newPolicyError) {
          console.error('❌ 새 정책 생성 실패:', newPolicyError);
        } else {
          console.log('✅ 새 업데이트 정책 생성 완료');

          // 다시 테스트
          const { data: retryData, error: retryError } = await anonSupabase
            .from('it_education_data')
            .update({
              is_active: !testData[0].is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', testId)
            .select();

          if (retryError) {
            console.error('❌ 재시도 업데이트 실패:', retryError);
          } else {
            console.log('✅ 재시도 업데이트 성공:', retryData);

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

      } else {
        console.log('✅ Anon Key 업데이트 성공:', anonUpdateData);
      }
    }

  } catch (err) {
    console.error('❌ 권한 확인 중 오류:', err);
  }
}

checkUpdatePermissions();