// 프론트엔드 시스템설정 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSystemSettingsFrontend() {
  console.log('🔄 프론트엔드 시스템설정 테스트 시작...');
  
  try {
    // 1. 현재 설정 조회 테스트
    console.log('\n1️⃣ 현재 설정 조회 테스트...');
    const { data: currentSettings, error: fetchError } = await supabase
      .from('admin_systemsetting_system')
      .select('*')
      .eq('is_active', true)
      .order('setting_key');

    if (fetchError) {
      console.error('❌ 설정 조회 실패:', fetchError);
      throw fetchError;
    }

    console.log(`✅ ${currentSettings.length}개 설정 조회 성공:`);
    currentSettings.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`);
    });

    // 2. 설정 업데이트 테스트
    console.log('\n2️⃣ 설정 업데이트 테스트...');
    
    const testUpdateData = {
      setting_key: 'site_name',
      setting_value: 'FRONTEND_TEST_NAME',
      setting_type: 'general',
      is_active: true,
      updated_at: new Date().toISOString()
    };

    console.log('업데이트할 데이터:', JSON.stringify(testUpdateData, null, 2));

    const { data: updateResult, error: updateError } = await supabase
      .from('admin_systemsetting_system')
      .upsert(testUpdateData, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ 설정 업데이트 실패:', updateError);
      console.log('에러 상세:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      throw updateError;
    }

    console.log('✅ 설정 업데이트 성공:', updateResult);

    // 3. 업데이트 확인
    console.log('\n3️⃣ 업데이트 확인...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('admin_systemsetting_system')
      .select('*')
      .eq('setting_key', 'site_name')
      .single();

    if (verifyError) {
      console.error('❌ 업데이트 확인 실패:', verifyError);
    } else {
      console.log('✅ 업데이트 확인됨:', verifyData);
    }

    // 4. 원래값으로 복구
    console.log('\n4️⃣ 원래값으로 복구...');
    const { data: restoreResult, error: restoreError } = await supabase
      .from('admin_systemsetting_system')
      .upsert({
        setting_key: 'site_name',
        setting_value: 'NEXWORK2',
        setting_type: 'general',
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (restoreError) {
      console.error('❌ 복구 실패:', restoreError);
    } else {
      console.log('✅ 원래값으로 복구 완료:', restoreResult);
    }

    // 5. RLS 정책 확인
    console.log('\n5️⃣ RLS 정책 테스트...');
    
    // 인증 없이 읽기 시도
    const { data: publicReadTest, error: publicReadError } = await supabase
      .from('admin_systemsetting_system')
      .select('setting_key, setting_value')
      .limit(1);

    if (publicReadError) {
      console.log('⚠️ 공개 읽기 실패 (RLS가 활성화됨):', publicReadError.message);
    } else {
      console.log('✅ 공개 읽기 성공:', publicReadTest);
    }

    return true;
  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error);
    return false;
  }
}

testSystemSettingsFrontend().then((success) => {
  if (success) {
    console.log('\n🎉 프론트엔드 시스템설정 테스트 완료!');
    console.log('✅ Supabase 연결 및 CRUD 작업 정상');
  } else {
    console.log('\n❌ 프론트엔드 시스템설정 테스트 실패');
    console.log('💡 RLS 정책이나 권한 문제일 수 있습니다.');
  }
  process.exit(success ? 0 : 1);
});