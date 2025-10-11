#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const tables = [
  'admin_mastercode_code',
  'admin_mastercode_data',
  'admin_systemsetting_menu',
  'admin_users_department',
  'admin_users_userprofiles',
  'admin_usersettings_role',
  'common_feedback_data',
  'it_education_attendee',
  'it_education_curriculum',
  'it_education_data',
  'it_hardware_data',
  'it_hardware_history',
  'it_hardware_user',
  'it_software_data',
  'it_software_history',
  'it_software_user',
  'it_solution_data',
  'it_voc_data',
  'main_calendar_data',
  'main_cost_data',
  'main_cost_finance',
  'main_education_data',
  'main_kpi_data',
  'main_kpi_record',
  'main_kpi_task',
  'main_task_data',
  'plan_investment_data',
  'plan_investment_finance',
  'plan_task_management',
  'security_accident_data',
  'security_accident_improvement',
  'security_accident_report',
  'security_education_attendee',
  'security_education_curriculum',
  'security_education_data',
  'security_inspection_data',
  'security_inspection_opl'
];

async function analyzeAllTables() {
  console.log('🔍 모든 테이블 상세 분석 시작...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const existingTables = [];
  const missingTables = [];

  console.log('📊 테이블 존재 여부 확인 중...\n');
  console.log('=' .repeat(100));

  for (const tableName of tables) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      missingTables.push(tableName);
      console.log(`❌ ${tableName.padEnd(40)} | 미존재 또는 접근 불가`);
    } else {
      existingTables.push({ name: tableName, count: count || 0 });
      console.log(`✅ ${tableName.padEnd(40)} | 데이터: ${(count || 0).toString().padStart(5)}개`);
    }
  }

  console.log('\n\n' + '=' .repeat(100));
  console.log(`\n📈 통계: 존재 ${existingTables.length}개 / 미존재 ${missingTables.length}개 / 전체 ${tables.length}개\n`);

  // 존재하는 테이블 상세 분석
  console.log('\n📋 존재하는 테이블 상세 정보\n');
  console.log('=' .repeat(100));

  for (const table of existingTables) {
    console.log(`\n▶ ${table.name} (총 ${table.count}개 레코드)`);
    console.log('-'.repeat(100));

    const { data } = await supabase
      .from(table.name)
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`  컬럼 수: ${columns.length}개`);
      console.log(`  컬럼 목록:`);

      // 주요 컬럼만 표시 (처음 15개)
      const displayColumns = columns.slice(0, 15);
      displayColumns.forEach((col, idx) => {
        const value = data[0][col];
        const type = value === null ? 'null' : typeof value;
        const preview = value !== null && value !== undefined
          ? (typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 30))
          : 'null';

        console.log(`    ${(idx + 1).toString().padStart(2)}. ${col.padEnd(30)} | ${type.padEnd(10)} | ${preview}`);
      });

      if (columns.length > 15) {
        console.log(`    ... 외 ${columns.length - 15}개 컬럼`);
      }
    } else if (table.count === 0) {
      console.log(`  ⚠️  데이터가 비어있어 컬럼 정보를 확인할 수 없습니다.`);
    }
  }

  // 카테고리별 통계
  console.log('\n\n📊 카테고리별 통계\n');
  console.log('=' .repeat(100));

  const categoryStats = {
    'ADMIN (관리)': existingTables.filter(t => t.name.startsWith('admin_')),
    'MAIN (메인)': existingTables.filter(t => t.name.startsWith('main_')),
    'SECURITY (보안)': existingTables.filter(t => t.name.startsWith('security_')),
    'IT (IT관리)': existingTables.filter(t => t.name.startsWith('it_')),
    'PLAN (계획)': existingTables.filter(t => t.name.startsWith('plan_')),
    'COMMON (공통)': existingTables.filter(t => t.name.startsWith('common_'))
  };

  Object.entries(categoryStats).forEach(([category, tables]) => {
    const totalRecords = tables.reduce((sum, t) => sum + t.count, 0);
    console.log(`\n▶ ${category}`);
    console.log(`   테이블 수: ${tables.length}개 | 총 데이터: ${totalRecords}개`);
    tables.forEach(t => {
      console.log(`     - ${t.name.padEnd(40)} : ${t.count.toString().padStart(6)}개`);
    });
  });

  console.log('\n\n✅ 분석 완료!\n');
}

analyzeAllTables().catch(console.error);
