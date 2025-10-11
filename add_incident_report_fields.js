const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addIncidentReportFields() {
  console.log('🚀 보안사고관리 사고보고 필드 추가 시작...');

  const alterTableQuery = `
    ALTER TABLE security_accident_data
    ADD COLUMN IF NOT EXISTS discovery_datetime TIMESTAMP,
    ADD COLUMN IF NOT EXISTS discovery_method TEXT,
    ADD COLUMN IF NOT EXISTS report_datetime TIMESTAMP,
    ADD COLUMN IF NOT EXISTS reporter TEXT,
    ADD COLUMN IF NOT EXISTS report_method TEXT,
    ADD COLUMN IF NOT EXISTS incident_target TEXT,
    ADD COLUMN IF NOT EXISTS incident_cause TEXT,
    ADD COLUMN IF NOT EXISTS affected_systems TEXT,
    ADD COLUMN IF NOT EXISTS affected_data TEXT,
    ADD COLUMN IF NOT EXISTS service_impact TEXT,
    ADD COLUMN IF NOT EXISTS business_impact TEXT,
    ADD COLUMN IF NOT EXISTS situation_details TEXT,
    ADD COLUMN IF NOT EXISTS response_method TEXT,
    ADD COLUMN IF NOT EXISTS improvement_executor TEXT,
    ADD COLUMN IF NOT EXISTS expected_completion_date DATE,
    ADD COLUMN IF NOT EXISTS improvement_details TEXT,
    ADD COLUMN IF NOT EXISTS completion_approver TEXT,
    ADD COLUMN IF NOT EXISTS resolution_details TEXT;
  `;

  try {
    console.log('📝 ALTER TABLE 쿼리 실행 중...');

    const { data, error } = await supabase.rpc('execute_sql', {
      query: alterTableQuery
    });

    if (error) {
      console.error('🔴 RPC 함수를 사용할 수 없습니다. 직접 SQL 실행을 시도합니다.');

      // RPC가 없는 경우 직접 쿼리 실행 (PostgreSQL 클라이언트 사용)
      const { Pool } = require('pg');

      // 환경변수에서 PostgreSQL 연결 정보 추출
      const connectionString = supabaseUrl.replace('https://', 'postgresql://postgres:') +
                               '[PASSWORD]@db.' +
                               supabaseUrl.split('//')[1] +
                               ':5432/postgres';

      console.log('⚠️ PostgreSQL 직접 연결을 위해서는 데이터베이스 비밀번호가 필요합니다.');
      console.log('💡 Supabase 대시보드에서 SQL Editor를 사용하여 다음 쿼리를 실행하세요:');
      console.log('\n' + alterTableQuery);

      return;
    }

    console.log('✅ 사고보고 필드가 성공적으로 추가되었습니다!');

    // 테이블 구조 확인
    const { data: tableInfo, error: infoError } = await supabase
      .from('security_accident_data')
      .select('*')
      .limit(1);

    if (!infoError && tableInfo && tableInfo.length > 0) {
      console.log('\n📋 업데이트된 테이블 구조:');
      console.log(Object.keys(tableInfo[0]).sort());
    }

  } catch (error) {
    console.error('🔴 오류 발생:', error);
    console.log('\n💡 수동으로 다음 SQL을 실행하세요:');
    console.log(alterTableQuery);
  }
}

// 스크립트 실행
if (require.main === module) {
  addIncidentReportFields()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('🔴 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { addIncidentReportFields };