// admin_systemsetting_menu 테이블에 menu_database 컬럼 추가
// 실행 방법: node scripts/add-menu-database-column.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '미설정');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '미설정');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMenuDatabaseColumn() {
  console.log('🔄 menu_database 컬럼 추가 시작...\n');

  try {
    // 1. menu_database 컬럼 추가
    console.log('1️⃣ menu_database 컬럼 추가 중...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE admin_systemsetting_menu
        ADD COLUMN IF NOT EXISTS menu_database TEXT;
      `
    });

    if (alterError) {
      // rpc가 없는 경우 직접 SQL 실행 시도
      console.log('⚠️ rpc 방식 실패, 직접 실행 시도...');

      const { error: directError } = await supabase
        .from('admin_systemsetting_menu')
        .select('menu_database')
        .limit(1);

      if (directError && directError.message.includes('column')) {
        console.error('❌ menu_database 컬럼이 존재하지 않습니다.');
        console.log('\n📝 Supabase Dashboard에서 직접 SQL을 실행해주세요:');
        console.log('-------------------------------------------');
        console.log('ALTER TABLE admin_systemsetting_menu');
        console.log('ADD COLUMN IF NOT EXISTS menu_database TEXT;');
        console.log('-------------------------------------------\n');
        process.exit(1);
      }
    }

    console.log('✅ menu_database 컬럼 추가 완료\n');

    // 2. 컬럼 추가 확인
    console.log('2️⃣ 컬럼 추가 확인 중...');
    const { data: columns, error: checkError } = await supabase
      .from('admin_systemsetting_menu')
      .select('menu_database')
      .limit(1);

    if (checkError) {
      console.error('❌ 컬럼 확인 실패:', checkError.message);
      console.log('\n📝 Supabase Dashboard에서 직접 확인해주세요.');
      process.exit(1);
    }

    console.log('✅ menu_database 컬럼이 정상적으로 추가되었습니다.\n');

    // 3. 기존 데이터 확인
    console.log('3️⃣ 기존 데이터 확인 중...');
    const { data: menus, error: selectError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_database')
      .limit(5);

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError.message);
    } else {
      console.log('✅ 현재 데이터 (최대 5개):');
      console.table(menus);
    }

    console.log('\n✨ 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 예상치 못한 오류 발생:', error);
    console.log('\n📝 Supabase Dashboard > SQL Editor에서 다음 SQL을 직접 실행해주세요:');
    console.log('-------------------------------------------');
    console.log('ALTER TABLE admin_systemsetting_menu');
    console.log('ADD COLUMN IF NOT EXISTS menu_database TEXT;');
    console.log('-------------------------------------------\n');
    process.exit(1);
  }
}

addMenuDatabaseColumn();
