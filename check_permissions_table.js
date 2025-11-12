const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔍 admin_users_rules_permissions 테이블 조회 중...\n');

    // 테이블에서 한 행만 조회해서 컬럼 구조 확인
    const { data, error } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ 테이블에 데이터가 없습니다.');
      // 빈 테이블이라도 insert를 시도해서 컬럼 정보 확인
      const { error: insertError } = await supabase
        .from('admin_users_rules_permissions')
        .insert({})
        .select();

      if (insertError) {
        console.log('\n📋 테이블 컬럼 정보 (에러 메시지에서 추출):');
        console.log(insertError.message);
      }
      return;
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow);

    console.log('📋 admin_users_rules_permissions 테이블 컬럼:\n');
    columns.forEach((col, idx) => {
      const value = firstRow[col];
      const type = typeof value;
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${col.padEnd(30)} (${type})`);
    });

    console.log('\n✅ 총', columns.length, '개 컬럼');

    // 특정 컬럼 존재 여부 확인
    const requiredColumns = ['can_view_category', 'can_read_data', 'can_manage_own', 'can_edit_others'];

    console.log('\n🔍 필수 컬럼 존재 여부:');
    requiredColumns.forEach(col => {
      const exists = columns.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

checkTableStructure();
