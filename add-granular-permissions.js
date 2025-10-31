/**
 * 세밀한 권한 제어를 위한 DB 스키마 확장
 *
 * 사용법: node add-granular-permissions.js
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addGranularPermissions() {
  try {
    console.log('\n=== 세밀한 권한 제어 DB 스키마 확장 ===\n');

    // 1. 컬럼 존재 여부 확인
    console.log('📋 1단계: 테이블 스키마 확인 중...');

    const { data: testData, error: testError } = await supabase
      .from('admin_users_rules_permissions')
      .select('can_view_category')
      .limit(1);

    if (testError && testError.message.includes('column')) {
      console.log('\n⚠️ 새 컬럼이 아직 생성되지 않았습니다!');
      console.log('\n💡 다음 SQL을 Supabase SQL Editor에서 실행해주세요:');
      console.log('   (Supabase Dashboard → SQL Editor → New Query)\n');
      console.log('='.repeat(70));
      console.log(`
ALTER TABLE admin_users_rules_permissions
ADD COLUMN IF NOT EXISTS can_view_category BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_read_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_create_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_own BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_others BOOLEAN DEFAULT false;
      `);
      console.log('='.repeat(70));
      console.log('\nSQL 실행 후 이 스크립트를 다시 실행해주세요.');
      return;
    }

    console.log('✅ 새 컬럼이 이미 존재합니다.\n');

    // 2. 기존 데이터 마이그레이션
    console.log('📋 2단계: 기존 데이터 마이그레이션 중...');

    // can_read -> can_view_category, can_read_data
    const { error: readError } = await supabase
      .from('admin_users_rules_permissions')
      .update({
        can_view_category: true,
        can_read_data: true
      })
      .eq('can_read', true);

    if (readError) {
      console.error('❌ can_read 마이그레이션 실패:', readError.message);
    } else {
      console.log('✅ can_read 권한 마이그레이션 완료');
    }

    // can_write -> can_create_data, can_edit_own
    const { error: writeError } = await supabase
      .from('admin_users_rules_permissions')
      .update({
        can_create_data: true,
        can_edit_own: true
      })
      .eq('can_write', true);

    if (writeError) {
      console.error('❌ can_write 마이그레이션 실패:', writeError.message);
    } else {
      console.log('✅ can_write 권한 마이그레이션 완료');
    }

    // can_full -> can_edit_others
    const { error: fullError } = await supabase
      .from('admin_users_rules_permissions')
      .update({
        can_edit_others: true
      })
      .eq('can_full', true);

    if (fullError) {
      console.error('❌ can_full 마이그레이션 실패:', fullError.message);
    } else {
      console.log('✅ can_full 권한 마이그레이션 완료\n');
    }

    // 3. 확인
    console.log('📋 3단계: 마이그레이션 결과 확인...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('admin_users_rules_permissions')
      .select('role_id, menu_id, can_read, can_write, can_full, can_view_category, can_read_data, can_create_data, can_edit_own, can_edit_others')
      .limit(5);

    if (sampleError) {
      console.error('❌ 샘플 데이터 조회 실패:', sampleError.message);
    } else {
      console.log('\n✅ 샘플 데이터 (첫 5개 행):');
      console.table(sampleData);
    }

    // 4. 통계
    const { count: totalCount } = await supabase
      .from('admin_users_rules_permissions')
      .select('*', { count: 'exact', head: true });

    const { count: viewCategoryCount } = await supabase
      .from('admin_users_rules_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('can_view_category', true);

    const { count: readDataCount } = await supabase
      .from('admin_users_rules_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('can_read_data', true);

    const { count: createDataCount } = await supabase
      .from('admin_users_rules_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('can_create_data', true);

    const { count: editOwnCount } = await supabase
      .from('admin_users_rules_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('can_edit_own', true);

    const { count: editOthersCount } = await supabase
      .from('admin_users_rules_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('can_edit_others', true);

    console.log('\n📊 마이그레이션 통계:');
    console.log(`  전체 권한 레코드: ${totalCount}개`);
    console.log(`  카테고리 보기 권한: ${viewCategoryCount}개`);
    console.log(`  데이터 조회 권한: ${readDataCount}개`);
    console.log(`  데이터 새로쓰기 권한: ${createDataCount}개`);
    console.log(`  나의 데이터 편집 권한: ${editOwnCount}개`);
    console.log(`  타인 데이터 편집 권한: ${editOthersCount}개\n`);

    console.log('✅ 모든 마이그레이션 완료!');
    console.log('\n💡 다음 단계:');
    console.log('   1. authMiddleware.ts 권한 체크 로직 수정');
    console.log('   2. RoleEditDialog.tsx 저장 로직 수정');
    console.log('   3. usePermissions 훅 확장');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
addGranularPermissions();
