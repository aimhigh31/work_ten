/**
 * DB 권한 컬럼 통합 마이그레이션 (Supabase Client 사용)
 *
 * can_create_data와 can_edit_own을 can_manage_own으로 통합
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일에 다음을 확인하세요:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL');
  console.log('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrate() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // 1. 현재 컬럼 확인
    console.log('📊 현재 테이블 구조 확인...');
    const { data: columns, error: colError } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .limit(1);

    if (colError) {
      console.error('❌ 테이블 조회 실패:', colError);
      return;
    }

    if (columns && columns.length > 0) {
      const firstRow = columns[0];
      console.log('현재 컬럼:', Object.keys(firstRow));

      if ('can_manage_own' in firstRow) {
        console.log('✅ can_manage_own 컬럼이 이미 존재합니다.');
      } else {
        console.log('⚠️  can_manage_own 컬럼이 없습니다. 수동으로 추가해야 합니다.');
      }

      if ('can_create_data' in firstRow) {
        console.log('✅ can_create_data 컬럼 존재');
      }
      if ('can_edit_own' in firstRow) {
        console.log('✅ can_edit_own 컬럼 존재');
      }
    }

    // 2. 마이그레이션 전 데이터 확인
    console.log('\n📊 마이그레이션 전 데이터 확인...');
    const { data: allPermissions, error: fetchError } = await supabase
      .from('admin_users_rules_permissions')
      .select('id, role_id, menu_id, can_create_data, can_edit_own, can_manage_own');

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError);
      return;
    }

    console.log(`전체 레코드: ${allPermissions?.length || 0}`);

    const needMigration = allPermissions?.filter(p =>
      (p.can_create_data || p.can_edit_own) && !p.can_manage_own
    );

    console.log(`마이그레이션 필요 레코드: ${needMigration?.length || 0}`);

    if (needMigration && needMigration.length > 0) {
      console.log('\n🔄 마이그레이션 시작...');

      let successCount = 0;
      let errorCount = 0;

      for (const perm of needMigration) {
        const newValue = perm.can_create_data || perm.can_edit_own;

        const { error: updateError } = await supabase
          .from('admin_users_rules_permissions')
          .update({ can_manage_own: newValue })
          .eq('id', perm.id);

        if (updateError) {
          console.error(`❌ ID ${perm.id} 업데이트 실패:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
        }
      }

      console.log(`\n✅ 마이그레이션 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);
    } else {
      console.log('\n✅ 마이그레이션할 데이터가 없습니다.');
    }

    // 3. 마이그레이션 후 데이터 확인
    console.log('\n📊 마이그레이션 후 데이터 확인...');
    const { data: afterData } = await supabase
      .from('admin_users_rules_permissions')
      .select('can_manage_own')
      .eq('can_manage_own', true);

    console.log(`can_manage_own = true 레코드: ${afterData?.length || 0}개`);

    // 4. 샘플 데이터 출력
    console.log('\n📋 샘플 데이터 (처음 5개):');
    const { data: sampleData } = await supabase
      .from('admin_users_rules_permissions')
      .select('role_id, menu_id, can_create_data, can_edit_own, can_manage_own, can_edit_others')
      .limit(5);

    console.table(sampleData);

    console.log('\n✅ 완료!');
    console.log('\n⚠️  참고: can_create_data와 can_edit_own 컬럼 제거는 수동으로 진행하세요.');
    console.log('   Supabase Dashboard > SQL Editor에서:');
    console.log('   ALTER TABLE admin_users_rules_permissions DROP COLUMN can_create_data;');
    console.log('   ALTER TABLE admin_users_rules_permissions DROP COLUMN can_edit_own;');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  }
}

migrate();
