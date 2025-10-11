const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addIsActiveColumn() {
  console.log('🔄 it_education_data 테이블에 is_active 컬럼 추가 시작...');

  try {
    // is_active 컬럼 추가 (기본값 true)
    console.log('is_active 컬럼 추가 중...');
    const addColumnSql = `
      ALTER TABLE it_education_data
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `;

    const { error: addColumnError } = await supabase.rpc('exec', { sql: addColumnSql });

    if (addColumnError) {
      console.error('❌ 컬럼 추가 실패:', addColumnError);
      return;
    }

    console.log('✅ is_active 컬럼 추가 완료');

    // 기존 데이터의 is_active를 모두 true로 설정
    console.log('기존 데이터 is_active 업데이트 중...');
    const { error: updateError } = await supabase
      .from('it_education_data')
      .update({ is_active: true })
      .is('is_active', null);

    if (updateError) {
      console.error('❌ 기존 데이터 업데이트 실패:', updateError);
    } else {
      console.log('✅ 기존 데이터 is_active 업데이트 완료');
    }

    // 인덱스 추가
    console.log('is_active 인덱스 생성 중...');
    const createIndexSql = `
      CREATE INDEX IF NOT EXISTS idx_it_education_data_is_active
      ON it_education_data(is_active);
    `;

    const { error: indexError } = await supabase.rpc('exec', { sql: createIndexSql });

    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    // 현재 테이블 구조 확인
    console.log('\n📊 현재 테이블 데이터 확인...');
    const { data, error } = await supabase
      .from('it_education_data')
      .select('id, code, education_name, is_active')
      .limit(5);

    if (error) {
      console.error('❌ 데이터 조회 실패:', error);
    } else {
      console.log('현재 데이터:', data);
    }

    console.log('🎉 is_active 컬럼 설정 완료!');

  } catch (err) {
    console.error('❌ 컬럼 추가 중 오류:', err);
  }
}

addIsActiveColumn();