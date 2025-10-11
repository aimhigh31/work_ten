const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('환경변수 확인:', {
  url: supabaseUrl,
  keyExists: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔄 Supabase 연결 테스트 시작...');

  try {
    // 테이블 존재 확인
    const { data, error } = await supabase
      .from('it_education_data')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ 쿼리 실패:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }

    console.log('✅ 연결 성공! 데이터:', data?.length, '개 항목');
    console.log('📊 샘플 데이터:', data?.[0]);

    // RLS 정책 확인을 위한 추가 테스트
    console.log('\n🔒 RLS 정책 확인 중...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('현재 사용자:', authData?.user ? 'Authenticated' : 'Anonymous');

  } catch (err) {
    console.error('❌ 연결 테스트 실패:', err);
  }
}

testSupabaseConnection();