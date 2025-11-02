const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('🔍 hr_evaluation_data 테이블 데이터 조회 중...\n');

    // 최신 데이터 1개 조회 (모든 컬럼 확인)
    const { data, error } = await supabase
      .from('hr_evaluation_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ 조회 오류:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ 테이블에 데이터가 없습니다.');
      return;
    }

    console.log('✅ 데이터 조회 성공!\n');
    console.log('📊 테이블 컬럼 목록:');
    console.log('='.repeat(80));

    const record = data[0];
    Object.keys(record).sort().forEach(key => {
      const value = record[key];
      const type = typeof value;
      const preview = value === null ? 'NULL' :
                      type === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` :
                      type === 'object' ? JSON.stringify(value).substring(0, 50) :
                      value;

      console.log(`${key.padEnd(30)} : ${type.padEnd(10)} = ${preview}`);
    });

    console.log('='.repeat(80));
    console.log('\n✅ 전체 컬럼 수:', Object.keys(record).length);

    // checklist 관련 컬럼 확인
    console.log('\n🔍 Checklist 관련 컬럼:');
    const checklistKeys = Object.keys(record).filter(key =>
      key.toLowerCase().includes('checklist') ||
      key.toLowerCase().includes('guide')
    );

    if (checklistKeys.length > 0) {
      checklistKeys.forEach(key => {
        console.log(`  ✓ ${key}: ${record[key] === null ? 'NULL' : typeof record[key]}`);
        if (record[key]) {
          console.log(`    값: ${JSON.stringify(record[key]).substring(0, 100)}`);
        }
      });
    } else {
      console.log('  ❌ checklist 또는 guide 관련 컬럼이 없습니다!');
    }

    console.log('\n🔍 전체 데이터:');
    console.log(JSON.stringify(data[0], null, 2));

  } catch (err) {
    console.error('❌ 실행 중 오류:', err);
    process.exit(1);
  }
}

checkSchema();
