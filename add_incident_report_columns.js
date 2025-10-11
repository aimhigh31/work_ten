const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DB 연결 정보
const connectionString = 'postgresql://postgres.qwcmhgubahmgalvdyrih:ekdnslekdnsltm3!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addIncidentReportColumns() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 사고보고 관련 컬럼들 추가
    const columns = [
      // Step 1 - 사고탐지
      { name: 'discovery_datetime', type: 'timestamp' },
      { name: 'discoverer', type: 'text' },
      { name: 'discovery_method', type: 'text' },
      { name: 'report_datetime', type: 'timestamp' },
      { name: 'reporter', type: 'text' },
      { name: 'report_method', type: 'text' },

      // Step 2 - 현황분석
      { name: 'incident_target', type: 'text' },
      { name: 'incident_cause', type: 'text' },
      { name: 'affected_systems', type: 'text' },
      { name: 'affected_data', type: 'text' },
      { name: 'service_impact', type: 'text' },
      { name: 'business_impact', type: 'text' },
      { name: 'situation_details', type: 'text' },

      // Step 3 - 개선조치중
      { name: 'response_method', type: 'text' },
      { name: 'improvement_executor', type: 'text' },
      { name: 'expected_completion_date', type: 'date' },
      { name: 'improvement_details', type: 'text' },

      // Step 4 - 즉시해결
      { name: 'completed_date', type: 'date' },
      { name: 'completion_approver', type: 'text' },
      { name: 'resolution_details', type: 'text' },

      // Step 5 - 근본개선
      { name: 'prevention_plan', type: 'text' }
    ];

    // 각 컬럼 추가 (이미 존재하는 경우 무시)
    for (const column of columns) {
      try {
        await client.query(`
          ALTER TABLE security_accident_data
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`✅ 컬럼 추가/확인: ${column.name} (${column.type})`);
      } catch (err) {
        console.error(`❌ 컬럼 추가 실패 ${column.name}:`, err.message);
      }
    }

    // 현재 테이블 구조 확인
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'security_accident_data'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 현재 테이블 구조:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ 모든 작업 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
addIncidentReportColumns();